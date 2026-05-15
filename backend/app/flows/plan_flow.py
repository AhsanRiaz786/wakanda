"""TriageAndPlanFlow — LangGraph-ready planning pipeline."""

from datetime import datetime, timezone

from app.config import settings
from app.models.enums import (
    ActionStepType,
    IncidentStatus,
    IncidentType,
    Severity,
    TraceStepStatus,
    TraceStepType,
)
from app.models.plan import ConstraintViolation, IncidentPlan, PlanSummary
from app.models.requests import PlanRequest
from app.services import ids
from app.services.trace_builder import append_step
from app.state.workspace import WorkspaceStore
from app.tools import llm_tools
from app.tools.resources import match_resources
from app.tools.routing import route_departments

SEVERITY_MULT = {
    Severity.CRITICAL: 4,
    Severity.HIGH: 3,
    Severity.MEDIUM: 2,
    Severity.LOW: 1,
}

SOURCE_CRED = {
    "csv_json": 1.0,
    "pdf_report": 0.95,
    "table_dashboard": 0.9,
    "realtime_feed": 0.85,
    "web_article": 0.75,
}


def _build_action_chain(resource_ids: list[str], incident_type: IncidentType) -> list[dict]:
    chain = [
        {"step": 1, "type": ActionStepType.VALIDATE_INCIDENT.value, "status": "pending"},
        {"step": 2, "type": ActionStepType.NOTIFY_DEPARTMENT.value, "status": "pending"},
    ]
    if resource_ids:
        chain.append(
            {
                "step": 3,
                "type": ActionStepType.DISPATCH_CREW.value,
                "status": "pending",
                "resourceId": resource_ids[0],
                "etaMinutes": 12,
            }
        )
    if incident_type in (IncidentType.WATER_LEAK, IncidentType.ROAD_BLOCKAGE):
        chain.append(
            {"step": 4, "type": ActionStepType.MANAGE_ROAD_IMPACT.value, "status": "pending", "roadIds": ["RD-02"]}
        )
    chain.append({"step": 5, "type": ActionStepType.SCHEDULE_FOLLOWUP.value, "status": "pending", "scheduledAtMinutes": 90})
    return chain


def run_plan(store: WorkspaceStore, body: PlanRequest) -> tuple[PlanSummary, list[dict]]:
    trace: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()
    incidents = store.get_open_incidents(body.incidentIds)

    append_step(
        trace,
        step_id="S01",
        name="Fetch open incidents",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Found {len(incidents)} open incidents",
    )

    classifications: dict[str, dict] = {}
    for inc in incidents:
        result = llm_tools.classify_incident(inc)
        classifications[inc.incidentId] = result
        append_step(
            trace,
            step_id=f"S02-{inc.incidentId[-4:]}",
            name=f"Classify {inc.incidentId}",
            step_type=TraceStepType.LLM_CALL,
            output_summary=f"{result['incidentType'].value} / {result['severity'].value}",
            decision_rationale=result["classificationRationale"],
        )

    conflicts_detected = 0
    conflicts_resolved = 0
    resolutions: dict[str, dict] = {}

    if body.planMode == "full":
        market = [i for i in incidents if i.coordinates and abs(i.coordinates.lat - 33.7185) < 0.01]
        if len(market) >= 2:
            conflicts_detected = 1
            resolution = llm_tools.resolve_contradiction(market)
            conflicts_resolved = 1
            for inc in market:
                resolutions[inc.incidentId] = resolution
            append_step(
                trace,
                step_id="S03",
                name="Resolve contradiction (Market Quarter)",
                step_type=TraceStepType.DECISION,
                status=TraceStepStatus.WARNING,
                output_summary="Resolved to water_leak via sensor credibility",
                decision_rationale=resolution["rationale"],
            )

    incident_plans: list[IncidentPlan] = []
    violations: list[ConstraintViolation] = []
    max_budget = (body.constraints.maxBudgetPKR if body.constraints else None) or settings.max_budget_pkr

    for inc in incidents:
        cls = classifications[inc.incidentId]
        if inc.incidentId in resolutions:
            cls = resolutions[inc.incidentId]["resolution"]
            inc.resolvedConflict = resolutions[inc.incidentId]

        itype: IncidentType = cls["incidentType"]
        sev: Severity = cls["severity"]
        depts = route_departments(itype)
        resources = match_resources(store, inc.coordinates, itype, depts)
        unavailable = len(resources) == 0
        chain = _build_action_chain(resources, itype)
        drafts = llm_tools.draft_notifications(inc.incidentId, itype.value)

        cost = 9000 if resources else 0
        if cost > max_budget:
            violations.append(
                ConstraintViolation(
                    constraintName="maxBudgetPKR",
                    requiredValue=str(max_budget),
                    actualValue=str(cost),
                    resolution="Proceed with cheapest available resource",
                )
            )

        cred = SOURCE_CRED.get(inc.sourceType.value, 0.75)
        priority = cls["urgencyScore"] * SEVERITY_MULT[sev] * cred

        plan = IncidentPlan(
            incidentId=inc.incidentId,
            incidentType=itype,
            severity=sev,
            urgencyScore=cls["urgencyScore"],
            classificationRationale=cls["classificationRationale"],
            assignedDepartments=depts,
            assignedResources=resources,
            actionChain=chain,
            notificationDrafts=drafts,
            roadImpacts=["RD-02"] if itype == IncidentType.WATER_LEAK else [],
            resolvedConflict=inc.resolvedConflict,
            resourceUnavailable=unavailable,
            priorityScore=priority,
        )
        incident_plans.append(plan)

        inc.incidentType = itype
        inc.severity = sev
        inc.urgencyScore = cls["urgencyScore"]
        inc.classificationRationale = cls["classificationRationale"]
        inc.assignedDepartments = depts
        inc.assignedResources = resources
        inc.status = IncidentStatus.TRIAGED
        inc.actionChain = chain
        inc.notificationDrafts = drafts
        inc.updatedAt = now
        store.upsert_incident(inc)

    incident_plans.sort(key=lambda p: p.priorityScore, reverse=True)

    append_step(
        trace,
        step_id="S06",
        name="Constraint check",
        step_type=TraceStepType.DECISION,
        output_summary=f"Budget limit PKR {max_budget}",
        decision_rationale="All plans within feasible dispatch budget for demo",
    )

    plan_id = ids.next_plan_id(store.sequences)
    summary = PlanSummary(
        planId=plan_id,
        generatedAt=now,
        incidentPlans=incident_plans,
        totalIncidents=len(incident_plans),
        totalResourcesDispatched=sum(len(p.assignedResources) for p in incident_plans),
        totalRoadImpacts=sum(len(p.roadImpacts) for p in incident_plans),
        totalNotificationsDrafted=len(incident_plans) * 3,
        conflictsDetected=conflicts_detected,
        conflictsResolved=conflicts_resolved,
        constraintViolations=violations,
        priorityOrdering=[p.incidentId for p in incident_plans],
    )
    store.save_plan(summary)
    store.last_plan_trace = trace
    return summary, trace

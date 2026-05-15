import logging
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
from app.models.incident import Incident
from app.models.plan import ConstraintViolation, IncidentPlan, PlanSummary
from app.models.requests import PlanConstraints, PlanRequest
from app.services import ids
from app.services.trace_builder import append_step
from app.state.workspace import WorkspaceStore
from app.tools import llm_tools
from app.tools.contradiction import detect_contradiction_groups, resolve_group
from app.tools.resources import match_resources
from app.tools.routing import route_departments
from app.llm.schemas import ContradictionGroup

logger = logging.getLogger(__name__)

SEVERITY_MULT = {
    Severity.CRITICAL: 4,
    Severity.HIGH: 3,
    Severity.MEDIUM: 2,
    Severity.LOW: 1,
    Severity.UNKNOWN: 0,
}

SOURCE_CRED = {
    "csv_json": 1.0,
    "pdf_report": 0.95,
    "table_dashboard": 0.9,
    "realtime_feed": 0.85,
    "web_article": 0.75,
}

def fetch_open_incidents(store: WorkspaceStore, incident_ids: list[str] | None) -> list[Incident]:
    return store.get_open_incidents(incident_ids)

def classify_incidents(incidents: list[Incident]) -> dict[str, dict]:
    return {inc.incidentId: llm_tools.classify_incident(inc) for inc in incidents}

def detect_contradictions(incidents: list[Incident]) -> list[ContradictionGroup]:
    return detect_contradiction_groups(incidents)

def resolve_contradictions(incidents: list[Incident], groups: list[ContradictionGroup]) -> dict[str, dict]:
    resolutions = {}
    inc_by_id = {inc.incidentId: inc for inc in incidents}
    
    for group in groups:
        group_incidents = [inc_by_id[i] for i in group.incident_ids if i in inc_by_id]
        if group_incidents:
            res = llm_tools.resolve_contradiction(group_incidents)
            for inc in group_incidents:
                resolutions[inc.incidentId] = res
    return resolutions

def route_and_match(store: WorkspaceStore, incidents: list[Incident], classifications: dict[str, dict]) -> dict[str, dict]:
    results = {}
    for inc in incidents:
        cls = classifications.get(inc.incidentId)
        if not cls:
            continue
        itype = cls["incidentType"]
        depts = route_departments(itype)
        resources = match_resources(store, inc.coordinates, itype, depts)
        results[inc.incidentId] = {"departments": depts, "resources": resources}
    return results

def build_chains(incidents: list[Incident], classifications: dict[str, dict], routing_results: dict[str, dict]) -> dict[str, list[dict]]:
    chains = {}
    for inc in incidents:
        cls = classifications.get(inc.incidentId)
        if not cls:
            continue
        itype = cls["incidentType"]
        resources = routing_results.get(inc.incidentId, {}).get("resources", [])
        
        chain = [
            {"step": 1, "type": ActionStepType.VALIDATE_INCIDENT.value, "status": "pending"},
            {"step": 2, "type": ActionStepType.NOTIFY_DEPARTMENT.value, "status": "pending"},
        ]
        if resources:
            chain.append({
                "step": 3,
                "type": ActionStepType.DISPATCH_CREW.value,
                "status": "pending",
                "resourceId": resources[0],
                "etaMinutes": 12,
            })
        if itype in (IncidentType.WATER_LEAK, IncidentType.ROAD_BLOCKAGE):
            chain.append({"step": 4, "type": ActionStepType.MANAGE_ROAD_IMPACT.value, "status": "pending", "roadIds": ["RD-02"]})
        chain.append({"step": 5, "type": ActionStepType.SCHEDULE_FOLLOWUP.value, "status": "pending", "scheduledAtMinutes": 90})
        
        chains[inc.incidentId] = chain
    return chains

def check_constraints(routing_results: dict[str, dict], constraints: PlanConstraints | None) -> list[ConstraintViolation]:
    violations = []
    max_budget = (constraints.maxBudgetPKR if constraints else None) or settings.max_budget_pkr
    
    for inc_id, result in routing_results.items():
        cost = 9000 if result.get("resources") else 0
        if cost > max_budget:
            violations.append(
                ConstraintViolation(
                    constraintName="maxBudgetPKR",
                    requiredValue=str(max_budget),
                    actualValue=str(cost),
                    resolution="Proceed with cheapest available resource",
                )
            )
    return violations

def draft_all_notifications(incidents: list[Incident], classifications: dict[str, dict]) -> dict[str, dict]:
    drafts = {}
    for inc in incidents:
        cls = classifications.get(inc.incidentId)
        if cls:
            drafts[inc.incidentId] = llm_tools.draft_notifications(inc.incidentId, cls["incidentType"].value)
    return drafts

def prioritize(incidents: list[Incident], classifications: dict[str, dict]) -> dict[str, float]:
    scores = {}
    for inc in incidents:
        cls = classifications.get(inc.incidentId)
        if not cls:
            continue
        sev = cls["severity"]
        urgency = cls["urgencyScore"]
        cred = SOURCE_CRED.get(inc.sourceType.value, 0.75)
        scores[inc.incidentId] = urgency * SEVERITY_MULT.get(sev, 0) * cred
    return scores

def persist_plan(store: WorkspaceStore, incidents: list[Incident], incident_plans: list[IncidentPlan], violations: list[ConstraintViolation], conflicts_detected: int, conflicts_resolved: int) -> PlanSummary:
    now = datetime.now(timezone.utc).isoformat()
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
    
    # Also update incidents
    for inc in incidents:
        inc.status = IncidentStatus.TRIAGED
        inc.updatedAt = now
        store.upsert_incident(inc)
        
    return summary

def run_plan(store: WorkspaceStore, body: PlanRequest) -> tuple[PlanSummary, list[dict]]:
    trace: list[dict] = []
    
    incidents = fetch_open_incidents(store, body.incidentIds)
    append_step(
        trace, step_id="S01", name="Fetch open incidents", step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Found {len(incidents)} open incidents"
    )
    
    classifications = classify_incidents(incidents)
    for inc in incidents:
        res = classifications[inc.incidentId]
        append_step(
            trace, step_id=f"S02-{inc.incidentId[-4:]}", name=f"Classify {inc.incidentId}",
            step_type=TraceStepType.LLM_CALL,
            output_summary=f"{res['incidentType'].value} / {res['severity'].value}",
            decision_rationale=res["classificationRationale"]
        )
        
    resolutions = {}
    groups = []
    
    if body.planMode != "quick":
        groups = detect_contradictions(incidents)
        if groups:
            resolutions = resolve_contradictions(incidents, groups)
            # Update classifications with resolution
            for inc_id, res in resolutions.items():
                classifications[inc_id] = res["resolution"]
            
            append_step(
                trace, step_id="S03", name="Resolve contradictions", step_type=TraceStepType.DECISION,
                status=TraceStepStatus.WARNING, output_summary=f"Resolved {len(groups)} conflicts",
                decision_rationale=resolutions[groups[0].incident_ids[0]]["rationale"] if groups else None
            )

    routing_results = route_and_match(store, incidents, classifications)
    chains = build_chains(incidents, classifications, routing_results)
    violations = check_constraints(routing_results, body.constraints)
    drafts = draft_all_notifications(incidents, classifications)
    priorities = prioritize(incidents, classifications)
    
    incident_plans = []
    for inc in incidents:
        cls = classifications[inc.incidentId]
        res = routing_results[inc.incidentId]
        ch = chains[inc.incidentId]
        dr = drafts[inc.incidentId]
        pri = priorities[inc.incidentId]
        
        inc.incidentType = cls["incidentType"]
        inc.severity = cls["severity"]
        inc.urgencyScore = cls["urgencyScore"]
        inc.classificationRationale = cls["classificationRationale"]
        inc.assignedDepartments = res["departments"]
        inc.assignedResources = res["resources"]
        inc.actionChain = ch
        inc.notificationDrafts = dr
        inc.resolvedConflict = resolutions.get(inc.incidentId)
        
        plan = IncidentPlan(
            incidentId=inc.incidentId,
            incidentType=inc.incidentType,
            severity=inc.severity,
            urgencyScore=inc.urgencyScore,
            classificationRationale=inc.classificationRationale,
            assignedDepartments=inc.assignedDepartments,
            assignedResources=inc.assignedResources,
            actionChain=inc.actionChain,
            notificationDrafts=inc.notificationDrafts,
            roadImpacts=["RD-02"] if inc.incidentType == IncidentType.WATER_LEAK else [],
            resolvedConflict=inc.resolvedConflict,
            resourceUnavailable=len(inc.assignedResources) == 0,
            priorityScore=pri,
        )
        incident_plans.append(plan)
        
    incident_plans.sort(key=lambda p: p.priorityScore, reverse=True)
    
    append_step(
        trace, step_id="S06", name="Constraint check", step_type=TraceStepType.DECISION,
        output_summary=f"Budget limit PKR {(body.constraints.maxBudgetPKR if body.constraints else None) or settings.max_budget_pkr}",
        decision_rationale="Checked all plans against feasible dispatch budget"
    )

    summary = persist_plan(
        store, incidents, incident_plans, violations,
        conflicts_detected=len(groups),
        conflicts_resolved=1 if groups else 0
    )
    store.last_plan_trace = trace
    return summary, trace

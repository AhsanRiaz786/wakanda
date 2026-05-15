"""Static Triage Table — non-agent baseline per plan.md §14."""

from datetime import datetime, timezone

from app.models.enums import IncidentType, Severity
from app.models.plan import IncidentPlan, PlanSummary
from app.services.ids import next_plan_id
from app.state.workspace import WorkspaceStore


def _keyword_type(description: str) -> IncidentType:
    text = description.lower()
    if "water" in text or "flood" in text:
        return IncidentType.WATER_LEAK
    if "power" in text or "electric" in text:
        return IncidentType.POWER_OUTAGE
    if "accident" in text or "crash" in text:
        return IncidentType.ACCIDENT
    if "road" in text or "block" in text:
        return IncidentType.ROAD_BLOCKAGE
    return IncidentType.OTHER


def _dept_for_type(incident_type: IncidentType) -> list[str]:
    mapping = {
        IncidentType.WATER_LEAK: ["DEPT-UTIL"],
        IncidentType.POWER_OUTAGE: ["DEPT-UTIL"],
        IncidentType.ACCIDENT: ["DEPT-EMER"],
        IncidentType.ROAD_BLOCKAGE: ["DEPT-TRAFFIC"],
        IncidentType.OTHER: ["DEPT-GEN"],
    }
    return mapping.get(incident_type, ["DEPT-GEN"])


def run_baseline_plan(store: WorkspaceStore, incident_ids: list[str] | None) -> PlanSummary:
    incidents = store.get_open_incidents(incident_ids)
    now = datetime.now(timezone.utc).isoformat()
    plans: list[IncidentPlan] = []

    for inc in incidents:
        itype = _keyword_type(inc.description)
        plans.append(
            IncidentPlan(
                incidentId=inc.incidentId,
                incidentType=itype,
                severity=Severity.MEDIUM,
                urgencyScore=5,
                classificationRationale=f"Baseline keyword match: {itype.value} → {_dept_for_type(itype)[0]}",
                assignedDepartments=_dept_for_type(itype),
                assignedResources=[],
                actionChain=[
                    {
                        "step": 1,
                        "type": "assign_department",
                        "status": "complete",
                        "note": "Static Triage Table — no multi-step chain",
                    }
                ],
                notificationDrafts={
                    "public": "Incident reported. City operations notified.",
                },
                priorityScore=5.0,
            )
        )

    plan_id = next_plan_id(store.sequences)
    summary = PlanSummary(
        planId=plan_id,
        generatedAt=now,
        incidentPlans=plans,
        totalIncidents=len(plans),
        totalResourcesDispatched=0,
        totalRoadImpacts=0,
        totalNotificationsDrafted=len(plans),
        conflictsDetected=0,
        conflictsResolved=0,
        priorityOrdering=[p.incidentId for p in plans],
    )
    store.save_plan(summary)
    store.last_plan_trace = [
        {
            "stepId": "B01",
            "name": "Baseline: keyword routing",
            "type": "decision",
            "status": "success",
            "durationMs": 5,
            "inputSummary": "Static Triage Table",
            "outputSummary": f"Routed {len(plans)} incidents by keyword",
            "decisionRationale": "Non-agentic baseline for hackathon comparison",
            "children": [],
        }
    ]
    return summary

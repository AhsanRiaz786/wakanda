"""Triage/Plan graph nodes — Eagle Phase 2.

Each node wraps a discrete step from plan_flow and appends a trace entry.
All state keys used across nodes are declared in PlanState.
"""

from typing import Optional
from typing import TypedDict

from app.config import settings
from app.flows import plan_flow
from app.llm.schemas import ContradictionGroup
from app.models.enums import IncidentType, TraceStepStatus, TraceStepType
from app.models.incident import Incident
from app.models.plan import ConstraintViolation, IncidentPlan, PlanSummary
from app.models.requests import PlanRequest
from app.services.trace_builder import append_step
from app.state.workspace import get_store


class PlanState(TypedDict, total=False):
    # Input
    request: PlanRequest
    # Step outputs
    incidents: list                     # list[Incident]
    classifications: dict               # {inc_id: classification_dict}
    contradiction_groups: list          # list[ContradictionGroup]
    resolutions: dict                   # {inc_id: resolved_conflict_dict}
    routing_results: dict               # {inc_id: {"departments": [...], "resources": [...]}}
    chains: dict                        # {inc_id: list[action_step_dict]}
    violations: list                    # list[ConstraintViolation]
    drafts: dict                        # {inc_id: notification_drafts_dict}
    priorities: dict                    # {inc_id: float}
    incident_plans: list                # list[IncidentPlan]
    plan_summary: Optional[PlanSummary]
    trace_steps: list


# ---------------------------------------------------------------------------
# Node: fetch_open_incidents  →  S01
# ---------------------------------------------------------------------------

def fetch_open_incidents(state: PlanState) -> PlanState:
    store = get_store()
    trace: list = list(state.get("trace_steps") or [])
    incidents = plan_flow.fetch_open_incidents(store, state["request"].incidentIds)

    append_step(
        trace,
        step_id="S01",
        name="Fetch open incidents",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Found {len(incidents)} open incidents",
    )
    return {"incidents": incidents, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: classify_incidents  →  S02-*
# ---------------------------------------------------------------------------

def classify_incidents(state: PlanState) -> PlanState:
    trace: list = list(state.get("trace_steps") or [])
    incidents: list[Incident] = state.get("incidents") or []
    classifications = plan_flow.classify_incidents(incidents)

    for inc in incidents:
        res = classifications.get(inc.incidentId)
        if res:
            append_step(
                trace,
                step_id=f"S02-{inc.incidentId[-4:]}",
                name=f"Classify {inc.incidentId}",
                step_type=TraceStepType.LLM_CALL,
                output_summary=f"{res['incidentType'].value} / {res['severity'].value}",
                decision_rationale=res.get("classificationRationale"),
            )

    return {"classifications": classifications, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: detect_contradictions  →  (no trace — decision recorded in resolver)
# ---------------------------------------------------------------------------

def detect_contradictions(state: PlanState) -> PlanState:
    incidents: list[Incident] = state.get("incidents") or []
    groups: list[ContradictionGroup] = plan_flow.detect_contradictions(incidents)
    trace: list = list(state.get("trace_steps") or [])

    if groups:
        append_step(
            trace,
            step_id="S03-detect",
            name="Detect contradictions",
            step_type=TraceStepType.DECISION,
            output_summary=f"Found {len(groups)} contradiction group(s)",
        )
    else:
        append_step(
            trace,
            step_id="S03-detect",
            name="Detect contradictions",
            step_type=TraceStepType.DECISION,
            output_summary="No contradictions detected",
        )

    return {"contradiction_groups": groups, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: resolve_contradictions  →  S03-resolve
# ---------------------------------------------------------------------------

def resolve_contradictions(state: PlanState) -> PlanState:
    incidents: list[Incident] = state.get("incidents") or []
    groups: list[ContradictionGroup] = state.get("contradiction_groups") or []
    trace: list = list(state.get("trace_steps") or [])

    # Get raw resolutions from plan_flow (returns legacy dicts via llm_tools)
    resolutions = plan_flow.resolve_contradictions(incidents, groups)

    # Update classifications for resolved incidents.
    # resolve_contradiction returns a ResolvedConflict.to_legacy_dict() shape:
    # {"conflictType", "resolution", "confidence", "lowConfidenceResolution", "rationale", "mergedIncidentIds"}
    # The "resolution" field contains the winning incident's classification dict.
    # We need to replace the classification for affected incidents.
    classifications: dict = dict(state.get("classifications") or {})
    for inc_id, res_dict in resolutions.items():
        inner_resolution = res_dict.get("resolution")
        if inner_resolution and isinstance(inner_resolution, dict):
            # inner_resolution is a classification dict — update if it has incidentType
            if "incidentType" in inner_resolution:
                classifications[inc_id] = inner_resolution

    rationale = None
    if resolutions:
        first = next(iter(resolutions.values()))
        rationale = first.get("rationale")

    append_step(
        trace,
        step_id="S03-resolve",
        name="Resolve contradictions",
        step_type=TraceStepType.DECISION,
        status=TraceStepStatus.WARNING,
        output_summary=f"Resolved {len(groups)} conflict(s)",
        decision_rationale=rationale,
    )

    return {"resolutions": resolutions, "classifications": classifications, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: route_and_match  →  S04
# ---------------------------------------------------------------------------

def route_and_match(state: PlanState) -> PlanState:
    store = get_store()
    incidents: list[Incident] = state.get("incidents") or []
    classifications: dict = state.get("classifications") or {}
    trace: list = list(state.get("trace_steps") or [])

    routing_results = plan_flow.route_and_match(store, incidents, classifications)

    append_step(
        trace,
        step_id="S04",
        name="Route and match resources",
        step_type=TraceStepType.TOOL_CALL,
        output_summary=f"Matched resources for {len(routing_results)} incidents",
    )
    return {"routing_results": routing_results, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: build_chains  →  S05
# ---------------------------------------------------------------------------

def build_chains(state: PlanState) -> PlanState:
    incidents: list[Incident] = state.get("incidents") or []
    classifications: dict = state.get("classifications") or {}
    routing_results: dict = state.get("routing_results") or {}
    trace: list = list(state.get("trace_steps") or [])

    chains = plan_flow.build_chains(incidents, classifications, routing_results)

    append_step(
        trace,
        step_id="S05",
        name="Build action chains",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Generated {len(chains)} action chain(s)",
    )
    return {"chains": chains, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: check_constraints  →  S06
# ---------------------------------------------------------------------------

def check_constraints(state: PlanState) -> PlanState:
    routing_results: dict = state.get("routing_results") or {}
    constraints = state["request"].constraints
    trace: list = list(state.get("trace_steps") or [])

    violations = plan_flow.check_constraints(routing_results, constraints)
    max_budget = (constraints.maxBudgetPKR if constraints else None) or settings.max_budget_pkr

    append_step(
        trace,
        step_id="S06",
        name="Constraint check",
        step_type=TraceStepType.DECISION,
        output_summary=f"Budget limit PKR {max_budget} — {len(violations)} violation(s)",
        decision_rationale="Checked all plans against feasible dispatch budget",
    )
    return {"violations": violations, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: draft_notifications  →  S07
# ---------------------------------------------------------------------------

def draft_notifications(state: PlanState) -> PlanState:
    incidents: list[Incident] = state.get("incidents") or []
    classifications: dict = state.get("classifications") or {}
    trace: list = list(state.get("trace_steps") or [])

    drafts = plan_flow.draft_all_notifications(incidents, classifications)

    append_step(
        trace,
        step_id="S07",
        name="Draft notifications",
        step_type=TraceStepType.LLM_CALL,
        output_summary=f"Drafted notifications for {len(drafts)} incident(s)",
    )
    return {"drafts": drafts, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: prioritize  →  S08
# ---------------------------------------------------------------------------

def prioritize(state: PlanState) -> PlanState:
    incidents: list[Incident] = state.get("incidents") or []
    classifications: dict = state.get("classifications") or {}
    trace: list = list(state.get("trace_steps") or [])

    priorities = plan_flow.prioritize(incidents, classifications)

    append_step(
        trace,
        step_id="S08",
        name="Prioritize plans",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary="Calculated priority scores (urgency × severity × credibility)",
    )
    return {"priorities": priorities, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: persist_plan  →  S09
# ---------------------------------------------------------------------------

def persist_plan(state: PlanState) -> PlanState:
    store = get_store()
    incidents: list[Incident] = state.get("incidents") or []
    classifications: dict = state.get("classifications") or {}
    routing_results: dict = state.get("routing_results") or {}
    chains: dict = state.get("chains") or {}
    drafts: dict = state.get("drafts") or {}
    priorities: dict = state.get("priorities") or {}
    violations: list = state.get("violations") or []
    resolutions: dict = state.get("resolutions") or {}
    groups: list = state.get("contradiction_groups") or []
    trace: list = list(state.get("trace_steps") or [])

    incident_plans: list[IncidentPlan] = []
    for inc in incidents:
        cls = classifications.get(inc.incidentId)
        if not cls:
            continue

        res = routing_results.get(inc.incidentId, {})
        ch = chains.get(inc.incidentId, [])
        dr = drafts.get(inc.incidentId, {})
        pri = priorities.get(inc.incidentId, 0.0)
        conflict = resolutions.get(inc.incidentId)

        # Mutate incident fields before persisting
        inc.incidentType = cls["incidentType"]
        inc.severity = cls["severity"]
        inc.urgencyScore = cls.get("urgencyScore", 5)
        inc.classificationRationale = cls.get("classificationRationale", "")
        inc.assignedDepartments = res.get("departments", [])
        inc.assignedResources = res.get("resources", [])
        inc.actionChain = ch
        inc.notificationDrafts = dr
        inc.resolvedConflict = conflict  # full legacy dict or None

        ip = IncidentPlan(
            incidentId=inc.incidentId,
            incidentType=inc.incidentType,
            severity=inc.severity,
            urgencyScore=inc.urgencyScore or 5,
            classificationRationale=inc.classificationRationale or "",
            assignedDepartments=inc.assignedDepartments,
            assignedResources=inc.assignedResources,
            actionChain=inc.actionChain,
            notificationDrafts=inc.notificationDrafts,
            roadImpacts=["RD-02"] if inc.incidentType == IncidentType.WATER_LEAK else [],
            resolvedConflict=conflict,
            resourceUnavailable=len(inc.assignedResources) == 0,
            priorityScore=pri,
        )
        incident_plans.append(ip)

    incident_plans.sort(key=lambda p: p.priorityScore, reverse=True)

    summary = plan_flow.persist_plan(
        store,
        incidents,
        incident_plans,
        violations,
        conflicts_detected=len(groups),
        conflicts_resolved=1 if groups else 0,
    )

    store.last_plan_trace = trace

    append_step(
        trace,
        step_id="S09",
        name="Persist plan",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Saved plan {summary.planId} with {len(incident_plans)} incident plan(s)",
    )
    return {"plan_summary": summary, "trace_steps": trace}

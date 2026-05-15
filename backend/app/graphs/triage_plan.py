"""Triage/Plan LangGraph — Eagle Phase 2.

Chain:
  START → fetch → classify → detect_conflicts
        → [has_contradictions?] resolve_conflicts → route_match
        → build_chains → check_constraints → draft_notifications
        → prioritize → persist → END

planMode=quick skips detect_conflicts and resolve_conflicts entirely.
"""

from langgraph.graph import END, StateGraph

from app.nodes.triage_nodes import (
    PlanState,
    build_chains,
    check_constraints,
    classify_incidents,
    detect_contradictions,
    draft_notifications,
    fetch_open_incidents,
    persist_plan,
    prioritize,
    resolve_contradictions,
    route_and_match,
)


def _contradiction_router(state: PlanState) -> str:
    """Route after detect_contradictions.
    - 'quick' mode skips resolution entirely.
    - Groups found → resolve.
    - No groups → skip straight to route_match.
    """
    if state["request"].planMode == "quick":
        return "skip"
    if state.get("contradiction_groups"):
        return "resolve"
    return "skip"


def build_graph():
    workflow = StateGraph(PlanState)

    workflow.add_node("fetch", fetch_open_incidents)
    workflow.add_node("classify", classify_incidents)
    workflow.add_node("detect_conflicts", detect_contradictions)
    workflow.add_node("resolve_conflicts", resolve_contradictions)
    workflow.add_node("route_match", route_and_match)
    workflow.add_node("build_chains", build_chains)
    workflow.add_node("check_constraints", check_constraints)
    workflow.add_node("draft_notifications", draft_notifications)
    workflow.add_node("prioritize", prioritize)
    workflow.add_node("persist", persist_plan)

    workflow.set_entry_point("fetch")
    workflow.add_edge("fetch", "classify")

    # planMode=quick bypasses contradiction detection entirely
    def _after_classify(state: PlanState) -> str:
        return "skip_detect" if state["request"].planMode == "quick" else "detect"

    workflow.add_conditional_edges(
        "classify",
        _after_classify,
        {"detect": "detect_conflicts", "skip_detect": "route_match"},
    )

    workflow.add_conditional_edges(
        "detect_conflicts",
        _contradiction_router,
        {"resolve": "resolve_conflicts", "skip": "route_match"},
    )

    workflow.add_edge("resolve_conflicts", "route_match")
    workflow.add_edge("route_match", "build_chains")
    workflow.add_edge("build_chains", "check_constraints")
    workflow.add_edge("check_constraints", "draft_notifications")
    workflow.add_edge("draft_notifications", "prioritize")
    workflow.add_edge("prioritize", "persist")
    workflow.add_edge("persist", END)

    return workflow.compile()

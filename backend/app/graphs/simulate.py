"""Simulate LangGraph — Eagle Phase 2.

Chain:
  START → load → [error?] END
               → capture_before → execute → [forceApiFailure?] inject_failure
               → capture_after → metrics → frames → persist → END
"""

from langgraph.graph import END, StateGraph

from app.nodes.simulate_nodes import (
    SimulateState,
    build_frames,
    capture_after,
    capture_before,
    compute_metrics,
    execute_chains,
    inject_failure,
    load_plan,
    persist_sim,
)


def _load_error_router(state: SimulateState) -> str:
    return "end" if state.get("error") else "continue"


def _failure_router(state: SimulateState) -> str:
    overrides = state["request"].overrides
    return "fail" if (overrides and overrides.forceApiFailure) else "continue"


def build_graph():
    workflow = StateGraph(SimulateState)

    workflow.add_node("load", load_plan)
    workflow.add_node("capture_before", capture_before)
    workflow.add_node("execute", execute_chains)
    workflow.add_node("inject_failure", inject_failure)
    workflow.add_node("capture_after", capture_after)
    workflow.add_node("metrics", compute_metrics)
    workflow.add_node("frames", build_frames)
    workflow.add_node("persist", persist_sim)

    workflow.set_entry_point("load")

    # If plan not found → short-circuit
    workflow.add_conditional_edges(
        "load",
        _load_error_router,
        {"end": END, "continue": "capture_before"},
    )

    workflow.add_edge("capture_before", "execute")

    # After execute, optionally inject failure
    workflow.add_conditional_edges(
        "execute",
        _failure_router,
        {"fail": "inject_failure", "continue": "capture_after"},
    )

    workflow.add_edge("inject_failure", "capture_after")
    workflow.add_edge("capture_after", "metrics")
    workflow.add_edge("metrics", "frames")
    workflow.add_edge("frames", "persist")
    workflow.add_edge("persist", END)

    return workflow.compile()

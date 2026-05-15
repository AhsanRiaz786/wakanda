"""Ingest LangGraph — Eagle Phase 2.

Chain: START → validate → normalize_ts → normalize_loc → sanitize → assign_id → persist → END
Conditional: validate failure short-circuits directly to END.
"""

from langgraph.graph import END, StateGraph

from app.nodes.ingest_nodes import (
    IngestState,
    assign_incident_id,
    normalize_location,
    normalize_timestamp,
    persist_incident,
    sanitize_description,
    validate_input,
)


def _has_error(state: IngestState) -> str:
    return "end" if state.get("error") else "continue"


def build_graph():
    workflow = StateGraph(IngestState)

    workflow.add_node("validate", validate_input)
    workflow.add_node("normalize_ts", normalize_timestamp)
    workflow.add_node("normalize_loc", normalize_location)
    workflow.add_node("sanitize", sanitize_description)
    workflow.add_node("assign_id", assign_incident_id)
    workflow.add_node("persist", persist_incident)

    workflow.set_entry_point("validate")

    # If validation fails → END immediately
    workflow.add_conditional_edges(
        "validate",
        _has_error,
        {"end": END, "continue": "normalize_ts"},
    )

    workflow.add_edge("normalize_ts", "normalize_loc")
    workflow.add_edge("normalize_loc", "sanitize")
    workflow.add_edge("sanitize", "assign_id")
    workflow.add_edge("assign_id", "persist")
    workflow.add_edge("persist", END)

    return workflow.compile()

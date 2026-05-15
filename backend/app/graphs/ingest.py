from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.flows.ingest_flow import run_ingest
from app.models.requests import IngestRequest
from app.state.workspace import get_store


class IngestState(TypedDict, total=False):
    request: IngestRequest
    incident: Any
    trace_steps: list[dict]
    error: dict | None


def _ingest_node(state: IngestState) -> IngestState:
    incident, trace, error, _ = run_ingest(get_store(), state["request"])
    return {"incident": incident, "trace_steps": trace, "error": error}


def build_graph():
    graph = StateGraph(IngestState)
    graph.add_node("ingest", _ingest_node)
    graph.set_entry_point("ingest")
    graph.add_edge("ingest", END)
    return graph.compile()

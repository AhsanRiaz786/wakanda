from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.flows.plan_flow import run_plan
from app.models.requests import PlanRequest
from app.state.workspace import get_store


class PlanState(TypedDict, total=False):
    request: PlanRequest
    plan_summary: Any
    trace_steps: list[dict]


def _plan_node(state: PlanState) -> PlanState:
    summary, trace = run_plan(get_store(), state["request"])
    return {"plan_summary": summary, "trace_steps": trace}


def build_graph():
    graph = StateGraph(PlanState)
    graph.add_node("triage_plan", _plan_node)
    graph.set_entry_point("triage_plan")
    graph.add_edge("triage_plan", END)
    return graph.compile()

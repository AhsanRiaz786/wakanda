from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.flows.simulate_flow import run_simulate
from app.models.requests import SimulateRequest
from app.state.workspace import get_store


class SimulateState(TypedDict, total=False):
    request: SimulateRequest
    simulation_run: Any
    trace_steps: list[dict]


def _simulate_node(state: SimulateState) -> SimulateState:
    run, trace = run_simulate(get_store(), state["request"])
    return {"simulation_run": run, "trace_steps": trace}


def build_graph():
    graph = StateGraph(SimulateState)
    graph.add_node("simulate", _simulate_node)
    graph.set_entry_point("simulate")
    graph.add_edge("simulate", END)
    return graph.compile()

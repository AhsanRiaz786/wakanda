"""Simulate graph nodes — Eagle Phase 2.

Each node wraps a discrete step from simulate_flow and appends a trace entry.
All state keys used across nodes are declared in SimulateState.
"""

from datetime import datetime, timezone
from typing import Optional, TypedDict

from app.flows import simulate_flow
from app.models.enums import TraceStepStatus, TraceStepType
from app.models.plan import PlanSummary
from app.models.requests import SimulateRequest
from app.models.simulation import CityState, SimulationRun
from app.services.trace_builder import append_step
from app.state.workspace import get_store


class SimulateState(TypedDict, total=False):
    # Input
    request: SimulateRequest
    # Intermediate values
    plan: Optional[PlanSummary]
    before_state: Optional[CityState]
    after_state: Optional[CityState]
    actions: list  # list[SimulatedAction]
    failures: list  # list[FailureRecord]
    metrics: dict
    frames: list
    started_at: Optional[str]
    # Final output
    simulation_run: Optional[SimulationRun]
    error: Optional[str]
    trace_steps: list


# ---------------------------------------------------------------------------
# Node: load_plan  →  SIM01
# ---------------------------------------------------------------------------


def load_plan(state: SimulateState) -> SimulateState:
    store = get_store()
    trace: list = list(state.get("trace_steps") or [])
    started = datetime.now(timezone.utc).isoformat()

    try:
        plan = simulate_flow.load_plan(store, state["request"].planId)
        append_step(
            trace,
            step_id="SIM01",
            name="Load plan",
            step_type=TraceStepType.STATE_UPDATE,
            output_summary=f"Loaded plan {state['request'].planId} with {len(plan.incidentPlans)} incident plan(s)",
        )
        return {"plan": plan, "trace_steps": trace, "started_at": started}
    except ValueError as e:
        append_step(
            trace,
            step_id="SIM01",
            name="Load plan",
            step_type=TraceStepType.ERROR,
            status=TraceStepStatus.FAILURE,
            output_summary=f"Plan not found: {e}",
        )
        return {"error": str(e), "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: capture_before  →  SIM02
# ---------------------------------------------------------------------------


def capture_before(state: SimulateState) -> SimulateState:
    store = get_store()
    before = simulate_flow.capture_before_state(store)
    return {"before_state": before}


# ---------------------------------------------------------------------------
# Node: execute_chains  →  SIM03
# ---------------------------------------------------------------------------


def execute_chains(state: SimulateState) -> SimulateState:
    store = get_store()
    plan: PlanSummary = state["plan"]
    trace: list = list(state.get("trace_steps") or [])

    actions = simulate_flow.execute_action_chains(store, plan)

    append_step(
        trace,
        step_id="SIM03",
        name="Execute action chains",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Executed {len(actions)} action step(s)",
    )
    return {"actions": actions, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: inject_failure  →  SIM-FAIL
# ---------------------------------------------------------------------------


def inject_failure(state: SimulateState) -> SimulateState:
    plan: PlanSummary = state["plan"]
    force_fail = state["request"].overrides.forceApiFailure if state["request"].overrides else False
    trace: list = list(state.get("trace_steps") or [])

    failures = simulate_flow.inject_failure_and_retry(plan, force_fail)

    if failures:
        append_step(
            trace,
            step_id="SIM-FAIL",
            name="Simulated API failure",
            step_type=TraceStepType.ERROR,
            status=TraceStepStatus.WARNING,
            output_summary=f"NOTIFICATION_API_TIMEOUT — recovered via retry ({len(failures)} failure(s))",
        )
    return {"failures": failures, "trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: capture_after  →  SIM04
# ---------------------------------------------------------------------------


def capture_after(state: SimulateState) -> SimulateState:
    store = get_store()
    after = simulate_flow.capture_after_state(store)
    return {"after_state": after}


# ---------------------------------------------------------------------------
# Node: compute_metrics  →  SIM05
# ---------------------------------------------------------------------------


def compute_metrics(state: SimulateState) -> SimulateState:
    before: CityState = state["before_state"]
    after: CityState = state["after_state"]
    plan: PlanSummary = state["plan"]
    metrics = simulate_flow.compute_metrics(before, after, plan)
    return {"metrics": metrics}


# ---------------------------------------------------------------------------
# Node: build_frames  →  SIM06
# ---------------------------------------------------------------------------


def build_frames(state: SimulateState) -> SimulateState:
    before: CityState = state["before_state"]
    after: CityState = state["after_state"]
    actions: list = state.get("actions") or []
    speed: str = state["request"].simulationSpeed
    frames = simulate_flow.build_animation_frames(before, after, actions, speed)

    return {"frames": frames}


# ---------------------------------------------------------------------------
# Node: persist_sim  →  SIM07
# ---------------------------------------------------------------------------


def persist_sim(state: SimulateState) -> SimulateState:
    store = get_store()
    trace: list = list(state.get("trace_steps") or [])

    plan_id = state["request"].planId
    started_at: str = state.get("started_at") or datetime.now(timezone.utc).isoformat()
    before: CityState = state["before_state"]
    after: CityState = state["after_state"]
    actions: list = state.get("actions") or []
    failures: list = state.get("failures") or []
    metrics: dict = state.get("metrics") or {}
    frames: list = state.get("frames") or []

    run = simulate_flow.persist_simulation(
        store, plan_id, started_at, before, after, actions, failures, metrics, frames
    )

    store.last_sim_trace = trace

    append_step(
        trace,
        step_id="SIM07",
        name="Persist simulation run",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Saved run {run.runId} with {len(frames)} animation frame(s)",
    )
    return {"simulation_run": run, "trace_steps": trace}

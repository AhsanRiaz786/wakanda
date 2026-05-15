from datetime import datetime, timezone
from typing import Literal

from app.models.trace import AgentTrace
from app.services import ids
from app.services.trace_builder import build_agent_trace, filter_trace_steps
from app.state.workspace import WorkspaceStore


def run_trace(
    store: WorkspaceStore,
    plan_id: str | None,
    include_sim: bool,
    depth: Literal["summary", "full"] = "full",
) -> AgentTrace:
    if not plan_id or plan_id == "latest":
        plan_id = max(store.plans.keys()) if store.plans else ""
    plan = store.get_plan(plan_id)
    steps = list(store.last_plan_trace)
    conflicts = plan.conflictsDetected if plan else 0
    if include_sim:
        steps.extend(store.last_sim_trace)

    filtered_steps = filter_trace_steps(steps, depth)

    return build_agent_trace(
        trace_id=ids.next_trace_id(store.sequences),
        plan_id=plan_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        steps=filtered_steps,
        conflicts_detected=conflicts,
    )

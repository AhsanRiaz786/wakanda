from datetime import datetime, timezone

from app.models.trace import AgentTrace
from app.services import ids
from app.services.trace_builder import build_agent_trace
from app.state.workspace import WorkspaceStore


def run_trace(store: WorkspaceStore, plan_id: str | None, include_sim: bool) -> AgentTrace:
    if not plan_id or plan_id == "latest":
        plan_id = max(store.plans.keys()) if store.plans else ""
    plan = store.get_plan(plan_id)
    steps = list(store.last_plan_trace)
    conflicts = plan.conflictsDetected if plan else 0
    if include_sim:
        steps.extend(store.last_sim_trace)
    return build_agent_trace(
        trace_id=ids.next_trace_id(store.sequences),
        plan_id=plan_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        steps=steps,
        conflicts_detected=conflicts,
    )

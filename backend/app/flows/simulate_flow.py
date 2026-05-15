from copy import deepcopy
from datetime import datetime, timezone

from app.models.enums import IncidentStatus, IncidentType, TraceStepStatus, TraceStepType
from app.models.plan import PlanSummary
from app.models.requests import SimulateRequest
from app.models.simulation import FailureRecord, SimulatedAction, SimulationRun, CityState
from app.services import ids
from app.services.trace_builder import append_step
from app.state.workspace import WorkspaceStore


def load_plan(store: WorkspaceStore, plan_id: str) -> PlanSummary:
    plan = store.get_plan(plan_id)
    if not plan:
        raise ValueError(f"Plan {plan_id} not found")
    return plan


def capture_before_state(store: WorkspaceStore) -> CityState:
    return store.snapshot_city_state()


def execute_action_chains(store: WorkspaceStore, plan: PlanSummary) -> list[SimulatedAction]:
    actions = []
    for ip in sorted(plan.incidentPlans, key=lambda p: plan.priorityOrdering.index(p.incidentId)):
        inc = store.get_incident(ip.incidentId)
        if not inc:
            continue
        for step in ip.actionChain:
            step_type = step.get("type", "unknown")
            if step_type == "validate_incident":
                inc.status = IncidentStatus.TRIAGED
            elif step_type == "dispatch_crew":
                inc.status = IncidentStatus.ASSIGNED
                rid = step.get("resourceId")
                for res in store.resources:
                    if res["resourceId"] == rid:
                        res["status"] = "assigned"
            elif step_type == "manage_road_impact":
                for road in store.road_segments:
                    if road["roadId"] in step.get("roadIds", ["RD-02"]):
                        road["status"] = (
                            "closed"
                            if ip.incidentType == IncidentType.ROAD_BLOCKAGE
                            else "restricted"
                        )
            inc.status = (
                IncidentStatus.IN_PROGRESS if inc.status == IncidentStatus.ASSIGNED else inc.status
            )
            store.upsert_incident(inc)

            actions.append(
                SimulatedAction(
                    stepId=f"{ip.incidentId}-{step_type}",
                    incidentId=ip.incidentId,
                    stepType=step_type,
                    resourceId=step.get("resourceId"),
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    durationSeconds=2,
                )
            )
    return actions


def inject_failure_and_retry(plan: PlanSummary, force_fail: bool) -> list[FailureRecord]:
    failures = []
    if force_fail and plan.incidentPlans:
        ip = plan.incidentPlans[0]
        failures.append(
            FailureRecord(
                stepId=f"STEP-notify-{ip.incidentId}",
                error="NOTIFICATION_API_TIMEOUT",
                retryCount=1,
                fallback="logged_to_operator_queue",
                recovered=True,
            )
        )
    return failures


def capture_after_state(store: WorkspaceStore) -> CityState:
    for inc in store.incidents:
        if inc.status == IncidentStatus.IN_PROGRESS:
            inc.status = IncidentStatus.RESOLVED
            store.upsert_incident(inc)
    return store.snapshot_city_state()


def compute_metrics(before: CityState, after: CityState, plan: PlanSummary) -> dict:
    open_before = sum(1 for i in before.incidents if i.status != IncidentStatus.RESOLVED)
    open_after = sum(1 for i in after.incidents if i.status != IncidentStatus.RESOLVED)
    return {
        "incidentsDelta": {
            "before": open_before,
            "after": open_after,
            "resolved": open_before - open_after,
        },
        "roadsDelta": {"restricted": 1, "closed": 0},
        "crewsDispatched": plan.totalResourcesDispatched,
        "notificationsSent": plan.totalNotificationsDrafted,
        "avgResponseTimeMin": 18.4,
    }


def build_animation_frames(
    before: CityState, after: CityState, actions: list[SimulatedAction], speed: str
) -> list[dict]:
    frame_counts = {"fast": 4, "realtime": 12, "instant": 1}
    count = frame_counts.get(speed, 1)

    # minimal interpolation implementation for now - just duplicate the final state `count` times.
    # eagle/shaka can add full interpolation logic later.
    return [deepcopy(after.model_dump()) for _ in range(count)]


def persist_simulation(
    store: WorkspaceStore,
    plan_id: str,
    started_at: str,
    before: CityState,
    after: CityState,
    actions: list[SimulatedAction],
    failures: list[FailureRecord],
    metrics: dict,
    frames: list[dict],
) -> SimulationRun:
    run = SimulationRun(
        runId=ids.next_sim_id(store.sequences),
        planId=plan_id,
        startedAt=started_at,
        completedAt=datetime.now(timezone.utc).isoformat(),
        beforeState=before,
        afterState=after,
        actions=actions,
        metrics=metrics,
        failuresSimulated=failures,
        animationFrames=frames,
    )
    store.save_simulation(run)
    return run


def run_simulate(store: WorkspaceStore, body: SimulateRequest) -> tuple[SimulationRun, list[dict]]:
    trace: list[dict] = []
    started = datetime.now(timezone.utc).isoformat()

    plan = load_plan(store, body.planId)
    append_step(
        trace,
        step_id="SIM01",
        name="Load plan",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Executing plan {body.planId}",
    )

    before = capture_before_state(store)

    actions = execute_action_chains(store, plan)
    append_step(
        trace,
        step_id="SIM02",
        name="Execute chains",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Executed {len(actions)} actions",
    )

    force_fail = body.overrides.forceApiFailure if body.overrides else False
    failures = inject_failure_and_retry(plan, force_fail)
    if failures:
        append_step(
            trace,
            step_id="SIM-FAIL",
            name="Simulated API failure",
            step_type=TraceStepType.ERROR,
            status=TraceStepStatus.WARNING,
            output_summary="NOTIFICATION_API_TIMEOUT — retried successfully",
        )

    after = capture_after_state(store)
    metrics = compute_metrics(before, after, plan)

    speed = body.simulationSpeed
    frames = build_animation_frames(before, after, actions, speed)

    run = persist_simulation(
        store, body.planId, started, before, after, actions, failures, metrics, frames
    )
    store.last_sim_trace = trace

    return run, trace

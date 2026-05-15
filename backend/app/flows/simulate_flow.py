"""SimulateResponseFlow — applies plan to synthetic city state."""

from copy import deepcopy
from datetime import datetime, timezone

from app.models.enums import IncidentStatus, IncidentType, TraceStepStatus, TraceStepType
from app.models.requests import SimulateRequest
from app.models.simulation import FailureRecord, SimulatedAction, SimulationRun
from app.services import ids
from app.services.trace_builder import append_step
from app.state.workspace import WorkspaceStore


def run_simulate(store: WorkspaceStore, body: SimulateRequest) -> tuple[SimulationRun, list[dict]]:
    trace: list[dict] = []
    started = datetime.now(timezone.utc)
    plan = store.get_plan(body.planId)
    if not plan:
        raise ValueError(f"Plan {body.planId} not found")

    before = store.snapshot_city_state()
    actions: list[SimulatedAction] = []
    failures: list[FailureRecord] = []

    append_step(
        trace,
        step_id="SIM01",
        name="Load plan",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Executing plan {body.planId}",
    )

    force_fail = body.overrides and body.overrides.forceApiFailure
    fail_used = False

    for ip in sorted(plan.incidentPlans, key=lambda p: plan.priorityOrdering.index(p.incidentId)):
        inc = store.get_incident(ip.incidentId)
        if not inc:
            continue
        for step in ip.actionChain:
            step_type = step.get("type", "unknown")
            if step_type == "notify_department" and force_fail and not fail_used:
                fail_used = True
                failures.append(
                    FailureRecord(
                        stepId=f"STEP-notify-{ip.incidentId}",
                        error="NOTIFICATION_API_TIMEOUT",
                        retryCount=1,
                        fallback="logged_to_operator_queue",
                        recovered=True,
                    )
                )
                append_step(
                    trace,
                    step_id="SIM-FAIL",
                    name="Simulated API failure",
                    step_type=TraceStepType.ERROR,
                    status=TraceStepStatus.WARNING,
                    output_summary="NOTIFICATION_API_TIMEOUT — retried successfully",
                )
                continue

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
                            "closed" if ip.incidentType == IncidentType.ROAD_BLOCKAGE else "restricted"
                        )
            inc.status = IncidentStatus.IN_PROGRESS if inc.status == IncidentStatus.ASSIGNED else inc.status
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

    open_before = sum(1 for i in before.incidents if i.status != IncidentStatus.RESOLVED)
    for inc in store.incidents:
        if inc.status == IncidentStatus.IN_PROGRESS:
            inc.status = IncidentStatus.RESOLVED
            store.upsert_incident(inc)

    after = store.snapshot_city_state()
    open_after = sum(1 for i in after.incidents if i.status != IncidentStatus.RESOLVED)

    completed = datetime.now(timezone.utc)
    run = SimulationRun(
        runId=ids.next_sim_id(store.sequences),
        planId=body.planId,
        startedAt=started.isoformat(),
        completedAt=completed.isoformat(),
        beforeState=before,
        afterState=after,
        actions=actions,
        metrics={
            "incidentsDelta": {"before": open_before, "after": open_after, "resolved": open_before - open_after},
            "roadsDelta": {"restricted": 1, "closed": 0},
            "crewsDispatched": plan.totalResourcesDispatched,
            "notificationsSent": plan.totalNotificationsDrafted,
            "avgResponseTimeMin": 18.4,
        },
        failuresSimulated=failures,
        animationFrames=[deepcopy(after.model_dump())],
    )
    store.save_simulation(run)
    store.last_sim_trace = trace
    return run, trace

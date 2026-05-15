"""Tests for the Simulate graph (8-node chain).

Covers: plan loading (valid + invalid), before/after state capture,
action execution, failure injection, metrics computation,
animation frame generation, and full graph execution.
"""

import pytest

from app.flows.plan_flow import run_plan
from app.flows.simulate_flow import (
    load_plan,
    capture_before_state,
    execute_action_chains,
    inject_failure_and_retry,
    capture_after_state,
    compute_metrics,
    build_animation_frames,
    run_simulate,
)
from app.models.enums import IncidentStatus, IncidentType
from app.models.requests import PlanRequest, SimulateRequest, SimulateOverrides


# ═══════════════════════════════════════════════════════════════════
# 1. Load plan
# ═══════════════════════════════════════════════════════════════════


class TestLoadPlan:
    def test_valid_plan_id_loads(self, seeded_store):
        plan_body = PlanRequest(planMode="full")
        plan_summary, _ = run_plan(seeded_store, plan_body)
        loaded = load_plan(seeded_store, plan_summary.planId)
        assert loaded.planId == plan_summary.planId
        assert loaded.totalIncidents == 5

    def test_invalid_plan_id_raises(self, seeded_store):
        with pytest.raises(ValueError, match="not found"):
            load_plan(seeded_store, "PLAN-NONEXISTENT-9999")


# ═══════════════════════════════════════════════════════════════════
# 2. Before state capture
# ═══════════════════════════════════════════════════════════════════


class TestCaptureBeforeState:
    def test_deep_copy_captures_current_state(self, seeded_store):
        before = capture_before_state(seeded_store)
        # Verify it's a deep copy — modifying store doesn't affect before
        original_count = len(before.incidents)
        seeded_store.incidents.clear()
        assert len(before.incidents) == original_count

    def test_before_state_contains_resources(self, seeded_store):
        before = capture_before_state(seeded_store)
        assert len(before.resources) > 0
        assert len(before.roadSegments) > 0


# ═══════════════════════════════════════════════════════════════════
# 3. Action execution
# ═══════════════════════════════════════════════════════════════════


class TestExecuteActionChains:
    def test_validate_then_dispatch(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        actions = execute_action_chains(seeded_store, plan_summary)
        assert len(actions) > 0
        step_types = {a.stepType for a in actions}
        assert "validate_incident" in step_types

    def test_incidents_transition_through_statuses(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        execute_action_chains(seeded_store, plan_summary)
        # After execution, incidents should be beyond REPORTED
        for inc in seeded_store.incidents:
            # They should have progressed to at least TRIAGED or further
            assert inc.status in {
                IncidentStatus.TRIAGED,
                IncidentStatus.ASSIGNED,
                IncidentStatus.IN_PROGRESS,
                IncidentStatus.RESOLVED,
            }


# ═══════════════════════════════════════════════════════════════════
# 4. Road impact
# ═══════════════════════════════════════════════════════════════════


class TestRoadImpact:
    def test_road_status_changes_after_execution(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        before_roads = {r["roadId"]: r["status"] for r in seeded_store.road_segments}
        execute_action_chains(seeded_store, plan_summary)
        after_roads = {r["roadId"]: r["status"] for r in seeded_store.road_segments}
        # At least one road should change status if there are water_leak or road_blockage incidents
        has_water = any(
            p.incidentType == IncidentType.WATER_LEAK for p in plan_summary.incidentPlans
        )
        has_block = any(
            p.incidentType == IncidentType.ROAD_BLOCKAGE for p in plan_summary.incidentPlans
        )
        if has_water or has_block:
            changed = any(before_roads.get(k) != v for k, v in after_roads.items())
            assert changed, "Expected at least one road status change"


# ═══════════════════════════════════════════════════════════════════
# 5. Failure injection
# ═══════════════════════════════════════════════════════════════════


class TestFailureInjection:
    def test_force_api_failure_produces_failure_record(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        failures = inject_failure_and_retry(plan_summary, force_fail=True)
        assert len(failures) >= 1
        f = failures[0]
        assert f.error == "NOTIFICATION_API_TIMEOUT"
        assert f.retryCount == 1
        assert f.recovered is True

    def test_no_failure_when_not_forced(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        failures = inject_failure_and_retry(plan_summary, force_fail=False)
        assert len(failures) == 0


# ═══════════════════════════════════════════════════════════════════
# 6. After state capture
# ═══════════════════════════════════════════════════════════════════


class TestCaptureAfterState:
    def test_in_progress_resolved_after_capture(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        execute_action_chains(seeded_store, plan_summary)
        after = capture_after_state(seeded_store)
        # Incidents that reached IN_PROGRESS should now be RESOLVED.
        # Some incidents without dispatched resources may remain TRIAGED.
        for inc in after.incidents:
            assert inc.status in {
                IncidentStatus.RESOLVED,
                IncidentStatus.TRIAGED,
            }, f"{inc.incidentId} has unexpected status: {inc.status}"


# ═══════════════════════════════════════════════════════════════════
# 7. Metrics computation
# ═══════════════════════════════════════════════════════════════════


class TestComputeMetrics:
    def test_metrics_contain_required_keys(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        before = capture_before_state(seeded_store)
        execute_action_chains(seeded_store, plan_summary)
        after = capture_after_state(seeded_store)
        metrics = compute_metrics(before, after, plan_summary)
        assert "incidentsDelta" in metrics
        assert "crewsDispatched" in metrics
        assert "avgResponseTimeMin" in metrics

    def test_incidents_delta_shows_resolution(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        before = capture_before_state(seeded_store)
        execute_action_chains(seeded_store, plan_summary)
        after = capture_after_state(seeded_store)
        metrics = compute_metrics(before, after, plan_summary)
        delta = metrics["incidentsDelta"]
        assert delta["resolved"] >= 0


# ═══════════════════════════════════════════════════════════════════
# 8. Animation frames
# ═══════════════════════════════════════════════════════════════════


class TestAnimationFrames:
    def test_fast_produces_4_frames(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        before = capture_before_state(seeded_store)
        actions = execute_action_chains(seeded_store, plan_summary)
        after = capture_after_state(seeded_store)
        frames = build_animation_frames(before, after, actions, "fast")
        assert len(frames) == 4

    def test_realtime_produces_12_frames(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        before = capture_before_state(seeded_store)
        actions = execute_action_chains(seeded_store, plan_summary)
        after = capture_after_state(seeded_store)
        frames = build_animation_frames(before, after, actions, "realtime")
        assert len(frames) == 12

    def test_instant_produces_1_frame(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        before = capture_before_state(seeded_store)
        actions = execute_action_chains(seeded_store, plan_summary)
        after = capture_after_state(seeded_store)
        frames = build_animation_frames(before, after, actions, "instant")
        assert len(frames) == 1


# ═══════════════════════════════════════════════════════════════════
# 9. Full simulate flow
# ═══════════════════════════════════════════════════════════════════


class TestFullSimulateFlow:
    def test_run_simulate_produces_valid_run(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        sim_body = SimulateRequest(
            planId=plan_summary.planId,
            simulationSpeed="fast",
            overrides=SimulateOverrides(forceApiFailure=True),
        )
        run, trace = run_simulate(seeded_store, sim_body)
        assert run.runId.startswith("SIM-")
        assert run.planId == plan_summary.planId
        assert len(run.actions) > 0
        assert len(run.failuresSimulated) >= 1
        assert len(run.animationFrames) == 4  # fast mode
        assert len(trace) >= 2

    def test_simulate_without_failure(self, seeded_store):
        plan_summary, _ = run_plan(seeded_store, PlanRequest(planMode="full"))
        sim_body = SimulateRequest(
            planId=plan_summary.planId,
            simulationSpeed="instant",
        )
        run, trace = run_simulate(seeded_store, sim_body)
        assert len(run.failuresSimulated) == 0
        assert len(run.animationFrames) == 1

    def test_simulate_nonexistent_plan_raises(self, seeded_store):
        sim_body = SimulateRequest(planId="PLAN-FAKE-0000")
        with pytest.raises(ValueError):
            run_simulate(seeded_store, sim_body)

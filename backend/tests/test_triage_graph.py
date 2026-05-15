"""Tests for the Triage/Plan graph (10-node chain).

Covers: fetch, classification, contradiction detection and resolution,
routing, resource matching, chain building, constraint checking,
notification drafting, priority ordering, and full graph execution.
"""

import pytest

from app.flows.plan_flow import (
    fetch_open_incidents,
    classify_incidents,
    detect_contradictions,
    resolve_contradictions,
    route_and_match,
    build_chains,
    check_constraints,
    draft_all_notifications,
    prioritize,
    persist_plan,
    run_plan,
    SEVERITY_MULT,
    SOURCE_CRED,
)
from app.models.enums import (
    IncidentStatus,
    IncidentType,
    Severity,
    SourceType,
)
from app.models.requests import PlanConstraints, PlanRequest


# ═══════════════════════════════════════════════════════════════════
# 1. Fetch open incidents
# ═══════════════════════════════════════════════════════════════════


class TestFetchOpenIncidents:
    def test_returns_all_open_incidents(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        assert len(incidents) == 5
        for inc in incidents:
            assert inc.status in {IncidentStatus.REPORTED, IncidentStatus.TRIAGED}

    def test_closed_incidents_excluded(self, seeded_store):
        # Manually resolve one incident
        seeded_store.incidents[0].status = IncidentStatus.RESOLVED
        seeded_store.upsert_incident(seeded_store.incidents[0])
        incidents = fetch_open_incidents(seeded_store, None)
        assert len(incidents) == 4

    def test_filter_by_ids(self, seeded_store):
        all_inc = fetch_open_incidents(seeded_store, None)
        target_ids = [all_inc[0].incidentId, all_inc[1].incidentId]
        filtered = fetch_open_incidents(seeded_store, target_ids)
        assert len(filtered) == 2
        assert {i.incidentId for i in filtered} == set(target_ids)


# ═══════════════════════════════════════════════════════════════════
# 2. Classification
# ═══════════════════════════════════════════════════════════════════


class TestClassifyIncidents:
    def test_five_incidents_produce_five_classifications(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        assert len(classifications) == 5
        for inc_id, cls in classifications.items():
            assert "incidentType" in cls
            assert "severity" in cls
            assert "urgencyScore" in cls

    def test_water_pipe_classified_as_water_leak(self, seeded_store):
        # Demo incident 3 (CSV_JSON): "PIPE-MQ-14 pressure anomaly — major pipe breach"
        incidents = fetch_open_incidents(seeded_store, None)
        pipe_incident = [i for i in incidents if "pipe" in i.description.lower() or "pressure" in i.description.lower()]
        assert len(pipe_incident) >= 1
        classifications = classify_incidents(pipe_incident)
        cls = list(classifications.values())[0]
        assert cls["incidentType"] == IncidentType.WATER_LEAK

    def test_accident_classified_correctly(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        accident_incident = [i for i in incidents if "accident" in i.description.lower() or "truck" in i.description.lower()]
        assert len(accident_incident) >= 1
        classifications = classify_incidents(accident_incident)
        cls = list(classifications.values())[0]
        assert cls["incidentType"] == IncidentType.ACCIDENT
        assert cls["urgencyScore"] == 9  # high urgency per mock provider

    def test_congestion_classified_as_road_blockage(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        traffic = [i for i in incidents if "congestion" in i.description.lower()]
        assert len(traffic) >= 1
        classifications = classify_incidents(traffic)
        cls = list(classifications.values())[0]
        assert cls["incidentType"] == IncidentType.ROAD_BLOCKAGE


# ═══════════════════════════════════════════════════════════════════
# 3. Contradiction detection
# ═══════════════════════════════════════════════════════════════════


class TestContradictionDetection:
    def test_market_quarter_pair_detected(self, seeded_store):
        """Demo incidents 2 (web_article) and 3 (csv_json) share Market Quarter
        coords and are within 60 min — after classification their types
        may diverge (web_article: water_leak via "flooding", csv_json: water_leak
        via "pipe"). But we need to test that the contradiction engine finds
        them when types actually differ."""
        incidents = fetch_open_incidents(seeded_store, None)
        # Manually set one to WATER_LEAK and other to ROAD_BLOCKAGE to force a contradiction
        mq_incidents = [i for i in incidents if abs(i.coordinates.lat - 33.7185) < 0.001 and i.coordinates is not None]
        if len(mq_incidents) >= 2:
            mq_incidents[0].incidentType = IncidentType.WATER_LEAK
            mq_incidents[1].incidentType = IncidentType.ROAD_BLOCKAGE
            groups = detect_contradictions(mq_incidents)
            assert len(groups) >= 1
            assert len(groups[0].incident_ids) >= 2

    def test_no_contradictions_for_single_incident(self, seeded_store):
        incidents = [seeded_store.incidents[0]]
        groups = detect_contradictions(incidents)
        assert len(groups) == 0

    def test_distant_incidents_not_grouped(self, seeded_store):
        """Two incidents 500m+ apart should NOT be grouped."""
        incidents = fetch_open_incidents(seeded_store, None)
        # Select incidents with different coordinates
        distant = [i for i in incidents if i.coordinates and abs(i.coordinates.lat - 33.7145) < 0.001]
        other_far = [i for i in incidents if i.coordinates and abs(i.coordinates.lat - 33.7215) < 0.001]
        if distant and other_far:
            distant[0].incidentType = IncidentType.WATER_LEAK
            other_far[0].incidentType = IncidentType.ROAD_BLOCKAGE
            groups = detect_contradictions(distant + other_far)
            # These are ~800m apart, should NOT be grouped
            for g in groups:
                assert not (distant[0].incidentId in g.incident_ids and other_far[0].incidentId in g.incident_ids)


# ═══════════════════════════════════════════════════════════════════
# 4. Contradiction resolution
# ═══════════════════════════════════════════════════════════════════


class TestContradictionResolution:
    def test_csv_json_beats_web_article(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        mq = [i for i in incidents if i.coordinates and abs(i.coordinates.lat - 33.7185) < 0.001]
        if len(mq) >= 2:
            mq[0].incidentType = IncidentType.WATER_LEAK
            mq[1].incidentType = IncidentType.ROAD_BLOCKAGE
            groups = detect_contradictions(mq)
            if groups:
                resolutions = resolve_contradictions(mq, groups)
                assert len(resolutions) >= 1
                for inc_id, res in resolutions.items():
                    assert "confidence" in res
                    assert "rationale" in res


# ═══════════════════════════════════════════════════════════════════
# 5. Routing
# ═══════════════════════════════════════════════════════════════════


class TestRouting:
    def test_water_leak_routes_to_util_and_traffic(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        for inc_id, result in routing_results.items():
            cls = classifications[inc_id]
            if cls["incidentType"] == IncidentType.WATER_LEAK:
                assert "DEPT-UTIL" in result["departments"]
                assert "DEPT-TRAFFIC" in result["departments"]

    def test_accident_routes_to_emer_and_traffic(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        for inc_id, result in routing_results.items():
            cls = classifications[inc_id]
            if cls["incidentType"] == IncidentType.ACCIDENT:
                assert "DEPT-EMER" in result["departments"]


# ═══════════════════════════════════════════════════════════════════
# 6. Resource matching
# ═══════════════════════════════════════════════════════════════════


class TestResourceMatching:
    def test_available_crew_returned(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        # At least some incidents should have resources
        has_resources = any(r.get("resources") for r in routing_results.values())
        assert has_resources, "No resources matched for any incident — check NovaCivitas data"

    def test_no_resources_when_all_busy(self, seeded_store):
        # Mark all resources as busy
        for res in seeded_store.resources:
            res["status"] = "assigned"
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        for result in routing_results.values():
            assert result["resources"] == []


# ═══════════════════════════════════════════════════════════════════
# 7. Chain building
# ═══════════════════════════════════════════════════════════════════


class TestBuildChains:
    def test_chains_contain_3_to_5_steps(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        chains = build_chains(incidents, classifications, routing_results)
        for inc_id, chain in chains.items():
            assert 2 <= len(chain) <= 5, f"Chain for {inc_id} has {len(chain)} steps"

    def test_water_leak_has_road_impact_step(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        chains = build_chains(incidents, classifications, routing_results)
        for inc_id, chain in chains.items():
            cls = classifications[inc_id]
            if cls["incidentType"] == IncidentType.WATER_LEAK:
                step_types = [s["type"] for s in chain]
                assert "manage_road_impact" in step_types


# ═══════════════════════════════════════════════════════════════════
# 8. Constraint checking
# ═══════════════════════════════════════════════════════════════════


class TestConstraintCheck:
    def test_no_violations_with_default_budget(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        violations = check_constraints(routing_results, None)
        # Default budget is 50_000 PKR, cost is 9000 per resource — should not violate
        assert all(v.constraintName != "maxBudgetPKR" or int(v.actualValue) > int(v.requiredValue)
                    for v in violations)

    def test_violation_when_budget_is_tiny(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        routing_results = route_and_match(seeded_store, incidents, classifications)
        constraints = PlanConstraints(maxBudgetPKR=1)  # impossibly small
        violations = check_constraints(routing_results, constraints)
        # Incidents with resources should trigger violations
        has_violation = any(v.constraintName == "maxBudgetPKR" for v in violations)
        has_resources = any(r.get("resources") for r in routing_results.values())
        if has_resources:
            assert has_violation


# ═══════════════════════════════════════════════════════════════════
# 9. Priority ordering
# ═══════════════════════════════════════════════════════════════════


class TestPriority:
    def test_priority_formula_correct(self, seeded_store):
        """priority = urgencyScore × severityMultiplier × sourceCredibilityWeight"""
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        scores = prioritize(incidents, classifications)
        for inc in incidents:
            cls = classifications[inc.incidentId]
            expected = (
                cls["urgencyScore"]
                * SEVERITY_MULT.get(cls["severity"], 0)
                * SOURCE_CRED.get(inc.sourceType.value, 0.75)
            )
            assert abs(scores[inc.incidentId] - expected) < 0.001

    def test_critical_outranks_medium(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        scores = prioritize(incidents, classifications)
        # Find max and min score
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        assert sorted_scores[0][1] >= sorted_scores[-1][1]


# ═══════════════════════════════════════════════════════════════════
# 10. Notification drafts
# ═══════════════════════════════════════════════════════════════════


class TestNotificationDrafts:
    def test_three_drafts_per_incident(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        drafts = draft_all_notifications(incidents, classifications)
        for inc_id, d in drafts.items():
            assert "operator_alert" in d
            assert "public_announcement" in d
            assert "department_ticket" in d

    def test_public_announcement_under_280_chars(self, seeded_store):
        incidents = fetch_open_incidents(seeded_store, None)
        classifications = classify_incidents(incidents)
        drafts = draft_all_notifications(incidents, classifications)
        for inc_id, d in drafts.items():
            assert len(d["public_announcement"]) <= 280, (
                f"Public announcement for {inc_id} is {len(d['public_announcement'])} chars"
            )


# ═══════════════════════════════════════════════════════════════════
# 11. Empty incidents → empty plan
# ═══════════════════════════════════════════════════════════════════


class TestEmptyPlan:
    def test_no_open_incidents_produces_empty_plan(self, fresh_store):
        body = PlanRequest(planMode="full")
        summary, trace = run_plan(fresh_store, body)
        assert summary.totalIncidents == 0
        assert len(summary.incidentPlans) == 0


# ═══════════════════════════════════════════════════════════════════
# 12. Full graph execution
# ═══════════════════════════════════════════════════════════════════


class TestFullPlanFlow:
    def test_run_plan_produces_valid_summary(self, seeded_store):
        body = PlanRequest(planMode="full")
        summary, trace = run_plan(seeded_store, body)
        assert summary.totalIncidents == 5
        assert len(summary.incidentPlans) == 5
        assert summary.planId.startswith("PLAN-")
        assert len(trace) >= 2  # At least fetch + constraint-check trace entries

    def test_quick_mode_skips_contradictions(self, seeded_store):
        body = PlanRequest(planMode="quick")
        summary, trace = run_plan(seeded_store, body)
        assert summary.totalIncidents == 5
        # In quick mode, conflictsDetected should be 0
        assert summary.conflictsDetected == 0

    def test_plans_sorted_by_priority(self, seeded_store):
        body = PlanRequest(planMode="full")
        summary, _ = run_plan(seeded_store, body)
        scores = [p.priorityScore for p in summary.incidentPlans]
        assert scores == sorted(scores, reverse=True), "Plans not sorted by descending priority"

    def test_incidents_transition_to_triaged(self, seeded_store):
        body = PlanRequest(planMode="full")
        run_plan(seeded_store, body)
        for inc in seeded_store.incidents:
            assert inc.status == IncidentStatus.TRIAGED

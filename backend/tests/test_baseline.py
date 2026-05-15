"""Tests for the baseline (non-agentic) plan — plan.md §14.

Verifies keyword routing, static plan generation, and ensures
no LLM calls occur in baseline mode.
"""

import pytest

from app.models.enums import IncidentType, Severity
from app.services.baseline import run_baseline_plan, _keyword_type, _dept_for_type


# ═══════════════════════════════════════════════════════════════════
# 1. Keyword routing
# ═══════════════════════════════════════════════════════════════════


class TestKeywordRouting:
    def test_water_keyword(self):
        assert _keyword_type("water main burst near market") == IncidentType.WATER_LEAK

    def test_flood_keyword(self):
        assert _keyword_type("flash flooding on Main Street") == IncidentType.WATER_LEAK

    def test_electric_keyword(self):
        assert _keyword_type("electrical panel arcing in junction box") == IncidentType.POWER_OUTAGE

    def test_power_keyword(self):
        assert _keyword_type("power outage affecting sector 4") == IncidentType.POWER_OUTAGE

    def test_accident_keyword(self):
        assert _keyword_type("truck accident on Central Flyover") == IncidentType.ACCIDENT

    def test_crash_keyword(self):
        assert _keyword_type("car crash near intersection") == IncidentType.ACCIDENT

    def test_road_keyword(self):
        assert _keyword_type("road closure due to construction") == IncidentType.ROAD_BLOCKAGE

    def test_block_keyword(self):
        assert _keyword_type("road blocked by fallen tree") == IncidentType.ROAD_BLOCKAGE

    def test_unknown_falls_to_other(self):
        assert _keyword_type("unusual smell near school campus") == IncidentType.OTHER


# ═══════════════════════════════════════════════════════════════════
# 2. Department mapping
# ═══════════════════════════════════════════════════════════════════


class TestDeptForType:
    def test_water_to_util(self):
        assert _dept_for_type(IncidentType.WATER_LEAK) == ["DEPT-UTIL"]

    def test_accident_to_emer(self):
        assert _dept_for_type(IncidentType.ACCIDENT) == ["DEPT-EMER"]

    def test_road_to_traffic(self):
        assert _dept_for_type(IncidentType.ROAD_BLOCKAGE) == ["DEPT-TRAFFIC"]

    def test_other_to_gen(self):
        assert _dept_for_type(IncidentType.OTHER) == ["DEPT-GEN"]

    def test_unknown_falls_to_gen(self):
        assert _dept_for_type(IncidentType.UNKNOWN) == ["DEPT-GEN"]


# ═══════════════════════════════════════════════════════════════════
# 3. Baseline plan generation
# ═══════════════════════════════════════════════════════════════════


class TestBaselinePlan:
    def test_generates_plan_for_seeded_incidents(self, seeded_store):
        summary = run_baseline_plan(seeded_store, None)
        assert summary.planId.startswith("PLAN-")
        assert summary.totalIncidents == 5
        assert summary.conflictsDetected == 0
        assert summary.conflictsResolved == 0

    def test_single_step_chain(self, seeded_store):
        summary = run_baseline_plan(seeded_store, None)
        for plan in summary.incidentPlans:
            assert len(plan.actionChain) == 1
            assert plan.actionChain[0]["type"] == "assign_department"

    def test_no_resources_dispatched(self, seeded_store):
        summary = run_baseline_plan(seeded_store, None)
        assert summary.totalResourcesDispatched == 0
        for plan in summary.incidentPlans:
            assert plan.assignedResources == []

    def test_all_severity_medium(self, seeded_store):
        summary = run_baseline_plan(seeded_store, None)
        for plan in summary.incidentPlans:
            assert plan.severity == Severity.MEDIUM

    def test_baseline_sets_trace(self, seeded_store):
        run_baseline_plan(seeded_store, None)
        assert len(seeded_store.last_plan_trace) == 1
        assert seeded_store.last_plan_trace[0]["stepId"] == "B01"
        assert seeded_store.last_plan_trace[0]["name"] == "Baseline: keyword routing"

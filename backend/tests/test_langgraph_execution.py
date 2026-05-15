"""Tests for actual LangGraph graph execution (async ainvoke).

These tests verify that the compiled graphs (build_graph) can execute
end-to-end through LangGraph's runtime, not just the underlying flow
functions. This is the critical difference — we're testing the graph
wiring, conditional edges, and state propagation.
"""

import pytest

from app.graphs.ingest import build_graph as build_ingest_graph
from app.graphs.triage_plan import build_graph as build_plan_graph
from app.graphs.simulate import build_graph as build_simulate_graph
from app.models.enums import IncidentStatus, SourceType
from app.models.requests import (
    IngestRequest,
    PlanRequest,
    SimulateRequest,
    SimulateOverrides,
)


# ═══════════════════════════════════════════════════════════════════
# 1. Ingest Graph (LangGraph)
# ═══════════════════════════════════════════════════════════════════


class TestIngestGraph:
    @pytest.mark.asyncio
    async def test_valid_ingest_through_graph(self, fresh_store):
        graph = build_ingest_graph()
        result = await graph.ainvoke({
            "request": IngestRequest(
                rawDescription="Major water pipe burst on Jinnah Avenue flooding streets",
                sourceType=SourceType.CSV_JSON,
                rawCoordinates={"lat": 33.72, "lng": 73.05},
            ),
            "trace_steps": [],
        })
        assert result.get("error") is None
        assert result["incident"] is not None
        assert result["incident"].incidentId.startswith("INC-")
        assert result["is_duplicate"] is False
        assert len(result["trace_steps"]) >= 4  # validate + ts + loc + sanitize + id + persist

    @pytest.mark.asyncio
    async def test_validation_failure_short_circuits(self, fresh_store):
        graph = build_ingest_graph()
        result = await graph.ainvoke({
            "request": IngestRequest(
                rawDescription="short",
                sourceType=SourceType.PDF_REPORT,
            ),
            "trace_steps": [],
        })
        assert result.get("error") is not None
        assert result["error"]["code"] == "DESCRIPTION_REQUIRED"
        # Should NOT have incident
        assert result.get("incident") is None

    @pytest.mark.asyncio
    async def test_graph_accumulates_trace_steps(self, fresh_store):
        graph = build_ingest_graph()
        result = await graph.ainvoke({
            "request": IngestRequest(
                rawDescription="Electrical panel arcing in Industrial Zone junction box D-03",
                sourceType=SourceType.PDF_REPORT,
                rawCoordinates={"lat": 33.7145, "lng": 73.0432},
            ),
            "trace_steps": [],
        })
        steps = result["trace_steps"]
        step_ids = [s["stepId"] for s in steps]
        assert "I01" in step_ids  # validate
        assert "I06" in step_ids  # persist

    @pytest.mark.asyncio
    async def test_duplicate_via_graph(self, fresh_store):
        graph = build_ingest_graph()
        req = IngestRequest(
            rawDescription="Duplicate detection test via LangGraph graph execution flow",
            sourceType=SourceType.CSV_JSON,
            rawCoordinates={"lat": 33.72, "lng": 73.05},
        )
        r1 = await graph.ainvoke({"request": req, "trace_steps": []})
        r2 = await graph.ainvoke({"request": req, "trace_steps": []})
        assert r1["is_duplicate"] is False
        assert r2["is_duplicate"] is True
        assert r2["incident"].incidentId == r1["incident"].incidentId


# ═══════════════════════════════════════════════════════════════════
# 2. Triage/Plan Graph (LangGraph)
# ═══════════════════════════════════════════════════════════════════


class TestPlanGraph:
    @pytest.mark.asyncio
    async def test_full_plan_through_graph(self, seeded_store):
        graph = build_plan_graph()
        result = await graph.ainvoke({
            "request": PlanRequest(planMode="full"),
            "trace_steps": [],
        })
        summary = result.get("plan_summary")
        assert summary is not None
        assert summary.planId.startswith("PLAN-")
        assert summary.totalIncidents == 5
        assert len(result["trace_steps"]) >= 5

    @pytest.mark.asyncio
    async def test_quick_plan_skips_contradictions(self, seeded_store):
        graph = build_plan_graph()
        result = await graph.ainvoke({
            "request": PlanRequest(planMode="quick"),
            "trace_steps": [],
        })
        summary = result["plan_summary"]
        assert summary.conflictsDetected == 0
        # Quick mode should skip detect_conflicts and resolve_conflicts
        step_ids = [s["stepId"] for s in result["trace_steps"]]
        assert "S03-detect" not in step_ids

    @pytest.mark.asyncio
    async def test_empty_workspace_plan(self, fresh_store):
        graph = build_plan_graph()
        result = await graph.ainvoke({
            "request": PlanRequest(planMode="full"),
            "trace_steps": [],
        })
        summary = result["plan_summary"]
        assert summary.totalIncidents == 0

    @pytest.mark.asyncio
    async def test_plan_graph_priority_ordering(self, seeded_store):
        graph = build_plan_graph()
        result = await graph.ainvoke({
            "request": PlanRequest(planMode="full"),
            "trace_steps": [],
        })
        plans = result["plan_summary"].incidentPlans
        scores = [p.priorityScore for p in plans]
        assert scores == sorted(scores, reverse=True)


# ═══════════════════════════════════════════════════════════════════
# 3. Simulate Graph (LangGraph)
# ═══════════════════════════════════════════════════════════════════


class TestSimulateGraph:
    @pytest.mark.asyncio
    async def test_simulate_through_graph(self, seeded_store):
        # First create a plan
        plan_graph = build_plan_graph()
        plan_result = await plan_graph.ainvoke({
            "request": PlanRequest(planMode="full"),
            "trace_steps": [],
        })
        plan_id = plan_result["plan_summary"].planId

        # Then simulate
        sim_graph = build_simulate_graph()
        result = await sim_graph.ainvoke({
            "request": SimulateRequest(
                planId=plan_id,
                simulationSpeed="fast",
                overrides=SimulateOverrides(forceApiFailure=True),
            ),
            "trace_steps": [],
        })
        assert result.get("error") is None
        run = result["simulation_run"]
        assert run.runId.startswith("SIM-")
        assert len(run.failuresSimulated) >= 1
        assert len(run.animationFrames) == 4

    @pytest.mark.asyncio
    async def test_simulate_plan_not_found(self, fresh_store):
        sim_graph = build_simulate_graph()
        result = await sim_graph.ainvoke({
            "request": SimulateRequest(planId="PLAN-FAKE-0000"),
            "trace_steps": [],
        })
        assert result.get("error") is not None
        assert "not found" in result["error"].lower()
        assert result.get("simulation_run") is None

    @pytest.mark.asyncio
    async def test_simulate_without_failure_injection(self, seeded_store):
        plan_graph = build_plan_graph()
        plan_result = await plan_graph.ainvoke({
            "request": PlanRequest(planMode="full"),
            "trace_steps": [],
        })

        sim_graph = build_simulate_graph()
        result = await sim_graph.ainvoke({
            "request": SimulateRequest(
                planId=plan_result["plan_summary"].planId,
                simulationSpeed="instant",
            ),
            "trace_steps": [],
        })
        run = result["simulation_run"]
        assert len(run.failuresSimulated) == 0
        assert len(run.animationFrames) == 1

"""Tests for the trace builder service.

Covers: append_step, build_agent_trace (counts + summary),
nested children flattening, and depth filtering.
"""

from app.models.enums import TraceStepStatus, TraceStepType
from app.services.trace_builder import (
    append_step,
    build_agent_trace,
    filter_trace_steps,
    _flatten,
    _to_trace_steps,
)


# ═══════════════════════════════════════════════════════════════════
# 1. append_step
# ═══════════════════════════════════════════════════════════════════


class TestAppendStep:
    def test_adds_step_with_correct_structure(self):
        steps = []
        append_step(
            steps,
            step_id="T01",
            name="Test step",
            step_type=TraceStepType.STATE_UPDATE,
            output_summary="Did something",
        )
        assert len(steps) == 1
        step = steps[0]
        assert step["stepId"] == "T01"
        assert step["name"] == "Test step"
        assert step["type"] == TraceStepType.STATE_UPDATE
        assert step["status"] == TraceStepStatus.SUCCESS  # default
        assert step["outputSummary"] == "Did something"
        assert step["children"] == []

    def test_custom_status_and_rationale(self):
        steps = []
        append_step(
            steps,
            step_id="T02",
            name="Decision",
            step_type=TraceStepType.DECISION,
            status=TraceStepStatus.WARNING,
            decision_rationale="Budget exceeded, using cheapest option",
        )
        assert steps[0]["status"] == TraceStepStatus.WARNING
        assert steps[0]["decisionRationale"] == "Budget exceeded, using cheapest option"

    def test_multiple_appends_accumulate(self):
        steps = []
        for i in range(5):
            append_step(
                steps, step_id=f"S{i}", name=f"Step {i}", step_type=TraceStepType.STATE_UPDATE
            )
        assert len(steps) == 5


# ═══════════════════════════════════════════════════════════════════
# 2. build_agent_trace
# ═══════════════════════════════════════════════════════════════════


class TestBuildAgentTrace:
    def test_counts_llm_calls_correctly(self):
        steps = []
        append_step(steps, step_id="S1", name="Classify", step_type=TraceStepType.LLM_CALL)
        append_step(steps, step_id="S2", name="Route", step_type=TraceStepType.TOOL_CALL)
        append_step(steps, step_id="S3", name="Draft", step_type=TraceStepType.LLM_CALL)
        append_step(steps, step_id="S4", name="Check", step_type=TraceStepType.DECISION)

        trace = build_agent_trace(
            trace_id="TRACE-TEST-0001",
            plan_id="PLAN-TEST-0001",
            generated_at="2026-01-01T00:00:00Z",
            steps=steps,
        )
        assert trace.summary.totalSteps == 4
        assert trace.summary.totalLLMCalls == 2
        assert trace.summary.totalToolCalls == 1
        assert trace.summary.totalDecisionNodes == 1

    def test_trace_id_and_plan_id_set(self):
        trace = build_agent_trace(
            trace_id="TRACE-ABC",
            plan_id="PLAN-XYZ",
            generated_at="2026-01-01T00:00:00Z",
            steps=[],
        )
        assert trace.traceId == "TRACE-ABC"
        assert trace.planId == "PLAN-XYZ"

    def test_conflicts_detected_passed_through(self):
        trace = build_agent_trace(
            trace_id="TRACE-CD",
            plan_id="PLAN-CD",
            generated_at="2026-01-01T00:00:00Z",
            steps=[],
            conflicts_detected=3,
        )
        assert trace.summary.conflictsDetected == 3


# ═══════════════════════════════════════════════════════════════════
# 3. Nested children flattening
# ═══════════════════════════════════════════════════════════════════


class TestFlatten:
    def test_flattens_nested_children(self):
        steps = []
        # Parent step with children
        child1 = {
            "stepId": "C1",
            "name": "Child 1",
            "type": TraceStepType.LLM_CALL,
            "status": TraceStepStatus.SUCCESS,
            "durationMs": 10,
            "inputSummary": "",
            "outputSummary": "",
            "decisionRationale": None,
            "children": [],
        }
        child2 = {
            "stepId": "C2",
            "name": "Child 2",
            "type": TraceStepType.TOOL_CALL,
            "status": TraceStepStatus.SUCCESS,
            "durationMs": 5,
            "inputSummary": "",
            "outputSummary": "",
            "decisionRationale": None,
            "children": [],
        }
        append_step(
            steps,
            step_id="P1",
            name="Parent",
            step_type=TraceStepType.DECISION,
            children=[child1, child2],
        )
        typed = _to_trace_steps(steps)
        flat = _flatten(typed)
        # Parent + 2 children = 3
        assert len(flat) == 3

    def test_duration_summed_across_tree(self):
        steps = [
            {
                "stepId": "P",
                "name": "Parent",
                "type": TraceStepType.DECISION,
                "status": TraceStepStatus.SUCCESS,
                "durationMs": 100,
                "inputSummary": "",
                "outputSummary": "",
                "decisionRationale": None,
                "children": [
                    {
                        "stepId": "C",
                        "name": "Child",
                        "type": TraceStepType.LLM_CALL,
                        "status": TraceStepStatus.SUCCESS,
                        "durationMs": 50,
                        "inputSummary": "",
                        "outputSummary": "",
                        "decisionRationale": None,
                        "children": [],
                    }
                ],
            }
        ]
        trace = build_agent_trace(
            trace_id="T",
            plan_id="P",
            generated_at="now",
            steps=steps,
        )
        assert trace.summary.totalDurationMs == 150


# ═══════════════════════════════════════════════════════════════════
# 4. Depth filtering
# ═══════════════════════════════════════════════════════════════════


class TestDepthFilter:
    def test_full_returns_all_steps(self):
        steps = [
            {
                "stepId": "S1",
                "name": "A",
                "children": [{"stepId": "S1.1", "name": "A.1", "children": []}],
            },
            {"stepId": "S2", "name": "B", "children": []},
        ]
        filtered = filter_trace_steps(steps, "full")
        assert len(filtered) == 2
        assert len(filtered[0]["children"]) == 1

    def test_summary_strips_children(self):
        steps = [
            {
                "stepId": "S1",
                "name": "A",
                "children": [{"stepId": "S1.1", "name": "A.1", "children": []}],
            },
            {"stepId": "S2", "name": "B", "children": []},
        ]
        filtered = filter_trace_steps(steps, "summary")
        assert len(filtered) == 2
        assert filtered[0]["children"] == []

    def test_summary_preserves_top_level_count(self):
        steps = [{"stepId": f"S{i}", "name": f"Step {i}", "children": []} for i in range(10)]
        filtered = filter_trace_steps(steps, "summary")
        assert len(filtered) == 10

from app.models.enums import TraceStepStatus, TraceStepType
from app.models.trace import AgentTrace, TraceStep, TraceSummary


def append_step(
    steps: list[dict],
    *,
    step_id: str,
    name: str,
    step_type: TraceStepType,
    status: TraceStepStatus = TraceStepStatus.SUCCESS,
    duration_ms: int = 0,
    input_summary: str = "",
    output_summary: str = "",
    decision_rationale: str | None = None,
    children: list[dict] | None = None,
) -> None:
    steps.append(
        {
            "stepId": step_id,
            "name": name,
            "type": step_type,
            "status": status,
            "durationMs": duration_ms,
            "inputSummary": input_summary,
            "outputSummary": output_summary,
            "decisionRationale": decision_rationale,
            "children": children or [],
        }
    )


def _to_trace_steps(raw: list[dict]) -> list[TraceStep]:
    result: list[TraceStep] = []
    for item in raw:
        children = _to_trace_steps(item.get("children", []))
        result.append(
            TraceStep(
                stepId=item["stepId"],
                name=item["name"],
                type=item["type"],
                status=item["status"],
                durationMs=item.get("durationMs", 0),
                inputSummary=item.get("inputSummary", ""),
                outputSummary=item.get("outputSummary", ""),
                decisionRationale=item.get("decisionRationale"),
                children=children,
                llmDetails=item.get("llmDetails"),
                toolDetails=item.get("toolDetails"),
                constraintDetails=item.get("constraintDetails"),
            )
        )
    return result


def build_agent_trace(
    *,
    trace_id: str,
    plan_id: str,
    generated_at: str,
    steps: list[dict],
    conflicts_detected: int = 0,
) -> AgentTrace:
    typed_steps = _to_trace_steps(steps)
    llm_calls = sum(1 for s in _flatten(typed_steps) if s.type == TraceStepType.LLM_CALL)
    tool_calls = sum(1 for s in _flatten(typed_steps) if s.type == TraceStepType.TOOL_CALL)
    decisions = sum(1 for s in _flatten(typed_steps) if s.type == TraceStepType.DECISION)
    total_ms = sum(s.durationMs for s in _flatten(typed_steps))

    return AgentTrace(
        traceId=trace_id,
        planId=plan_id,
        generatedAt=generated_at,
        summary=TraceSummary(
            totalSteps=len(_flatten(typed_steps)),
            totalLLMCalls=llm_calls,
            totalToolCalls=tool_calls,
            totalDecisionNodes=decisions,
            conflictsDetected=conflicts_detected,
            constraintsChecked=decisions,
            totalDurationMs=total_ms,
        ),
        steps=typed_steps,
    )


def _flatten(steps: list[TraceStep]) -> list[TraceStep]:
    out: list[TraceStep] = []
    for step in steps:
        out.append(step)
        out.extend(_flatten(step.children))
    return out

from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import TraceStepStatus, TraceStepType


class TraceStep(BaseModel):
    stepId: str
    name: str
    type: TraceStepType
    status: TraceStepStatus
    durationMs: int = 0
    inputSummary: str = ""
    outputSummary: str = ""
    decisionRationale: str | None = None
    children: list["TraceStep"] = Field(default_factory=list)
    llmDetails: dict[str, Any] | None = None
    toolDetails: dict[str, Any] | None = None
    constraintDetails: dict[str, Any] | None = None


class TraceSummary(BaseModel):
    totalSteps: int
    totalLLMCalls: int
    totalToolCalls: int
    totalDecisionNodes: int = 0
    conflictsDetected: int = 0
    constraintsChecked: int = 0
    totalDurationMs: int = 0


class AgentTrace(BaseModel):
    traceId: str
    planId: str
    generatedAt: str
    summary: TraceSummary
    steps: list[TraceStep]


TraceStep.model_rebuild()

from typing import Any

from pydantic import BaseModel, Field

from app.models.incident import Incident


class CityState(BaseModel):
    incidents: list[Incident]
    resources: list[dict[str, Any]]
    roadSegments: list[dict[str, Any]]
    notifications: list[dict[str, Any]] = Field(default_factory=list)


class SimulatedAction(BaseModel):
    stepId: str
    incidentId: str
    stepType: str
    resourceId: str | None = None
    timestamp: str
    before: dict[str, Any] = Field(default_factory=dict)
    after: dict[str, Any] = Field(default_factory=dict)
    durationSeconds: int = 0


class FailureRecord(BaseModel):
    stepId: str
    error: str
    retryCount: int = 0
    fallback: str | None = None
    recovered: bool = False


class SimulationRun(BaseModel):
    runId: str
    planId: str
    startedAt: str
    completedAt: str
    beforeState: CityState
    afterState: CityState
    actions: list[SimulatedAction]
    metrics: dict[str, Any]
    failuresSimulated: list[FailureRecord] = Field(default_factory=list)
    animationFrames: list[dict[str, Any]] = Field(default_factory=list)

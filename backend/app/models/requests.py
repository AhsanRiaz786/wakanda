from typing import Any

from pydantic import BaseModel

from app.models.enums import SourceType


class IngestRequest(BaseModel):
    rawDescription: str
    sourceType: SourceType
    sourceMetadata: dict[str, Any] | None = None
    rawCoordinates: dict[str, float] | None = None
    rawAddress: str | None = None
    manualCategory: str | None = None
    imageUrl: str | None = None
    rawTimestamp: str | None = None


class PlanConstraints(BaseModel):
    maxBudgetPKR: int | None = None
    maxDispatchMinutes: int | None = None
    availableCrewIds: list[str] | None = None


class PlanRequest(BaseModel):
    incidentIds: list[str] | None = None
    constraints: PlanConstraints | None = None
    planMode: str = "full"


class SimulateOverrides(BaseModel):
    forceApiFailure: bool = False
    forceResourceUnavailable: str | None = None


class SimulateRequest(BaseModel):
    planId: str
    simulationSpeed: str = "fast"
    overrides: SimulateOverrides | None = None

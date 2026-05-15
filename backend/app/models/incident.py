from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import IncidentStatus, IncidentType, Severity, SourceType


class Coordinates(BaseModel):
    lat: float
    lng: float


class Incident(BaseModel):
    incidentId: str
    title: str
    description: str
    rawDescription: str
    sourceType: SourceType
    sourceLabel: str
    sourceMetadata: dict[str, Any] = Field(default_factory=dict)
    coordinates: Coordinates | None = None
    requiresLocationClarification: bool = False
    imageUrl: str | None = None
    incidentType: IncidentType = IncidentType.UNKNOWN
    severity: Severity = Severity.UNKNOWN
    urgencyScore: int | None = None
    classificationRationale: str | None = None
    affectedRadius: int | None = None
    estimatedDuration: int | None = None
    assignedDepartments: list[str] = Field(default_factory=list)
    assignedResources: list[str] = Field(default_factory=list)
    status: IncidentStatus = IncidentStatus.REPORTED
    actionChain: list[dict[str, Any]] = Field(default_factory=list)
    notificationDrafts: dict[str, str] = Field(default_factory=dict)
    roadImpacts: list[str] = Field(default_factory=list)
    resolvedConflict: dict[str, Any] | None = None
    createdAt: str
    updatedAt: str
    normalizedAt: str | None = None

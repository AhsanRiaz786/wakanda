from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import IncidentType, Severity


class IncidentPlan(BaseModel):
    incidentId: str
    incidentType: IncidentType
    severity: Severity
    urgencyScore: int
    classificationRationale: str
    assignedDepartments: list[str]
    assignedResources: list[str]
    actionChain: list[dict[str, Any]]
    notificationDrafts: dict[str, str] = Field(default_factory=dict)
    roadImpacts: list[str] = Field(default_factory=list)
    resolvedConflict: dict[str, Any] | None = None
    resourceUnavailable: bool = False
    priorityScore: float = 0.0


class ConstraintViolation(BaseModel):
    constraintName: str
    requiredValue: str
    actualValue: str
    resolution: str


class PlanSummary(BaseModel):
    planId: str
    generatedAt: str
    incidentPlans: list[IncidentPlan]
    totalIncidents: int
    totalResourcesDispatched: int
    totalRoadImpacts: int
    totalNotificationsDrafted: int
    conflictsDetected: int
    conflictsResolved: int
    constraintViolations: list[ConstraintViolation] = Field(default_factory=list)
    priorityOrdering: list[str]
    trace_logs: list[str] = Field(default_factory=list)

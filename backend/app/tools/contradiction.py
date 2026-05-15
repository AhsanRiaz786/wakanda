"""Contradiction detection and resolution — plan.md §4.10.1.

Wave 0: stubs that return empty groups / minimal valid objects.
Agent B (Wave 1) replaces the function bodies without renaming any symbol.

Public API (frozen — do NOT rename):
  detect_contradiction_groups(incidents) -> list[ContradictionGroup]
  score_source(incident, now) -> float
  resolve_group(incidents) -> ResolvedConflict
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app.llm.schemas import ContradictionGroup, ResolvedConflict
from app.models.enums import IncidentType, Severity

if TYPE_CHECKING:
    from app.models.incident import Incident


# ---------------------------------------------------------------------------
# Wave 0 stubs — Agent B replaces these bodies
# ---------------------------------------------------------------------------


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in metres between two WGS-84 coordinates."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def detect_contradiction_groups(incidents: list["Incident"]) -> list[ContradictionGroup]:
    """Cluster incidents that contradict each other (stub — returns empty list).

    Agent B implements:
    - 200 m spatial window
    - 60 min temporal window
    - Flag if IncidentType differs OR Severity differs by > 1 level
    """
    return []


def score_source(incident: "Incident", now: datetime | None = None) -> float:
    """Score a source by credibility + recency (stub — returns 0.5).

    Agent B implements: 0.6 * SOURCE_WEIGHT + 0.4 * exp(-ageMinutes / 30)
    """
    return 0.5


def resolve_group(incidents: list["Incident"]) -> ResolvedConflict:
    """Pick the winning incident in a contradiction group (stub — picks first).

    Agent B implements full credibility + recency scoring.
    """
    if not incidents:
        raise ValueError("resolve_group requires at least one incident")

    winner = incidents[0]
    return ResolvedConflict(
        winning_incident_id=winner.incidentId,
        conflict_type="stub",
        resolution={},
        confidence=0.5,
        low_confidence_resolution=True,
        rationale="Wave 0 stub — Agent B not yet merged.",
        merged_incident_ids=[i.incidentId for i in incidents],
    )

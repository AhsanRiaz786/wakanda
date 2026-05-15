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
from app.models.enums import Severity

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
    """Cluster incidents that contradict each other.

    Rules:
    - 200 m spatial window
    - 60 min temporal window
    - Flag if IncidentType differs OR Severity differs by > 1 level
    """
    if len(incidents) < 2:
        return []

    # Sort by time for easier temporal windowing
    def parse_time(iso_str: str) -> float:
        try:
            return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0.0

    sorted_inc = sorted(incidents, key=lambda i: parse_time(i.createdAt))
    groups = []
    processed = set()

    severity_levels = {
        Severity.LOW: 1,
        Severity.MEDIUM: 2,
        Severity.HIGH: 3,
        Severity.CRITICAL: 4,
        Severity.UNKNOWN: 0,
    }

    for i in range(len(sorted_inc)):
        if sorted_inc[i].incidentId in processed:
            continue

        inc1 = sorted_inc[i]
        if not inc1.coordinates:
            continue

        t1 = parse_time(inc1.createdAt)
        cluster = [inc1]

        for j in range(i + 1, len(sorted_inc)):
            inc2 = sorted_inc[j]
            if inc2.incidentId in processed or not inc2.coordinates:
                continue

            t2 = parse_time(inc2.createdAt)
            age_diff_min = abs(t2 - t1) / 60.0

            if age_diff_min > 60.0:
                continue  # Outside time window

            dist_m = haversine_m(
                inc1.coordinates.lat,
                inc1.coordinates.lng,
                inc2.coordinates.lat,
                inc2.coordinates.lng,
            )

            if dist_m <= 200.0:
                # Check for contradiction
                type_mismatch = inc1.incidentType != inc2.incidentType

                sev1 = severity_levels.get(inc1.severity, 0)
                sev2 = severity_levels.get(inc2.severity, 0)
                sev_mismatch = abs(sev1 - sev2) > 1

                if type_mismatch or sev_mismatch:
                    cluster.append(inc2)
                    processed.add(inc2.incidentId)

        if len(cluster) > 1:
            processed.add(inc1.incidentId)

            # Find max distance and age diff
            max_dist = 0.0
            for a in cluster:
                for b in cluster:
                    if a.incidentId != b.incidentId and a.coordinates and b.coordinates:
                        d = haversine_m(
                            a.coordinates.lat,
                            a.coordinates.lng,
                            b.coordinates.lat,
                            b.coordinates.lng,
                        )
                        max_dist = max(max_dist, d)

            min_t = min(parse_time(c.createdAt) for c in cluster)
            max_t = max(parse_time(c.createdAt) for c in cluster)

            reasons = []
            types = {c.incidentType for c in cluster}
            if len(types) > 1:
                reasons.append("type_mismatch")

            sevs = [severity_levels.get(c.severity, 0) for c in cluster]
            if max(sevs) - min(sevs) > 1:
                reasons.append("severity_mismatch")

            groups.append(
                ContradictionGroup(
                    incident_ids=[c.incidentId for c in cluster],
                    distance_m=round(max_dist, 1),
                    age_diff_minutes=round((max_t - min_t) / 60.0, 1),
                    conflict_reason=" and ".join(reasons) or "mismatch",
                )
            )

    return groups


def score_source(incident: "Incident", now: datetime | None = None) -> float:
    """Score a source by credibility + recency.
    0.6 * SOURCE_WEIGHT + 0.4 * exp(-ageMinutes / 30)
    """
    from app.tools.llm_tools import SOURCE_WEIGHT

    weight = SOURCE_WEIGHT.get(incident.sourceType, 0.70)

    try:
        t_inc = datetime.fromisoformat(incident.createdAt.replace("Z", "+00:00"))
        t_now = now or datetime.now(timezone.utc)
        age_minutes = max(0.0, (t_now - t_inc).total_seconds() / 60.0)
    except Exception:
        age_minutes = 0.0

    recency_score = math.exp(-age_minutes / 30.0)
    return (0.6 * weight) + (0.4 * recency_score)


def resolve_group(incidents: list["Incident"]) -> ResolvedConflict:
    """Pick the winning incident using credibility + recency scoring."""
    if not incidents:
        raise ValueError("resolve_group requires at least one incident")

    now = datetime.now(timezone.utc)
    scored = [(score_source(inc, now), inc) for inc in incidents]
    scored.sort(key=lambda x: x[0], reverse=True)

    winner_score, winner = scored[0]
    loser_score = scored[-1][0] if len(scored) > 1 else winner_score

    score_gap = winner_score - loser_score
    confidence = min(0.5 + (score_gap * 2.0), 0.99)

    # We only return the base deterministc framework.
    # LLMProvider will enrich this with actual classification and rationale.
    from app.llm.schemas import ClassificationResult

    base_res = ClassificationResult(
        incident_type=winner.incidentType,
        severity=winner.severity,
        urgency_score=winner.urgencyScore or 5,
        confidence=confidence,
    )

    return ResolvedConflict(
        winning_incident_id=winner.incidentId,
        conflict_type="type_and_severity_mismatch",
        resolution=base_res.to_incident_dict(),
        confidence=round(confidence, 2),
        low_confidence_resolution=confidence < 0.6,
        rationale=f"Algorithmic selection: Source score {winner_score:.2f} won by margin of {score_gap:.2f}.",
        merged_incident_ids=[i.incidentId for i in incidents],
    )

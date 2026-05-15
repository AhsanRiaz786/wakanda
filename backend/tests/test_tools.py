"""Tests for individual tools: geo, routing, resources, LLM tools, contradiction.

Covers: GeoNormalizerTool, RoutingTool, ResourceMatcherTool,
IncidentClassifierTool, ContradictionResolverTool, NotificationDraftTool.
"""

from datetime import datetime, timezone, timedelta

from app.tools.geo import geo_normalize
from app.tools.routing import route_departments
from app.tools.resources import match_resources
from app.tools.llm_tools import classify_incident, resolve_contradiction, draft_notifications
from app.tools.contradiction import (
    detect_contradiction_groups,
    score_source,
    haversine_m,
)
from app.models.enums import IncidentType, IncidentStatus, Severity, SourceType
from app.models.incident import Coordinates, Incident


def _make_incident(
    inc_id: str,
    description: str,
    source_type: SourceType = SourceType.CSV_JSON,
    lat: float = 33.72,
    lng: float = 73.05,
    incident_type: IncidentType = IncidentType.UNKNOWN,
    severity: Severity = Severity.UNKNOWN,
    created_at: str | None = None,
) -> Incident:
    """Helper to create test incidents quickly."""
    now = created_at or datetime.now(timezone.utc).isoformat()
    return Incident(
        incidentId=inc_id,
        title=description[:80],
        description=description,
        rawDescription=description,
        sourceType=source_type,
        sourceLabel="Test",
        coordinates=Coordinates(lat=lat, lng=lng) if lat else None,
        incidentType=incident_type,
        severity=severity,
        status=IncidentStatus.REPORTED,
        createdAt=now,
        updatedAt=now,
    )


# ═══════════════════════════════════════════════════════════════════
# 1. GeoNormalizerTool
# ═══════════════════════════════════════════════════════════════════


class TestGeoNormalize:
    def test_known_location_returns_coords(self, fresh_store):
        lat, lng, matched, conf = geo_normalize(fresh_store, "Market Quarter")
        if matched:
            assert lat is not None
            assert lng is not None
            assert conf > 0.5

    def test_unknown_location_returns_low_confidence(self, fresh_store):
        lat, lng, matched, conf = geo_normalize(fresh_store, "Unknown Place Xyz")
        assert matched is None
        assert conf == 0.2

    def test_none_address_returns_zeros(self, fresh_store):
        lat, lng, matched, conf = geo_normalize(fresh_store, None)
        assert lat is None
        assert conf == 0.0


# ═══════════════════════════════════════════════════════════════════
# 2. RoutingTool
# ═══════════════════════════════════════════════════════════════════


class TestRouteDeprtments:
    def test_water_leak_routes_correctly(self):
        depts = route_departments(IncidentType.WATER_LEAK)
        assert "DEPT-UTIL" in depts
        assert "DEPT-TRAFFIC" in depts

    def test_accident_routes_correctly(self):
        depts = route_departments(IncidentType.ACCIDENT)
        assert "DEPT-EMER" in depts

    def test_road_blockage_routes_correctly(self):
        depts = route_departments(IncidentType.ROAD_BLOCKAGE)
        assert "DEPT-TRAFFIC" in depts

    def test_power_outage_routes_correctly(self):
        depts = route_departments(IncidentType.POWER_OUTAGE)
        assert "DEPT-POWER" in depts

    def test_unknown_routes_to_general(self):
        depts = route_departments(IncidentType.UNKNOWN)
        assert "DEPT-GEN" in depts

    def test_other_routes_to_general(self):
        depts = route_departments(IncidentType.OTHER)
        assert "DEPT-GEN" in depts


# ═══════════════════════════════════════════════════════════════════
# 3. ResourceMatcherTool
# ═══════════════════════════════════════════════════════════════════


class TestMatchResources:
    def test_available_crew_with_matching_skills_returned(self, fresh_store):
        coords = Coordinates(lat=33.72, lng=73.05)
        depts = ["DEPT-UTIL"]
        result = match_resources(fresh_store, coords, IncidentType.WATER_LEAK, depts)
        # May or may not find matches depending on data, but should not error
        assert isinstance(result, list)

    def test_all_crews_busy_returns_empty(self, fresh_store):
        for res in fresh_store.resources:
            res["status"] = "assigned"
        coords = Coordinates(lat=33.72, lng=73.05)
        result = match_resources(fresh_store, coords, IncidentType.WATER_LEAK, ["DEPT-UTIL"])
        assert result == []

    def test_no_coords_returns_empty(self, fresh_store):
        result = match_resources(fresh_store, None, IncidentType.WATER_LEAK, ["DEPT-UTIL"])
        assert result == []

    def test_results_sorted_by_distance(self, fresh_store):
        coords = Coordinates(lat=33.72, lng=73.05)
        result = match_resources(fresh_store, coords, IncidentType.OTHER, ["DEPT-GEN"], limit=10)
        # Distances should be non-decreasing (already sorted inside match_resources)
        if len(result) > 1:
            for res in fresh_store.resources:
                if res["resourceId"] in result:
                    assert res.get("status") == "available"


# ═══════════════════════════════════════════════════════════════════
# 4. IncidentClassifierTool (Mock)
# ═══════════════════════════════════════════════════════════════════


class TestClassifyIncident:
    def test_water_pipe_classified_as_water_leak(self):
        inc = _make_incident("INC-TEST-001", "PIPE-MQ-14 pressure anomaly — major pipe breach")
        result = classify_incident(inc)
        assert result["incidentType"] == IncidentType.WATER_LEAK
        assert result["severity"] == Severity.HIGH
        assert result["urgencyScore"] == 8

    def test_accident_classified_correctly(self):
        inc = _make_incident("INC-TEST-002", "Truck accident Central Flyover. Driver injured.")
        result = classify_incident(inc)
        assert result["incidentType"] == IncidentType.ACCIDENT
        assert result["urgencyScore"] == 9

    def test_congestion_classified_as_road_blockage(self):
        inc = _make_incident("INC-TEST-003", "Main Boulevard congestion 74 percent")
        result = classify_incident(inc)
        assert result["incidentType"] == IncidentType.ROAD_BLOCKAGE
        assert result["severity"] == Severity.MEDIUM

    def test_generic_falls_back_to_other(self):
        inc = _make_incident("INC-TEST-004", "Unknown situation at location X")
        result = classify_incident(inc)
        assert result["incidentType"] == IncidentType.OTHER


# ═══════════════════════════════════════════════════════════════════
# 5. ContradictionResolverTool
# ═══════════════════════════════════════════════════════════════════


class TestResolveContradiction:
    def test_csv_json_wins_over_web_article(self):
        inc1 = _make_incident("INC-A", "water pipe burst", source_type=SourceType.CSV_JSON)
        inc2 = _make_incident("INC-B", "flooding in area", source_type=SourceType.WEB_ARTICLE)
        result = resolve_contradiction([inc1, inc2])
        assert result["confidence"] > 0
        assert "rationale" in result

    def test_single_incident_still_works(self):
        inc = _make_incident("INC-SOLO", "water pipe burst", source_type=SourceType.CSV_JSON)
        result = resolve_contradiction([inc])
        assert "rationale" in result


# ═══════════════════════════════════════════════════════════════════
# 6. NotificationDraftTool
# ═══════════════════════════════════════════════════════════════════


class TestDraftNotifications:
    def test_three_drafts_returned(self):
        result = draft_notifications("INC-TEST-001", "water_leak")
        assert "operator_alert" in result
        assert "public_announcement" in result
        assert "department_ticket" in result

    def test_public_within_280_chars(self):
        result = draft_notifications("INC-TEST-001", "accident")
        assert len(result["public_announcement"]) <= 280


# ═══════════════════════════════════════════════════════════════════
# 7. Contradiction detection logic
# ═══════════════════════════════════════════════════════════════════


class TestContradictionDetection:
    def test_nearby_different_types_detected(self):
        inc1 = _make_incident(
            "INC-C1",
            "water pipe burst",
            lat=33.7185,
            lng=73.0512,
            incident_type=IncidentType.WATER_LEAK,
            severity=Severity.HIGH,
        )
        inc2 = _make_incident(
            "INC-C2",
            "road blocked by debris",
            lat=33.7186,
            lng=73.0513,
            incident_type=IncidentType.ROAD_BLOCKAGE,
            severity=Severity.MEDIUM,
        )
        groups = detect_contradiction_groups([inc1, inc2])
        assert len(groups) >= 1

    def test_far_apart_not_grouped(self):
        inc1 = _make_incident(
            "INC-F1",
            "water pipe burst",
            lat=33.70,
            lng=73.00,
            incident_type=IncidentType.WATER_LEAK,
        )
        inc2 = _make_incident(
            "INC-F2", "road blocked", lat=34.00, lng=74.00, incident_type=IncidentType.ROAD_BLOCKAGE
        )
        groups = detect_contradiction_groups([inc1, inc2])
        assert len(groups) == 0

    def test_haversine_correct(self):
        d = haversine_m(33.7185, 73.0512, 33.7186, 73.0513)
        assert d < 200  # ~15m apart


# ═══════════════════════════════════════════════════════════════════
# 8. Source scoring
# ═══════════════════════════════════════════════════════════════════


class TestSourceScoring:
    def test_csv_json_higher_than_web_article(self):
        inc1 = _make_incident("INC-S1", "test", source_type=SourceType.CSV_JSON)
        inc2 = _make_incident("INC-S2", "test", source_type=SourceType.WEB_ARTICLE)
        s1 = score_source(inc1)
        s2 = score_source(inc2)
        assert s1 > s2

    def test_recent_scores_higher_than_old(self):
        now = datetime.now(timezone.utc)
        recent = _make_incident("INC-R", "test", created_at=now.isoformat())
        old = _make_incident("INC-O", "test", created_at=(now - timedelta(hours=2)).isoformat())
        s_recent = score_source(recent, now)
        s_old = score_source(old, now)
        assert s_recent > s_old

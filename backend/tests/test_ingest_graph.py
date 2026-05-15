"""Tests for the Ingest graph (6-node chain).

Covers: validation, timestamp normalization, location normalization,
description sanitization, duplicate detection, persistence, and full
graph execution with trace-step accumulation.
"""

import pytest
from datetime import datetime, timezone

from app.flows.ingest_flow import (
    validate_input,
    normalize_timestamp,
    normalize_location,
    sanitize_description,
    assign_id,
    persist_incident,
    run_ingest,
)
from app.models.enums import IncidentStatus, IncidentType, SourceType
from app.models.incident import Coordinates, Incident
from app.models.requests import IngestRequest


# ═══════════════════════════════════════════════════════════════════
# 1. Validation
# ═══════════════════════════════════════════════════════════════════


class TestValidateInput:
    def test_empty_description_fails(self):
        body = IngestRequest(rawDescription="", sourceType=SourceType.PDF_REPORT)
        err = validate_input(body)
        assert err is not None
        assert err["code"] == "DESCRIPTION_REQUIRED"

    def test_short_description_fails(self):
        body = IngestRequest(rawDescription="too short", sourceType=SourceType.PDF_REPORT)
        err = validate_input(body)
        assert err is not None
        assert err["code"] == "DESCRIPTION_REQUIRED"

    def test_valid_description_passes(self):
        body = IngestRequest(
            rawDescription="A water main has burst near Jinnah Avenue causing flooding",
            sourceType=SourceType.CSV_JSON,
        )
        err = validate_input(body)
        assert err is None

    def test_exactly_ten_chars_passes(self):
        body = IngestRequest(rawDescription="0123456789", sourceType=SourceType.CSV_JSON)
        err = validate_input(body)
        assert err is None


# ═══════════════════════════════════════════════════════════════════
# 2. Timestamp normalization
# ═══════════════════════════════════════════════════════════════════


class TestNormalizeTimestamp:
    def test_valid_iso_returned_as_is(self):
        raw = "2026-05-18T08:32:00Z"
        norm, actual_raw = normalize_timestamp(raw)
        assert norm == raw
        assert actual_raw == raw

    def test_none_uses_system_time(self):
        norm, actual_raw = normalize_timestamp(None)
        # Both should be valid ISO; just check parse succeeds
        datetime.fromisoformat(norm.replace("Z", "+00:00"))
        assert actual_raw == norm

    def test_garbage_falls_back_to_system_time(self):
        norm, actual_raw = normalize_timestamp("not-a-date")
        datetime.fromisoformat(norm.replace("Z", "+00:00"))
        assert actual_raw == "not-a-date"
        assert norm != actual_raw


# ═══════════════════════════════════════════════════════════════════
# 3. Location normalization
# ═══════════════════════════════════════════════════════════════════


class TestNormalizeLocation:
    def test_raw_coordinates_used_directly(self, fresh_store):
        body = IngestRequest(
            rawDescription="Test incident with coordinates",
            sourceType=SourceType.PDF_REPORT,
            rawCoordinates={"lat": 33.7205, "lng": 73.0478},
        )
        coords, needs_clarification, _, conf = normalize_location(fresh_store, body)
        assert coords is not None
        assert coords.lat == 33.7205
        assert needs_clarification is False

    def test_no_coords_no_address_needs_clarification(self, fresh_store):
        body = IngestRequest(
            rawDescription="Test incident without any location",
            sourceType=SourceType.PDF_REPORT,
        )
        coords, needs_clarification, _, conf = normalize_location(fresh_store, body)
        assert coords is None
        assert needs_clarification is True


# ═══════════════════════════════════════════════════════════════════
# 4. Description sanitization
# ═══════════════════════════════════════════════════════════════════


class TestSanitizeDescription:
    def test_html_tags_stripped(self):
        raw = "<b>URGENT</b> water <i>main</i> burst <script>alert('x')</script>"
        clean = sanitize_description(raw)
        assert "<" not in clean
        assert ">" not in clean
        assert "URGENT" in clean

    def test_truncated_to_2000_chars(self):
        raw = "A" * 3000
        clean = sanitize_description(raw)
        assert len(clean) <= 2000

    def test_whitespace_collapsed(self):
        raw = "water   main    burst"
        clean = sanitize_description(raw)
        assert "   " not in clean


# ═══════════════════════════════════════════════════════════════════
# 5. ID assignment
# ═══════════════════════════════════════════════════════════════════


class TestAssignId:
    def test_increments_sequentially(self, fresh_store):
        id1 = assign_id(fresh_store)
        id2 = assign_id(fresh_store)
        assert id1.startswith("INC-")
        assert id2.startswith("INC-")
        assert id1 != id2

    def test_format_matches_pattern(self, fresh_store):
        inc_id = assign_id(fresh_store)
        parts = inc_id.split("-")
        assert parts[0] == "INC"
        assert len(parts) == 3


# ═══════════════════════════════════════════════════════════════════
# 6. Duplicate detection
# ═══════════════════════════════════════════════════════════════════


class TestDuplicateDetection:
    def test_same_desc_same_coords_within_10min_is_duplicate(self, fresh_store):
        body = IngestRequest(
            rawDescription="Water main burst at Market Quarter — significant flooding",
            sourceType=SourceType.CSV_JSON,
            rawCoordinates={"lat": 33.7185, "lng": 73.0512},
        )
        inc1, _, err1, dup1 = run_ingest(fresh_store, body)
        assert err1 is None
        assert dup1 is False

        inc2, _, err2, dup2 = run_ingest(fresh_store, body)
        assert err2 is None
        assert dup2 is True
        assert inc2.incidentId == inc1.incidentId

    def test_different_desc_same_coords_is_not_duplicate(self, fresh_store):
        body1 = IngestRequest(
            rawDescription="Water main burst at Market Quarter — flooding reported",
            sourceType=SourceType.CSV_JSON,
            rawCoordinates={"lat": 33.7185, "lng": 73.0512},
        )
        body2 = IngestRequest(
            rawDescription="Electrical fire at Market Quarter — smoke visible from distance",
            sourceType=SourceType.PDF_REPORT,
            rawCoordinates={"lat": 33.7185, "lng": 73.0512},
        )
        run_ingest(fresh_store, body1)
        _, _, err, dup = run_ingest(fresh_store, body2)
        assert err is None
        assert dup is False


# ═══════════════════════════════════════════════════════════════════
# 7. Persistence & status
# ═══════════════════════════════════════════════════════════════════


class TestPersistence:
    def test_incident_created_with_reported_status(self, fresh_store):
        body = IngestRequest(
            rawDescription="Power outage in Industrial Zone D-03 junction box",
            sourceType=SourceType.PDF_REPORT,
            rawCoordinates={"lat": 33.7145, "lng": 73.0432},
        )
        inc, trace, err, _ = run_ingest(fresh_store, body)
        assert err is None
        assert inc.status == IncidentStatus.REPORTED
        assert inc.incidentType == IncidentType.UNKNOWN  # pre-classification
        assert len(fresh_store.incidents) == 1

    def test_incident_stored_in_workspace(self, fresh_store):
        body = IngestRequest(
            rawDescription="Traffic accident on Central Flyover — truck collision",
            sourceType=SourceType.REALTIME_FEED,
            rawCoordinates={"lat": 33.7215, "lng": 73.052},
        )
        inc, _, _, _ = run_ingest(fresh_store, body)
        found = fresh_store.get_incident(inc.incidentId)
        assert found is not None
        assert found.incidentId == inc.incidentId


# ═══════════════════════════════════════════════════════════════════
# 8. Full graph execution with trace steps
# ═══════════════════════════════════════════════════════════════════


class TestFullIngestFlow:
    def test_run_ingest_produces_trace_steps(self, fresh_store):
        body = IngestRequest(
            rawDescription="Pipe burst near Market Quarter causing road flooding",
            sourceType=SourceType.CSV_JSON,
            rawCoordinates={"lat": 33.7185, "lng": 73.0512},
        )
        inc, trace, err, dup = run_ingest(fresh_store, body)
        assert err is None
        assert dup is False
        assert len(trace) >= 2  # At minimum: I01 (validate) + I02 (persist)

    def test_all_five_source_types_ingest_successfully(self, fresh_store):
        sources = [
            (SourceType.PDF_REPORT, "Electrical arcing in Junction Box 7 Industrial Zone"),
            (SourceType.WEB_ARTICLE, "Flash flooding along Market Street residents report"),
            (SourceType.CSV_JSON, "Severe pressure drop PIPE-MQ-14 major breach detected"),
            (SourceType.TABLE_DASHBOARD, "Main Boulevard congestion 74 percent five incidents"),
            (SourceType.REALTIME_FEED, "Truck accident on Central Flyover driver is injured"),
        ]
        for src, desc in sources:
            body = IngestRequest(rawDescription=desc, sourceType=src, rawCoordinates={"lat": 33.72, "lng": 73.05})
            inc, _, err, _ = run_ingest(fresh_store, body)
            assert err is None, f"Failed for {src}: {err}"
            assert inc.sourceType == src
        assert len(fresh_store.incidents) == 5

"""Tests for LLM factory, schemas, protocol, base retry, mock provider, and IDs.

These tests cover the infrastructure layer that Zain built:
  • LLM Factory — mock/gemini switching
  • LLM Schemas — ClassificationResult, ResolvedConflict, NotificationDrafts
  • LLM Protocol — MockLLMProvider satisfies the protocol
  • LLM Base — invoke_with_retry fallback behavior
  • IDs — sequence generation for INC, PLAN, SIM, TRACE
  • Config — settings loading
  • Workspace — WorkspaceStore CRUD operations
"""

import pytest
from datetime import datetime, timezone

from app.llm.factory import get_llm_provider, reset_provider
from app.llm.mock_provider import MockLLMProvider
from app.llm.protocol import LLMProvider
from app.llm.schemas import (
    ClassificationResult,
    ResolvedConflict,
    NotificationDrafts,
    ContradictionGroup,
)
from app.llm.base import invoke_with_retry, _is_non_retryable
from app.models.enums import IncidentType, Severity, SourceType, IncidentStatus
from app.models.incident import Incident
from app.services.ids import next_incident_id, next_plan_id, next_sim_id, next_trace_id


def _make_inc(
    inc_id: str, desc: str = "test", source: SourceType = SourceType.CSV_JSON
) -> Incident:
    now = datetime.now(timezone.utc).isoformat()
    return Incident(
        incidentId=inc_id,
        title=desc[:80],
        description=desc,
        rawDescription=desc,
        sourceType=source,
        sourceLabel="Test",
        status=IncidentStatus.REPORTED,
        createdAt=now,
        updatedAt=now,
    )


# ═══════════════════════════════════════════════════════════════════
# 1. LLM Factory
# ═══════════════════════════════════════════════════════════════════


class TestLLMFactory:
    def test_returns_mock_when_mock_flag_set(self, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "mock_llm", True)
        reset_provider()
        provider = get_llm_provider()
        assert isinstance(provider, MockLLMProvider)

    def test_returns_mock_when_api_key_missing(self, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "mock_llm", False)
        monkeypatch.setattr(settings, "google_api_key", "")
        reset_provider()
        provider = get_llm_provider()
        assert isinstance(provider, MockLLMProvider)

    def test_singleton_returns_same_instance(self):
        reset_provider()
        p1 = get_llm_provider()
        p2 = get_llm_provider()
        assert p1 is p2

    def test_reset_clears_singleton(self):
        reset_provider()
        p1 = get_llm_provider()
        reset_provider()
        p2 = get_llm_provider()
        assert p1 is not p2


# ═══════════════════════════════════════════════════════════════════
# 2. LLM Protocol compliance
# ═══════════════════════════════════════════════════════════════════


class TestLLMProtocol:
    def test_mock_provider_satisfies_protocol(self):
        provider = MockLLMProvider()
        assert isinstance(provider, LLMProvider)

    def test_mock_classify_returns_classification_result(self):
        provider = MockLLMProvider()
        inc = _make_inc("INC-P1", "water pipe burst near Market Quarter")
        result = provider.classify(inc)
        assert isinstance(result, ClassificationResult)
        assert result.incident_type == IncidentType.WATER_LEAK

    def test_mock_resolve_contradiction_returns_resolved_conflict(self):
        provider = MockLLMProvider()
        inc1 = _make_inc("INC-P2", "water pipe burst", SourceType.CSV_JSON)
        inc2 = _make_inc("INC-P3", "flooding", SourceType.WEB_ARTICLE)
        result = provider.resolve_contradiction([inc1, inc2])
        assert isinstance(result, ResolvedConflict)
        assert result.winning_incident_id in {"INC-P2", "INC-P3"}

    def test_mock_draft_notifications_returns_drafts(self):
        provider = MockLLMProvider()
        result = provider.draft_notifications("INC-P4", "water_leak")
        assert isinstance(result, NotificationDrafts)
        assert result.operator_alert != ""

    def test_mock_resolve_empty_list_raises(self):
        provider = MockLLMProvider()
        with pytest.raises(ValueError):
            provider.resolve_contradiction([])


# ═══════════════════════════════════════════════════════════════════
# 3. LLM Schemas
# ═══════════════════════════════════════════════════════════════════


class TestLLMSchemas:
    def test_classification_result_to_incident_dict(self):
        cr = ClassificationResult(
            incident_type=IncidentType.ACCIDENT,
            severity=Severity.CRITICAL,
            urgency_score=9,
            affected_radius=300,
            estimated_duration=120,
            reasoning="Vehicular collision with injuries.",
        )
        d = cr.to_incident_dict()
        assert d["incidentType"] == IncidentType.ACCIDENT
        assert d["severity"] == Severity.CRITICAL
        assert d["urgencyScore"] == 9
        assert d["affectedRadius"] == 300
        assert d["classificationRationale"] == "Vehicular collision with injuries."

    def test_resolved_conflict_to_legacy_dict(self):
        rc = ResolvedConflict(
            winning_incident_id="INC-WIN",
            conflict_type="type_mismatch",
            resolution={"incidentType": "water_leak"},
            confidence=0.85,
            rationale="Higher credibility source.",
            merged_incident_ids=["INC-A", "INC-B"],
        )
        d = rc.to_legacy_dict()
        assert d["conflictType"] == "type_mismatch"
        assert d["confidence"] == 0.85
        assert d["lowConfidenceResolution"] is False
        assert "INC-A" in d["mergedIncidentIds"]

    def test_notification_drafts_to_legacy_dict(self):
        nd = NotificationDrafts(
            operator_alert="ALERT: test",
            public_announcement="Disruption reported.",
            department_ticket="Dispatch needed.",
        )
        d = nd.to_legacy_dict()
        assert d["operator_alert"] == "ALERT: test"
        assert d["public_announcement"] == "Disruption reported."

    def test_classification_result_defaults(self):
        cr = ClassificationResult()
        assert cr.incident_type == IncidentType.OTHER
        assert cr.severity == Severity.MEDIUM
        assert cr.urgency_score == 5

    def test_contradiction_group_model(self):
        cg = ContradictionGroup(
            incident_ids=["INC-1", "INC-2"],
            distance_m=150.5,
            age_diff_minutes=25.0,
            conflict_reason="type_mismatch",
        )
        assert len(cg.incident_ids) == 2
        assert cg.distance_m == 150.5

    def test_low_confidence_flag(self):
        rc = ResolvedConflict(
            winning_incident_id="INC-X",
            confidence=0.4,
        )
        assert rc.low_confidence_resolution is False  # field default
        # But to_legacy_dict doesn't auto-compute it — it uses the field value
        d = rc.to_legacy_dict()
        assert d["lowConfidenceResolution"] is False


# ═══════════════════════════════════════════════════════════════════
# 4. LLM Base — invoke_with_retry
# ═══════════════════════════════════════════════════════════════════


class TestInvokeWithRetry:
    def test_success_on_first_try(self):
        result = invoke_with_retry(
            invoke_fn=lambda: ClassificationResult(incident_type=IncidentType.ACCIDENT),
            fallback_fn=lambda: ClassificationResult(),
        )
        assert result.incident_type == IncidentType.ACCIDENT

    def test_fallback_on_exception(self):
        def _fail():
            raise RuntimeError("LLM down")

        result = invoke_with_retry(
            invoke_fn=_fail,
            fallback_fn=lambda: ClassificationResult(incident_type=IncidentType.OTHER),
            retries=1,
        )
        assert result.incident_type == IncidentType.OTHER

    def test_non_retryable_errors_skip_retry(self):
        call_count = 0

        def _fail_auth():
            nonlocal call_count
            call_count += 1
            raise RuntimeError("UNAUTHENTICATED: bad key")

        invoke_with_retry(
            invoke_fn=_fail_auth,
            fallback_fn=ClassificationResult,
            retries=3,
        )
        assert call_count == 1  # should not retry on auth error

    def test_is_non_retryable_detects_429(self):
        assert _is_non_retryable(RuntimeError("429 Too Many Requests"))

    def test_is_non_retryable_detects_auth(self):
        assert _is_non_retryable(RuntimeError("UNAUTHENTICATED"))

    def test_is_non_retryable_allows_retry_on_server_error(self):
        assert not _is_non_retryable(RuntimeError("500 Internal Server Error"))


# ═══════════════════════════════════════════════════════════════════
# 5. IDs service
# ═══════════════════════════════════════════════════════════════════


class TestIdsService:
    def test_incident_id_format(self):
        seq = {}
        id1 = next_incident_id(seq)
        assert id1.startswith("INC-")
        parts = id1.split("-")
        assert len(parts) == 3
        assert parts[2] == "0001"

    def test_sequential_increment(self):
        seq = {}
        id1 = next_incident_id(seq)
        id2 = next_incident_id(seq)
        assert id1 != id2
        assert id2.endswith("0002")

    def test_plan_id_format(self):
        seq = {}
        pid = next_plan_id(seq)
        assert pid.startswith("PLAN-")

    def test_sim_id_format(self):
        seq = {}
        sid = next_sim_id(seq)
        assert sid.startswith("SIM-")

    def test_trace_id_format(self):
        seq = {}
        tid = next_trace_id(seq)
        assert tid.startswith("TRACE-")

    def test_independent_sequences(self):
        seq = {}
        next_incident_id(seq)
        next_incident_id(seq)
        next_plan_id(seq)
        assert seq["INC"] == 2
        assert seq["PLAN"] == 1
        assert seq.get("SIM") is None


# ═══════════════════════════════════════════════════════════════════
# 6. WorkspaceStore CRUD
# ═══════════════════════════════════════════════════════════════════


class TestWorkspaceStore:
    def test_load_city_data(self, fresh_store):
        assert fresh_store.city_name == "NovaCivitas"
        assert len(fresh_store.departments) > 0
        assert len(fresh_store.resources) > 0
        assert len(fresh_store.road_segments) > 0

    def test_upsert_creates_new(self, fresh_store):
        inc = _make_inc("INC-NEW-001", "test incident")
        fresh_store.upsert_incident(inc)
        assert len(fresh_store.incidents) == 1
        assert fresh_store.get_incident("INC-NEW-001") is not None

    def test_upsert_updates_existing(self, fresh_store):
        inc = _make_inc("INC-UPD-001", "original")
        fresh_store.upsert_incident(inc)
        inc.description = "updated"
        fresh_store.upsert_incident(inc)
        assert len(fresh_store.incidents) == 1
        assert fresh_store.get_incident("INC-UPD-001").description == "updated"

    def test_get_nonexistent_returns_none(self, fresh_store):
        assert fresh_store.get_incident("INC-FAKE") is None

    def test_get_plan_returns_none_for_unknown(self, fresh_store):
        assert fresh_store.get_plan("PLAN-FAKE") is None

    def test_snapshot_is_deep_copy(self, fresh_store):
        inc = _make_inc("INC-SNAP", "snapshot test")
        fresh_store.upsert_incident(inc)
        snapshot = fresh_store.snapshot_city_state()
        fresh_store.incidents.clear()
        assert len(snapshot.incidents) == 1

    def test_open_incidents_filter(self, fresh_store):
        inc1 = _make_inc("INC-OPEN-1", "open")
        inc2 = _make_inc("INC-CLOSED-1", "closed")
        inc2.status = IncidentStatus.RESOLVED
        fresh_store.upsert_incident(inc1)
        fresh_store.upsert_incident(inc2)
        open_incs = fresh_store.get_open_incidents()
        assert len(open_incs) == 1
        assert open_incs[0].incidentId == "INC-OPEN-1"

    def test_append_trace(self, fresh_store):
        fresh_store.append_trace({"test": "entry"})
        assert len(fresh_store.trace_log) == 1

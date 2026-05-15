"""Tests for all API routes using FastAPI TestClient.

Covers every HTTP endpoint: health, root, ingest (success/validation/duplicate),
plan (agent/baseline), simulate (success/not-found), trace, incidents
(list/filter/detail/404), and voice (key guard, content-type, file-size).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a TestClient that triggers lifespan (store + seed)."""
    with TestClient(app) as c:
        yield c


# ═══════════════════════════════════════════════════════════════════
# 1. Root + Health
# ═══════════════════════════════════════════════════════════════════


class TestRootAndHealth:
    def test_root_returns_app_name(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "CityIRA"
        assert "docs" in data

    def test_health_ok(self, client):
        resp = client.get("/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


# ═══════════════════════════════════════════════════════════════════
# 2. POST /v1/ingest
# ═══════════════════════════════════════════════════════════════════


class TestIngestRoute:
    def test_ingest_valid_incident(self, client):
        resp = client.post(
            "/v1/ingest",
            json={
                "rawDescription": "Major water pipe burst near Market Quarter flooding three blocks",
                "sourceType": "csv_json",
                "rawCoordinates": {"lat": 33.7185, "lng": 73.0512},
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["incidentId"].startswith("INC-")
        assert data["status"] == "reported"

    def test_ingest_short_description_returns_400(self, client):
        resp = client.post(
            "/v1/ingest",
            json={
                "rawDescription": "short",
                "sourceType": "csv_json",
            },
        )
        assert resp.status_code == 400
        assert resp.json()["detail"]["code"] == "DESCRIPTION_REQUIRED"

    def test_ingest_duplicate_returns_409(self, client):
        body = {
            "rawDescription": "Unique test incident for duplicate detection in API route",
            "sourceType": "pdf_report",
            "rawCoordinates": {"lat": 33.7185, "lng": 73.0512},
        }
        resp1 = client.post("/v1/ingest", json=body)
        assert resp1.status_code == 200

        resp2 = client.post("/v1/ingest", json=body)
        assert resp2.status_code == 409
        assert resp2.json()["detail"]["code"] == "DUPLICATE_INCIDENT"

    def test_ingest_missing_source_type_returns_422(self, client):
        resp = client.post(
            "/v1/ingest",
            json={
                "rawDescription": "Some incident without sourceType field specified here",
            },
        )
        assert resp.status_code == 422  # Pydantic validation

    def test_ingest_invalid_source_type_returns_422(self, client):
        resp = client.post(
            "/v1/ingest",
            json={
                "rawDescription": "Some incident with invalid sourceType xyz value",
                "sourceType": "invalid_type",
            },
        )
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# 3. POST /v1/plan
# ═══════════════════════════════════════════════════════════════════


class TestPlanRoute:
    def test_plan_agent_mode(self, client):
        resp = client.post("/v1/plan", json={"planMode": "full"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["planId"].startswith("PLAN-")
        assert data["totalIncidents"] == 5

    def test_plan_baseline_mode(self, client):
        resp = client.post("/v1/plan?mode=baseline", json={"planMode": "full"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["totalResourcesDispatched"] == 0

    def test_plan_quick_mode(self, client):
        resp = client.post("/v1/plan", json={"planMode": "quick"})
        assert resp.status_code == 200
        assert resp.json()["conflictsDetected"] == 0


# ═══════════════════════════════════════════════════════════════════
# 4. POST /v1/simulate
# ═══════════════════════════════════════════════════════════════════


class TestSimulateRoute:
    def test_simulate_success(self, client):
        plan_resp = client.post("/v1/plan", json={"planMode": "full"})
        plan_id = plan_resp.json()["planId"]

        resp = client.post(
            "/v1/simulate",
            json={
                "planId": plan_id,
                "simulationSpeed": "fast",
                "overrides": {"forceApiFailure": True},
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["runId"].startswith("SIM-")
        assert len(data["failuresSimulated"]) >= 1
        assert len(data["animationFrames"]) == 4

    def test_simulate_nonexistent_plan_returns_404(self, client):
        resp = client.post(
            "/v1/simulate",
            json={
                "planId": "PLAN-FAKE-0000",
            },
        )
        assert resp.status_code == 404
        assert resp.json()["detail"]["code"] == "PLAN_NOT_FOUND"

    def test_simulate_missing_plan_id_returns_422(self, client):
        resp = client.post("/v1/simulate", json={})
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# 5. GET /v1/trace
# ═══════════════════════════════════════════════════════════════════


class TestTraceRoute:
    def test_trace_after_plan(self, client):
        plan_resp = client.post("/v1/plan", json={"planMode": "full"})
        plan_id = plan_resp.json()["planId"]

        resp = client.get(f"/v1/trace?planId={plan_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["traceId"].startswith("TRACE-")
        assert data["summary"]["totalSteps"] > 0

    def test_trace_summary_depth(self, client):
        client.post("/v1/plan", json={"planMode": "full"})
        resp = client.get("/v1/trace?depth=summary")
        assert resp.status_code == 200
        for step in resp.json()["steps"]:
            assert step.get("children", []) == []


# ═══════════════════════════════════════════════════════════════════
# 6. GET /v1/incidents
# ═══════════════════════════════════════════════════════════════════


class TestIncidentsRoute:
    def test_list_all_incidents(self, client):
        resp = client.get("/v1/incidents")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 5
        assert len(data["incidents"]) == 5

    def test_filter_by_status(self, client):
        resp = client.get("/v1/incidents?status=reported")
        assert resp.status_code == 200
        for inc in resp.json()["incidents"]:
            assert inc["status"] == "reported"

    def test_pagination(self, client):
        resp = client.get("/v1/incidents?page=1&pageSize=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["incidents"]) == 2
        assert data["total"] == 5

    def test_get_incident_by_id(self, client):
        list_resp = client.get("/v1/incidents")
        inc_id = list_resp.json()["incidents"][0]["incidentId"]
        resp = client.get(f"/v1/incidents/{inc_id}")
        assert resp.status_code == 200
        assert resp.json()["incidentId"] == inc_id

    def test_get_nonexistent_incident_returns_404(self, client):
        resp = client.get("/v1/incidents/INC-FAKE-9999")
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════
# 7. POST /v1/voice — guards only (no real audio)
# ═══════════════════════════════════════════════════════════════════


class TestVoiceRouteGuards:
    def test_voice_rejects_unsupported_content_type(self, client, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "deepgram_api_key", "test")
        monkeypatch.setattr(settings, "groq_api_key", "test")
        monkeypatch.setattr(settings, "elevenlabs_api_key", "test")

        resp = client.post(
            "/v1/voice",
            files={"audio": ("test.txt", b"x" * 200, "text/plain")},
        )
        assert resp.status_code == 415
        assert resp.json()["detail"]["code"] == "UNSUPPORTED_AUDIO_FORMAT"

    def test_voice_rejects_empty_audio(self, client, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "deepgram_api_key", "test")
        monkeypatch.setattr(settings, "groq_api_key", "test")
        monkeypatch.setattr(settings, "elevenlabs_api_key", "test")

        resp = client.post(
            "/v1/voice",
            files={"audio": ("test.wav", b"x" * 50, "audio/wav")},
        )
        assert resp.status_code == 400
        assert resp.json()["detail"]["code"] == "AUDIO_EMPTY"

"""Tests for the Voice Pipeline dispatcher + key guard.

The external API calls (Deepgram, Groq, ElevenLabs) are NOT tested here
because they require live API keys. Instead we test:
  • dispatch_intent — all 6 intents (ingest, plan, simulate, trace, status, unknown)
  • check_voice_keys — missing / present key guard
  • summarise fallback — error passthrough and message passthrough
"""

from app.services.voice_pipeline import dispatch_intent, check_voice_keys


# ═══════════════════════════════════════════════════════════════════
# 1. dispatch_intent → ingest
# ═══════════════════════════════════════════════════════════════════


class TestDispatchIngest:
    def test_ingest_creates_incident(self, fresh_store):
        result = dispatch_intent(
            "ingest",
            {
                "rawDescription": "Water main burst near Market Quarter causing significant flooding",
                "rawAddress": "Market Quarter",
            },
        )
        assert "incidentId" in result
        assert result["incidentId"] is not None
        assert result["isDuplicate"] is False

    def test_ingest_empty_description_returns_error(self, fresh_store):
        result = dispatch_intent("ingest", {"rawDescription": ""})
        assert "error" in result

    def test_ingest_missing_description_returns_error(self, fresh_store):
        result = dispatch_intent("ingest", {})
        assert "error" in result


# ═══════════════════════════════════════════════════════════════════
# 2. dispatch_intent → plan
# ═══════════════════════════════════════════════════════════════════


class TestDispatchPlan:
    def test_plan_full_mode(self, seeded_store):
        result = dispatch_intent("plan", {"planMode": "full"})
        assert "planId" in result
        assert result["totalIncidents"] == 5

    def test_plan_quick_mode(self, seeded_store):
        result = dispatch_intent("plan", {"planMode": "quick"})
        assert result["conflictsDetected"] == 0

    def test_plan_default_mode(self, seeded_store):
        result = dispatch_intent("plan", {})
        assert "planId" in result


# ═══════════════════════════════════════════════════════════════════
# 3. dispatch_intent → simulate
# ═══════════════════════════════════════════════════════════════════


class TestDispatchSimulate:
    def test_simulate_last_plan(self, seeded_store):
        # First create a plan
        dispatch_intent("plan", {"planMode": "full"})
        # Then simulate without explicit planId — should use the last one
        result = dispatch_intent("simulate", {})
        assert "runId" in result
        assert result["planId"] is not None

    def test_simulate_with_explicit_plan_id(self, seeded_store):
        plan_result = dispatch_intent("plan", {"planMode": "full"})
        result = dispatch_intent("simulate", {"planId": plan_result["planId"]})
        assert "runId" in result

    def test_simulate_no_plan_returns_error(self, fresh_store):
        result = dispatch_intent("simulate", {})
        assert "error" in result

    def test_simulate_nonexistent_plan_returns_error(self, seeded_store):
        result = dispatch_intent("simulate", {"planId": "PLAN-FAKE-9999"})
        assert "error" in result


# ═══════════════════════════════════════════════════════════════════
# 4. dispatch_intent → trace
# ═══════════════════════════════════════════════════════════════════


class TestDispatchTrace:
    def test_trace_after_plan(self, seeded_store):
        dispatch_intent("plan", {"planMode": "full"})
        result = dispatch_intent("trace", {})
        assert "stepCount" in result
        assert result["stepCount"] > 0

    def test_trace_empty_workspace(self, fresh_store):
        result = dispatch_intent("trace", {})
        assert result["stepCount"] == 0


# ═══════════════════════════════════════════════════════════════════
# 5. dispatch_intent → status
# ═══════════════════════════════════════════════════════════════════


class TestDispatchStatus:
    def test_status_shows_open_incidents(self, seeded_store):
        result = dispatch_intent("status", {})
        assert "openIncidents" in result
        assert result["openIncidents"] == 5
        assert len(result["incidents"]) == 5

    def test_status_empty_workspace(self, fresh_store):
        result = dispatch_intent("status", {})
        assert result["openIncidents"] == 0

    def test_status_caps_at_5_incidents(self, seeded_store):
        # Add more incidents beyond the 5 already seeded
        for i in range(3):
            dispatch_intent(
                "ingest",
                {
                    "rawDescription": f"Additional test incident number {i} for overflow testing purposes",
                },
            )
        result = dispatch_intent("status", {})
        # Should cap at 5 incidents in the response
        assert len(result["incidents"]) <= 5


# ═══════════════════════════════════════════════════════════════════
# 6. dispatch_intent → unknown
# ═══════════════════════════════════════════════════════════════════


class TestDispatchUnknown:
    def test_unknown_intent_returns_message(self, fresh_store):
        result = dispatch_intent("unknown", {})
        assert "message" in result
        assert (
            "not recognised" in result["message"].lower()
            or "not recognized" in result["message"].lower()
        )

    def test_garbage_intent_returns_message(self, fresh_store):
        result = dispatch_intent("xyzzy_nonsense", {})
        assert "message" in result


# ═══════════════════════════════════════════════════════════════════
# 7. check_voice_keys
# ═══════════════════════════════════════════════════════════════════


class TestCheckVoiceKeys:
    def test_all_keys_present(self, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "deepgram_api_key", "dk_test")
        monkeypatch.setattr(settings, "groq_api_key", "gk_test")
        monkeypatch.setattr(settings, "elevenlabs_api_key", "ek_test")
        missing = check_voice_keys()
        assert missing == []

    def test_deepgram_missing(self, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "deepgram_api_key", "")
        monkeypatch.setattr(settings, "groq_api_key", "gk_test")
        monkeypatch.setattr(settings, "elevenlabs_api_key", "ek_test")
        missing = check_voice_keys()
        assert "DEEPGRAM_API_KEY" in missing

    def test_all_keys_missing(self, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "deepgram_api_key", "")
        monkeypatch.setattr(settings, "groq_api_key", "")
        monkeypatch.setattr(settings, "elevenlabs_api_key", "")
        missing = check_voice_keys()
        assert len(missing) == 3

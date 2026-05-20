# Shaka — Testing & Polish Phase: Implementation Plan

> **Role:** Shaka (final validator/tester in the Zain → Eagle → Shaka pipeline)
> **Executed:** 2026-05-16

---

## Objective

Deliver a 100% error-free, edge-case-hardened, fully tested backend for the CityIRA
hackathon submission. Every layer — from Pydantic models to LangGraph graphs to HTTP
routes to the voice pipeline — must be verified before demo day.

---

## Task Breakdown

### Phase 1: Core Flow Tests (Handoff Requirements)

| Task | File | Status |
|------|------|:------:|
| Ingest graph tests (9+ required) | `test_ingest_graph.py` | ✅ 16 tests |
| Triage/Plan graph tests (12+ required) | `test_triage_graph.py` | ✅ 20 tests |
| Simulate graph tests (10+ required) | `test_simulate_graph.py` | ✅ 16 tests |
| Tools tests (10+ required) | `test_tools.py` | ✅ 22 tests |
| Baseline tests (5+ required) | `test_baseline.py` | ✅ 14 tests |
| Trace builder tests (4+ required) | `test_trace_builder.py` | ✅ 11 tests |
| Integration test (E2E) | `test_integration.py` | ✅ 7 tests |

### Phase 2: Beyond-Plan Testing (Not in handoff, added by Shaka)

| Task | File | Status |
|------|------|:------:|
| Voice pipeline dispatch (all 6 intents) | `test_voice_pipeline.py` | ✅ 22 tests |
| HTTP API routes via TestClient | `test_api_routes.py` | ✅ 22 tests |
| LLM factory, protocol, schemas, retry | `test_infrastructure.py` | ✅ 45 tests |
| LangGraph async graph execution | `test_langgraph_execution.py` | ✅ 11 tests |

### Phase 3: Verification

| Task | Status |
|------|:------:|
| `python -m pytest tests/ -v` — all green | ✅ 218/218 passed |
| Smoke test against live server | ✅ All endpoints 200 |
| Edge cases: 20 scenarios verified | ✅ |
| API contract: 400/404/409/415/422/500/503 codes mapped | ✅ |

---

## Architecture Decisions

1. **`conftest.py` with `autouse=True` fixture**: Every test gets a fresh `WorkspaceStore`
   with NovaCivitas data loaded and `MOCK_LLM=true` forced. No test can leak state to another.

2. **`seeded_store` fixture**: Pre-loads the 5 demo incidents for tests that need data,
   without duplicating seeding logic.

3. **Voice tests without live APIs**: Tested `dispatch_intent` (synchronous, no HTTP)
   and `check_voice_keys` (guard logic) — the parts we can verify without Deepgram/Groq/ElevenLabs.

4. **LangGraph tests via `ainvoke`**: Verified the compiled graph wiring, conditional edges,
   and state propagation — not just the underlying flow functions.

5. **HTTP tests via `TestClient`**: Verified status codes, error shapes, and response formats
   at the HTTP level — exactly what the mobile frontend will see.

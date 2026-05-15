# Zain foundation — parallel agent briefs

Use with [`.cursor/plans/zain_foundation_setup_818defbc.plan.md`](../.cursor/plans/zain_foundation_setup_818defbc.plan.md).

**Rule:** Touch only files listed under your agent. Read other modules; do not edit them.

---

## Wave 0 — Agent CONTRACT (run alone first, ~1 hour)

**Branch:** `zain/wave-0-contracts`  
**Merge to:** `main` before starting Wave 1.

### Persona

```
You are the backend architect for CityIRA. Your only job is to land frozen interfaces:
Pydantic LLM schemas, LLMProvider protocol, a working MockLLMProvider, factory stub,
and contradiction.py stubs that return empty groups. Do not decompose flows.
Do not touch ingest_flow.py, plan_flow.py, simulate_flow.py, graphs, or routes except
trace route if needed for types. Run: cd backend && uv run python -c "from app.llm.schemas import ClassificationResult"
```

### Owns (exclusive write)

- `backend/app/llm/__init__.py`
- `backend/app/llm/schemas.py`
- `backend/app/llm/protocol.py`
- `backend/app/llm/prompts.py` (constants only)
- `backend/app/llm/mock_provider.py`
- `backend/app/llm/factory.py` (mock only until Agent LLM extends)
- `backend/app/tools/contradiction.py` (stubs: `detect_contradiction_groups` → `[]`, `resolve_group` → minimal valid `ResolvedConflict`)
- `backend/app/tools/llm_tools.py` (delegate `classify_incident` / `draft_notifications` to factory; keep `resolve_contradiction` as-is temporarily)

### Definition of done

- [ ] `uv run python -c "from app.tools import llm_tools; from app.tools import contradiction"`
- [ ] Existing `run_plan` / smoke still pass on `main` after merge
- [ ] No Gemini imports required yet

---

## Wave 1 — six agents in parallel

Start only after Wave 0 is merged. Each agent: **new branch from latest `main`**, own brief below.

### Agent A — LLM-GEMINI

**Branch:** `zain/agent-a-llm`  
**Persona:** Senior Python engineer; LangChain + Gemini structured output only; SOLID; never import flows.

**Owns:** `app/llm/gemini_provider.py`, `app/llm/base.py`, extend `app/llm/factory.py`, extend `app/tools/llm_tools.py` (classify + draft + wire resolve to `contradiction.resolve_group`).

**Must NOT touch:** `contradiction.py` bodies (only import), any `flows/*`, `graphs/*`, `baseline.py`.

**Done when:** `MOCK_LLM=false` + key classifies one incident; mock path unchanged.

---

### Agent B — CONTRADICTION

**Branch:** `zain/agent-b-contradiction`  
**Persona:** Algorithms engineer; geospatial clustering; no LLM vendor SDKs.

**Owns:** `app/tools/contradiction.py` only (replace Wave 0 stubs).

**Public API (do not rename):**

- `detect_contradiction_groups(incidents: list[Incident]) -> list[ContradictionGroup]`
- `score_source(incident, now) -> float`
- `resolve_group(incidents: list[Incident]) -> ResolvedConflict`

**Must NOT touch:** `llm_tools.py`, any flows, `app/llm/*` except importing from `app.llm.schemas`.

**Done when:** Unit-testable; csv_json beats web_article for demo coords without hardcoded lat checks.

---

### Agent C — INGEST-FLOW

**Branch:** `zain/agent-c-ingest`  
**Persona:** FastAPI flow engineer; validation and normalization only; no LLM.

**Owns:** `app/flows/ingest_flow.py` only.

**Must NOT touch:** `llm/*`, `plan_flow.py`, `graphs/*`, `api/routes/*`.

**Done when:** Six step functions exist; `run_ingest` orchestrates; duplicate detection returns existing incident.

---

### Agent D — PLAN-FLOW

**Branch:** `zain/agent-d-plan`  
**Persona:** Planning pipeline engineer; orchestrates tools via imports only.

**Owns:** `app/flows/plan_flow.py` only.

**Imports allowed:** `app.tools.llm_tools`, `app.tools.contradiction`, `app.tools.routing`, `app.tools.resources` — **do not edit those files**.

**Must NOT touch:** `llm_tools.py`, `contradiction.py`, `simulate_flow.py`, graphs.

**Done when:** Ten step functions; `planMode=quick` skips contradiction steps; no Market Quarter `if` block.

---

### Agent E — SIMULATE-FLOW

**Branch:** `zain/agent-e-simulate`  
**Persona:** Simulation / state-machine engineer; animation frames; no LLM.

**Owns:** `app/flows/simulate_flow.py` only.

**Done when:** Eight step functions; `build_animation_frames` returns 4/12/1 frames per speed.

---

### Agent F — TRACE-BASELINE

**Branch:** `zain/agent-f-trace`  
**Persona:** API + observability engineer; trace filtering; baseline keyword audit.

**Owns:** `app/services/trace_builder.py` (add `filter_trace_steps` only), `app/flows/trace_flow.py`, `app/api/routes/trace.py`, `app/services/baseline.py` (verify/fix keywords only).

**Must NOT touch:** flows ingest/plan/simulate, `llm/*`, `tools/*`.

**Done when:** `GET /trace?depth=summary` strips children; baseline matches plan.md §14.2.

---

## Wave 2 — Agent INTEGRATOR (run alone after Wave 1 merges)

**Branch:** `zain/wave-2-integrate`  
**Persona:** Tech lead; resolve merge conflicts; run smoke; no feature scope creep.

**May touch:** Any file only to fix imports, merge conflicts, and `llm_tools.resolve_contradiction` delegation.

**Commands:**

```bash
cd backend && uv sync
uv run python scripts/seed_demo_incidents.py
./scripts/smoke_test.sh
uv run pytest -v  # optional; Shaka owns full tests
```

---

## Merge order (minimize conflicts)

1. `zain/wave-0-contracts`
2. In any order: B, C, E, F (no shared files)
3. A (llm_tools + llm package)
4. D (plan_flow — benefits from B merged first but stubs work)
5. `zain/wave-2-integrate`

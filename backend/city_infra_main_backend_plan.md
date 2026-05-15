# CityIRA Backend — Developer Handoff (3-Person Sequential)

> **Project:** CityIRA (City Incident-to-Response Routing Agent)  
> **Hackathon:** Google Antigravity Challenge 1  
> **Stack:** FastAPI + LangGraph + Gemini (Python 3.11+)  
> **Single source of truth:** `plan.md` — read before any feature work

---

## Current State

The backend scaffold is **complete** — all routes, graphs, flows, models, tools, services, and workspace state exist. But:

| Layer | Status |
|-------|--------|
| Models (Pydantic schemas) | ✅ Done |
| Workspace state store | ✅ Done |
| Services (ids, baseline, trace_builder) | ✅ Done |
| Tools (llm, geo, routing, resources) | ⚠️ Mock-only, needs real LLM |
| Flows (ingest, plan, simulate, trace) | ⚠️ Single-node stubs |
| Graphs (LangGraph) | ⚠️ Single-node stubs |
| Routes (FastAPI) | ⚠️ Basic, no error handling |
| Tests | ❌ 1 health test only |
| Edge cases | ❌ None implemented |
| Animation frames | ❌ Not generated |

---

## Sequence: Zain → Eagle → Shaka

Each person's output is the next person's input. No parallel work — clean handoffs.

```
Zain (Foundation) ──► Eagle (Graphs + Intelligence) ──► Shaka (Tests + Polish)
   tools, flows,       multi-node graphs,                all tests, edge cases,
   services,           real LLM, contradiction,          API contract, smoke test
   data layer          animation frames                  duplicate detection
```

---

## ZAIN — Foundation (Build the Building Blocks)

**Goal:** Make tools, flows, and services production-ready. Eagle's graphs depend on these.

### Task 1: Wire Real Gemini LLM

**File:** `backend/app/tools/llm_tools.py`

Currently all LLM tools are mock keyword-matching. Wire real Gemini via `langchain-google-genai` with structured Pydantic output.

**Requirements:**
- Use `GOOGLE_API_KEY` from `.env`
- `IncidentClassifierTool`: temperature 0.2, output `ClassificationResult` Pydantic model
- `ContradictionResolverTool`: temperature 0.2, output `ResolvedConflict` Pydantic model  
- `NotificationDraftTool`: temperature 0.4, output `NotificationDrafts` Pydantic model
- Keep mock fallback when `MOCK_LLM=true` or no API key (current `_mock_*` functions stay)
- On parse failure: retry once, then apply fallback defaults

**System prompts** (plan.md §4.10.4):
- Classifier: "You are a city operations analyst for NovaCivitas. Classify from description + source metadata. Prefer causal mechanism over symptoms (pipe breach vs surface flooding)."
- Resolver: "You are an evidence evaluator. Score sources using credibility table and recency. Output JSON only."
- Notification: "Three audiences: operator (technical), public (plain, ≤280 chars), department (actionable ticket)."

### Task 2: Implement Proper Contradiction Detection Logic

**File:** `backend/app/tools/llm_tools.py` (resolve_contradiction function)

Replace hardcoded Market Quarter check with real algorithm:

1. Score each source using credibility table (plan.md §4.10.1):
   - `csv_json` = 0.95, `pdf_report` = 0.90, `table_dashboard` = 0.85, `realtime_feed` = 0.80, `web_article` = 0.70
2. Recency: `recencyScore = exp(-ageMinutes / 30)` (half-life ~21 min)
3. Combined: `credibility = 0.6 * sourceWeight + 0.4 * recencyScore`
4. Higher-credibility source wins; return `ResolvedConflict` with rationale
5. If confidence < 0.6 → flag `lowConfidenceResolution` but still proceed

### Task 3: Rewrite `flows/ingest_flow.py` as Multi-Step Pipeline

**File:** `backend/app/flows/ingest_flow.py`

Currently a single `run_ingest()` function. Break it into discrete steps that Eagle's graph nodes will call:

```python
def validate_input(body: IngestRequest) -> ApiError | None
def normalize_timestamp(raw: str | None) -> tuple[str, str]  # (normalized, raw)
def normalize_location(store, body) -> tuple[Coordinates | None, bool, str | None, float]
def sanitize_description(raw: str) -> str
def assign_id(store) -> str
def persist_incident(store, incident) -> Incident | None  # with duplicate check
```

**Duplicate detection** (plan.md §4.1.8):
- If incident with identical description AND coordinates created within last 10 minutes → return existing incident ID
- Return `isDuplicate=true` flag so route handler can map to HTTP 409

**Timestamp normalization:**
- Parse ISO `rawTimestamp` or use `utcnow()`
- If unparseable → log warning, use system time
- Store both raw and normalized values

### Task 4: Rewrite `flows/plan_flow.py` as Multi-Step Pipeline

**File:** `backend/app/flows/plan_flow.py`

Break into discrete functions that Eagle's graph nodes will call:

```python
def fetch_open_incidents(store, incident_ids) -> list[Incident]
def classify_incidents(store, incidents) -> dict[str, ClassificationResult]
def detect_contradictions(incidents) -> list[ContradictionGroup]  # 200m + 60min window
def resolve_contradictions(groups) -> dict[str, ResolvedConflict]
def route_and_match(store, incidents, classifications, resolutions) -> dict
def build_chains(incidents, classifications, resources) -> list[IncidentPlan]
def check_constraints(plans, max_budget, max_minutes) -> list[ConstraintViolation]
def draft_all_notifications(plans) -> None
def prioritize(plans) -> list[IncidentPlan]  # urgencyScore × severityMult × sourceCred
def persist_plan(store, plans) -> PlanSummary
```

**Priority formula** (plan.md §4.7):
```
priorityScore = urgencyScore * severityMultiplier * sourceCredibilityWeight
severityMultiplier: critical=4, high=3, medium=2, low=1
sourceCredibilityWeight: csv_json=1.0, pdf_report=0.95, table_dashboard=0.9,
                         realtime_feed=0.85, web_article=0.75
```

### Task 5: Rewrite `flows/simulate_flow.py` as Multi-Step Pipeline

**File:** `backend/app/flows/simulate_flow.py`

Break into discrete functions:

```python
def load_plan(store, plan_id) -> PlanSummary
def capture_before_state(store) -> CityState
def execute_action_chains(store, plan, actions) -> list[SimulatedAction]
def inject_failure_and_retry(store, plan, actions) -> list[FailureRecord]
def capture_after_state(store) -> CityState
def compute_metrics(before, after, actions) -> dict
def build_animation_frames(before, after, actions, speed) -> list[dict]
def persist_simulation(store, run) -> SimulationRun
```

**Animation frames** (plan.md §4.8):
- `fast` = 4 frames, `realtime` = 12 frames, `instant` = 1 frame
- Crew positions interpolate from `homeBase` → incident coordinates
- Road status transitions: open → restricted → closed
- Incident status transitions through lifecycle

### Task 6: Rewrite `flows/trace_flow.py`

**File:** `backend/app/flows/trace_flow.py`

- Implement `depth=summary` vs `depth=full` filtering
- `summary` → return only top-level steps without children
- `full` → return complete tree (current default)

### Task 7: Update `services/baseline.py`

**File:** `backend/app/services/baseline.py`

- Ensure keyword routing matches plan.md §14.2 exactly
- Add trace entry for baseline plan (currently exists, verify it's correct)

### Zain's Checklist

- [ ] `tools/llm_tools.py` — real Gemini wired, mock fallback intact, 3 LLM tools
- [ ] Contradiction detection — credibility table + recency formula + confidence scoring
- [ ] `flows/ingest_flow.py` — 6 discrete step functions + duplicate detection
- [ ] `flows/plan_flow.py` — 10 discrete step functions + priority formula
- [ ] `flows/simulate_flow.py` — 8 discrete step functions + animation frames
- [ ] `flows/trace_flow.py` — depth parameter implemented
- [ ] `services/baseline.py` — verified against plan.md §14
- [ ] Run `scripts/smoke_test.sh` — must still pass with refactored flows

---

## EAGLE — Graphs + Intelligence (Build on Zain's Foundation)

**Prerequisite:** Zain's Phase 1 must be merged first. Eagle uses Zain's discrete flow functions as graph nodes.

### Task 1: Create `nodes/` Directory

**Location:** `backend/app/nodes/`

Create `__init__.py` and three node modules. Each node wraps one of Zain's flow functions and appends a trace step.

#### `nodes/ingest_nodes.py`
Each node function signature: `def node_name(state: IngestState) -> IngestState`

| Node | Wraps Zain's Function | Trace Step |
|------|----------------------|------------|
| `validate_input` | `validate_input()` | `state_update` — pass/fail |
| `normalize_timestamp` | `normalize_timestamp()` | `state_update` — warning if fallback |
| `normalize_location` | `normalize_location()` | `state_update` — coords or clarification |
| `sanitize_description` | `sanitize_description()` | `state_update` |
| `assign_id` | `assign_id()` | `state_update` |
| `persist_incident` | `persist_incident()` | `state_update` — incidentId |

#### `nodes/triage_nodes.py`
Each node: `def node_name(state: PlanState) -> PlanState`

| Node | Wraps Zain's Function | LLM? | Trace Type |
|------|----------------------|------|------------|
| `fetch_open_incidents` | `fetch_open_incidents()` | No | `state_update` |
| `classify_incidents` | `classify_incidents()` | Yes | `llm_call` |
| `detect_contradictions` | `detect_contradictions()` | No | `decision` |
| `resolve_contradictions` | `resolve_contradictions()` | Yes | `llm_call` + `decision` |
| `route_and_match` | `route_and_match()` | No | `tool_call` |
| `build_chains` | `build_chains()` | No | `state_update` |
| `check_constraints` | `check_constraints()` | No | `decision` |
| `draft_notifications` | `draft_all_notifications()` | Yes | `llm_call` |
| `prioritize` | `prioritize()` | No | `state_update` |
| `persist_plan` | `persist_plan()` | No | `state_update` |

#### `nodes/simulate_nodes.py`
Each node: `def node_name(state: SimulateState) -> SimulateState`

| Node | Wraps Zain's Function | Trace Type |
|------|----------------------|------------|
| `load_plan` | `load_plan()` | `state_update` |
| `capture_before` | `capture_before_state()` | `state_update` |
| `execute_chains` | `execute_action_chains()` | `state_update` |
| `inject_failure` | `inject_failure_and_retry()` | `error` |
| `capture_after` | `capture_after_state()` | `state_update` |
| `compute_metrics` | `compute_metrics()` | `state_update` |
| `build_frames` | `build_animation_frames()` | `state_update` |
| `persist_sim` | `persist_simulation()` | `state_update` |

### Task 2: Restructure `graphs/ingest.py`

**File:** `backend/app/graphs/ingest.py`

```
START → validate_input → normalize_timestamp → normalize_location
      → sanitize_description → assign_id → persist_incident → END
```

**State type** (`IngestState` TypedDict):
```python
class IngestState(TypedDict, total=False):
    request: IngestRequest
    incident: Incident | None
    trace_steps: list[dict]
    error: dict | None
```

**Conditional edge:** `validate_input` → if `error`: END; else → `normalize_timestamp`

### Task 3: Restructure `graphs/triage_plan.py`

**File:** `backend/app/graphs/triage_plan.py`

```
START → fetch_open_incidents → classify_incidents → detect_contradictions
      → [has_contradictions?] resolve_contradictions → route_and_match
      → build_chains → check_constraints → draft_notifications
      → prioritize → persist_plan → END
```

**State type** (`PlanState` TypedDict):
```python
class PlanState(TypedDict, total=False):
    request: PlanRequest
    incidents: list[Incident]
    classifications: dict[str, ClassificationResult]
    contradiction_groups: list[ContradictionGroup]
    resolutions: dict[str, ResolvedConflict]
    incident_plans: list[IncidentPlan]
    plan_summary: PlanSummary | None
    trace_steps: list[dict]
```

**Conditional edges:**
- `detect_contradictions` → if no groups: skip to `route_and_match`
- `planMode=quick` → skip `detect_contradictions` and `resolve_contradictions` entirely

### Task 4: Restructure `graphs/simulate.py`

**File:** `backend/app/graphs/simulate.py`

```
START → load_plan → capture_before → execute_chains
      → [force_api_failure?] inject_failure → capture_after
      → compute_metrics → build_frames → persist_sim → END
```

**State type** (`SimulateState` TypedDict):
```python
class SimulateState(TypedDict, total=False):
    request: SimulateRequest
    plan: PlanSummary
    before_state: CityState
    after_state: CityState | None
    actions: list[SimulatedAction]
    simulation_run: SimulationRun | None
    trace_steps: list[dict]
```

**Conditional edge:** `execute_chains` → if `forceApiFailure` and not yet failed: `inject_failure` → then back to `execute_chains` for retry

### Task 5: Update Route Handlers

**File:** `backend/app/api/routes/ingest.py`, `plan.py`, `simulate.py`

- Map flow function errors to HTTP status codes
- Use `model_dump(mode="json")` for all responses
- Add try/except with proper `HTTPException`

**Ingest route:**
- `DESCRIPTION_REQUIRED` → 400
- `INVALID_SOURCE_TYPE` → 400
- `DUPLICATE_INCIDENT` → 409
- `FLOW_EXECUTION_ERROR` → 500

**Plan route:**
- Keep `mode=baseline` working (Zain verified it)
- `mode=agent` → use new multi-node graph

**Simulate route:**
- Plan not found → 404
- Flow execution error → 500

### Eagle's Checklist

- [ ] `nodes/__init__.py` + 3 node modules (24 node functions total)
- [ ] `graphs/ingest.py` — 6-node chain with conditional edge
- [ ] `graphs/triage_plan.py` — 10-node chain with 2 conditional edges
- [ ] `graphs/simulate.py` — 8-node chain with failure conditional
- [ ] Graph state TypedDicts match plan.md §4.5.3
- [ ] Every node appends trace step via `trace_builder.append_step()`
- [ ] Route handlers map errors to correct HTTP status codes
- [ ] `planMode=quick` skips contradiction branch
- [ ] Run `scripts/smoke_test.sh` — must pass with multi-node graphs

---

## SHAKA — Tests + Polish (Build on Eagle's Graphs)

**Prerequisite:** Eagle's Phase 2 must be merged first. Shaka tests the final multi-node graph architecture.

### Task 1: Write All Tests

**Location:** `backend/tests/`

#### `tests/test_ingest_graph.py`
- Validation: empty description → error returned
- Validation: invalid sourceType → error returned
- Normalization: valid coordinates → incident created with correct coords
- Normalization: rawAddress → GeoNormalizerTool called, coords returned
- Normalization: no coords + no address → `requiresLocationClarification=true`
- Sanitization: HTML tags stripped, description truncated to 2000
- Duplicate: same description + coords within 10 min → existing incident returned
- Persistence: incident stored in WorkspaceStore with `status=reported`
- Full graph: run complete ingest graph → verify trace steps accumulated

#### `tests/test_triage_graph.py`
- Fetch: open incidents returned, closed incidents excluded
- Classification: 5 incidents → 5 classifications with correct types
- Contradiction detection: Market Quarter pair (200m, 30min) → conflict flagged
- Contradiction resolution: csv_json (0.95) beats web_article (0.70) → water_leak
- Routing: water_leak → DEPT-UTIL + DEPT-TRAFFIC
- Resource matching: nearest available crew in department returned
- Resource matching: no available crew → empty list, `resourceUnavailable=true`
- Constraint check: budget exceeded → violation recorded
- Priority ordering: critical(9×4×0.95) > high(8×3×0.75) > medium
- Notification drafts: 3 drafts per incident (operator, public, department)
- Empty incidents: no open incidents → empty plan summary
- Full graph: run complete triage graph → verify plan summary + trace

#### `tests/test_simulate_graph.py`
- Load plan: valid planId → plan loaded
- Load plan: invalid planId → ValueError raised
- Before state: deep copy captures current city state
- Action execution: validate → triaged, dispatch → assigned
- Road impact: water_leak → restricted, road_blockage → closed
- Failure injection: `forceApiFailure=true` → failure record with retry
- After state: incidents transitioned, roads updated
- Metrics: incidents delta, crews dispatched, avg response time
- Animation frames: `fast` = 4, `realtime` = 12, `instant` = 1
- Full graph: run complete simulate graph → verify SimulationRun + trace

#### `tests/test_tools.py`
- `geo_normalize`: "Market Quarter" → correct coords, confidence 0.85
- `geo_normalize`: "Unknown Place" → None, None, None, 0.2
- `route_departments`: all 5 incident types → correct department lists
- `match_resources`: available crew with matching skills → returned sorted by distance
- `match_resources`: all crews busy → empty list
- `classify_incident` (mock): water/pipe → water_leak, high, 8
- `classify_incident` (mock): accident/truck/injured → accident, high, 9
- `classify_incident` (mock): congestion/traffic → road_blockage, medium, 6
- `resolve_contradiction`: csv_json vs web_article → csv_json wins, confidence 0.91
- `draft_notifications`: 3 drafts returned, public ≤ 280 chars

#### `tests/test_baseline.py`
- Keyword routing: "water" → DEPT-UTIL
- Keyword routing: "accident" → DEPT-EMER
- Keyword routing: "road block" → DEPT-TRAFFIC
- Keyword routing: unknown → DEPT-GEN
- Baseline plan: no contradictions, single-step chain, 0 resources

#### `tests/test_trace_builder.py`
- `append_step`: adds step to list with correct structure
- `build_agent_trace`: counts LLM calls, tool calls, decisions correctly
- `build_agent_trace`: nested children flattened for summary stats
- Depth filter: `summary` → top-level only, `full` → complete tree

#### `tests/test_integration.py`
- Full end-to-end: ingest 5 incidents → plan → simulate → trace
- Verify trace has correct step counts (42 steps, 8 LLM calls, 14 tool calls)
- Verify contradiction detected and resolved in trace
- Verify simulation metrics match expected demo values

### Task 2: Edge Cases & Robustness

**Location:** Various nodes and flows (verify Eagle implemented, add if missing)

| Scenario | Where | What |
|----------|-------|------|
| Empty description → 400 | `validate_input` node | Return `DESCRIPTION_REQUIRED` error |
| Invalid coordinates | `normalize_location` node | Fallback to GeoNormalizerTool, then clarification flag |
| Oversized description (>2000) | `sanitize_description` node | Truncate silently, log in trace |
| LLM invalid enum | `classify_incidents` node | Retry once, default to `other`/`medium` |
| All resources unavailable | `match_resources` node | `resourceUnavailable=true`, compute `estimatedAvailableAt` |
| Contradiction confidence < 0.6 | `resolve_contradictions` node | Flag `lowConfidenceResolution`, still proceed |
| Budget violated on all resources | `check_constraints` node | Cheapest option + `budgetExceeded` flag |

### Task 3: API Contract Compliance

**Location:** All route handlers

Verify every error code maps to correct HTTP status per plan.md §8.1:

| Error Code | HTTP Status | Route |
|------------|-------------|-------|
| `DESCRIPTION_REQUIRED` | 400 | POST /ingest |
| `INVALID_SOURCE_TYPE` | 400 | POST /ingest |
| `INVALID_COORDINATES` | 400 | POST /ingest |
| `DUPLICATE_INCIDENT` | 409 | POST /ingest |
| `FLOW_EXECUTION_ERROR` | 500 | All flows |

- All responses use `model_dump(mode="json")` for mobile type parity
- All route handlers have try/except with proper `HTTPException`
- Query parameters validated (`planId`, `includeSimTrace`, `depth`, `mode`)

### Task 4: Smoke Test + Demo Readiness

**File:** `backend/scripts/smoke_test.sh`

- Ensure seed incidents load before test runs
- Test all 5 input types via ingest
- Verify plan has contradictions detected
- Verify simulation has failure record when `forceApiFailure=true`
- Verify trace has correct step counts
- Add `set -x` for debug output during development

### Task 5: Final Verification

- [ ] All tests pass: `uv run pytest -v`
- [ ] Smoke test passes: `./scripts/smoke_test.sh`
- [ ] Server starts clean: `uv run uvicorn app.main:app --reload --port 8000`
- [ ] Demo incidents seed correctly: `uv run python scripts/seed_demo_incidents.py`
- [ ] Trace output matches plan.md §12 example structure
- [ ] Baseline mode works: `POST /plan?mode=baseline`
- [ ] Quick mode works: `POST /plan` with `planMode=quick`

### Shaka's Checklist

- [ ] `tests/test_ingest_graph.py` — 9+ test cases
- [ ] `tests/test_triage_graph.py` — 12+ test cases
- [ ] `tests/test_simulate_graph.py` — 10+ test cases
- [ ] `tests/test_tools.py` — 10+ test cases
- [ ] `tests/test_baseline.py` — 5+ test cases
- [ ] `tests/test_trace_builder.py` — 4+ test cases
- [ ] `tests/test_integration.py` — end-to-end flow test
- [ ] All 7 edge cases verified and tested
- [ ] API contract compliance — all error codes mapped
- [ ] Smoke test passes end-to-end
- [ ] `uv run pytest -v` — all tests green

---

## Workload Balance

| Metric | Zain (Foundation) | Eagle (Graphs) | Shaka (Polish) |
|--------|-------------------|----------------|----------------|
| New files | 0 (modifies existing) | 4 (`nodes/` + `__init__.py`) | 7 (`tests/`) |
| Files to modify | 6 (tools + flows + services) | 5 (graphs + routes) | 1 (smoke_test) |
| Core work | LLM wiring, flow decomposition | Graph architecture, node wiring | Test coverage, edge cases |
| Lines of code (est.) | ~400–500 | ~500–600 | ~600–700 |
| Blocks next person | Yes (Eagle needs flow functions) | Yes (Shaka needs graphs) | No (final verifier) |

---

## Quick Start

```bash
# All devs: setup
cd backend && uv sync && cp .env.example .env
# Add GOOGLE_API_KEY to .env (Zain needs it for real LLM)

# Run server
uv run uvicorn app.main:app --reload --port 8000

# Seed demo incidents
uv run python scripts/seed_demo_incidents.py

# Smoke test (run after all 3 phases complete)
./scripts/smoke_test.sh

# Run tests (Shaka)
uv run pytest -v
```

---

## Rules (from AGENTS.md)

1. **No business logic in `mobile/`** — only presentation, API hooks, animation
2. **Implement flows per `plan.md` §4** — details in sections 4–8
3. **Every LangGraph node must append trace steps** — judges validate Agent Trace screen
4. **Run `scripts/smoke_test.sh` before marking backend complete**
5. **Read `plan.md` first** — if code disagrees with this file, fix the code
6. **Use `MOCK_LLM=true` for UI work** — don't burn API quota
7. **Preserve demo incident IDs** — Section 11 seeds must produce contradiction between Market Quarter incidents
8. **Baseline endpoint stays keyword-only** — `/plan?mode=baseline` never calls LLM
9. **Deterministic IDs** — use `services/ids.py` sequence counters, not UUIDs

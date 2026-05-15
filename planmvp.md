# CityIRA — MVP Execution Spec (vibe-coding)

**Google Antigravity Hackathon · Challenge 1** · May 2026 · ~36h sprint

| Document | Role |
|----------|------|
| **[plan.md](./plan.md)** | Full PRD + technical spec (screens, APIs, datasets, demo script, checklists). **Do not duplicate here — link to it.** |
| **planmvp.md (this file)** | What to **build now**: MVP scope, LangGraph runtime, and **verifiable Antigravity proof** for judges. |

> **For Cursor / Antigravity agents:** Implement from **planmvp.md** + linked sections of **plan.md**. If code disagrees with either, fix the code.

---

## 0. Hackathon model (read first)

### 0.1 What judges require (FAQ + Challenges PDF)

From **FAQs** and **Challenge 1**:

| Requirement | What we do |
|-------------|------------|
| **Antigravity as core platform** (25%) | All agent workflows **designed, implemented, and iterated in Google Antigravity IDE**. Submit IDE traces: workplan, task plan, reasoning, tool calls, decisions, execution, recovery. |
| **LangGraph / FastAPI allowed** (FAQ Q4) | *"Build agents in LangGraph and connect them via Antigravity."* Runtime orchestration = our **LangGraph backend**; Antigravity = **where we build and prove agent logic**. |
| **Antigravity is an IDE** (FAQ Q23) | Simulation and outcomes are shown in **our mobile app**, not inside Antigravity UI. |
| **Agent traces / logs** (mandatory deliverable) | **Two layers** of evidence (§0.3) — IDE artifacts **and** runtime trace in app + JSON export. |
| **Mobile APK** (mandatory) | Expo → EAS APK. |
| **Demo videos** | (1) **3–5 min** product: input → insight → action → simulation → result. (2) **2–3 min** screen recording: **how the team used Antigravity** to build the solution. |
| **Baseline comparison** (shared checklist) | Agent plan vs simple non-agent router — **required**, keep minimal (§12). |
| **Robustness** | ≥1 failure/edge case live in demo (contradiction + API failure). |

**Narrative for judges (accurate):**

> *"We used Google Antigravity as our agent development platform to design and vibe-code the incident workflows, tools, and prompts. Those workflows run in production as LangGraph graphs behind FastAPI. Every decision is verifiable in Antigravity build logs and in the live Agent Trace screen fed by our backend."*

**Do not say:** "The phone calls Antigravity at runtime."  
**Do say:** "Built with Antigravity; orchestrated at runtime by our LangGraph agent backend."

### 0.2 Three layers

```
┌─────────────────────────────────────────────────────────────┐
│  GOOGLE ANTIGRAVITY IDE (build-time orchestrator)           │
│  task.md · implementation_plan.md · walkthrough.md          │
│  agent sessions · prompts · graph design · code generation    │
└──────────────────────────┬──────────────────────────────────┘
                           │ produces repo
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  RUNTIME: FastAPI + LangGraph (execution orchestrator)      │
│  Ingest → Triage/Plan → Simulate → Trace                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST /v1
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MOBILE (Expo) — presentation + demo + trace viewer          │
└─────────────────────────────────────────────────────────────┘
```

### 0.3 Verifiable evidence map (artifact manifest)

Maintain this folder before **May 20** submission. Each row must exist and be linkable from README.

| # | Hackathon ask | Artifact | Path / location | Linked spec |
|---|---------------|----------|-----------------|-------------|
| A1 | Workplan | Antigravity task / plan export | `docs/antigravity/task.md` | [plan.md §15](plan.md) |
| A2 | Tasks plan | Implementation plan | `docs/antigravity/implementation_plan.md` | [plan.md §4](plan.md) flows |
| A3 | Reasoning steps | IDE session export or walkthrough | `docs/antigravity/walkthrough.md` + screenshots `docs/antigravity/screenshots/` | [plan.md §12](plan.md) |
| A4 | Tool calls & decisions | Runtime Agent Trace JSON | `docs/evidence/demo-trace-{planId}.json` + in-app Agent Trace | [plan.md §12](plan.md), [§11](plan.md) |
| A5 | Action execution | Simulation action log | `SimulationRun.actions[]` in API + Simulation screen | [plan.md §4.3](plan.md) |
| A6 | Error recovery | Failure step in trace + UI card | Demo with `forceApiFailure: true` | [plan.md §13](plan.md) #1 |
| A7 | Before/after | Simulation before/after states | Simulation screen KPIs | [plan.md §9](plan.md) Scene 5–6 |
| A8 | 5 input types | Seed + source badges in app | `seed_demo_incidents.py` + Incident List | [plan.md §11](plan.md) |
| A9 | Antigravity usage video | 2–3 min IDE screen recording | Submit link in form + `docs/antigravity/README.md` | FAQ shared checklist |
| A10 | Product demo video | 3–5 min E2E | Follow [plan.md §9](plan.md) | |
| A11 | Architecture README | Setup + Antigravity role | Root `README.md` | [plan.md §16](plan.md) |
| A12 | Baseline comparison | Side-by-side or toggle | `POST /plan?mode=baseline` + UI banner | [plan.md §14](plan.md) |
| A13 | Cost / latency | README table | README | [plan.md §16](plan.md) |
| A14 | Contradiction | Trace node S03 + Incident Detail card | Live demo incidents 2 vs 3 | [plan.md §11](plan.md) |

**Agent rule:** When implementing a feature, add or update the matching artifact row so judges can verify without guessing.

### 0.4 Antigravity session hygiene (for A3, A9)

During build, in Antigravity IDE:

1. Start each major feature with a **task** (ingest graph, triage graph, mobile Map, etc.).
2. Keep **implementation_plan.md** updated when graph nodes or tools change.
3. After E2E works, export **walkthrough.md**: what you asked Antigravity, what it generated, what you fixed.
4. Screenshot key moments (first successful `/plan`, trace tree, contradiction resolution) → `docs/antigravity/screenshots/`.
5. Record **2–3 min** Antigravity screen capture: opening task → generating backend graph → running smoke test (FAQ requirement).

---

## 0.5 MVP scope

**Must ship**

- [ ] All artifacts A1–A14 (minimal baseline OK)
- [ ] 4 LangGraph flows + `/v1` API — see §3
- [ ] 6 mobile screens — see §5; full UX in [plan.md §6](plan.md)
- [ ] 5 seeded incidents + contradiction — [plan.md §11](plan.md)
- [ ] E2E demo & both videos

**Defer** (see [plan.md §15](plan.md) if present, or skip): dark mode, web app, duplicate-ingest, full 5-scenario robustness matrix, search/sort polish.

---

## 0.6 Agent implementation rules

1. Logic in `backend/app/{graphs,nodes,tools,services}` only.
2. Every LangGraph node → `trace_steps` (feeds A4).
3. `MOCK_LLM=true` for UI dev; real LLM for demo rehearsal.
4. `scripts/smoke_test.sh` green before "backend done".
5. After each flow: update `docs/antigravity/implementation_plan.md` with node list (Antigravity proof).

---

## Table of contents

0. [Hackathon model & artifacts](#0-hackathon-model-read-first)  
1. [Challenge fit](#section-1--challenge-fit)  
2. [Architecture & repo](#section-2--architecture--repo)  
3. [LangGraph flows](#section-3--langgraph-flows-runtime)  
4. [Data models](#section-4--data-models) → detail in [plan.md §5](plan.md)  
5. [Mobile MVP](#section-5--mobile-mvp) → detail in [plan.md §6](plan.md)  
6. [UI tokens](#section-6--ui-tokens) → detail in [plan.md §7](plan.md)  
7. [API](#section-7--api) → detail in [plan.md §8](plan.md)  
8. [Demo script](#section-8--demo-script) → full script [plan.md §9](plan.md)  
9. [Dataset & seeds](#section-9--dataset--seeds) → [plan.md §10–11](plan.md)  
10. [Trace format](#section-10--trace-format) → [plan.md §12](plan.md)  
11. [Robustness](#section-11--robustness)  
12. [Baseline (required)](#section-12--baseline-required)  
13. [36h build order](#section-13--36h-build-order)  
14. [Submission package](#section-14--submission-package)

---

## Section 1 — Challenge fit

| Criterion (weight) | MVP proof |
|--------------------|-----------|
| Antigravity integration (25%) | A1–A3, A9 + README "how we used Antigravity" |
| Agentic reasoning (20%) | LangGraph multi-node flows + A4 trace |
| Insight & contradictions (20%) | Incidents 2 vs 3 + ContradictionResolver in trace |
| Action simulation (15%) | Simulate flow + before/after (A7) |
| Technical / robustness (10%) | A6 failure recovery + cost note |
| Innovation & UX (10%) | Map + simulation animation |

---

## Section 2 — Architecture & repo

```
wakanda/
├── plan.md              # full spec
├── planmvp.md           # this file
├── backend/             # FastAPI + LangGraph
├── mobile/              # Expo
└── docs/
    ├── antigravity/     # A1–A3, A9 (IDE proof)
    └── evidence/        # A4–A5 JSON exports
```

**Stack:** FastAPI, LangGraph, LangChain + Gemini, Pydantic, Expo, React Query.

**Env:** `GOOGLE_API_KEY`, `LLM_MODEL`, `MAX_BUDGET_PKR`, `MAX_DISPATCH_MINUTES`, `MOCK_LLM`, `CORS_ORIGINS`.

```bash
cd backend && uv sync && cp .env.example .env
uv run python scripts/seed_demo_incidents.py
uv run uvicorn app.main:app --reload --port 8000
```

Mobile: `EXPO_PUBLIC_API_BASE_URL=http://<LAN_IP>:8000/v1`

---

## Section 3 — LangGraph flows (runtime)

> Node-level detail also in [plan.md §4](plan.md) and [plan.md §4.5–4.10](plan.md) if present.

| Flow | Route | LLM? |
|------|-------|------|
| IngestIncidentFlow | `POST /v1/ingest` | No |
| TriageAndPlanFlow | `POST /v1/plan` | Yes |
| SimulateResponseFlow | `POST /v1/simulate` | No |
| GetAgentTraceFlow | `GET /v1/trace` | No (assembler) |

**Triage graph (core):**  
`fetch_open` → `classify_all` → `detect_contradictions` → `resolve_contradictions` → `route` → `match_resources` → `build_action_chains` → `check_constraints` → `draft_notifications` → `prioritize` → `persist_and_trace`

**Action chain:** validate → notify → dispatch → road_impact (if applicable) → followup.

**Credibility weights:** csv_json 0.95, pdf 0.90, table_dashboard 0.85, realtime_feed 0.80, web_article 0.70.

**Priority:** `urgencyScore × severityMultiplier × sourceCredibilityWeight` (see [plan.md §4.2](plan.md)).

**Simulate:** apply chains, `beforeState`/`afterState`, `animationFrames`, optional `forceApiFailure` on notify step.

**Trace:** every node appends to `trace_log`; GET `/trace` builds tree for mobile (A4).

---

## Section 4 — Data models

Use Pydantic models matching [plan.md §5](plan.md). Minimum enums:

`sourceType`, `incidentType`, `severity`, `status`, action step `type`.

---

## Section 5 — Mobile MVP

| Screen | Must-have | plan.md |
|--------|-----------|---------|
| Map Dashboard | Markers, KPIs, **Run Agent Plan** | §6 Screen 1 |
| Incident List | Source badges, severity | §6 Screen 2 |
| Incident Detail | Rationale, **Contradiction card**, action chain | §6 Screen 3 |
| Report Incident | POST ingest (optional in live demo) | §6 Screen 4 |
| Simulation | Before/after, KPIs, failure card | §6 Screen 5 |
| Agent Trace | Expandable tree, decision rationale | §6 Screen 6 |

---

## Section 6 — UI tokens

Primary `#1A56A0`, critical `#DC2626`, success `#16A34A`. Full palette: [plan.md §7](plan.md).

---

## Section 7 — API

Base: `/v1`. Endpoints: `/ingest`, `/plan`, `/simulate`, `/trace`, `/incidents`, `/health`.

Examples: [plan.md §8](plan.md).

**Baseline:** `POST /plan?mode=baseline` → keyword router only (A12).

---

## Section 8 — Demo script (short)

Full presenter script: **[plan.md §9](plan.md)**.

**Order:** Map (5 sources) → List (contradiction setup) → Run Plan → Detail (water_leak resolution) → Simulate (failure + recovery) → Agent Trace (contradiction + budget nodes).

**Closing line:** *"Agentic content-to-action for city ops — designed and built with Google Antigravity, running on LangGraph with full execution traces."*

---

## Section 9 — Dataset & seeds

NovaCivitas JSON: `backend/app/data/novacivitas.json` — tables in [plan.md §10](plan.md).

Five incidents: [plan.md §11](plan.md). **Critical:** web flood (input 2) vs csv pipe (input 3) → resolve to `water_leak`.

---

## Section 10 — Trace format

`AgentTrace` + nested `TraceStep` — schema in [plan.md §12](plan.md).

**Demo must show:** classify steps, contradiction (warning), resolver rationale, constraint pass, simulate failure + retry.

Export after rehearsal: `docs/evidence/demo-trace-PLAN-*.json`.

---

## Section 11 — Robustness

| Scenario | Live demo? | Evidence |
|----------|------------|----------|
| API failure on notify | **Yes** | A6, `forceApiFailure` |
| Contradictory sources 2 vs 3 | **Yes** | A14, trace S03 |
| Missing location, all crews busy, stale data | No | Mention in README only |

---

## Section 12 — Baseline (required)

Per FAQ shared checklist — not optional.

**Static Triage Table:** keyword → single department, no LLM, no constraints, no multi-step chain.

**MVP UI:** Settings toggle or second button "Run Baseline Plan" → `?mode=baseline` → show **Baseline Plan** banner vs agent plan.

**Trace:** baseline = 1 node ("Keyword match: water → DEPT-UTIL"); agent = full tree (A4).

Spec: [plan.md §14](plan.md).

---

## Section 13 — 36h build order

| Hours | Work | Antigravity artifact |
|-------|------|----------------------|
| 0–2 | Repo scaffold, `docs/antigravity/` stubs | A1 task.md started |
| 2–8 | LangGraph ingest + triage + tools | Update A2; screenshots |
| 4–10 | Mobile map, list, plan button | A9 footage |
| 10–16 | Simulate, trace, Agent Trace screen | A4 JSON sample |
| 16–20 | Baseline endpoint + toggle | A12 |
| 20–24 | E2E + seed data | walkthrough.md (A3) |
| 24–30 | Demo rehearsal, APK | A10 product video |
| 30–36 | Antigravity video, README, form | A9, A11, all rows checked |

---

## Section 14 — Submission package

**Google Form / drive links**

| Deliverable | File / link |
|-------------|-------------|
| GitHub repo | `plan.md` + `planmvp.md` + code |
| Mobile APK | EAS build |
| Product demo | 3–5 min (A10) |
| **Antigravity demo** | **2–3 min IDE usage (A9)** |
| IDE traces | `docs/antigravity/*` (A1–A3) |
| Runtime trace | In-app + `docs/evidence/*.json` (A4) |

**README must state explicitly**

1. Google Antigravity was used to orchestrate development of agent workflows (with examples from `docs/antigravity/`).
2. Runtime execution uses LangGraph (FAQ Q4 compliant).
3. How to reproduce demo: seed → plan → simulate → trace.
4. Baseline vs agent comparison.
5. Cost ~$0.05 per full demo run; in-memory limits.

**Pre-submit checklist**

- [ ] A1–A14 artifacts exist and README links to them
- [ ] Both videos recorded
- [ ] APK installs on physical device
- [ ] Smoke test passes on clean clone
- [ ] No claim that mobile hits Antigravity HTTP at runtime

---

*CityIRA · Challenge 1 · Built with Google Antigravity · Runtime: LangGraph + FastAPI · Full spec: [plan.md](./plan.md)*

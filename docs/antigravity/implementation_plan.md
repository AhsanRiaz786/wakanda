# Wakanda (CityIRA) Implementation Plan

This plan outlines the end-to-end development of the Wakanda autonomous city operations platform. The UI/UX will perfectly match the provided high-fidelity HTML mock (`cityira-hifi.html`), and the backend/functionality will strictly follow the architecture and workflows defined in `plan.md` and `planmvp.md`.

## User Review Required

> [!IMPORTANT]  
> Please review the proposed build phases below. Once approved, we will begin execution step-by-step, starting with the backend setup and frontend foundation.

## Open Questions

> [!WARNING]  
> 1. **React Native Styling:** The HTML mock uses raw CSS variables (`--green`, `--surface`, etc.). For the React Native app, would you prefer using **NativeWind** (Tailwind for React Native) to map these tokens, or stick to standard `StyleSheet.create` with a centralized theme object? (I recommend a centralized theme object to match the CSS variables exactly).
> 2. **Map Integration:** For the React Native map (Screen 1, 3, 4), `react-native-maps` is standard. Do we have a specific Mapbox token to use, or should we use standard Apple/Google maps with a dark custom JSON style?

---

## Phase 1: Foundation & Backend Setup

**Goal:** Establish the repository structure, configure environment variables, and stand up the FastAPI + LangGraph backend in Mock mode.

### 1.1 Backend Initialization
- **Environment:** Setup `backend/.env` with `MOCK_LLM=true` to save quota during UI dev.
- **Dependencies:** Install `fastapi`, `langgraph`, `langchain-google-genai`, `uvicorn`, `pydantic`.
- **Core Structure:**
  - `backend/app/main.py`: FastAPI entry point.
  - `backend/app/state.py`: Define `IncidentState`, `PlanState`, `SimState`.
  - `backend/app/agent/`: LangGraph definitions (`ingest_flow.py`, `triage_flow.py`, `sim_flow.py`).

### 1.2 Frontend Initialization
- **Environment:** Initialize Expo React Native project in `mobile/`.
- **Dependencies:** Install `@react-navigation/native`, `react-native-reanimated`, `react-native-maps`, `lucide-react-native` (for vector icons matching the mock).
- **Design Tokens:** Translate the CSS variables from `cityira-hifi.html` into a `theme.ts` file (Colors: `--green`, `--bg`, `--surface`, etc., and typography).

---

## Phase 2: Frontend UI Components (The "Hi-Fi" Match)

**Goal:** Build reusable React Native components that exactly match the CSS classes in `cityira-hifi.html`.

### 2.1 Typography & Badges
- Implement `Syne`, `JetBrains Mono`, and `Inter` font loading.
- Create `SeverityBadge`, `StatusBadge`, and `SourcePill` components mimicking the `.sev-badge` and `.src-pill` styles.

### 2.2 Navigation & Layout
- Build the `BottomNav` component (Map, Incidents, Report, Trace) matching the `.bottom-nav` blur and active dot states.
- Create the `PageHeader` and `TopBar` components for screens like Map Dashboard and Agent Trace.

### 2.3 Complex UI Elements
- **Timeline Stepper:** Build the horizontal stepper (`.stepper`, `.step`, `.step-circle`) for the Incident Detail screen.
- **KPI Cards:** Build the metric cards (`.kpi-item`, `.skpi`) with delta indicators.
- **Trace Nodes:** Build the expandable `.tnode` tree component for the Agent Trace screen.

---

## Phase 3: Screen Implementation

**Goal:** Assemble the 6 core screens using the base components and integrate mocked data.

### 3.1 Screen 1: Map Dashboard
- Full-screen dark map with pulsing critical markers (`.m-crit`).
- Floating top bar (`.map-top-bar`) and Uber-style bottom sheet (`.bottom-sheet`) with KPI strip and recent incident rows.

### 3.2 Screen 2: Incident Feed (List View)
- Search bar, sort row, and horizontal scrollable filter strip (`.sf-row`).
- Incident cards (`.inc-card`) with severity color left borders.

### 3.3 Screen 3: Incident Detail
- Hero section with severity pill and title.
- Status stepper, Classification Grid (`.info-grid`), Contradiction Card (`.contra-card`), and Action Chain (`.action-chain`).

### 3.4 Screen 4: Report Incident
- Map background with center targeting pin (`.center-pin`) and accuracy ring.
- Source strip and bottom input sheet (`.report-sheet`) with location and description fields.

### 3.5 Screen 5: Simulation View
- Animated map overlay (simulating crew movement and road closures).
- Before/After toggle (`.ba-toggle`), KPI deltas, and Event Timeline (`.sim-timeline`).

### 3.6 Screen 6: Agent Trace
- Header with trace stats (`.trace-stats`).
- Flow selector and the intricate Trace Tree (`.trace-tree`) showing LLM calls, tool uses, and decisions.

---

## Phase 4: Integration & LangGraph Wiring

**Goal:** Connect the React Native frontend to the FastAPI backend and implement the actual LangGraph logic.

### 4.1 API Client Setup
- Create Axios/Fetch client in `mobile/src/api.ts` mapping to FastAPI endpoints (`POST /incidents`, `GET /incidents`, `POST /agent/triage`, `GET /agent/trace`).

### 4.2 LangGraph Implementation
- **IngestIncidentFlow:** Parse raw inputs (citizen reports, data feeds) into structured `Incident` schemas.
- **TriageAndPlanFlow:** Use `gemini-2.5-flash` (or mock) to classify severity, resolve contradictions, and generate standard operating procedures.
- **SimulateResponseFlow:** Process `SimulatedAction`s and update `SimState` KPIs.
- **Trace Logging:** Ensure every graph node appends to `trace_steps` for Screen 6.

---

## Phase 5: Verification & Polish

**Goal:** Ensure the app feels premium and functions autonomously as described in `planmvp.md`.

### 5.1 Automated Testing
- Run `backend/scripts/smoke_test.sh` to verify graph execution.
- Run `backend/scripts/seed_demo_incidents.py` to populate initial state.

### 5.2 Manual Verification
- Walk through the full incident lifecycle on the Expo simulator.
- Verify that the Agent Trace screen accurately reflects the backend graph execution trace.
- Final UI polish (checking spacing, fonts, and blur effects against the HTML mock).

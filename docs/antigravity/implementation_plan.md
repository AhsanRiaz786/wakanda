# End-to-End Implementation Plan: Agent Traces & Vision Reporting

This plan details the steps required to implement the Agentic "Thought Process" UI and the Multimodal "Vision" Reporting features without breaking existing functionality.

## Proposed Changes

### Backend Updates

#### [MODIFY] backend/app/models/plan.py
- Add `trace_logs: list[str] = Field(default_factory=list)` to the `PlanSummary` model so that the plan endpoint can return the extracted logs.

#### [MODIFY] backend/app/api/routes/plan.py
- In `create_plan`, extract `result.get("trace_steps", [])`.
- Format each `TraceStep` dict into a string log (e.g., `"[{stepId}] {name}... {outputSummary}"`).
- Append these logs to `plan_summary.trace_logs` before returning the JSON response.

#### [MODIFY] backend/app/api/routes/incidents.py
- Define `VisionRequest` schema expecting `image_base64: str`.
- Add a new endpoint `POST /v1/incidents/vision` to process images.
- Use `ChatGoogleGenerativeAI` with the system configured Gemini model.
- Pass the base64 image and text prompt via `HumanMessage` to extract a structured incident schema (title, description, severity, incidentType).
- Return the generated incident details.

---

### Frontend Updates

#### [NEW] mobile/components/AgentTraceBox.tsx
- Create a new component that accepts a `logs: string[]` prop.
- Use `useEffect` and `setTimeout` to iteratively append logs to local state, simulating a live typing effect.
- Style with a dark, terminal-like appearance using the existing `Typography` and theme contexts.

#### [MODIFY] mobile/app/(tabs)/index.tsx
- Add a `traceLogs` state array.
- When `runPlan` is clicked, display `<AgentTraceBox />` beneath the action buttons immediately (acting as the loading indicator).
- Pass initial loading logs (e.g., `['Initializing Agent Loop...']`), and when the `api.plan` call completes, pass the real `plan.trace_logs` to the `AgentTraceBox` to complete the typing animation.

#### [MODIFY] mobile/src/lib/api.ts
- Add `vision: (base64: string) => request('/incidents/vision', ...)` to the api client.

#### [MODIFY] mobile/components/VoiceCommandButton.tsx
- Import `expo-image-picker` and the new `api.vision` method.
- Add a camera floating action button next to the microphone icon.
- On press, launch the image library, convert the image to base64, hit `/v1/incidents/vision`.
- Once the vision API returns the incident schema, automatically call `api.ingest(schema)` to log the incident instantly.
- Trigger existing success callbacks (e.g., `onIngestSuccess`) to automatically route the user to the Incidents feed.

## Verification Plan
1. **Agent Trace Verification:** Click "Run Autonomous Plan" and observe the terminal-like `<AgentTraceBox />` rendering logs step-by-step. Verify the API JSON contains the `trace_logs` array.
2. **Vision Reporting Verification:** Click the new camera button, select an image, and verify an incident is automatically generated, categorized, and logged to the feed based on Gemini's multimodal analysis.

**CITY INCIDENT-TO-RESPONSE**

**ROUTING AGENT**

**Complete PRD + Technical Specification**

Google Antigravity Hackathon --- Challenge 1

*Autonomous Content-to-Action Agent (Insight → Action System)*

Version 1.0 \| Hackathon MVP Sprint \| May 2026

**Table of Contents**

Section 1 --- Project Overview & Vision

Section 2 --- Hackathon Compliance Checklist

Section 3 --- System Architecture

Section 4 --- Antigravity Flows --- Deep Specification

Section 5 --- Data Models

Section 6 --- Mobile App --- Full Screen Specification

Section 7 --- Design System & Visual Style

Section 8 --- API Contract

Section 9 --- The Demo Scenario (Scripted End-to-End)

Section 10 --- Synthetic City Dataset

Section 11 --- Sample Incident Feed (The 5 Input Types)

Section 12 --- Agent Reasoning & Trace Design

Section 13 --- Robustness & Edge Cases

Section 14 --- Baseline Comparison

Section 15 --- Build Plan (1--2 Day Sprint)

Section 16 --- README Template

Section 17 --- Submission Checklist

**Section 1 --- Project Overview & Vision**

**1.1 Project Identity**

---

  **Field**            **Value**
  Project Name         City Incident-to-Response Routing Agent
  Short Name           CityIRA
  Platform             React Native + Expo (APK) + FastAPI + LangGraph (built with Google Antigravity IDE)
  Challenge            Google Antigravity Hackathon --- Challenge 1
  Challenge Title      Autonomous Content-to-Action Agent (Insight → Action System)
  Hackathon Timeline   May 15 idea submission → May 20 final submission → May 25--26 pitching
  Build Window         \~36 hours (vibe coding sprint, 2 developers)

---

**1.2 One-Liner**

CityIRA is a mobile-first autonomous agent platform that ingests fragmented city incident signals from five distinct source types, extracts prioritized operational insights, generates multi-step coordinated response plans, simulates their execution on a synthetic city environment, and exposes full transparent reasoning traces --- all orchestrated through custom agentic workflows built using the Google Antigravity IDE.

**1.3 The Problem It Solves**

City operations teams in Pakistan and globally receive incident reports through fragmented, inconsistent channels: citizen complaint apps, emergency hotline transcripts, social media, local news articles, utility alert CSVs, and manual operator logs. These reports arrive asynchronously, use inconsistent terminology, sometimes contradict each other, and rarely include clean location data.

The result is that incidents are manually triaged by overworked operators. Departments coordinate through ad-hoc calls and messages. Response times stretch. Road congestion compounds. Hazards --- downed trees, open manholes, broken traffic signals, burst water mains --- remain unresolved longer than necessary. Public trust in city operations erodes.

Most existing systems are dashboards that display data. CityIRA goes further: it is an autonomous coordination system that reasons, plans, and acts.

**1.4 Why It Matters for the Hackathon Narrative**

Challenge 1 demands a system that does not merely summarize content but extracts insights, makes decisions, executes simulated action chains, and demonstrates measurable outcome changes. CityIRA embodies this requirement end-to-end. Every screen in the mobile app, every backend agent workflow, every reasoning trace maps directly to a specific Challenge 1 evaluation criterion. The domain --- city operations --- is universally legible to judges, makes the stakes obvious, and produces dramatic before/after visualizations that tell a compelling 4-minute story.

**1.5 Challenge 1 Mapping (Point-by-Point)**

---

  **Challenge Requirement**                  **CityIRA Implementation**
  Ingest unstructured input across 5 types   IngestIncidentFlow accepts: PDF report, web article snippet, CSV/JSON utility alert, table/dashboard snapshot, mock real-time social feed post
  Extract key insights                       TriageAndPlanFlow uses LLM tools to extract incident type, severity, affected departments, urgency score, and contradictions
  Analyze implications                       Flow performs impact analysis: affected road segments, population density proxy, resource availability constraints
  Generate recommended actions               Produces 3--5 connected actions per incident: validate → notify → dispatch → close road → schedule follow-up
  Simulate execution of actions              SimulateResponseFlow applies plans to synthetic city state, transitions incident statuses, updates road network, generates notifications
  Show before/after system state             SimulationView screen shows animated before/after map with KPI banners: open incidents, blocked roads, crews dispatched
  Transparent agentic workflow               GetAgentTraceFlow returns structured workplan; AgentTrace screen renders step-by-step reasoning with inputs/outputs
  Google Antigravity as core orchestrator    ALL business logic --- classification, planning, simulation, trace --- lives inside our custom Python/LangGraph backend, built entirely using the Antigravity IDE. Mobile app is a pure presentation layer.

---

**Section 2 --- Hackathon Compliance Checklist**

**2.1 Evaluation Criteria Coverage**

---

  **Criterion**                              **Weight**   **CityIRA Coverage**                                                                                               **Evidence**
  Antigravity Integration                    25%          All 4 backend agent workflows written using Antigravity IDE. Antigravity task plans, reasoning traces, and artifacts submitted as proof of IDE-driven development.   FastAPI + LangGraph backend with IngestIncidentFlow, TriageAndPlanFlow, SimulateResponseFlow, GetAgentTraceFlow
  Agentic Reasoning & Workflow               20%          Multi-step planning with tool calls, constraint checks, contradiction resolution, and recovery logic.              TriageAndPlanFlow produces 5-step workplan with LLM reasoning at each stage
  Insight Quality & Contradiction Handling   20%          Sources are scored for recency and credibility; conflicting severity/location data triggers resolution sub-flow.   Demo includes 2 contradicting sources about the same incident; trace shows resolution decision
  Action Chain & Outcome Simulation          15%          Every incident generates 3--5 connected actions. SimulateResponseFlow transitions state and animates city.         SimulationView shows animated crew dispatch, road closure, notification generation
  Robustness/Scalability/Cost/Latency        15%          5 edge cases demonstrated. Cost-per-call estimate in README. In-memory state scales to demo scope.                 Edge case scenarios documented in Section 13; cost note in README
  Innovation & UX                            10%          Mobile-first city ops tool with live map, animated simulation, collapsible trace tree.                             React Native + Expo APK with react-native-maps, NativeWind UI

---

**2.2 Mandatory Requirements Matrix**

---

  **Requirement**                           **Status**    **Implementation Detail**
  Google Antigravity as core orchestrator   ✅ SATISFIED   Antigravity IDE wrote all agent logic. App calls custom FastAPI HTTP endpoints. IDE artifacts = submission proof.
  Working mobile app (APK)                  ✅ SATISFIED   React Native + Expo, compiled to APK via EAS Build
  Web app (optional)                        ⬜ OPTIONAL    Not in scope for 36h sprint; mobile is sufficient
  3--5 minute demo video                    ✅ PLANNED     Scripted scene-by-scene narrative in Section 9
  Antigravity agent traces/logs             ✅ SATISFIED   (1) Antigravity IDE artifacts: task.md, implementation_plan.md, walkthrough.md. (2) Runtime trace JSON from LangGraph backend displayed in AgentTrace screen.
  README documentation                      ✅ PLANNED     Full README template in Section 16
  5 input types ingested                    ✅ SATISFIED   PDF report, web article, CSV/JSON, table/dashboard, real-time feed
  3--5 connected action chain               ✅ SATISFIED   validate_incident → notify_department → dispatch_crew → close_road → schedule_followup
  Constraint-based decision making          ✅ SATISFIED   Budget PKR 50,000 max per dispatch, crew availability constraints, urgency time windows
  Contradiction detection                   ✅ SATISFIED   Source credibility scoring + timestamp recency check; conflicts flagged and resolved
  Failure recovery                          ✅ SATISFIED   API failure mid-flow triggers cached-state fallback; shown in demo
  Before/after outcome visualization        ✅ SATISFIED   SimulationView screen with before/after toggle and KPI delta banners
  Baseline comparison                       ✅ SATISFIED   Rule-based router shown side-by-side; Section 14 defines metrics
  Robustness evidence (1+ scenario)         ✅ SATISFIED   5 scenarios in Section 13; at least 1 shown live in demo
  Cost/latency note                         ✅ PLANNED     README includes per-call cost estimate and response latency range
  Scalability discussion                    ✅ PLANNED     README discusses 10x/100x scaling approach

---

**Section 3 --- System Architecture**

**3.1 Architecture Overview**

CityIRA is built on a three-layer architecture: a React Native mobile application that serves as the pure presentation and interaction layer, a custom FastAPI + LangGraph Python backend that contains all agentic logic and exposes HTTP endpoints, and an in-memory/mock data layer that stores the synthetic city state during the hackathon demo session. The entire backend and mobile app were vibe-coded from scratch using the Google Antigravity IDE, whose task plans, reasoning artifacts, and build logs serve as the Antigravity usage proof submitted to judges.

**3.2 Architecture Diagram (Text Representation)**

┌─────────────────────────────────────────────────────────────────────┐

│ REACT NATIVE + EXPO MOBILE APP │

│ │

│ MapDashboard │ IncidentList │ ReportIncident │ Simulation │

│ │ IncidentDetail│ │ AgentTrace │

│ │

│ React Query (server state) + Zustand (UI state) + react-native-maps│

└──────────────────────────┬──────────────────────────────────────────┘

│ HTTP REST (FastAPI custom endpoints)

▼

┌─────────────────────────────────────────────────────────────────────┐

│ CUSTOM AGENT BACKEND (FastAPI + LangGraph) │

│ Built with Google Antigravity IDE │

│ Hosted on GCP Cloud Run / Render │

│ │

│ ┌──────────────────┐ ┌──────────────────┐ │

│ │IngestIncidentFlow│ │TriageAndPlanFlow │ │

│ │ - validate() │ │ - classifyLLM() │ │

│ │ - normalize() │ │ - routeRules() │ │

│ │ - persist() │ │ - planChain() │ │

│ └──────────────────┘ │ - checkConstraint│ │

│ │ - resolveConflict│ │

│ ┌──────────────────┐ └──────────────────┘ │

│ │SimulateResponse │ ┌──────────────────┐ │

│ │Flow │ │GetAgentTraceFlow │ │

│ │ - applyPlan() │ │ - fetchTrace() │ │

│ │ - progressState │ │ - formatTree() │ │

│ │ - updateRoads() │ └──────────────────┘ │

│ │ - logActions() │ │

│ └──────────────────┘ │

│ │

│ LLM Tools: IncidentClassifierTool, ImpactAnalysisTool, │

│ ContradictionResolverTool, NotificationDraftTool (Gemini API) │

│ Custom Tools: RoutingTool, ResourceMatcherTool, GeoNormalizerTool │

└──────────────────────────┬──────────────────────────────────────────┘

│ read/write

▼

┌─────────────────────────────────────────────────────────────────────┐

│ WORKSPACE STATE LAYER (In-Memory / Mock) │

│ │

│ incidents\[\] │ departments\[\] │ resources\[\] │ roadNetwork{} │

│ simRuns\[\] │ traces\[\] │ notifications\[\] │

│ │

│ Synthetic City Dataset: NovaCivitas (defined in Section 10) │

└─────────────────────────────────────────────────────────────────────┘

**3.3 Layer Responsibilities**

**3.3.1 Mobile App Layer**

The mobile app is a pure presentation and interaction layer. It holds no business logic. Its only responsibilities are rendering state received from the backend, accepting user inputs, and firing API calls to the FastAPI endpoints. State management uses React Query for server-side data (incidents, simulation runs, traces) and Zustand for ephemeral UI state (selected filters, map viewport, active modal).

**3.3.2 Custom Agent Backend Layer**

This is where all intelligence lives. The FastAPI + LangGraph Python backend hosts four discrete agent workflows. Each workflow is a structured LangGraph graph with defined nodes, LLM tool calls, custom Python tools, constraint checks, and structured JSON outputs. FastAPI exposes REST endpoints for each workflow that the mobile app calls. The workflows share access to an in-memory state store and can read/write incident records, road network state, simulation snapshots, and trace logs.

The backend's central role is not decorative. Every decision the system makes --- how to classify an incident, which department to assign it to, whether a proposed action violates a budget constraint, how to resolve a contradiction between two data sources --- is executed through LangGraph's reasoning graph. The mobile app has no visibility into this logic; it simply receives results.

**Antigravity IDE Role:** The entire backend Python code and React Native app were written by the Antigravity IDE (this AI coding assistant). The IDE's task plans, implementation plans, walkthrough artifacts, and reasoning steps are the Antigravity logs submitted to judges.

**3.3.3 Workspace State Layer**

For the hackathon, all state is held in a lightweight in-memory Python dict structure within the FastAPI process. No external database is required. The synthetic city dataset (NovaCivitas) is pre-loaded as a static JSON structure and read by workflows during planning. Simulation runs and traces are stored as in-memory artifacts and retrieved by the GetAgentTraceFlow on demand.

**3.4 Data Flow --- Step by Step**

1. Citizen or operator opens the Report Incident screen and submits an incident description with optional image and map pin.
2. The mobile app serializes the payload and POST-s it to the Antigravity IngestIncidentFlow endpoint.
3. IngestIncidentFlow validates and normalizes the payload, assigns an incident ID, and persists the incident to workspace state with status = reported.
4. The mobile app receives the normalized incident object and adds a color-coded marker to the map.
5. Operator taps \'Run Agent Plan\'. The mobile app calls TriageAndPlanFlow with all open incidents.
6. TriageAndPlanFlow classifies each incident using LLM tools, detects contradictions, applies routing rules, checks constraints, and generates a multi-step action chain per incident.
7. The mobile app receives the PlanSummary object and updates the incident markers, shows the plan sheet, and enables the Simulate button.
8. Operator taps \'Simulate Plan\'. The mobile app calls SimulateResponseFlow.
9. SimulateResponseFlow applies the action chain to the synthetic city state: transitioning incident statuses, updating road segment states, generating notification records, and capturing before/after snapshots.
10. The mobile app animates the simulation: crews move, roads change color, incidents resolve.
11. Operator opens Agent Trace. The mobile app calls GetAgentTraceFlow, receives the structured trace tree, and renders it as a collapsible timeline.

**Section 4 --- Backend Agent Workflows --- Deep Specification**

> All workflows are implemented as LangGraph graphs exposed via FastAPI endpoints. They were written using the Google Antigravity IDE. Logic is identical to the original specification.

**4.1 IngestIncidentFlow**

**4.1.1 Purpose**

Normalize and register incoming incident reports from any of the five supported input types. This flow is the entry point for all content into the system. It ensures that regardless of how messy, incomplete, or inconsistently formatted the incoming data is, the output is always a clean, validated, normalized Incident object that downstream flows can reason about reliably.

**4.1.2 Inputs**

---

  **Field**        **Type**   **Required**   **Description**
  rawDescription   string     Yes            Free-text incident description. May be ungrammatical, in Urdu, or abbreviated.
  sourceType       enum       Yes            One of: pdf_report \| web_article \| csv_json \| table_dashboard \| realtime_feed
  sourceMetadata   object     No             Contains url, filename, feedId, or reportId depending on sourceType
  rawCoordinates   object     No             { lat: number, lng: number } if provided by the source; may be null
  rawAddress       string     No             Freeform address string if coordinates not available
  manualCategory   enum       No             Operator-supplied hint: road_blockage \| power_outage \| water_leak \| accident \| other
  imageUrl         string     No             URL to an uploaded image if attached
  rawTimestamp     string     No             ISO string or freeform timestamp from the source. If absent, system time is used.

---

**4.1.3 Internal Logic --- Step by Step**

12. VALIDATE: Check that rawDescription is non-empty and has at least 10 characters. Check that sourceType is one of the five allowed values. If either fails, return error response immediately.
13. NORMALIZE TIMESTAMP: If rawTimestamp is present, attempt to parse it. If unparseable, log a warning and use current system time. Store both raw and normalized values.
14. NORMALIZE COORDINATES: If rawCoordinates are provided, validate that lat is between -90 and 90 and lng is between -180 and 180, and round to 6 decimal places. If rawAddress is provided instead, call GeoNormalizerTool to convert to coordinates using the NovaCivitas district/road lookup table. If neither is provided, mark location as unresolved and set requiresLocationClarification = true.
15. GENERATE INCIDENT ID: Produce a deterministic ID using format INC-{YYYYMMDD}-{4-digit-sequence}. Example: INC-20260518-0042.
16. SANITIZE DESCRIPTION: Strip HTML tags, normalize whitespace, truncate to 2000 characters if longer. Store original as rawDescription and cleaned version as description.
17. EXTRACT SOURCE LABEL: Map sourceType to a human-readable label and icon code: pdf_report → \'PDF Report\' / icon:file-text; web_article → \'Web Article\' / icon:globe; csv_json → \'Data Feed\' / icon:database; table_dashboard → \'Dashboard\' / icon:bar-chart; realtime_feed → \'Live Feed\' / icon:radio.
18. PERSIST: Write the normalized incident object to workspace state incidents array with status = reported.
19. RETURN: Return the complete normalized Incident object to the caller.

**4.1.4 LLM Tools Used**

None in this flow. IngestIncidentFlow is intentionally lightweight and rule-based to ensure fast, reliable ingestion. LLM reasoning is deferred to TriageAndPlanFlow to keep ingestion latency under 500ms.

**4.1.5 Custom Tools Used**

GeoNormalizerTool: *Accepts rawAddress string and returns coordinates by fuzzy-matching against the NovaCivitas district and road name lookup table. Returns { lat, lng, matchedLocation, confidence } where confidence is a float 0--1.*

**4.1.6 Outputs**

---

  **Field**                       **Type**         **Description**
  incidentId                      string           Unique incident identifier, e.g. INC-20260518-0042
  title                           string           Auto-generated short title: first 80 chars of sanitized description
  description                     string           Sanitized full description
  rawDescription                  string           Original unsanitized description for audit trail
  sourceType                      enum             Normalized source type
  sourceLabel                     string           Human-readable source label
  sourceMetadata                  object           Pass-through of input metadata
  coordinates                     object           { lat, lng } --- null if unresolvable
  requiresLocationClarification   boolean          True if coordinates could not be determined
  imageUrl                        string \| null   Image URL if provided
  incidentType                    string           Set to \'unknown\' at ingest; enriched by TriageAndPlanFlow
  severity                        string           Set to \'unknown\' at ingest; enriched by TriageAndPlanFlow
  status                          enum             Always \'reported\' at creation
  createdAt                       string           ISO timestamp of ingestion
  normalizedAt                    string           ISO timestamp of normalization completion

---

**4.1.7 Trace Generation**

IngestIncidentFlow appends a compact trace entry to the workspace trace log: { flowName: \'IngestIncidentFlow\', incidentId, steps: \[ { name: \'validate\', result: \'pass\'\|\'fail\' }, { name: \'normalizeCoordinates\', input: rawCoordinates\|rawAddress, output: { lat, lng, confidence } }, { name: \'persist\', output: incidentId } \] }

**4.1.8 Edge Cases & Fallback**

- Empty description: Return HTTP 400 with error code DESCRIPTION_REQUIRED.
- Coordinates out of range: Discard and attempt GeoNormalizerTool with rawAddress. If that also fails, set requiresLocationClarification = true and proceed.
- Duplicate detection: If an incident with identical description and coordinates was created within the last 10 minutes, return the existing incident ID with a flag isDuplicate = true rather than creating a new record.
- Oversized payload: If description exceeds 2000 characters, truncate silently and log truncation in trace.

**4.2 TriageAndPlanFlow**

**4.2.1 Purpose**

This is the most intelligence-heavy flow in the system. TriageAndPlanFlow reads all open incidents from workspace state, classifies each one, detects contradictions between sources, applies routing rules, checks operational constraints, generates a prioritized multi-step action chain, and produces a comprehensive PlanSummary object. This flow is the heart of the autonomous agent system and must demonstrate sophisticated reasoning for the hackathon judges.

**4.2.2 Inputs**

---

  **Field**     **Type**     **Required**   **Description**
  incidentIds   string\[\]   No             If provided, only plan for these incidents. If absent, plan for all open incidents.
  constraints   object       No             Override default constraints: { maxBudgetPKR, maxDispatchMinutes, availableCrewIds }
  planMode      enum         No             \'full\' (default) or \'quick\' (skip contradiction analysis for demo speed)

---

**4.2.3 Internal Logic --- Step by Step**

20. FETCH OPEN INCIDENTS: Read all incidents with status in \[reported, triaged\] from workspace state. If incidentIds filter provided, apply it.
21. CLASSIFY EACH INCIDENT --- LLM: Call IncidentClassifierTool for each incident. The LLM receives the incident description, sourceType, coordinates, and manualCategory hint. It returns: incidentType (road_blockage \| power_outage \| water_leak \| accident \| other), severity (low \| medium \| high \| critical), urgencyScore (1--10), affectedRadius (meters), estimatedDuration (minutes), and classificationRationale (string).
22. DETECT CONTRADICTIONS: Group incidents by geographic proximity (within 200m) and time window (within 60 minutes). For each group with 2+ incidents: compare their severity, incidentType, and description. If type or severity differs by more than one level, flag as contradiction. Call ContradictionResolverTool with the conflicting incidents. The LLM scores each source for credibility (based on sourceType weight table) and recency (exponential decay by age), proposes a resolution, and returns a ResolvedConflict object.
23. ROUTE TO DEPARTMENTS: For each classified incident, call RoutingTool (custom, rule-based). The tool applies a routing matrix: water_leak → Utilities Department + Traffic Management; power_outage → Power & Utilities; road_blockage → Traffic Management + Public Works; accident → Emergency Services + Traffic Management; other → General Operations. Returns assignedDepartments\[\].
24. MATCH RESOURCES: Call ResourceMatcherTool for each (incident, assignedDepartments) pair. The tool checks workspace resource availability, filters by type required for incident type, sorts by proximity to incident coordinates, and returns up to 2 resources per incident. If no resources are available, flags resourceUnavailable = true and marks the incident for waitlist.
25. BUILD ACTION CHAINS: For each incident, generate a 3--5 step action chain: Step 1: validate_incident --- confirm classification with a second LLM pass if severity is high/critical. Step 2: notify_department --- draft notification message using NotificationDraftTool. Step 3: dispatch_crew --- assign matched resource(s) and set status = assigned. Step 4: manage_road_impact --- if incidentType is road_blockage or water_leak, mark adjacent road segments as restricted or closed. Step 5: schedule_followup --- set a check-in time 30--120 minutes later based on estimatedDuration.
26. CHECK CONSTRAINTS: For each action chain, verify: total estimated cost ≤ maxBudgetPKR (default PKR 50,000); dispatch ETA ≤ maxDispatchMinutes (default 45 min); crew is not double-booked. If any constraint fails, modify the action: try next-cheapest resource, or split the action across two smaller dispatches, or defer the step and log constraint_violation in trace.
27. PRIORITIZE PLANS: Sort all incident plans by a priority score = urgencyScore × severityMultiplier (critical=4, high=3, medium=2, low=1) × sourceCredibilityWeight. Plans with resourceUnavailable are deprioritized but not dropped.
28. GENERATE NOTIFICATION DRAFTS: Call NotificationDraftTool for each incident\'s notify_department step. Produces channel-specific drafts: operator_alert (in-app), public_announcement (social/app), department_ticket (internal).
29. ASSEMBLE PLAN SUMMARY: Compile all incident plans, resource allocations, road impacts, notification drafts, contradiction resolutions, and constraint violations into a single PlanSummary object.
30. PERSIST & TRACE: Update each incident in workspace state to status = triaged with enriched fields. Append detailed trace to workspace trace log.

**4.2.4 LLM Tools Used**

**IncidentClassifierTool ---** Prompt instructs the LLM to act as a trained city operations analyst. Given an incident description and metadata, classify the incident type and severity with a structured JSON response. Temperature 0.2 for consistent outputs.

**ContradictionResolverTool ---** Prompt instructs the LLM to act as an evidence evaluator. Given two or more conflicting incident reports, score each for credibility and recency, explain the conflict, and propose a resolution with confidence score.

**NotificationDraftTool ---** Prompt instructs the LLM to generate concise, professional notification messages for three audiences: operator (technical), public (plain-language), department (actionable). Max 280 characters for public, 500 for operator/department.

**4.2.5 Custom Tools Used**

**RoutingTool:** Rule-based department assignment matrix. No LLM. Returns assignedDepartments\[\] based on incidentType enum.

**ResourceMatcherTool:** Reads workspace resources array, filters by availability and type, computes Haversine distance to incident, returns sorted matches.

**4.2.6 Outputs --- PlanSummary Object**

---

  **Field**                   **Type**                  **Description**
  planId                      string                    Unique plan ID, e.g. PLAN-20260518-0007
  generatedAt                 string                    ISO timestamp
  incidentPlans               IncidentPlan\[\]          One plan object per incident (see below)
  totalIncidents              number                    Count of incidents in this plan
  totalResourcesDispatched    number                    Count of crew/vehicle dispatches
  totalRoadImpacts            number                    Count of road segments affected
  totalNotificationsDrafted   number                    Count of notification drafts
  conflictsDetected           number                    Count of contradiction groups found
  conflictsResolved           number                    Count successfully resolved
  constraintViolations        ConstraintViolation\[\]   List of any constraint failures and resolutions
  priorityOrdering            string\[\]                incidentIds in descending priority

---

**Each IncidentPlan contains:** incidentId, incidentType, severity, urgencyScore, classificationRationale, assignedDepartments\[\], assignedResources\[\], actionChain (Step\[\]), notificationDrafts{}, roadImpacts\[\], resolvedConflict? (if applicable), resourceUnavailable (boolean), priorityScore (number).

**4.2.7 Trace Generation**

TriageAndPlanFlow produces the most detailed trace in the system. The trace tree structure is defined in Section 12. Key trace data captured at each step: LLM input prompt (truncated to 500 chars for storage), LLM output JSON, tool names called, decision rationale strings, constraint check results (pass/fail + values), and final priority scores. This trace is the primary artifact judges will inspect.

**4.2.8 Edge Cases & Fallback**

- No open incidents: Return PlanSummary with empty incidentPlans and a message \'No open incidents to plan for.\'
- LLM classification returns invalid enum: Retry once. If still invalid, default to incidentType=\'other\', severity=\'medium\', and flag llmFallbackUsed=true.
- All resources unavailable: Proceed with plan, set resourceUnavailable=true on affected steps, and include a waitlist simulation: \'Crew CR-04 estimated available in 35 minutes.\'
- Contradiction resolution confidence below 0.6: Accept the resolution but flag lowConfidenceResolution=true; do not suppress the conflict from the trace.
- Budget constraint violated on all candidate resources: Proceed with cheapest option, flag budgetExceeded=true, and note in notification draft.

**4.3 SimulateResponseFlow**

**4.3.1 Purpose**

Apply the output of TriageAndPlanFlow to the synthetic city state and produce a before/after snapshot of the entire city. This flow transforms the abstract action chain into a concrete simulation that the mobile app can animate: crews moving from their home bases to incident sites, road segments changing from open to restricted or closed, incidents transitioning through statuses, and notification records appearing in the log.

**4.3.2 Inputs**

---

  **Field**         **Type**   **Required**   **Description**
  planId            string     Yes            The planId from a completed TriageAndPlanFlow run.
  simulationSpeed   enum       No             \'realtime\' \| \'fast\' (default) \| \'instant\'. Controls animation frame timing returned in snapshots.
  overrides         object     No             Allow demo presenter to force specific scenario: e.g. { forceApiFailure: true, forceResourceUnavailable: \'CR-02\' }

---

**4.3.3 Internal Logic --- Step by Step**

31. LOAD PLAN: Read the PlanSummary from workspace state using planId. Read the current city state (all incidents, resources, road segments).
32. CAPTURE BEFORE STATE: Deep-copy the current city state into beforeState. This is the snapshot the mobile app will use for the \'Before\' view.
33. EXECUTE ACTION CHAIN --- STEP BY STEP: For each IncidentPlan in priorityOrder, execute each action step sequentially. For each step, append a SimulatedAction record to the actions log with: stepId, incidentId, stepType, resourceId (if applicable), timestamp (simulated), before values, after values, durationSeconds.
34. STEP: validate_incident --- Update incident status from \'reported\' to \'triaged\'. Log LLM classification rationale as action output.
35. STEP: notify_department --- Create a Notification record in workspace state: { notificationId, audience, message, channel, sentAt (simulated) }. Mark step as complete.
36. STEP: dispatch_crew --- Update resource status from \'available\' to \'assigned\'. Update resource currentLocation to a midpoint between homeBase and incident coordinates (simulating en-route). Update incident status to \'assigned\'. Calculate simulated ETA.
37. STEP: manage_road_impact --- If applicable, update RoadSegment status: if incidentType = road_blockage, set adjacent segment to \'closed\'. If water_leak, set to \'restricted\'. Log affected roadIds.
38. STEP: schedule_followup --- Create a FollowUp record: { followUpId, incidentId, scheduledAt (now + estimatedDuration), type: \'check_in\' }. This is a passive record; no resource dispatch.
39. HANDLE OVERRIDES (DEMO SCENARIO): If forceApiFailure = true, simulate a failure at the notify_department step for the highest-priority incident. Record error: { stepId, error: \'NOTIFICATION_API_TIMEOUT\', retryCount: 1, fallback: \'logged_to_operator_queue\' }. Then retry and succeed on second attempt.
40. CAPTURE AFTER STATE: Snapshot the updated city state into afterState.
41. COMPUTE METRICS: Calculate delta metrics: incidentsOpenBefore vs incidentsOpenAfter, incidentsInProgressBefore vs After, roadsClosedBefore vs After, crewsDispatchedThisRun, notificationsSentThisRun, simulatedResponseTimeMinutes (average).
42. PERSIST: Save the SimulationRun object to workspace state.
43. RETURN: Return the SimulationRun object including beforeState, afterState, actions\[\], metrics.

**4.3.4 Outputs --- SimulationRun Object**

---

  **Field**                 **Type**              **Description**
  runId                     string                Unique run ID, e.g. SIM-20260518-0003
  planId                    string                The plan this simulation executed
  startedAt / completedAt   string                ISO timestamps
  beforeState               CityState             Full snapshot: incidents\[\], resources\[\], roadSegments\[\], notifications\[\]
  afterState                CityState             Full snapshot after all actions applied
  actions                   SimulatedAction\[\]   Chronological log of every action step with before/after values
  metrics                   object                { incidentsDelta, roadsDelta, crewsDispatched, notificationsSent, avgResponseTimeMin }
  failuresSimulated         FailureRecord\[\]     List of any simulated errors and their recovery outcomes
  animationFrames           Frame\[\]             Array of intermediate city states for mobile app to animate

---

**4.4 GetAgentTraceFlow**

**4.4.1 Purpose**

Expose the structured reasoning trace from the most recent (or specified) TriageAndPlanFlow and SimulateResponseFlow runs in a format that the mobile app\'s AgentTrace screen can render as a collapsible, hierarchical timeline. This is the transparency and explainability feature of the system and is critical for satisfying the hackathon\'s agentic reasoning evaluation criterion.

**4.4.2 Inputs**

---

  **Field**         **Type**   **Required**   **Description**
  planId            string     No             If provided, return trace for this specific plan. If absent, return the most recent plan\'s trace.
  includeSimTrace   boolean    No             If true, also include the simulation trace for the same plan. Default: true.
  depth             enum       No             \'full\' (all steps) \| \'summary\' (top-level steps only). Default: \'full\'.

---

**4.4.3 Internal Logic**

44. Locate the trace records in workspace state matching planId (or most recent).
45. Merge the TriageAndPlanFlow trace and SimulateResponseFlow trace into a unified chronological tree.
46. For each trace node, enrich with human-readable labels, icons, and status badges (success \| warning \| failure \| info).
47. Apply depth filter: if \'summary\', return only top-level step nodes without children.
48. Return the structured AgentTrace object.

**4.4.4 Output --- AgentTrace Object**

---

  **Field**     **Type**        **Description**
  traceId       string          e.g. TRACE-20260518-0003
  planId        string          Associated plan
  generatedAt   string          ISO timestamp
  summary       object          { totalSteps, totalLLMCalls, totalToolCalls, totalDurationMs, conflictsDetected, constraintsChecked }
  steps         TraceStep\[\]   Ordered array of top-level steps

---

Each TraceStep contains: stepId, name (human-readable), type (llm_call \| tool_call \| decision \| state_update \| error), status (success \| warning \| failure), durationMs, inputSummary (string), outputSummary (string), children (TraceStep\[\]) for nested sub-steps, decisionRationale (string, populated for decision nodes).

**Section 5 --- Data Models**

**5.1 Incident**

---

  **Field**                       **Type**         **Allowed Values / Format**                                                   **Description**
  incidentId                      string           INC-YYYYMMDD-NNNN                                                             Unique identifier
  title                           string           max 80 chars                                                                  Auto-generated from description
  description                     string           max 2000 chars                                                                Sanitized incident description
  rawDescription                  string           unlimited                                                                     Original unsanitized input
  sourceType                      enum             pdf_report \| web_article \| csv_json \| table_dashboard \| realtime_feed     Input channel
  sourceLabel                     string           PDF Report, Web Article, etc.                                                 Human-readable source
  sourceMetadata                  object           { url?, filename?, feedId? }                                                  Channel-specific metadata
  coordinates                     object           { lat: float, lng: float } \| null                                            Geographic location
  requiresLocationClarification   boolean          true \| false                                                                 Location could not be resolved
  imageUrl                        string \| null   HTTPS URL or null                                                             Optional attached image
  incidentType                    enum             road_blockage \| power_outage \| water_leak \| accident \| other \| unknown   Classified type
  severity                        enum             low \| medium \| high \| critical \| unknown                                  Classified severity
  urgencyScore                    number           1--10                                                                         LLM-assigned urgency (10 = most urgent)
  classificationRationale         string           free text                                                                     LLM explanation of classification decision
  affectedRadius                  number           meters                                                                        Estimated geographic impact radius
  estimatedDuration               number           minutes                                                                       Estimated time to resolve
  assignedDepartments             string\[\]       DepartmentId\[\]                                                              Departments responsible for response
  assignedResources               string\[\]       ResourceId\[\]                                                                Crews/vehicles assigned
  status                          enum             reported \| triaged \| assigned \| in_progress \| resolved                    Lifecycle stage
  actionChain                     Step\[\]         see IncidentPlan                                                              The 3--5 action steps for this incident
  notificationDrafts              object           { operator, public, department }                                              Drafted notification messages
  roadImpacts                     string\[\]       RoadSegmentId\[\]                                                             Roads affected by this incident
  resolvedConflict                object \| null   ResolvedConflict \| null                                                      Contradiction resolution if applicable
  createdAt                       string           ISO 8601                                                                      Ingestion timestamp
  updatedAt                       string           ISO 8601                                                                      Last modification timestamp

---

**5.2 Department**

---

  **Field**          **Type**     **Description**
  departmentId       string       e.g. DEPT-UTIL, DEPT-TRAFFIC, DEPT-EMER
  name               string       Full department name
  shortName          string       Abbreviation for UI display
  responsibilities   string\[\]   List of incident types this department handles
  resources          string\[\]   ResourceId\[\] assigned to this department
  contactName        string       Simulated contact person name
  contactChannel     string       Simulated: phone number or radio channel

---

**5.3 Resource / Crew**

---

  **Field**                **Type**         **Allowed Values**                                                                  **Description**
  resourceId               string           CR-NN or VH-NN                                                                      Unique ID: CR = crew, VH = vehicle
  type                     enum             repair_crew \| ambulance \| utility_vehicle \| inspection_team \| heavy_equipment   Resource category
  name                     string           e.g. \'Alpha Repair Crew\'                                                          Display name
  assignedDepartmentId     string           DepartmentId                                                                        Parent department
  homeBase                 object           { lat, lng, name }                                                                  Default station location
  currentLocation          object           { lat, lng }                                                                        Simulated real-time position
  status                   enum             available \| assigned \| busy \| offline                                            Availability state
  assignedIncidentId       string \| null   IncidentId or null                                                                  Active incident if assigned
  skills                   string\[\]       e.g. \[\'water_leak\',\'road_repair\'\]                                             Capabilities for matching
  capacityPerShift         number           integer                                                                             Max incidents per 8-hour shift
  estimatedHourlyRatePKR   number           PKR                                                                                 Cost basis for constraint checks

---

**5.4 RoadSegment**

---

  **Field**             **Type**     **Description**
  roadId                string       e.g. RD-01 through RD-12
  name                  string       Named road, e.g. \'Main Boulevard\'
  districtIds           string\[\]   Districts this road passes through
  startCoords           object       { lat, lng } at one terminus
  endCoords             object       { lat, lng } at other terminus
  status                enum         open \| restricted \| closed
  affectedIncidentIds   string\[\]   Incidents causing current status
  normalTrafficLevel    enum         low \| moderate \| high
  congestionLevel       number       0--100, simulated congestion percentage
  alternateRouteIds     string\[\]   RoadSegmentIds that can serve as detours

---

**5.5 Notification**

---

  **Field**        **Type**   **Description**
  notificationId   string     e.g. NOTIF-20260518-0023
  incidentId       string     Associated incident
  audience         enum       operator \| public \| department \| media
  channel          enum       in_app \| sms \| announcement \| department_ticket
  message          string     The drafted notification text
  sentAt           string     Simulated ISO timestamp
  status           enum       drafted \| sent \| acknowledged

---

**5.6 SimulationRun**

See Section 4.3.4 for the full SimulationRun output schema.

**5.7 AgentTrace / TraceStep**

See Section 4.4.4 for the AgentTrace and TraceStep schemas.

**5.8 Synthetic City Dataset Schema**

The NovaCivitas dataset is defined in detail in Section 10. Its top-level schema is:

{

cityName: \'NovaCivitas\',

districts: District\[\], // 5 districts

roads: RoadSegment\[\], // 10 named road segments

departments: Department\[\], // 5 departments

resources: Resource\[\] // 8 crews/vehicles

}

District: { districtId, name, description, boundingBox: { nw, se }, populationDensity: \'low\'\|\'medium\'\|\'high\' }

**Section 6 --- Mobile App --- Full Screen Specification**

**Screen 1 --- Map Dashboard**

**Purpose**

The primary operational view. Provides a live map of the synthetic city with all active incident markers, filter controls, a status summary banner, and the primary agent action buttons. This is the first screen judges see and must immediately communicate the system\'s value.

**UI Elements**

---

  **Element**            **Description**                                                                                                                          **Position**
  App Header Bar         Title \'CityIRA\' in bold blue, subtitle \'NovaCivitas Operations\', notification bell icon top right                                    Top fixed
  Full-Screen Map        react-native-maps with street tile base, occupies 100% of screen minus header and bottom bar                                             Full screen below header
  Incident Markers       Circle markers: red=critical, orange=high, yellow=medium, blue=low. Pulsing animation for critical.                                      On map at incident coordinates
  User Location Button   Crosshair icon FAB, bottom-right of map. Centers viewport on device location.                                                            Map overlay, bottom-right
  Filter Chip Row        Horizontal scrollable chips: All \| Road Blockage \| Water Leak \| Power Outage \| Accident \| Other. Active chip has solid blue fill.   Below map, sticky
  Status Banner          Three KPI cards side by side: Open (count, red), In Progress (count, amber), Resolved (count, green)                                     Below filter chips
  Run Agent Plan FAB     Large primary button, full width minus padding, blue fill, white text \'Run Agent Plan ▶\', subtle shadow                                Bottom of screen, above nav bar
  Bottom Nav Bar         4 tabs: Map (active), Incidents, Report, Trace                                                                                           Fixed bottom

---

**Interactions**

- Tap incident marker → Navigate to Incident Detail screen for that incident
- Long-press map → Show coordinate label (dev aid, hidden in demo mode)
- Tap filter chip → Filter markers on map; deselect to show all
- Tap \'Run Agent Plan\' → Show loading overlay \'Agent is analyzing incidents...\' → Call TriageAndPlanFlow → On success: show Plan Summary bottom sheet → Marker colors may update → Enable \'Simulate\' button in Plan Summary sheet

**API Calls**

- On mount: GET /incidents?status=open,triaged,assigned,in_progress --- fetches all non-resolved incidents → populate markers
- On Run Agent Plan: POST /plan { incidentIds: null } → receive PlanSummary

**State**

- React Query: useIncidents() --- refreshes every 30s
- Zustand: activeFilter, mapViewport, isPlanLoading, currentPlanSummary

**Loading / Error / Empty States**

- Loading: Skeleton map with shimmer overlay
- Error: Toast \'Could not reach agent --- tap to retry\' with retry icon
- Empty (no incidents): Map with callout \'No active incidents. Tap + to report one.\'

**Screen 2 --- Incident List**

**Purpose**

Scrollable list of all incidents with severity and status indicators, filterable and sortable. Provides quick access to incident details.

**UI Elements**

---

  **Element**      **Description**
  Search Bar       Full-width search field at top, searches title and description, debounced 300ms
  Sort Dropdown    Picker: Newest \| Oldest \| Severity (High→Low) \| Urgency Score
  Filter Strip     Status filter pills: All \| Reported \| Triaged \| Assigned \| In Progress \| Resolved
  Incident Cards   Each card: severity color left border, incident type icon, title (truncated 60 chars), source label badge, timestamp (relative: \'12 min ago\'), status badge, assigned department name
  Empty State      Illustration + \'No incidents match your filter\' + Clear Filters button

---

**Interactions**

- Tap card → Navigate to Incident Detail
- Pull to refresh → re-fetch incidents list
- Long-press card → Context menu: Copy Incident ID \| Mark as Resolved (ops role only)

**API Calls**

- On mount + pull-to-refresh: GET /incidents (all, paginated 20 per page)

**Screen 3 --- Incident Detail**

**Purpose**

Deep-dive view for a single incident. Shows everything the agent knows about the incident, plus the action plan generated for it, assigned resources, road impacts, notification drafts, and any contradiction resolution.

**UI Elements**

---

  **Element**            **Description**
  Header                 Severity color banner, incident type icon + label, incident ID, created timestamp
  Status Timeline        Horizontal stepper: Reported → Triaged → Assigned → In Progress → Resolved. Current step highlighted.
  Description Card       Full sanitized description, source type badge, source metadata (URL or filename if applicable)
  Location Card          Mini map at 40% screen width showing incident pin, district name below
  Classification Card    Incident Type, Severity, Urgency Score (with bar visualization 1--10), Estimated Duration, Affected Radius
  LLM Rationale          Expandable accordion: \'Why was this classified this way?\' --- shows classificationRationale string
  Assigned Departments   List of department chips with icons
  Assigned Resources     List of resource cards: icon, name, type, status badge, ETA to incident
  Action Chain           Numbered list 1--5: each step shows type icon, step name, status (pending/complete/failed), timestamp
  Road Impacts           List of affected road segments with status badges (open/restricted/closed)
  Notification Drafts    Tabbed: Operator \| Public \| Department. Each tab shows the drafted message.
  Contradiction Card     Only visible if resolvedConflict is present. Shows: conflicting sources, resolution summary, confidence score, selected resolution.

---

**API Calls**

- On mount: GET /incidents/{incidentId} --- full incident object with plan data

**Screen 4 --- Report Incident**

**Purpose**

Allows citizens and operators to submit new incident reports. Feeds directly into IngestIncidentFlow.

**UI Elements**

---

  **Element**            **Description**
  Header                 \'Report an Incident\' title + back button
  Source Type Selector   Horizontal icon buttons: Citizen Report \| Social Post \| Call Note \| News Article \| Data Feed --- defaults to Citizen Report
  Description Field      Multi-line TextInput, placeholder \'Describe what you observed...\', 2000 char limit with counter
  Category Selector      Optional: grid of 5 category buttons with icons. Marked as \'Optional --- agent will classify automatically\'
  Location Picker        Embedded MapView with draggable pin. \'Use my location\' shortcut button. Address display below map.
  Photo Attach           \'Attach Photo\' button, opens camera or gallery. Thumbnail shown when selected.
  Submit Button          Primary blue button \'Submit Incident Report\'. Disabled until description is filled.
  Success State          Replaces form with: ✅ icon, \'Report Submitted\', incident ID, \'The agent will analyze this shortly.\'

---

**API Calls**

- On submit: POST /ingest with full payload → receive normalized Incident object → show success state → navigate to Incident Detail after 2 seconds

**Screen 5 --- Simulation View**

**Purpose**

Visualize the before and after states of the synthetic city following the execution of a response plan. Shows animated crew movements, road status transitions, and delta metrics. This is the most visually compelling screen for the demo video.

**UI Elements**

---

  **Element**             **Description**
  Before/After Toggle     Large segmented control at top: BEFORE \| AFTER. Switching transitions the map state.
  Animated Map            City map with: crew icons (badge = crew name) animating along path from home base to incident; road segment overlays changing color (green=open, orange=restricted, red=closed); incident marker icons transitioning.
  Metrics Banner          4 KPI delta cards: Incidents Resolved (+N), Roads Reopened (+N), Crews Dispatched (N), Notifications Sent (N)
  Action Timeline         Vertical scrollable list of SimulatedActions: timestamp \| step icon \| description. Tapping expands before/after values.
  Play/Pause/Restart      Controls for the animation. Auto-plays on first load.
  Failure Scenario Card   Red-bordered card that appears when a simulated failure is in the action log. Shows: error type, retry count, recovery action.
  Share/Export Button     Icon button top-right. Opens share sheet with a summary text for the demo.

---

**API Calls**

- On mount: GET /simulate?planId={planId} (or POST /simulate if plan not yet run) → receive SimulationRun with animationFrames
- The app iterates through animationFrames on a timer to drive the animation

**Screen 6 --- Agent Trace**

**Purpose**

Expose the full Antigravity reasoning trace to operators and judges. This screen proves that the system is genuinely autonomous, not a rule-based lookup. It must be clear, scannable, and technically impressive.

**UI Elements**

---

  **Element**          **Description**
  Header               \'Agent Reasoning Trace\' + plan ID badge + timestamp
  Summary Bar          Row of 5 mini stats: Steps \| LLM Calls \| Tool Calls \| Conflicts \| Constraints Checked --- each with a number badge
  Flow Selector        Segmented: Triage & Plan \| Simulation --- switches the trace tree shown
  Trace Tree           Vertically scrollable tree. Each node: icon (brain=LLM, wrench=tool, diamond=decision, flag=state update, ⚠️=warning/error), step name in bold, status badge (green SUCCESS / amber WARNING / red FAILURE), duration in ms. Expandable: tap to show inputSummary and outputSummary fields.
  Highlight Panel      When a \'decision\' node is expanded, shows decisionRationale in a blue-bordered quote block --- the most readable representation of AI reasoning.
  LLM Call Detail      When an LLM call node is expanded, shows: model used, prompt excerpt (first 200 chars), response excerpt (first 200 chars), tokens used (simulated).
  Contradiction Node   Special node type with ⚡ icon. Shows: Source A vs Source B summary, credibility scores, resolution chosen.
  Constraint Node      Node with 🔒 icon. Shows: constraint name, required value, actual value, pass/fail result.

---

**API Calls**

- On mount: GET /trace?planId={planId}&includeSimTrace=true → receive AgentTrace object → render tree

**Section 7 --- Design System & Visual Style**

**7.1 Color Palette**

---

  **Role**            **Hex**    **Usage**
  Primary Blue        \#1A56A0   Primary buttons, active states, headers, links
  Primary Dark Blue   \#0D3B7A   App bar background, section headings
  Teal Accent         \#0E7C7B   Secondary actions, icons, h3 elements
  Amber Warning       \#D97706   Medium severity, warnings, in-progress status
  Red Critical        \#DC2626   Critical severity, error states, closed roads
  Green Success       \#16A34A   Resolved incidents, open roads, success states
  Orange High         \#EA580C   High severity incidents
  Yellow Medium       \#CA8A04   Medium severity incidents
  Blue Low            \#2563EB   Low severity incidents
  Background Gray     \#F3F4F6   Screen backgrounds, alternate table rows
  Card White          \#FFFFFF   Card surfaces, list item backgrounds
  Border Gray         \#E5E7EB   Dividers, card borders, table cell borders
  Text Primary        \#111827   Main body text
  Text Secondary      \#6B7280   Labels, timestamps, metadata
  Text Disabled       \#9CA3AF   Placeholder text, disabled states

---

**7.2 Typography**

---

  **Role**            **Font**             **Size (sp)**   **Weight**   **Color**
  Screen Title        Arial / System       22              Bold         \#0D3B7A
  Section Heading     Arial / System       18              SemiBold     \#1A56A0
  Card Title          Arial / System       16              SemiBold     \#111827
  Body Text           Arial / System       14              Regular      \#111827
  Caption / Label     Arial / System       12              Regular      \#6B7280
  Badge Text          Arial / System       11              Bold         \#FFFFFF or context
  Code / Trace Node   Courier New / Mono   13              Regular      \#1E293B
  KPI Number          Arial / System       28              Bold         Context color
  KPI Label           Arial / System       11              Medium       \#6B7280

---

**7.3 Spacing Scale**

All spacing uses an 8pt base grid. Standard spacing tokens: xs=4, sm=8, md=16, lg=24, xl=32, xxl=48. Screen horizontal padding: 16pt. Card internal padding: 16pt. Between cards: 12pt. List item padding: 12pt vertical, 16pt horizontal.

**7.4 Component Library**

**Severity Badge**

Pill-shaped badge. Background: severity color at 15% opacity. Text: severity color at full opacity. Border: severity color. Text: severity label in Title Case. Sizes: sm (for list cards), md (for detail headers).

**Status Badge**

Rounded rectangle. Background: status color. Text: white. Colors: reported=\#6B7280, triaged=\#2563EB, assigned=\#D97706, in_progress=\#EA580C, resolved=\#16A34A.

**Source Type Badge**

Flat pill. Background: \#EFF6FF. Text: \#1A56A0. Left icon: source type icon. Text: source label.

**Incident Map Marker**

Circle with inner dot. Outer ring: severity color at 40% opacity. Inner fill: severity color. Diameter: critical=28pt, high=24pt, medium=20pt, low=18pt. Critical markers pulse with 1.4x scale animation on 1.5s loop.

**Primary Button**

Background: \#1A56A0. Text: \#FFFFFF, 16sp bold. Border radius: 10pt. Height: 52pt. Active press state: 85% opacity. Disabled: \#9CA3AF background.

**Action Step Row**

Left: circular step number badge (20pt diameter, blue fill). Center: step name bold, step description below in secondary text. Right: status icon (checkmark=complete, clock=pending, X=failed). Connector line between steps: 1pt dashed gray.

**Trace Node**

Left border: 3pt solid, color by type (blue=LLM, gray=tool, amber=decision, green=state update, red=error). Background: \#F8FAFC. Arrow indicator right side for expandable nodes. Expanded state shows gray-background detail block.

**KPI Delta Card**

White card, 4pt corner radius, subtle shadow. Top: large number in context color. Below: label in secondary text. Optional delta indicator: ▲N green or ▼N red.

**7.5 Overall Visual Tone**

The visual language is professional, data-dense, and utility-forward. It evokes a real city operations control room: dark navy accents, status-coded colors, map-centric layout. It avoids consumer-app decoration in favor of clarity and scannability. The simulation view is the one place where animation adds drama --- crews moving, roads changing color --- and this should feel purposeful and impactful, not gimmicky.

**7.6 Dark/Light Mode**

Light mode only for the hackathon MVP. Dark mode is noted as a post-hackathon enhancement. Light mode keeps contrast ratios WCAG AA compliant for all text elements.

**Section 8 --- API Contract**

All endpoints are served by the custom FastAPI backend. Base URL: `http://localhost:8000/v1` (local dev) or `https://[DEPLOYED_BACKEND_URL]/v1` (Cloud Run / Render). The entire backend was built using the Google Antigravity IDE.

**8.1 POST /ingest --- IngestIncidentFlow**

**Request**

POST /ingest

Content-Type: application/json

{

\"rawDescription\": \"Water main burst near the central market causing road flooding\",

\"sourceType\": \"realtime_feed\",

\"sourceMetadata\": { \"feedId\": \"twitter-novacivitas-watch\", \"postId\": \"1234567890\" },

\"rawCoordinates\": { \"lat\": 33.7215, \"lng\": 73.0485 },

\"rawAddress\": null,

\"manualCategory\": null,

\"imageUrl\": \"https://cdn.example.com/incident-photo.jpg\",

\"rawTimestamp\": \"2026-05-18T09:14:00Z\"

}

**Success Response --- 200**

{

\"incidentId\": \"INC-20260518-0042\",

\"title\": \"Water main burst near the central market causing road flooding\",

\"description\": \"Water main burst near the central market causing road flooding\",

\"sourceType\": \"realtime_feed\",

\"sourceLabel\": \"Live Feed\",

\"coordinates\": { \"lat\": 33.7215, \"lng\": 73.0485 },

\"requiresLocationClarification\": false,

\"incidentType\": \"unknown\",

\"severity\": \"unknown\",

\"status\": \"reported\",

\"createdAt\": \"2026-05-18T09:14:03Z\",

\"normalizedAt\": \"2026-05-18T09:14:03Z\"

}

**Error Responses**

---

  **Code**   **Error Code**         **Description**
  400        DESCRIPTION_REQUIRED   rawDescription is null or \< 10 characters
  400        INVALID_SOURCE_TYPE    sourceType is not one of the 5 allowed values
  400        INVALID_COORDINATES    lat/lng out of valid range
  409        DUPLICATE_INCIDENT     Identical incident created within 10 minutes --- returns existing incident
  500        FLOW_EXECUTION_ERROR   Internal Antigravity flow error

---

**8.2 POST /plan --- TriageAndPlanFlow**

**Request**

POST /plan

Content-Type: application/json

{

\"incidentIds\": null,

\"constraints\": {

\"maxBudgetPKR\": 50000,

\"maxDispatchMinutes\": 45,

\"availableCrewIds\": null

},

\"planMode\": \"full\"

}

**Success Response --- 200**

{

\"planId\": \"PLAN-20260518-0007\",

\"generatedAt\": \"2026-05-18T09:15:22Z\",

\"totalIncidents\": 5,

\"totalResourcesDispatched\": 4,

\"totalRoadImpacts\": 3,

\"conflictsDetected\": 1,

\"conflictsResolved\": 1,

\"priorityOrdering\": \[\"INC-20260518-0042\",\"INC-20260518-0038\",\...\],

\"incidentPlans\": \[

{

\"incidentId\": \"INC-20260518-0042\",

\"incidentType\": \"water_leak\",

\"severity\": \"high\",

\"urgencyScore\": 8,

\"classificationRationale\": \"Description explicitly mentions water main burst\...\",

\"assignedDepartments\": \[\"DEPT-UTIL\",\"DEPT-TRAFFIC\"\],

\"assignedResources\": \[\"CR-03\",\"VH-07\"\],

\"actionChain\": \[

{ \"step\": 1, \"type\": \"validate_incident\", \"status\": \"complete\" },

{ \"step\": 2, \"type\": \"notify_department\", \"status\": \"complete\" },

{ \"step\": 3, \"type\": \"dispatch_crew\", \"resourceId\": \"CR-03\", \"etaMinutes\": 12 },

{ \"step\": 4, \"type\": \"manage_road_impact\", \"roadIds\": \[\"RD-04\"\] },

{ \"step\": 5, \"type\": \"schedule_followup\", \"scheduledAtMinutes\": 90 }

\],

\"resolvedConflict\": null

}

\],

\"constraintViolations\": \[\]

}

**8.3 POST /simulate --- SimulateResponseFlow**

**Request**

POST /simulate

Content-Type: application/json

{

\"planId\": \"PLAN-20260518-0007\",

\"simulationSpeed\": \"fast\",

\"overrides\": { \"forceApiFailure\": true }

}

**Success Response --- 200**

{

\"runId\": \"SIM-20260518-0003\",

\"planId\": \"PLAN-20260518-0007\",

\"startedAt\": \"2026-05-18T09:16:00Z\",

\"completedAt\": \"2026-05-18T09:16:04Z\",

\"metrics\": {

\"incidentsDelta\": { \"before\": 5, \"after\": 1, \"resolved\": 4 },

\"roadsDelta\": { \"closed\": 2, \"restricted\": 1, \"reopened\": 0 },

\"crewsDispatched\": 4,

\"notificationsSent\": 12,

\"avgResponseTimeMin\": 18.4

},

\"failuresSimulated\": \[

{ \"stepId\": \"STEP-notify-0042-2\", \"error\": \"NOTIFICATION_API_TIMEOUT\",

\"retryCount\": 1, \"fallback\": \"logged_to_operator_queue\", \"recovered\": true }

\],

\"animationFrames\": \[ \... \],

\"beforeState\": { \... },

\"afterState\": { \... }

}

**8.4 GET /trace --- GetAgentTraceFlow**

**Request**

GET /trace?planId=PLAN-20260518-0007&includeSimTrace=true&depth=full

**Success Response --- 200**

{

\"traceId\": \"TRACE-20260518-0007\",

\"planId\": \"PLAN-20260518-0007\",

\"generatedAt\": \"2026-05-18T09:17:00Z\",

\"summary\": {

\"totalSteps\": 42, \"totalLLMCalls\": 8, \"totalToolCalls\": 14,

\"conflictsDetected\": 1, \"constraintsChecked\": 5, \"totalDurationMs\": 3840

},

\"steps\": \[

{ \"stepId\": \"S01\", \"name\": \"Fetch Open Incidents\", \"type\": \"state_update\",

\"status\": \"success\", \"durationMs\": 45,

\"inputSummary\": \"Querying workspace state for open incidents\",

\"outputSummary\": \"Found 5 open incidents\",

\"children\": \[\] },

{ \"stepId\": \"S02\", \"name\": \"Classify: INC-20260518-0042\", \"type\": \"llm_call\",

\"status\": \"success\", \"durationMs\": 820,

\"inputSummary\": \"Description: Water main burst near central market\...\",

\"outputSummary\": \"Type: water_leak \| Severity: high \| Urgency: 8\",

\"decisionRationale\": \"Explicit mention of water main burst and flooding\...\",

\"children\": \[\] },

\...

\]

}

**8.5 GET /incidents --- Incident List**

GET /incidents?status=open,triaged&page=1&pageSize=20

Response 200:

{

\"incidents\": \[ Incident\[\], \... \],

\"total\": 47,

\"page\": 1,

\"pageSize\": 20

}

**8.6 GET /incidents/:id --- Incident Detail**

GET /incidents/INC-20260518-0042

Response 200: Full Incident object with plan data if available

**Section 9 --- The Demo Scenario (Scripted End-to-End)**

Total runtime: approximately 4.5 minutes at a comfortable presentation pace. Record a single continuous screen recording. Presenter speaks while tapping; no post-production cuts required.

**Scene 1 --- Opening Setup (0:00--0:30)**

Screen: Map Dashboard --- 5 incident markers visible across NovaCivitas.

Presenter says: \'This is CityIRA --- a city incident management system powered by Google Antigravity. NovaCivitas has five active incidents right now, and they\'ve arrived from five completely different sources --- a PDF field report, a social media post, a utility CSV feed, a dashboard export, and a citizen report. The city\'s operations team is overwhelmed. Let\'s see what the agent can do.\'

Tap: Briefly tap each marker to show source type badge. Point out the red critical marker pulsing.

**Scene 2 --- The Five Input Types (0:30--1:15)**

Screen: Navigate to Incident List. Show all 5 incidents. Tap each briefly, pointing to the source badge.

Presenter says: \'Incident one came from a PDF field report --- a downed power line in the Central District. Incident two is a social media post: a citizen tweeting about flooding in the Market Quarter. Incident three is from our utility department\'s CSV alert feed --- a pressure anomaly suggesting a water main breach. Incident four is from a dashboard snapshot --- traffic congestion spiking on Main Boulevard. And incident five is a real-time feed item from the emergency call center.\'

Presenter says: \'Notice incidents two and three both point to the Market Quarter --- one says flooding, one says a water main. They\'re contradicting each other. We\'ll come back to that.\'

**Scene 3 --- Run the Agent (1:15--2:00)**

Screen: Return to Map Dashboard.

Presenter says: \'All five of these incidents are sitting at status reported --- no human has touched them. Let\'s let the agent take over.\'

Tap: \'Run Agent Plan\' button. Loading overlay appears.

Presenter says: \'Antigravity\'s TriageAndPlanFlow is now running. It\'s classifying each incident, detecting the contradiction between our two Market Quarter reports, checking which crews are available, applying budget constraints, and generating a coordinated 5-step response plan.\'

Loading overlay disappears. Plan Summary bottom sheet slides up showing 5 classified incidents, contradiction flag, 4 resources dispatched.

Presenter says: \'In under 4 seconds, the agent has classified, routed, and planned a coordinated city-wide response. Let\'s dig in.\'

**Scene 4 --- Contradiction Resolution (2:00--2:45)**

Screen: Tap the Market Quarter incident. Scroll to Contradiction Card.

Presenter says: \'The agent detected the contradiction between the social media flooding report and the utility CSV anomaly. It scored the utility data source as higher credibility --- it comes from a sensor, not a citizen tweet --- and the utility feed is 8 minutes newer. The agent resolved the conflict: this is a water main breach causing localized flooding. Not a flood event. That distinction matters --- the response actions are completely different.\'

Show: Contradiction card with Source A (social feed, credibility 0.62, age 23 min) vs Source B (utility CSV, credibility 0.88, age 8 min). Resolution: \'water_leak confirmed, flood hypothesis rejected, confidence 0.91.\'

**Scene 5 --- Action Chain & Constraints (2:45--3:30)**

Screen: Tap back to the same incident\'s Action Chain section.

Presenter says: \'The agent generated a 5-step action chain for this incident: validate the classification, notify the Utilities Department, dispatch Crew Alpha with an estimated ETA of 12 minutes, restrict Main Boulevard to single lane, and schedule a follow-up check in 90 minutes. Each step respects operational constraints --- the total dispatch cost is PKR 42,000, within our 50,000 limit.\'

Tap: \'Simulate Plan\' from the plan summary sheet.

**Scene 6 --- Simulation & Before/After (3:30--4:00)**

Screen: Simulation View auto-plays.

Presenter says: \'Now the simulation. Watch the crews move from their stations to the incident sites. Watch Main Boulevard turn from green to orange as the lane restriction goes into effect. Four incidents resolve. Two roads reopen after response.\'

Show: Before toggle --- 5 open incidents, 3 affected roads. After toggle --- 1 in-progress, 0 critical open, roads partially restored.

KPI banner: Incidents Resolved: +4. Roads Managed: 3. Avg Response Time: 18 min. Notifications Sent: 12.

Presenter says: \'And here --- one simulated failure. The department notification API timed out. The agent retried, recovered, and logged it to the operator queue. No human intervention needed.\'

**Scene 7 --- Agent Trace (4:00--4:30)**

Screen: Navigate to Agent Trace.

Presenter says: \'Every decision the agent made is traceable. Here\'s the full reasoning tree from Antigravity: 42 steps, 8 LLM calls, 14 tool calls. Tap any node to see what the agent was thinking.\'

Tap: The contradiction resolution node. Show decisionRationale text.

Tap: The constraint check node for budget. Show constraint values.

Presenter says: \'This is not a rule engine. This is a genuine autonomous agent, reasoning through a complex multi-incident city scenario, resolving contradictions, respecting constraints, and producing a coordinated operational plan. Powered by Google Antigravity.\'

Fade to app logo / end.

**Section 10 --- Synthetic City Dataset**

**10.1 City Name: NovaCivitas**

NovaCivitas is a fictional mid-sized Pakistani city used exclusively for the CityIRA demo. All coordinates are based around the Islamabad/Rawalpindi metropolitan area for geographic plausibility but use slightly adjusted values to ensure no real addresses are implicated.

**10.2 Districts**

---

  **ID**   **Name**            **Character**                                       **Pop. Density**
  D-01     Central District    City hall, main market, heritage area               High
  D-02     Market Quarter      Commercial hub, street vendors, high foot traffic   High
  D-03     Industrial Zone     Warehouses, factories, utility infrastructure       Low
  D-04     Residential North   Suburban housing, schools, parks                    Medium
  D-05     Tech Corridor       Offices, hospitals, modern infrastructure           Medium

---

**10.3 Road Segments**

---

  **ID**   **Name**               **Districts**   **Default Status**   **Alternate Route**
  RD-01    Main Boulevard         D-01, D-02      open                 RD-03
  RD-02    Market Street          D-02            open                 RD-05
  RD-03    Industrial Ring Road   D-03            open                 RD-01
  RD-04    Utility Lane           D-02, D-03      open                 RD-06
  RD-05    Heritage Avenue        D-01            open                 RD-02
  RD-06    North Connector        D-04            open                 RD-08
  RD-07    Hospital Road          D-05            open                 RD-09
  RD-08    Suburban Loop          D-04            open                 RD-06
  RD-09    Tech Park Drive        D-05            open                 RD-07
  RD-10    Central Flyover        D-01, D-05      open                 RD-01, RD-09

---

**10.4 Departments**

---

  **ID**         **Name**             **Handles**                     **Resources**
  DEPT-UTIL      Utilities & Water    water_leak, power_outage        CR-01, CR-02, VH-05
  DEPT-TRAFFIC   Traffic Management   road_blockage, accident         CR-03, VH-06, VH-07
  DEPT-EMER      Emergency Services   accident, critical incidents    CR-04, VH-08
  DEPT-WORKS     Public Works         road_blockage, infrastructure   CR-05, VH-06
  DEPT-GEN       General Operations   other                           CR-06

---

**10.5 Resources / Crews**

---

  **ID**   **Name**            **Type**          **Department**   **Home Base**          **Rate (PKR/hr)**
  CR-01    Alpha Water Team    repair_crew       DEPT-UTIL        D-03 Utility Depot     3500
  CR-02    Beta Utilities      repair_crew       DEPT-UTIL        D-03 Utility Depot     3500
  CR-03    Traffic Unit 1      repair_crew       DEPT-TRAFFIC     D-01 City Hall Annex   2800
  CR-04    Rapid Response      ambulance         DEPT-EMER        D-05 Hospital Road     5000
  CR-05    Works Alpha         repair_crew       DEPT-WORKS       D-04 North Depot       3000
  CR-06    General Ops         inspection_team   DEPT-GEN         D-01 City Hall         2500
  VH-05    Utility Truck 1     utility_vehicle   DEPT-UTIL        D-03 Utility Depot     1200
  VH-07    Traffic Cones Van   utility_vehicle   DEPT-TRAFFIC     D-02 Market Depot      1000

---

**10.6 Copy-Pasteable JSON (Abbreviated)**

// NovaCivitas Dataset --- paste into Antigravity workspace state

const CITY_DATASET = {

cityName: \"NovaCivitas\",

districts: \[

{ districtId: \"D-01\", name: \"Central District\", populationDensity: \"high\",

center: { lat: 33.7205, lng: 73.0478 } },

{ districtId: \"D-02\", name: \"Market Quarter\", populationDensity: \"high\",

center: { lat: 33.7185, lng: 73.0512 } },

{ districtId: \"D-03\", name: \"Industrial Zone\", populationDensity: \"low\",

center: { lat: 33.7145, lng: 73.0432 } },

{ districtId: \"D-04\", name: \"Residential North\", populationDensity: \"medium\",

center: { lat: 33.7265, lng: 73.0495 } },

{ districtId: \"D-05\", name: \"Tech Corridor\", populationDensity: \"medium\",

center: { lat: 33.7220, lng: 73.0561 } }

\],

departments: \[\...\], // as per table above

resources: \[\...\], // as per table above

roads: \[\...\] // as per table above

};

**Section 11 --- Sample Incident Feed (The 5 Input Types)**

All five samples relate to a single 90-minute event window in NovaCivitas on the morning of May 18, 2026. They contain a deliberate contradiction between Samples 2 and 3 regarding the Market Quarter incident.

**Input 1 --- PDF / Field Report**

---

  **Field**        **Content**
  Source Type      pdf_report
  Simulated File   nova_civitas_field_report_20260518_0830.pdf
  Content          FIELD INCIDENT REPORT --- NovaCivitas Operations Division. Date: 18 May 2026 08:32. Reporting Officer: Inspector Khalid Mehmood. Location: Industrial Zone (D-03), junction of Industrial Ring Road and Utility Lane. Incident: Electrical distribution panel in Junction Box 7 shows visible arcing. Nearby street lights flickering. No injuries reported. Estimated population affected: 340 households in adjacent Residential North via shared circuit. Recommended immediate action: isolate circuit breaker C-7, dispatch Utilities team. Urgency: HIGH.

---

**Input 2 --- Web Article (Mock)**

---

  **Field**         **Content**
  Source Type       web_article
  Mock URL          https://novacivitasherald.pk/news/market-quarter-flood-alert-20260518
  Content Snippet   BREAKING: Residents in the Market Quarter reported flash flooding along Market Street this morning following overnight rainfall. Several vehicles were seen submerged near the Market Street intersection. Emergency services have been called. Witnesses say water levels reached knee height by 8:45 AM. City authorities have not yet issued an official statement. Residents are advised to avoid Market Street until further notice.
  Published         2026-05-18T08:52:00Z (23 minutes before ingestion)

---

**Input 3 --- CSV / JSON (Utility Alert Feed)**

// Source Type: csv_json

// Feed: nova_civitas_utility_sensor_feed.json

// Timestamp: 2026-05-18T09:08:00Z (8 minutes before ingestion)

{

\"feedVersion\": \"2.1\",

\"generatedAt\": \"2026-05-18T09:08:00Z\",

\"alerts\": \[

{

\"alertId\": \"UTIL-20260518-0047\",

\"sensorId\": \"PIPE-MQ-14\",

\"sensorLocation\": { \"lat\": 33.7185, \"lng\": 73.0512, \"zone\": \"Market Quarter\" },

\"alertType\": \"PRESSURE_ANOMALY\",

\"severity\": \"HIGH\",

\"pressureReadingKPa\": 18.2,

\"normalRangeKPa\": \"60--80\",

\"anomalyDetectedAt\": \"2026-05-18T08:38:00Z\",

\"sustainedForMinutes\": 30,

\"interpretation\": \"Severe pressure drop consistent with major pipe breach\",

\"recommendedAction\": \"Immediate dispatch of water team to PIPE-MQ-14 zone\"

}

\]

}

// NOTE: This CONTRADICTS Input 2. Input 2 says \'flooding\'.

// Input 3 says \'pipe breach causing pressure anomaly\'.

// The agent must resolve this contradiction.

**Input 4 --- Table / Dashboard Export**

---

  **Metric**                   **08:00**   **08:30**   **09:00**   **09:15 (latest)**
  Main Blvd congestion %       22%         31%         58%         74% ⚠️
  Market Street congestion %   18%         19%         22%         67% ⚠️
  Open incident count          1           2           3           5
  Available crews              8           8           7           6
  Road closures active         0           0           0           0 (not yet acted on)

---

Source: NovaCivitas Traffic Management Dashboard Export. Generated: 2026-05-18T09:15:00Z. Exported by: Automated 15-minute interval snapshot.

**Input 5 --- Mock Real-Time Feed (Emergency Call Center Log)**

// Source Type: realtime_feed

// Feed: nova_civitas_911_log_stream

// Entry Timestamp: 2026-05-18T09:12:00Z

{

\"callId\": \"CALL-20260518-0218\",

\"receivedAt\": \"2026-05-18T09:12:00Z\",

\"callerType\": \"citizen\",

\"transcriptExcerpt\": \"Operator: NovaCivitas Emergency, what is your emergency?

Caller: Haan bhai sunein, Central Flyover pe ek gaari ka accident ho gaya hai.

Ek truck side se ja laga. Driver bahar hai, injured lagta hai.

Operator: Location confirm karein? Caller: Central Flyover, D-01 aur D-05 ke beech.\",

\"classifiedType\": \"accident\",

\"classifiedLocation\": \"Central Flyover, D-01/D-05 boundary\",

\"classifiedCoordinates\": { \"lat\": 33.7215, \"lng\": 73.0520 },

\"urgency\": \"HIGH\",

\"operatorNotes\": \"Bilingual call (Urdu/English). Truck vs car, 1 injured. Ambulance requested.\"

}

*ℹ️ The contradiction between Input 2 (flooding narrative) and Input 3 (pipe pressure anomaly) is deliberate. The agent must score Input 3 as higher credibility (sensor data from 8 minutes ago vs news article from 23 minutes ago) and resolve to \'water_leak\' classification, noting that the flooding appearance is a symptom of the pipe breach, not a primary flood event.*

**Section 12 --- Agent Reasoning & Trace Design**

**12.1 Trace Object Structure**

Every Antigravity flow execution appends to the workspace trace log. The GetAgentTraceFlow assembles these entries into a unified AgentTrace tree. The structure is defined as follows:

AgentTrace {

traceId: string

planId: string

generatedAt: ISO string

summary: {

totalSteps: number

totalLLMCalls: number

totalToolCalls: number

totalDecisionNodes: number

conflictsDetected: number

constraintsChecked: number

totalDurationMs: number

}

steps: TraceStep\[\]

}

TraceStep {

stepId: string // e.g. S01, S02-A, S02-B

name: string // Human-readable label

type: enum // llm_call \| tool_call \| decision \| state_update \| error

status: enum // success \| warning \| failure

durationMs: number

inputSummary: string // Short description of inputs

outputSummary: string // Short description of outputs

decisionRationale: string? // For decision nodes only

llmDetails: { // For llm_call nodes only

promptExcerpt: string // First 200 chars of prompt

responseExcerpt: string // First 200 chars of response

tokensUsed: number // Simulated

}?

toolDetails: { // For tool_call nodes only

toolName: string

inputFields: string\[\]

outputFields: string\[\]

}?

constraintDetails: { // For constraint check sub-steps

constraintName: string

requiredValue: string

actualValue: string

passed: boolean

}?

children: TraceStep\[\] // Nested sub-steps

}

**12.2 Example Full Trace --- TriageAndPlanFlow (Abbreviated)**

**Step S01 --- Fetch Open Incidents**

Type: state_update \| Status: success \| Duration: 45ms

Input: \'Query workspace incidents array for status in \[reported, triaged\]\'

Output: \'Found 5 incidents: INC-0042 (realtime_feed, Market Quarter), INC-0038 (pdf_report, Industrial Zone), INC-0035 (web_article, Market Quarter), INC-0031 (csv_json, Market Quarter), INC-0029 (table_dashboard, Central District)\'

**Step S02 --- Classify INC-0042 (Real-time Feed --- Accident, Central Flyover)**

Type: llm_call \| Status: success \| Duration: 820ms \| Tokens: 1247

Prompt Excerpt: \'You are a city operations incident analyst. Classify the following incident report: \[Bilingual emergency call transcript about truck accident on Central Flyover\]\...\'

Response Excerpt: \'{\"incidentType\": \"accident\", \"severity\": \"high\", \"urgencyScore\": 9, \"affectedRadius\": 200, \"estimatedDuration\": 60, \"classificationRationale\": \"Emergency call transcript confirms vehicular accident with injuries\...\"}

Decision Rationale: \'Emergency call transcripts are the highest credibility source type. Explicit mention of injury confirms high severity. Central Flyover location affects two districts simultaneously, elevating urgency to 9/10.\'

**Step S03 --- Classify INC-0035 + INC-0031 (Contradiction Detected)**

Type: decision \| Status: warning \| Duration: 1640ms

Input: \'Two incidents within 200m of each other, within 30-minute window. INC-0035 (web_article): flooding on Market Street. INC-0031 (csv_json, utility sensor): pressure anomaly at PIPE-MQ-14, consistent with major pipe breach.\'

Sub-step S03-A: ContradictionResolverTool call

Tool Input: Both incident objects with sourceType, rawTimestamp, and description.

Tool Output: \'{ conflictType: \"severity_and_type_mismatch\", sourceACredibility: 0.62, sourceBCredibility: 0.88, ageMinutesA: 23, ageMinutesB: 8, resolution: \"water_leak\", confidence: 0.91, rationale: \"Sensor data (Source B) is 15 minutes newer and comes from a calibrated pressure sensor --- objective measurement. Source A is a news article describing visible symptoms (water on road) rather than underlying cause. The pipe breach at PIPE-MQ-14 would produce exactly the flooding symptoms described. Accept Source B interpretation. Classify as water_leak.\" }\'

Decision Rationale: \'Source B (utility CSV sensor data) wins: higher credibility score (0.88 vs 0.62), significantly more recent (8 min vs 23 min), and provides causal mechanical data rather than symptom observation. The flooding described in Source A is the expected visible effect of the pipe breach confirmed by Source B. This is not a flood incident --- it is a water main rupture.\'

**Step S04 --- Route INC-0031 (Merged Incident)**

Type: tool_call \| Status: success \| Duration: 22ms

Tool: RoutingTool \| Input: incidentType=water_leak \| Output: assignedDepartments=\[DEPT-UTIL, DEPT-TRAFFIC\]

**Step S05 --- Match Resources**

Type: tool_call \| Status: success \| Duration: 67ms

Tool: ResourceMatcherTool \| Input: { departments: \[DEPT-UTIL, DEPT-TRAFFIC\], incidentCoords: {lat:33.7185, lng:73.0512} }

Output: Ranked matches: CR-01 (Alpha Water Team, distance 1.2km, available), VH-07 (Traffic Cones Van, distance 0.8km, available). CR-02 excluded: already assigned to INC-0038.

**Step S06 --- Constraint Check**

Type: decision \| Status: success \| Duration: 18ms

Constraint: maxBudgetPKR=50000. Calculated cost: CR-01 dispatch (2hr @ PKR3500) = PKR7000. VH-07 deployment (2hr @ PKR1000) = PKR2000. Total = PKR9000. Within limit.

Constraint: maxDispatchMinutes=45. CR-01 ETA from D-03 to D-02 = 12 minutes. Within limit.

Result: All constraints passed. Proceed with plan.

**Step S07 --- Build Action Chain for INC-0031**

Type: state_update \| Status: success \| Duration: 34ms

Output: 5-step action chain created: \[validate_incident, notify_department, dispatch_crew (CR-01 + VH-07, ETA 12min), manage_road_impact (RD-02 → restricted), schedule_followup (T+90min)\]

**Step S08 --- Draft Notification for DEPT-UTIL**

Type: llm_call \| Status: success \| Duration: 710ms

Output operator alert: \'INCIDENT INC-0031: Water main breach confirmed at Market Quarter (PIPE-MQ-14). Alpha Water Team dispatched, ETA 12 min. Main Boulevard lane restriction in effect. Monitor pressure readings.\'

Output public announcement: \'Water service disruption in Market Quarter. Crews en route. Avoid Market Street. Estimated resolution: 90 min.\'

**Section 13 --- Robustness & Edge Cases**

---

  **\#**   **Scenario**                 **Trigger**                                                                               **Detection**                                                                                                                **Fallback / Recovery**                                                                                                                                                                                        **UI Surface**
  1        API Failure Mid-Flow         Notification API call times out during SimulateResponseFlow                               Flow detects HTTP 504 after 5-second timeout on notify_department step                                                       Retry once after 2-second delay. On second failure, log notification to operator_queue with message \'API unavailable --- queued for manual dispatch\'. Continue remaining action steps.                       Simulation View shows red failure card: \'NOTIFICATION_API_TIMEOUT --- retried 1x --- logged to queue\'. Action step shows amber WARNING status. Demo uses overrides.forceApiFailure=true to trigger reliably.
  2        Contradictory Data Sources   Two incidents within 200m in 30-min window with conflicting type/severity                 ContradictionResolverTool detects type mismatch (flood vs pipe_breach) or severity mismatch (\>1 level difference)           Score credibility and recency of both sources. Accept higher-scoring source. Log resolution with confidence score. If confidence \< 0.6, flag for human review but still proceed.                              Incident Detail shows Contradiction Card with both sources, scores, and resolution. Agent Trace shows decision node S03 with full rationale.
  3        Missing Location Data        Incident submitted with no coordinates and no recognizable address                        GeoNormalizerTool returns confidence \< 0.3 after fuzzy-matching attempt                                                     Set requiresLocationClarification=true. Include incident in plan but mark location as \'Unresolved --- District-level only\'. Resource matching uses district centroid coordinates instead.                    Map marker appears at district centroid with dashed border indicating uncertain location. Incident Detail shows amber banner: \'Location unverified --- approximate placement used\'.
  4        All Resources Unavailable    TriageAndPlanFlow runs but ResourceMatcherTool finds all relevant crews assigned          ResourceMatcherTool returns empty array after checking all DEPT-UTIL resources                                               Create waitlist plan: identify soonest-available crew (check assignedIncidentId estimated completion time). Include estimated_available_at in action chain. Set resourceUnavailable=true on dispatch step.     Incident Detail shows \'No crews available --- Crew CR-02 estimated free in 35 min. Waitlist position: 1.\' Action step shows clock icon with ETA.
  5        Stale Data / False Alarm     An incident ingested 4+ hours ago still shows status=reported but is no longer relevant   During TriageAndPlanFlow, check incident age. Flag incidents older than 3 hours with status=reported as potentially stale.   Call IncidentClassifierTool with a staleness check prompt. If LLM returns staleness_likely=true, change status to awaiting_verification and exclude from active dispatch. Append staleness_warning to trace.   Incident card shows gray \'STALE?\' badge. Plan Summary shows note: \'INC-0021 excluded from active plan --- submitted 4h ago, unverified. Confirm or close.\'

---

**Section 14 --- Baseline Comparison**

**14.1 What the Baseline Is**

The non-agentic baseline is a simple rule-based incident router: the \'Static Triage Table\'. It accepts an incident type (manually entered or naively keyword-matched) and looks up a fixed dispatch table to assign a department. It performs no LLM reasoning, no contradiction detection, no constraint checking, and no multi-step action planning. It returns a single department assignment and a fixed notification template.

**14.2 How the Baseline Works**

The Static Triage Table operates as follows: if the incident description contains the word \'water\' or \'flood\', assign DEPT-UTIL. If it contains \'power\' or \'electric\', assign DEPT-UTIL. If it contains \'accident\' or \'crash\', assign DEPT-EMER. If it contains \'road\' or \'blockage\', assign DEPT-TRAFFIC. Otherwise, assign DEPT-GEN. No prioritization, no contradiction handling, no resource matching, no constraint checking. One size fits all.

**14.3 Comparison --- Same 5 Input Demo Scenario**

---

  **Dimension**                           **CityIRA (Agentic)**                               **Static Triage Table (Baseline)**
  Input types handled                     All 5 types with normalization                      Text only --- PDF/CSV/dashboard ignored
  Contradiction detection                 ✅ Detected and resolved flood vs pipe breach        ❌ Both incidents routed to DEPT-UTIL without noting conflict
  Classification accuracy (5 incidents)   5/5 correctly typed                                 3/5 --- accident correctly routed; 2 incidents misclassified due to keyword overlap
  Action chain depth                      3--5 steps per incident with sequencing             1 step: \'assign department\'
  Constraint checking                     ✅ Budget, time, availability all checked            ❌ None --- always assigns regardless of availability
  Resource matching                       ✅ Nearest available matching crew                   ❌ No resource assignment --- department-level only
  Road impact                             ✅ Adjacent roads flagged and status updated         ❌ Not considered
  Notifications                           ✅ 3 audience-specific drafts per incident           ❌ One generic \'Incident reported\' template
  Multi-incident coordination             ✅ Priority ordering, resource conflict prevention   ❌ Each incident treated in isolation
  Transparency                            ✅ Full reasoning trace with rationale               ❌ No reasoning logged

---

**14.4 How the Comparison Is Shown in the App**

A \'Baseline Mode\' toggle appears in the Map Dashboard settings panel. When enabled, the app calls a /plan?mode=baseline endpoint which executes the Static Triage Table logic instead of TriageAndPlanFlow. The resulting plan is displayed with a \'Baseline Plan\' banner. Users can toggle between \'Agent Plan\' and \'Baseline Plan\' views to see the difference in plan quality side by side. The Agent Trace screen shows a simplified single-node trace for the baseline (\'Keyword match: water → DEPT-UTIL\') versus the full multi-step tree for the agentic version.

**Section 15 --- Build Plan (1--2 Day Vibe Coding Sprint)**

Total sprint window: 36 hours. Team: Developer A (Antigravity + Backend), Developer B (Mobile App). Build starts immediately after this document is read.

**Phase 0 --- Setup (Hours 0--2)**

---

  **Task**                                                                                             **Owner**   **Priority**
  Create Google Antigravity workspace \'CityIncidentWorkspace\'                                        Dev A       MVP
  Initialize React Native + Expo project with TypeScript template                                      Dev B       MVP
  Install dependencies: React Navigation, NativeWind, react-native-maps, React Query, Zustand, Axios   Dev B       MVP
  Set up NovaCivitas dataset JSON file in Antigravity workspace state                                  Dev A       MVP
  Configure .env file with Antigravity base URL placeholder                                            Dev B       MVP

---

**Phase 1 --- Antigravity Flows (Hours 2--12)**

---

  **Task**                                                                              **Owner**   **Priority**
  Build IngestIncidentFlow: validate, normalize, GeoNormalizerTool, persist             Dev A       MVP
  Build IncidentClassifierTool (LLM prompt, JSON schema output)                         Dev A       MVP
  Build TriageAndPlanFlow: classify, contradiction detection, routing, resource match   Dev A       MVP
  Build ContradictionResolverTool (LLM prompt with credibility scoring)                 Dev A       MVP
  Build NotificationDraftTool (LLM prompt for 3 audiences)                              Dev A       MVP
  Build RoutingTool and ResourceMatcherTool (custom rule-based)                         Dev A       MVP
  Build SimulateResponseFlow: state transitions, animation frames, failure injection    Dev A       MVP
  Build GetAgentTraceFlow: assemble and return trace tree                               Dev A       MVP
  Test all 4 flows with curl / Postman using the 5 sample inputs                        Dev A       MVP
  Build /plan?mode=baseline endpoint for baseline comparison                            Dev A       Nice-to-have

---

**Phase 2 --- Mobile App Scaffold (Hours 4--14, parallel with Phase 1)**

---

  **Task**                                                                                   **Owner**   **Priority**
  Scaffold all 6 screens with placeholder content and navigation wired                       Dev B       MVP
  Implement MapDashboard: map, markers, filter chips, status banner, Run Agent Plan button   Dev B       MVP
  Implement ReportIncident: form, location picker, submit → ingest API                       Dev B       MVP
  Implement IncidentList: list, filter, sort, navigation to detail                           Dev B       MVP
  Implement IncidentDetail: all sections including action chain, contradiction card          Dev B       MVP
  Set up React Query hooks for all API endpoints                                             Dev B       MVP
  Set up Zustand store for UI state                                                          Dev B       MVP
  Build severity badge, status badge, source badge components                                Dev B       MVP
  Build action chain step row component                                                      Dev B       MVP
  Build KPI delta card component                                                             Dev B       MVP

---

**Phase 3 --- Integration & Data Wiring (Hours 14--22)**

---

  **Task**                                                                         **Owner**   **Priority**
  Connect all API calls to live Antigravity endpoints                              Dev A + B   MVP
  Load the 5 sample incidents into Antigravity workspace state                     Dev A       MVP
  Implement SimulationView: before/after toggle, action timeline, metrics banner   Dev B       MVP
  Implement animation frame playback for crew movement and road transitions        Dev B       MVP
  Implement AgentTrace screen: trace tree, expandable nodes, decision rationale    Dev B       MVP
  Test end-to-end flow: ingest → plan → simulate → trace                           Dev A + B   MVP
  Implement forceApiFailure override for demo failure scenario                     Dev A       MVP
  Implement duplicate detection in IngestIncidentFlow                              Dev A       Nice-to-have

---

**Phase 4 --- Demo Polish (Hours 22--30)**

---

  **Task**                                                                    **Owner**   **Priority**
  Add pulsing animation to critical markers                                   Dev B       MVP (demo)
  Polish Plan Summary bottom sheet design and content                         Dev B       MVP (demo)
  Add failure card to SimulationView                                          Dev B       MVP (demo)
  Ensure all 5 sample incidents display correctly with proper source badges   Dev A + B   MVP (demo)
  Full run-through of demo narrative (Section 9) --- time it                  Dev A + B   MVP (demo)
  Fix any visual or data bugs found in run-through                            Dev A + B   MVP (demo)
  Build EAS build for APK generation                                          Dev B       MVP (submission)
  Add baseline comparison mode toggle                                         Dev B       Nice-to-have

---

**Phase 5 --- Submission Prep (Hours 30--36)**

---

  **Task**                                                     **Owner**   **Priority**
  Record 4.5-minute demo video following script in Section 9   Dev A + B   MVP
  Export Antigravity trace logs from the demo run              Dev A       MVP
  Write README using template in Section 16                    Dev A       MVP
  Complete Google Form submission with all required links      Dev A + B   MVP
  Final APK test on physical Android device                    Dev B       MVP
  Double-check submission checklist in Section 17              Dev A + B   MVP

---

**Section 16 --- README Template**

Copy the following README content verbatim into README.md in the project root. Replace \[BRACKET\] items with actual values at submission time.

\# City Incident-to-Response Routing Agent (CityIRA)

\#\#\# Google Antigravity Hackathon --- Challenge 1: Autonomous Content-to-Action Agent

\#\# Project Overview

CityIRA is a mobile-first autonomous agent platform that ingests city incident

reports from 5 input types, extracts actionable insights, resolves contradictions

between sources, generates multi-step coordinated response plans, simulates

execution on a synthetic city environment (NovaCivitas), and exposes full

transparent reasoning traces --- all orchestrated through Google Antigravity.

\#\# Architecture

Mobile App (React Native + Expo) → HTTP REST → Google Antigravity Workspace

→ In-Memory Workspace State (NovaCivitas Dataset)

Three layers:

1\. React Native + Expo mobile app: pure presentation layer

2\. Google Antigravity workspace: all agentic logic (4 flows)

3\. In-memory workspace state: NovaCivitas synthetic city dataset

\#\# Antigravity Role

Google Antigravity IDE was used to vibe-code the entire backend and mobile app from scratch. The custom FastAPI + LangGraph backend handles all agentic business logic at runtime.

\- IngestIncidentFlow: normalizes incoming incident reports

\- TriageAndPlanFlow: classifies incidents, detects contradictions, plans 3-5 step action chains

\- SimulateResponseFlow: applies plans to city state, produces before/after snapshots

\- GetAgentTraceFlow: returns structured reasoning tree for transparency

The mobile app calls Antigravity HTTP endpoints only. No business logic exists in the app.

\#\# Flows Description

See full PRD + Technical Spec for deep specification of each flow.

Brief summary:

\- IngestIncidentFlow: validate → normalize → GeoNormalize → persist

\- TriageAndPlanFlow: classify (LLM) → detect contradictions → route → match resources

→ build action chain → check constraints → draft notifications → prioritize

\- SimulateResponseFlow: load plan → capture before state → execute actions →

capture after state → compute metrics → generate animation frames

\- GetAgentTraceFlow: assemble trace tree from workspace logs → enrich → return

\#\# Tech Stack

Mobile: React Native \[version\], Expo \[version\], TypeScript

Navigation: React Navigation 6

UI: NativeWind (Tailwind for RN)

Maps: react-native-maps with OpenStreetMap tiles

State: React Query + Zustand

Agent Layer: Google Antigravity (\[workspace URL\])

\#\# Setup Instructions

1\. Clone repository

2\. Run: npm install

3\. Copy .env.example to .env and set ANTIGRAVITY_BASE_URL=\[your endpoint\]

4\. Run: npx expo start

5\. Scan QR code with Expo Go, or run: npx expo build:android for APK

\#\# Data Sources & Schemas

NovaCivitas synthetic city dataset: 5 districts, 10 roads, 5 departments, 8 crews

5 sample incidents (one per input type) pre-loaded in Antigravity workspace state

See Section 10 and Section 11 of PRD for full schemas and sample data

\#\# APIs Used

Google Antigravity (LLM tools): IncidentClassifierTool, ContradictionResolverTool,

NotificationDraftTool

Google Antigravity (custom tools): RoutingTool, ResourceMatcherTool, GeoNormalizerTool

No external third-party APIs required for MVP

\#\# Assumptions

\- All city data is simulated; no real municipal systems are integrated

\- In-memory state resets on workspace restart (acceptable for hackathon demo)

\- Coordinates are approximate, clustered around Islamabad/Rawalpindi area

\- NovaCivitas is entirely fictional; no real addresses are referenced

\- Simulation is illustrative, not real-time

\#\# Privacy Note

No real personal data is used anywhere in this system. All incident descriptions,

caller transcripts, and location data are entirely fabricated for demonstration.

The 5 sample incidents and NovaCivitas dataset contain no real PII.

\#\# Cost / Latency Estimate

IngestIncidentFlow: \~500ms, \~0 LLM calls, estimated cost \< \$0.001 per call

TriageAndPlanFlow (5 incidents): \~4--6 seconds, \~8 LLM calls (IncidentClassifier x5,

ContradictionResolver x1, NotificationDraft x2), estimated cost \~\$0.03--0.05 per run

SimulateResponseFlow: \~2--3 seconds, 0 LLM calls, estimated cost \< \$0.001 per run

GetAgentTraceFlow: \~200ms, 0 LLM calls, estimated cost \< \$0.001 per call

Total per full demo session: \~\$0.05

\#\# Scalability Note

10x scale (50 incidents): TriageAndPlanFlow should be parallelized; LLM calls for

classification can run concurrently per incident. Estimated \~8--12s at 50 incidents.

100x scale (500 incidents): Requires a persistent database (e.g., Firestore) to

replace in-memory state. Antigravity flows remain valid but workspace state must

be externalized. LLM calls can be batched. Estimated \$5--10 per planning run.

\#\# Baseline Comparison

Non-agentic baseline: Static Triage Table (keyword-based department assignment)

See Section 14 of PRD for full comparison.

Demo: Toggle \'Baseline Mode\' in app settings to compare plans side-by-side.

\#\# Known Limitations

\- Location resolution uses NovaCivitas lookup only; real addresses not supported

\- Animation frames are pre-computed, not truly real-time

\- Multi-language incident descriptions (Urdu/Roman Urdu) accepted but classified in English

\- No authentication layer in MVP (all users have operator-level access)

\- In-memory state does not persist across Antigravity workspace restarts

**Section 17 --- Submission Checklist**

This checklist maps every hackathon submission requirement to the specific artifact we produce, where it lives in the project, and who is responsible.

---

  **Requirement**                                                    **Our Artifact**                                                                    **Location in Project**                           **Owner**   **Status**
  Working prototype --- mobile app (APK)                             React Native + Expo APK built via EAS Build                                         Shared via Google Drive link in submission form   Dev B       Build in Phase 4
  Demo video --- 3--5 minutes                                        MP4 screen recording following script in Section 9                                  Google Drive / YouTube unlisted link              Dev A       Record in Phase 5
  Demo video shows: input → insight → action → simulation → result   All 7 scenes in Section 9 script cover this                                         N/A                                               Dev A + B   Script written
  Antigravity agent traces / logs                                    GetAgentTraceFlow output exported as JSON; also visible live in AgentTrace screen   logs/ folder in repo + in-app                     Dev A       Export in Phase 5
  Workplan                                                           Visible in AgentTrace screen as top-level flow steps                                In-app trace tree                                 Dev A       Built in Phase 1
  Tasks plan                                                         Each TraceStep in the trace tree                                                    In-app trace tree                                 Dev A       Built in Phase 1
  Reasoning steps                                                    decisionRationale fields in decision-type TraceSteps                                In-app trace tree + exported JSON                 Dev A       Built in Phase 1
  Decision flow                                                      Chronological step order in AgentTrace, contradiction resolution node               In-app trace tree                                 Dev A       Built in Phase 1
  Action execution log                                               SimulatedAction\[\] array in SimulationRun                                          In-app Simulation View timeline + exported JSON   Dev A       Built in Phase 1
  README --- architecture overview                                   Architecture diagram and description                                                README.md (Section 16 template)                   Dev A       Write in Phase 5
  README --- tools/APIs used                                         Tech stack + Antigravity tools list                                                 README.md                                         Dev A       Write in Phase 5
  README --- how Antigravity is used                                 Flows description + Antigravity role section                                        README.md                                         Dev A       Write in Phase 5
  README --- assumptions                                             Assumptions section                                                                 README.md                                         Dev A       Write in Phase 5
  Working prototype --- mobile app (mandatory)                       APK file                                                                            EAS Build output                                  Dev B       Build Phase 4
  5 input types ingested                                             5 sample incidents pre-loaded (Section 11)                                          Antigravity workspace state                       Dev A       Load Phase 3
  Multi-step action chain (3--5 steps)                               5-step chain in TriageAndPlanFlow                                                   Antigravity flow code                             Dev A       Build Phase 1
  Contradiction detection and resolution                             ContradictionResolverTool in TriageAndPlanFlow                                      Antigravity flow code + trace                     Dev A       Build Phase 1
  Constraint-based decision making                                   Budget + time + availability checks in TriageAndPlanFlow                            Antigravity flow code + trace                     Dev A       Build Phase 1
  Failure recovery scenario                                          forceApiFailure override in SimulateResponseFlow                                    Antigravity flow code + Simulation View           Dev A       Build Phase 1/3
  Before/after outcome visualization                                 Before/After toggle in Simulation View + KPI delta cards                            Mobile app Simulation screen                      Dev B       Build Phase 3
  Baseline comparison                                                Baseline Mode toggle + /plan?mode=baseline endpoint                                 Mobile app + Antigravity endpoint                 Dev A + B   Phase 4 (nice-to-have)
  Cost/latency note                                                  Cost estimate in README                                                             README.md                                         Dev A       Write Phase 5
  Scalability note                                                   Scalability section in README                                                       README.md                                         Dev A       Write Phase 5
  Robustness evidence (1+ scenario)                                  5 scenarios defined; failure scenario demonstrated live in demo                     Demo script Scene 6 + Simulation View             Dev A + B   Demo Phase 4

---

*--- End of Document ---*

City Incident-to-Response Routing Agent \| CityIRA \| Google Antigravity Hackathon 2026
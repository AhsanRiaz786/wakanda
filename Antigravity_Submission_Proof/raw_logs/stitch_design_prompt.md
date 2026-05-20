# Wakanda - End-to-End Design Prompt for Stitch

**Copy and paste the entire prompt below into Stitch (or your preferred AI UI/UX design generator) to generate the complete design system and screens for the Wakanda mobile app.**

***

### System Role & Objective
You are an elite Mobile UI/UX Designer and Frontend Engineer. Your task is to design a complete, premium, production-ready React Native mobile application called **Wakanda**. 

Wakanda is an autonomous, agentic coordination dashboard for city operators. It ingests messy incident reports, uses LLMs to triage them, generates multi-step response plans, and simulates those actions on a city map. 

The design must **"WOW"** the user. It needs to feel highly premium, state-of-the-art, and alive. Do not create a simple MVP look; use modern design best practices (subtle glassmorphism, rich typography, smooth gradients, micro-animations, and stark data visualization). **CRITICAL: Do not use any emojis in the design. Use professional, state-of-the-art vector icon sets (such as Lucide, Phosphor, or Heroicons) exclusively for all iconography.**

### Design System & Visual Style
- **Vibe:** Professional, data-dense, utility-forward. Evokes a real city operations control room: dark navy accents, status-coded colors, map-centric layout. Avoid consumer-app decoration in favor of clarity and scannability.
- **Typography:** Use a modern, sleek sans-serif font like `Inter` or `System UI`. Headings should be bold and tight (`#0D3B7A` Primary Dark Blue); data labels should be uppercase, small, and tracked out (letter-spacing).
- **Color Palette:**
  - **Primary Blue:** `#1A56A0` (Primary buttons, active states)
  - **Primary Dark Blue:** `#0D3B7A` (App bar, section headings)
  - **Teal Accent:** `#0E7C7B` (Secondary actions)
  - **Critical (Red):** `#DC2626` (Error states, closed roads)
  - **High (Orange):** `#EA580C`
  - **Medium (Yellow):** `#CA8A04`
  - **Warning (Amber):** `#D97706` (In-progress, conflicts)
  - **Success (Green):** `#16A34A` (Resolved, open roads)
  - **Low (Blue):** `#2563EB`
  - **Backgrounds:** Sleek Dark Mode preferred or crisp Light Mode using Background Gray `#F3F4F6` and Card White `#FFFFFF`.
- **Spacing Scale:** Use an 8pt base grid (xs=4, sm=8, md=16, lg=24, xl=32, xxl=48). Screen horizontal padding is 16pt. Card internal padding is 16pt.

### Shared Components & Tokens
- **Severity Badges:** Pill-shaped badge. Background is severity color at 15% opacity, text is full opacity.
- **Status Badges:** Rounded rectangle with status color background and white text (Reported, Triaged, Assigned, In Progress, Resolved).
- **Source Badges:** Flat pill. Background `#EFF6FF`, Text `#1A56A0` with a professional icon (File text, Globe, Database, Bar chart, Signal).
- **Incident Map Marker:** Circle with inner dot. Outer ring is severity color at 40% opacity, inner is solid. Critical markers pulse with 1.4x scale animation.
- **Action Step Row:** Circular step number badge, step name, description, and status icon (checkmark, clock, X). Connected by 1pt dashed gray line.
- **Trace Node:** Left border 3pt solid colored by type. Expanded state shows gray-background detail block.

---

### Screen-by-Screen Specification

#### Screen 1: Map Dashboard (The Home Screen)
- **App Header Bar:** Title 'Wakanda' in bold blue, subtitle 'NovaCivitas Operations', notification bell icon top right. Small toggle: "Agent Mode" vs "Baseline Mode".
- **Full-Screen Map:** High-contrast style.
- **Map Overlays:** Incident Markers (pulsing for critical), User Location FAB bottom-right.
- **Filter Chip Row:** Horizontal scrollable chips below map: All | Road Blockage | Water Leak | Power Outage | Accident | Other.
- **Status Banner:** Three KPI cards side by side: Open (count, red), In Progress (count, amber), Resolved (count, green).
- **Primary Action:** Large primary FAB, bottom of screen: **"Run Agent Plan ->"**.
- **Bottom Nav Bar:** 4 tabs: Map, Incidents, Report, Trace.

#### Screen 2: Incident Feed (List View)
- **Controls:** Full-width Search Bar at top. Sort Dropdown (Newest, Oldest, Severity, Urgency Score). Filter Strip (Status filter pills).
- **Incident Cards:** Severity color left border, incident type icon, title, source label badge, relative timestamp, status badge, assigned department name.
- **Special State:** Glowing amber border for "Contradiction Detected".

#### Screen 3: Incident Detail
- **Header:** Severity color banner, type icon + label, incident ID, created timestamp.
- **Status Timeline:** Horizontal stepper: Reported -> Triaged -> Assigned -> In Progress -> Resolved.
- **Description & Location:** Description Card (sanitized text, source badge). Location Card (Mini map + district name).
- **Classification Card:** Incident Type, Severity, Urgency Score (1-10 bar visualization), Estimated Duration, Affected Radius.
- **LLM Rationale:** Expandable accordion: 'Why was this classified this way?'.
- **Assigned Resources:** Department chips, Resource cards (icon, name, type, status, ETA).
- **Action Chain Timeline:** Numbered list 1-5 (Validate -> Notify Dept -> Dispatch Crew -> Manage Road -> Schedule Follow-up).
- **Impacts & Comms:** Road Impacts list (open/restricted/closed), Notification Drafts (Operator | Public | Department tabs).
- **Contradiction Card:** Shows conflicting sources, resolution summary, confidence score, selected resolution.

#### Screen 4: Report Incident (Ingest Form)
- **Header:** 'Report an Incident' title + back button.
- **Source Type Selector:** Horizontal icon buttons: Citizen Report | Social Post | Call Note | News Article | Data Feed.
- **Form Fields:** Multi-line description (2000 char limit), Category Selector grid (optional), Location Picker (Map with draggable pin), Photo Attach button.
- **Action:** Primary blue "Submit Incident Report" button.
- **Success State:** Checkmark icon, 'Report Submitted', incident ID.

#### Screen 5: Simulation View (The "Wow" Screen)
- **Before/After Toggle:** Large segmented control at top: BEFORE | AFTER.
- **Animated Map:** Crew icons animating along paths, road segments changing color (green=open, orange=restricted, red=closed).
- **Metrics Banner:** 4 KPI delta cards: Incidents Resolved (+N), Roads Reopened (+N), Crews Dispatched (N), Notifications Sent (N).
- **Action Timeline:** Vertical scrollable list of SimulatedActions (timestamp | step icon | description).
- **Playback Controls:** Play/Pause/Restart icons for the animation.
- **Failure Scenario Card:** Red-bordered card showing error type, retry count, recovery action.

#### Screen 6: Agent Trace (Transparency View)
- **Header & Summary:** 'Agent Reasoning Trace' header. Row of 5 mini stats: Steps | LLM Calls | Tool Calls | Conflicts | Constraints Checked.
- **Flow Selector:** Segmented control: Triage & Plan | Simulation.
- **Trace Tree:** Scrollable tree. Nodes show professional icons (LLM, tool, decision, state update, error), step name, status badge (SUCCESS/WARNING/FAILURE), duration ms.
- **Highlight Panel:** For expanded 'decision' nodes, show decision rationale in a blue-bordered quote block.
- **LLM Call Detail:** For expanded LLM nodes, show model used, prompt excerpt, response excerpt, tokens used.
- **Contradiction Node:** Source A vs Source B summary, credibility scores, resolution chosen.
- **Constraint Node:** Constraint name, required value, actual value, pass/fail result.

### Final Polish Instructions
- Avoid flat, boring designs. 
- Use subtle drop shadows, inner glows on buttons, and gradients.
- Make sure data looks realistic (e.g., use "INC-20260518-0042" for IDs, "DEPT-UTIL" for departments).
- Ensure all iconography is from a professional icon set. Do not use emojis anywhere.

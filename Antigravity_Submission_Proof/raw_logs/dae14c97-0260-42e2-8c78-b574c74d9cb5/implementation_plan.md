# Restrict Voice & Camera Buttons to the Report Tab Only

## Problem

The `VoiceCommandButton` (which renders both the 🎙 Mic and 📷 Camera floating action buttons) is mounted globally in `app/(tabs)/_layout.tsx`. This means it floats in the bottom-right corner on **every single tab** — the Map, Incidents list, Trace, and Settings — which is bad UX. These controls are only relevant when a user wants to file a report.

## Proposed Solution

Two-phase change:

### Phase 1 — Remove the Global Floating Button

Remove `<VoiceCommandButton>` from `_layout.tsx` entirely. It must no longer be rendered globally in the tab bar.

### Phase 2 — Integrate Inline into the Report Screen

Instead of a floating overlay, the Mic and Camera inputs will become **first-class UI elements** inside `report.tsx`, sitting consistently within the page layout alongside the existing text input. This makes the Report screen the single, clean entry point for all three input methods:

1. 📝 **Text** – existing textarea  
2. 🎙 **Voice** – inline mic button that expands into a recording bar  
3. 📷 **Camera/Gallery** – inline camera button that triggers the vision pipeline

---

## Proposed Changes

### [MODIFY] [_layout.tsx](file:///d:/Documents/Project/CityIncidentWorkspace/wakanda/mobile/app/(tabs)/_layout.tsx)
- Remove the `VoiceCommandButton` import and its JSX render inside the `tabBar` prop.
- Keep the `handleIngestSuccess` callback logic but pass it down (or handle inline in `report.tsx`).

---

### [MODIFY] [report.tsx](file:///d:/Documents/Project/CityIncidentWorkspace/wakanda/mobile/app/(tabs)/report.tsx)
Redesign to feature three clearly labelled input method sections:

```
┌────────────────────────────────┐
│  📍 Location Row               │
├────────────────────────────────┤
│  OBSERVATION                   │
│  [ Text area input           ] │
├────────────────────────────────┤
│  VOICE INPUT                   │
│  [ 🎙 Mic button + wave bar  ] │
├────────────────────────────────┤
│  ATTACH MEDIA                  │
│  [ 📷 Camera ]  [ 🖼 Gallery ] │
├────────────────────────────────┤
│  [ Submit Field Report       ] │
└────────────────────────────────┘
```

- Inline the entire `useVoiceCommand` hook logic directly into `report.tsx`.
- Render the recording timer bar and waveform **inline** (not floating).
- On ingest success from voice, show the same green confirmation banner already used by text submit.
- Camera/Gallery buttons remain as-is but move to be part of the inline layout (they already exist here, so just clean up the duplication from `VoiceCommandButton`).

---

## Verification Plan

1. Launch the app and verify the Mic/Camera FABs are **gone** from the Map, Incidents, Trace and Settings tabs.
2. Navigate to Report tab and verify all three input methods (text, voice, camera) work correctly and display confirmation on success.
3. Confirm that the layout is visually consistent and nothing overlaps the bottom nav.

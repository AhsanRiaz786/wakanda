# Restrict Voice & Camera Buttons to the Report Tab Only

## Problem

The `VoiceCommandButton` (which renders both the 🎙 Mic and 📷 Camera floating action buttons) is mounted globally in `app/(tabs)/_layout.tsx`. This means it floats in the bottom-right corner on **every single tab** — the Map, Incidents list, Trace, and Settings — which is bad UX. These controls are only relevant when a user wants to file a report.

## Proposed Solution

Two-phase change:

### Phase 1 — Remove the Global Floating Button
Remove `<VoiceCommandButton>` from `_layout.tsx` entirely.

### Phase 2 — Integrate Inline into the Report Screen
Voice and Camera become first-class inline elements inside `report.tsx`:
1. 📝 Text – existing textarea
2. 🎙 Voice – inline mic button that expands into a recording bar
3. 📷 Camera/Gallery – inline camera button that triggers the vision pipeline

## Files Changed
- `app/(tabs)/_layout.tsx` — removed global VoiceCommandButton
- `app/(tabs)/report.tsx` — integrated inline voice + camera with consistent layout

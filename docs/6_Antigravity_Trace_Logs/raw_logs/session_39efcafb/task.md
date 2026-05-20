# Task Plan: Dynamic Map Integration

- [x] Update `Map.tsx`
  - [x] Add `incidents` prop definition.
  - [x] Map over incidents to render `<Marker>` components dynamically.
  - [x] Color code markers based on severity.
- [x] Update `index.tsx`
  - [x] Add state for `incidents` and `filteredIncidents`.
  - [x] Add `useEffect` to fetch incidents on mount and when `planId` changes.
  - [x] Compute OPEN, ASSIGNED, RESOLVED KPIs dynamically.
  - [x] Map over `filteredIncidents` to render dynamic `incRow` bottom sheet items.
  - [x] Implement filter chip logic (All, Water, Power, etc.) to filter the incident array.
- [x] Verify
  - [x] Ensure map markers match fetched data coordinates.
  - [x] Ensure KPIs and list reflect real data.

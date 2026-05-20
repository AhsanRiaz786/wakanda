# Map Dashboard Dynamic Integration

The current Map Dashboard is a static mock. We need to wire it up so that it dynamically fetches and displays the actual incidents from the LangGraph backend, renders accurate map pins, computes live KPIs, and allows filtering.

## Proposed Changes

### 1. Update `Map.tsx` to accept dynamic incidents
We will modify the `Map` component to accept an array of incident objects as a prop. It will map over these incidents and render a `<Marker>` for each one.
- We will color-code the map pins based on the incident's `severity` (e.g., Red for CRITICAL, Orange for HIGH, Blue for LOW).
- We will use `incident.location.lat` and `incident.location.lng` to position the markers.

### 2. Wire up `index.tsx` state and API calls
We will overhaul the main dashboard screen:
- **Data Fetching:** Add a `useEffect` that calls `api.listIncidents()` on component mount, and also re-fetches whenever the "Run Agent Plan" finishes (so the map updates in real-time after the AI dispatches crews).
- **Dynamic KPIs:** Compute the number of "OPEN", "ASSIGNED", and "RESOLVED" incidents dynamically from the fetched data array.
- **Filtering Logic:** When the user taps a filter chip (e.g., "Water", "Road Block"), we will filter the incident list locally so both the Map pins and the bottom list instantly reflect the selected category.
- **Dynamic List Rows:** Replace the hardcoded bottom sheet rows with an actual `.map()` over the filtered incidents, displaying their real `description`, `sourceType`, and `severity`.

## Verification Plan

### Manual Verification
1. Open the Expo app. The map should instantly populate with 10 pins corresponding to the Islamabad data we just seeded.
2. The TopBar should read "10 active incidents".
3. Tapping the filter chips should instantly hide/show relevant pins on the map and items in the list.
4. Pressing "Run Agent Plan" should succeed, and upon completion, the KPIs should automatically update to show "ASSIGNED" and "RESOLVED" stats as the AI updates the incident states.

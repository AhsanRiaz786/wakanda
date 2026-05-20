# Map Dashboard Integration Walkthrough

The static mock data on the Map Dashboard has been completely replaced with live data driven by the backend API.

## Changes Made
1. **Dynamic Coordinates**: The `<Map />` component now accepts an array of incidents and iterates through them to render geographical `<Marker>`s using exactly the coordinates provided by the backend (e.g. Islamabad coordinates).
2. **Severity Color-Coding**: The map markers are now color-coded to visually indicate urgency. `CRITICAL` incidents pulse Red, `HIGH` pulse Orange, and `LOW` pulse Blue.
3. **Live KPI Strip**: The "OPEN", "ASSIGNED", and "RESOLVED" cards at the bottom of the map now calculate their totals in real-time by grouping the statuses returned by `api.listIncidents()`.
4. **Interactive Filters**: The horizontal filter chips ("All", "Road Block", "Water", etc.) are now fully functional. Tapping a filter instantly removes irrelevant map markers and list rows from the UI.
5. **Real-time Plan Updates**: As soon as you tap "Run Agent Plan", the dashboard listens for the plan ID. Once complete, it automatically re-fetches the list of incidents. You will see the markers change state and the KPIs jump from "OPEN" to "ASSIGNED" as the AI completes its dispatch tasks.

> [!TIP]
> **Demo Strategy:** When presenting to the judges, tap one of the filters (e.g., "Water") to show that the map is fully responsive, then tap "All" before pressing the "Run Agent Plan" button to show the total state transitions.

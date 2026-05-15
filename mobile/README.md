# CityIRA Mobile

Expo React Native client for CityIRA. Presentation layer only — see [plan.md](../plan.md) and [planmvp.md](../planmvp.md).

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_BASE_URL` to your machine LAN IP (e.g. `http://192.168.1.100:8000/v1`).

## Screens

| Tab | Route | API |
|-----|-------|-----|
| Map | `(tabs)/index` | `POST /plan`, `POST /simulate` |
| Incidents | `(tabs)/incidents` | `GET /incidents` |
| Report | `(tabs)/report` | `POST /ingest` |
| Trace | `(tabs)/trace` | `GET /trace` |

Detail: `app/incident/[id].tsx`

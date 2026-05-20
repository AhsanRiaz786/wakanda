# CityIRA Voice Pipeline — Implementation Plan

Add a voice interface (Deepgram STT → Groq LLM → CityIRA API → ElevenLabs TTS)
as a **purely additive** layer on top of the existing backend. Zero modifications
to any existing file outside of config and the API router registration.

## Core Principle

> **The existing backend is not touched.**  
> Voice is a new service module + one new route. All existing graphs, nodes,
> flows, and routes continue to function identically.

---

## User Review Required

> [!IMPORTANT]
> Three new API keys are required. All have free tiers sufficient for the demo:
> - `DEEPGRAM_API_KEY` — sign up at deepgram.com ($200 free credit)
> - `GROQ_API_KEY` — sign up at console.groq.com (completely free, rate-limited)
> - `ELEVENLABS_API_KEY` — sign up at elevenlabs.io (10,000 chars/month free)

> [!NOTE]
> Mobile side requires `expo-av` for audio recording. This is already a common
> Expo package and does not require a dev build — works in Expo Go.

---

## How It Works

```
Mobile (expo-av records WAV)
    ↓  multipart/form-data audio upload
POST /v1/voice
    ↓
[1] Deepgram STT  →  plain text transcript
    ↓
[2] Groq (llama-3.3-70b-versatile)  →  intent + structured params
    { intent: "ingest" | "plan" | "simulate" | "trace" | "status" | "unknown",
      params: { rawDescription, rawAddress, planId, ... } }
    ↓
[3] Internal call to existing CityIRA endpoint (no HTTP round-trip)
    /ingest  /plan  /simulate  /trace  — same logic, same graphs, same nodes
    ↓
[4] Groq (llama-3.1-8b-instant)  →  one-sentence natural language summary
    "Incident logged. Want me to run a triage plan?"
    ↓
[5] ElevenLabs TTS  →  audio bytes (MP3)
    ↓
Response: { transcript, intent, summary, audio_b64 }
    ↓
Mobile plays audio via expo-av
```

---

## Proposed Changes

### Backend — Config Layer

#### [MODIFY] [config.py](file:///home/waleed/Desktop/wakanda/backend/app/config.py)
Add three optional fields with empty-string defaults (no breaking change):
```python
deepgram_api_key: str = ""
groq_api_key: str = ""
elevenlabs_api_key: str = ""
```

#### [MODIFY] [.env.example](file:///home/waleed/Desktop/wakanda/backend/.env.example)
Add three commented-out lines:
```
DEEPGRAM_API_KEY=
GROQ_API_KEY=
ELEVENLABS_API_KEY=
```

#### [MODIFY] [requirements.txt](file:///home/waleed/Desktop/wakanda/backend/requirements.txt)
Add three packages:
```
deepgram-sdk>=3.0.0
groq>=0.9.0
elevenlabs>=1.0.0
```

---

### Backend — Voice Service

#### [NEW] `backend/app/services/voice_pipeline.py`
The entire voice logic lives here. Four functions, called in sequence by the route:

| Function | Calls | Returns |
|---|---|---|
| `transcribe(audio_bytes) -> str` | Deepgram REST API | plain text transcript |
| `parse_intent(transcript) -> dict` | Groq `llama-3.3-70b-versatile` | `{intent, params}` |
| `dispatch_intent(intent, params, store) -> dict` | Existing flow functions directly (no HTTP) | raw API response dict |
| `summarise(response_dict) -> str` | Groq `llama-3.1-8b-instant` | one natural language sentence |
| `synthesise(text) -> bytes` | ElevenLabs REST API | MP3 audio bytes |

**Intent → Endpoint Mapping (inside `dispatch_intent`):**

| Groq returns `intent` | Function called | Params extracted |
|---|---|---|
| `"ingest"` | `run_ingest(store, IngestRequest(...))` | `rawDescription`, `rawAddress`, `sourceType` |
| `"plan"` | `run_plan(store, PlanRequest(...))` | `planMode` (default `"full"`) |
| `"simulate"` | `run_simulate(store, SimulateRequest(...))` | `planId`, `simulationSpeed` |
| `"trace"` | `store.last_plan_trace` | `depth` (default `"summary"`) |
| `"status"` | `store.get_open_incidents()` | — |
| `"unknown"` | no call | fallback summary |

> [!IMPORTANT]
> `dispatch_intent` calls the **flow functions directly** (`run_ingest`, `run_plan`,
> `run_simulate`), not via HTTP. This means the existing LangGraph graphs are
> bypassed at this layer in favour of the simpler orchestrators — keeping voice
> responses fast and not requiring an async HTTP client. This is intentional:
> voice is a thin wrapper, not a replacement for the full graph pipeline.

**Groq intent prompt (fixed, deterministic):**
```
You are a dispatcher assistant for a city operations center.
The operator has spoken a command. Extract the intent and parameters as JSON.

Intents: ingest | plan | simulate | trace | status | unknown

Rules:
- "ingest": operator is reporting a new incident (description + optional location)
- "plan": operator wants to run a triage plan
- "simulate": operator wants to simulate a plan (extract planId if mentioned)
- "trace": operator wants to know what the AI did
- "status": operator asks about current open incidents
- "unknown": none of the above

Return ONLY valid JSON. Example:
{"intent": "ingest", "params": {"rawDescription": "burst water main on Jinnah Avenue", "rawAddress": "Jinnah Avenue"}}
```

---

### Backend — Voice Route

#### [NEW] `backend/app/api/routes/voice.py`

Single endpoint:

```python
POST /v1/voice
Content-Type: multipart/form-data
Body: audio file (WAV or MP3, max 10MB)

Response 200:
{
  "transcript": "water main burst near market quarter",
  "intent": "ingest",
  "summary": "Incident INC-007 logged as water leak. Want me to run a plan?",
  "audio_b64": "<base64 MP3>"
}

Response 400: { "code": "TRANSCRIPTION_FAILED", "message": "..." }
Response 503: { "code": "VOICE_SERVICE_UNAVAILABLE", "message": "API key missing" }
```

Guard: if any of the three API keys are missing from settings → return 503 immediately.

---

### Backend — Router Registration

#### [MODIFY] `backend/app/api/router.py`
Add one line to include the voice router — the **only** change to an existing file:
```python
from app.api.routes.voice import router as voice_router
api_router.include_router(voice_router)
```

---

### Mobile — Voice UI

#### [NEW] `mobile/components/VoiceCommandButton.tsx`
- Hold-to-record button using `expo-av`
- On release: POST audio to `/v1/voice` as multipart
- On response: decode `audio_b64`, play with `expo-av`
- Show `transcript` and `summary` as text overlay

#### [NEW] `mobile/hooks/useVoiceCommand.ts`
Encapsulates the record → upload → play lifecycle. Returns `{ isRecording, transcript, summary, trigger }`.

No changes to any existing mobile screens. The button is added as an overlay/FAB on whichever screen makes sense for the demo.

---

## File Change Summary

| File | Change Type | Existing Code Affected? |
|---|---|---|
| `backend/app/config.py` | MODIFY — add 3 fields | No — additive only |
| `backend/.env.example` | MODIFY — add 3 keys | No |
| `backend/requirements.txt` | MODIFY — add 3 packages | No |
| `backend/app/services/voice_pipeline.py` | NEW | — |
| `backend/app/api/routes/voice.py` | NEW | — |
| `backend/app/api/router.py` | MODIFY — add 1 import + 1 include | No |
| `mobile/components/VoiceCommandButton.tsx` | NEW | — |
| `mobile/hooks/useVoiceCommand.ts` | NEW | — |

**Total existing files modified: 4** (all purely additive, no logic changed).  
**All existing graphs, nodes, flows, routes: untouched.**

---

## Verification Plan

### Automated Checks
```bash
# Existing smoke test must still pass unchanged
./backend/scripts/smoke_test.sh

# Import check on new service
cd backend && /home/waleed/jupyter/bin/python -c "from app.services.voice_pipeline import transcribe"

# Syntax check on new files
python3 -c "import ast; ast.parse(open('app/services/voice_pipeline.py').read())"
python3 -c "import ast; ast.parse(open('app/api/routes/voice.py').read())"
```

### Manual Verification
1. `POST /v1/voice` with a WAV file containing "log a water leak on Jinnah Avenue" → should return intent `ingest` + incident in response
2. `POST /v1/voice` with "run a plan" → should return intent `plan` + plan summary  
3. `POST /v1/voice` without API keys set → should return 503 immediately
4. All existing endpoints (`/ingest`, `/plan`, `/simulate`, `/trace`) still respond identically
5. Mobile: hold button → speak → release → hear response within ~3 seconds

---

## Open Questions

> [!NOTE]
> **ElevenLabs voice selection:** The free tier offers a limited set of voices. Recommend using the default "Rachel" voice (ID: `21m00Tcm4TlvDq8ikWAM`) — no configuration needed.

> [!NOTE]
> **Deepgram model:** Use `nova-2` model for transcription — best accuracy on the free tier. Language: `en-IN` or `en-US` depending on the expected accent in the demo.

> [!NOTE]
> **Audio format from mobile:** `expo-av` records in AAC/M4A by default on iOS and AMR/AAC on Android. Deepgram accepts both. No conversion needed on the backend.

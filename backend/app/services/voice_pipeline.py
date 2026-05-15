"""Voice pipeline service — Deepgram STT → Groq LLM → CityIRA dispatch → ElevenLabs TTS.

All external calls are isolated here. The route handler is thin.
Existing backend code is never imported or modified.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import settings
from app.flows.ingest_flow import run_ingest
from app.flows.plan_flow import run_plan
from app.flows.simulate_flow import run_simulate
from app.models.requests import IngestRequest, PlanRequest, SimulateRequest, SimulateOverrides
from app.state.workspace import get_store

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Intent prompt — fixed, deterministic
# ---------------------------------------------------------------------------

_INTENT_SYSTEM_PROMPT = """You are a dispatcher assistant for a city emergency operations center.
The operator has spoken a command. Extract the intent and parameters as JSON.

Intents:
- ingest: operator is reporting a new incident (needs: rawDescription, optional rawAddress)
- plan: operator wants to run a triage/response plan (optional: planMode = "quick" or "full")
- simulate: operator wants to simulate a plan (needs: planId, optional: forceApiFailure bool)
- trace: operator wants a summary of what the AI did last
- status: operator asks about current open incidents
- unknown: none of the above

Return ONLY valid JSON with keys: intent (str), params (dict).

Examples:
{"intent": "ingest", "params": {"rawDescription": "burst water main near Market Quarter", "rawAddress": "Market Quarter"}}
{"intent": "plan", "params": {"planMode": "full"}}
{"intent": "simulate", "params": {"planId": "PL-001", "forceApiFailure": false}}
{"intent": "status", "params": {}}
{"intent": "unknown", "params": {}}"""

_SUMMARISE_SYSTEM_PROMPT = """You are a concise city operations assistant.
Summarise the following JSON response in ONE natural, spoken sentence (max 25 words).
Be direct and informative. Do not mention JSON or technical details.
End with a short follow-up question if appropriate."""


# ---------------------------------------------------------------------------
# Step 1: STT — Deepgram
# ---------------------------------------------------------------------------


async def transcribe(audio_bytes: bytes, mimetype: str = "audio/wav") -> str:
    """Send audio to Deepgram nova-2 and return transcript text."""
    url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en"
    headers = {
        "Authorization": f"Token {settings.deepgram_api_key}",
        "Content-Type": mimetype,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, content=audio_bytes)
        resp.raise_for_status()
        data = resp.json()

    try:
        transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Deepgram response shape: {e}") from e

    if not transcript.strip():
        raise ValueError("Deepgram returned an empty transcript")

    logger.info("Transcribed: %r", transcript)
    return transcript.strip()


# ---------------------------------------------------------------------------
# Step 2: Intent parsing — Groq
# ---------------------------------------------------------------------------


async def parse_intent(transcript: str) -> dict[str, Any]:
    """Ask Groq to extract intent + params from the transcript."""
    from groq import AsyncGroq  # noqa: PLC0415 — lazy import keeps startup fast

    client = AsyncGroq(api_key=settings.groq_api_key)
    completion = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _INTENT_SYSTEM_PROMPT},
            {"role": "user", "content": transcript},
        ],
        temperature=0.1,
        max_tokens=256,
        response_format={"type": "json_object"},
    )

    raw = completion.choices[0].message.content
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning("Groq returned non-JSON: %s", raw)
        raise ValueError(f"Could not parse Groq intent response: {e}") from e

    intent = parsed.get("intent", "unknown")
    params = parsed.get("params", {})
    logger.info("Intent: %s  params: %s", intent, params)
    return {"intent": intent, "params": params}


# ---------------------------------------------------------------------------
# Step 3: Dispatch to existing CityIRA flows
# ---------------------------------------------------------------------------


def dispatch_intent(intent: str, params: dict[str, Any]) -> dict[str, Any]:
    """Route intent to the correct existing flow function.

    Calls run_ingest / run_plan / run_simulate directly — no HTTP round-trip.
    All existing graph logic (nodes, traces) remains intact.
    """
    store = get_store()

    if intent == "ingest":
        raw_desc = params.get("rawDescription", "")
        if not raw_desc:
            return {"error": "No incident description captured"}

        from app.models.enums import SourceType  # noqa: PLC0415

        req = IngestRequest(
            rawDescription=raw_desc,
            sourceType=SourceType.REALTIME_FEED,
            rawAddress=params.get("rawAddress"),
        )
        saved_inc, trace, err, is_duplicate = run_ingest(store, req)
        if err:
            return err
        return {
            "incidentId": saved_inc.incidentId if saved_inc else None,
            "title": saved_inc.title if saved_inc else None,
            "severity": str(saved_inc.severity) if saved_inc else None,
            "isDuplicate": is_duplicate,
        }

    if intent == "plan":
        req = PlanRequest(planMode=params.get("planMode", "full"))
        plan, trace = run_plan(store, req)
        if not plan:
            return {"error": "Plan generation failed"}
        return {
            "planId": plan.planId,
            "totalIncidents": plan.totalIncidents,
            "conflictsDetected": plan.conflictsDetected,
            "conflictsResolved": plan.conflictsResolved,
            "totalResourcesDispatched": plan.totalResourcesDispatched,
        }

    if intent == "simulate":
        plan_id = params.get("planId", "")
        if not plan_id:
            # Try to use the last saved plan
            plans = list(store.plans.keys())
            if not plans:
                return {"error": "No plan found to simulate. Please run a plan first."}
            plan_id = plans[-1]

        overrides = SimulateOverrides(forceApiFailure=bool(params.get("forceApiFailure", False)))
        req = SimulateRequest(planId=plan_id, simulationSpeed="fast", overrides=overrides)
        try:
            run, trace = run_simulate(store, req)
        except ValueError as e:
            return {"error": str(e)}
        if not run:
            return {"error": "Simulation failed"}
        metrics = run.metrics or {}
        return {
            "runId": run.runId,
            "planId": run.planId,
            "incidentsResolved": metrics.get("incidents_resolved", 0),
            "failuresSimulated": len(run.failuresSimulated),
            "crewsDeployed": metrics.get("crews_deployed", 0),
        }

    if intent == "trace":
        steps = store.last_plan_trace or store.last_sim_trace or []
        return {
            "stepCount": len(steps),
            "steps": [s.get("name") for s in steps[:6]],
        }

    if intent == "status":
        open_incidents = store.get_open_incidents()
        return {
            "openIncidents": len(open_incidents),
            "incidents": [
                {"id": i.incidentId, "type": str(i.incidentType), "severity": str(i.severity)}
                for i in open_incidents[:5]
            ],
        }

    # unknown
    return {
        "message": "Command not recognised. Try reporting an incident, running a plan, or checking status."
    }


# ---------------------------------------------------------------------------
# Step 4: Summarise response — Groq (fast 8b model)
# ---------------------------------------------------------------------------


async def summarise(response_dict: dict[str, Any]) -> str:
    """Convert the raw dispatch result dict into a single spoken sentence."""
    from groq import AsyncGroq  # noqa: PLC0415

    client = AsyncGroq(api_key=settings.groq_api_key)

    # Handle error passthrough
    if response_dict.get("error"):
        return f"I couldn't complete that. {response_dict['error']}"
    if response_dict.get("message"):
        return response_dict["message"]

    completion = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": _SUMMARISE_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(response_dict)},
        ],
        temperature=0.3,
        max_tokens=80,
    )
    return completion.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Step 5: TTS — ElevenLabs
# ---------------------------------------------------------------------------


async def synthesise(text: str) -> bytes:
    """Convert summary text to MP3 audio via ElevenLabs free-tier voice."""
    # Rachel voice — available on ElevenLabs free tier
    VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
    }
    body = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        return resp.content  # raw MP3 bytes


# ---------------------------------------------------------------------------
# Utility: guard missing API keys before any call
# ---------------------------------------------------------------------------


def check_voice_keys() -> list[str]:
    """Return list of missing API key names. Empty = all present."""
    missing = []
    if not settings.deepgram_api_key:
        missing.append("DEEPGRAM_API_KEY")
    if not settings.groq_api_key:
        missing.append("GROQ_API_KEY")
    if not settings.elevenlabs_api_key:
        missing.append("ELEVENLABS_API_KEY")
    return missing

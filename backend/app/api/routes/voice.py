"""POST /v1/voice — voice command endpoint.

Accepts an audio file upload, runs the full voice pipeline:
  Deepgram STT → Groq intent → CityIRA dispatch → Groq summarise → ElevenLabs TTS

Returns transcript, intent, summary text, and base64-encoded MP3 audio.
All existing endpoints remain untouched.
"""

import base64
import logging

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.services.voice_pipeline import (
    check_voice_keys,
    dispatch_intent,
    parse_intent,
    summarise,
    synthesise,
    transcribe,
)

logger = logging.getLogger(__name__)
router = APIRouter()

_ALLOWED_MIMETYPES = {
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "application/octet-stream",  # Expo sometimes sends this
}


@router.post("/voice")
async def voice_command(audio: UploadFile = File(...)):
    """
    Accept an audio recording and run the voice pipeline.

    **Request:** `multipart/form-data` with field `audio` (WAV / MP3 / M4A / AAC).

    **Response:**
    ```json
    {
      "transcript": "water main burst near market quarter",
      "intent": "ingest",
      "params": { "rawDescription": "...", "rawAddress": "..." },
      "summary": "Incident logged as water leak. Shall I run a triage plan?",
      "audio_b64": "<base64 MP3>"
    }
    ```
    """
    # Guard: refuse immediately if any API key is missing
    missing = check_voice_keys()
    if missing:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "VOICE_SERVICE_UNAVAILABLE",
                "message": f"Missing API key(s): {', '.join(missing)}. Add them to .env.",
            },
        )

    # Validate content type (lenient — Expo varies by platform)
    content_type = (audio.content_type or "application/octet-stream").split(";")[0].strip()
    if content_type not in _ALLOWED_MIMETYPES:
        raise HTTPException(
            status_code=415,
            detail={
                "code": "UNSUPPORTED_AUDIO_FORMAT",
                "message": f"Received '{content_type}'. Send WAV, MP3, M4A, or AAC.",
            },
        )

    # Read audio bytes (max ~10 MB guard)
    audio_bytes = await audio.read()
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail={"code": "AUDIO_TOO_LARGE", "message": "Audio must be under 10 MB."},
        )
    if len(audio_bytes) < 100:
        raise HTTPException(
            status_code=400,
            detail={"code": "AUDIO_EMPTY", "message": "Audio file appears to be empty."},
        )

    # ── Step 1: STT ────────────────────────────────────────────────────────
    try:
        transcript = await transcribe(audio_bytes, mimetype=content_type)
    except Exception as e:
        logger.error("Deepgram STT failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail={"code": "TRANSCRIPTION_FAILED", "message": str(e)},
        )

    # ── Step 2: Intent parsing ─────────────────────────────────────────────
    try:
        intent_result = await parse_intent(transcript)
    except Exception as e:
        logger.error("Groq intent parsing failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail={"code": "INTENT_PARSE_FAILED", "message": str(e)},
        )

    intent = intent_result["intent"]
    params = intent_result["params"]

    # ── Step 3: Dispatch to existing CityIRA logic ─────────────────────────
    try:
        response_dict = dispatch_intent(intent, params)
    except Exception as e:
        logger.error("Dispatch failed for intent '%s': %s", intent, e)
        response_dict = {"error": f"Failed to execute {intent}: {e}"}

    # ── Step 4: Summarise ─────────────────────────────────────────────────
    try:
        summary = await summarise(response_dict)
    except Exception as e:
        logger.warning("Groq summarise failed, using fallback: %s", e)
        summary = response_dict.get("error", "Done.")

    # ── Step 5: TTS ────────────────────────────────────────────────────────
    try:
        audio_mp3 = await synthesise(summary)
        audio_b64 = base64.b64encode(audio_mp3).decode("utf-8")
    except Exception as e:
        logger.error("ElevenLabs TTS failed: %s", e)
        # Degrade gracefully — return text even if TTS fails
        audio_b64 = ""

    return {
        "transcript": transcript,
        "intent": intent,
        "params": params,
        "summary": summary,
        "audio_b64": audio_b64,
    }

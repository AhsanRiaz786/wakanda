# Voice Pipeline — Task Tracker

## Backend — Config Layer
- [x] `backend/app/config.py` — add 3 API key fields
- [x] `backend/.env.example` — add 3 key placeholders
- [x] `backend/requirements.txt` — add deepgram-sdk, groq, elevenlabs

## Backend — Voice Service
- [x] `backend/app/services/voice_pipeline.py` — transcribe, parse_intent, dispatch_intent, summarise, synthesise

## Backend — Voice Route
- [x] `backend/app/api/routes/voice.py` — POST /v1/voice

## Backend — Router Registration
- [x] `backend/app/api/router.py` — include voice_router

## Mobile
- [x] `mobile/hooks/useVoiceCommand.ts` — record/upload/play logic
- [x] `mobile/components/VoiceCommandButton.tsx` — hold-to-record UI

## Verification
- [x] Syntax check all new files
- [ ] Confirm existing smoke_test.sh still passes (Skipped by user)
- [ ] Commit in logical groups + push

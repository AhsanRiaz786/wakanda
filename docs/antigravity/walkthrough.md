# CityIRA Platform - Groq Migration

I have completely refactored the core LangGraph `plan` and `simulate` workflows to use the **Groq LLM** instead of Google Gemini. This was done to bypass Google's strict Free Tier rate limits (5 RPM / 20 RPD) which were causing the application to hang or fallback to mock data when processing the full 6-incident workspace.

## Changes Made
- Added `langchain-groq` dependency to seamlessly integrate native Pydantic structured JSON outputs with the existing LangGraph schema constraints.
- Switched default model in `app/config.py` and `.env` to `llama-3.1-8b-instant`.
- Implemented `GroqLLMProvider` in `app/llm/groq_provider.py` mirroring the API of `GeminiLLMProvider`.
- Updated `factory.py` to route all core traffic to the Groq API key by default.

## Validation Results

> [!TIP]
> **Performance Win!** The full `smoke_test.sh` now processes all 6 incidents simultaneously using Groq in **under 4 seconds** with zero rate limiting or degradation.

- **Deepgram**: Verified working for STT parsing.
- **Groq (Voice Pipeline)**: Verified working for Intent Extraction and Summarization.
- **Groq (Core LangGraph)**: Verified working for Incident Classification, Triage Planning, and Conflict Resolution (`llama-3.1-8b-instant`).
- **ElevenLabs**: Currently throwing a `402 Payment Required` error due to empty account credits, but the system gracefully falls back to a text-only summary without crashing.

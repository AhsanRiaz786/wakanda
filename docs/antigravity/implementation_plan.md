# Goal

Migrate the core CityIRA LangGraph backend from Gemini to Groq to avoid the crippling 5 requests-per-minute Free Tier rate limits of the Google Gemini API. Ensure the entire platform (ingest, triage, plan, notifications, simulate) works flawlessly end-to-end on Groq.

## Proposed Changes

### 1. Dependencies
- Add `langchain-groq` to `pyproject.toml` and `requirements.txt` to enable native structured JSON output via Groq inside LangChain.

### 2. Configuration (`app/config.py` & `.env`)
- Change the default `LLM_MODEL` from `gemini-2.5-flash` to `llama-3.1-8b-instant` (or `mixtral-8x7b-32768`), which are incredibly fast models hosted on Groq with much higher free-tier rate limits (30 RPM).

### 3. Core Architecture
#### [NEW] `backend/app/llm/groq_provider.py`
- Create a `GroqLLMProvider` class implementing the `LLMProvider` protocol (Classify, Resolve, Draft Notifications).
- Use `ChatGroq` combined with `.with_structured_output()` to guarantee exact Pydantic JSON schemas.

#### [MODIFY] `backend/app/llm/factory.py`
- Update the factory to boot `GroqLLMProvider` instead of `GeminiLLMProvider` when `MOCK_LLM=false`.

## Verification Plan

1. **Install & Boot**: Run `uv sync` to grab `langchain-groq` and restart the Uvicorn server.
2. **Smoke Test**: Execute `backend/scripts/smoke_test.sh` (which simulates 6 incidents). Because Groq has a 30 RPM limit, it will process all 6 incidents simultaneously without hitting the 429 quota exhaustion.
3. **Voice Test**: Validate that the voice pipeline still operates seamlessly alongside the new core Groq logic.

## Open Questions

> [!NOTE]
> I will default to using `llama-3.1-8b-instant` for the core reasoning because it's extremely fast and supports robust JSON tool-calling on Groq. Let me know if you prefer a different Groq model (e.g., `mixtral-8x7b-32768`).

# Fix API Errors and Implement Multi-Tiered Fallback

Based on the server logs and the screenshots provided, the `422 Unprocessable Entity` errors are indeed caused by incorrect payloads being sent from the React Native frontend to the backend `/v1/ingest` endpoint.

Additionally, we will implement a multi-tiered LLM fallback chain to ensure the backend never crashes when hitting Groq API rate limits (`429`).

## User Review Required
> [!IMPORTANT]
> The fixes for the `422` errors will be done in the **frontend code** rather than relaxing the backend enums. This keeps our data model clean and adheres to the API contract.
> - For Chaos Mode, I will map the payload to use `rawDescription` and assign `sourceType: "realtime_feed"`.
> - For the New Report screen, I will change `sourceType: "field_report"` to `sourceType: "realtime_feed"`.
> Please confirm if `realtime_feed` is the preferred source type for these!

## Open Questions
> [!WARNING]
> Do you have a specific secondary Groq model in mind for the failover (e.g., `llama3-70b-8192` or `mixtral-8x7b-32768`), or should I pick one automatically?

## Proposed Changes

### 1. Fix `422 Unprocessable Entity` on `ingest` (Frontend Fixes)

We need to fix the React Native frontend code so it sends valid `IngestRequest` payloads.

#### [MODIFY] `mobile/app/(tabs)/index.tsx` (Chaos Mode)
- Change `description` to `rawDescription`.
- Add the missing `sourceType` field (set to `"realtime_feed"`).
- Change `coordinates` to `rawCoordinates`.
- Remove the extra fields (`title`, `severity`, `incidentType`) that the backend `IngestRequest` model does not accept.

#### [MODIFY] `mobile/app/(tabs)/report.tsx` (New Report Screen)
- Change `"sourceType": "field_report"` to `"sourceType": "realtime_feed"`. (Since `"field_report"` is not in the backend's `SourceType` enum).

### 2. Implement Groq -> Groq -> Gemini Fallback Mechanism

Currently, `invoke_with_retry` in `GroqLLMProvider` immediately aborts on a `429 Rate Limit` and returns dummy fallback data. We will change this to fallback dynamically across multiple models.

#### [MODIFY] `app/llm/base.py`
- Modify `_is_non_retryable(err)` so that it does **not** consider `429` as non-retryable. `429` (Rate limits) should be retryable or safely handled by the failover chain.

#### [MODIFY] `app/llm/factory.py`
- Create a `FailoverLLMProvider` that implements the `LLMProvider` interface.
- It will accept a list of providers (e.g., Groq Primary -> Groq Secondary -> Gemini).
- In its methods (`classify`, `resolve_contradiction`, `draft_notifications`), it will iterate through the providers. If one fails, it catches the error and tries the next one.

#### [MODIFY] `app/llm/groq_provider.py` & `app/llm/gemini_provider.py`
- Remove the local dummy `_fallback` from `GroqLLMProvider` and `GeminiLLMProvider` methods. Instead, if they fail, they will raise an exception.
- The `FailoverLLMProvider` will provide the final dummy fallback data to ensure the graph never crashes and the `500` error is avoided only if ALL models in the chain fail.

## Verification Plan

### Automated Tests
- Run `scripts/smoke_test.sh` to ensure `/v1/plan` completes successfully.

### Manual Verification
- In the mobile app, run "Simulate Chaos" and submit a "New Report" to verify that no `422` errors appear in the backend logs.
- Intentionally pass an invalid Groq model name for the primary provider to force a failover, and verify via logs that the secondary Groq model successfully picked up the request.

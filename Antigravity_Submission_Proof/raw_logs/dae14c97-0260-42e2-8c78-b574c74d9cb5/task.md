# Fix API Errors and Implement Multi-Tiered Fallback

- `[x]` Fix `422 Unprocessable Entity` on ingest
  - `[x]` Modify `mobile/app/(tabs)/index.tsx` (Chaos Mode payload)
  - `[x]` Modify `mobile/app/(tabs)/report.tsx` (New Report payload)
- `[x]` Implement Multi-Tiered LLM Fallback (Groq -> Groq -> Gemini)
  - `[x]` Modify `app/llm/base.py` (Make 429 retryable/catchable)
  - `[x]` Modify `app/llm/groq_provider.py` (Remove local fallback)
  - `[x]` Modify `app/llm/gemini_provider.py` (Remove local fallback)
  - `[x]` Modify `app/llm/factory.py` (Implement and wire `FailoverLLMProvider`)
- `[x]` Verification
  - `[x]` Run `smoke_test.sh`
  - `[x]` Update Walkthrough

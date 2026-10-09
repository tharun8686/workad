# Free AI setup

The local app now selects Gemini using `AI_PROVIDER=gemini` in `.env.local`.
Set `GEMINI_API_KEY` privately and keep the Google AI Studio project on its Free tier without linking billing. `GEMINI_MODEL=gemini-3.8-flash` is the configured text model. Free quotas and model availability depend on the provider and account. No automatic provider fallback is implemented.

Restart the local server after editing configuration. Run `npx tsx scripts/check-ai.ts` to verify structured generation with a non-personal connectivity prompt. The check never prints the key.

Requirement parsing accepts non-personal, non-confidential text and validates returned fields before showing them for human review. Do not include employee information or confidential business plans. Gemini's unpaid terms prohibit personal, sensitive and confidential submissions. Document extraction and AI explanations of private workforce evidence are therefore blocked for this configuration. Authorized structured imports and the deterministic planning engine remain available.

Semantic embeddings are not configured for Gemini or Groq; those operations explicitly fail without calling OpenAI. This setup does not establish full production readiness or completion of every AI feature.

References:
- https://ai.google.dev/gemini-api/docs/billing
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/terms

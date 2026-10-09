# Workforce intelligence

Open **Workforce memory** in the sidebar (`/intelligence`).

- **Semantic matching:** configured Gemini embeddings (optional OpenAI adapter retained), 1536 dimensions, owner-isolated pgvector retrieval. Index authorized assessed profiles in batches of 32. Imports invalidate old vectors; concurrent edits cannot receive stale embeddings. Requirement comparisons show relevance separately from suitability and level alignment. Matching uses 80% assessed score and 20% semantic relevance, with suitability gates retained. An unconfigured provider returns a visible configuration message; there is no fabricated vector fallback.
- **Outcome memory:** append-only reviews linked to immutable decisions. Capture success, retention, on-time delivery, actual total INR cost, time to readiness and course evidence. The latest observation per decision counts once. Cohorts match role, city, strategy, headcount and planning horizon. Three distinct outcomes activate bounded cost/time and score calibration for new analyses and scenarios. The forecast baseline is retained to avoid compounding corrections. Existing decisions stay unchanged. The 180-day due counter is computed when the view opens; it is not an email scheduler. Course evidence is received through reviewer JSON imports or a signed LMS bridge, and is automatically included in subsequent outcome reviews up to their observation date. Completion does not imply role success.
- **Fair pay:** record dated company/role/level/city bands and a sourced city living budget. Compare a target against the available monthly budget; never anchor offers to previous pay. Bangalore and Bengaluru are equivalent. Internal peers require explicit imported `company` and optional `level`; otherwise level is estimated from role/experience. Only groups of three or more expose aggregated pay and skill benchmarks. Annual INR lakh imports are converted to monthly INR. No live city-cost or salary benchmark is invented.
- **Applicant review:** requisitions capture the hiring company and target level. Pipeline cards compare applicants with that company's employees in the same role family and target level. Optional graduation and employment dates flag missing evidence, qualification gaps, overlapping periods and unsupported experience. Pre-graduation employment can be legitimate. No flag automatically rejects anyone or declares fraud. PDF/text scanning uses the configured authorized document provider; Gemini free-tier restrictions remain in place.
- **Decision Challenger:** implemented in Workforce memory. Recomputes the selected plan and feasible alternatives under current evidence, a 15% budget cut, a 30-day external hiring delay and 30 additional training days per missing skill. Approved forecasts remain unchanged.

Apply `npm run db:migrate` for connected databases. Local sandbox setup applies migration 005 automatically. Current configuration uses `AI_PROVIDER=gemini`, `GEMINI_MODEL=gemini-3.8-flash`, `EMBEDDING_PROVIDER=gemini`, `GEMINI_API_KEY` and `GEMINI_EMBEDDING_MODEL=gemini-embedding-001` (the embedding model defaults when omitted). Credentials stay server-side; no automatic provider fallback occurs. Gemini profile embedding input contains role and skill labels only, excluding names, salary and project descriptions. Search text must be non-confidential and authorized. Provider/model changes require reindexing; vectors are namespaced by provider, model, dimensions and format version.

Validation: `npm run typecheck`, `npm run build`, `npm exec -- tsx --test tests/intelligence.test.ts tests/intelligence-workflow.test.ts`, and `npm exec -- playwright test --config=playwright.intelligence.config.ts`. The dedicated browser configuration uses an isolated local database and disables external model calls.


## Learning-system connection

The Workforce memory screen now has two LMS paths:

1. **Connect LMS export** converts Coursera, Microsoft Learn and AWS Skill Builder enterprise export/API records into decision-linked evidence.
2. **Import course completion evidence** accepts the already-normalized event format used by custom bridges.

For export imports, choose the approved BUILD decision and assigned learner, then paste an array from the learning platform. The normalizer reads common fields such as `enrollmentId`, `contentId`, `courseName`, `completedAt`, `uid`, `title`, `completedDate`, `transcriptId`, `courseTitle` and `completionDate`. Duplicate platform IDs are skipped; changed reuse of the same ID is rejected.

`POST /api/intelligence/lms/import` accepts the same export shape:

```json
{"provider":"Coursera","decisionId":"approved-decision-id","personId":"assigned-employee-id","records":[{"enrollmentId":"coursera-enrollment-123","courseId":"data-engineering-path","courseName":"Data Engineering Foundations","completionStatus":"Completed","completedAt":"2026-10-08T10:00:00.000Z","certificateUrl":"https://coursera.example/certificate/123"}]}
```

`POST /api/intelligence/course-webhook` accepts a JSON array (maximum 100) of normalized course events. Configure a random secret of at least 32 characters as `LEARNING_CONNECTOR_SECRET` and the receiving application user ID as `LEARNING_CONNECTOR_OWNER_ID`. A bridge in your authorized LMS/export system can either send the normalized format below or call the export import endpoint after mapping the provider account data into the export shape above. Account credentials stay outside this app unless you deploy a private provider bridge.

Sign the exact UTF-8 request body with HMAC-SHA256 using the secret over `<unix-seconds>.<raw-body>`. Send `x-workforce-timestamp` and `x-workforce-signature: sha256=<lowercase-hex>`. Timestamps must be within five minutes. Never put secrets in client-side code. The configured owner is fixed server-side.

```json
[{"eventId":"unique-provider-event-id","decisionId":"approved-decision-id","personId":"assigned-employee-id","courseId":"provider-course-id","name":"Data pipelines","provider":"Microsoft Learn","completed":true,"observedAt":"2026-10-08T10:00:00.000Z","evidence":"Provider completion reference"}]
```

Providers: Microsoft Learn, AWS Skill Builder, Coursera, Other. Learners must belong to the decision's BUILD action. Replays are skipped; conflicting reuse of an event ID returns 409. Corrections require a new event ID. Latest observation per learner/provider/course is used, with event receipt time breaking ties. Imports are atomic. Evidence history is append-only and tenant isolated. Marking an action complete never manufactures course evidence.

Authenticated reviewers can use `POST /api/intelligence/courses/import` or the corresponding JSON file/paste form instead. Get decision and learner IDs from the approved BUILD action in `/api/workspace`. The UI shows received course evidence and includes relevant records automatically when saving an outcome review.

## Compensation imports

Use the Fair pay tab's bulk JSON form or `POST /api/intelligence/pay-policies/import`. Supply up to 100 objects matching the on-screen format: company, role, level, city, monthlyMin, monthlyMax, livingBudget, source and observedAt. Records are validated atomically and duplicates skipped. Comparisons select the most recent evidence date, then receipt time. A licensed salary/city-cost feed is not bundled; import your approved sourced evidence.

## Verification

`npm exec -- tsx scripts/verify-ai.ts` checks the configured text provider with synthetic text. Add `--embeddings` to check its embedding provider. These checks never read workforce records. The Semantic matching tab also offers **Verify embedding connection**.

On 2026-10-08, both Gemini text (`gemini-3.8-flash`) and embedding (`gemini-embedding-001`, 1536 dimensions) connection checks passed. Google returned 404 for the earlier `gemini-2.5-flash` setting and recommended the replacement. REST retrieval request fields follow [Google's embedding reference](https://ai.google.dev/api/embeddings); the live batch endpoint accepts top-level taskType/outputDimensionality. Vectors are validated and normalized before storage.

Migration 006 adds immutable course evidence. Run `npm run db:migrate`. Tests cover provider switching, malformed/replayed evidence, cross-owner access, forecast preservation and stress-test sensitivity. Browser checks cover the challenger, imports, pay comparison and resume screens.

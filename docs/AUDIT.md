# Implementation audit

Date: 8 October 2026. Scope: local prototype in `D:\SA`. Cloud setup and deployment were explicitly deferred by the user. **Do not treat this as a production-complete implementation of the full master brief.**

Status vocabulary: DONE, PARTIAL, NOT DONE, BLOCKED. DONE below means locally implemented and verified within the stated scope.

| Brief section | Status | Evidence / remaining work |
|---|---|---|
| 1. Role and responsibilities | PARTIAL | Functional local source, all screens, server workflows and tests. Complete hosted deployment deferred. Professional name is Workforce Advisory. |
| 2. Accounts and authentication | PARTIAL | No accounts/credentials created. Verified-email Better Auth, OAuth configuration, allowlists, server route protection and role checks implemented. Real provider sign-in untested. Explicit local sandbox is restricted to development/loopback. |
| 3. Product vision | DONE | Five strategies, hybrid comparison, challenge-the-requisition questions, human approval and actions; not an ATS-only product. |
| 4. Architecture principles | PARTIAL | Pure deterministic engine, persistent evidence, human approval and optional AI extraction separated. Semantic vector search is not implemented; vector storage/indexes exist. |
| 5. Technical stack | PARTIAL | Next.js/React/TypeScript/Tailwind/Radix/Recharts with PostgreSQL-compatible local storage and Neon adapter. Deliberate single-deployment Next.js API adaptation replaces Python/FastAPI/Pandas. |
| 6. Data provenance | PARTIAL | Source review/register/export, simulator metadata and explicit null market metrics implemented. No external numeric data ingested. Full commercial source coverage pending. |
| 7. Enterprise simulators | DONE | Seed 808: 150 employees, 40 contractors, 60 candidates, 250 skills, 10 roles and 6 locations. All synthetic with provenance. |
| 8. Fourteen-phase workflow | PARTIAL | Local intake, deterministic analysis, matching, locations, automation assumptions, ranking, explanations, dashboard, approval and execution connected. AI profile extraction optional/untested; embedding/LLM normalization absent. Unavailable market evidence remains explicit. |
| 9. Decision engine | DONE | Validated weights, bounded scores, headcount-constrained hybrid, documented cost/time/risk/confidence assumptions. Unit tests include 88.55 and 90/80/60 skill-match examples. |
| 10. Scenario engine | PARTIAL | Live costs/time/coverage/risk, bar/scatter/table, editable headcount/budget/deadline/location/horizon/strategy/allocation/automation assumptions, save/load. Skill and experience changes require a new requirement rather than scenario-level edits. |
| 11. Twelve screens | PARTIAL | All 12 render in browser tests. Domain screens perform real local operations. Login configuration exists but real authentication is not verified without services. |
| 12. User perspectives | PARTIAL | HR planning and candidate scoring work. Employee screen is an explicitly labeled HR preview; employee identity linkage and per-employee access controls are not yet implemented. |
| 13. PostgreSQL schema | PARTIAL | Required domain/supporting tables, foreign keys, indexes, vector indexes, migrations, seed and audit immutability. Non-owner row isolation tested in local PostgreSQL engine. Hosted Neon migration/role verification still required. |
| 14. API specification | PARTIAL | Functional equivalent routes with validation, ownership, role checks, persistence and error statuses. OpenAPI request schemas provided. Response shapes are TypeScript models, not fully expanded OpenAPI schemas; no FastAPI service. |
| 15. Enterprise design | PARTIAL | Navy/white/gray, Inter, restrained borders, desktop/tablet/mobile layouts, semantic controls and focus indicators. Browser/layout inspection completed. Full WCAG/assistive-technology certification not performed. |
| 16. Navigation | DONE | Overview, requirements, new intake, scenarios, approvals, actions, graph, employee preview, taxonomy and sources are navigable; breadcrumbs and consistent headings. |
| 17. Testing | PARTIAL | 15 calculation/database/authorization tests and 3 browser suites passed before final packaging. Covers all views and full create-to-execute workflow. Hosted OAuth/email/model/load tests unavailable. |
| 18. Implementation order | PARTIAL | Initial provider choice approved, source register shown, local database/engine/API/screens implemented and tested. Cloud infrastructure deferred by user; local sandbox kept explicit. |
| 19. Deliverables | DONE | Source, schema, seed and migration scripts, empty environment template, setup checklist, source register, model documentation, this audit and a three-minute demo. No external ingestion script is claimed because no permitted external numerical dataset was ingested. |
| 20. Full definition of done | PARTIAL | The core local demonstration works. Cloud authentication/deployment, semantic matching, AI explanations, externally ingested data and production employee access remain incomplete. |

## Verification evidence

- `npm run typecheck`: passes.
- `npm test`: 15 tests pass, including persistent workflow, immutable decision/audit writes, local row-level ownership and origin/role rejection.
- `npm run test:e2e`: 3 suites pass: all screens/tabs + desktop/mobile layout, full UI intake/scenario/approval/action flow, API validation/origin/ownership errors.
- `npm run build`: optimized build passes. Local sandbox is intentionally unavailable under production mode; cloud configuration is required for production routes.
- Dashboard screenshots inspected at desktop and mobile widths; charts render real engine outputs.

## Specific limitations

1. Synthetic evidence does not justify a real hiring decision. Real market values remain unavailable.
2. No live OpenAI call has occurred. Only the structured-intake adapter exists; embeddings and AI explanation generation are NOT DONE.
3. Requirements are private to their creator in connected mode. Team-wide collaboration and employee-owned sessions are NOT DONE.
4. Resource allocations are per requirement; global reservation/conflict detection is NOT DONE.
5. BUY retention, automation feasibility and risk are disclosed scenario assumptions, not empirically validated models.
6. Actions update simulator systems. Real HRIS/ATS/VMS/LMS integrations are NOT DONE.
7. A configured non-owner database login is required in production; schema owners bypass PostgreSQL RLS by design. The setup guide separates migration and runtime connections.
8. Migration/auth code is supplied but hosted TLS, provider callbacks, production cookies, email delivery and deployment are BLOCKED until the user requests and authorizes cloud setup.

## Extension points

Add new scoring criteria in the pure engine and record model-version/provenance changes. Add new requirement/scenario inputs to validation before adding UI controls. Route all decisions and execution changes through the transactional repository. Preserve append-only audit tables. Keep simulator values visibly distinct from verified external records.

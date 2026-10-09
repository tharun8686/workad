# Implementation status against the original brief

8 October 2026. “Implemented” describes code and data wiring, not executed verification. No tests/build were run in this pass.

| Original core requirement | Prototype implementation | Boundary / remaining evidence |
|---|---|---|
| Integrate or simulate ATS, HRIS, VMS/MSP, contractors and job-market sources | Authorized mapped CSV/JSON import, provenance, private documents, profiles/recruitment, real public job snapshot, optional Adzuna and market JSON | No invented records; native vendor APIs need customer credentials and connector work |
| Normalize roles and skills | O*NET alternate-title mapping, ambiguity preserved, canonical skill/alias normalization across imported profiles and requirements, workspace-specific human review | No active semantic-vector matching; role mapping has occupational/geographic limitations |
| Estimate supply, time-to-fill and compensation | Imported ready-match counts, candidate expectations, explicit scenario lead-time assumptions, actual recorded opening-to-hire duration, advertisement sample annual pay statistics | Global available supply, competition and representative Indian salary benchmarks are not measured; no fictional substitutes |
| Internal talent and development paths | Weighted matching, gaps, sourced training duration/cost settings, readiness constraints, Microsoft Learn modules, employee planner view | Needs authorized people/assessments and trainer estimates; course metadata is not proficiency |
| Contractors and conversion | Contractor matching, rate/capacity planning, optional reported conversion interest, consented profiles | Contractual permission and conversion decisions remain human; no automatic employment-status conversion |
| Location and remote alternatives | Same scenario criteria across supported Indian locations, imported candidate coverage, remote permission, actual job eligibility text | No verified cost-of-living dataset; foreign pay is never silently converted to INR |
| Sourcing channels / pools | Candidate pool prioritization by modeled readiness, recruitment source-channel outcomes, direct/referral workflow, public advertisement context | Small samples have no causal performance claim; public ads are demand evidence |
| Explainable Build/Buy/Borrow/Automate/Relocate | Weights, scores, feasible/infeasible scenarios, source and assumption notes, recorded human decisions, downloadable brief | Automation and fill times remain explicit assumptions; approval is not an external transaction |

## Reported enterprise gaps

| Antigravity finding | Changes / current status |
|---|---|
| Market page incomplete | Connected missing GET/import/refresh API routes and navigation; added exact role/location evidence in requirement view; downloaded 19 real public remote ads; retained API-backed Adzuna option |
| Cross-requirement conflicts | New Build/Borrow approvals lock roster rows, re-evaluate current data and reserve selected people atomically; other scenarios exclude reserved people; explicit audited release after terminal work |
| Semantic vectors / AI prose | Remains inactive. Exact O*NET mappings and reviewed aliases are now broader. Deterministic evidence explanations work without credit. Existing unused embedding code is not an active feature |
| Enterprise integrations | Mapped exports and local recruitment/work tracking implemented. Workday/SAP/Greenhouse/LMS/VMS native outbound execution remains unimplemented without authorized tenants |
| Multi-tenant sharing | Existing personal-owner isolation retained; skill overrides are now owner-specific. Shared workspaces, department delegation and employee self-service remain unimplemented |
| Accessibility | Added headings for empty talent/employee pages, keyboard navigation for requirement tabs, live scenario summary and existing numeric chart tables. No WCAG conformance or screen-reader audit claim |

## Important limitations

- Whole-person reservations are per workspace and stable imported category/external ID, not cross-organization identity resolution, fractional allocation or dated booking. Imports with different IDs can describe the same person; source mapping must resolve that.
- Reservations apply to new approvals. Existing decisions were not silently reallocated or backfilled; review those allocations before relying on a global capacity view.
- Pending requirement analyses are saved snapshots. Recalculate with Strategy scores after data or reservations change; server approval always re-evaluates current data.
- Role-source files and learned alias settings are not people assessments. Aliases map names only and do not create proficiency.
- Sourcing-only authorization preserves an infeasible snapshot. It allows investigation and requisition preparation without falsely asserting candidate availability. Offers and hires need separate real human decisions recorded in Recruitment.
- No people or employment outcomes were manufactured in this pass.
- No deployment, native vendor transactions, live Gemini calls, tests or builds were performed in this pass.

## Inputs needed for enterprise completion

1. Licensed/local compensation or permitted job-data account with explicit country, role, period and pay-unit definitions.
2. Authorized workforce records with stable IDs, observation dates and measurable assessment evidence.
3. Customer HRIS/ATS/LMS/VMS sandbox credentials and approved API scopes for each desired native connector.
4. Agreed tenant membership, department and employee access rules; retention and source-correction policies.
5. Permission to perform build, security, concurrency, accessibility and operational verification before deployment.

A 100% production claim cannot be supported while these items remain open.

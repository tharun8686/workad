# Workforce Advisory — evaluator walkthrough

Updated 8 October 2026. Open **Evaluator guide** in the app (`/presentation`) for the same sequence with page links.

## What to claim

This is a functional implementation of an evidence-led workforce decision prototype. It joins authorized workforce imports, official occupational terminology, learning resources, market observations, scenario comparisons and a human recruitment workflow. Current changes have not been built or tested in this pass at the owner's request. Do not describe the application as production-certified, live-integrated with every enterprise vendor, or 100% verified.

Opening statement:

> A workforce request often becomes an external job requisition before the organization checks its own skills, contractors or alternative ways to deliver the work. Our application starts with the business need, compares Build, Buy, Borrow, Automate and Relocate, explains the assumptions and leaves the final decision with a person. It then records recruitment or development follow-through.

## Preparation

1. In D:\SA, start `npm run dev`. Use the local address printed by Next.js (normally http://127.0.0.1:3000).
2. Sign in to the configured owner account. Do not show `.env.local`, private invitation tokens or keys to the evaluator.
3. Keep the real dataset files in `data/`. O*NET role/task files and Microsoft Learn modules are already downloaded. This pass downloaded 19 Remotive software-job advertisements, dated 2026-10-08, with a checksum and original links.
4. Confirm permission to display any personal records already imported by another tool. “Sample” does not establish consent or authenticity. If they are fictional, disclose that and keep them separate from evidence; do not call them real employees.
5. If no authorized assessed people are available, demonstrate public datasets and an honest empty workforce state. A consenting participant can register a self-reported profile. Do not fabricate performance or skill assessments to fill the screen.
6. Read COMPLETION-MATRIX.md for what remains dependent on access or verification.

## Page by page: 12–15 minute walkthrough

| Page | What to do | What to explain / expected behavior |
|---|---|---|
| Overview `/dashboard` | Show requirement and action counts. | Counts reflect this workspace. The product supports decisions before recruitment. |
| Data connections `/connections` | Show configuration, import history, source date, authority and checksum. Download the empty template. | CSV/JSON ingestion supports mapped HRIS, ATS and VMS exports. Configuration is not proof of provider connectivity. Imports require measured matching inputs. |
| Supporting documents, within connections | Show an authorized document only if permitted. | Documents remain in the private workspace. Resume statements are claims; they do not become assessed scores automatically. |
| Role reference `/occupations` | Search “software”, expand a role's alternate titles and tasks, select **Use this role in a requirement**. | O*NET provides real occupational structure. It is a US classification reference, not an Indian pay survey or proof of an individual's proficiency. |
| Skill taxonomy `/taxonomy` | Search a skill, inspect aliases, use **Edit settings** if you have evidence. | Exact canonical and alias normalization is explainable. A workspace-specific training estimate needs duration, INR cost and its evidence. Leaving an estimate unknown prevents invented development readiness. |
| Talent explorer `/talent` | Open an authorized assessed person and show skills, projects, certifications and availability. | Scoring uses imported evidence. The graph has a text description; a missing profile is an explicit empty state. |
| New requirement `/requirements/new` | Enter the actual work, one or more positions, location, annual INR lakh per person, deadline, horizon, experience and skills. Ensure skill weights total 100. | Plain extraction stays on the server. Gemini parsing is optional and limited to non-personal, non-confidential text. Review all fields. The role mapping retains ambiguous titles for human review. |
| Workflow `/analysis/<id>` | Show recorded processing stages, then **View analysis**. | Approval and execution wait for people. A stage completion does not certify the availability of missing market evidence. |
| Requirement `/requirements/<id>`: Internal talent | Explain skill match, gaps, training estimates, readiness and cost. | A partial match does not establish readiness without a real training plan. Source observations and scenario forecasts are different things. |
| Contractors tab | Show rates, readiness and conversion interest. | Conversion interest must be reported, not inferred. A suitable contractor is a possible engagement/conversion candidate, subject to human confirmation and the actual contract. |
| External market tab | Show imported pools ordered by modeled ready matches, then observed market evidence. | Candidate expectations are not market salary benchmarks. Pool counts are only imported records, not total labor supply. |
| Locations tab | Compare imported candidate coverage, modeled costs and days across locations. | A remote option still requires permission and geographic eligibility. Missing salary/cost-of-living indexes remain unavailable. |
| Automation tab | Explain the process-owner estimate and inspect real role tasks on Role reference. | Percentage, investment and lead time are assumptions. There is no claim that these tasks have been automated or that jobs can safely be removed. |
| Strategy scores and Evidence tabs | Show criteria, weights, assumptions, rationale, normalization and missing evidence. | Adjust weights and save to recalculate a pending requirement. Evidence confidence is a completeness/separation indicator, not probability of success. |
| Download brief | Select **Download brief**. | The JSON contains the requirement, human decisions, action history and public source register. It is a private evidence artifact; handle it accordingly. |
| Market observations `/market` | Open public job observations, then inspect any authorized market snapshots. | Adzuna refresh needs an account; JSON imports need a permitted source. Annual pay statistics use only explicit annual ranges and exclude predicted pay. This is a sample, not a representative compensation survey. |
| Public jobs `/public-jobs` | Open a real Remotive source link; show employer, eligibility, published salary text and snapshot date. | This page requires no login. The feed is delayed by 24 hours. Raw salary text is not interpreted as Indian annual compensation. |
| Scenario planner `/scenarios` | Change one input, compare the table, save a scenario. | Compare capacity, time, cost and assumptions. Infeasible scenarios remain visibly infeasible even if their relative score is high. |
| Review & approval `/decisions` | Choose a strategy, record rationale, approve or reject. | A feasible plan creates work items. When BUY/RELOCATE lacks established capacity, an explicit **sourcing investigation** can be authorized with a detailed risk rationale. Its snapshot remains infeasible; it does not authorize offers or promise fulfillment. |
| Capacity reservations `/capacity` | Show reservations created for a new approved Build/Borrow plan. | Each person is reserved in this workspace, so another requirement cannot commit them. Complete/cancel the associated work first; release requires an evidence note and is retained in action history. |
| Action tracker `/actions` | Assign an owner and record a real status change. | Completion needs a reference and outcome, not just a button click. These are accountable work items, not automated Workday/SAP transactions. |
| Recruitment `/recruitment`: Profiles | Register a consenting participant or create a single-use private invitation. | Unknown values can stay unknown here. Self-reported profiles remain separate from assessed planning records. Localhost invitations work only on this computer. |
| Recruitment: Requisitions | Select an approved external plan, write the real description, create draft, open it. | One requisition per requirement. Opening enables local application tracking; it does not publish to job boards. |
| Recruitment: Pipeline | Select a real profile and requisition, record actual source channel, then record real screening/interview/offer/hire evidence. | Human stage transitions and headcount limits are recorded. Do not mark invented interviews or hires merely to make the demonstration look complete. |
| Recruitment: Sourcing channels | Show actual applications, active cases and hires by channel. | Small samples do not establish general effectiveness. Time to fill is observed opening-to-hire duration for completed records, not a forecast for an unfilled job. |
| Employee opportunities `/employee` | Show gaps and learning paths for an imported employee. | This is an authorized planner view. It is not a separate employee self-service account. |
| Learning catalogue `/learning` | Search Microsoft Learn, open an actual module. | Catalog duration is learning content metadata, not evidence of attendance, completion or proficiency. |
| Data sources `/sources` | Explain provenance and export the public source register. | Distinguish official reference data, private observations, assumptions and missing evidence. |

## A demonstration without fabricated employees

Use real O*NET and Remotive data to explain a software role. Create a genuine planning requirement with no people loaded. Show the resulting gaps and lack of feasible capacity. Select BUY and explicitly authorize a sourcing investigation, with a rationale describing the uncertain market evidence and budget limits. Create a draft requisition from that authorization. Register a consenting participant and record their real application only if they are actually applying. Stop at the last truthful stage. A system that refuses to invent proof is a stronger demonstration than false hiring outcomes.

To demonstrate Build/Borrow instead, obtain consented employee/contractor records and actual assessments. Record a trainer-backed development estimate only when needed. Choose realistic constraints and use only the resulting feasible plan. Reservations are created for new approvals; pre-existing approvals made before this feature are not retroactively reserved automatically.

## Manual checks you can perform

These are instructions for you/evaluators; they were not executed during this pass.

- Refresh a page after a real save: records should persist in Neon.
- Check a source link and snapshot date before describing data as current.
- Submit an unknown skill: it should enter normalization review, not be silently treated as proficiency.
- Compare two pending requirements competing for one person: approve the first, recalculate the second through Strategy scores, and inspect reduced feasible capacity. Approval always recalculates on the server.
- Try releasing capacity while its work item is active: release should be blocked.
- Compare an approved decision snapshot with later scenario edits: historical decision evidence should remain unchanged.
- Use keyboard Tab, Enter/Space, and arrow/Home/End keys on requirement analysis tabs. Chart values are also available as tables. This is not a screen-reader certification.
- Walk the recruitment stages only with real events. Repeated applications for the same profile/requisition and hires beyond approved headcount should be blocked.

## Technical feasibility and approach

Next.js/React implement the interface and authenticated route handlers. Zod validates inputs. PostgreSQL/Neon stores source imports, profiles, requirements, scenarios, decisions and events. Owner-scoped row policies support the current personal workspaces. O*NET files are checksum-checked when loaded. Matching and scenario arithmetic are deterministic. Optional Gemini parsing assists with non-confidential role text; it does not create employee assessments or make hiring decisions.

Approval locks the requirement and owner roster, recalculates using current reservations, and inserts the decision, work items and resource reservations in one transaction. The unique person reservation prevents double commitment. Release checks terminal work and appends an audit note. This prototype uses coarse roster locks and whole-person reservations; scaling requires narrower locks and dated/fractional capacity modeling.

Public occupation and learning snapshots allow key-free reference use. Remotive supplies a delayed public advertisement snapshot. Adzuna is an optional account-backed connector. No credit-card service is silently activated. Private records are not sent to unpaid Gemini.

## Business scalability

Start with a small HR/workforce-planning pilot using consented exports. Compare actual baseline vs pilot time-to-fill, internal fill share, learning completion, contractor utilization and total realized cost. The current app supplies workflow records; savings need measured outcomes.

A possible commercial model is a workspace subscription plus vendor-specific integration/support services. This is a proposed model, not validated revenue. Customer value comes from reducing fragmented searches and improving decision evidence. Distribution could begin with staffing partners and internal HR teams; feasibility depends on data quality, workflow adoption and integration costs.

For multi-team deployment, add shared tenant membership and department authorization, SSO, employee-specific access, retention/deletion, managed secrets, background ingestion, retry/idempotency, monitoring, backups and restored-backup verification. Native integrations require the customer's vendor tenant, sandbox, scopes and acceptance. Search/pagination and precomputed matching become important with large rosters; loading entire workspaces is not a million-person architecture.

## Social and industrial impact

Potential social value: visible internal development paths, consented contractor conversion, clearer feedback about skill gaps and wider geographic access where remote work is allowed. Potential industrial value: better use of existing capability, explicit trade-offs, auditable decisions and less fragmented planning.

These are plausible benefits, not established outcomes. Performance data can encode historical bias, incomplete profiles can disadvantage people, and automation estimates can be wrong. Human review, source correction, consent, accessibility and measurement of disparate outcomes are necessary. Never present a score as a person's worth or as an automatic rejection rule.

## Likely evaluator questions

**Why is there still an empty or unavailable value?** Because there is no authorized observation for it. Public occupation data cannot replace an organization's people, performance or compensation records.

**Is this an ATS?** It includes a local recruitment pipeline, but its main purpose is deciding whether and how to recruit before a requisition is created.

**Does it use AI?** Optional AI extracts a non-confidential requirement. Scoring is deterministic. Paid embeddings and private AI explanation services are not active.

**Does it integrate with Workday or SAP?** Mapped exports can be ingested. There is no claim of verified native bidirectional execution without those accounts.

**What remains before production?** Shared-team security, vendor-specific connectors, licensed local benchmarks where required, operational controls, and completed security/accessibility/load/build verification. This pass deliberately did not run tests.

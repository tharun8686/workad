# Application API summary

All paths below use `/api`. Except configuration/openapi/registration and the separate public job page, routes require a signed-in allowed account. Writes require the configured same-origin request. Administrator/reviewer checks are enforced server-side for governance and human decision actions.

| Path | Operation |
|---|---|
| GET workspace | Owner-scoped requirements, decisions, actions, people (with reservations), skills/settings and source registry |
| GET occupations?q=... | Search downloaded official title aliases/tasks; up to 30 results |
| POST requirements/analyze | Validate a need, normalize, analyze and save |
| POST recommendation/:id | Save weights and recalculate a pending requirement |
| POST scenarios/:id | Calculate/save a scenario |
| POST decisions/:id | Append human decision; optional authorizeSourcing only for explicit BUY/RELOCATE investigation |
| GET brief/:id | Private downloadable requirement/decision/work/source JSON |
| POST actions/:id | Validated human workflow transition with note |
| POST reservations/:personId | Reviewer/admin capacity release, minimum 20-character reason, terminal associated work required |
| POST skills/:id | Admin-owned aliases and optional training days/cost/evidence override |
| GET market-data | Owner-scoped market snapshot history |
| POST market-data/import | Admin import of permitted role/location/currency/listing snapshot |
| POST market-data/refresh | Admin/reviewer request to configured Adzuna account |
| GET recruitment | Owner-scoped profiles, requisitions and applications |
| POST recruitment/profiles | Store consented self-reported profile |
| POST recruitment/invitations | Create private single-use registration link |
| POST registration | Redeem unexpired token and submit profile; no workspace read access |
| POST recruitment/jobs[/:id] | Reviewer/admin create from approved plan or change draft/open status |
| POST recruitment/applications[/:id] | Reviewer/admin record application or valid human stage transition |
| GET/POST imports | Administrator import history/validation/commit |
| POST sources/onet | Administrator official skill ingestion |
| GET learning / POST learning/refresh | Read downloaded catalogue / administrator refresh |
| GET/POST documents | Private document listing / authorized upload |
| GET documents/:id | Owner-scoped file download |

`/public-jobs` is a public page displaying the dated Remotive snapshot with attribution and original links. It is intentionally not behind signup. Native enterprise webhooks, shared-team APIs and active vector-search APIs are not exposed. The OpenAPI endpoint includes the added prototype routes; detailed import validation remains defined by the server schemas.

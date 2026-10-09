# Workforce Advisory

Evidence-led workforce planning and human recruitment prototype. Compare **Build, Buy, Borrow, Automate and Relocate** before opening a requisition.

## Start locally

From D:\SA run `npm run dev`, then open the address printed by Next.js. Use the configured owner account. Keep `.env.local` private.

- Evaluator walkthrough: [docs/PRESENTATION-GUIDE.md](docs/PRESENTATION-GUIDE.md), or `/presentation` inside the app.
- Exact implementation boundaries: [docs/COMPLETION-MATRIX.md](docs/COMPLETION-MATRIX.md).
- Setup: [docs/SETUP.md](docs/SETUP.md).
- Data sources: [docs/SOURCES.md](docs/SOURCES.md).

## Implemented workflows

Authorized CSV/JSON workforce imports and provenance; consented self-reported profiles; private supporting documents; official O*NET role/title/task references and skills; workspace aliases and evidenced training estimates; deterministic matching and five-strategy scenarios; human decisions and downloadable briefs; transactional Build/Borrow capacity reservations and audited release; work tracking; draft/open recruitment requisitions, applications and human stage history; real learning modules, public job advertisements and optional market API/import paths.

There is no fabricated workforce seed. Self-reported claims remain distinct from assessed planning inputs. Unknown market values stay unknown. Public datasets cannot supply your employees or their assessments.

## Data refresh

- `node scripts/download-occupations.cjs`: O*NET occupational files and integrity manifest.
- `node scripts/download-learning.cjs`: official Microsoft Learn modules.
- `node scripts/download-jobs.cjs`: Remotive public software-job snapshot; minimum six-hour interval.
- Data connections also supports official O*NET skill ingestion into the database.

Remotive advertisements are available without registration at `/public-jobs`, attributed and linked to the source. They are delayed demand observations, not candidate supply or verified Indian salary benchmarks.

## Status

Implementation changes in this pass were not built or tested, at the user's request. This is not a production-certification claim. Native enterprise execution, shared-team/employee isolation, semantic embeddings, licensed local compensation and formal accessibility/operational verification remain open. See the completion matrix before presenting or deploying.

# Local setup and release boundary

## Current project

The working directory is `D:\SA`. Neon and authentication configuration are stored privately in `.env.local`. Start with `npm run dev`, then open the address printed by Next.js. Do not display or publish that environment file.

The current owner setup allows the configured local owner to register/sign in during development. Hosted use requires reviewed email verification or OAuth configuration and explicit workspace allowlists. Personal workspace isolation is implemented; sharing one organization across multiple user accounts is not.

## Server environment

| Variable | Purpose |
|---|---|
| DATABASE_URL | Non-owner runtime PostgreSQL login with workforce_runtime membership |
| DATABASE_MIGRATION_URL | Owner connection for local migrations only; never ship as an app runtime secret |
| BETTER_AUTH_SECRET | Private high-entropy authentication secret |
| BETTER_AUTH_URL | Exact app origin; local normally http://127.0.0.1:3000 |
| WORKSPACE_EMAILS | Accounts allowed into the application |
| ADMIN_EMAILS / REVIEWER_EMAILS | Role allowlists for administration and human approval |
| LOCAL_OWNER_EMAIL | Development-only owner setup; not a production verification bypass |
| RESEND_API_KEY / EMAIL_FROM | Optional verified email delivery for hosted registration |
| GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET | Optional authorized GitHub sign-in |
| AI_PROVIDER | Configured AI provider, currently gemini |
| GEMINI_API_KEY / GEMINI_MODEL | Optional non-confidential requirement parsing; quotas and terms apply |
| ADZUNA_APP_ID / ADZUNA_APP_KEY | Optional authorized job-advertisement account; not needed for bundled public Remotive snapshot |
| LOCAL_SANDBOX / LOCAL_DATABASE_PATH | Explicit local-only database mode when no DATABASE_URL exists; not a production fallback |

No client-prefixed secret variables are used. Existing OpenAI embedding helpers are inactive in this Gemini configuration; no paid fallback is made.

## Database

`npm run db:migrate` applies workforce schema and access policies, ingestion and recruitment migrations (001–004). `npm run auth:migrate` applies the installed authentication schema. These require the migration connection and are administrative setup operations. Existing configured Neon migrations were applied earlier in the project. This pass uses the existing reservation and integration-run tables and adds no schema migration.

Use the runtime connection for normal application work. Do not seed fictional people into the real workspace. Import authorized records through Data connections with stable source IDs and observation dates.

## Public data files

Keep `data/onet/`, `data/microsoft-learn.json` and `data/remote-jobs.json` with the application. Next file tracing includes them. Their download scripts are listed in README. Role reference checks O*NET file hashes when loading. The Remotive downloader keeps a six-hour minimum interval and preserves links, source attribution and raw salary text.

## Before an eventual deployment

Deployment was not performed. Review provider permissions, data-use terms, authentication, tenant isolation, request limits, secrets, retention/deletion, backups, monitoring and scheduled refresh ownership. Complete build, security, accessibility, concurrency and operational verification. Configure HTTPS and a verified app origin. Do not publish personal source files, local database files or private invitations.

Tests and builds were not run in this pass, following the user's instruction. This document is setup guidance, not a release approval.

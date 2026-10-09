# Real data and provenance

Updated 8 October 2026. Real reference datasets do not supply your organization's people or establish their assessments.

| Source | Stored resource / fields | Status and limits |
|---|---|---|
| [O*NET 31.0](https://www.onetcenter.org/database.html) | data/onet: occupation_data.csv, job_titles.csv, task_statements.csv, software_skills.csv; manifest with source URLs, retrieval time and SHA-256 | Downloaded. Role reference and exact alternate-title mapping use titles/tasks. Software examples were ingested earlier into Neon (8,753 unique skills). CC BY 4.0; USDOL/ETA attribution, adaptations not endorsed. |
| [Microsoft Learn catalog](https://learn.microsoft.com/en-us/training/support/catalog-api-developer-reference) | data/microsoft-learn.json, official module metadata and URLs | 3,441 downloaded modules in the existing snapshot. Real learning content; duration is not assessed proficiency or course completion. |
| [Remotive public API](https://github.com/remotive-com/remote-jobs-api) | data/remote-jobs.json, 19 software-job advertisements, employer, geographic eligibility, original salary text and links | Downloaded 2026-10-08T11:40:11Z. Public page /public-jobs requires no signup. API data delayed 24h; source links/attribution retained. Snapshot hash 58e2bf3b7dbc627865008a17d17e8a13510698304dac189c8207b56412b5ddc3. Not a supply measure or representative salary benchmark. |
| [Adzuna](https://developer.adzuna.com/docs/search) | Owner-scoped market observations from configured account | Optional connector implemented; credentials/country access required. Not fetched in this pass. Salary predictions excluded from annual pay sample statistics. |
| Authorized workforce exports | Neon import_batches and talent_records | Owner supplies real employee/candidate/contractor records, source, authority and observation date. Imported assessments are not verified by public data. |
| Consented registrations | Neon talent_profiles | Self-reported claims; unknown values allowed. Kept separate from assessed matching inputs. |
| Recruitment events | Neon requisitions/applications/event history | Actual recorded human outcomes; opening-to-hire durations and channel counts describe this workspace only. |

## Not used as numerical evidence

ESCO, PLFS, BLS, commercial compensation providers and cost-of-living references were researched but are not numerical inputs to the current India scenario model. O*NET is an occupational classification; PLFS aggregates would not establish a precise Bengaluru software-role salary. No restricted salary site was scraped. No foreign pay figure is silently converted to INR.

## Reuse and refresh

O*NET attribution/license: https://www.onetcenter.org/license_db.html. The manifest records each downloaded resource. Skill adaptation deduplicates workplace example names and does not create performance or training estimates.

Remotive API instructions require attribution and original links and prohibit using listings to collect signups. The public observation page is ungated. Do not forward these listings into third-party job aggregators. Download at most every six hours; the source recommends only a few retrievals per day. See the linked API terms before publishing or changing usage.

Refresh failures must leave the last successful snapshot identified by its date; they must not create synthetic fallback rows. Neither advertisements nor a list of registered profiles is proof of a currently available workforce.

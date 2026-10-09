# Public evidence integrations

Workforce memory now includes **Explore public evidence** in the learning, semantic matching and fair-pay views. The authenticated, same-origin `POST /api/intelligence/discover` endpoint accepts `{source, query, country}`. Source is `esco`, `openalex`, `worldbank` or `city`; country defaults to `IN` and must be a two-letter code. Searches are explicit user actions. Do not enter personal or confidential information.

- ESCO searches standard skill concepts (v1.2.0), with source URIs. Suggested labels require human review and do not change assessed proficiency or vector rankings automatically.
- OpenAlex searches open-access research. Optional server-only `OPENALEX_API_KEY` increases the free request allowance. Research is supplementary learning material, not an LMS completion record.
- World Bank returns the most recent nonempty annual national consumer-price inflation observation and its year. It does not supply city budgets or salary bands; fair-pay calculations continue using approved compensation evidence.
- City lookup uses Nominatim-compatible structured city searches. Set `NOMINATIM_BASE_URL` to an HTTPS hosted/self-hosted service or an application-wide caching proxy, and `NOMINATIM_USER_AGENT` to an application identifier with an operator contact. Direct access to the public OSM server is disabled because process-local throttling cannot enforce a global limit across deployed instances. The connector uses explicit searches only, attribution, a 24-hour bounded process cache and a 1.1-second process request interval. A proxy using public Nominatim must enforce persistent caching and at most one request/second across the whole application. Review https://operations.osmfoundation.org/policies/nominatim/ before configuring it. No autocomplete or bulk lookup is implemented.

Provider responses are validated and fetched with timeouts, no redirects, bounded result counts and safe display links. Failures do not modify workforce records. Search cache is process-local and resets on restart. Source and retrieval time are displayed.

## Microsoft Learn

The existing Learning catalogue refresh now uses the authenticated Platform API `/api/v1/modules` instead of the deprecated anonymous catalogue. Set these server-only values using your onboarded Microsoft Entra app:

```
MICROSOFT_LEARN_TENANT_ID=
MICROSOFT_LEARN_CLIENT_ID=
MICROSOFT_LEARN_CLIENT_SECRET=
```

The connector obtains an app-only token for `https://learn.microsoft.com/.default`, follows validated same-origin module pagination, normalizes the new response into the existing catalogue format, and saves only a complete successful refresh. Page/time limits fail safely without replacing saved records. Credentials and tokens are never returned to the browser or stored in integration history. Live access requires Microsoft onboarding and has not been verified without credentials.

Sources: https://learn.microsoft.com/en-us/training/support/integrations-learn-platform-api-get-started and https://learn.microsoft.com/en-us/training/support/integrations-learn-platform-api-catalog-endpoints-developer-reference

Numbeo is paid and was not connected. Coursera/AWS learner evidence continues through the existing authorized export and signed-webhook integrations. Gemini remains the configured AI integration.

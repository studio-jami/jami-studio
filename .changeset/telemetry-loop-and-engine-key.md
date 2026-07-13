---
"@agent-native/core": patch
---

Two fixes for env-selected non-Anthropic engines and workspace-mounted telemetry:

1. `http.response` server telemetry now evaluates its tracking-ingest exclusions (and route-kind classification) against the app-relative path. On unified workspace deployments the app sees its mounted path (`/analytics/api/analytics/track`), so the exclusion never matched — every ingest POST emitted another `http.response` event which POSTed again, a self-sustaining loop that filled the workspace database to its storage cap in a day with zero users.

2. Credential resolution now agrees with engine resolution: `getOwnerActiveApiKey` honors the `AGENT_ENGINE` env override before the stored settings row, and the host-provided Anthropic key fallback only applies when the run's engine is Anthropic-family. Previously `AGENT_ENGINE=ai-sdk:google` with no settings row resolved the Anthropic deploy key and handed it to the Google engine, failing every run with "API key not valid".

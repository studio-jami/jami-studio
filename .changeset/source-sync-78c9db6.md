---
"@agent-native/core": patch
---

Source sync 78c9db6 (upstream 0.98.8 line) with fork dedupes: kept the
unconditional base-path-aware netlify build guard, grafted any-cause upload
backoff + circuit breaker onto the new session-replay failure machinery,
carried the jami.studio identity through the tracking-identity and
skills-content refactors, and fixed Windows path handling in the new guards
package (doctor suite green on Windows). Workspace MCP resource loading on
Postgres is fixed by the upstream CAST null-probe change arriving in this
sync (hummingbird issue 54).

---
"@agent-native/core": patch
---

Workerd-safe init memoization (`createInitMemo` in shared/init-memo.ts): module-scope `let _initPromise` singletons freeze on Cloudflare Workers when the request that created them responds before the init settles — every later awaiter then hangs forever. Proven live: `ensureObservabilityTables` frozen by a get-session-first request ordering wedged every agent chat run at "Starting agent" on the unified runtime. The helper ties the init promise to the creating request via `__cf_ctx.waitUntil` and re-runs a presumed-frozen pending memo under the current request after a bounded wait (init bodies are idempotent DDL). The observability store now uses it; the remaining ~38 `_initPromise` stores are queued for the same conversion.

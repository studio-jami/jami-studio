---
"@agent-native/core": patch
---

Keep Neon's poolQueryViaFetch HTTP path alive on Cloudflare Workers: attachNeonPoolErrorLogger's per-client 'connect' listener flips @neondatabase/serverless's hasFetchUnsupportedListeners flag, silently reverting every plain query to a WebSocket checkout — which, combined with the single-use clients workerd requires, churned a new WebSocket per query until the isolate hit its connection cap and pool.connect() hung forever (observed: authed action requests hanging after ~10 queries under wrangler pages dev). The logger now attaches only the pool-level 'error' listener on workerd; the per-client listener's purpose (preventing Node's uncaught-'error' process crash) doesn't apply there.

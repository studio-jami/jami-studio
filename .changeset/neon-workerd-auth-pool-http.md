---
"@agent-native/core": patch
---

Complete the Neon-on-workerd fix: the better-auth Neon pool (third pool site) now also routes over stateless HTTP with single-use WebSocket clients on Cloudflare Workers, and buildResilientNeonPool gains an httpPerQuery mode so the Drizzle path actually goes through pool.query() (its manual connect()/client.query() checkout was bypassing poolQueryViaFetch and pinning queries to per-request WebSocket clients). Fixes worker hangs on the request following an authenticated write under wrangler pages dev.

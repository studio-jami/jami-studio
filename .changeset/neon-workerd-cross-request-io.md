---
"@agent-native/core": patch
---

Fix Neon on Cloudflare Workers: workerd forbids reusing I/O objects across requests, so pooled Neon WebSocket clients created by one request and handed to a later one threw "Cannot perform I/O on behalf of a different request", hung the worker, and returned 500s (first seen on auth get-session under wrangler pages dev). Both Neon paths (raw DbExec in client.ts and the Drizzle pool in create-get-db.ts) now route plain queries over Neon's stateless HTTP transport (poolQueryViaFetch) on workerd and cap WebSocket clients (still used for transactions) to a single use so they are never reused across requests.

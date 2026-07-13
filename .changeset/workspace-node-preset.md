---
"@agent-native/core": minor
---

Add a `node` preset to the unified workspace deploy (`agent-native deploy --preset node`): every app builds with Nitro's `node-middleware` runtime behind a per-app scope-init entry, and a generated `dist/server.mjs` dispatcher serves the whole workspace from one bare Node process — same-origin routing, dispatcher-owned static assets with immutable cache headers, WebSocket upgrade routing, and sequential app loading behind a module-graph handshake so per-app registries and identity env never collide across sibling apps.

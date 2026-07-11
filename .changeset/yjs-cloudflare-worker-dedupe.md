---
"@agent-native/core": patch
---

Dedupe Yjs in Cloudflare worker bundles. The per-app cloudflare_pages build keeps `yjs` external and emits it as a standalone `_worker.js/_libs/yjs.mjs` (bare imports rewritten to it); unified workspace deploys then hoist ONE shared copy to `dist/_yjs/yjs.mjs` and shim every app's lib to re-export it, so wrangler's final re-bundle instantiates Yjs exactly once. Fixes the "Yjs was already imported. This breaks constructor checks" error logged once per extra app copy per isolate and removes the cross-copy instanceof risk in real-time collab.

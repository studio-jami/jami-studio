---
"@agent-native/core": patch
---

`getConfiguredAppBasePath()` (and the Vite-env variant) now falls back to the per-module-graph baked `APP_BASE_PATH` on unified workerd deployments. Without it the auth guard could not strip the mount prefix, so app-declared public paths outside `/api` and `/_agent-native` (e.g. analytics `/track` ingest) never matched on the unified worker — cookieless callers got the guard's 401 while the same handler at an `/api/...` alias worked. Matches the Netlify preset, which delivers the same value via per-function env.

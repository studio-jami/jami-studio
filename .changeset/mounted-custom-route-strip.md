---
"@agent-native/core": patch
---

The generated Cloudflare worker entry now strips the mount prefix for the app's own custom h3 routes outside `/api` and `/_agent-native` (exact route-table matches only, e.g. analytics `POST /track` ingest). Previously only `/api` and `/_agent-native` subtrees were stripped, so mounted deployments 404'd bare-registered routes like `/<app>/track` even after the auth guard passed. Page paths keep their full pathname for the static-shell fallback.

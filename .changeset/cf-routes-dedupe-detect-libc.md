---
"@agent-native/core": patch
---

Cloudflare Pages unified deploy fixes found by running the artifact on workerd: (1) `_routes.json` no longer emits rules covered by another rule's splat (Cloudflare rejects overlapping rules — "/apps/new-app" under "/apps/*" broke every workspace deploy); (2) stub `detect-libc` in the worker bundle — it calls `process.report.getReport()` at require time, which unenv throws on, killing the worker at module init.

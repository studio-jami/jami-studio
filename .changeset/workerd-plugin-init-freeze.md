---
"@agent-native/core": patch
---

Fix permanently hanging framework routes on Cloudflare Workers: nitro doesn't await async plugins, so plugin-init and default-bootstrap promises are created during an app's first request — when that request responds before they settle (e.g. an auth route that doesn't match the pending inits' paths), workerd freezes their pending I/O forever and every later request's readiness gate awaits a promise that can never settle (observed: authed action requests hanging >90s after a get-session request initialized the app). Init promises are now tied to the creating request's lifetime via ctx.waitUntil, and readiness-gate awaits are bounded (20s) on workerd so a frozen init degrades to a retryable response instead of a permanent hang.

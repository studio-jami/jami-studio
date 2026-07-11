---
"@agent-native/core": patch
---

Fix authed deep links 404ing on unified workspace deployments: the Cloudflare worker's static-app-shell fallback fetched an unprefixed "/index.html" from the shared ASSETS binding, but workspace apps serve their shell under the app base path (/dispatch/index.html) — so after sign-in, client-route navigations like /dispatch/overview leaked h3's JSON 404 instead of the SPA shell. The fallback now tries the base-path-prefixed shell first and falls back to the root shell for single-app deployments.

---
"@agent-native/core": patch
---

Fix workspace Netlify builds failing the single-template deploy guard: mounted apps (APP_BASE_PATH=/<app>) publish hashed client assets at dist/<app>/assets, but the guard only checked dist/assets and aborted every `agent-native deploy --preset netlify` workspace build with "dist/assets is missing hashed client assets". The guard and the `_redirects` cleanup are now base-path aware (checking and stripping the incompatible default-function rewrite at both the dist root and the mounted dir).

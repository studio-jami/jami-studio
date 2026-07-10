---
"@agent-native/core": patch
---

Fix the Windows workspace-gateway orphan-vite loop and silent pnpm spawn failure: (1) app restarts/shutdown killed only the direct pnpm child with SIGTERM, orphaning the vite grandchild that kept the app port bound — the gateway then respawned forever into "Port 810x is already in use" (blank apps, dropped sessions); child teardown now fells the whole process tree via `taskkill /T` on Windows. (2) Node >= 20.12 refuses to spawn pnpm's .cmd/.ps1 shims without a shell, failing ENOENT with no `error` listener — the default spawner now runs pnpm's JS entry (`npm_execpath`) through the current Node executable on Windows, and a new child `error` handler surfaces any spawn failure into the visible retry path instead of silence.

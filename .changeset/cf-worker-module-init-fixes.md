---
"@jami-studio/core": patch
---

Fix three Cloudflare Pages worker module-init crashes surfaced by serving the unified workspace artifact under wrangler pages dev: stub `sharp` (its native loader threw at require time), expose functional overrides like `os.tmpdir()` through the node-builtin stub default export (a bare throwing proxy killed workers that call overridden members via `import os from "os"`), and patch remaining `import.meta.url` occurrences in worker bundles (wrangler's re-bundle empties inner `import.meta`, so `fileURLToPath(import.meta.url)` threw at module init). Also default `RAYON_NUM_THREADS` to 1 on Windows workspace builds — 2 threads still hit the rolldown rayon access-violation race in full 14-app sequences.

---
"@agent-native/core": patch
---

Fix Cloudflare/Deno deploy builds failing on Windows with `spawnSync ...\esbuild\bin\esbuild ENOENT`: `esbuild/bin/esbuild` is a `#!/usr/bin/env node` JS shim and shebangs don't exist on Windows, so spawning it directly fails even though the file exists. Both esbuild invocations in the deploy build now run node-shebang shims through the current Node executable (native binaries and PATH lookups still spawn directly).

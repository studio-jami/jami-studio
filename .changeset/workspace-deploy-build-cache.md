---
"@agent-native/core": patch
---

Workspace deploy now caches per-app builds by content hash: unchanged apps (sources, workspace deps, lockfile, invocation env, builder version) reuse their previous build output instead of rebuilding. Disable with `--no-build-cache` or `AGENT_NATIVE_WORKSPACE_BUILD_CACHE=0`.

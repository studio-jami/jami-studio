---
"@agent-native/core": patch
---

Fix a unified-worker regression in 0.92.32's workspace env baking: per-app keys (app id, base path, audience, public/protected route lists) were baked into the SHARED `process.env` of the single Cloudflare isolate, so the first app's scope-init poisoned every sibling — all apps stripped request paths against dispatch's base path and 401'd their framework routes (A2A, auth/session). Per-app keys now travel through the per-module-graph scope (`setModuleGraphEnvDefaults` in `_scope-init.js`, read via `getModuleGraphEnvDefault` fallbacks in the audience/route-access env readers), the same isolation mechanism as the 0.92.28 registry scoping. Only workspace-identical keys (`AGENT_NATIVE_WORKSPACE`, the workspace-apps manifest JSON) remain `process.env` defaults.

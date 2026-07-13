---
"@agent-native/core": patch
---

Trust the build-time bundling decision for optional AI SDK provider packages inside deployed artifacts. The unified deploy entries (Node and Cloudflare) now bake an `AGENT_NATIVE_BUNDLED_AI_SDK_MODULES` module-graph env marker listing the optional AI SDK packages that resolved at build time, and the agent engine registry's install check consults that marker before falling back to `require.resolve`. Fixes ai-sdk engines (e.g. `AGENT_ENGINE=ai-sdk:google`) refusing with "requires optional packages that are not installed" on bundled deployments where the provider code is inlined in the bundle and no node_modules entry exists for a runtime filesystem probe to find.

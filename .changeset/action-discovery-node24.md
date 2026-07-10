---
"@agent-native/core": patch
---

Fix agent-action discovery silently skipping every action on Node >= 23.6: native TS type stripping lets the root action.ts import succeed, but does no specifier rewriting, so child `./helper.js` -> helper.ts and extensionless-TS imports fail with ERR_MODULE_NOT_FOUND — and the jiti fallback only triggered on `Unknown file extension ".ts"`. Discovery now also retries with jiti on ERR_MODULE_NOT_FOUND, restoring full action registration on Node 24 without the `--no-experimental-strip-types` workaround.

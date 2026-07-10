---
"@agent-native/core": patch
---

workspace-deploy: retry app builds that die with a Windows native-crash exit code (0xC0000005 / 3221225477). These are bundler native-binding timing races, not build failures — the same build passes on retry. Bounded to 3 attempts; ordinary non-zero exits are never retried.

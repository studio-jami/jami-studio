---
"@agent-native/core": patch
---

Per-app global-registry scoping on unified workspace deployments. The
globalThis-pinned framework registries (file-upload providers, private-blob
providers, shareable resources, event-bus registry + bus, notification
channels, tracking providers + queue, secrets registry) were shared across
every app in the single Cloudflare Pages isolate, so one app's registrations
served another app's requests — an upload POSTed to /assets was handled by
the clips app's S3 provider (wrong object prefix). Registries now resolve
their global keys lazily through a per-module-graph scope
(`@agent-native/core/global-scope`), and each mounted app's generated worker
entry sets its scope id via a `_scope-init.js` module evaluated first in the
bundle's import graph. Dev-mode and single-app deployments stay unscoped, so
the original multi-ESM-graph dedupe behavior is unchanged.

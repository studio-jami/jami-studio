---
"@agent-native/core": patch
---

Cloudflare workspace deploys now bake the per-app workspace env (workspace-apps manifest, app id, base path, audience, public/protected route lists) into the generated `_scope-init.js` as `process.env` defaults. workerd has no filesystem and no ambient build env, so agent discovery could never see sibling workspace apps on the unified worker — `ask_app`/`call-agent` resolved apps to the builtin hosted prod URLs and failed with "internal error". Netlify's generated function entry already did this (`setBasePathEnv`); this is the Cloudflare-preset equivalent. Runtime bindings still win over baked defaults. Also adds an optional `resumable.preferredChunkBytes` to `FileUploadProvider` so S3-compatible providers can negotiate multipart part sizes (uniform >= 5 MiB) with upload clients.

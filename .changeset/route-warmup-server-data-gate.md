---
"@agent-native/core": patch
---

Route warmup skips `.data` prefetching when the client manifest advertises no
server loaders/actions. Static-shell deployments (Cloudflare Pages worker
without a React Router request handler) strip those flags at build time —
`.data` requests can never be served there, so warming them produced a
guaranteed 404 per hovered/visible link (the residual `chat.data` 404 seen
after the manifest strip landed). SSR deployments are unaffected.

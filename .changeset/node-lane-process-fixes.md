---
"@agent-native/core": patch
---

Unified workspace Node runtime fixes from the first full 14-app hummingbird boot: (1) server Sentry init is now process-wide idempotent — on `--preset node` every app bundle carries its own copy of `server/sentry.ts`, and N `Sentry.init` calls stacked N `Http.Server` emit wrappers growing per request until `RangeError: Maximum call stack size exceeded`; a `Symbol.for`-keyed process flag makes the first init win. (2) node-middleware output now bundles yjs into `_libs/yjs.mjs` and rewrites bare `yjs` imports left in split chunks — nitro's file tracer doesn't copy the yjs package (or lib0/isomorphic.js) into the traced server node_modules, which 500'd every SSR request in apps whose chunks kept the Vite external (clips, plan).

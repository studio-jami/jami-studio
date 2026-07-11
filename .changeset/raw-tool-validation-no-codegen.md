---
"@agent-native/core": patch
---

Agent raw-tool-input validation survives codegen-restricted runtimes. Ajv
compiles JSON-schema validators via `new Function`, which Cloudflare's
workerd rejects (`EvalError: Code generation from strings disallowed`) — on
the unified worker EVERY tool whose action entry lacks a live zod schema was
refused with "tool schema is invalid" before execution (the slides agent was
fully paralyzed; dispatch's tool-search failed every call). When Ajv cannot
compile, validation now degrades to a non-codegen structural check (object-
ness + `required` keys); the action's own parameter validation remains
authoritative at execution time. Node runtimes keep full Ajv validation.

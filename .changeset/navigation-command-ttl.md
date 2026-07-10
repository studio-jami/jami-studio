---
"@agent-native/core": patch
---

Fix stale agent navigation commands bouncing users off the page they just clicked: one-shot commands (`navigate*`, `__set_url__*`) persisted in application_state were re-consumed on every app mount, so a row left behind by a lost consume-DELETE (crash-looped app, killed tab, failed fetch) yanked the user away hours later. Timestamped commands (the framework's writers embed `Date.now()` in `_writeId`) now expire after 120s — expired rows are deleted at read time instead of applied. Configurable via the new `commandTtlMs` option (`false` disables); commands without a parseable timestamp are still always applied for back-compat with external writers.

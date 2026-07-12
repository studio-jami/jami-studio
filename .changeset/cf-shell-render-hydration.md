---
"@agent-native/core": patch
---

Cloudflare Pages static shell: render the real landing page instead of the hydration-mismatching manifest fallback — resolve framework-transitive packages (yjs, prosemirror) via module resolution hooks, follow same-origin index redirects with mount-prefix stripping, try both prefixed and unprefixed route shapes, and make the SSR heavy-lib stub callable/constructible so module-scope `new PluginKey(...)` in stubbed client code cannot crash the shell render. Manifest-fallback shells now emit `<html lang="en-US" dir="ltr" data-locale="en-US">` when the root route has a loader, matching the default hydration state. Fixes React #418 hydration errors on served workspace apps.

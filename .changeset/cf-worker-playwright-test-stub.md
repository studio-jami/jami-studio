---
"@agent-native/core": patch
---

Stub playwright and playwright/test in the Cloudflare Pages worker bundle. Template actions import "playwright/test" with a literal dynamic import (design's screenshot action), and the bare --external left an unresolvable import in the final _worker.js, so wrangler/Pages refused the bundle. Both specifiers now resolve to throw-at-call-time stubs, matching the playwright-core behavior.

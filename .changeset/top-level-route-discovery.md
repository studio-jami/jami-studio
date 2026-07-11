---
"@agent-native/core": patch
---

Serverless route discovery now mounts TOP-LEVEL `server/routes/*` files (e.g. analytics `track.post.ts` → `POST /track`) in the generated worker entry — previously only the `/api` and `/_agent-native` subtrees were scanned, so ingest routes living outside `/api` 404'd on every serverless deploy. Page catch-alls (`[...page].get.ts`) stay unmounted (the static app shell owns page serving), and non-api subdirectories are unchanged.

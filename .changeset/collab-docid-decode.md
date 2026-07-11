---
"@agent-native/core": patch
---

Collab routes decode percent-encoded `docId` router params. Structured docIds
(`plan:<id>:<block>`) that clients percent-encode as a path segment
(`plan%3A...`) reached resolvers undecoded — prefix checks failed and the
request 404'd even though the raw-colon form worked. Malformed escape
sequences fall back to the raw value.

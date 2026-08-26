---
"@agent-native/core": patch
---

`useSession` now accepts an optional `{ enabled }` flag (default unchanged:
always fetches). `FeedbackButton` takes a new `anonymous` prop for hosts with
no auth surface (e.g. public static docs sites): it disables the mount-time
`/_agent-native/auth/session` fetch and simply submits without an
`submitterEmail` attribution. Previously rendering a FeedbackButton on any
page forced a session request — on deployments without the
`/_agent-native` namespace that was a 404 origin-render per page load.

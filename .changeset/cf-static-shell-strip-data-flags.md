---
"@agent-native/core": patch
---

Cloudflare Pages static-shell deployments: strip `hasLoader`/`hasAction` from
the React Router client manifest at build time. The CF worker intentionally
ships no React Router request handler (static app shell keeps the merged
worker under the platform bundle-size limit), but templates build with
`ssr: true`, so the hydrated router issued single-fetch `GET <route>.data`
requests on every client-side navigation into a route with a server loader —
nothing served them, they 404'd, and React Router tripped the route
ErrorBoundary (`No result found for routeId "..."`), breaking in-app
navigation across every app of a unified workspace deployment. With the
server-only flags stripped, client-side navigation behaves exactly like the
initial static-shell load: render with client data only. `hasClientLoader`/
`hasClientAction` are preserved; other presets are unaffected.

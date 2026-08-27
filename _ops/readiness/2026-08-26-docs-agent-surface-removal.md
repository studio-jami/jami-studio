# Docs Agent-Surface Removal — Deploy Fixes (2026-08-26)

Stops the docs site (`jami-studio-docs` on Vercel) burning serverless CPU by
removing the framework agent surface that browsers were polling against, and
fixes the deploy that regressed while that work was in flight.

## Root cause of the CPU burn

The docs client shipped the full framework agent runtime. On every page load
(and every window focus), two independent code paths polled endpoints that do
not exist in the docs build:

1. `AgentSidebar` / agent chat client runtime → `/_agent-native/events` (SSE) +
   `/_agent-native/auth/session`.
2. `configureTracking()` → `/_agent-native/auth/session` +
   `/_agent-native/agent-engine/status`, unconditionally, even with no
   analytics provider configured.

In the Vercel `node`-preset build those routes do not exist, so every hit fell
through to the React Router SSR catch-all, which rendered a full 135KB 404
HTML document with `cache-control: max-age=0, must-revalidate`. Secondary burn:
`/llms.txt` (252KB) was also served `max-age=0`, so every AI-crawler hit
re-rendered it.

## Fixes applied

- Removed the agent client runtime from the docs root shell (the
  `configureTracking` call is gone; `AgentSidebar` import removed).
- `FeedbackButton` (rendered twice in the docs header) unconditionally called
  `useSession()` on mount → the live `/_agent-native/auth/session` poller that
  survived the above. Fixed in core: `useSession({ enabled })` flag + new
  `FeedbackButton` `anonymous` prop (no session fetch, submits without email).
  Docs header passes `anonymous`. Template hosts keep prior behavior.
- Deleted the agent server plugins (`agent-chat`, `auth`, `core-routes`,
  `db`) and the `actions/` surface from docs.
- Added a defensive `/_agent-native` guard in **two layers** because the two
  deploy paths route differently:
  - **Vercel (React Router preset)** — `app/entry.server.tsx` short-circuits
    `/_agent-native` at the top of `handleRequest`, before any render. This is
    the layer that actually matters on Vercel: `server/routes/*` (Nitro
    file-based routes) are ignored, and a `Response` thrown/returned from a
    route loader still renders through the HTML error boundary.
  - **Nitro (Netlify/node)** — `server/lib/agent-namespace-guard.ts` +
    `_agent-native.get/post.ts` + `_agent-native/[...rest].get/post.ts` answer
    the namespace with a tiny JSON 404 (`s-maxage=86400`); `Accept:
    text/event-stream` gets 410 + `connection: close`.
  Verified in production (`docs-origin.jami.studio`):
  `/_agent-native/auth/session` now returns a tiny `application/json` 404
  (`{"error":"Not found. This site has no agent endpoints."}`) instead of a
  488KB SSR HTML document.
- Cached SEO static assets (`/llms.txt`, `/llms-full.txt`,
  `/robots.txt`, `/sitemap.xml`) at `s-maxage=604800` in `vercel.json`.
- Removed the stale `{#builderio}` anchor from `deployment.mdx` + 10 locales
  (renamed `{#visual-editing-in-production}`). No Builder.io external links
  remain in docs content — only the product's own "form builder" prose and
  the `builderPrivacy` / `builderTerms` legal-link keys.

## Deploy regression this commit fixes

1. `packages/docs/.gitignore` line `server/*` ignored
   `server/lib/agent-namespace-guard.ts`; the four committed guard routes
   import it, so Vercel's rolldown build failed with an unresolvable import.
   Added `!server/lib/`.
2. `.vercel-tmp/` (25 scratch scripts/logs incl. a 566KB simulation bundle) was
   accidentally committed in `9cbe0fb1a`. Untracked and added to root
   `.gitignore`.
3. `.{get,post}.ts` / `[...rest].{get,post}.ts` replaced the earlier
   `.{all}.ts` experiments (nitro registered the `.all` suffix literally, not
   as a method-less route).

## Notes for later

- **Vercel runs the React Router preset**, not the Nitro node-server entry.
  The project (`jami-studio-docs`, root dir `packages/docs`) is framework
  detected as "React Router". Interception for Vercel has to live in
  `app/entry.server.tsx` / `app/routes/*`, NOT `server/routes/*` (Nitro-only).
- The earlier local `node .output/server/index.mjs` render 500
  (`react.mjs ↔ generator.mjs ↔ react-router.mjs` interop at init) is a
  local-only artifact of cold-loading the Nitro node-server ESM entry; Vercel
  uses the React Router server entry and renders 200.
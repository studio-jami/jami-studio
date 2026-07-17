# Session Summary — 2026-07-17 — Jami brand reframe (docs + marketing)

Three shipped waves on `main`, all live-verified on www.jami.studio.

## Wave 1 — Brand language reframe (5128e1180)

- "Agent-native" category term retired across docs content (EN + 10 locales),
  docs UI, and marketing. Brand canon: **Jami Studio** = brand, **Jami** =
  "Just Another Machine Interface" (singular Machine, never "J.A.M.I." in copy).
- `what-is-agent-native` → `what-is-jami`, `agent-native-toolkit` →
  `jami-studio-toolkit` (301 redirects in place).
- Marketing hero/meta reframed (interchangeable parts, domain workspaces,
  always-on interruptible agent). Broken `Jami Studio/agent-native` repo slugs
  fixed to `studio-jami/jami-studio`.
- **Functional identifiers untouched by design**: `@agent-native/*` packages,
  CLI commands, `/_agent-native/*` routes, `AGENT_NATIVE_*` env vars, and the
  BuilderIO release-download URLs (studio-jami has zero GitHub releases) wait
  on the npm/org rename. Canon recorded in `../masters/SUPERSESSIONS.md`.

## Wave 2 — Logo, hero, no per-app demos (55f0002da)

- Docs favicon/manifest icons replaced with the Jami red mark (source:
  `packages/marketing/public/icon.svg` +
  `packages/marketing/_ops/admin/brand/jami-red/favicon/*`).
- Docs homepage hero across all 11 locales: "Just another / machine interface"
  (brand tagline intentionally untranslated); CTA "Explore the apps"
  (translated per locale).
- **All per-app demo subdomain links removed** (`*.jami.studio` Try It buttons,
  hosted-demo notes) from TemplateCard, generic slug page, and 10 dedicated
  app pages. Per-app subdomain demos are permanently out of scope; a unified
  demo comes later. Apps page stays and is linked from the marketing nav.

## Wave 3 — Legacy landing retired (42d6b69db + 128b63d76)

- Old Builder-era Seascape/constellation docs homepage deleted;
  `packages/docs/app/routes/_index.tsx` is now a redirect loader to
  `https://www.jami.studio/` (safe: docs has `ssr: true`, no prerender).
- Header brand + error-screen "Go home" are hard `<a href="/">` anchors —
  a client-side react-router `Link` to `/` renders the docs app's own route
  and never reaches the server where marketing owns `/`.
- 128b63d76 = oxfmt-only commit for `packages/marketing/components/nav.tsx`.

## Deploy topology (verified this session)

- `packages/marketing` (Next.js) owns `/` on www.jami.studio via its own
  git-auto-deploy Vercel project (no local `.vercel` link; not listable from
  the repo). Fallback rewrite in `next.config.mjs` sends all other paths to
  `https://jami-studio-docs.vercel.app/:path*`.
- `packages/docs` = Vercel project `jami-studio-docs`; `vercel ls` works only
  from `packages/docs`. Marketing prerender is ~300 s stale after deploy —
  verify with cache-busted requests.

## Known leftovers (intentional, candidates for a next wave)

- Unused i18n keys in `packages/docs/app/i18n/*`: hero `tryIt`, `s008`/`s009`,
  and hosted-demo `s057`/`s060` template keys — dead but harmless.
- `vite-sitemap-plugin.ts` still parses `demoUrl` (degrades gracefully; no
  templates define it anymore).
- `packages/docs/app/routes/homepage-new.tsx` (+ `$locale.` variant) — an
  unlinked draft landing route; fate undecided (promote or retire).
- The big functional-identifier rename (`@agent-native/*` npm scope, CLI,
  routes, env vars) is a separate owner-led decision, not a docs pass.

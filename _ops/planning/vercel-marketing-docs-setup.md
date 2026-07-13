# Vercel setup — marketing + docs (jami.studio)

Date: 2026-07-13. Owner-ratified decisions: marketing is the landing page,
docs live under the same host at `/docs` (path over subdomain for SEO/AI-SEO
consolidation), builder.io-branded surfaces are legacy pending the jami.studio
rebrand — no per-file rescue plumbing for them.

## Topology (live, verified)

- Canonical host: `https://www.jami.studio` — matches the committed source
  canon (`SITE_URL` in `packages/docs/app/seo.ts`, `root.tsx`, sitemap plugin,
  robots.txt, legal pages, tests).
- `jami.studio` (apex) → 308 → `www.jami.studio`.
- `www.jami.studio` → Vercel project `jami.studio-marketing`
  (`prj_AjqrMTwirc5miXdu8j8vWOLRSTfO`, rootDirectory `packages/marketing`,
  framework `nextjs`).
- `www.jami.studio/docs/*` and `/assets/*` → Next.js rewrites in
  `packages/marketing/next.config.mjs` → docs deployment
  `https://jami-studio-docs.vercel.app` (project `jami-studio-docs`,
  `prj_S6t3Wmri57fyFooFI9vNS5ot0q75`, rootDirectory `packages/docs`,
  framework `react-router`). The docs app natively routes `/docs/*`; no
  basePath work needed.
- Docs project env: `APP_URL=https://www.jami.studio` (all targets) so
  framework agent-web surfaces (llms.txt, JSON-LD, agent card) emit the real
  host.

## Why the marketing deploy was failing (root cause, fixed)

`ERR_PNPM_OUTDATED_LOCKFILE`: `packages/marketing` was a half-integrated
scaffold — nested `pnpm-lock.yaml` (dead inside a workspace), dead
package-level `pnpm.overrides`, scaffold name `my-project`, and never
installed into the root lockfile. Fixed at source: deleted the nested lock,
renamed to `@agent-native/marketing`, dropped the override, ran root
`pnpm install` to register the importer.

## Ops tooling

- `_ops/scripts/vercel-inspect.mjs <prj_id...>` — project settings, domains,
  last deployments, error-log excerpts.
- `_ops/scripts/vercel-setup-marketing-docs.mjs` — one-time: framework=nextjs
  on marketing, APP_URL env on docs.
- `_ops/scripts/vercel-align-www-canonical.mjs` — one-time: www primary,
  apex 308 → www, APP_URL → www.
- All read the local Vercel CLI token (`com.vercel.cli/Data/auth.json`)
  and never print it. CLI `--scope` is broken for this team; use the REST API.

## Content/rebrand pass (completed 2026-07-13, same day)

- Landing page links Docs (`/docs`) in nav and footer.
- Marketing rewrites switched to a **fallback** proxy: marketing serves its
  own pages/assets; every unmatched path (docs, apps, templates, skills,
  download, brand, privacy, terms, locale variants, `/assets`,
  `sitemap.xml`, `robots.txt`, `llms.txt`, `/_agent-native/*` incl.
  generated og images) falls through to the docs deployment.
- Docs app rebranded: header icon + "Jami Studio" wordmark (legacy
  agent-native-*.svg deleted), brand page serves the Jami mark, default og
  image now `https://www.jami.studio/og-image.png`, JSON-LD / sitemap
  organization / codeRepository / GitHub links point at
  `https://github.com/studio-jami/jami-studio`, brandPage titles updated in
  all 11 locales, stale test expectations aligned.

## Remaining legacy (intentional, functional)

- `download.tsx` releases URL stays on `BuilderIO/agent-native` — the fork
  has 0 GitHub releases; desktop binaries only exist upstream. Switch when
  releases are published under studio-jami.
- `cdn.builder.io` media (template screenshots, demo video, markdown image
  maps) — working hosted media with no Jami replacements yet; re-host when
  new assets exist.
- Builder.io waitlist popover + its i18n copy — functional feature tied to
  the framework branch-waitlist route; replace with the Jami equivalent
  when that product path is decided.
- Vercel project display names (`jami.studio-marketing`, `jami-studio-docs`)
  — cosmetic.
- Dependabot: 17 vulnerabilities flagged on the default branch — separate
  triage unit.

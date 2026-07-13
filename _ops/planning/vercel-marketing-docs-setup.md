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

## Known follow-ups (deferred by owner decision)

- Content pass: natural docs link from the landing page; what marketing shows
  vs the docs app's own `_index` landing (unreachable from jami.studio by
  design).
- `www.jami.studio/sitemap.xml`, `/robots.txt`, `/llms.txt` are owned by the
  marketing root and not yet wired; docs' committed robots.txt references
  the sitemap at the canonical host. Decide during the content/rebrand pass
  whether these rewrite to the docs origin or marketing grows its own.
- jami.studio rebrand of legacy builder.io assets (root-level
  `agent-native-*.svg` etc.) — replaces, not rescued.
- Vercel project display names (`jami.studio-marketing`, `jami-studio-docs`)
  — cosmetic.

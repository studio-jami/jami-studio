# Vercel setup — marketing + docs (jami.studio)

> **ACTIVE CUTOVER (2026-07-14) — kill the legacy docs .vercel.app domain**
>
> Owner decision: the docs project must not be reachable at
> `https://jami-studio-docs.vercel.app` — no redirect, delete outright. The
> public canonical stays `https://www.jami.studio/docs`; the marketing
> fallback rewrite needs an origin host, which becomes
> `docs-origin.jami.studio` (proxy plumbing only; docs pages already emit
> `www.jami.studio` canonicals).
>
> Staged so far (this session):
>
> - `docs-origin.jami.studio` ADDED + verified on Vercel project
>   `jami-studio-docs` (`_ops/scripts/vercel-docs-origin-cutover.mjs`).
> - Cloudflare CNAME creation scripted
>   (`_ops/scripts/cf-docs-origin-dns.mjs`) but BLOCKED: the
>   `CLOUDFLARE_API_TOKEN` in agent-env.json has NO DNS read/write on the
>   `jami.studio` zone (403; zone id `8a87b2fcc38441f903c076e5891ee8ef`).
>
> Finish runbook (in order — do not reorder, live /docs depends on it):
>
> 1. **Owner (one manual step)**: EITHER grant the existing
>    `CLOUDFLARE_API_TOKEN` `Zone → DNS → Edit` on `jami.studio` and run
>    `node _ops/scripts/cf-docs-origin-dns.mjs`, OR add the record in the
>    CF dashboard: CNAME `docs-origin` → `cname.vercel-dns.com`,
>    proxy OFF (DNS-only/grey cloud).
> 2. Verify `https://docs-origin.jami.studio/docs` returns 200 (Vercel
>    issues the cert automatically once DNS resolves; give it a minute).
> 3. Flip `DOCS_ORIGIN` in `packages/marketing/next.config.mjs` to
>    `https://docs-origin.jami.studio`, commit + push (auto-deploys
>    marketing), verify `https://www.jami.studio/docs` 200 and a deep docs
>    page renders.
> 4. Delete the legacy domain — no redirect:
>    `node _ops/scripts/vercel-docs-origin-cutover.mjs --delete-legacy`,
>    then verify `https://jami-studio-docs.vercel.app` no longer serves
>    (DEPLOYMENT_NOT_FOUND / cert error is the expected end state).
> 5. Optional hardening (ONLY after step 4): enable Standard Protection on
>    the docs project so per-deployment `jami-studio-docs-*.vercel.app`
>    URLs are auth-gated too. Custom domains are unaffected — but never
>    enable this while the marketing proxy still targets a `.vercel.app`
>    host, or live `/docs` breaks.
> 6. Update the Topology section below to match (drop this banner).
>
> **Return-to TODO (web presence — separate from hummingbird dev work)**
>
> 1. [ ] **og-image deploy lane**: move the docs project off Vercel's
>        `react-router` framework preset to Nitro's Vercel preset (Build
>        Output API) so runtime `/_agent-native/*` routes exist — restores
>        per-page generated og images (currently 404; static default og
>        works). Details under "Remaining legacy" below.
> 2. [ ] **Releases URL**: publish desktop releases under
>        `studio-jami/jami-studio`, then flip `download.tsx` off
>        `BuilderIO/agent-native` (fork has 0 releases today).
> 3. [ ] **Media re-host**: replace `cdn.builder.io` media (template
>        screenshots, demo video, markdown image maps) with Jami-hosted
>        assets when new artwork exists.
> 4. [ ] **Waitlist popover**: replace the Builder.io branch-waitlist
>        feature + its i18n copy (11 locales) with the Jami equivalent once
>        that product path is decided.
> 5. [ ] **Brand asset set**: produce real Jami wordmark SVGs (light/dark,
>        horizontal + symbol); restore the brand page's horizontal-logo
>        entry and swap the header/favicon family off the embedded-PNG SVG.
> 6. [ ] **Marketing content pass**: replace v0 placeholder copy/images
>        (og-image.png, twitter-image.png are scaffold art).
> 7. [ ] **Dependabot triage**: 17 vulnerabilities (1 critical) on the
>        default branch — separate work unit.
> 8. [ ] Cosmetic: rename Vercel project display names.
>
> **Done (2026-07-13)**: jami.studio live — apex 308 → www canonical;
> marketing landing (Next.js, proper workspace member); docs at /docs plus
> ALL docs surfaces via fallback rewrite (sitemap/robots/llms.txt/apps/
> download/brand/legal/locales); Docs linked from landing nav+footer; docs
> rebranded (Jami mark+wordmark, legacy agent-native SVGs deleted, GitHub/
> JSON-LD/sitemap URLs → studio-jami, og default → jami.studio, 11-locale
> brand titles); metadataBase fixed; APP_URL set; all live-verified.

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

- **Generated og images 404** (pre-existing, found during verification):
  `/_agent-native/og-image.png` 404s on the docs origin itself — Vercel's
  `react-router` framework preset serves only the RR SSR bundle and ignores
  the Nitro `.output` server, so no runtime `/_agent-native/*` routes exist
  on this lane (they worked on the Netlify/nitro lane). Docs/template pages
  using per-page generated og images point at a 404; pages using the static
  default (`https://www.jami.studio/og-image.png`) are fine. Fix = deploy
  docs via Nitro's Vercel preset (Build Output API) instead of the RR
  framework preset — its own work unit against the live deploy.
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

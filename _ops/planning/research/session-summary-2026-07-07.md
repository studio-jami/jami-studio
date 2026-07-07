# Session Summary — Jami Studio Fork Reset & Decoupling Planning

**Date:** 2026-07-07
**Branch:** `main` (fork of `BuilderIO/agent-native`) · **Nothing committed** — all changes staged/local, reversible.
**Scope:** De-Builder cleanup + identity repoint + provider/deploy/observability planning + repo topology.
**Includes context from earlier (pre-compaction) turns.**

---

## 1. Context

New maintainer of a **Jami Studio fork** of the open-source `BuilderIO/agent-native` framework, in an
investigation → "reset to ready" phase. Working method throughout: **slow, reversible, understand
before changing; never touch anything that runs the apps.** Domain is fixed: **`jami.studio`**.

---

## 2. Executed changes (all uncommitted, reversible)

### 2a. Cloudflare deploy configs relocated (pre-compaction)
- 10 root `wrangler-*.toml` (Cloudflare Pages, stale/unreferenced alt deploy path) → **`deploy/cloudflare/`** via `git mv`.
- `.gitignore` comment updated to the new path.
- Established that **Netlify is the live host**; the wrangler set is an abandoned experiment.

### 2b. "Reset to ready" pass (Netlify + identity scrub + legacy archive)
- **Netlify machinery → `deploy/netlify/`**: `netlify-sites.json`, `sync-template-netlify-env.ts`,
  `guard-netlify-private-env.ts`, `netlify-ignore-build.mjs`, `build-retired-netlify-site.ts`,
  `neon-netlify-integration.md → deploy/netlify/docs/`, and the 4 Netlify workflows →
  `deploy/netlify/workflows/` (**disabling them by relocation** — intended "parked" state). All
  references repointed (package.json, 14 template `netlify.toml` ignore paths, `videos` builder path,
  moved-script `repoRoot`/import resolution, workflow sparse-checkout paths).
- **Identifiers scrubbed (no new values added):** GA `G-ESF7FYXGN9 → ""` across 10 Cloudflare configs,
  14 template `netlify.toml`, `packages/docs/app/root.tsx`, `sync-template-netlify-env.ts`, and the
  `guard-template-list.mjs` constant (guard stays green — both sides empty). 15 Netlify site IDs → `""`.
- **Layer E legacy → `_ops/legacy/`** (later moved by user to `_ops/planning/_legacy/`):
  `templates/.retired/`, `scripts/fusion-analytics-migration/`, `scripts/ensure-builder-orgs.ts`.
  Removed emptied `templates/.retired/*` glob from `pnpm-workspace.yaml`. **Kept** builder-starter sync
  + branding assets (to replace later).
- **Layer F finding:** the skill/agent "mirrors" are **one-way generators** (canonical source →
  committed copies, `--check` guards) — **no loop**, nothing to fix.

### 2c. Domain repoint — `agent-native.com → jami.studio` (620 files)
- One uniform `agent-native.com → jami.studio` sweep — **620 files** — repointed the whole hosted
  fleet, every per-app subdomain, `context-xray`, infra hosts, `.spec.ts` fixtures (`alice`/`app`/`a.b.c`),
  **and** the SSO security trust anchor `DEFAULT_ALLOWED_HOST_SUFFIXES → [".jami.studio"]` — all
  consistently (code + tests + comments moved together). **Excluded:** `CHANGELOG*`, `_ops/*`,
  `pnpm-lock.yaml`.
- `www.builder.io/* → www.jami.studio/*` (paths kept, no stub).
- **Left 🔴 `builder.io` runtime intact** (would break apps): `cdn.builder.io` (uploads),
  `api.builder.io` (search/gateway/voice), `builder.io/account|sdk|cli-auth|_agent-native` (billing/SDK/OAuth).
- Verified: 0 residual `agent-native.com`/`www.builder.io` outside history/ops; `jami.studio` in 671
  files; per-file type-checks clean on the security file + specs + skills sources.
- ⚠️ **Skill-mirror sync guards NOT run** — `node_modules` absent (fresh fork). Run
  `pnpm install && pnpm guards` (`guard:plan-skills`, `guard:workspace-skills`, `guard:plan-marketplace`)
  to confirm; consistency holds by construction (source + mirrors moved together).
- One tiny 🟢 identity fix: docs JSON-LD Organization `url: builder.io → jami.studio`.

---

## 3. Upstream URL map (`upstream-url-routing-map.md`)

Two families, ~4,000 refs across ~40 hosts:
- **`*.builder.io` = Builder's real infrastructure** → KEEP for now (runtime). Only self-identity/brand
  metadata is safe to change.
- **`*.agent-native.com` = our fleet** (one subdomain per app + infra) → repointed to `*.jami.studio`.
- Large share of both lived in `.spec.ts` fixtures — repointed with the code, kept consistent.

---

## 4. Directional leanings (NOT final — captured in `builder-io-coupling-audit.md` Layer B)

**Principle: agnostic adapters everywhere; Cloudflare initial (partner credit pools), portable always.**

- **LLM gateway:** don't rip out — keep the seam (`getBuilderGatewayBaseUrl`/`AIR_HOST`), swap the impl
  for **our own open-source, provider-agnostic model router**. BYOK keys feed it (`ANTHROPIC_API_KEY`,
  etc. already supported); token cost rides our subs. `api.*` LLM+voice is mostly **config**, not a rebuild.
- **Search:** **Algolia** initial (10k pool) behind the `BUILDER_WEB_SEARCH_BASE_URL` adapter — nuance:
  Algolia = index/app-content search vs the open-web seam; keep agnostic (Brave/Serper/Tavily for web).
- **Storage/CDN:** **Cloudflare R2 + Images + Stream** initial via `registerFileUploadProvider()`; keep
  **GCS + S3** first-class. `cdn.*` (upload provider + image-transform scheme + video worker) is the one
  **real build**.
- **Observability:** framework is already rich — env-activated tracking providers (PostHog/Amplitude/
  Mixpanel/Webhook) + agent observability (traces/evals/feedback, OTel export) + session replay + Sentry
  (desktop-wired). **Lean: run PostHog + Amplitude + Mixpanel + Sentry in parallel** (abundant credits,
  trivial `track()` fan-out) to trial each platform's AI/offerings; Sentry → promote to a core provider.
  Guardrail: data hygiene / sampling / no PII. Providers live in `packages/core`, never as app packages.
- **Plugins/marketplace:** Claude/Codex plugins (Plan, Design) = manifest + `.mcp.json` + skills, from
  `BUILT_IN_APP_SKILLS`. Standing up our own = high feasibility (config + rebrand); only real dependency
  is hosting the MCP endpoints. **No scaffolds yet.**
- **Deployment:** subdomains are the upstream **showcase** shape (independent apps + Dispatch SSO
  federation). Framework's recommended prod shape is **one origin, many apps** under path prefixes
  (free shared-login + cross-app A2A). **Lean: single-origin path-prefix** (one demo site); keep per-app
  deploy available. `packages/docs` = the www **landing + docs + template gallery**.
- **Frame/cloud:** `packages/frame` (embed shell) = reusable, **KEEP**. Builder.io "visual editing in
  production" cloud = Builder's SaaS → **REPLACE** (only tie-in is `builder-frame.ts` host-trust + the
  Connect CTA); use it as the reference to build our own cloud-frame later.
- **Payments:** no dedicated module; **Stripe** cataloged in `provider-api/index.ts`
  (`STRIPE_SECRET_KEY`, full API + OpenAPI). **Lean: Stripe-first** via `provider-api-request`; may grow
  into app-level checkout/webhooks/subscriptions later.

---

## 5. Repo & infrastructure shapes (`repo-and-infra-shapes.md` — shapes only, nothing executed)

- **Fork strategy:** de-fork to a **standalone `jami-studio`** + `upstream` remote + `upstream-sync`
  branch (isolation is a branch concern, not a repo one) — not a dev fork.
- **Topology:** `jami-studio` monorepo already covers framework + templates + docs + landing + registry;
  **`hummingbird`** = consumer product surface (built from published packages in a clean repo);
  **`intercal`** = purpose TBD. Registry = static files served from the www deploy, no special repo.
- **GitHub capability:** `gh` authed as **JamiStudio** (org `studio-jami`), admin + `delete_repo` scopes.
- **Sentry / PostHog:** **no tooling reachable** — deletions are manual (dashboard/API with your token).
- **Legacy consolidation → `studio-jami/legacy` — PENDING decision:** (A) mega-monorepo with `<name>-legacy/`
  subdirs (history via subtree) vs (B) transfer + rename separate repos. Repos: `oss, hummingbird,
  jami-harness, studio-ui, registry, local-evals, orchestra, collectiva`. Open: owner of the 8?
  archive vs delete sources? new `jami-studio` = empty scaffold vs de-forked framework copy?
- **New repos to create:** `jami-studio`, `hummingbird`, `intercal` (README + `.gitignore`).
- **Manual external cleanup lists** captured (Sentry ×5, PostHog ×6).

---

## 6. Env & credentials model (advisory — no note stored per request)

- **App runtime keys** (`DATABASE_URL`, `ANTHROPIC_API_KEY`, provider keys) → per-template
  `templates/<app>/.env` (copy `.env.example`; gitignored + guarded). Root-inheriting `.env` only exists
  in a **generated workspace** (scaffold at `workspace-root/.env.example`) — i.e. `hummingbird`, not this
  monorepo. Per-user/org keys can also use the app **Settings UI → encrypted SQL vault**.
- **Account/CLI/deploy creds (Cloudflare, npm, gh) are NOT app `.env`:** `gh auth` (keyring, done),
  `npm login` (`~/.npmrc`), `wrangler login` / `CLOUDFLARE_API_TOKEN`; CI → GitHub Actions secrets.

---

## 7. Doc organization (`_ops/`)

Canonical working docs now under **`_ops/planning/research/`**:
- `builder-io-coupling-audit.md` — the master audit + all leanings (providers, observability, plugins,
  deploy, frame, payments).
- `upstream-url-routing-map.md` — the URL map + executed-repoint banner.
- `repo-and-infra-shapes.md` — fork/topology/legacy/cleanup shapes.
- `session-summary-2026-07-07.md` — this file.

Consolidated a diverged duplicate (removed stale root `_ops/builder-io-coupling-audit.md`; the
`planning/research/` copy is current at 331 lines). Legacy archive under `_ops/planning/_legacy/`;
branding at `_ops/admin/marketing/branding-outline.md`. **Edit the `planning/research/` copies going forward.**

---

## 8. Findings & caveats

- The "Jami Studio" rename was **half-done upstream** (docs render "Jami Studio" but identity still
  pointed at builder.io/agent-native.com) — this session finished the `agent-native.com → jami.studio`
  half and left `builder.io` runtime intact deliberately.
- Netlify (not Cloudflare) was the real host; wrangler set was stale.
- SSO trust anchor (`DEFAULT_ALLOWED_HOST_SUFFIXES`) is a real security dependency of the fleet domain —
  it moved with the repoint (not a cosmetic swap).
- `neon-preview-branches.yml` + `keep-neon-warm.yml` left in `.github/workflows` (Neon, flagged).

---

## 9. Open decisions / next steps (nothing forced)

1. **Commit** the staged reset + repoint (620+ files), or keep reviewing `git diff`.
2. Run `pnpm install && pnpm guards` to confirm skill-mirror consistency.
3. **Legacy consolidation** shape (A vs B) + owner/archive answers before any GitHub action.
4. New-`jami-studio` intent (empty scaffold vs de-forked framework copy).
5. Provider decoupling execution order (leanings → build): api.* config first, cdn.* the real build.
6. Manual Sentry/PostHog project deletions (lists in `repo-and-infra-shapes.md`).

> Everything in this session is **staged and reversible; nothing committed, nothing executed on
> GitHub/Sentry/PostHog.** Product decisions remain **leanings, not final.**

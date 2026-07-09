# Builder.io Coupling Audit — Jami Studio Fork

> **Reset pass 1 — executed 2026-07-07** (git mv, nothing committed). Decisions applied:
>
> - **Netlify machinery → `deploy/netlify/`** — `netlify-sites.json`, `sync-template-netlify-env.ts`,
>   `guard-netlify-private-env.ts`, `netlify-ignore-build.mjs`, `build-retired-netlify-site.ts`,
>   `neon-netlify-integration.md → deploy/netlify/docs/`. The 4 Netlify workflows moved to
>   `deploy/netlify/workflows/` (**this disables them** — they only run under `.github/workflows/`;
>   intended "parked / ready" state). All references repointed (package.json, 14 template
>   `netlify.toml` `ignore` paths, `videos` builder path, moved-script `repoRoot`/import paths,
>   workflow sparse-checkout paths). Mechanism kept; only relocated.
> - **Identifiers scrubbed (no new values added):** GA `G-ESF7FYXGN9 → ""` in all 10
>   `deploy/cloudflare/wrangler-*.toml`, 14 template `netlify.toml`, `packages/docs/app/root.tsx`,
>   `sync-template-netlify-env.ts`, and the `guard-template-list.mjs` constant (guard stays green —
>   both sides now empty). 15 Netlify site IDs in `netlify-sites.json → ""`.
> - **Layer E legacy → `_ops/legacy/`:** `templates/.retired/` → `_ops/legacy/retired/`,
>   `scripts/fusion-analytics-migration/`, `scripts/ensure-builder-orgs.ts`. Removed the emptied
>   `templates/.retired/*` glob from `pnpm-workspace.yaml`. **Kept** builder-starter sync + branding
>   assets (to be replaced later, not removed).
> - **Layer B / C / D:** untouched by request — no provider deletions, no `*.agent-native.com` URL
>   changes yet (kept for route mapping; `jami.studio` repoint later), publishing flow preserved.
> - **Layer F:** the skill/agent "mirrors" are **one-way generators** (canonical source →
>   committed copies) validated by `--check` guards — **no loop**; nothing to fix. Whittling skills
>   later = edit the source list + re-run `sync:*`.
> - **Left in place, flagged:** `neon-preview-branches.yml` + `keep-neon-warm.yml` (Neon, not
>   "netlify"-named); archived retired `package.json` build refs (won't build); a comment in
>   `packages/core/src/cli/create.ts:1838`. Disabled workflows still carry `NETLIFY_*` secret names /
>   account assumptions — reactivation needs our own account + secrets.

**Date:** 2026-07-07
**Scope:** Identify every Builder.io-specific / upstream-hosted surface that is a candidate for
**assume**, **supplement**, **replace**, or **remove**, without touching anything that runs the apps.
**Status:** AUDIT ONLY — no files moved or changed (beyond the earlier `deploy/cloudflare/` wrangler move).

---

## Guiding frame (from the brief)

We are dropping in and assuming **most** of Builder.io's role. For each coupled surface, in
preference order:

1. **Assume** — take over the role ourselves and reap the rewards (become the provider/host).
2. **Supplement** — keep using the capability but on *our* preferred provider, or run it ourselves.
3. **Replace / Remove** — only when neither assume nor supplement is worth it or feasible.

Hard rule: **keep everything that runs the apps.** Where a Builder dependency is a *default
provider* behind a pluggable interface, the fix is *configuration* (point at our provider), **not**
code deletion. Deletion is reserved for dead artifacts, one-time migrations, and legacy bins.

Disposition legend used below:
`ASSUME` · `SUPPLEMENT` · `REPLACE` · `REMOVE/ARCHIVE` · `KEEP (config only)` · `KEEP (runtime)`

---

## TL;DR — the shape of the coupling

There are **six** distinct layers of Builder.io / upstream coupling. Only two of them
("runtime provider integrations" and "the templates themselves") actually run apps — and those
should be **supplemented via config**, never deleted. The other four are hosting, publishing,
hosted-fleet endpoints, and internal/legacy tooling — all safe to assume, repoint, or bin.

| Layer | Runs apps? | Preferred disposition | Rough size |
|---|---|---|---|
| A. Hosting / deploy artifacts (Netlify, Cloudflare, GA) | No (deploy-time) | SUPPLEMENT / ASSUME | ~14 netlify.toml + CI + 10 wrangler + GA id |
| B. Runtime provider integrations (uploads, search, gateway, Connect) | **Yes** | **SUPPLEMENT (config)** | ~12 source areas in `packages/core` |
| C. Hosted fleet endpoints (`*.agent-native.com`) | No | SUPPLEMENT / ASSUME | ~100+ string refs |
| D. Publishing / release / distribution (npm, marketplace, registry) | No | ASSUME or neutralize | changesets + ~6 workflows |
| E. Internal / scratch / legacy bin | No | REMOVE/ARCHIVE | retired templates + fusion + builder-org scripts |
| F. Agent-client plugin mirrors | No | KEEP (rebrand later) | `.agents` / `.claude` / `.gemini` / plugins |

---

## Layer A — Hosting / deploy artifacts

The live hosted fleet runs on **Netlify** (primary) with a stale **Cloudflare Pages** alt path
(already relocated to `deploy/cloudflare/`). All of it carries upstream identity (site IDs, GA).

### A1. Netlify (LIVE deploy path)
- `templates/*/netlify.toml` — ~14 per-app deploy configs (real build commands). **Runs the hosted
  deploy, not the app itself.**
- [scripts/netlify-sites.json](scripts/netlify-sites.json) — **15 Netlify site IDs belonging to BuilderIO's org.**
- [scripts/sync-template-netlify-env.ts](scripts/sync-template-netlify-env.ts), [scripts/guard-netlify-private-env.ts](scripts/guard-netlify-private-env.ts), [scripts/netlify-ignore-build.mjs](scripts/netlify-ignore-build.mjs)
- CI: [.github/workflows/cancel-active-netlify-previews.yml](.github/workflows/cancel-active-netlify-previews.yml), [cancel-stale-netlify-main-deploys.yml](.github/workflows/cancel-stale-netlify-main-deploys.yml), [cancel-stale-netlify-previews.yml](.github/workflows/cancel-stale-netlify-previews.yml), [promote-netlify-deploy.yml](.github/workflows/promote-netlify-deploy.yml), [neon-preview-branches.yml](.github/workflows/neon-preview-branches.yml), [keep-neon-warm.yml](.github/workflows/keep-neon-warm.yml)
- Docs: [docs/neon-netlify-integration.md](docs/neon-netlify-integration.md)

**Disposition: SUPPLEMENT (host on our provider) or ASSUME (own the deploy fleet).**
These do not run the apps — they *ship* them. Decouple by (a) creating our own site IDs / project
on our chosen host, (b) repointing `netlify-sites.json` + CI secrets, or (c) swapping the Nitro
preset. Keep the *mechanism*; replace the *account/identity*.

### A2. Cloudflare Pages (stale alt path — already relocated)
- `deploy/cloudflare/wrangler-*.toml` (10 files) — inactive; not referenced by any code/CI.
- **Decision pending** from prior thread: keep as our Cloudflare recipe, rebrand `an-*` names, or drop.

### A3. Google Analytics (upstream property — SCRUB)
- `GA_MEASUREMENT_ID = "G-ESF7FYXGN9"` appears in all 10 `deploy/cloudflare/wrangler-*.toml`, in
  `templates/*/netlify.toml` build env, and docs. **This is BuilderIO's GA property.**

**Disposition: REPLACE** with our own measurement ID (or remove until we have one). Any real deploy
as-is would report our traffic into the upstream's analytics. High-priority scrub before first deploy.

---

## Layer B — Runtime provider integrations (THESE RUN APPS — supplement, do not delete)

These are pluggable default providers wired to Builder's cloud. The framework already exposes
registration hooks, so the correct action is **config/registration**, not code removal.

| Surface | Files | What it does | Disposition |
|---|---|---|---|
| **File uploads** | [packages/core/src/file-upload/builder.ts](packages/core/src/file-upload/builder.ts), [registry.ts](packages/core/src/file-upload/registry.ts), [types.ts](packages/core/src/file-upload/types.ts), [actions/upload-image.ts](packages/core/src/file-upload/actions/upload-image.ts) | Defaults to `builder.io` / `cdn.builder.io` CDN; falls back to built-in Builder provider | **SUPPLEMENT** — register S3 / R2 / GCS via `registerFileUploadProvider()`. Or **ASSUME** (our own CDN). Keep the interface. |
| **Web search tool** | [packages/core/src/extensions/web-search-tool.ts](packages/core/src/extensions/web-search-tool.ts) | Hits `api.builder.io/agent-native/web-search/v1` | **SUPPLEMENT** — point at our search backend/key, or **ASSUME**. |
| **LLM gateway + billing/upgrade** | [packages/core/src/agent/engine/builder-engine.ts](packages/core/src/agent/engine/builder-engine.ts), [client/AgentPanel.tsx](packages/core/src/client/AgentPanel.tsx), `run-manager` upgrade URLs → `builder.io/account/subscription|billing` | "Builder.io Gateway" model group + credit/upgrade CTAs | **ASSUME** (be the gateway) or **SUPPLEMENT** (our provider keys, hide upstream billing CTAs). |
| **Builder Connect (OAuth)** | [packages/code-agents-ui/src/CodeAgentsApp.tsx](packages/code-agents-ui/src/CodeAgentsApp.tsx), [core/src/client/builder-frame.ts](packages/core/src/client/builder-frame.ts), [transcription/BuilderTranscriptionCta.tsx](packages/core/src/client/transcription/BuilderTranscriptionCta.tsx) | "Connect Builder.io" flow, ancestor-origin trust for `builder.io`, transcription CTA | **SUPPLEMENT/REPLACE** — repoint Connect to our account system, or drop the CTA if we assume the role. |
| **A2A hosted host** | [packages/core/src/a2a/*](packages/core/src/a2a/) (`agent-workspace.builder.io` in specs/defaults) | Default hosted A2A host in tests/defaults | **SUPPLEMENT** — default to our host; keep protocol. |
| **Branding mark** | [packages/core/src/client/builder-mark.tsx](packages/core/src/client/builder-mark.tsx), [scripts/build-branding-assets.mjs](scripts/build-branding-assets.mjs) | Builder "B" monogram | **REPLACE** with Jami Studio branding. |

**Net:** none of Layer B should be deleted — every item is on a provider interface. The work is
"point at ours / assume the role," which is largely env + registration + a few CTA/branding swaps.

### Provider decoupling direction — leanings, NOT final (2026-07-07)

**Guiding principle: agnostic adapters everywhere.** Cloudflare is the **initial** target (we have
partner credit pools — incl. a 10k search pool), but every provider stays behind a portable interface
so we can slot GCS / S3 / Algolia / etc. per project. Cloudflare-first, portable-always.

- **LLM gateway — keep the layer, swap the impl (do NOT rip out wholesale).** Replace Builder's
  gateway with **our own open-source, provider-agnostic model router/gateway** occupying the *same*
  seam (`getBuilderGatewayBaseUrl` / `BUILDER_PROXY_ORIGIN` / `AIR_HOST` in
  [credential-provider.ts](packages/core/src/server/credential-provider.ts), consumed by
  [builder-engine.ts](packages/core/src/agent/engine/builder-engine.ts)). BYOK keys feed the router;
  token cost/billing rides our own provider subs (no gateway margin). Preserves streaming, model-group
  selection, and the engine contract — we change the *implementation behind the seam*, not the layer.
- **Web search — Algolia as initial target (10k pool), behind an agnostic adapter** at the
  `BUILDER_WEB_SEARCH_BASE_URL` seam ([web-search-tool.ts](packages/core/src/extensions/web-search-tool.ts)).
  ⚠️ **Nuance to resolve:** Algolia is **index-based app/content search over our own data**, whereas
  the Builder seam is **open-web** search for the agent. So Algolia slots cleanly for in-app / content
  search; the agent's open-web tool may still want a web-search API (Brave / Serper / Tavily). Keep
  the adapter agnostic so either — or both — plug in.
- **Storage / CDN — Cloudflare initial, GCS/S3 first-class for portability.** Implement the
  `registerFileUploadProvider()` interface with **Cloudflare R2 + Images + Stream** as the initial
  target, but keep **GCS** (and S3) adapters as first-class — we'll build some products on this system
  that use GCS. Match existing contracts: small direct upload + signed-URL large/video, the
  `?format=webp&width=` transform scheme, and the Clips media-worker callback.
- **Effort calibration:** `api.*` (LLM + voice) is mostly config — BYOK keys already exist
  (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`; BYOK Gemini for voice), so decoupling is
  supply-keys + our router at the seam. Web search = one adapter. `cdn.*` (R2/Images/Stream provider +
  transform scheme + video worker) is the one real build. All incremental, per-service, per-app.

> Status: leanings only, nothing in stone. Cloudflare-first, agnostic-always; revisit per project.

### Observability / telemetry direction — leanings, NOT final (2026-07-07)

**Audit finding — the framework is observability-RICH; GA is the smallest slice.** Already shipping:
- **Pluggable server-side tracking** ([packages/core/src/tracking/providers.ts](packages/core/src/tracking/providers.ts)) — one `track()`/`identify()` call fans out to **every** registered provider. Built-in, **env-activated, raw HTTP (no SDK deps)**: PostHog (`POSTHOG_API_KEY`), Amplitude (`AMPLITUDE_API_KEY`), Mixpanel (`MIXPANEL_TOKEN`), Webhook (`TRACKING_WEBHOOK_URL`), + first-party Agent Native Analytics (`AGENT_NATIVE_ANALYTICS_PUBLIC_KEY` → `analytics.jami.studio/track`).
- **First-party product analytics** — pageviews, `anonymousId`/`sessionId` identity, first-touch referral/viral attribution, signup enrichment → `analytics_events` SQL (the `analytics` template is its dashboard).
- **Agent observability** ([packages/core/src/observability/traces.ts](packages/core/src/observability/traces.ts)) — auto traces (agent_run / llm_call / tool_call w/ tokens+cost), LLM-as-judge evals, feedback (thumbs + Frustration Index), experiments. SQL-first, optional OTel / Langfuse / Datadog export.
- **Session replay** (`VITE_AGENT_NATIVE_SESSION_REPLAY_*`).
- **Sentry** — dep present (`@sentry/browser|node|electron`), wired for **desktop** (Tauri/Electron); web/server not wired by default.

**Direction (leaning): run ALL of PostHog + Amplitude + Mixpanel + Sentry in parallel.**
- We hold large partner credit pools across all four. The tracking registry fans one event out to every provider, so running them simultaneously is trivial — and lets us **exercise each platform's built-in AI + differing analysis offerings side-by-side**. Combined credits are effectively impossible to exhaust.
- Product events (PostHog / Amplitude / Mixpanel) = **env-activate, zero code** — every provider receives every `track()`.
- Sentry (errors/perf) = a *different* concern from product events; promote to a first-class core provider/init (server plugin + client root) alongside the existing desktop wiring.
- PostHog can double as **session replay + feature flags + experiments** — use it to consolidate/compare those layers.

**Guardrail — data hygiene despite abundant credits:** credits are plentiful but ingestion volume, plan quotas, and signal-to-noise are not free. Keep event schemas tight, dedupe (pageviews already do), **sample** high-frequency / agent-trace events, honor the built-in localhost/dev suppression, and keep PII out of properties. "Take advantage" ≠ firehose everything.

**Where it lives (literally):** all providers register in `packages/core/src/tracking/providers.ts` behind the `track()` seam (or `registerTrackingProvider()` for custom). A larger standalone system → a publishable `packages/<name>`; app-specific events → per-template `track()` calls. **Never a new "app" package** — same agnostic-adapter shape as gateway / search / storage.

> Status: leaning "all four in parallel to trial their AI/offerings," data-hygiene-guarded; not final.

### Plugin / marketplace direction — leaning, NOT final (2026-07-07)

**What ships:** Claude Code plugins (+ Codex mirror) via the in-repo marketplace
[.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) — **Plan** + **Design**. Each plugin =
`plugin.json` (manifest) + `.mcp.json` (HTTP MCP → `*.jami.studio/_agent-native/mcp`) + `skills/`,
generated from `BUILT_IN_APP_SKILLS` by the sync scripts. "App-backed skills" = knowledge + live MCP
tools + a marketplace entry.

**Leaning: stand up our own — high feasibility (config + rebrand, we control the whole pattern).**
- Own **plugins**: add a plugin dir (or a `BUILT_IN_APP_SKILLS` entry + sync); every app already exposes
  `/_agent-native/mcp`, so it's plugin-ready by default.
- Own **marketplace**: host our own `marketplace.json` (`claude plugin marketplace add jami.studio/…`) —
  this is how we own distribution.
- Only real dependency: **hosting the MCP endpoints** = the fleet-hosting decision, not a plugin problem.
- Cosmetic follow-ups: `author: "Agent-Native"` + `repository: BuilderIO/agent-native` still in manifests.
  Format is Anthropic's spec (MIT here); we author within it. **No scaffolds yet.**
### Deployment / frame / payments direction — leanings, NOT final (2026-07-07)

**Deployment shape — collapse the subdomain demo fleet to ONE origin.**
- The per-app subdomains (`*.jami.studio`) are the upstream **showcase** shape — each template an
  independent standalone deploy, federated via Dispatch SSO. The framework's recommended prod shape is
  the opposite: `npx @agent-native/core deploy` = **one origin, many apps** under path prefixes
  (`your-agents.com/mail/*`) → **same-origin shared login + zero-config cross-app A2A** (no CORS/JWT
  between siblings). **Lean: adopt single-origin path-prefix** for our fleet; keep per-app independent
  deploy available. Staying out of naming/slug weeds for now.
- `packages/docs` is the www **landing + docs + template gallery** (our main slug). Consumers deploy
  their own products from the **published packages** into clean repos — they don't fork this monorepo.

**Frame / cloud — keep the shell, REPLACE the cloud.**
- `packages/frame` (`@agent-native/frame` — the embeddable agent-panel + app-iframe shell) =
  **reusable, ours → KEEP.** Generic protocol in `frame.ts`.
- Builder.io "visual editing in production" cloud = Builder's hosted SaaS → **REPLACE.** The only tie-in
  is [builder-frame.ts](packages/core/src/client/builder-frame.ts) (ancestor-origin trust for
  `builder.io`/`builder.my`) + the "Connect Builder.io" CTA — decouple those, and use the cloud as the
  **reference** to stand up our own cloud-frame later (host the frame + agent w/ fs access + commit-back;
  the shell is already ours).

**Payments — Stripe via the provider-API substrate.**
- No dedicated payments module today; **Stripe is already cataloged** in
  [provider-api/index.ts](packages/core/src/provider-api/index.ts) (`STRIPE_SECRET_KEY`, full API +
  OpenAPI spec). **Lean: aim Stripe**, called through `provider-api-request`; may grow into a fuller
  app-level payments feature (checkout / webhooks / subscriptions) on top of that seam later.

> Status: leanings — single-origin deploy, REPLACE Builder cloud (keep frame shell), Stripe-first payments.
---

## Layer C — Hosted fleet endpoints (`*.agent-native.com`)

Upstream's demo/production fleet URLs are baked as **hosted defaults** across skills, plugin MCP
manifests, docs, and dispatch fallbacks:

- Plugin MCP defaults: [.agents/plugins/agent-native-visual-plans/.mcp.json](.agents/plugins/agent-native-visual-plans/.mcp.json) → `plan.agent-native.com`; [agent-native-design/.mcp.json](.agents/plugins/agent-native-design/.mcp.json) → `design.agent-native.com`
- Marketplace/plugin authorship: [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json), `*/plugin.json` (author "Agent-Native", homepage `agent-native.com`)
- Dispatch fallback URLs: `forms.agent-native.com`, etc. (see `packages/dispatch` catch-all)
- Docs site: [packages/docs/app/root.tsx](packages/docs/app/root.tsx), `seo.ts` → `www.agent-native.com`; per-template demo links in `packages/docs/app/routes/templates.*.tsx`; [TemplateCard.tsx](packages/docs/app/components/TemplateCard.tsx)
- CI defaults: `pr-visual-recap*.yml` → `PLAN_RECAP_APP_URL` default `plan.agent-native.com`
- Analytics endpoint default: `analytics.agent-native.com/track` (tracking skill)

**Disposition: SUPPLEMENT (repoint to our domains) or ASSUME (stand up our own fleet).**
Not app-runtime — these are endpoint defaults. Rebrand target once our domains exist. Note: the docs
already display the product name as **"Jami Studio"** while URLs still point to `builder.io` /
`agent-native.com` — the rename is half-done and worth finishing as one coordinated pass.

---

## Layer D — Publishing / release / distribution

Machinery for publishing packages/plugins under the **upstream npm org + marketplace + registry**:

- Changesets: `.changeset/`, [scripts/changeset-publish-sequential.ts](scripts/changeset-publish-sequential.ts), [check-changeset.mjs](scripts/check-changeset.mjs), CI [changeset-check.yml](.github/workflows/changeset-check.yml), [auto-publish.yml](.github/workflows/auto-publish.yml), [auto-merge-version-packages.yml](.github/workflows/auto-merge-version-packages.yml)
- Public-package gate: [scripts/guard-public-packages.ts](scripts/guard-public-packages.ts)
- Plugin marketplace + skills sync: [scripts/sync-plan-marketplace.ts](scripts/sync-plan-marketplace.ts), [sync-plan-skills.ts](scripts/sync-plan-skills.ts), CI [sync-public-skills.yml](.github/workflows/sync-public-skills.yml)
- Registry (shadcn): [registry.json](registry.json) — `homepage: github.com/BuilderIO/agent-native`, titled "Jami Studio Conventions" (again half-renamed)

**Disposition:**
- If we **will publish our own** packages/plugins → **ASSUME**: repoint npm org (`@agent-native/*`),
  marketplace URL, registry homepage, and the sync targets to ours.
- If we **won't publish upstream** → **neutralize** (disable auto-publish workflows) and treat the
  changeset flow as internal-only. Do not delete the changeset mechanism if we version anything.

---

## Layer E — Internal / scratch / legacy bin (REMOVE / ARCHIVE candidates)

These are the clearest "doesn't fit our project — where does it go" items. **Recommend a top-level
`_ops/legacy-bin/` (or delete once confirmed unused).**

- **`templates/.retired/`** — already an upstream legacy bin: `issues/`, `meeting-notes/`,
  `recruiting/`, `scheduling/`, `voice/`. Each builds via
  [scripts/build-retired-netlify-site.ts](scripts/build-retired-netlify-site.ts). → **REMOVE/ARCHIVE** unless we intend to revive any.
- **`scripts/fusion-analytics-migration/`** — one-time migration for Builder's **Fusion** product
  (`manual-*-extensions.ts`, `migrate-content.ts`, `verify-extensions.ts`). → **REMOVE/ARCHIVE** (dead one-shot).
- **`scripts/ensure-builder-orgs.ts`** — provisions **Builder orgs**. → **REMOVE/ARCHIVE** (upstream-account-specific).
- **`scripts/sync-builder-starter-manifest.ts`** + [.github/workflows/sync-builder-starter.yml](.github/workflows/sync-builder-starter.yml)
  + [packages/core/src/cli/sync-builder-starter-manifest.ts](packages/core/src/cli/sync-builder-starter-manifest.ts) — syncs the **Builder starter** manifest. → **REPLACE** (our starter) or **REMOVE**.
- **`scripts/build-branding-assets.mjs`** — Builder branding pipeline. → **REPLACE** with ours.
- **Root scratch:** `PORT-GUIDE-design-followups.md`, `.video-bakeoff/` (gitignored), plus gitignored
  internal notes `RAMBLINGS.md`, `FUSION-APPS.md`, `.builder/plans/`, `**/.builder-writing/`. →
  **REMOVE/ARCHIVE** (already non-tracked or scratch).

> ⚠️ Before removing E items, confirm none are referenced by a workflow we intend to keep
> (e.g. `sync-builder-starter.yml` triggers `sync-builder-starter-manifest.ts`). Removing the script
> means also removing/neutralizing its workflow.

---

## Layer F — Agent-client plugin mirrors (keep; rebrand later)

Not Builder-runtime, but Builder/AgentNative-branded and heavily duplicated:

- `.agents/`, `.claude/`, `.gemini/`, `.claude-plugin/`, and per-plugin `.codex-plugin/` /
  `.claude-plugin/` — mirrored skill trees + MCP manifests that point at `*.agent-native.com`.
- Also mirrored *inside* templates (`templates/*/.agents/skills/**`, `templates/*/.claude/skills/**`)
  and `packages/core/src/templates/workspace-core/.{agents,claude}/…`.

**Disposition: KEEP (runtime for our own agent tooling)**, but they are a **rebrand + de-dup**
target. The same skill files exist in many mirrors kept in sync by
[scripts/sync-workspace-core-skills.ts](scripts/sync-workspace-core-skills.ts) /
[sync-plan-skills.ts](scripts/sync-plan-skills.ts). Repoint plugin MCP URLs (Layer C) and authorship
(Layer D) when we finish the rename.

---

## Explicitly KEEP (runs the apps — do NOT touch in cleanup)

- `packages/core/**` framework runtime (agent engine, A2A, actions, db, file-upload *interface*,
  server plugins) — the Builder bits inside are *default providers*, handled in Layer B by config.
- `packages/dispatch`, `packages/scheduling`, `packages/pinpoint`, `packages/toolkit`,
  `packages/frame`, `packages/embedding`, `packages/shared-app-config`, `packages/mobile-app`,
  `packages/desktop-app`, `packages/vscode-extension`, `packages/code-agents-ui`.
- `templates/*` (the live apps) themselves — only their `netlify.toml`/GA env are Layer A/A3.
- All guard scripts that enforce architecture (`guard-*`) — keep; they protect the app contract.

---

## Recommended sequencing (slow, reversible)

1. **A3 GA scrub** — replace/remove `G-ESF7FYXGN9` everywhere. (Lowest risk, highest hygiene.)
2. **E legacy bin** — move `templates/.retired/`, `fusion-analytics-migration/`,
   `ensure-builder-orgs.ts`, builder-starter sync into `_ops/legacy-bin/` (and neutralize their
   workflows). Reversible, removes the most obvious upstream-only cruft.
3. **C endpoint repoint** — once our domains exist, sweep `*.agent-native.com` → ours and finish the
   "Jami Studio" rename (docs already half-renamed).
4. **A1/A2 hosting decision** — assume vs supplement the deploy fleet; repoint site IDs / preset.
5. **B provider config** — register our upload/search/gateway providers; swap `builder-mark`.
6. **D publishing decision** — assume the npm org/marketplace/registry, or neutralize auto-publish.

Each step is independently shippable and reversible. No step deletes anything that runs an app.

---

## Open questions for you

- **Hosting:** assume the fleet ourselves, or supplement on our own Netlify/Cloudflare/other account?
- **Publishing:** will we publish `@jami-*` (or keep `@agent-native`) packages, or go internal-only?
- **Domains:** what domain(s) replace `*.agent-native.com` so Layer C can be repointed in one pass?
- **Retired templates:** archive to `_ops/legacy-bin/` or hard-delete?
- **Rename scope:** finish "Builder.io / Agent-Native → Jami Studio" as one coordinated pass, or
  drip it per layer?

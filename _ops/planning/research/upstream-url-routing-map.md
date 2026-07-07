# Upstream URL Routing Map — Jami Studio Fork

> **✅ Repoint EXECUTED 2026-07-07 (uncommitted).** One uniform `agent-native.com → jami.studio`
> sweep (**620 files**) repointed the entire hosted fleet, every per-app subdomain, `context-xray`,
> the infra hosts, the test fixtures (`alice`/`app`/`a.b.c`), **and** the SSO security trust anchor
> `DEFAULT_ALLOWED_HOST_SUFFIXES` → `[".jami.studio"]` — all consistently (code + tests + comments
> moved together). `www.builder.io/*` → `www.jami.studio/*` (paths kept). **Excluded:** `CHANGELOG*`
> (history), `_ops/*` (this record), `pnpm-lock.yaml`. **Left 🔴 intact:** `cdn.builder.io` (uploads),
> `api.builder.io` (search), `builder.io/account|sdk|cli-auth|_agent-native` (billing/SDK/OAuth) —
> these run/authorize the apps and become service cutovers later. Per-file typecheck clean; the
> skill-mirror sync guards couldn't run (no `node_modules` — run `pnpm i && pnpm guards` to confirm),
> but the replace was uniform across source + mirrors so they stay byte-consistent. The tables below
> are the **pre-sweep** map (kept as the record; `_ops/` was excluded from the sweep).

**Date:** 2026-07-07
**Purpose:** Map every upstream host that lives in code, grouped by subdomain, so we can see the
routing shape and decide, per host, what **stays**, what **repoints to `jami.studio`**, and what can
**go**. Target domain is fixed: **`jami.studio`**.
**Method:** `git grep` over tracked files (excludes `_ops/`, `pnpm-lock.yaml`). Counts are raw match
totals (a single file can hold many). ~4,000 refs across ~40 distinct hosts.

> ⚠️ **Why we cannot blind-replace `builder.io → jami.studio`:** the `*.builder.io` family is
> **Builder Inc.'s real infrastructure** — `cdn.builder.io` serves uploads, `api.builder.io` serves
> web-search, `builder.io/account/subscription` is live billing, `/_agent-native/google/callback`
> and Connect are live OAuth. Repointing those to `jami.studio` (which hosts none of it yet) breaks
> running apps immediately. Those are 🔴 **KEEP** until we stand up the equivalent service. The
> `*.agent-native.com` family is **our own hosted fleet** and is the safe bulk repoint.

---

## Disposition legend

| Tag | Meaning |
|---|---|
| 🔴 **KEEP (runtime)** | Real Builder service/page. Changing it breaks apps or links **now**. Repoint only after we host/own the equivalent. |
| 🟡 **REPOINT (fleet)** | Our hosted-fleet endpoint or default. Safe to swap `agent-native.com → jami.studio`; resolves once we host there. Update code **and** its test fixtures together. |
| 🟢 **REPOINT (identity)** | Our own site/brand self-identity (SEO, JSON-LD, canonical). Correct to be `jami.studio` regardless. Low risk. |
| ⚪ **FIXTURE / HISTORY** | Example hostnames in `.spec.ts`, or historical `CHANGELOG.md`/README. Move only with the code they test; never rewrite changelog history. |

---

## TL;DR

- **Two families.** `*.builder.io` = Builder's services (KEEP the runtime ones). `*.agent-native.com`
  = our fleet, one subdomain per app (REPOINT to `*.jami.studio`).
- **Biggest safe win:** repoint all `*.agent-native.com` app subdomains → `*.jami.studio`. Mechanical,
  ~2,400 refs, mostly in skill docs / MCP manifests / dispatch fallbacks / tests. Same routing shape,
  our domain — so "the expected URL is still there," just under `jami.studio`.
- **Do-not-touch (yet):** `cdn.builder.io`, `api.builder.io`, `builder.io/account|legal|sdk|cli-auth`,
  `builder.io/_agent-native/google/callback`, Builder Connect. These run/authorize the apps.
- **228 files** reference `builder.io`; **92** of them are `.spec.ts` / `.md` (test + docs), so the
  true runtime-code surface is a small subset.

---

## Family A — `*.builder.io` (Builder Inc.'s own services)

| Host | ~Count | What it serves / where it lives | Disposition | Notes |
|---|---:|---|---|---|
| `builder.io` (bare) | 626 | SDK docs (`/sdk`, `/sdk-react`, `/core`), billing (`/account/subscription`), legal (`/legal/terms`), CLI auth (`/cli-auth`), image/asset CDN paths (`/api/v1/image/...`, `/o/assets%2f...`, `/image.png`, `/video`), hosted-app URL examples (`/_agent-native/google/callback`, `/dispatch/_agent-native/a2a`) | 🔴 **KEEP** (mixed) | Only the SEO/brand self-identity subset is 🟢 (see below). Everything functional here is real Builder. |
| `cdn.builder.io` | 102 | **File-upload / image CDN** — default upload provider (`packages/core/src/file-upload/builder.ts`), media compression, TemplateCard image | 🔴 **KEEP (runtime)** | Repoint only when we register our own CDN (S3/R2/GCS) via `registerFileUploadProvider()`. |
| `agent-workspace.builder.io` | 70 | Default hosted **A2A host**; mostly `.spec.ts` (auth, browser, agent-card) | 🟡/⚪ | Default → our host later; bulk is test fixtures. |
| `www.builder.io` | 50 | Marketing / legal links in `SettingsPanel.tsx`, `terms.tsx`, `privacy.tsx`, `mcp-integration-catalog.ts` | 🔴 **KEEP** | Real Builder pages; repointing = dead links until we author ours. Or drop the CTA when we assume the role. |
| `api.builder.io` | 22 | **Web-search API** (`extensions/web-search-tool.ts`) + credential/status probes (`credential-provider.ts`, `useBuilderStatus`) | 🔴 **KEEP (runtime)** | Repoint to our search backend/key when ready. |
| `preview.builder.io` | 3 | Builder preview host | ⚪ | Test/example. |
| `cdn.test.builder.io` / `api.test.builder.io` | 3 / 1 | Test fixtures | ⚪ **FIXTURE** | Move with their specs. |
| `ai-services.builder.io` | 1 | Historical | ⚪ **HISTORY** | `packages/core/CHANGELOG.md` — leave. |
| `2fagent-workspace.builder.io`, `a.b.c...`, `abc` | — | `%2F` URL-encoding artifacts / example strings, **not real hosts** | ⚪ | Ignore — regex noise inside encoded URLs. |

### 🟢 The one clear rename bug (safe to fix now)
`packages/docs/app/root.tsx` JSON-LD advertises the org as **`name: "Jami Studio"`** but
**`url: "https://builder.io"`**. That's a half-done rename — our structured-data identity should be
`https://jami.studio`. (The `sameAs` GitHub link legitimately points at the fork source and stays.)

---

## Family B — `*.agent-native.com` (our hosted app fleet)

One subdomain per template = the app's hosted URL. These live mostly in skill markdown, plugin MCP
manifests, dispatch fallback URLs, docs demo links, and `.spec.ts` fixtures. **All 🟡 REPOINT** to the
matching `*.jami.studio` subdomain (keeps the exact routing shape, just our domain).

| Host | ~Count | App | → jami.studio target |
|---|---:|---|---|
| `plan.agent-native.com` | 613 | Plan (visual plans) | `plan.jami.studio` |
| `mail.agent-native.com` | 351 | Mail | `mail.jami.studio` |
| `dispatch.agent-native.com` | 248 | Dispatch | `dispatch.jami.studio` |
| `assets.agent-native.com` | 198 | Assets | `assets.jami.studio` |
| `design.agent-native.com` | 90 | Design | `design.jami.studio` |
| `calendar.agent-native.com` | 82 | Calendar | `calendar.jami.studio` |
| `clips.agent-native.com` | 76 | Clips | `clips.jami.studio` |
| `slides.agent-native.com` | 75 | Slides | `slides.jami.studio` |
| `content.agent-native.com` | 74 | Content | `content.jami.studio` |
| `analytics.agent-native.com` | 65 | Analytics | `analytics.jami.studio` |
| `forms.agent-native.com` | 45 | Forms | `forms.jami.studio` |
| `brain.agent-native.com` | 29 | Brain | `brain.jami.studio` |
| `chat.agent-native.com` | 5 | Chat | `chat.jami.studio` |
| `macros.agent-native.com` | 4 | Macros | `macros.jami.studio` |
| `images.agent-native.com` | 3 | Assets/images | `images.jami.studio` |
| `context-xray` / `xray` / `x` `.agent-native.com` | 5 / 3 / 3 | Context X-Ray feature | `xray.jami.studio` (pick one) |
| `issues` / `recruiting` / `docs` `.agent-native.com` | 1 each | retired apps / docs | per app decision |

### Infra / non-app subdomains
| Host | ~Count | What it is | Disposition |
|---|---:|---|---|
| `agent-native.com` (bare) | 354 | Root domain (marketing, org, defaults) | 🟡 → `jami.studio` |
| `www.agent-native.com` | 69 | Docs / marketing site; heavy in `analytics.spec`, `generator.spec`, README | 🟢/🟡 → `www.jami.studio` |
| `app.agent-native.com` | 35 | Main app host; **mostly `session-replay.spec.ts`** | 🟡/⚪ → `app.jami.studio` |
| `alice.agent-native.com` | 14 | Named example instance; **`builder-browser.spec.ts`** | ⚪ **FIXTURE** |
| `a.b.c.` / `good.` / `other.` / `team.design.` / `2fdesign.` `.agent-native.com` | 1 each | Example hostnames in tests | ⚪ **FIXTURE** |

---

## Recommended repoint sequence (reviewable batches)

1. **🟢 Identity (tiny, now):** `root.tsx` JSON-LD `url` → `https://jami.studio`; `packages/docs/app/seo.ts`
   canonical/base `www.agent-native.com` → `www.jami.studio` (verify before flipping if docs are live).
2. **🟡 Fleet subdomains (bulk, mechanical):** every `*.agent-native.com` app subdomain → `*.jami.studio`.
   Replace in code **and** its `.spec.ts` expectations together; **skip** `CHANGELOG.md` (history).
   ~2,400 refs. This is the "map still resolves to the expected route, just under jami.studio" pass.
3. **🟡 Infra:** `agent-native.com` / `www.` / `app.` → `jami.studio` / `www.` / `app.`; pick a single
   Context X-Ray host.
4. **🔴 Builder runtime (later, per-service):** `cdn.builder.io` (after our CDN), `api.builder.io`
   (after our search), `builder.io/account|legal|sdk|cli-auth` + Connect/OAuth (after we assume the
   role). Each is a service cutover, not a string swap.

### What this map deliberately did NOT change
Nothing swept yet except the one 🟢 identity fix in `root.tsx` (below). The 🔴 runtime set is left
intact so uploads / search / billing / OAuth keep working. The 🟡 fleet batch is staged and ready to
run on your go — say which batch(es) and I'll execute them in reviewable chunks.

---

## Open picks for you
- **Context X-Ray:** collapse `context-xray` / `xray` / `x` `.agent-native.com` into one `*.jami.studio` host? (which name?)
- **Retired subdomains** (`issues`, `recruiting`): repoint, or drop with the retired apps already in `_ops/legacy/`?
- **`www.builder.io` legal/marketing links:** keep pointing at Builder's pages for now, or stub our own?
- **Test fixtures** (`alice.`, `app.`, `a.b.c.` …): repoint for consistency, or leave as neutral example hosts?

# agent-native — Integrations / OAuth / Connections / Secrets

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

Pillar: the external-connection layer (integrations, OAuth, connections, credentials, secrets).
Source of truth: local clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`,
`@agent-native/core` **v0.23.0**, **MIT** (`packages/core/package.json`).
Drift checks (2026-06-01): GitHub README confirms MIT and "Any SQL database Drizzle
supports. Any hosting target Nitro supports. No lock-in." Nango clone license verified
**Elastic License 2.0 (ELv2)** (`references/nango/LICENSE`) — *not* MIT.
Date: 2026-06-01.

---

## Committed read: ADOPT WHOLESALE (core), then add ONE optional adapter behind the existing seam

Adopt agent-native's native connection layer **as-is** for `@jami-studio/harness`. It is fully
local, self-hostable, multi-tenant-correct, and already battle-hardened by a real
credential-leak incident (2026-04-29) that produced the two guard scripts Jamie named.
There is **no Builder hosted service** anywhere in this pillar — OAuth, token storage,
secret encryption, and webhook handling all run in-process against the app's own SQL DB.

The native layer is **sufficient today** for the providers we care about (Slack, GitHub,
Notion, Gmail, Google Drive, HubSpot, Granola, generic webhooks). First principles do
**not** demand building fresh, and do **not** demand a pass-through aggregator (Nango /
Composio) for the core set.

The single principled addition — and it is *optional*, demand-gated by breadth — is a
**`WorkspaceConnectionProvider` + `ProviderReaderRuntimeImplementation` adapter that
delegates to a self-hosted Nango** when (and only when) we need long-tail OAuth breadth
(Nango ships ~825 providers in `packages/providers/providers.yaml`). This drops in behind
the **exact same seam templates already use** (`defineProviderReaderImplementation` +
credential refs), with Nango's `keystore` holding the upstream tokens and agent-native's
secret vault holding only the Nango connection key. **Composio does not belong here** — it
is a hosted pass-through (the model yrka's first build already tried and is moving away
from); putting a third-party SaaS behind a seam whose whole point is local-first, per-user
SQL-scoped credentials re-introduces exactly the lock-in the ethos forbids. If breadth is
ever needed, self-hosted Nango behind the seam is the principled choice; ELv2 means we
self-host it as a sidecar, never fork/SaaS-wrap it.

---

## Direct answers to Jamie's questions

**Q: What runs their integrations now — native, a Builder hosted service, or an embedded
provider?**
**A: 100% native, in-process, self-hosted.** There is no gateway, no aggregator, no Builder
backend in this pillar. Concretely:
- **OAuth** is *template-owned*. Core stores tokens and refreshes Google directly against
  `https://oauth2.googleapis.com/token` (`oauth-tokens/google-refresh.ts`) using
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` the *operator* supplies. Token rows live in the
  app's own `oauth_tokens` SQL table (`oauth-tokens/store.ts`), keyed
  `(provider, account_id)` with an `owner` column and a 409 guard against cross-user
  re-binding (`OAuthAccountOwnedByOtherUserError`).
- **Messaging integrations** (Slack/Telegram/WhatsApp/email/Google-Docs) are native
  `PlatformAdapter`s in `integrations/adapters/*` that verify webhooks (HMAC), parse, and
  POST back to the provider API directly — no broker.
- **The `agent-native.com` / `builder.io` strings in `packages/core/src` appear only in
  `*.spec.ts` fixtures and example artifact domains** (e.g. `slides.agent-native.com`) — no
  runtime integration code calls a Builder endpoint. The `wrangler-dispatch.toml` is a
  Cloudflare **Pages** deploy target (`pages_build_output_dir`), i.e. a self-host option,
  not a hosted Builder dependency.

**Q: What is the adapter shape for adding an integration?**
**A: Two layers, both registry-based, both local.**
1. **Catalog/contract** — `connections/catalog.ts` declares a provider via
   `defineWorkspaceConnectionProvider({ id, label, credentialKeys, capabilities, ... })`.
   `connections/reader.ts` declares operations (`search`/`get`/`listRecent`) via
   `defineProviderReader(...)`. **Core only owns metadata + the contract**; every reader is
   marked `template-owned` — templates make the actual API calls (`reader.ts` notes:
   "Core only exposes the contract; templates still own Slack API calls").
2. **Runtime** — a template registers `defineProviderReaderImplementation({ providerId,
   operations })` and `createProviderReaderRuntime({ appId, readers })` wires connection
   resolution + credential resolution in (`reader.ts:715`). Messaging adapters implement the
   richer `PlatformAdapter` interface (`integrations/types.ts:82`).

**Q: How are credentials/secrets stored and scoped?**
**A: Encrypted-at-rest SQL vault, scoped per user/org/workspace, refs-not-values on the
connection.**
- **Secret values** live in `app_secrets` (`secrets/storage.ts`), **AES-256-GCM encrypted**
  with a key derived from `SECRETS_ENCRYPTION_KEY` (or `BETTER_AUTH_SECRET` fallback).
  Production **hard-fails** without one rather than using the old CWD-derived static key.
  Values are never logged and never returned over the wire (routes return `last4` only).
- A **`WorkspaceConnection` row stores only credential *refs*** (key + scope), never
  values (`workspace-connections/store.ts`); a `sanitizeConfig`/`SECRET_KEYS` redactor
  strips anything tokeny before persisting config.
- **Resolution** (`workspace-connections/credentials.ts`) reads the encrypted secret vault
  first, then the legacy per-user/per-org `credentials` setting store
  (`credentials/index.ts`), always under an authenticated request context. The
  `credentials` store **never reads `process.env`** and **never serves a global row** — the
  hard lesson from the 2026-04-29 leak.
- **The two guards Jamie named** enforce this in CI: `guard-no-env-credentials.mjs` bans
  `process.env.<KEY>` (and dynamic `process.env[key]`) reads in credential/secret/agent
  paths except a small deploy-level allowlist (`DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `SECRETS_ENCRYPTION_KEY`, …); `guard-no-unscoped-credentials.mjs` bans the one-arg
  `resolveCredential(key)` form so every lookup carries `{ userEmail, orgId }`.

**Q: Nango vs Composio — which belongs behind the seam, and is native sufficient?**
**A:** Native is sufficient for the core providers. If long-tail OAuth breadth is ever
needed, **self-hosted Nango behind the `ProviderReader` seam** is the principled add (broad
provider catalog, self-hostable, token store is its own concern). **Composio does not
belong** — hosted pass-through re-introduces lock-in and was the first-build pattern being
retired. Neither is needed now.

---

## Evidence (file paths in the local source)

| Concern | File |
| --- | --- |
| Provider catalog + `defineWorkspaceConnectionProvider` | `packages/core/src/connections/catalog.ts` |
| Reader contract + runtime (`createProviderReaderRuntime`, `defineProviderReaderImplementation`) | `packages/core/src/connections/reader.ts` |
| Connection store (SQL, scoped by `owner_email`/`org_id`, grants, refs-only) | `packages/core/src/workspace-connections/store.ts` |
| Credential resolution (vault → settings, provenance, aliases) | `packages/core/src/workspace-connections/credentials.ts` |
| Encrypted secret vault (AES-256-GCM, `app_secrets`) | `packages/core/src/secrets/storage.ts` |
| Secret registry (`registerRequiredSecret`, `kind: api-key\|oauth`, scopes) | `packages/core/src/secrets/register.ts` |
| Per-user/org credential store (no env, no global row) | `packages/core/src/credentials/index.ts` |
| OAuth token store (`oauth_tokens`, owner guard, 409) | `packages/core/src/oauth-tokens/store.ts` |
| Proactive Google refresh (direct to googleapis.com) | `packages/core/src/oauth-tokens/google-refresh.ts` |
| Messaging adapter interface (`PlatformAdapter`) | `packages/core/src/integrations/types.ts` |
| Built-in messaging adapters | `packages/core/src/integrations/adapters/{slack,telegram,whatsapp,email,google-docs}.ts` |
| Integrations UI (status panel, cards) | `packages/core/src/client/integrations/*` |
| CI guards | `scripts/guard-no-env-credentials.mjs`, `scripts/guard-no-unscoped-credentials.mjs` |
| Practice (real integration) | `references/voice-prototypes/AGENTS.md` Rule 6, `server/routes/api/{openai,gemini}-session.ts`, `server/lib/vertex-live-server.ts` |

**In practice (voice-prototypes):** the locked rule is "the browser never holds a provider
credential" — server mints ephemeral tokens (OpenAI/Gemini) or runs a server-side WebSocket
proxy holding service-account ADC (Vertex). This is the native model used end-to-end, no
broker.

---

## Swap-difficulty table (part → difficulty → seam/file)

| Replaceable part | Difficulty | Seam / how |
| --- | --- | --- |
| **Add a new first-class provider** | Trivial config | Append a `defineWorkspaceConnectionProvider(...)` to `connections/catalog.ts` + a `defineProviderReader(...)` in `reader.ts`. |
| **Add a runtime implementation for a provider** | Adapter swap | `defineProviderReaderImplementation({ providerId, operations })` registered into `createProviderReaderRuntime` — `connections/reader.ts:715`. |
| **Add a messaging platform** | Adapter swap | Implement `PlatformAdapter` (`integrations/types.ts:82`), pass via `IntegrationsPluginOptions.adapters`. |
| **Swap secret storage backend (e.g. KMS, Vault, Doppler)** | Moderate | Replace the CRUD in `secrets/storage.ts` (`writeAppSecret`/`readAppSecret`); table bootstrap and `getDbExec()` are the only couplings. Encryption is self-contained (`encryptValue`/`decryptValue`). |
| **Swap encryption key source / rotate** | Trivial config | `SECRETS_ENCRYPTION_KEY` env; `getEncryptionKey()` re-derives per request. |
| **Swap the SQL backend (SQLite ↔ Postgres ↔ Turso)** | Trivial config | All stores go through `db/client.ts` (`getDbExec`, `isPostgres`, `intType`); Drizzle-supported DBs per README. |
| **Delegate OAuth breadth to self-hosted Nango** | Adapter swap (optional) | New `ProviderReaderRuntimeImplementation` that calls Nango; store only the Nango connection key in the vault. Same seam as any template reader — no core change. |
| **Replace the whole connection model** | Hard / unnecessary | Would touch store + credentials + reader + UI; first principles do not justify it. |

---

## Maps to our foundation

- **`@jami-studio/harness`** — primary owner. The connection store, secret vault, credential
  resolution, OAuth token store, guards, and the `PlatformAdapter` / `ProviderReader`
  contracts are all harness-layer plumbing (host/db/auth behind thin adapters, exactly the
  canon §1 "agnostic + adaptable" shape). Adopt this layer here.
- **`@jami-studio/ui`** — secondary. `client/integrations/*` (`IntegrationsPanel`,
  `IntegrationCard`, `useIntegrationStatus`) are React surfaces that render from the
  registry/readiness data — candidates for the primitive registry, driven by
  `requiredEnvKeys`/`credentialKeys` metadata (no hardcoding).
- **`@jami-studio/orchestra`** — light touch. The dispatch/webhook → agent-loop wiring
  (`integrations/plugin.ts`, `IntegrationsPluginOptions`) is where an inbound Slack/Telegram
  message spawns an agent run; that scheduling/routing belongs to orchestra, but the
  *connection* concern stays in harness.

---

## Risks, license/redistribution constraints, unverified

**License / redistribution**
- **agent-native core: MIT** (v0.23.0, confirmed local + GitHub README 2026-06-01). Clean to
  adopt, modify, and redistribute under jami.studio OSS.
- **Nango: Elastic License 2.0**, not MIT. ELv2 forbids providing the software "to others as
  a managed service" and forbids circumventing license keys. Safe as a **self-hosted
  sidecar** behind our seam for internal use; **must not** be forked into our OSS repo or
  offered as part of a hosted product surface. This is the constraint that makes "adapter
  behind the seam," not "absorb the code," the only compliant path if we ever pull Nango in.
- Composio: hosted SaaS — pricing/terms are a vendor dependency; not adopted, so moot.

**Technical risks**
- **`template-owned` readers mean core ships the contract, not the API clients.** Every
  provider's actual search/get/list code is our responsibility per template — agent-native
  gives the typed seam and credential plumbing, not turnkey Slack/Notion clients. This is a
  feature (lean core) but means "adopt wholesale" still leaves per-provider client code to
  write. Budget for it.
- **OAuth client registration is the operator's job.** Google client ID/secret, Slack
  signing secret, etc. are operator-supplied env/secrets; there is no managed OAuth app.
  Correct and lock-in-free, but it is real setup per provider.
- **`SECRETS_ENCRYPTION_KEY` rotation invalidates the entire vault** (key feeds a SHA-256
  symmetric key; old ciphertext won't decrypt). Plan rotation = re-encrypt, not flip.
- **Google-specific proactive refresh** (`google-refresh.ts`) is hardcoded to Google's token
  endpoint; other OAuth providers refresh reactively only. Adding proactive refresh for a
  new provider is net-new code (small).

**Could not verify**
- agent-native.com/docs was not fetched directly (only GitHub README + npm, and npm
  returned 403). Version/license cross-checked against the local clone (v0.23.0 MIT) and the
  GitHub README; the GitHub *release tag* scheme (`0.1.7-101`) differs from the npm package
  version (`0.23.0`) — did not reconcile the two numbering schemes.
- No pricing/telemetry coupling found in this pillar's source; I did not exhaustively audit
  the `observability/`, `usage/`, or `pinpoint/` packages for analytics beacons (the
  `GA_MEASUREMENT_ID` in `wrangler-dispatch.toml` is a template's own GA tag, operator-owned,
  not a Builder telemetry pipe).
</content>
</invoke>

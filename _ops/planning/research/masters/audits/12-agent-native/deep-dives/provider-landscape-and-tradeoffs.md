# Deep-dive — External Provider Landscape & Tradeoffs (provider vs roll-your-own)

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

Date: 2026-06-01
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Pillar parent: `dev/docs/research/12-agent-native/integrations-oauth-connections.md` (do not duplicate; this extends it).
Scope: the external-provider/integration layer of the rebuilt `@jami-studio/harness` (foundation = Builder.io's MIT `@agent-native/core` v0.23.0).

---

## Committed read

**Base layer = agent-native's native connection layer, adopted as-is.** OAuth connect/refresh,
AES-256-GCM `app_secrets` vault, per-user/org-scoped credential resolution, the `oauth_tokens`
store with the cross-user owner guard, the `PlatformAdapter` (messaging) and `ProviderReader`
(read) seams, and in-process webhook handling all run locally against the org's own SQL DB.
There is no aggregator, no broker, no Builder backend in this layer. First principles do **not**
demand a provider aggregator for the core set (Slack, GitHub, Notion, Gmail, Google Drive,
HubSpot, generic webhooks) — native is sufficient and is the only model that preserves Jamie's
crux: **permissions/access/auditing never leak just because work crossed an external connection,
because the credential never leaves the org's scoped SQL vault and every lookup carries
`{ userEmail, orgId }`.**

**One optional provider tool goes behind the `ProviderReader`/`WorkspaceConnectionProvider`
seam — self-hosted Nango — gated by exactly one trigger: needing long-tail OAuth breadth beyond
the providers we hand-write.** Nango ships 830 providers (verified in the local clone, below).
It is delegated to as a `ProviderReaderRuntimeImplementation` that calls a self-hosted Nango
sidecar; Nango's `keystore` holds the upstream provider tokens, and agent-native's vault holds
only the Nango connection key. No core change. This is demand-gated, not built now.

**Composio does NOT go behind the seam.** It is a hosted pass-through (managed-auth control
layer). It is the exact pattern yrka's first build adopted and is now actively retreating from
(evidence below). Putting a third-party SaaS that holds the tokens behind a seam whose entire
purpose is local-first, per-org SQL-scoped credentials re-introduces the lock-in and the
audit-boundary leak the ethos and Jamie's crux forbid.

**Roll-your-own vs provider, decided:** roll-your-own *connection plumbing* (we adopt
agent-native's, which is already built — so this is free), and **write per-provider client code
ourselves for the core set**. Buy *breadth* from a self-hostable provider (Nango) only when the
long tail is actually demanded. Never buy the *token-custody/auth control plane* from a hosted
SaaS — that is the one thing that must stay in-org.

---

## Direct answers

**Q: Provider aggregator, or roll-your-own, for the rebuilt harness?**
A: Roll-your-own connection layer (already done for us by agent-native MIT core) + hand-written
per-provider clients for the core set. A self-hosted aggregator (Nango) sits behind the seam only
for long-tail breadth, only when demanded. No hosted aggregator ever holds tokens.

**Q: Which provider tool, if any, goes behind agent-native's `ProviderReader` seam, and gated by
what?**
A: **Self-hosted Nango**, gated by the single trigger "we need OAuth breadth beyond the providers
we hand-write." It drops into `createProviderReaderRuntime({ appId, readers })` as one more
`ProviderReaderRuntimeImplementation` (`connections/reader.ts:715`) — same seam as any template
reader. Nothing else qualifies: Composio/Pipedream/Paragon/Merge are hosted token-custodians that
break the local-first audit boundary; WorkOS solves a different problem (enterprise SSO/directory,
not app-action OAuth).

**Q: Is the native layer turnkey, or template-owned?**
A: Hybrid. **Turnkey:** OAuth token store + owner guard, AES-256-GCM secret vault, scoped
credential resolution, the typed seams, the messaging adapters (Slack/Telegram/WhatsApp/email/
google-docs are shipped `PlatformAdapter`s), webhook HMAC verification, the two CI guards.
**Template-owned (we write it):** every `ProviderReader`'s actual `search`/`get`/`listRecent` API
calls (`implementationStatus: "template-owned"`), OAuth *client registration* per provider
(operator supplies `GOOGLE_CLIENT_ID`, Slack signing secret, etc.), and proactive token refresh
for non-Google providers (only Google has a proactive refresher; others are reactive).

**Q: What worked / didn't in yrka's first build?**
A: yrka adopted **Composio** as the pass-through for ~40 flagship + long-tail providers, then had
to wrap it in a heavy in-house governance layer (action classes, retention classes, review
policies, `external_action_events`/`external_webhook_events` audit ledgers, per-provider auth-config
env vars, emergency pauses) to make a hosted token-custodian safe and auditable. **What worked:**
breadth fast, and the governance wrapper. **What didn't:** the hosted pass-through never satisfied
the audit/consent boundary on its own, so yrka built a parallel **"direct token-vault / direct
OAuth" lane that now takes precedence over Composio** for every provider that matters (Notion,
Dropbox, Box, Microsoft Calendar/SharePoint, Slack) — i.e. it re-implemented the agent-native
native model alongside Composio and is migrating onto it. The lesson is decisive: the
local-first native lane is the destination; the hosted aggregator was a detour that added a
governance tax and a lock-in.

---

## Evidence

### (1) agent-native NATIVE layer — local source

Clone: `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`, `@agent-native/core` v0.23.0, **MIT**.

| Concern | File (verified) |
| --- | --- |
| `ProviderReader` contract + statuses (`metadata-only`/`template-owned`/`shared`) | `packages/core/src/connections/reader.ts` (status enum L23-26; `implementationStatus` L45,53) |
| Runtime wiring — the seam Nango would drop behind | `packages/core/src/connections/reader.ts:715` (`createProviderReaderRuntime`; resolves connection + credentials per `{ userEmail, orgId }`, L741-751) |
| OAuth token store, `(provider, account_id)` PK, `owner` column, 409 cross-user guard | `packages/core/src/oauth-tokens/store.ts` (table L14-23; `OAuthAccountOwnedByOtherUserError` doc L62-70) |
| Proactive Google refresh (only Google is proactive) | `packages/core/src/oauth-tokens/google-refresh.ts` |
| AES-256-GCM secret vault, key from `SECRETS_ENCRYPTION_KEY`/`BETTER_AUTH_SECRET`, **production hard-fails without a key** | `packages/core/src/secrets/storage.ts` (header L1-13; `getEncryptionKey` L80-90 prod throw) |
| Per-user/org credential resolution (no `process.env`, no global row) | `packages/core/src/workspace-connections/credentials.ts`, `credentials/index.ts` |
| Connection store — refs only, scoped by owner/org | `packages/core/src/workspace-connections/store.ts` |
| Messaging adapters (shipped, turnkey) | `packages/core/src/integrations/adapters/{slack,telegram,whatsapp,email,google-docs}.ts` |
| Webhook handler engine (in-process, HMAC) | `packages/core/src/integrations/webhook-handler.ts`, `webhook-handler-engine.spec.ts` |
| CI guards | `scripts/guard-no-env-credentials.mjs`, `scripts/guard-no-unscoped-credentials.mjs` |

### (2) yrka first build + flagship — Composio pass-through and the retreat

| Finding | File (verified) |
| --- | --- |
| Composio is the pass-through; governed action classes (read/draft/write/export/sync/trigger) | `apps/web/lib/integrations/external-action-agent-route-action.ts` (action-class + destination maps L42-60) |
| Composio governance burden (auth-config env per provider, retention, review, audit ledgers, emergency pause) | `apps/docs/admin/integrations/overview.md` (esp. setup prereqs L41-42, governance steps 16-20, boundaries L106-112) |
| **The retreat — direct token-vault lane now takes precedence over Composio** | `tests/lib/integrations-composio-flagship.test.ts` (`getFlagshipRuntimePrecedence`, `isDirectResourceSourceSyncProvider` L9-10); `docs/operations/reliability/provider-runtime-matrix.md` (Notion/Dropbox/Box/Slack rows all read "Composio proof lane plus direct token-vault … **precedence; primary connect uses direct OAuth**") |
| Migration intent stated explicitly | `.changes/2026-05-21-oauth-connection-parity-plan.md` ("explicitly separates Composio connected-account proof from direct OAuth token-vault app surfaces") |
| Per-org isolation already the model (org-scoped connection/account tables) | `packages/db/src/database.types.ts` (`external_connections`, `external_connection_accounts` with `organization_id` + `owner_profile_id` FKs, L5597-5836) |
| No Nango anywhere in yrka | grep `nango` over yrka (excl. node_modules) → 0 files |

### (3) The local Nango clone

Clone: `C:\Users\james\projects\rebuild\agent-primitives\references\nango`.

- **License: Elastic License 2.0 (ELv2)** — verified `LICENSE` L1: forbids "provide the software to
  third parties as a hosted or managed service" and forbids circumventing the license key.
- **830 providers** — verified `grep -cE "^[a-z0-9_-]+:" packages/providers/providers.yaml` → 830
  (the prior pillar's "~825" was right).
- **Self-host shape = real multi-container sidecar**, not a library — verified `docker-compose.yaml`:
  `nangohq/nango-server:hosted` image + Postgres 16 + Redis 7.2 + optional Elasticsearch (logs).
  This is a standing service to operate, monitor, and back up — a meaningful op cost, which is why
  it is demand-gated, not default.
- Monorepo confirms unified-API breadth: `packages/{providers,keystore,records,webhooks,orchestrator,
  scheduler,runner,...}` — `keystore` is its own token store (it would hold upstream tokens; our vault
  holds only the Nango key).
- **ELv2 implication:** self-host as a sidecar behind our seam for internal use is fine. We must
  **never** fork it into the jami.studio OSS repo or expose it as part of a hosted product surface.
  That is precisely why "adapter behind the seam," not "absorb the code," is the only compliant path.

### (4) Industry standards 2026 (verified online 2026-06-01; dated)

| Provider | Model | License / self-host | Pricing posture (2026) | Owns (token lifecycle / unified schema / syncs / webhooks) | Agent-friendliness |
| --- | --- | --- | --- | --- | --- |
| **Composio** | Hosted control layer + SDK; "Rube" MCP server | SDK reportedly MIT, self-hostable MCP server (needs Node + optional Postgres/Redis) — *self-host claim from secondary/marketing sources, see Unverified* | Free 20K tool calls/mo → $29/mo (200K, +$0.299/1K) → $229/mo (2M, +$0.249/1K) → Enterprise (composio.dev/pricing, fetched 2026-06-01) | Token lifecycle ✓ (hosted), tool catalog 500+ apps, MCP, less of a sync/unified-schema play | Strong (MCP-first, function-calling SDKs) |
| **Nango** | Self-hostable unified-API + auth + syncs | **ELv2** (local LICENSE); self-host generous (free tier scales to ~1,000 connections self-hosted per 2026 docs); Enterprise self-host = fixed annual license fee | Cloud: Free → Starter $50/mo (20 conns, 200K req) → Growth $500/mo → Enterprise; overage ~$1/active conn, $0.10/1K proxy req (nango.dev/pricing + blog, fetched 2026-06-01) | Token lifecycle ✓, **unified schema ✓, syncs ✓ (incremental, checkpointing, dedup), high-concurrency webhooks ✓** — the broadest "owns it all" | Good; MCP via its API; 800+ providers |
| **Paragon** | Embedded iPaaS (Managed Sync + ActionKit + Workflows) | Cloud or on-prem hosting; proprietary | Contract-only (Pro/Enterprise, no public pricing); multi-dimension (workflows/tasks/connectors) — gets complex at scale (~130 connectors) | Token lifecycle ✓, workflow engine, sync-and-store; ActionKit = agent actions | Moderate (ActionKit for agents) |
| **Merge.dev** | Unified API (single aggregated schema) | Proprietary, hosted | Free "Launch" plan; per-linked-account pricing — scales with #customers × #systems, can grow fast (~220 integrations) | Unified schema ✓ (its whole identity), token lifecycle ✓, syncs ✓, webhooks ✓ | Low/moderate (data-sync focus, not agent-tool-first) |
| **Pipedream Connect** | Managed OAuth + embedded + MCP | Proprietary, hosted | From $99/mo, billed by end-user connected accounts at scale (pipedream.com/connect, fetched 2026-06-01) | Token lifecycle ✓ (encrypted, per-end-user), **~3,000 apps / 10,000+ tools**, MCP server | **Strongest MCP story in 2026** (Claude/ChatGPT/Cursor referenced) |
| **WorkOS** | Auth/identity platform (AuthKit, Connect, Directory Sync) | Proprietary, hosted | AuthKit free ≤1M MAU; OAuth social connections free; **Enterprise SSO/Directory Sync ~$125/conn/mo** with volume discounts (workos.com/pricing, fetched 2026-06-01) | Owns identity + SSO/SCIM + OAuth authorization; "Pipes" for 3rd-party; MCP auth | Adjacent — agent *auth*, not app-action tool exposure |
| **Native per-provider OAuth** (= agent-native model) | Library/in-process | MIT (agent-native core); fully self-host | $0 software; cost = our per-provider client code + OAuth app registration | We own everything, scoped to org SQL | Exposed as MCP/tools by the harness itself |

---

## Seams & difficulty

| Action | Difficulty | Seam |
| --- | --- | --- |
| Add a core first-class provider | Trivial config + write the client | `defineWorkspaceConnectionProvider(...)` in `connections/catalog.ts` + `defineProviderReader(...)` + a `defineProviderReaderImplementation(...)` you author |
| Put self-hosted Nango behind the seam (breadth) | Adapter swap (optional, demand-gated) | One `ProviderReaderRuntimeImplementation` calling Nango; store only the Nango connection key in the vault — `connections/reader.ts:715`, no core change |
| Add a messaging platform | Adapter swap | Implement `PlatformAdapter` (`integrations/types.ts:82`) |
| Swap secret backend (KMS/Vault/Doppler) | Moderate | Replace CRUD in `secrets/storage.ts`; encryption self-contained |
| Swap SQL backend (SQLite↔Postgres↔Turso) | Trivial config | All stores via `db/client.ts` |

---

## Honest downsides

- **Per-provider client code is on us.** `template-owned` readers mean agent-native gives the typed
  seam + credential plumbing, not turnkey Slack/Notion/HubSpot API clients. "Adopt wholesale" still
  leaves real per-provider work. This is the deliberate cost of avoiding a token-custodian SaaS.
- **OAuth app registration per provider is operator work.** No managed OAuth app — we register and
  hold every client ID/secret. Correct and lock-in-free, but real setup per provider.
- **Breadth is slower than buying it.** Composio/Pipedream give thousands of apps instantly; our
  core set is hand-written. The Nango sidecar is the pressure-release valve, but it is a multi-
  container service to run (Postgres + Redis + server), so turning it on is a real ops decision.
- **Proactive refresh is Google-only today.** Other providers refresh reactively; adding proactive
  refresh for a new provider is small net-new code.
- **`SECRETS_ENCRYPTION_KEY` rotation invalidates the vault** (SHA-256-derived symmetric key); plan
  rotation as re-encrypt, not flip.
- **ELv2 confines Nango to a self-host sidecar** — never forked into OSS, never part of a hosted
  product surface. If jami.studio ever wants OSS-distributable breadth, Nango cannot be the answer
  in the distributed artifact; only the optional self-host adapter can reference it.
- **The "agent-friendliness" leaders are the hosted ones.** Pipedream has the strongest 2026 MCP
  story and Composio is MCP-first; choosing native means we expose tools/MCP from the harness
  ourselves rather than inheriting a ready MCP catalog. Worth it for the audit boundary, but it is a
  feature we build, not buy.

---

## Unverified

- **Composio's self-host / MIT-SDK posture.** Composio's official `pricing` page (fetched
  2026-06-01) does **not** state license or self-host; the "MIT SDK + self-hostable MCP server"
  claim came from secondary/marketing sources (incl. Composio's own comparison content and an
  Augment listing). Treat as *likely but unconfirmed against a primary license file*. It is moot to
  the decision (Composio is not adopted), but the prior pillar's framing of Composio as pure hosted
  lock-in may be slightly out of date — the *hosted API that custodies tokens* is still the lock-in
  concern regardless of SDK license.
- **Nango self-host free-tier exact ceiling.** "Scales to ~1,000 connections free self-hosted" is
  from Nango blog/G2, not the pricing page directly (pricing page omitted self-host specifics on
  fetch). The ELv2 license and 830-provider count are verified from the local clone and are
  authoritative.
- **Paragon pricing** is contract-only; no public numbers to verify.
- **agent-native.com/docs** not fetched (npm 403 in prior pillar); version/license cross-checked
  against the local clone (v0.23.0 MIT) only. GitHub release tag scheme (`0.1.7-101`) vs npm
  (`0.23.0`) not reconciled.
- yrka's Composio governance code was read at the contract/doc level (route-action maps, runtime
  matrix, flagship test imports); I did not trace every `external_action_*` execution path end-to-end.

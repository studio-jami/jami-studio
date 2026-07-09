# agent-native — Adoption Recommendation

Date: 2026-06-01
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Status: Committed direction (greenfield, Principled-Edge). Synthesizes the four pillar
investigations in this directory:
`engine-harness-memory.md`, `integrations-oauth-connections.md`,
`ui-registry-appearance.md`, `org-permissions-protocols-dispatch-license.md`.
Source of truth: local read-clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`
(`@agent-native/core` v0.23.0). **Fork target = `@agent-native/core` 0.32.2 + `@agent-native/dispatch` 0.8.28**
(npm `latest`, MIT); re-diff the seam files at fork. Practice cross-check: `C:\Users\james\projects\rebuild\voice-prototypes`.
**Reconciled 2026-06-01 with the fact-finding pass** (planner, AG-UI, governance, versions) — see
`fact-finding/fact-finding-synthesis.md`, which is authoritative wherever it and this doc differ.

---

## 1. Bottom line

**Jamie's instinct is correct: adopt agent-native wholesale as the foundation for
`@jami-studio/harness` + `@jami-studio/orchestra`, with a small set of targeted, first-principled
swaps — do not build fresh.** All four pillars independently land on adopt-or-adopt+swap,
and all confirm the same load-bearing fact: the Builder.io hosted services (LLM gateway,
transcription) are *opt-in engines/adapters behind clean seams*, not framework
dependencies — `voice-prototypes` already runs the whole stack with zero Builder services.
The codebase is MIT across every published package (`core`, `dispatch`, `embedding`,
`migrate`, `pinpoint`, `scheduling`), self-hostable on any-SQL/any-host, multi-tenant-correct,
and incident-hardened (the 2026-04-29 credential-leak guards). This is exactly the
stand-on-shoulders move the canon's Principled Edge demands; "greenfield" forbids carrying
forward *our* legacy, not adopting a polished MIT third-party foundation.

**The one place we genuinely build fresh is the UI primitive registry** — and even there
we build *thin packaging over shadcn*, because agent-native ships no shared component
package (23 templates each re-vendor ~49–50 shadcn copies). **Two layers are adopted *over*
agent-native's seams, not in place of its loop:** the **external interop** transport (AG-UI —
added *alongside* agent-native's native SSE spine, which stays the internal channel) and the
policy engine (`@microsoft/agent-governance-sdk@4.0.0`, behind one `policyCheck()` seam). See §3 and §4.

---

## 2. What agent-native IS, mapped to our foundations

| agent-native module / package | Maps to | Verdict |
|---|---|---|
| `agent/production-agent.ts::runAgentLoop` (transport-decoupled loop) | `@jami-studio/harness` | **adopt as-is** |
| `agent/engine/*` — `AgentEngine` iface + open registry + `resolveEngine` | `@jami-studio/harness` | **adopt as-is** |
| `agent/engine/ai-sdk-engine.ts` (multi-provider via Vercel AI SDK) | `@jami-studio/harness` (LLM adapter) | **adopt as-is** |
| `agent/engine/builder-engine.ts` (Builder hosted gateway) | — | **drop** (one engine; don't register) |
| `agent/model-config.ts` (central model catalog, no hardcoding) | `@jami-studio/harness` | **adopt as-is** |
| `agent/run-loop-with-resume.ts`, `run-manager.ts`, `run-store.ts` | `@jami-studio/harness` + `@jami-studio/orchestra` | **adopt as-is** |
| `db/client.ts` — `DbExec` seam + dialect auto-detect | `@jami-studio/harness` (db adapter) | **adopt + swap default → Postgres** |
| `chat-threads/store.ts` (conversation memory, JSON+CAS), `application-state` KV | `@jami-studio/harness` | **adopt as-is** |
| `event-bus/*` (typed named events) | `@jami-studio/orchestra` | **adopt as-is** |
| `connections/*`, `workspace-connections/*`, `oauth-tokens/*` (native connection layer) | `@jami-studio/harness` | **adopt as-is** |
| `secrets/storage.ts` (AES-256-GCM `app_secrets` vault) + CI guards | `@jami-studio/harness` | **adopt as-is** |
| `integrations/*` `PlatformAdapter`s (Slack/Telegram/WhatsApp/email) | `@jami-studio/harness` (+ orchestra webhook→loop) | **adopt as-is** |
| `org/*` (multi-tenant org/membership/roles, domain auto-join) | identity/entitlement plane | **adopt + extend (RBAC)** |
| `sharing/access.ts` + `registry.ts` + `schema.ts` (centralized access control) | permissions/audit | **adopt + extend (capabilities)** |
| `a2a/*` (A2A v0.3, JSON-RPC, JWT, SQL task store) | `@jami-studio/harness` + `@jami-studio/orchestra` | **adopt as-is** (upgrade target: A2A v1.0 signed cards) |
| `mcp/*` + `mcp-client/*` (stdio + Streamable HTTP) | `@jami-studio/harness` + `@jami-studio/orchestra` | **adopt as-is** |
| `@agent-native/dispatch` (vault, grants, approvals, audit, cross-app A2A, scheduled "dreams") | `@jami-studio/orchestra` | **adopt as-is** (biggest head-start) |
| `mcp/org-directory.ts` (cross-app discovery / identity hub) | `@jami-studio/orchestra` | **adopt as-is** |
| token contract: `styles/agent-native.css` `@theme` + per-template HSL vars | `@jami-studio/ui` | **adopt as-is** |
| agent surface: `AssistantChat`/`AgentPanel`/composer (on `@assistant-ui/react`) | `@jami-studio/ui` | **adopt as-is** (keep native SSE; add AG-UI external adapter separately) |
| `McpAppRenderer.tsx` (standard MCP-UI / `@modelcontextprotocol/ext-apps`) | `@jami-studio/ui` | **adopt as-is** |
| `extensions/slots/*` (ExtensionSlot + install tables) | `@jami-studio/ui` + `@jami-studio/harness` | **adopt as-is** |
| per-template `components/ui/*` (23× duplicated shadcn) | `@jami-studio/ui` | **distill → one shared primitive registry (our build)** |
| `client/appearance.ts` (6 hardcoded preset tints) | `@jami-studio/ui` | **improve → tokenized accent generator** |
| `transcription/builder-transcription.ts` (Builder-hosted STT) | `@jami-studio/harness` | **swap → `Transcriber` adapter** |
| `client/analytics.ts`, `tracking/providers.ts`, `PoweredByBadge`, doc-URL consts | — | **swap → our sink / jami.studio branding** |
| 23 templates as whole apps; `desktop-app`/`mobile-app`/`frame` (`private`) | — | **reference corpus only; do not redistribute** |

**Net:** harness is ~complete (lift wholesale). orchestra is largely present
(dispatch + a2a + mcp + org-directory) — and **complete as-is for the product runtime**: Option A+
ships **no** declarative DAG/workflow engine (agent loop + A2A task-store + run-manager + triggers +
cron + approvals already cover it). ui adopts the token contract + agent surface and adds one thin build
(the shared registry) plus one root-fix (the accent generator).

---

## 3. The targeted swaps (the short list first principles demand)

Each is *config* or *adapter-behind-an-existing-seam* — none is a rewrite. The "why" is
always lock-in, bloat, or a capability the canon already committed to elsewhere.

1. **LLM gateway: Builder hosted → BYO engine (default `anthropic`/`ai-sdk`).**
   Seam: `agent/engine/registry.ts:392` resolution chain + `builtin.ts:46-56` registration.
   Difficulty: **trivial config** (don't set `BUILDER_PRIVATE_KEY`, or
   `AGENT_ENGINE_PREFER_BYO_KEY=true`, or drop the registration block).
   Why: the gateway is metered Builder lock-in; our coding-runtime set is OAuth BYOK
   (canon §2). The `AGENT_ENGINE` registry *is* the LLM adapter the planned shape (06 §3) asks for.

2. **DB default: local SQLite → Postgres.**
   Seam: `DATABASE_URL` only; `db/client.ts:217 getDialect()`.
   Difficulty: **trivial config**.
   Why: the planned data plane is "one Postgres, namespaced schemas, RLS" (06 §2). No code
   change — the `DbExec` seam already supports it first-class.

3. **Transcription: Builder-hosted → `Transcriber` adapter.**
   Seam: `transcription/builder-transcription.ts` + `client/transcription/use-live-transcription.ts`.
   Difficulty: **adapter swap**. This is the *only* hard Builder dependency for a built-in
   feature. Why: lock-in; `voice-prototypes` already proves a self-hosted Vertex/OpenAI STT lane.

4. **Integrations breadth: native, with self-hosted Nango behind the `ProviderReader` seam *only if* long-tail OAuth is ever needed.**
   Seam: a new `defineProviderReaderImplementation` (`connections/reader.ts:715`), storing
   only the Nango key in the vault. Difficulty: **adapter swap, demand-gated — not now**.
   Why: native is sufficient for the core providers (Slack/GitHub/Notion/Gmail/Drive/HubSpot).
   **Composio does NOT go behind the seam** — it is a hosted pass-through that re-introduces
   exactly the lock-in the first build is retiring. Nango is **ELv2, not MIT**: legal *only*
   as a self-hosted sidecar; never forked into our OSS repo, never offered as a managed service.

5. **Appearance presets: 6 hardcoded enum tints → tokenized accent generator.**
   Seam: `client/appearance.ts APPEARANCE_PRESETS` + `agent-native.css:150-238`; keep the
   `data-appearance` + `application_state.appearance` write-path. Difficulty: **moderate / root-fix**.
   Why: canon §0 root-correct test — "accent color ⇒ a fully tokenized design system, never
   three hardcoded colors." Adopting the enum as-is would violate the ethos.

6. **Analytics / branding: `analytics.agent-native.com` + Builder/agent-native strings → our sink or off, jami.studio identity.**
   Seam: `client/analytics.ts:49`, `tracking/providers.ts`, `PoweredByBadge.tsx`, doc-URL consts.
   Difficulty: **trivial config + sweep**. Why: lock-in/branding; MIT requires we keep the
   copyright notice but not the trademark identity.

7. **Persistence resolution: env/global-singleton → request-scoped (`app_secrets` + `request-context`).**
   Seam: already built in core; adopt the request-scoped credential path rather than the
   `process.env` + `_exec` global. Difficulty: **adopt the existing seam (config of which path)**.
   Why: the env path is single-tenant-shaped; the request-scoped path is the multi-tenant seam
   our "one human, many agents" + entitlement plane needs.

**Two adopted-over-the-top layers (committed in 06, layered on agent-native, not swaps of its loop):**

- **Two transports, both built — native SSE internal (kept), AG-UI external interop (added).**
  agent-native binds `AssistantChat` to the harness via a **native SSE spine** + `application_state`
  DB-sync over `/_agent-native/*` (`use-db-sync.ts`, `AssistantChat.tsx`) — and that spine does two
  things AG-UI cannot model: bounded **seq-replay** and a global **DB-sync** channel. **Keep it as
  the internal app↔agent transport; do NOT rebind it to AG-UI** (rebinding would *lose* capability).
  AG-UI is the **external/third-party interop** transport, built as a separate ~1-file SSE→AG-UI
  adapter on the real MIT `@assistant-ui/react-ag-ui` (v0.0.34). Both carry our owned SDUI vocabulary
  (`ui.tree.render` / `ui.action.invoke`) + A2UI/MCP Apps payloads. The MCP-Apps path
  (`McpAppRenderer`) is already standards-based and carries straight over.

- **Policy/audit engine: `@microsoft/agent-governance-sdk@4.0.0` (Public Preview) at the
  `assertAccess()` choke point, behind one `policyCheck()` seam.** agent-native's permission model is
  flat (`owner|admin|member`, `viewer|editor|admin`, numeric `ROLE_RANK`) but *centralized*: every
  write/list funnels through `sharing/access.ts` + the per-resource flags in `sharing/registry.ts`.
  The planned shape (06 §7) adopts the SDK as a pinned MIT dep — in-process YAML `PolicyEngine`,
  real API `evaluate(action, context)` / `evaluatePolicy(agentDid, context)`, in-memory SHA-256
  **hash-chain** audit, Cedar/OPA via **external HTTP bridges** (not embedded). **Wrap `assertAccess()`
  with one `policyCheck()` seam** (our hard capability-grant gate in Postgres → `evaluatePolicy` for
  policy/approval nuance; default-deny on error) and every shareable resource inherits enterprise RBAC
  at once. Its `CredentialVault`/`CredentialInjector` almost exactly models `assertConnectionUse` —
  adopt the pattern. Our durable Postgres audit row stays the system of record; the SDK's hash-chain
  is a complementary integrity layer. dispatch's existing approval+audit spine
  (`dispatch_approval_requests`/`_audit_events`/`_approval_policy`) is the change-governance layer; we
  extend its taxonomy, not invent one. **Never add a second enforcement path** — one choke point. Because
  the SDK is Public Preview, the seam stays.

---

## 4. Side-by-side: agent-native vs our planned harness + ui + orchestra

**What agent-native does better than a from-scratch build (adopt):**
- A correct, production-shaped, transport-decoupled agent loop with resume/reconnect, an open
  multi-provider engine registry, and a single dialect-switching persistence seam — *exactly*
  the seams the canon demands, already built and battle-tested in `voice-prototypes`.
- A fully native, self-hosted, multi-tenant connection/secret layer with AES-256-GCM at rest,
  refs-not-values on connection rows, per-user/org scoping, and CI guards born from a real
  leak incident — hardening we would otherwise have to earn the hard way.
- A standards-conformant protocol surface (A2A v0.3 JSON-RPC + JWT + SQL task store; MCP stdio +
  Streamable HTTP) and a real control plane (`dispatch`: vault, grants, approvals, audit,
  cross-app A2A delegation, org-directory discovery, scheduled "dreams"). dispatch is the single
  biggest head-start toward orchestra in the whole foundation.
- The industry-baseline UI substrate (shadcn / Radix / Tailwind v4) + a standards-based
  agent-rendered-UI path (MCP-UI) — nothing to improve at the component level; rebuilding is bloat.

**What we genuinely improve / add:**
- **One shared primitive registry** vs 23 duplicated shadcn copies (ui's one real build —
  thin packaging, not a new component system).
- **A tokenized accent generator** vs 6 hardcoded preset tints (root-correctness).
- **Enterprise RBAC + capability catalog + team/group principals + per-tenant runtime policy**
  layered on the flat role model via `sharing/access.ts` — using `@microsoft/agent-governance-sdk@4.0.0`
  as the engine, not a hand-rolled one.
- **AG-UI external interop transport** built *alongside* the kept native SSE spine, carrying our
  owned, versioned SDUI vocabulary — the industry-standard surface for third-party agent interop,
  insulated behind the protocol revision the majors maintain. (Native SSE stays the internal channel.)
- **A2A v1.0 signed agent cards** as the upgrade target over the v0.3 the clone ships (the planned
  stack tracks LF A2A v1.0). **No declarative DAG/workflow engine in the product runtime (Option A+)** —
  agent loop + A2A task-store + run-manager + triggers + cron + approvals cover it; if a real durable-
  pipeline need ever surfaces, a thin owned seam on `a2a_tasks` + run-store + approvals is the answer
  (compose, don't adopt a framework). dispatch is delegation + cron + governance, not a planner.

**Where the two stacks are already the same bet:** MCP for tools, A2A for inter-agent,
self-host on any-SQL/any-host, MIT, BYOK. agent-native is a concrete, hardened implementation
of the abstract stack 06 commits to — which is why adoption is the lean path and a parallel
build would be the bloat.

---

## 5. UI-as-registry — the verdict

**The primitive registry is the one thing that is NOT already there; we distill it.** Split by layer:

- **Token contract** — already a clean, root-correct shadcn/Tailwind-v4 system (`styles/agent-native.css`
  `@theme` map + per-template HSL vars). **Adopt as-is.**
- **Agent surface** — already a shared, high-level component system (100+ exports in
  `client/index.ts`, built on OSS `@assistant-ui/react`). **Adopt as-is** on its native SSE transport;
  build the AG-UI external interop adapter separately (do not rebind the internal surface).
- **Primitive layer** — **NOT a registry**: 23 templates each re-vendor ~49–50 shadcn components
  with their own `components.json`; core exports only 4 low-level primitives. **This duplication is
  the gap ui fills** — consolidate into one shared registry. Pure packaging over shadcn, no
  harness ties, no new component system. This is a first-principles requirement (one source of
  truth for primitives), not a nicety.

**"Extract UI from harness" verdict: yes, cleanly, and the seam already exists.** agent-native
already splits `./client` vs `./server` vs `./db` exports. ui = token contract + the new
shared registry + the generic agent components + the accent generator, depending on harness
*only* through the documented endpoint contract (the native SSE spine; the AG-UI external adapter
rides the same contract). The shared file/DB state model (agent and UI read/write the same state)
is the framework's correct thesis — keep it, transport and all; nothing internal is replaced.
ui depends on the UI dependency subset (assistant-ui / Radix /
Tailwind / Tiptap), never the server/db/auth stack — the exports split makes that feasible.

---

## 6. How this folds the three open decisions

**Auth / identity topology (the live §4 open item) — agent-native's org + sharing + dispatch
becomes the concrete identity/entitlement plane, defaulting to the committed end-shape.**
The planned shape (06 §1) commits the *model* (identity / workspace / membership / role /
entitlement-key) and leaves only the *sign-in/federation shape* open. agent-native supplies that
model directly: `org/*` is the multi-tenant tenancy + membership + domain-auto-join layer;
`sharing/*` is the centralized resource entitlement layer; `dispatch` vault/grants is the
per-app/per-capability "which agent may use which secret/skill/agent" layer; A2A per-org secrets
+ the org-directory identity hub are the cross-app trust + discovery layer. **Default to the
end-shape: a single agnostic identity/entitlement plane** — agent-native's org as the tenant
boundary, the `policyCheck()` capability layer (over `@microsoft/agent-governance-sdk`) on
`sharing/access.ts` as the entitlement gate, and ala-carte product entitlements expressed as
capability grants in our additive, natural-named tables (`capability_grants`, not plan monoliths). What stays
genuinely open (creative): the federation/sign-in mechanism (BetterAuth ships in core; the
external IdP/federation shape is Jamie's call) and whether jami.studio (BYOK) / jnh.org sit on the
same plane or their own. The committed contracts are agnostic to that choice, so it lands late
without a refactor. Note: A2A trust today is shared/per-org HMAC, adequate for first-party
single-human-many-agents now; per-peer keys / signed cards (A2A v1.0) are the upgrade path for
true external zero-trust.

**Naming / directory arrangement — default to the end-shape, no change forced.** agent-native maps
cleanly onto the committed `dev/orgs/jami.studio/projects/{agent-harness, agent-ui, agent-orchestra}`
layout: harness = `core` engine/loop/memory/connections/secrets + a2a/mcp endpoints; ui = `core`
client surface + the new registry; orchestra = `dispatch` + a2a + mcp/org-directory + event-bus.
The package identity is renamed to our scope (mechanical: every template is
`@agent-native/core: workspace:*`; cut the umbilical, republish under jami.studio). No
directory-arrangement change is *required* by adoption; the org/project shape may still shift for
deployment/auth reasons per canon §4, but the mapping does not force it.

---

## 7. Risks, license/redistribution constraints, what remains open

**License / redistribution.**
- **All published packages are MIT** (`core`, `dispatch`, `embedding`, `migrate`, `pinpoint`,
  `scheduling`; `.changeset` access `public`) — modify + redistribute + **sell** permitted, keep
  the copyright + permission notice. Only the demo apps (`desktop-app`/`mobile-app`/`frame`/`docs`)
  are `private` — not part of the foundation, not redistributed. No CLA/trademark grant: **rename
  the Builder.io / agent-native identity** in our fork.
- **Nango is ELv2, not MIT** — if ever pulled in for OAuth breadth, self-hosted sidecar behind the
  seam *only*; never forked into OSS, never offered as a managed service. This is the constraint
  that forces "adapter behind seam," not "absorb the code."
- The 23 templates carry MIT-derived shadcn copies; per-template license headers were **not**
  individually audited — confirm before lifting any template wholesale (we distill, not adopt them
  as units).

**Technical risks.**
- **Version drift:** read-clone = 0.23.0; **fork target = core 0.32.2 / dispatch 0.8.28** (pre-1.0,
  fast-moving; active security PRs e.g. IDOR #369). **Vendor a pinned fork at the target version;
  cherry-pick security fixes; re-verify the key seam files** (`registry.ts`, `builder-engine.ts`,
  `ai-sdk-engine.ts`, `db/client.ts`, `sharing/access.ts`, `a2a/*`, `oauth-tokens/store.ts`) at fork time.
- **`oauth_tokens` read-scope (HIGH):** confirmed gap — `getOAuthTokens(provider, accountId)` reads with
  no owner/org arg (oauth-tokens/store.ts:47–55). Fix at fork: owner/org-required reads + scoped resolver + CI guard.
- **Flat permission model** — the capability/RBAC engine is on us (additive, via the governance SDK at
  the `policyCheck()` seam over `assertAccess()`); the risk is duplicating enforcement — mitigate by
  funneling everything through the one choke point.
- **`template-owned` readers** — core ships the typed connection contract + credential plumbing, not
  turnkey Slack/Notion API clients; per-provider client code is still ours to write. Budget for it.
- **`SECRETS_ENCRYPTION_KEY` rotation invalidates the whole vault** (re-encrypt, don't flip).
- **`checkpoints/` is git working-tree commits, not agent-state snapshots** — do not plan
  conversation-state resume around it; resume is conversation-prefix replay
  (`run-loop-with-resume.ts`) riding Anthropic's prompt cache.
- **`globalThis` registry pattern** (sharing/tracking) is a Vite-SSR bundle-dedupe hack — fragile
  under a different bundler; watch if build tooling changes.
- **Builder error codes / branding leak** into the generic loop's retry logic
  (`production-agent.ts:646-719`) and scattered strings — harmless if unused; minor cleanup + a
  full branding sweep before shipping.

**What remains genuinely open (creative / scope only, canon §4).**
- The **sign-in / federation shape** of the identity plane (the *model* is committed; agent-native
  supplies it). Default: single agnostic identity/entitlement plane, capability-grant entitlements.
- **Final product/brand names** and possible **org/project directory shifts** for deployment/auth —
  not forced by adoption.

**Could not verify (carry as fork-time checks).**
- Live `agent-native.com/docs` and hosted-gateway/transcription **pricing & ToS** (npm 403; only
  Builder.io architecture blog posts found) — moot since we swap those services, but read before
  relying on any hosted path.
- The 0.32.2 fork source was **not diffed** against the 0.23.0 read-clone — re-verify seams at fork.
- Root `LICENSE` file text/copyright holder (GitHub paths 404'd) — relied on per-package MIT fields
  (operative for npm); confirm the file for the attribution notice before redistribution.
- A2A v0.3 conformance is code-self-declared, not suite-tested; `pushNotifications: false` (no
  webhook push — a gap vs full A2A optional features). MCP transports confirmed (stdio + Streamable
  HTTP); exact protocol-revision string not located.
- D1/Turso DB paths and live dispatch orchestration not exercised this pass.

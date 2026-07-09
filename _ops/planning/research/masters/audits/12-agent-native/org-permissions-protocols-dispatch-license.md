# agent-native — Org / Permissions / Sharing / A2A+MCP / Dispatch (Orchestra) / License

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

_Pillar investigation for the rebuild. Source = local clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native` (`@agent-native/core` v0.23.0, `@agent-native/dispatch` v0.8.18). Drift facts verified against the GitHub repo on 2026-06-01._

---

## COMMITTED READ: **ADOPT + TARGETED SWAP**

Adopt the org / sharing / A2A / MCP / dispatch stack **wholesale** as the foundation for `@jami-studio/orchestra` and our permissions/audit layer. It is MIT, fully self-hostable, has no hard Builder.io hosted coupling in any of these modules, and already implements ~80% of what we need: multi-tenant org model, a registry-driven resource-sharing/access-control engine, conformant A2A v0.3 + MCP (stdio + Streamable HTTP) protocol surface, and a real control plane (vault, grants, approvals, audit, cross-app A2A delegation, scheduled "dreams").

**The one targeted swap is additive, not a replacement:** layer an **enterprise RBAC/capability model on top of** the existing 3-tier org roles + share roles. agent-native's permission model is **flat and hardcoded** (`owner | admin | member` org roles; `viewer | editor | admin` share roles; numeric `ROLE_RANK`). It is clean and centralized but not a capability/policy engine. We add a capability layer **beside** `assertAccess()` / org role checks — we do **not** rip out the existing model, because the seams (`sharing/registry.ts`, `sharing/access.ts`, the org `ctx.role` gates) are exactly where a policy hook belongs.

**Do NOT build fresh here.** First principles do not demand it: the access model is correct (ownership + coarse visibility + per-principal share rows, defense-in-depth on public/code-executing resources), the protocols are standards-conformant, and the dispatch control plane is the single biggest head-start in the whole foundation. Rebuilding would be pure NIH.

---

## DIRECT ANSWERS TO JAMIE'S QUESTIONS (this pillar)

**Q: Can we add ENTERPRISE permission/access levels (capability/RBAC) on top of agent-native?**
Yes, cleanly and additively. Permission decisions funnel through a small number of choke points, so a capability/policy layer slots in without a fork:
- **Resource access** is *entirely* centralized in `packages/core/src/sharing/access.ts` — `assertAccess(type, id, minRole)` and `accessFilter(table, sharesTable)` are the only things write-actions and list-queries call. Add a `policyCheck(capability, principal, resource)` hook here and every shareable resource inherits enterprise RBAC at once.
- **Org membership** is gated by explicit `ctx.role === "owner" | "admin"` checks in `org/handlers.ts` (with real escalation guards — admins can't promote admins, owner can't be removed/demoted). To add custom roles/capabilities, replace these inline string comparisons with a capability lookup. The role set itself is one type (`OrgRole` in `org/types.ts`) + one DB column (`org_members.role`) — widening it is a migration + a resolver, not a redesign.
- **The sharing registry** (`sharing/registry.ts`) already carries per-resource policy flags (`allowPublic`, `requireOrgMemberForUserShares`). This is the natural home for per-resource-type capability declarations.
- **Dispatch** already has an **approval-policy + audit** spine (`dispatch_approval_requests`, `dispatch_audit_events`, `dispatch_approval_policy`) — i.e. an enterprise change-control workflow already exists for "durable changes." Our audit needs are largely met; we extend the audit event taxonomy rather than invent one.

What's missing for true enterprise RBAC and must be added by us: (1) custom/named roles beyond the 3 fixed tiers; (2) a capability/permission catalog (the current model is role-rank, not capability-grant); (3) group/team principals (today principals are only `user` email or `org` id — see `createSharesTable`); (4) per-org policy config (current flags are per-resource-type, set at code/registration time, not per-tenant runtime).

**Q: A2A + MCP protocol posture vs our planned transport?**
- **A2A: spec v0.3, conformant.** `agent-card.ts` advertises `protocolVersion: "0.3"`; `types.ts` header says "A2A Protocol types (spec v0.3)". Standard JSON-RPC 2.0 surface — methods `message/send`, `message/stream` (SSE streaming), `tasks/get`, `tasks/cancel` (`a2a/handlers.ts`); standard error codes (`-32602` invalid params, app-level `-32001`). Auth is **JWT bearer** (HMAC, `jose`) keyed by a shared `A2A_SECRET` or **per-org secret** (`organizations.a2a_secret`), advertised via standard `securitySchemes.jwtBearer` on the agent card. Public agent card at `/.well-known/agent-card.json`; JSON-RPC at `/_agent-native/a2a`. Tasks persisted in local SQL/Postgres (`a2a/task-store.ts`) — **no hosted task store**. This is genuinely standards-aligned; our transport can adopt it directly.
- **MCP: standard, dual-transport.** `mcp-client/config.ts` supports **stdio** (spawn local binary) and **Streamable HTTP** (the transport Zapier/Cloudflare/Composio use). Server side mounts MCP at `/_agent-native/mcp` with OAuth (`mcp/oauth-route.ts`) and auth verification. Cross-app calls go MCP→A2A. Conformant to current MCP; no proprietary transport.

**Q: Does dispatch already give us the orchestrator (orchestra)?**
**Largely yes — this is the strongest single mapping in the foundation.** `@agent-native/dispatch` is described in its own `package.json` as "workspace control plane … Vault, integrations, destinations, scheduled jobs, and cross-app delegation." It provides, today:
- **Cross-app agent delegation** (`actions/ask_app.ts` → `server/lib/mcp-gateway.ts::askGrantedDispatchMcpApp` → `core/a2a callAgent`): one agent dispatches a natural-language task to a *granted* sibling app's agent over signed A2A. This is the orchestration primitive.
- **Org-wide app discovery** (`core/src/mcp/org-directory.ts`): a "dispatch is the identity hub" directory (`GET /_agent-native/org/apps`, org-A2A-token-authed) that lets the orchestrator find deployed sibling agents in production with zero manual wiring. Opt-in via `AGENT_NATIVE_ORG_DIRECTORY_URL` / `AGENT_NATIVE_IDENTITY_HUB_URL`; degrades silently to local-workspace-only when unset.
- **Per-app access grants** (`workspace_resource_grants`, `vault_grants`, MCP app-access settings) — capability-style "which app may use which secret/skill/agent" control.
- **Scheduled / autonomous runs** ("dreams": `dispatch_dreams`, `dispatch_dream_proposals`, `ensure-dream-job`) — recurring agent jobs that produce reviewable proposals gated by the approval flow.
- **Approval + audit** as above.
It does **not** give us a generic DAG/graph workflow engine or multi-step plan orchestration — it's app-to-app delegation + scheduled jobs + grant/approval governance. If `orchestra` needs declarative multi-agent workflows, that's net-new on top; but the transport, discovery, auth, grants, and audit substrate are all here.

**Q: LICENSE / redistribution reality — can we modify + redistribute + SELL?**
**Yes.** Every published package is **MIT**: `@agent-native/core` (v0.23.0 local; **v0.32.0** on `main`, verified 2026-06-01), `@agent-native/dispatch`, `@agent-native/embedding`, `@agent-native/migrate`, `@agent-native/pinpoint`, `@agent-native/scheduling`. Changesets config publishes with `"access": "public"`. The only `private: true` packages are the **apps/demos** (`desktop-app`, `mobile-app`, `frame`, `docs`, `code-agents-ui`, `shared-app-config`) — those aren't the foundation and we don't redistribute them. MIT permits modify + redistribute + **sell**, requiring only that we preserve the copyright + permission notice. **No copyleft, no BSL, no "hosted-only" license tier anywhere in these packages.** (Caveat under "unverified": I could not fetch a root `LICENSE`/`LICENSE.md` file from GitHub — both 404'd — so the authority is the per-package `license: "MIT"` field, which is the operative declaration for npm consumers anyway.)

---

## EVIDENCE (file paths)

**Org / multi-tenant model**
- `packages/core/src/org/schema.ts` — `organizations` (incl. `allowed_domain`, `a2a_secret`), `org_members` (`role`), `org_invitations` (`status`, `role`).
- `packages/core/src/org/types.ts` — `OrgRole = "owner" | "admin" | "member"`; `OrgContext`, `OrgInfo`.
- `packages/core/src/org/handlers.ts` — role enforcement: `ctx.role === "owner"|"admin"` gates on invite (L352), member-remove (L524), role-change (L593); owner-protection + admin-escalation guards (L544, L622, L630).
- `packages/core/src/org/auto-join-domain.ts`, `accept-pending.ts`, `free-email-providers.ts` — domain-based auto-join (corp-domain → org), free-email exclusion.

**Sharing / access control (the choke points)**
- `packages/core/src/sharing/access.ts` — `assertAccess()`, `resolveAccess()`, `accessFilter()`, `ForbiddenError`, `currentAccess()`. **This is the single place to inject capability/RBAC.**
- `packages/core/src/sharing/schema.ts` — `ownableColumns()` (`ownerEmail`, `orgId`, `visibility: private|org|public`), `createSharesTable()` (`principalType: user|org`, `principalId`, `role: viewer|editor|admin`), `ROLE_RANK`, `roleSatisfies()`.
- `packages/core/src/sharing/registry.ts` — `registerShareableResource()` + per-resource policy flags `allowPublic`, `requireOrgMemberForUserShares`. **Natural home for per-resource capabilities.**

**A2A protocol**
- `packages/core/src/a2a/agent-card.ts` — `protocolVersion: "0.3"`, `securitySchemes.jwtBearer`.
- `packages/core/src/a2a/types.ts` — spec v0.3 types; JSON-RPC 2.0 shapes.
- `packages/core/src/a2a/server.ts` — endpoint mounting, JWT verification (`jose`), per-org-secret resolution, prod-auth-required policy, public-card skill filtering.
- `packages/core/src/a2a/handlers.ts` — `message/send`, `message/stream`, `tasks/get`, `tasks/cancel`; std error codes.
- `packages/core/src/a2a/auth-policy.ts`, `caller-auth.ts`, `task-store.ts` (SQL/Postgres-backed, self-hosted).

**MCP**
- `packages/core/src/mcp/server.ts`, `build-server.ts`, `oauth-route.ts` — server at `/_agent-native/mcp`, OAuth, auth verify.
- `packages/core/src/mcp-client/config.ts` — stdio + Streamable HTTP transports.
- `packages/core/src/mcp/org-directory.ts` — org app directory discovery (cross-app orchestration).

**Dispatch (control plane / orchestra)**
- `packages/dispatch/package.json` — "workspace control plane … vault, integrations, destinations, scheduled jobs, cross-app delegation."
- `packages/dispatch/src/db/schema.ts` — `dispatch_approval_requests`, `dispatch_audit_events`, `dispatch_dreams`/`_dream_proposals`, `vault_secrets`/`_grants`/`_requests`/`_audit_log`, `workspace_resources`/`_resource_grants`, `dispatch_destinations`/`_identity_links`/`_link_tokens`.
- `packages/dispatch/src/actions/ask_app.ts` + `server/lib/mcp-gateway.ts` — cross-app A2A delegation (`callAgent`).
- `packages/dispatch/src/actions/set-dispatch-approval-policy.ts`, `list-dispatch-audit.ts`, `create-vault-grant.ts`, `approve-vault-request.ts` — approval/audit/grant governance.

**License**
- `packages/core/package.json` L?: `"license": "MIT"` (v0.23.0 local; v0.32.0 on main, 2026-06-01). Same for dispatch/embedding/migrate/pinpoint/scheduling. `.changeset/config.json`: `"access": "public"`.

---

## SWAP-DIFFICULTY TABLE

| Part | Difficulty | Seam / file |
|---|---|---|
| **Add enterprise RBAC / capability layer on resource access** | **Moderate** (additive hook, no rewrite) | `sharing/access.ts` — wrap/extend `assertAccess()` + `accessFilter()`; `sharing/registry.ts` for per-type capabilities |
| **Add custom org roles beyond owner/admin/member** | Moderate | `org/types.ts` (`OrgRole`), `org_members.role` column (migration), inline `ctx.role===…` gates in `org/handlers.ts` → replace with capability resolver |
| **Add group/team principals (beyond user/org)** | Moderate | `sharing/schema.ts::createSharesTable` (`principalType` enum), `access.ts::highestShareRole` principal clauses |
| **Per-tenant runtime policy config** | Moderate | new dispatch table + resolver feeding the `access.ts` hook (today flags are per-resource-type, code-time) |
| **Swap A2A transport / auth** | Adapter swap | `a2a/server.ts` (JWT verify), `a2a/caller-auth.ts` (token mint) — both isolated; protocol types in `a2a/types.ts` |
| **Swap LLM gateway off Builder.io** | Trivial config / adapter | `agent/engine/registry.ts` — `AGENT_ENGINE` env selects; `AGENT_ENGINE_PREFER_BYO_KEY=true` skips Builder entirely. Engines: anthropic, ai-sdk, openrouter, builder. (Harness-pillar concern, but confirms gateway is NOT coupled to org/protocol/dispatch.) |
| **Swap transcription off Builder** | Adapter | `transcription/builder-transcription.ts` is one impl behind `server/credential-provider.ts`; replace with own STT |
| **Swap analytics/telemetry** | Trivial config | `tracking/providers.ts` — env-gated PostHog/Mixpanel/Amplitude/AN-Analytics; no hard Builder dep |
| **Org-directory / identity hub origin** | Trivial config | `mcp/org-directory.ts` — `AGENT_NATIVE_ORG_DIRECTORY_URL` / `AGENT_NATIVE_IDENTITY_HUB_URL` env; unset ⇒ local-only |
| **Dispatch self base URL** | Trivial config | `mcp-gateway.ts::dispatchSelfBaseUrl` — `WORKSPACE_GATEWAY_URL`/`APP_URL`/… ; `dispatch.agent-native.com` is only a prod fallback |

---

## HOSTED-COUPLING REALITY (this pillar)

**None of org / sharing / collab / a2a / mcp / mcp-client / router / dispatch has a hard Builder.io hosted dependency.** All state is in the consumer's own SQL/Postgres (libSQL/Drizzle). The Builder.io touch-points are all in *other* pillars and all behind swappable seams:
- **LLM gateway** (`agent/engine/builder-engine.ts`, creds `BUILDER_PRIVATE_KEY`/`BUILDER_PUBLIC_KEY`, base URL overridable via `BUILDER_GATEWAY_BASE_URL`) — one engine in a registry; opt out with `AGENT_ENGINE_PREFER_BYO_KEY=true`.
- **Transcription** (`transcription/builder-transcription.ts`) — one provider behind a credential-provider seam.
- **`agent-native.com` URLs** — appear only as **production fallbacks** (`dispatch.agent-native.com`, `analytics.agent-native.com/track`) when env overrides are unset, plus doc-link strings in `a2a/artifact-response.ts`. All overridable.
- **Templates / hosting** at agent-native.com are a convenience, not a runtime dependency of these modules.

---

## MAPS TO OUR FOUNDATION

- **`@jami-studio/orchestra`** ← **dispatch** (whole package) + **a2a** + **mcp/org-directory** + **mcp-client**. This is the primary mapping: cross-app A2A delegation, org-directory discovery, vault/grants, approvals, audit, scheduled "dreams." Adopt as the orchestra substrate; build declarative multi-agent workflow/DAG on top if needed.
- **`@jami-studio/harness`** ← **a2a** (server/handlers/task-store) + **mcp** (server/oauth) — the per-app agent's protocol endpoints. Engine selection (`agent/engine/*`) is the harness's gateway seam (separate pillar, but the swap is trivial).
- **`@jami-studio/ui`** ← only tangentially: dispatch ships a React control-plane UI (`dispatch/src/components`, `routes/pages`) and `sharing/actions` drive share dialogs. The *primitive-registry* concern is a different pillar; here, the sharing registry is the access-control registry, not the UI-primitive registry.
- **Our permissions/audit needs** ← **sharing/access.ts** (centralized enforcement) + **org** (tenancy) + **dispatch audit/approval** (change governance). Enterprise RBAC is the additive layer over these.

---

## RISKS

1. **Flat permission model.** No capability catalog, no custom roles, no teams/groups today. Our enterprise layer must be built; the seams are good but the policy engine is on us. Risk: if we bolt capabilities on sloppily, we duplicate enforcement and create gaps. Mitigation: funnel everything through `assertAccess()` — never add a second enforcement path.
2. **Version drift / moving target.** Local clone is v0.23.0; `main` is v0.32.0 (core). Pre-1.0, fast-moving (active security PRs referenced in code, e.g. IDOR fix #369). Adopting wholesale means tracking upstream or hard-forking. Recommend: vendor a pinned fork, cherry-pick security fixes.
3. **Per-org secret model.** A2A trust uses a shared `A2A_SECRET` or per-org `a2a_secret` HMAC. Fine for first-party app meshes; for true zero-trust multi-tenant external A2A we'd want per-peer keys / mTLS. Adequate for our single-human-many-agents premise now.
4. **`globalThis` registry pattern** (sharing registry, tracking queue) is a deliberate Vite-SSR-bundle-dedupe hack. Works, but is fragile under different bundlers/runtimes — watch if we change build tooling.
5. **Dispatch is app-to-app + scheduled, not a workflow engine.** If `orchestra` is expected to be a planner/DAG executor, that's net-new; don't over-assume dispatch covers it.

---

## WHAT I COULD NOT VERIFY

- **Root `LICENSE`/`LICENSE.md` file text + copyright holder** — both GitHub raw paths 404'd; no LICENSE file in the local clone root or under `packages/*`. Authority used = per-package `"license": "MIT"` fields (operative for npm) + README "## License → MIT". Recommend confirming the actual LICENSE file (likely present on a different branch/path) before redistribution, purely for the attribution notice.
- **agent-native.com/docs 2026 content** (pricing, hosted-service terms, template licensing) — not fetched this pass; the *code* shows no hosted coupling in this pillar, but hosted-service ToS for the *optional* gateway/transcription/templates should be read before relying on them (we plan to swap them anyway).
- **A2A v0.3 full conformance vs the published spec** — confirmed by code self-declaration and the standard method/error surface, not by running a conformance suite. Streaming is `message/stream` SSE; `pushNotifications: false` on the card (no webhook push — a gap vs full A2A optional features).
- **MCP protocol version string** — transports (stdio/Streamable HTTP) confirmed; exact advertised MCP protocol revision not located in this pass.
- **Real-world dispatch orchestration behavior** — read from source, not exercised against the `voice-prototypes` integration this pass.

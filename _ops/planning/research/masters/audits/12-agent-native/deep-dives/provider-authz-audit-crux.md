# Deep-dive — The Permissions / Access / Audit Crux across External Connections

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

Pillar parent: `integrations-oauth-connections.md` (do not duplicate; this drills only the authz/access/audit boundary).
Source of truth: local clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`, `@agent-native/core` **v0.23.0**, **MIT**.
Date: 2026-06-01. One human, many agents. Auth/users are **per-org isolated** (each org its own db/auth/users).

---

## Committed read

**Broad connect, narrow + audited use — through one policy choke point. No "fancy" connection layer is needed for one-human-many-agents now.**

Let agents connect to whatever they like — the *connection* is allowed to be broad. The crux Jamie named is fully answered by **funnelling every USE through the existing choke point and attributing it in our own log, independent of the provider**. Agent-native already builds that choke point: the connection store is hard-scoped per-org/per-user on *every* query, per-app **grants** gate which agent/app may reuse a connection, and credential resolution is the single function that hands out a token — and it stamps **provenance** (who/which connection/which key/which grant/which scope) and marks `lastUsedAt` on the way through. We do **not** lose permissions/access/auditing by crossing an external connection, because the token never leaves that scoped, request-context-bound path.

The value of a connection system *beyond raw OAuth* is real, but it splits cleanly:

- **AUTHZ + AUDIT + TOKEN-LIFECYCLE → we OWN these, and agent-native already gives ~90% of them.** These are the parts that, if delegated to a provider tool (Nango/Composio), would move our security boundary into a third party. Never delegate. This is non-negotiable and it is the whole answer to the crux.
- **RELIABILITY (retries/backoff, rate-limits, idempotency, inbound webhooks, sync) → mostly NATIVE-sufficient today, one honest gap.** The event-bus + trigger dispatcher own inbound webhooks→agent-run; the scheduler owns run retry/status; the DB layer owns transient-connection retry. The one thing native does **not** provide is a *generic per-provider-call* retry/backoff/idempotency wrapper — today each template reader owns that. That is the only place a provider tool (self-hosted Nango) buys something, and only at long-tail breadth. It does **not** justify a tool now.

So: **no separate authorization server, no policy engine, no connection-broker SaaS.** Add exactly one thin thing of our own — a **central `assertConnectionUse()` gate + an append-only `connection_use` audit row** — wrapping the resolution path agent-native already funnels through. Everything else is adopt-as-is. The planned MS-governance-toolkit RBAC layers *on top of* this gate as the policy source; it does not replace the choke point.

---

## Direct answers to Jamie's questions

**Q: Do we need anything fancy/special, or can we just let agents connect to whatever and keep handling app/agent/tool authz appropriately?**
**A: Just handle authz at the use-point — which agent-native already forces through one function.** "Connect to whatever" is fine. The guarantee you need is that *use* is gated and logged. Three layers already enforce this and you do not build them:

1. **Per-org/per-user isolation is structural, not advisory.** Every read/write in `workspace-connections/store.ts` runs `scopedWhere(requireWorkspaceConnectionScope())` → `org_id = ?` when in an org, else `owner_email = ? AND org_id IS NULL` (lines 542–566). `requireWorkspaceConnectionScope` **throws** without an authenticated user (548). A connection physically cannot be listed, resolved, granted, or used outside its org/owner scope. This is your per-org isolation crux, enforced at the SQL boundary.
2. **The choke point exists and is singular.** `workspace-connections/credentials.ts → resolveWorkspaceConnectionCredentialForApp` is the *only* path that turns a connection into a usable secret value. It (a) requires an authenticated request context (549–557), (b) requires the connection be granted to *this app/agent* (`appAccess.available`, via grants — store.ts 760–823), (c) requires status `connected` for default resolution (420), (d) reads only scoped secrets (`user`/`org`/`workspace`, credentials.ts 216–245), (e) returns `provenance` naming connection/key/grant/scope/backend (481–493), and (f) calls `markWorkspaceConnectionUsed` (474). Every agent tool that touches a provider goes through `createProviderReaderRuntime.read()` → this resolver (`connections/reader.ts:715–851`). That is the one boundary to enforce policy and write audit.
3. **Autonomous agent runs stay scoped too.** The trigger dispatcher (inbound webhook/event → agent run) wraps the whole run in `runWithRequestContext({ userEmail, orgId })` (`triggers/dispatcher.ts:364`) so an agent firing off a Slack event still resolves connections under the creator's org scope — not god-mode. It also **re-validates the run-as user + org membership on every dispatch** (272–315, 337–352, "audit 12 #10"): revoke a user or remove them from the org and their already-scheduled agents stop resolving connections immediately. Token-time authz, not connect-time only.

So you let them connect broadly and you keep doing app/agent/tool authz exactly as you do — but you make the connection resolver enforce it, because that is where breadth becomes use.

**Q: Is the benefit more than visibility — retries, callbacks, etc.?**
**A: Yes, but native already owns most of it; the benefit that would require a *tool* is narrow.**
- **Inbound callbacks/webhooks:** native. Messaging adapters verify HMAC and POST back directly; inbound events go through the typed event-bus (`event-bus/bus.ts`, owner-scoped `EventMeta`) → trigger dispatcher → agent loop. You own this end-to-end, no broker.
- **Retries / status / re-run:** partial-native. The scheduler tracks `lastStatus`/`lastError`/`lastRun` per run and the DB layer has `retryOnConnectionError`/`retryOnDdlRace` for transient drops (`jobs/scheduler.ts:241`). What's **missing** is a generic per-provider-API-call retry/backoff/idempotency-key wrapper — today each template reader implements its own. This is the only "more than visibility" gap.
- **Rate-limit handling, data sync:** not in core; template-owned per provider (reader.ts notes repeatedly: "templates own pagination and rate-limit behavior").
- **Verdict on when a provider tool justifies itself:** only when long-tail OAuth *breadth* (hundreds of providers) collides with not wanting to hand-write each client's refresh+retry+rate-limit. At that point **self-hosted Nango behind the existing `ProviderReader` seam** earns its place (ELv2 → sidecar, never forked/SaaS-wrapped). For the core set (Slack/GitHub/Notion/Gmail/Drive/HubSpot/generic) it is pure bloat. Not now.

**Q: What must we own vs can we delegate?**
| Concern | Own / delegate | Why |
| --- | --- | --- |
| Who-may-use-which-connection (authz/grants) | **OWN** | It is your security boundary; delegating moves per-org isolation into a vendor. |
| Per-org / per-user isolation | **OWN** | Structural in the store; the whole crux. |
| Audit attribution of external calls | **OWN** | Must be provider-independent and in *your* log. |
| Token encryption-at-rest + owner-binding | **OWN** | `app_secrets` AES-256-GCM + `oauth_tokens` 409 owner guard already do it. |
| OAuth dance + token storage for long-tail providers | **delegate-able** (Nango sidecar, optional) | Only the *plumbing*, never the policy; refs live in your vault. |
| Per-call retry/backoff/rate-limit for long-tail | **delegate-able** (Nango sidecar, optional) | Avoids hand-writing N clients at breadth. |

---

## How the boundary is designed (the committed shape)

Broad connect → narrow, audited use through one gate:

1. **Connect (broad):** any user OAuths / pastes a key. `upsertWorkspaceConnection` stores **refs only** (`credential_refs_json`), `sanitizeConfig` strips anything tokeny (`SECRET_KEYS`, store.ts 634–689), and the row is scoped to `owner_email`/`org_id`. Secret *values* go to the AES-256-GCM vault (`app_secrets`) or the per-scope credentials store. The connection itself can be marked `allowedApps: []` (= all apps in the workspace) or narrowed.
2. **Grant (narrow):** to let a specific agent/app reuse a connection, an explicit `workspace_connection_grants` row is required unless the connection is all-apps. `getWorkspaceConnectionAppAccess` returns the mode (`all-apps | allowed-app | explicit-grant | unavailable`, store.ts 760–823). This is the per-agent capability scoping.
3. **Use (gated + audited):** `resolveWorkspaceConnectionCredentialForApp` is the choke point. **Our one addition wraps here:** before returning a value, call `assertConnectionUse({ orgId, userEmail, agentId, connectionId, provider, scopes, appAccessMode })` (the MS-governance RBAC policy source answers it), then write an append-only `connection_use` row from the `provenance` object it already produces. Deny → `ForbiddenError` (mirror `sharing/access.ts:assertAccess`). This is ~one file; it does not change agent-native.
4. **Attribute (provider-independent):** the `WorkspaceConnectionCredentialProvenance` (credentials.ts 48–60) plus the observability trace span (per-span `userId`, redacted tool args) give you who/which-agent/which-connection/which-scope/result without trusting the provider's logs.

The `sharing/access.ts` pattern (`accessFilter` for lists, `assertAccess` for writes, `visibility: private|org|public`, share roles `viewer|editor|admin`) is the *template* to copy for the connection-use gate — same choke-point discipline already used for every shareable resource.

---

## Evidence (file paths in the local source)

| Claim | File : lines |
| --- | --- |
| Per-org/user scope enforced on every connection query; throws unauthenticated | `workspace-connections/store.ts:542–566` |
| Refs-only persisted; `SECRET_KEYS` redactor strips tokens from config | `workspace-connections/store.ts:634–689` |
| Per-app **grants** gate reuse; access modes | `workspace-connections/store.ts:760–823, 1615–1704` |
| **Single use choke point** (auth ctx required, grant required, connected required, scoped read, provenance, markUsed) | `workspace-connections/credentials.ts:366–568` |
| Provenance object (who/connection/key/grant/scope/backend) | `workspace-connections/credentials.ts:48–60, 481–493` |
| Agent tool → connection runtime → resolver wiring | `connections/reader.ts:715–851` |
| Autonomous runs wrapped in org-scoped request context | `triggers/dispatcher.ts:364–366` |
| Run-as user + org-membership re-validated every dispatch (revocation takes effect) | `triggers/dispatcher.ts:272–315, 337–352` |
| OAuth owner-binding, 409 on cross-user re-bind, refresh preserves owner | `oauth-tokens/store.ts:71–174` |
| `hasOAuthTokens` requires owner (fixed cross-user leak) | `oauth-tokens/store.ts:271–283` |
| Proactive Google refresh (timer, expiry buffer, prod-only, keeps row on `invalid_grant`) | `oauth-tokens/google-refresh.ts` |
| Secret vault AES-256-GCM; **prod hard-fails** without `SECRETS_ENCRYPTION_KEY` | `secrets/storage.ts:80–141` |
| Audit substrate = observability traces (per-span `userId`, sensitive-field redaction) | `observability/traces.ts:17–44, 144–276` |
| Inbound events typed + owner-scoped; handler errors isolated | `event-bus/bus.ts:61–120`, `event-bus/types.ts:22–29` |
| Access-control template to copy (`accessFilter`/`assertAccess`/roles) | `sharing/access.ts:84–287` |
| Transient-connection retry at driver level; scheduler tracks status | `jobs/scheduler.ts:241` |

Drift checks (2026-06-01): agent-native core **MIT** confirmed local + GitHub README. Nango **Elastic License 2.0** confirmed (`references/nango/LICENSE`) — self-host sidecar only, never fork/SaaS-wrap. Composio = hosted SaaS pass-through; not adopted, terms moot.

---

## Seams / difficulty

| Add | Difficulty | How |
| --- | --- | --- |
| **Central `assertConnectionUse()` policy gate** (the one "must own" addition) | Small, one file | Call inside `resolveInRequestContext` before returning `value` (credentials.ts ~473); deny → `ForbiddenError`. Policy answer comes from MS-governance RBAC. |
| **Append-only `connection_use` audit row** | Small | Write from the `provenance` + request ctx at the same point; new table beside `workspace_connections`, same `getDbExec`/`ensureColumn` pattern. |
| **Wire MS-governance RBAC as the policy source** | Moderate | The gate calls out to it; RBAC decides `(org, user, agent, provider, scopes) → allow/deny`. Layers on, doesn't replace. |
| **Per-call retry/backoff/idempotency wrapper** (only if breadth) | Adapter swap | New `ProviderReaderRuntimeImplementation` (or Nango sidecar) behind `reader.ts:715`; no core change. |
| **Proactive refresh for a non-Google provider** | Small, net-new | Clone `google-refresh.ts` shape per provider; others refresh reactively. |

---

## Honest downsides

- **No dedicated audit-log table ships in core.** The audit trail today is the *observability trace store* (`agent_trace_spans`/`agent_trace_summaries`) + per-connection/grant `lastUsedAt` + the ephemeral in-memory `provenance`. Traces are sampled/cleanup-jobbed and tuned for cost/eval dashboards, **not** a tamper-evident, retained security audit. The append-only `connection_use` row above is a *real* (small) thing we must build — it is the gap between "visibility" and "audit". Do not hand-wave it.
- **No central policy engine ships either.** Authz today = structural scope + grants + per-resource `assertAccess`. There is no `(subject, action, resource)` policy evaluator; the MS-governance RBAC + our gate is net-new glue (small, but ours to own and keep correct).
- **No generic per-call retry/backoff/idempotency.** Each template reader owns reliability today. Fine at the core-set scale, a real cost at breadth — and the honest trigger for considering Nango.
- **`template-owned` readers = we write the client code.** Core ships the typed contract + credential plumbing, not turnkey Slack/Notion clients. "Adopt wholesale" still leaves per-provider API code to write (budget it).
- **`SECRETS_ENCRYPTION_KEY` rotation invalidates the vault** (key → SHA-256 → symmetric key; old ciphertext won't decrypt). Rotation = re-encrypt migration, not a flag flip.
- **OAuth client registration is per-provider operator work** (Google client id/secret, Slack signing secret). Correct and lock-in-free, but real setup.
- **`oauth_tokens` table is keyed `(provider, account_id)` with an `owner` column, not org-scoped like `workspace_connections`.** Isolation there rests on the 409 owner-guard + owner-required reads, not a `scopedWhere`. Fine for per-user accounts; worth a deliberate look if an org ever shares one provider account across users.

---

## Unverified

- **MS governance toolkit RBAC**: not read in this dive (no source in the agent-native clone). The "layers on top of the gate" claim is architectural intent, not verified against that toolkit's actual API/license. Confirm its policy model `(subject→permission)` shape and self-host/licensing before wiring.
- **Observability retention/cleanup specifics**: I read `traces.ts` (write path + redaction) but did not audit `observability/cleanup-job.ts` for exact retention windows — so "traces are not a retained security audit" is inferred from the cleanup-job's existence + sampling config, not a measured TTL.
- **Nango 2026 provider count / ELv2 wording**: provider breadth (~825) and ELv2 carry over from the parent pillar's 2026-06-01 check; not re-fetched here.
- **No exhaustive audit of `usage/`, `pinpoint/` for any analytics beacon** on the credential path (parent pillar found none on the connection path; not re-verified).

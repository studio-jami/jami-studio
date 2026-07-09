# Spec Review — Architecture holes & seam risks

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

Reviewer lens: architecture holes & seam risks across the harness/orchestra/permissions plan.
Date: 2026-06-01. Isolated planning pass — locks nothing.
Spec under review: `../recommendation.md` + the four pillars + `../deep-dives/*.md`.
Ground truth: `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`
(`@agent-native/core` 0.23.0 clone, 0.32.0 npm latest, MIT) and
`C:\Users\james\projects\rebuild\voice-prototypes`.

---

## VERDICT: **SOUND — with one BLOCKING hole and three must-close gaps before green light.**

The architectural spine is correct and evidence-backed. I verified the load-bearing claims
against source and they hold: the engine/loop is engine-agnostic and Builder is one of N
registered engines (drop = config); the `DbExec` seam is real and Postgres is first-class;
`sharing/access.ts` is a genuine single choke point (`assertAccess` + `accessFilter` are the
only gates, confirmed by reading the file); transcription already fans out to 5 backends with
Builder as one optional branch. The two big unverified bets **both check out**: the Microsoft
`agent-governance-toolkit` is a **real, MIT, in-process, self-hostable** library shipping a
TypeScript SDK (`@microsoft/agent-governance-sdk`), and BetterAuth's per-org-isolated-db shape
is native. This is a legitimate stand-on-shoulders adoption, not a hand-wave.

But the spec has **one blocking hole** and **three under-specified seams** that a real review
must not pass:

1. **BLOCKING — the data-model / hierarchy mapping (System>Org>Project + entitlements +
   capability grants) is asserted as "mapped beforehand" but is specified NOWHERE.** It is the
   single largest undefined contract, and every other swap (RBAC layering, per-org isolation,
   capability grants) depends on it.
2. The `oauth_tokens` isolation gap is **real and confirmed in source**, not theoretical.
3. The MS toolkit is **public preview / pre-GA** — adopting it as the enforcement spine inherits
   breaking-change risk on the security-critical path.
4. "One choke point" is **true for shareable resources but NOT yet true system-wide** — there are
   at least three distinct enforcement surfaces the spec treats as one.

None of these invalidate adoption. All are closable. Details below.

---

## HOLES (what is unanswered / hand-waved, with where)

### H1 (BLOCKING) — The hierarchy/data-model is the biggest undefined contract in the spec.
The crux dive's header states "Auth/users are per-org isolated (each org its own db/auth/users)"
and the recommendation assumes a `System > Org > Project + entitlements + capability grants`
hierarchy "is mapped beforehand" (review brief). **It is not mapped anywhere in the spec.**
- agent-native gives you `organizations` + `org_members(role)` (`org/schema.ts`) and per-resource
  `ownerEmail|orgId|visibility` (`sharing/schema.ts`) — i.e. a **two-level** Org>Resource model.
  There is **no Project tier, no System tier, no entitlement-key table, no capability-grant
  catalog** in the foundation. The recommendation §6 itself admits the capability catalog,
  team/group principals, custom roles, and per-tenant policy "must be added by us."
- So the spec layers RBAC + capabilities + the MS toolkit + `assertConnectionUse()` **on top of a
  data model that does not exist yet**. The policy hook signature is even quoted two different ways
  — `policyCheck(capability, principal, resource)` (recommendation §3) vs the toolkit's actual
  `evaluate({tool_name, action, ...})` context shape (verified on the repo). Those must be
  reconciled against a real schema before any of it is buildable.
- **Where:** recommendation §6 ("defaulting to the committed end-shape"), crux dive §"How the
  boundary is designed". Both reference the hierarchy as settled; canon §4 lists auth topology as
  *genuinely open*. The spec is leaning on an open item as if closed.

### H2 — `assertConnectionUse()` + `connection_use` audit row is named but unshaped.
The crux dive is the most honest part of the spec and explicitly says this is "a *real* (small)
thing we must build … Do not hand-wave it." Good. But the shape is still missing: the table DDL,
the retention policy, what "append-only" means on Postgres/SQLite (no enforcement primitive named),
how it relates to the toolkit's own tamper-evident "Merkle audit" / "Decision BOM" (verified to
exist — so there may be **two** audit logs, the toolkit's and ours, with no stated relationship),
and whether the row is written before or after the provider call (attribution of *attempts* vs
*successes*). Undefined contract on the security-critical path.

### H3 — "Rebind transport to AG-UI" is the least-specified swap.
recommendation §3 calls AG-UI an "adapter swap on the SSE/endpoint contract." But the UI pillar
shows the binding is **not** a single SSE endpoint — it is SSE streaming **plus** `application_state`
polling **plus** `use-db-sync.ts` (`useDbSync`/`useFileWatcher`/`useScreenRefreshKey`) **plus**
React Query, all over `/_agent-native/*`. AG-UI is an event-stream protocol; the spec never says
what happens to the **polling + file-watch + shared-state** half of the contract under AG-UI, nor
who owns the `ui.tree.render`/`ui.action.invoke` ↔ AG-UI event mapping. The shadcn dive admits
"no official shadcn+AG-UI render example found; the `UiTreeRenderer` is ours to build." This is a
net-new protocol-bridge build mislabeled as an "adapter swap." Not a blocker, but the effort and
seam count are understated.

### H4 — The accent-token generator is asserted root-correct but has no spec.
recommendation §3 item 5 and the shadcn dive agree the 6 hardcoded tints must become "a tokenized
accent generator." Neither says **what the generator's input/output contract is** (one seed color
→ which derived tokens? OKLCH ramp algorithm? contrast-guarantee against WCAG?). "Tokenized accent
generator" is a goal, not a design. Low risk, but per canon §0 "root-correct" this is exactly the
kind of thing that gets under-built into "three hardcoded colors with extra steps."

### H5 — Per-provider client code is repeatedly flagged "ours to write" but never budgeted/scoped.
Three separate documents (integrations pillar, provider-landscape dive, crux dive) note that
`template-owned` readers mean core ships the contract, not turnkey Slack/Notion/HubSpot clients —
plus per-call retry/backoff/idempotency, plus proactive refresh for non-Google providers. The spec
acknowledges this but never lists *which* providers are in the core set, how many client modules
that is, or the per-call-reliability wrapper's shape. For a "full-final-shape, no MVP" canon, an
unscoped "budget for it" is a hole.

---

## RISKS (severity + concrete mitigation)

### R1 — `oauth_tokens` is NOT org-scoped like `workspace_connections`. **Severity: HIGH.**
Confirmed in source, not theoretical. `oauth-tokens/store.ts`:
- PK is `(provider, account_id)` with a nullable `owner` column (lines 14-23).
- `getOAuthTokens(provider, accountId)` (line 47) reads with `WHERE provider = ? AND account_id = ?`
  and **takes no owner/org argument** — there is no read-time scope enforcement. The
  `storing-data` SKILL.md even teaches `getOAuthTokens("google", "user@gmail.com")` directly.
- Isolation rests entirely on (a) the write-time 409 owner-guard (`saveOAuthTokens`) and
  (b) `hasOAuthTokens(provider, owner)` requiring an owner (the post-leak fix). The **read path
  has neither**. By contrast `workspace-connections/store.ts` enforces `scopedWhere(...)` →
  `org_id = ?` on *every* query and throws when unauthenticated.
This means under per-org-isolated-DBs the row is physically in the org's DB (fine), but **within a
multi-user org sharing one provider account**, any code path that resolves a token by
`(provider, account_id)` bypasses owner attribution — exactly the cross-user-leak class the
2026-04-29 incident produced, except on the read side the structural guard was never added.
The crux dive flags this in one line ("worth a deliberate look if an org ever shares one provider
account across users") but ranks it too low.
- **Mitigation:** add a `scopedWhere`/owner-required form to the `oauth_tokens` read path
  (mirror `workspace_connections`), and route ALL token reads through
  `resolveWorkspaceConnectionCredentialForApp` (which *is* scoped) rather than the bare
  `getOAuthTokens`. Make `assertConnectionUse()` cover the OAuth-token path, not just the
  workspace-connection path. This is a fork-time hardening, small, but must be on the green-light
  checklist.

### R2 — MS `agent-governance-toolkit` is public preview / pre-GA. **Severity: MED.**
Verified real and fit-for-purpose (MIT, in-process, `@microsoft/agent-governance-sdk` on npm,
Agent OS sub-ms policy engine, YAML/JSON/OPA-Rego/Cedar policy languages, `allow|deny|require_approval`
decisions, tamper-evident audit). But the repo states "public preview … may have breaking changes
before GA." Wiring it as the **single enforcement spine** means a pre-GA dep sits on the
security-critical choke point.
- **Mitigation:** keep the toolkit *behind* our own `policyCheck()` interface at `assertAccess()` —
  i.e. our gate calls the toolkit, the app never calls the toolkit directly. Then a breaking
  toolkit change touches one adapter file, not every resolver. Pin the version; track the changelog
  like agent-native and BetterAuth (the spec already commits to pinned forks for those). Default-deny
  on toolkit-evaluation error so a preview-stage bug fails closed, never open.

### R3 — Version drift across THREE pre-1.0 security-critical deps at once. **Severity: MED.**
agent-native (0.23.0 clone vs 0.32.0 npm, active security PRs incl. IDOR #369), BetterAuth (1.6.x,
"steady stream of security fixes"), and the MS toolkit (pre-GA) are **all** pre-stable and **all**
on the auth/permissions path. The spec mitigates each individually ("pinned fork, cherry-pick") but
never addresses the **compound** maintenance load of tracking three fast-moving security upstreams
for a one-human operator.
- **Mitigation:** one documented fork-and-pin policy covering all three, with a single re-verify
  checklist of the named seam files (`registry.ts`, `db/client.ts`, `sharing/access.ts`, `a2a/*`,
  `better-auth-instance.ts`, `identity-sso.ts`, plus the toolkit adapter) run at every bump. Budget
  it as recurring ops, not one-time. This is the realistic tax of "bleeding-edge" on the security
  plane and should be stated, not buried.

### R4 — "One choke point" is aspirational, not yet structural. **Severity: MED.**
The spec repeatedly promises a single enforcement path ("Never add a second enforcement path").
But ground truth shows **at least three distinct gates today**, not one:
- `sharing/access.ts::assertAccess` — shareable resources.
- `org/handlers.ts` — inline `ctx.role === "owner"|"admin"` string comparisons (invite/remove/
  role-change), a **separate** enforcement surface the org-pillar itself says must be replaced with
  a capability lookup.
- `workspace-connections/credentials.ts` — the connection-use resolver (where `assertConnectionUse`
  goes), a **third** gate.
- plus the bare `oauth_tokens` read path (R1) which is currently **un-gated**.
So "funnel everything through the one choke point" is the *target state*, but the spec presents it
as the current reality of the foundation. Bypass paths exist: direct DB access, the bare
`getOAuthTokens`, and any future resolver that doesn't call into the gate.
- **Mitigation:** the spec must enumerate the *full* set of resolvers that need the policy hook and
  state the convergence plan (one `policyCheck()` called from all three+ gates), plus a CI guard
  (in the spirit of the existing `guard-no-unscoped-credentials.mjs`) that fails the build if a
  new resolver reads a credential/resource without going through the gate. Without the guard, "one
  choke point" erodes the first time an agent adds a resolver.

### R5 — Cross-org leakage via shared OSS packages + `globalThis` registry. **Severity: LOW-MED.**
Per-org isolation is "each org its own db/auth/users," but harness/registry/orchestra are **shared
code**. The `sharing/registry.ts` and tracking queue use a `globalThis` singleton (a deliberate
Vite-SSR bundle-dedupe hack, flagged in two pillars). In a multi-instance-per-org deployment this is
fine **if** each org is a separate process/runtime. The risk is a future "one process serves multiple
orgs" topology (e.g. the unified yrka.io interface composing suites) where a `globalThis` registry
would be **process-global, not org-scoped** — the resource-type registrations and tracking state
would be shared across orgs in one process.
- **Mitigation:** make the deployment boundary explicit in the spec — *one process per org* is the
  isolation guarantee; the `globalThis` registry is only safe under that assumption. If the unified
  interface ever multiplexes orgs in one process, the registry must move to request-context scope.
  State this as a hard constraint, not an implementation detail.

### R6 — Voice realtime lane: built-but-unproven, concrete failure modes open. **Severity: MED (scope), LOW (architecture).**
The transcription/voice dive is admirably honest: dictation is done and self-host-shaped (trivial),
but the realtime voice agent has **zero qualitative proof** — locked rule #14 blocked the paid live
eval. The concrete unknowns that could make a lane unusable:
- **Latency / barge-in feel** — never measured. Could make any lane feel bad regardless of plumbing.
- **Reconnect on `goAway`** — explicitly NOT auto-handled in the Gemini Live lane (WS5 blocker:
  adapter captures the resumption handle, hook doesn't auto-reconnect on the 10-min reset). A
  production voice surface fails without this.
- **Cost** — realtime is $0.18–0.46/min uncached, ~25–60× batch dictation; a runaway loop is
  expensive (canon §1 "contain runaway token spend").
- **The one hard Builder coupling left** is the realtime STT *dictation* lane
  (`google-realtime-session.ts` mints its WS session with Builder auth) — self-hosting it = standing
  up our own WS audio bridge (the voice-prototypes Vertex proxy is the pattern).
- **Mitigation:** before voice goes on any roadmap surface — (1) run the approved paid live-eval
  sitting to get latency/barge-in/correctness numbers and pick ONE lane; (2) harden `goAway`
  auto-reconnect in the chosen adapter; (3) put model slugs in config (already the pattern) and add
  a per-session cost ceiling. Dictation can ship now; voice is a separate deliberate surface. The
  architecture (provider-agnostic `ProviderAdapter`) is sound — the proof is what's missing.

### R7 — Nango ELv2 + Composio exclusion is correct but breadth-vs-build is unscoped. **Severity: LOW.**
The license reasoning is sound and verified (Nango ELv2 in the local clone LICENSE; self-host sidecar
only, never forked/SaaS-wrapped). The risk is purely scope: the core-provider set is hand-written
(R3/H5), and the "demand-gated, not now" Nango deferral is a **phase/defer framing** that brushes up
against canon §1's "no defer-until-demand" rule. It's defensible (the seam is real and unbuilt-cost
is zero until used) but should be stated as "the seam is part of the final shape; the Nango sidecar
is an operator deployment choice behind it," not "build later."

---

## BETTER-SUITED ALTERNATIVES (steelmanned, then judged)

### A1 — Policy engine: OPA/Rego or AWS Cedar *directly*, instead of the MS toolkit wrapper.
**Steelman:** OPA (Open Policy Agent, CNCF graduated) and Cedar (AWS, open-source, formally verified)
are mature, GA, battle-tested authorization engines with stable APIs — the opposite of a pre-GA
preview. Cedar in particular is designed for exactly `(principal, action, resource, context)`
RBAC/ABAC and is provably decidable.
**Judgment: the MS toolkit still wins, but the steelman exposes a hedge.** Crucially, the MS toolkit
**embeds both OPA Rego and Cedar as its policy languages** (verified) — so adopting the toolkit does
*not* lock out Cedar/Rego; it gives them plus agent-specific concerns (tool-call interception,
agent-mesh, OWASP Agentic Top-10 mapping, Ed25519 plugin signing) that raw Cedar/OPA lack and that
this one-human-many-agents system specifically needs. The right move is the toolkit **with policies
authored in Cedar or Rego**, so if the toolkit's preview status ever bites, the policy *content* is
portable to a raw Cedar/OPA engine behind the same `policyCheck()` interface. **Adopt the toolkit;
author policies in Cedar/Rego for portability; keep it behind our own interface (R2).** This is
strictly better than the spec's current "MS toolkit" with no portability hedge stated.

### A2 — Identity: WorkOS / Auth0 / Clerk instead of BetterAuth.
**Steelman:** managed auth removes the "N auth stores + N migrations + N secrets" operational tax the
betterauth dive honestly flags, and ships enterprise SSO/SCIM/directory-sync as a product.
**Judgment: reject — BetterAuth wins on the committed first principle.** Per-org-isolated db/auth/users
is the *stated direction*, and a managed provider makes "each org its own auth" into either
provider-lock-in × N projects or a shared-tenant model that defeats isolation (betterauth dive (c)).
BetterAuth is MIT, library-not-service, already in the foundation, and ships SSO/SAML/SCIM/MFA/passkeys
as first-party plugins. The BYO-auth escape hatch (`createAuthPlugin({ getSession })`) means a managed
provider can still drop in later behind the same seam if the N-stores tax ever dominates. Spec choice
holds; the operational tax (R3) is the honest cost of the chosen isolation.

### A3 — Workflow/orchestra: a real DAG engine (Temporal, Inngest, Restate) instead of dispatch + "build a DAG if needed."
**Steelman:** dispatch is delegation + cron + governance, explicitly *not* a planner/DAG executor
(stated in two pillars). If orchestra needs durable multi-step workflows with retries,
compensation, and replay, Temporal/Restate are the proven durable-execution engines and rebuilding
that is a classic NIH trap.
**Judgment: defer-correct, but the spec should name the seam.** The spec's "declarative DAG engine *if
and when* orchestra needs more than delegation + scheduled jobs" is the right call for a one-human
system today (a DAG engine now would be canon §0 over-engineering bloat). But it should explicitly
name **where** such an engine would attach (on top of dispatch's event-bus + run-manager) and that
Temporal/Restate/Inngest are the adopt-not-build candidates when the need is real — so the future
need isn't accidentally hand-rolled. Minor addition, not a change of direction.

### A4 — Per-call reliability: adopt a typed API-client framework instead of hand-written readers.
**Steelman:** the per-provider retry/backoff/rate-limit/idempotency wrapper (H5, the one "more than
visibility" gap in the crux dive) is exactly what libraries like `ky`/`got` (retry) + a small
idempotency layer give for free; hand-writing it per reader invites drift.
**Judgment: adopt a shared reliability wrapper, don't hand-roll per reader.** This is a genuine gap the
spec under-specifies. The fix is small and in-bounds: one shared `ProviderReader` HTTP wrapper
(retry/backoff/idempotency/45s-abort, consistent with the existing abort pattern) that every
hand-written client uses — rather than each template reader owning reliability separately (today's
state). Closes H5's drift risk cheaply.

---

## PROOF-OF-WORK NEEDED before green light

1. **Specify the hierarchy data model (H1, BLOCKING).** Concrete schema for
   System>Org>Project + entitlement-keys + capability-catalog + team/group principals, and how it
   maps onto agent-native's `organizations`/`org_members`/`*_shares`. Reconcile the
   `policyCheck(...)` signature with the toolkit's `evaluate({...})` context. Until this exists,
   RBAC/capabilities/`assertConnectionUse` are building on sand.
2. **Diff 0.32.0 against the 0.23.0 clone** for the named seam files
   (`registry.ts`, `builder-engine.ts`, `ai-sdk-engine.ts`, `db/client.ts`, `sharing/access.ts`,
   `a2a/*`, `better-auth-instance.ts`, `identity-sso.ts`, `transcribe-voice.ts`). The spec relies on
   0.23.0 reads; 9 minors of drift on the security plane is unaudited.
3. **Close the `oauth_tokens` read-scope gap (R1)** — add owner/org-required reads, route all token
   reads through the scoped resolver, cover it with `assertConnectionUse` + a CI guard.
4. **Build a toolkit spike (R2):** prove `@microsoft/agent-governance-sdk` evaluates a
   `(principal, action, resource)` decision in-process behind our `policyCheck()` interface, fails
   closed on error, and that its audit log and our `connection_use` row don't duplicate/conflict (H2).
5. **Spec the AG-UI rebind as a protocol bridge, not an adapter swap (H3):** define what happens to
   `application_state` polling + file-watch + the `ui.tree.render`/`ui.action.invoke` ↔ AG-UI mapping.
6. **Run the approved live voice eval (R6):** latency/barge-in/correctness numbers, pick one lane,
   harden `goAway` reconnect, add a per-session cost ceiling — before voice enters any roadmap surface.
7. **Define the accent-token generator contract (H4)** and the core-provider list + shared reliability
   wrapper (H5/A4).
8. **State the per-org deployment boundary (R5):** one-process-per-org as the isolation guarantee; the
   `globalThis` registry is only sound under it.

---

## UNVERIFIED (carry as fork-time checks)

- **0.32.0 vs 0.23.0 seam diff** — not performed; all source reads are 0.23.0 (proof-of-work #2).
- **MS toolkit decision-API exact TypeScript shape** — confirmed it exists, is MIT, in-process, npm
  (`@microsoft/agent-governance-sdk`), preview, with `allow|deny|require_approval` + tamper-evident
  audit and Cedar/Rego policy languages (verified via repo + Microsoft Open Source blog 2026-04-02).
  The precise `evaluate()` signature and whether its audit subsumes our `connection_use` row were not
  exercised in code — spike needed (proof-of-work #4).
- **`oauth_tokens` consumers beyond the bare store** — confirmed the unscoped `getOAuthTokens` read and
  the SKILL.md teaching it; did not trace every call site to prove which already pass a correct
  `accountId` vs which trust ambient scope.
- **Whether voice-prototypes lanes still type/build at 0.32.0** — clone is 0.23.0; not re-verified.
- **Root LICENSE attribution holder** for agent-native (per-package MIT confirmed; root file 404'd in
  prior passes) — relied on per-package fields; confirm the notice text before redistribution.

---

### Sources (dated, official)
- Microsoft Agent Governance Toolkit — repo: <https://github.com/microsoft/agent-governance-toolkit>;
  launch blog (2026-04-02): <https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/>;
  architecture deep-dive: <https://techcommunity.microsoft.com/blog/linuxandopensourceblog/agent-governance-toolkit-architecture-deep-dive-policy-engines-trust-and-sre-for/4510105>;
  OWASP mapping: <https://github.com/microsoft/agent-governance-toolkit/blob/main/docs/compliance/mcp-owasp-top10-mapping.md>.
- Ground-truth source files (quoted): `oauth-tokens/store.ts` (PK + unscoped `getOAuthTokens` read),
  `sharing/access.ts` (single choke point `assertAccess`/`accessFilter`), `workspace-connections/store.ts`
  (`scopedWhere` org enforcement, per crux dive lines 542-566), `org/handlers.ts` (inline role gates).
- Prior verifications carried from the spec's own dives: BetterAuth 1.6.x MIT
  (<https://www.better-auth.com/docs>), Nango ELv2 (local clone LICENSE), shadcn CLI v4 / namespaced
  registries (<https://ui.shadcn.com/docs/registry>), OpenAI/Deepgram/Gemini realtime pricing (voice dive §7).

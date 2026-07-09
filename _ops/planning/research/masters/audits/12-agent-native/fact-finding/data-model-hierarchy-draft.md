# Fact-Finding — System>Org>Project + entitlements + capability-grants — data-model draft (H1)

Date: 2026-06-01. Author: fact-finding agent for Jamie (<jamie@yrka.io>).
**Committed direction (greenfield), pending Jamie's final green-light to lock into canon.** This closes
the proof-of-work gate item **PW3 / H1** in
`C:\Users\james\dev\docs\research\12-agent-native\spec-review\spec-readiness.md` (lines 41, 185).

---

## 1. Verdict (lead)

**H1 is closable with a purely ADDITIVE schema layer — no fork of agent-native's tables is
required.** The foundation ships exactly what the spec claimed: **Org > Resource only**
(`organizations` + `org_members`; ownable resources carry `owner_email | org_id | visibility` and a
companion `*_shares` table with `viewer|editor|admin` roles). It ships **no Project tier, no
entitlement-key table, no capability catalog, no team/group principal**. All four are missing and
must be *added*, not patched into core.

The draft below layers them as **new tables keyed to the existing `org_id` / `org_members` / email
principals**, so core's `sharing/access.ts`, the (to-be-built) `assertConnectionUse`, and the audit
row all bind to a schema that already exists. The two isolation facts are expressed cleanly:
inter-org = separate DB/auth/users per org (a deployment fact, not a row); intra-org ala-carte =
rows in a new `capability_grants` table (`user has business-suite + media-suite but NOT
research-suite` is three present rows and one absent row).

**The policy-hook reconciliation is now VERIFIED against the real SDK, not inferred.** The spec's
`policyCheck(capability, principal, resource)` and the toolkit's `evaluate()` are reconciled by a
single thin adapter: the real package is **`@microsoft/agent-governance-sdk@4.0.0`** and its
`PolicyEngine` exposes **`evaluate(action: string, context: Record<string,unknown>)
→ 'allow'|'deny'|'review'`** (legacy/flat) and **`evaluatePolicy(agentDid: string, context) →
PolicyDecisionResult { allowed, action: 'allow'|'deny'|'warn'|'require_approval'|'log', approvers,
… }`** (rich). Our `policyCheck` maps `capability → action`, and `{principal, resource, scope}` →
`context`. One coherent interface, one choke point.

---

## 2. What EXISTS in agent-native today (verified, with file paths)

Ground truth: `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`
(`@agent-native/core` clone 0.23.0).

### 2.1 Org tier — `org/schema.ts`
`packages/core/src/org/schema.ts` (verified this pass):
- `organizations { id PK, name, created_by, created_at, allowed_domain, a2a_secret }`
- `org_members { id PK, org_id, email, role, joined_at }`
- `org_invitations { id PK, org_id, email, invited_by, created_at, status, role }`

Roles (`org/types.ts`): **`OrgRole = "owner" | "admin" | "member"`** — flat, three values.

NOTE on a second org table family: `server/better-auth-instance.ts` ALSO defines BetterAuth's own
`organization` / `member` / `invitation` tables (lines 311–338 pg, 398–425 sqlite) keyed by
`organization_id` + `user_id`, with `session.active_organization_id` (lines 282/369). So there are
**two org representations**: agent-native's app-level `organizations`/`org_members` (keyed by
**email**) and BetterAuth's identity-level `organization`/`member` (keyed by **user_id**). The
app-level pair is the one `sharing/access.ts` and the connection store read. Our additive layer keys
to the **app-level** `org_id` + email principal (see §6 reconciliation).

### 2.2 Resource tier — `sharing/schema.ts`
`packages/core/src/sharing/schema.ts` (verified):
- `ownableColumns()` spread → every ownable resource gets
  `owner_email (NOT NULL default 'local@localhost')`, `org_id (nullable)`,
  `visibility ('private'|'org'|'public', default 'private')`.
- `createSharesTable(name)` → `{ id PK, resource_id, principal_type ('user'|'org'), principal_id,
  role ('viewer'|'editor'|'admin', default 'viewer'), created_by, created_at }`.
- `ROLE_RANK = { viewer:1, editor:2, admin:3, owner:4 }`; `roleSatisfies(actual, min)`.

### 2.3 Access resolution — `sharing/access.ts`
`packages/core/src/sharing/access.ts` (verified): `accessFilter()` builds the list WHERE clause;
`resolveAccess(type, id) → { role, resource } | null`; `assertAccess(type, id, minRole)` throws
`ForbiddenError(403)`. Principals admitted: **owner_email match**, **visibility='org' + org_id
match**, **visibility='public'**, **`user` share row (principalId=email)**, **`org` share row
(principalId=org_id)**. This is the **one real choke point** the spec wants `policyCheck` to wrap.

### 2.4 Per-app capability grants — `workspace-connections/store.ts`
`packages/core/src/workspace-connections/store.ts` (verified): two tables created at runtime via
`ensureWorkspaceConnectionsTable()`:
- `workspace_connections { id PK, provider, label, account_id, status, scopes_json, config_json,
  allowed_apps_json, credential_refs_json, owner_email, org_id, created_at, … }`
- `workspace_connection_grants { id PK, connection_id, provider, app_id, scopes_json, config_json,
  credential_refs_json, granted_by_email, owner_email, org_id, created_at, last_used_at }`
  with **UNIQUE(connection_id, app_id)**.

Every query is org/owner-scoped via `scopedWhere()` (lines 556–566): `org_id = ?` when an org is
active, else `owner_email = ? AND org_id IS NULL`. **This is the existing precedent for "subject →
capability(app) → scope(org)" and the template our `capability_grants` should follow.**

### 2.5 Provider/capability vocabulary — `connections/catalog.ts` + `connections/types.ts`
`connections/types.ts` (verified): `WorkspaceConnectionCapability = search|import|messages|meetings|
crm|code|docs`; `WorkspaceConnectionTemplateUse = analytics|brain|calendar|clips|content|design|
dispatch|forms|mail|slides|videos`; `WorkspaceConnectionCredentialKey { key, label, required }`.
This is a **connection** capability vocabulary — NOT a product/feature entitlement catalog. It is
the closest existing thing to a capability catalog, and our `capabilities` catalog should sit beside
it (product/feature-level), not replace it.

### 2.6 What is MISSING (must be added, confirmed by absence)
- **Project tier** — no table between Org and Resource. Resources hang directly off `org_id`.
- **Entitlement-key table** — none. No `entitlement_keys`, no plan/SKU table.
- **Capability catalog** — none at the product/feature level (only the connection-capability enum).
- **Team / group principal** — `principal_type` is hard-enumerated **`'user' | 'org'`** only
  (`sharing/schema.ts:70`). No `team` principal exists.
- **`assertConnectionUse()`** — **does NOT exist in source** (grep: zero matches in
  `packages/core/src`). It is spec-invented. The real reuse gate is
  `resolveWorkspaceConnectionForApp()` + `markWorkspaceConnectionUsed()`.
- **`connection_use` audit row / `policyCheck`** — **do NOT exist in source** (zero grep matches).
  Both are spec-invented names (H5 and H1 respectively).

---

## 3. The two isolation facts, as design (CONFIRMED, not questioned)

### Fact 1 — INTER-ORG isolation = separate DB / auth / users per org
The 3 orgs (e.g. yrka.io, jami.studio, jnh.org) each own their **own database, own BetterAuth
instance, own user table**. This is a **deployment-topology fact, not a schema row**: there is no
cross-org foreign key, no shared `organizations` row spanning two orgs. agent-native already assumes
this — `better-auth-instance.ts:876-877` explicitly notes first-party apps "do not use [shared
cookies] because their auth DBs are separate." Our model adds **nothing** here; it just records the
constraint: *one process / one DB / one auth per org; `org_id` is unique only within an org's DB.*
(Supports the spec's LOW-MED `globalThis` constraint at spec-readiness.md:72 — one-process-per-org.)

### Fact 2 — INTRA-ORG ala-carte = ONE identity + capability grants (Jamie's unified interface)
Inside **yrka.io's single org/DB/auth**, the suites (business / media / research / free-tools) share
**one login** (one `user` row, one `org_members` row). Product access is **ala-carte**, expressed as
rows in `capability_grants` — NOT as a monolithic plan column. "User has business-suite + media-suite
but not research-suite" is:

```
capability_grants:
  (subject_type='user', subject_id='jamie@yrka.io', capability_key='suite.business', scope_org='yrka', state='active')   -- present
  (subject_type='user', subject_id='jamie@yrka.io', capability_key='suite.media',    scope_org='yrka', state='active')   -- present
  -- NO row for capability_key='suite.research'  → research-suite is denied by absence (default-deny)
```

Granularity is free: grant a whole suite (`suite.business`), one app (`app.dispatch`), or one
feature (`feature.voice.realtime`) — all are just `capability_key` values in the catalog. This is
exactly the connection-grant pattern (§2.4) lifted to the product/feature plane.

---

## 4. The additive DDL (committed shape, pending green-light)

Design rules followed: (a) **no ALTER of core tables** — only new tables; (b) key to existing
`org_id` (app-level) + email principals; (c) mirror the `scopedWhere` / `ownableColumns` idioms so
core's helpers keep working; (d) dialect-agnostic (Postgres + SQLite), matching core's
runtime-`CREATE TABLE IF NOT EXISTS` style.

> **NAMING (Jamie, 2026-06-01): natural names, no ownership prefix.** The codebase is a fully-owned
> fork — it is all ours, so there is no "core vs ours" split to mark, and an owner prefix is wasted
> weight. Tables use natural names: `projects`, `resource_projects`, `capabilities`, `entitlement_keys`,
> `teams`, `team_members`, `capability_grants` (indexes `idx_projects_org`, etc.). The DDL below uses
> these names directly.

### 4.1 Project tier (between Org and Resource)
```sql
CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL,            -- FK → organizations.id (app-level, email-keyed org)
  parent_id    TEXT,                     -- nullable; self-FK for nested projects if ever needed
  key          TEXT NOT NULL,            -- stable slug, unique within org (e.g. 'q3-campaign')
  name         TEXT NOT NULL,
  suite_key    TEXT,                     -- optional: which suite this project belongs to (capability_key)
  created_by   TEXT NOT NULL,            -- email
  created_at   INTEGER NOT NULL,
  archived_at  INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_org_key ON projects (org_id, key);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects (org_id);
```
**Resource → Project linkage WITHOUT forking ownable resources:** rather than ALTER every ownable
table to add `project_id`, add ONE association table so the Project tier is fully additive:
```sql
CREATE TABLE IF NOT EXISTS resource_projects (
  resource_type TEXT NOT NULL,   -- matches the sharing registry resource-type name
  resource_id   TEXT NOT NULL,   -- = the ownable resource's id
  project_id    TEXT NOT NULL,   -- FK → projects.id
  org_id        TEXT NOT NULL,   -- denormalised for scoped queries
  added_by      TEXT NOT NULL,
  added_at      INTEGER NOT NULL,
  PRIMARY KEY (resource_type, resource_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_resource_projects_project ON resource_projects (project_id);
```
*(Forward option, if/when the fork is comfortable touching `ownableColumns()`: add a nullable
`project_id` column there instead — strictly an optimisation, not needed for the committed shape. The
association table keeps H1 closable with zero core edits.)*

### 4.2 Capability catalog (the product/feature vocabulary that's missing)
```sql
CREATE TABLE IF NOT EXISTS capabilities (
  key          TEXT PRIMARY KEY,         -- e.g. 'suite.business', 'app.dispatch', 'feature.voice.realtime'
  kind         TEXT NOT NULL,            -- 'suite' | 'app' | 'feature'
  label        TEXT NOT NULL,
  parent_key   TEXT,                     -- 'feature.voice.realtime' → parent 'app.voice'; nullable
  description   TEXT
);
```
Seed rows express the suite tree, e.g. `suite.business`, `suite.media`, `suite.research`,
`suite.free-tools`, then `app.*` under each, then `feature.*` under apps. This is the catalog
`policyCheck`'s `capability` argument is validated against.

### 4.3 Entitlement-keys (the sellable SKU layer; grants are minted FROM these)
Keeps "what is sold" separate from "what is granted", so a purchase/license issues one
`entitlement_key` that expands into N capability grants.
```sql
CREATE TABLE IF NOT EXISTS entitlement_keys (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL,
  sku           TEXT NOT NULL,           -- e.g. 'business-suite-monthly'
  grants_json   TEXT NOT NULL,           -- JSON array of capability_keys this SKU confers
  status        TEXT NOT NULL DEFAULT 'active',  -- 'active'|'suspended'|'expired'
  issued_to     TEXT,                    -- email or NULL for org-wide
  issued_at     INTEGER NOT NULL,
  expires_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_entitlement_keys_org ON entitlement_keys (org_id);
```

### 4.4 Team / group principal (the third principal type)
Core's `principal_type` enum is closed to `'user'|'org'`; add teams as a NEW principal without
touching the enum (the share row stays `'org'` for org-wide; team membership is resolved by the
adapter at check time — see §6):
```sql
CREATE TABLE IF NOT EXISTS teams (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL,
  key         TEXT NOT NULL,             -- slug unique within org
  name        TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_org_key ON teams (org_id, key);

CREATE TABLE IF NOT EXISTS team_members (
  team_id    TEXT NOT NULL,
  org_id     TEXT NOT NULL,
  email      TEXT NOT NULL,             -- the user principal, same key space as org_members.email
  role       TEXT NOT NULL DEFAULT 'member',  -- 'lead'|'member'
  added_at   INTEGER NOT NULL,
  PRIMARY KEY (team_id, email)
);
```

### 4.5 Capability-grants (subject → capability → scope) — the heart of intra-org ala-carte
```sql
CREATE TABLE IF NOT EXISTS capability_grants (
  id             TEXT PRIMARY KEY,
  subject_type   TEXT NOT NULL,          -- 'user' | 'team' | 'org'
  subject_id     TEXT NOT NULL,          -- email | teams.id | org_id
  capability_key TEXT NOT NULL,          -- FK → capabilities.key
  scope_type     TEXT NOT NULL DEFAULT 'org',  -- 'org' | 'project'
  scope_id       TEXT NOT NULL,          -- org_id, or projects.id when scope_type='project'
  org_id         TEXT NOT NULL,          -- always the owning org (for scoped queries, mirrors scopedWhere)
  state          TEXT NOT NULL DEFAULT 'active',  -- 'active'|'suspended'
  source_key     TEXT,                   -- FK → entitlement_keys.id that minted this grant (nullable for manual)
  granted_by     TEXT NOT NULL,
  granted_at     INTEGER NOT NULL,
  expires_at     INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_capgrants_unique
  ON capability_grants (subject_type, subject_id, capability_key, scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_capgrants_subject ON capability_grants (org_id, subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_capgrants_capability ON capability_grants (org_id, capability_key);
```
**Default-deny:** absence of an `active` row = denied. This is the single rule that makes "no
research-suite" work by omission (§3, Fact 2).

---

## 5. Relationships (the proposed hierarchy)

```
[deployment boundary = one DB/auth/users per org]   ← INTER-ORG isolation (Fact 1)
        │
   organizations (core, app-level)
        │ 1─N
   org_members (core; email principal, role owner|admin|member)
        │
        ├── teams ──N── team_members (email)        ← NEW: team principal
        │
        ├── projects ──(self parent_id)                  ← NEW: Project tier
        │        │ N─N via resource_projects
        │        └── ownable resources (core: owner_email|org_id|visibility + *_shares)
        │
        ├── capabilities (catalog)  ←──┐                 ← NEW: capability catalog
        ├── entitlement_keys (SKUs) ───┤ grants_json     ← NEW: sellable layer
        └── capability_grants ─────────┘                 ← NEW: subject→capability→scope
                 subject: user(email) | team(id) | org(org_id)
                 capability: → capabilities.key
                 scope: org | project
```

Core's `*_shares` rows continue to govern **per-resource** access (viewer/editor/admin).
`capability_grants` governs **product/feature** access (which suite/app/feature a subject may
touch at all). The two compose: capability-grant gates entry to the app; `*_shares` + `visibility`
gate the specific resource inside it.

---

## 6. How a capability check resolves (the one coherent interface)

### 6.1 The reconciled policy hook — VERIFIED against the real SDK
The spec quotes two incompatible shapes (spec-readiness.md:41):
`policyCheck(capability, principal, resource)` (recommendation.md:140) vs the toolkit's
`evaluate(...)`. **Verified real SDK signature** (`@microsoft/agent-governance-sdk@4.0.0`,
extracted from the npm tarball this pass — see §8):
- `PolicyEngine.evaluate(action: string, context?: Record<string,unknown>): 'allow'|'deny'|'review'`
  (legacy/flat, first-match-wins, default deny).
- `PolicyEngine.evaluatePolicy(agentDid: string, context: Record<string,unknown>):
  PolicyDecisionResult { allowed: boolean; action: 'allow'|'deny'|'warn'|'require_approval'|'log';
  approvers: string[]; … }` (rich; the one to use for approval workflows).
- Backends: `registerBackend()` with first-class **Cedar** (`policy-backends/cedar`) and **OPA**
  (`policy-backends/opa`) — confirming the recommendation's "policies in Cedar/Rego, portable behind
  the seam" (§4 of spec-readiness).

**Reconciliation — ONE adapter file owns this mapping:**
```ts
// policy/policy-check.ts  (the single seam in @jami-studio/harness; nothing else calls the SDK directly)
type Principal = { type: 'user'|'team'|'org'; id: string; orgId: string };
type Decision  = 'allow' | 'deny' | 'require_approval';

export async function policyCheck(
  capability: string,            // = catalog capability_key  → the SDK `action`
  principal: Principal,
  resource: { type: string; id: string; projectId?: string } | null,
): Promise<Decision> {
  // 1. Hard gate FIRST (cheap, our DB): is there an active capability grant?
  if (!(await hasCapabilityGrant(principal, capability, resource?.projectId))) return 'deny';
  // 2. Then the MS engine for policy/approval/rate-limit nuance:
  const ctx = {
    capability, action: capability,
    principal_type: principal.type, principal_id: principal.id, org_id: principal.orgId,
    resource_type: resource?.type, resource_id: resource?.id, project_id: resource?.projectId,
  };
  const r = engine.evaluatePolicy(principal.id /* agentDid slot = principal */, ctx);
  if (r.action === 'require_approval') return 'require_approval';
  return r.allowed ? 'allow' : 'deny';     // default-deny on anything else
}
```
So the gate calls **one** `policyCheck(capability, principal, resource)`; internally it (a) enforces
our additive `capability_grants` (the ala-carte layer the SDK knows nothing about), then (b)
delegates nuance to the SDK's verified `evaluate`/`evaluatePolicy`. `capability → action`,
`{principal, resource, scope} → context`. Fail-closed on SDK error (default `deny`).

### 6.2 `hasCapabilityGrant` resolution order (subject expansion)
```
given (principal {type,id,orgId}, capability_key, optional project_id):
  scopes to test = [ ('org', orgId) ] ++ (project_id ? [ ('project', project_id) ] : [])
  subjects to test (most→least specific):
     ('user', principal.id)
     ('team', T) for each T in teams where principal.id ∈ team_members
     ('org',  orgId)
  → SELECT 1 FROM capability_grants
      WHERE org_id = :orgId AND state='active'
        AND capability_key = :cap
        AND (subject_type,subject_id) IN (<subjects>)
        AND (scope_type,scope_id) IN (<scopes>)
        AND (expires_at IS NULL OR expires_at > now)
      LIMIT 1
  → present ⇒ granted ; absent ⇒ DENY (default-deny)
  Capability inheritance: also accept a grant on any ANCESTOR key
    (feature.voice.realtime ⇐ app.voice ⇐ suite.media) via capabilities.parent_key walk.
```
This is the team-principal resolution that lets core keep its closed `'user'|'org'` share enum
untouched: **teams are expanded to their member emails + the team id at check time**, not stored as
a new `principal_type` in core's `*_shares`.

### 6.3 Binding onto core — RBAC + (future) `assertConnectionUse` + audit
- **RBAC (resource access):** core's `assertAccess(type, id, minRole)` stays the per-resource gate.
  Wrap it: `policyCheck(capabilityForResourceType(type), principal, {type,id}) → assertAccess(...)`.
  `policyCheck` decides *may this subject touch this app/feature at all*; `assertAccess` decides
  *what role on this specific row*. No second enforcement path — `policyCheck` is the outer choke,
  `assertAccess` the inner, both funnelled.
- **`assertConnectionUse` (spec-invented; to be built):** model it as
  `policyCheck('feature.connection.use:'+provider, principal, {type:'connection', id})` *then* the
  existing `resolveWorkspaceConnectionForApp()` scoped resolver (which already enforces
  `scopedWhere`→org_id). It is a wrapper over real code, not new core.
- **Audit row (`connection_use`, spec-invented; H5):** every `policyCheck` call emits one append-only
  row `{ id, ts, org_id, subject_type, subject_id, capability_key, resource_type, resource_id,
  decision, source ('grant'|'engine'), approver? }`. The SDK ALSO ships its own audit
  (`AuditConfig`/`AuditEntry`, Ed25519/`auditDigest` in the tarball) — **our durable Postgres audit row
  is the system of record; the SDK's signed log is a complementary integrity layer that feeds it** (per
  the governance decision in `fact-finding-synthesis.md` §4). This section fixes the row's SHAPE and that
  it is written by the one `policyCheck` seam so the two logs can't diverge.

---

## 7. The decisive read

agent-native gives us the **tenant boundary (org), the principal (email member), the per-resource
ACL (`*_shares` + visibility), one real choke point (`sharing/access.ts`), and a working precedent
for scoped subject→capability→scope grants (`workspace_connection_grants` + `scopedWhere`).** The
H1 gap is real but **shallow**: four missing tables (Project, capability catalog, entitlement-keys,
teams) plus one grant table, all keyed to `org_id`+email, **zero ALTERs to core**. The spec's
`policyCheck`/`assertConnectionUse`/`connection_use` are confirmed **invented names** (not in
source) — which is fine, because they are *our* additive layer; the draft binds them to real core
functions (`assertAccess`, `resolveWorkspaceConnectionForApp`). The policy-hook ambiguity dissolves
once you read the real SDK: `evaluate`/`evaluatePolicy` exist with stable signatures, Cedar+OPA
backends are real, and one adapter file reconciles `policyCheck → evaluatePolicy`. **H1/PW3 is
closable as a spec-completion task, not a redesign.** Intra-org ala-carte (Jamie's unified
interface) falls out for free as rows-present/row-absent in `capability_grants`.

---

## 8. Evidence (file paths + dated official sources + shell output)

**Local source (verified this pass, clone 0.23.0):**
- `…/agent-native/packages/core/src/org/schema.ts` — `organizations`, `org_members`, `org_invitations`.
- `…/agent-native/packages/core/src/org/types.ts` — `OrgRole = owner|admin|member`.
- `…/agent-native/packages/core/src/sharing/schema.ts` — `ownableColumns()`, `createSharesTable()`
  (`principal_type 'user'|'org'`), `ROLE_RANK`.
- `…/agent-native/packages/core/src/sharing/access.ts` — `accessFilter`, `resolveAccess`,
  `assertAccess`, `ForbiddenError(403)`.
- `…/agent-native/packages/core/src/workspace-connections/store.ts` — `workspace_connections`,
  `workspace_connection_grants` (UNIQUE(connection_id, app_id)), `scopedWhere()` lines 556–566.
- `…/agent-native/packages/core/src/connections/types.ts` — connection capability + credential-key vocab.
- `…/agent-native/packages/core/src/server/better-auth-instance.ts` — BetterAuth `organization`/
  `member`/`invitation`/`user`/`session.active_organization_id`; note lines 876–877 (separate auth DBs
  per first-party app = Fact 1).
- `…/agent-native/packages/core/src/oauth-tokens/store.ts` — `getOAuthTokens(provider, accountId)`
  reads with NO owner/org scope (lines 47–60, PK `(provider, account_id)`); confirms spec HIGH PW9.
- Grep `assertConnectionUse|connection_use|policyCheck` across `packages/core/src` → **zero matches**
  (confirms all three are spec-invented).

**Official 2026 sources (verified this pass, dated):**
- `npm view @microsoft/agent-governance-sdk` (run 2026-06-01): **`@microsoft/agent-governance-sdk@4.0.0`,
  MIT, Public Preview, published 2026-05-29 (3 days before this pass)**, deps include
  `@noble/curves`,`@noble/ed25519` (signing). Repo:
  `https://github.com/microsoft/agent-governance-toolkit/tree/main/agent-governance-typescript`.
  NOTE: the bare name `@microsoft/agent-governance-toolkit` is **404 / not a package** — the
  publishable artifact is `…-sdk`. (The recommendation's "released 2026-04-02, ~2 months old" refers
  to the toolkit project; the SDK npm artifact is far younger — flag for the ms-governance thread.)
- Tarball extract `microsoft-agent-governance-sdk-4.0.0.tgz` → `package/dist/policy.d.ts` &
  `types.d.ts` (verified):
  - `PolicyEngine.evaluate(action: string, context?: Record<string,unknown>):
    'allow'|'deny'|'review'`.
  - `PolicyEngine.evaluatePolicy(agentDid: string, context: Record<string,unknown>):
    PolicyDecisionResult`.
  - `PolicyAction = 'allow'|'deny'|'warn'|'require_approval'|'log'`;
    `LegacyPolicyDecision = 'allow'|'deny'|'review'`; `PolicyDecisionResult { allowed, action,
    approvers, … }`.
  - Backends exported: `policy-backends/cedar`, `policy-backends/opa`; credential vault +
    `auditDigest` present.

**Spec corpus referenced:**
- `…/12-agent-native/spec-review/spec-readiness.md` — H1 (line 41), PW3 (185), PW4 (186), policy-hook
  contradiction.
- `…/12-agent-native/recommendation.md` — §3 policy hook (line 140), §6 entitlement plane (212–221),
  §7 risks (255–280).

---

## 9. What I could NOT verify / open for the named threads

- **Real SDK `evaluate()` runtime behaviour (perf, fail-closed)** — I verified the *signatures* from
  `.d.ts`; I did NOT execute the engine or benchmark "sub-ms" (no install into project trees, per
  rules). The **ms-governance thread** owns runtime confirmation + the "agentDid slot for principal"
  fit (the API names the first arg `agentDid` — our principal is a user/team/org, so confirm the
  engine doesn't assume DID semantics).
- **Audit log ownership** — whether our `connection_use`/capability-audit row, the SDK's
  `AuditEntry`/Ed25519 log, or one subsumes the other = **H5 + ms-governance threads**, not this one.
  This draft only pins the row shape and the single-writer (one `policyCheck` seam).
- **0.23.0 vs 0.32.2 schema drift** — all schema facts above are read against the **clone 0.23.0**.
  The seam-diff against the fork target (core 0.32.2 / dispatch 0.8.28) is **PW1's** job; the
  org/sharing/connection tables are stable-looking but re-verify before locking.
- **BetterAuth org vs app-level org** — there are TWO org table families (BetterAuth `organization`
  keyed by user_id; agent-native `organizations` keyed by email). This draft keys to the **app-level**
  pair (what `sharing/access.ts` reads). Whether the fork unifies them (single source of org truth) is
  an **identity-plane design** call, not blocking H1.
- **Whether `project` should be a column on `ownableColumns()` vs the association table** — I chose the
  association table to keep it zero-ALTER; if the fork decides to edit `ownableColumns()`, the column
  form is cleaner. Reviewer's call.

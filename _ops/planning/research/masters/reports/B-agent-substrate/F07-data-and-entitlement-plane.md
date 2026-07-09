# F07 — Data & entitlement plane

Status: AUTHORED 2026-06-02 · Domain: B · Agent substrate
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/12-agent-native/fact-finding/data-model-hierarchy-draft.md`, `06-rebuild-feasibility`
Related: F02 (identity), F06 (grants), F04 (DB-per-tenant hosting), F16

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

The single data plane + the entitlement layer. **In:** schema, RLS, migrations, audit, ala-carte grants, tenancy. **Out:** the policy decision (F06), identity (F02).

## 2. Committed decisions (from canon)

- **One Postgres (Neon)**, namespaced schemas, row-level security, explicit select contracts, enforced migration ordering, append-only audit.
- **Additive, natural-named entitlement tables** keyed `org_id` + email, **zero core ALTERs** — `projects`, `resource_projects`, `capabilities`, `entitlement_keys`, `teams`, `team_members`, `capability_grants`. **No ownership prefix.**
- Ala-carte product access = grant rows present/absent (**default-deny**).
- Inter-org isolation = separate db/auth/users per org (**DB-per-tenant**, a deployment fact).

## 3. Architecture & mechanics

**One Postgres, behind the db adapter.** Neon (hosted) / Supabase + Neon-self-host (OSS), reached only through the db adapter (Postgres-wire + **Drizzle**). Namespaced schemas, **row-level security**, **explicit select contracts** (no `SELECT *` across a tenant boundary), **enforced migration ordering**, **append-only audit**.

**The additive entitlement layer (natural-named, zero core ALTERs).** The System→Org→Project hierarchy + ala-carte entitlements are **new tables keyed to `org_id` + email**, added **without one ALTER to core** — natural names, **no ownership prefix**:

```
orgs(org_id, …)
memberships(org_id, principal, role)             # principal = human email | agent DID
projects(project_id, org_id, …)                  # the work-unit (not yrka_projects)
resource_projects(project_id, resource_ref, …)   # resources scoped to a project
capabilities(capability_id, key, …)              # the catalog of grantable actions
entitlement_keys(key, product, …)                # ala-carte product/feature keys
teams(team_id, org_id, …)
team_members(team_id, principal, role)
capability_grants(org_id, principal, capability_id, granted, …)  # the gate's source of truth
audit(seq, org_id, principal, action, ctx_hash, decision, prev_hash, hash, ts)  # append-only, SHA-256 chained (F06)
```

**Default-deny by construction.** Ala-carte product access = **grant rows present/absent**. "has business+media, not research" = the business + media grant rows exist, the research row doesn't. F06's hard gate reads `capability_grants`; **no row → deny**. Adding a product to the catalog is a new `entitlement_keys`/`capabilities` row + the grants — never a schema change.

**RLS.** Every tenant-scoped table carries an `org_id` RLS policy: a connection's session sets the org context, and the policy restricts rows to that org. Explicit select contracts (typed Drizzle queries) are the second layer — the app never issues an unscoped cross-tenant read.

**Migration discipline.** Migrations are ordered + enforced (a migration runs only after its predecessors); the harness refuses to boot against an out-of-order/unapplied schema. Drizzle migrations, versioned in the repo, applied via the F03 pipeline. Neon **branch previews** give a real DB per PR for safe migration testing.

**Inter-org isolation = DB-per-tenant (a deployment fact).** Strong isolation between orgs is **separate db/auth/users per org**, provisioned via the F04 provisioning seam (Neon DB-per-tenant). Within an org, RLS + grants scope access. So there are two isolation tiers: cross-org = physical (separate DB), intra-org = logical (RLS + grants).

**Audit table = F06's system of record.** The append-only, SHA-256-chained `audit` table is written by `policyCheck()` (F06) on every decision; it is the durable governance record.

## 4. Remaining peripheral decisions to cement

- **Schema (cemented direction):** the natural-named additive tables above; final field set trimmed to what F06/F02/F16 actually read (zero-bloat).
- **Migration tooling/ordering (cemented):** Drizzle migrations, enforced ordering, Neon branch-preview per PR, applied via F03.
- **Per-tenant isolation pattern (cemented):** cross-org = Neon DB-per-tenant (deployment fact via F04 provisioning seam); intra-org = RLS + `capability_grants`.

## 5. Dependencies & interfaces

- **F06 (governance)** — the hard grant gate reads `capability_grants`; F06 writes the chained `audit` table.
- **F02 (identity)** — `memberships`/`team_members`/`capability_grants` are keyed to the F02 principal (human email / agent DID) + `org_id`.
- **F04 (hosting)** — DB-per-tenant + region co-location + branch previews are F04 provisioning facts.
- **F05 (harness)** — run/memory persistence + the connection layer ride this plane via the db adapter.
- **F12 (billing)** — webhooks are the **only writer** into the entitlement tables (idempotent upsert); F07 owns the tables, F12 owns the sync.
- **F16 (products)** — ala-carte suite access = grant rows; yrka's one-identity multi-suite model rides this.

## 6. Verification & closing criteria

- The additive entitlement tables exist with **zero ALTERs to core**; natural names, no ownership prefix.
- RLS denies a cross-org read even with a valid intra-org session; explicit select contracts have no unscoped cross-tenant query.
- Ala-carte access works by grant-row presence/absence; removing a grant revokes access immediately (F06 default-deny).
- Migrations apply in enforced order; the harness refuses to boot on an out-of-order/unapplied schema; a Neon branch preview tests a migration before merge.
- A new product is added as catalog + grant rows only — no schema change.
- The `audit` table is append-only and chain-verifiable (tamper breaks the chain).

## 7. Risks & verify-at-build (dated 2026-06-02)

- **RLS + explicit select contracts must both hold** — RLS is the floor, typed queries the discipline; a missing RLS policy on a new tenant table is a cross-tenant leak. Gate new tenant tables on an RLS-present check.
- **DB-per-tenant scaling** — many Neon DBs raise provisioning/migration-fan-out cost; verify Neon's per-project DB limits + branch economics at build (DO SQLite-style billing surprises live; check Neon's current pricing).
- **Webhook-only-writer invariant (F12)** — any other writer into entitlement tables breaks idempotency + the single-source rule; enforce by access control.
- Drizzle + Neon driver versions drift — pin; verify branch-preview behavior at build.

## 8. Sources

- `12-agent-native/fact-finding/data-model-hierarchy-draft.md` + `fact-finding-synthesis.md`, synthesis §3 (one data plane + entitlement layer), `06-rebuild-feasibility`.

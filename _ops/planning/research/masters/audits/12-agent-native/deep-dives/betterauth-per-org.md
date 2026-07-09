# Deep-dive — BetterAuth for per-org isolated auth

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
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Scope: Does BetterAuth fit the NEW direction — PER-ORG isolated db/auth/users (each org
its own; some projects too)? Verified against official 2026 BetterAuth docs/repo + the
local agent-native clone.

---

## Committed read

**Adopt BetterAuth as the per-org auth/identity primitive. It is the correct root-level,
agnostic choice for the new per-org-isolation direction — and it is *more* aligned with
per-org isolation than Supabase/Neon auth, not less.** Two reasons, both load-bearing:

1. **It ports across dbs + hosts because it is a library, not a service.** BetterAuth runs
   *inside* your app, talks to *your* database through an ORM adapter (Drizzle/Prisma/Kysely
   over Postgres/MySQL/SQLite + Neon/Turso/D1/PlanetScale), and is framework-/runtime-agnostic
   (Node, edge, serverless). "Each org its own db/auth/users" is literally its native shape: one
   BetterAuth instance + one schema per isolated database. No provider tenancy model to fight.

2. **agent-native already ships exactly this, wired for per-org isolation.** The clone pins
   `better-auth@^1.6.0` (current — latest is 1.6.11, May 2026), wires it behind the framework's
   `getSession()`/`autoMountAuth()` seam with a dialect-auto-detecting Drizzle adapter, the
   organization plugin baked into the schema, and JWT+Bearer plugins. Its multi-tenancy doc and
   `identity-sso.ts` state the per-app-isolated-db model outright: *"Each hosted app has its OWN
   Better Auth user store (a separate database per app)"*, federated cross-app via a Dispatch
   identity hub (opt-in, off by default). **Adopting agent-native means inheriting BetterAuth
   anyway** — so this is not a new dependency, it is ratifying one that already matches the new
   direction.

The earlier "single shared identity/entitlement plane" framing (recommendation.md §6) is the
part that revises: BetterAuth supports BOTH — per-org-isolated stores as the default, with
optional cross-app federation layered over the top (the agent-native Dispatch hub pattern) when
two surfaces want shared sign-in. Per-org isolation is the floor; federation is an opt-in seam,
not a re-architecture.

## Direct answers to Jamie

- **"Any reason not to?"** No disqualifying reason. It is MIT, self-hosted, db/host-agnostic,
  and already in the foundation. The honest costs are operational, not architectural (see
  downsides): you own N auth stores instead of one provider dashboard, and cross-org SSO is
  something you wire (it ships the pieces) rather than get for free.
- **"Does it handicap us down the road?"** No. It is additive-by-plugin and provider-coupling-free.
  Enterprise needs (SSO/SAML/SCIM/MFA/passkeys/OIDC-provider) are first-party plugins you turn on
  per org without changing the core. The one thing to track: it is pre-2.0 and fast-moving (pin +
  cherry-pick security fixes), and the Agent Auth plugin you'd most want is explicitly "not yet
  stable."
- **vs Supabase Auth / Neon Auth (Stack Auth):** For per-org isolation, the portable library wins.
  Supabase/Neon auth are convenient because identity lives in the *provider's* managed service —
  which is precisely the coupling the new direction retires. To get "each org its own auth," with
  a provider you either run a separate Supabase/Neon project per org (provider lock-in × N, and you
  still can't move a single org off it without a migration) or you bolt multi-tenancy onto one
  shared project (defeats isolation). BetterAuth makes "each org its own db+auth+users" a config
  choice — point a new instance at a new `DATABASE_URL`, done — and lets an org run Postgres on one
  host and another org run SQLite/Turso elsewhere with the same code. Keep Supabase/Neon as the
  *database/host* (BetterAuth runs fine on Supabase Postgres or Neon — the clone has first-class
  Neon serverless pooling); just stop using their *auth* as the identity authority.

---

## (a) DB/ORM adapter coverage + host-agnosticism — VERIFIED

Official (better-auth.com/docs/adapters, 2026-06-01):
- **ORM adapters:** Drizzle (`@better-auth/drizzle-adapter`, `provider: "pg" | "mysql" | "sqlite"`),
  Prisma (`prismaAdapter`, `provider: "postgresql" | ...`), Kysely, plus MongoDB and an in-memory
  adapter. Case-insensitive queries supported across all of them as of 1.6.
- **Databases:** Postgres, MySQL, SQLite confirmed first-class; via Drizzle's driver layer also
  Neon, Turso (libsql), Cloudflare D1, PlanetScale.
- **Host/runtime:** "framework-agnostic authentication framework for TypeScript" (GitHub README);
  runs in Node, edge, and serverless. 1.4 added **stateless auth** (omit `database` entirely) and
  cookie-based account storage for edge/serverless. Schema is generated/migrated by its own CLI
  (`npx auth generate --adapter drizzle|prisma`, `npx auth migrate`).

Local evidence (clone proves the port across dbs+hosts is real, not theoretical):
- `packages/core/src/server/better-auth-instance.ts:904-979` `buildDatabaseConfig()` switches on
  dialect: Neon → `@neondatabase/serverless` Pool + `drizzle-orm/neon-serverless`; other Postgres
  (Supabase, self-hosted) → `postgres-js`; local SQLite → `better-sqlite3`; remote → `@libsql/client`
  (Turso). All four feed the same `drizzleAdapter(db, { provider })`.
- Same file `:263-433` defines the full auth schema for BOTH `pg-core` and `sqlite-core`
  (`user/session/account/verification/organization/member/invitation/jwks`).
- `package.json`: `"better-auth": "^1.6.0"`, `"drizzle-orm": "^0.45.2"`, plus Neon/postgres/libsql/
  better-sqlite3 drivers — the whole adapter matrix is already a dependency.

## (b) Multi-tenant / organization support — VERIFIED, native fit for per-org isolation

Official (better-auth.com/docs/plugins/organization):
- The **Organization plugin** provides organizations, members, roles (`owner`/`admin`/`member` +
  custom roles via `createAccessControl`), invitations (with lifecycle hooks + email), teams
  (multi-team membership as of 1.3; `teamMembers` join table), org limits, and **Dynamic Access
  Control** addon for runtime-created roles/permissions. Session carries `activeOrganizationId`.

Two distinct isolation models — and per-org-isolated-db is the stronger one BetterAuth enables:
- **Org-plugin tenancy (soft isolation):** one db, one auth store, `organization_id`-scoped rows.
  This is what the org plugin gives out of the box (agent-native uses it: `session.orgId →
  AGENT_ORG_ID → SQL scoping`, `multi-tenancy.md`).
- **Per-instance tenancy (hard isolation — Jamie's new direction):** one BetterAuth instance +
  one db PER org. BetterAuth supports this trivially because it's a library — instantiate per org,
  point at that org's `DATABASE_URL`. agent-native already runs this for hosted apps
  (`identity-sso.ts:1-8`: "each app has its OWN Better Auth user store, a separate database per
  app"). **This is the native fit for "each org its own db/auth/users."** You can even combine:
  per-org-isolated instance AND the org plugin inside it for sub-teams within that org.

## (c) Enterprise features — first-party, maturity flagged — VERIFIED

From the official plugins index + 1.4/1.6 release notes + May-2026 changelog:

| Capability | Status | Notes |
|---|---|---|
| SSO / SAML 2.0 | First-party (`sso` plugin) | SP-initiated `InResponseTo` replay validation on by default (1.6); SSO domain verification (1.4) |
| OIDC / OAuth provider mode | First-party (`oidc-provider` / `oauth-provider`) | OAuth 2.1 hardening in 1.6 (PKCE defaults, constant-time secret compare) |
| SCIM provisioning / directory sync | First-party (`scim` plugin) | Added in 1.4 |
| MFA / 2FA | First-party (`two-factor`) | |
| Passkeys / WebAuthn | First-party (`passkey`) | 1.6 adds WebAuthn extensions, sessionless registration |
| API keys | First-party (`api-key`) | 1.6: 429 on rate-limit |
| JWT + Bearer | First-party (`jwt`, `bearer`) | JWKS endpoint; agent-native uses both for A2A (`better-auth-instance.ts:887-898`) |
| Magic link / Email OTP / device-authz | First-party | RFC 8628 device grant (1.4) |
| **Agent Auth (AI-agent capability authz)** | First-party but **explicitly NOT yet stable** | discovery + registration + delegated/autonomous modes + scoped short-lived signed JWTs; OpenAPI/MCP adapters. Most relevant to one-human-many-agents — but pin and treat as moving. |
| Security layer | First-party / cloud | bot detection, brute-force, impossible-travel, geo-block, disposable-email block |

50+ official plugins total. Self-hosted is the default posture; an optional BetterAuth cloud
(dashboard, audit-log drain, email/SMS) exists but is not required and not a coupling.

## (d) Limitations / handicaps for our posture — HONEST

- **Operational N-stores tax.** Per-org isolation means N auth databases + N migration runs + N
  secret sets (`BETTER_AUTH_SECRET` per instance). This is the *cost of isolation itself*, not a
  BetterAuth flaw — but it is real ops weight a single provider dashboard would hide. Mitigate with
  the framework's CLI migrations + a per-org provisioning script.
- **Cross-org SSO is BYO-wiring.** Isolated stores don't share sessions by construction. Federation
  is the opt-in `identity-sso.ts` hub pattern (HS256 over a shared `A2A_SECRET`, JIT account-link).
  It works and is in the clone, but you own/operate the hub. For true external zero-trust, the
  shared-HMAC model is the weak point — upgrade path is per-peer keys / signed cards.
- **Pre-2.0, fast-moving.** 1.6.x with frequent breaking changes and a steady stream of security
  fixes (invitation-takeover, device-code binding, magic-link race, OAuth code race — all patched
  in the May-2026 line). Must pin a version and track the changelog; `npx auth upgrade` exists but
  read breaking-change notes each bump.
- **Agent Auth plugin is unstable.** The one plugin most tailored to one-human-many-agents is
  self-described "not yet stable and may change." Use A2A/MCP JWT (already wired) as the stable
  path now; adopt Agent Auth when it stabilizes.
- **Flat default roles.** Org plugin ships `owner/admin/member`; richer RBAC is the access-control
  / dynamic-access-control addon (capable, but you author the capability catalog). This matches the
  recommendation.md plan to layer enterprise RBAC at the `assertAccess()` choke point — no conflict.
- **Secret rotation footgun.** Rotating `BETTER_AUTH_SECRET` invalidates signed cookies; in
  production it must be set explicitly (the clone fails the boot loudly if unset —
  `better-auth-instance.ts:88-101`). Per-org isolation multiplies this; manage secrets per instance.
- **No managed UI / scaling SLA.** You operate it. For one-human-many-agents at current scale this
  is a feature (full control, no per-MAU billing), not a problem — but there's no provider to page.

## How agent-native wires BetterAuth (confirm: we inherit it)

- Internal-only instance, lazily created, **never exported to templates** — apps touch auth solely
  through `getSession()`/`autoMountAuth()`/`createAuthPlugin()`/`createGoogleAuthPlugin()`
  (`better-auth-instance.ts:1-7`). This is exactly the agnostic auth-adapter seam the canon wants:
  swapping the auth engine later touches one file, not the app surface.
- Routes mounted at `/_agent-native/auth/ba/*` with back-compat `session/login/register/logout`.
- Organization plugin schema baked into both pg + sqlite schemas; org auto-join-by-domain +
  pending-invitation auto-accept on first signup (`databaseHooks.user.create.after`,
  `:768-818`, calling `org/accept-pending.ts` + `org/auto-join-domain.ts`).
- JWT (issuer = app URL, 15m) + Bearer plugins for A2A/MCP; Google/GitHub social auto-detected from
  env; Google OAuth tokens mirrored into `oauth_tokens` for the connection layer (`:455-517`).
- **Bring-your-own-auth escape hatch** documented (`createAuthPlugin({ getSession })`) — Clerk/
  Auth0/Firebase/etc. drop in behind the same seam if BetterAuth ever needs replacing. The adapter
  posture the canon demands is already honored.
- Cross-app federation (`identity-sso.ts`) is opt-in via `AGENT_NATIVE_IDENTITY_HUB_URL`, off by
  default, fully reversible — the seam for "shared sign-in across surfaces" without breaking
  per-org isolation.

## What I couldn't verify / carry as fork-time checks

- **Exact npm "latest" dist-tag at this instant.** Confirmed the line is 1.6.x and 1.6.11 was the
  latest release seen (releasebot, May 2026); did not hit npm's dist-tag API directly (npmx showed
  1.6.x and an older 1.4.22 page). Clone's `^1.6.0` is current, not ahead — verify the exact pinned
  patch at fork time.
- **Agent Auth protocol surface** read from docs only (plugin marked unstable); not exercised.
- **SCIM/SSO maturity in production** asserted from release notes + plugin index, not from running
  them — validate the specific flows you turn on per org before relying on them.
- **0.32.0 agent-native** (npm latest per recommendation.md) not diffed against the 0.23.0 clone I
  read; re-verify `better-auth-instance.ts` + `identity-sso.ts` seams at fork.
- BetterAuth root `LICENSE.md` text not opened; MIT confirmed from the GitHub README's explicit
  statement ("free and open source project licensed under the MIT License").

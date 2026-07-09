# Canonical Autonomous Agentic Dev System — Design Brief

Date: 2026-06-01
Status: Committed direction (canon §2). Open items only where canon §4 applies.
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Scope: The core layer model. Commits the System > Org > Project model, Multica as the
continual orchestrator replacing `goal.md`, the inter-layer contracts, and the intake/work
record. Built greenfield on official/industry-leading tooling; prior projects were input to
thinking only, never a code source.

---

## Executive Summary

**The dev system is a four-tier, single-concern model — System > Org-lane > Domain > Project —
authored fresh, with Multica as the always-on orchestrator that replaces the old `goal.md` "read
the goal, spawn subagents" prompt.** Each tier owns exactly one concern, so an agent always knows
where a fact lives and a new project never re-derives the way of working:

- **System (`C:\Users\james\dev`) = durable templates + canon.** The org-agnostic,
  vendor-agnostic way of working: planning/report/doc styles, the AGENTS.md spine, the
  verification-ladder *method*, changelog-fragment discipline, the orchestration contract, the
  intake/work-record schema, doc-hygiene, and the thin-bridge workflow skills. It carries **no
  project name, vendor name, account, or secret** — by construction — which is exactly why it
  needs no routine maintenance. Adding a 13th project, swapping a database, or rotating a token
  never touches it.
- **Org-lane (`dev/<org>/`) = the grouping + shared-lane concerns.** Three lanes — **`oss`**,
  **`saas`**, **`personal`** — each holding the lane's legal entity, funding lane, and secret-vault
  lane. This is how Jamie reasons about the portfolio.
- **Domain (`dev/<org>/<domain>/`) = configuration, vendors, accounts, brand, identity surface.**
  Per-brand policy: **`oss`** holds `jami.studio` (foundations: `@jami-studio/harness`/`@jami-studio/ui`/`@jami-studio/orchestra`),
  `intercal`, `collective`; **`saas`** holds `yrka` (the product monorepo); **`personal`** holds
  `jnh.org`. Each domain holds its identity, vendor accounts, the OIDC **auth surface**, and brand —
  the only tier that knows "Jamie." Domain overrides System defaults where it declares an explicit one.
  (Intercal and the Collective are their own domains that consume the foundations — not foundations
  inside jami.studio.)
- **Project (`<org>/<domain>/projects/<repo>`) = transient specifics.** A thin per-repo `AGENTS.md` =
  the inherited spine + a marked "Project Specifics" block (stack, module map, the *commands*
  that instantiate the verification ladder, the secret-lane table by reference) + a pointer to
  `system@version` and the owning org. Transient by design; changes freely. **Project transients
  never flow up.**

Precedence is explicit and mechanical: **explicit human instruction > org override > nearest
project `AGENTS.md` (implementation detail) > System canon (defaults).** Each level carries its
own **glossary** so terms stay consistent across the family.

**Multica is the whole orchestration system, self-hosted, replacing `goal.md` entirely.** The
old loop — a human launching "read goal.md, spawn fresh-context subagents per workstream" in a
repo — becomes durable, scheduled pipeline parts (Multica **Autopilots**) that run continually
as work and issues are added to the workspaces. Verified 2026-06-01: Multica (`multica-ai/multica`,
v0.3.1, May 2026) is an open-source self-hostable platform whose **local-daemon model runs agents
on Jamie's machine** (keys and repos stay local), with a **Runtime** abstraction that reports
which of 12 supported coding CLIs (incl. Claude Code, Codex, Gemini, Antigravity, OpenCode,
Hermes) are available and routes work accordingly; **Squads** (a leader agent routes to members),
and **Autopilots** (cron/webhook/manual triggers that auto-create issues and route them to
agents). "Chat to add a project/issue, tag agents, work starts, recurring pickup runs itself" is
native. Multica is licensed modified-Apache-2.0 with a SaaS-resale restriction — **fine for the
internal self-host we run; the restriction matters only if we ever expose it as a hosted product**
(out of scope here).

**No separate board to sync to.** Multica is the system of record. Linear and Notion are
available but **not required and not forced**; if Jamie later wants a human-readable Linear view,
Linear's first-class Agents API (assign/@mention → `AgentSessionEvent` webhook → agent session
lifecycle, verified 2026-06-01) makes a one-way projection trivial — but that is an optional
add-on, not part of the committed core.

**Determinism comes from fixing the contracts, not the agents.** The intake/work-record schema,
the orchestration dispatch contract, the close-gates, and the verification-ladder method are
fixed and machine-checkable, identical across every coding-agent subscription (plain
Markdown/`SKILL.md` + a Postgres-backed record, not a Claude-only feature). An agent gets a leash
only *inside* one workstream pass; it never edits the canon. **In-session gates run first** (hooks
enforce the ladder, fail closed before commit/push); any remote CI is an additional gate that
nothing failing local gates ever reaches.

---

## The Layer Model (core deliverable)

Three layers, each one concern, with explicit precedence. The defining rule: **System is durable
template + canon; Org is config/vendors/accounts/brand; Project is transients. Org/System take
precedence where declared; Project transients never flow up.**

```
┌──────────────────────────────────────────────────────────────────┐
│ SYSTEM LAYER  =  C:\Users\james\dev                               │
│ Concern: durable TEMPLATES + CANON — the way of working.          │
│ Content: planning-style, report-style, doc-style, testing method, │
│   AGENTS.md spine, verification-ladder METHOD, changelog-fragment  │
│   discipline, the orchestration contract, the INTAKE/WORK-RECORD   │
│   SCHEMA, doc-hygiene, the thin-bridge workflow skills, the system │
│   GLOSSARY.                                                        │
│ Carries NO project name, vendor name, account, or secret.          │
│ Changes: only when the craft improves (quarterly), never per-item. │
└──────────────────────────────────────────────────────────────────┘
        │ inherited as defaults
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ ORG-LANE  =  dev/<org>/   (oss · saas · personal)                 │
│ Concern: grouping + SHARED-LANE concerns (entity, funding, vault).│
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ DOMAIN LAYER  =  dev/<org>/<domain>/                              │
│ Concern: CONFIG + VENDORS + ACCOUNTS + BRAND + IDENTITY SURFACE.  │
│ oss: jami.studio (foundations) · intercal · collective.           │
│ saas: yrka (product monorepo).  personal: jnh.org.                │
│ Layout: docs/{brand,research,roadmaps} + projects/.               │
│ Content: domain identity, vendor accounts, the OIDC auth surface, │
│   secret-lane namespacing, brand, domain AGENTS.md/glossary,      │
│   overrides of system DEFAULTS where declared.                    │
│ The only tier that knows "Jamie."                                 │
└──────────────────────────────────────────────────────────────────┘
        │ inherited; domain overrides applied
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ PROJECT LAYER  =  <org>/<domain>/projects/<repo>                  │
│ Concern: THIS repo's transient specifics.                         │
│ Content: thin AGENTS.md = spine (from system) + "Project Specifics"│
│   block (preferred dev principles, expected order of work,         │
│   project nuances/pitfalls, recurring agent mistakes, stack,       │
│   module map, the COMMANDS that instantiate the verification        │
│   ladder, secret-lane table BY REFERENCE) + pointer to             │
│   system@version + owning org + the project GLOSSARY.              │
│ Changes: freely. Transient by design.                             │
│ Precedence: nearest AGENTS.md wins for IMPLEMENTATION detail.      │
└──────────────────────────────────────────────────────────────────┘

Precedence (explicit, mechanical):
  explicit human instruction  >  domain override  >  nearest project AGENTS.md
  (implementation detail)      >  system canon (defaults).
  Project transients NEVER flow up. Domain config NEVER hardcodes a project.
  System canon NEVER names a vendor/account/secret.
```

### The foundations and suites this model carries

- **`oss`** lane. **`jami.studio`** owns the foundations the rest stands on: `@jami-studio/harness`,
  `@jami-studio/ui` (UI Registry), `@jami-studio/orchestra`. **`intercal`** (own domain, ≈intercal.dev) owns the
  delta knowledge graph; **`collective`** (own domain) owns the agent society. **Intercal and the
  Collective consume the foundations — they are their own domains, not foundations inside jami.studio,
  and never folded under yrka.**
- **`saas`** lane. **`yrka`** owns one product monorepo — `business-suite`, `media-suite`,
  `research-suite`, the `free-tools` cluster, and BoardRune — under one unified ala-carte interface,
  sharing one identity (free-tools inherit its auth).
- **`personal`** lane. **`jnh.org`** owns `website`.

Each is a project leaf under its domain's `projects/`, inheriting the same System spine and the same
intake/work-record contract.

### Why single-concern-per-layer is the whole answer

There is exactly one home for each kind of fact. The things that change constantly — which
projects exist, which vendor/account/secret runs them, today's roadmap — live in Org and Project,
which are *meant* to churn. The canon is pure craft (how to plan, verify, close out, orchestrate)
and changes only when the craft improves. Because System carries no transient by construction,
**no project/account/vendor change ever touches it** — that is the mechanism by which the canon
stays maintenance-free, not discipline but design. This removes the sprawl/redundancy/obtuse-logic
failure mode directly: an agent never has to guess where a fact belongs.

---

## Multica as the Continual Orchestrator (replacing `goal.md`)

Multica is the whole orchestration system, not a board bolted onto a separate loop. It replaces
`goal.md` outright:

- **The old shape** — a human opens a repo and runs a "read `goal.md`, act as orchestrator-not-
  worker, dispatch fresh-context subagents per workstream, gate on diff-size + judgment, stay
  resumable from repo state" prompt — was a single manually-launched loop trapped in one repo.
- **The committed shape** — that loop becomes **durable, scheduled pipeline parts in Multica**.
  **Autopilots** (cron / webhook / manual) auto-create issues from new work and route them to
  agents or Squads as items are added to the workspaces; the orchestration runs continually
  rather than on a hand-launch. Jamie chats to add a project/issue and tag agents; recurring
  pickup, routing, and progress reporting run themselves.

Verified properties (2026-06-01):

- **Open-source, self-hostable, local-first.** `multica-ai/multica`, v0.3.1 (May 2026). Three-tier
  architecture (Next.js frontend, Go backend, Postgres + pgvector). Self-host via **Docker Compose
  or Kubernetes** from the repo; hosted Cloud also exists. Code and agent interactions stay on our
  infrastructure.
- **Runtime + local-daemon model.** A **Runtime** is a compute environment that executes agent
  tasks — the local machine via the daemon, or a cloud instance. Each runtime reports which agent
  CLIs are installed, so Multica knows where to route. **API keys and repos remain local.** 12
  CLIs supported out of the box (incl. Claude Code, Codex, Gemini, Antigravity, Cursor, Copilot,
  OpenCode, OpenClaw, Hermes, Kimi, Kiro, Pi). This is what makes the system genuinely
  subscription-agnostic across the OAuth coding runtimes (Codex, Claude, Gemini, xAI).
- **The requested interaction is native.** Users create issues and assign/@mention agents as
  first-class teammates; agents claim work, report progress via comments, update statuses
  autonomously. **Squads** group agents under a leader that routes. **Autopilots** are the
  scheduled/triggered "pick up new work in turn" primitive.
- **License.** Modified Apache 2.0 with a SaaS-resale restriction (offering Multica as a hosted
  service to third parties needs a commercial license). **Internal self-host is unrestricted** —
  which is all the committed core needs. Any hosted/productized exposure is out of scope and would
  require reading the LICENSE first.

**No separate board to sync to.** Multica is the system of record. Linear/Notion are available but
not forced. If a human-readable Linear mirror is later wanted, Linear's Agents API (assign/@mention
→ `AgentSessionEvent` webhook carrying the issue/comment/context → agent session lifecycle of 6
states; data-change webhooks secured by HMAC + IP; verified 2026-06-01) makes a one-way projection
of the work-record straightforward. That is an optional later add-on, not committed here.

**Hermes stays fully separate.** Although Multica lists Hermes as a detectable runtime, Hermes'
runtimes/proxies/configs are not part of this dev system and are not mixed in or broken by the
orchestration. Hermes may later support creative work adjacent to coding, never the coding harness.

---

## Inter-Layer Contracts (what makes it deterministic)

Determinism is a small set of fixed, machine-checkable contracts. The agent's leash exists only
*inside* a workstream pass; the contracts are not negotiable.

### Contract 1 — The Intake / Work Record (the universal unit of work)

The single durable schema every layer and tool agrees on. It is System-layer canon, referenced by
the orchestration contract and represented natively as a Multica issue. Every Multica issue (and,
if a Linear mirror is added, every Linear issue) is a projection of this record, so dispatch is
reproducible regardless of which surface created the item:

```
work-record:
  id                 # stable, tracker-agnostic
  title
  layer              # system | org | project   (which layer the work targets)
  org                # jami.studio | yrka.io | jnh.org
  project            # repo/product slug (null for org/system-level work)
  type               # feature | fix | research | docs | chore | release
  intent             # one paragraph, final-shape terms
  definition_of_done # objective, checkable exit criteria
  verification       # the project's ladder rungs (by reference, not inline)
  assignment         # agent / squad tag(s)
  status             # intake | dispatched | in-pass | gated | done | blocked
  source             # multica | file | chat
  links              # repo path, roadmap path, related records
```

This is the deterministic boundary. It encodes the layer model directly (layer + org lane +
final-shape intent + objective DoD), so any surface that creates work feeds the same contract.

### Contract 2 — The Orchestration Contract (the dispatch contract)

The durable dispatch rules, encoded as a thin-bridge orchestration skill and executed by Multica's
Autopilots/Squads (no hardcoded repo paths):

- **Role:** the orchestrator protects context; it never personally implements, searches, or
  verifies — it dispatches and gates.
- **Dispatch:** a fresh-context subagent per workstream, parameterized by the work-record (not a
  repo path); dispatch-specific steering is appended as a small block, never by mutating the base
  contract.
- **Close-gates:** a numeric hard-gate (small focused diff ⇒ eligible to close; large/sprawling ⇒
  another pass) + a judgment contents-check (Continuation ⇒ keep going / Completion ⇒ confirm /
  Cleanup ⇒ close). At least two quiet passes to close.
- **Resumability:** checkpoint to durable state (the work-record + git) after every dispatch and
  result; a timed-out poll is never a stopping point.

### Contract 3 — The Verification Ladder (method is canon, commands are the leaf)

The **method** is System canon: narrowest gate first, climb, don't run the aggregate when
individual checks cover it, in-session before any remote. The **commands** that instantiate each
rung (`typecheck` / `build` / `test`) live in the project leaf's Specifics block. This keeps the
ladder deterministic and universal while each repo names its own commands. Hooks enforce it and
fail closed before commit/push.

### Contract 4 — The Glossaries (terminology consistency)

A glossary at each level (system / org / project) keeps terms and definitions consistent across
the family. The System glossary defines craft terms (work-record, ladder, close-gate, spine); the
Org glossary defines lane/brand/vendor terms; the Project glossary defines repo-specific terms.
Lower levels may extend but not contradict higher-level definitions.

Every contract is plain Markdown / `SKILL.md` + a Postgres-backed record — portable across every
coding-agent subscription, with no Claude-specific dependency.

---

## Skills posture (how the contracts are delivered)

- **Official canon skills we never maintain.** Vendor official skills (gcloud, azure, cloudflare,
  vercel, supabase, neon, stripe, resend, mintlify, …) plus one trusted community baseline chosen
  on merit. We never edit or upkeep them.
- **A tiny thin-bridge skill set we author.** Only the deterministic orchestration flows above
  (the dispatch contract, close-gates, doc-hygiene, work-record handling) — "do exactly this, then
  this, then repeat." If a shipped official skill already covers a flow as well or better, we adopt
  it and ship nothing of our own there. **No manufactured skill-maintenance burden.**

Skills are authored once on the official `SKILL.md` spec (read across Claude Code / Codex / Gemini
/ Copilot / Grok / Cursor) and synced into every runtime — never restated per repo. Multica's own
skill-compounding is complementary and runs on the same files.

---

## Docs

**Mintlify** (style for design docs, hosted for live-project docs). Well-maintained Markdown,
minimal-to-no maintenance, agent-friendly. Notion/Google are not forced.

---

## Implementation Shape

- **Three System artifacts.** (1) The System canon at `C:\Users\james\dev`: the styles, the
  thin-bridge workflow skills, the work-record schema, the orchestration contract, the
  verification-ladder method, the system glossary — synced into every runtime, naming no
  project/vendor/account/secret. (2) The org-lane + domain profiles under `dev/<org>/<domain>/`
  carrying identity, vendor accounts, the OIDC auth surface, secret-lane namespacing, brand, and any
  declared domain-over-system overrides. (3) The thin project leaves under each domain's `projects/`.
- **Orchestration.** Self-host Multica (Docker Compose / Kubernetes) as the continual orchestrator;
  Autopilots replace the `goal.md` launch with scheduled/triggered pickup; Squads route. Local
  daemon keeps keys/repos local across the OAuth coding runtimes.
- **Build underneath what works.** Stand the System/Org/Project scaffold and Multica up beneath
  existing setups without editing or removing current configs, secrets, runtimes, or the old
  `projects/` tree; the old tree retires on its own.
- **Determinism.** Contracts (work-record, dispatch, close-gates, ladder) are fixed; the agent's
  leash is confined to one workstream pass. In-session gates first, fail closed; any remote CI is
  an additional gate only.
- **Testing discipline.** Test only where system health is genuinely at risk (the orchestration
  contracts, the work-record store, the verification hooks); no tests for trivial surface changes
  or trivial no-effect events. Contain runaway token spend with explicit test flows.

---

## Risks And Constraints

- **Layer-precedence drift (highest).** An agent could obey a stale higher layer, or a project
  transient could leak up into the canon. *Mitigation:* the explicit mechanical precedence rule
  stated in the AGENTS.md spine; a doc-hygiene check that rejects any vendor/account/secret/command/
  path string appearing in System-layer files.
- **Canon boundary erosion (high).** Transients (filters, file-size numbers, module names) tend to
  accrete into durable docs. *Mitigation:* the "Project Specifics" block is the *only* place
  transients may live in a project leaf; the doc-hygiene rule enforces it.
- **Multica maturity (medium, verified-but-young).** v0.3.x, actively developed, pre-1.0; its MCP/
  API/webhook surface and exact license string were confirmed at the capability level, not
  exercised end-to-end. *Mitigation:* the work-record (not the vendor) is the contract; validate
  the integration plumbing in the build pass before relying on it.
- **Determinism vs. agent leash (medium).** Over-tight contracts stall work; over-loose ones
  reintroduce churn. *Mitigation:* leash confined to inside-a-pass implementation; contracts fixed.
- **Verification gaps (named).** Multica's exact MCP/API/webhook schema and precise LICENSE string,
  and Linear's field-mapping for an optional mirror, were confirmed at the capability level only.
  Validate in the build pass.

---

## Open (creative / scope)

Per canon §4, the only genuinely-open items touching this layer:

- **Auth topology across products/surfaces.** How users sign in across the yrka.io suites and the
  Studio — all-individual, some-shared, or one agnostic identity/entitlement plane the unified
  interface composes. Default leans toward a single identity/entitlement plane, but the exact shape
  is open and creative. This shapes how the Org layer expresses cross-product identity.
- **Org/project directory arrangement** may shift for deployment/auth reasons; the layer model and
  contracts are invariant under any such rearrangement.

Everything else here is committed.

---

## Sources

Official / external (verified 2026-06-01):
- Multica — https://github.com/multica-ai/multica , https://github.com/multica-ai/multica/blob/main/SELF_HOSTING.md , https://github.com/multica-ai/multica/blob/main/LICENSE , https://multica.ai/ , https://deepwiki.com/multica-ai/multica
- Multica v0.3.1 / 12-CLI support / self-host review — https://toolchew.com/en/review-multica-2026/
- Linear Agents API (AgentSessionEvent, session states, webhook setup) — https://linear.app/developers/agents , https://linear.app/developers/agent-interaction , https://linear.app/docs/agents-in-linear
- Agent Skills `SKILL.md` spec / cross-agent portability — https://github.com/anthropics/skills

Canon:
- `C:\Users\james\dev\docs\research\00-orchestration\plan.md` — the Operating Canon (§0 ethos, §1 hard rules, §2 committed decisions, §4 open creative/scope, §5 refresh directive).

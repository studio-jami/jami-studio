# Rebuild Research — Activity Log

Newest entries at the bottom. Times are local.

## 2026-05-31

- Goal received: orchestrate 11-workstream research/audit pass for the rebuild;
  Opus 4.8 subagents research then review/extend; organize into
  `yrka/docs/references/rebuild/research/`.
- Read `rebuild/research/goal.md` + `Rebuild.md` (master vision).
- Terrain mapping (no assumptions): enumerated `projects/` top level, `yrka/`
  (apps + packages + docs), `Luna/` (hermes, projects, docs), `_legacy/` (11
  projects), `_external/`, `references/` (ECC, Maestro, skills), agent configs
  (`~/.claude`, `~/.codex`).
- Read canon: `yrka/AGENTS.md` + `README.md`, `Luna/AGENTS.md`,
  `yrka/docs/engineering/quality/{report-style,planning-style}.md`, and the two
  prior `rebuild/agent-primitives/reports/` decision frames.
- Created research dir tree (`00-orchestration` + `01`–`11`).
- Wrote durable plan, progress checklist, activity log.
- Launched 3-phase research workflow (Task wwt9fno7s, run wf_570de975-de0):
  Phase 1 = 11 parallel research agents (one per workstream) → report.md each;
  Phase 2 = 11 review/extend agents reconcile cross-refs + fill gaps in place;
  Phase 3 = synthesis agent → 00-orchestration/synthesis.md. All Opus 4.8,
  agentType general-purpose, read-only except the research output dir.
- Awaiting workflow completion (harness will re-invoke on finish).
- Workflow wwt9fno7s returned: hit a SESSION RATE LIMIT near the end (reset
  5pm ET). 23 agents, 1.9M tokens, 28min. Disk audit vs. optimistic structured
  returns: reports PRESENT+solid = 01,04,05,07,10,11; PRESENT-reviewed (notes) =
  05,10,11; 09 = strong review-agent reconstruction but TRUNCATED at ~line 62;
  MISSING entirely = 02,03,06,08 (agents summarized but never wrote — cut off);
  synthesis.md MISSING. 8 review agents didn't emit StructuredOutput (some still
  did file work, e.g. 11 has review-notes).
- Launching remediation workflow (limit reset confirmed at 17:09 ET): Fill
  (write 02,03,06,08 + complete 09) → Review/extend (01,04,07) → Synthesis.
- Remediation workflow wv2e60jnq COMPLETE (9 agents, 1.25M tokens, 22min):
  filled 5, reviewed 3, synthesis written. Disk verified: all 11 report.md
  present and ending at `## Sources` (01:280, 02:315, 03:373, 04:272, 05:470,
  06:349, 07:269, 08:466, 09:307, 10:356, 11:301); synthesis.md = 530 lines,
  all 7 sections present; review-notes for 01,04,05,07,10,11.
- DONE. Whole-ecosystem verdict: rebuild is an extraction-and-separation
  exercise (compose products over 4 foundations: Harness/Registry/Orchestra/
  Intercal), not invention. Synthesis carries ~20 deduped open decisions +
  8-stage sequence + 9 questions for Jamie. Nothing locked. Presented in chat.

## 2026-06-01 — Course correction (Jamie)

- Hard pivot. Jamie called out repeated failures: option-menus that omit the
  obvious answer; dragging the past forward (the extract-from-yrka thesis is
  retrofit — FORBIDDEN); manufacturing skill-maintenance burden; rotating
  placeholder labels (Studio) instead of reassessing; forcing tools (Notion/
  Google). This is a GREENFIELD rebuild — no extraction, ever.
- New home is C:\Users\james\dev (system) → orgs/{jami.studio, yrka.io, jnh.org}
  → projects/. Reports moved to dev/docs/research/. jami.studio = OSS "Studio"
  (foundations: @jami-studio/harness, @jami-studio/ui, @jami-studio/orchestra, agent-collective,
  agent-delta). yrka.io = commercial SaaS (business/media/research suites +
  free-tools). jnh.org = personal (website).
- Rewrote plan.md → "Operating Canon": the One Ethos (Principled Edge), hard
  rules, committed decisions (greenfield, Multica-only orchestration replacing
  goal.md, official-canon-skills-no-maintenance + tiny thin-bridge set, Mintlify
  docs, industry OSS tooling for changelog/mapping/testing, Hermes separate,
  OAuth runtimes), order of work, and the only-creative/scope open decisions
  (auth topology, final names).
- Launching refresh workflow: 11 reports rewritten in place against the canon
  (greenfield, no menus, decisions baked) → synthesis refreshed.
- Refresh workflow wff3zwo5m COMPLETE (12 agents, ~1.03M tokens, 9min). All 11
  reports rewritten in place + synthesis (530→373 lines). Verified scrub: zero
  option-menus, zero extraction framing; residual "fold under yrka" / "MVP"
  hits are all explicit CORRECTIONS or real version refs (A2A v1.0). Reports
  leaner across the board. Canon-aligned: greenfield, Multica-as-whole-system,
  official-canon-skills + tiny thin-bridge set, jami.studio foundations /
  yrka.io suites / jnh.org personal, Mintlify docs, Hermes separate. Only open
  items: auth topology, final names, dir arrangement (each with end-shape default).
- agent-native investigation workflow w0sv8uppb COMPLETE (5 agents, ~644k
  tokens, 8min). 4 pillar files + recommendation.md in 12-agent-native/.
  Verdict: ADOPT WHOLESALE as harness + orchestra foundation; the
  Builder gateway/transcription are opt-in engines/adapters behind clean seams
  (voice-prototypes runs it with zero Builder services); MIT across all
  published pkgs (modify/redistribute/sell ok). Targeted swaps (all config/
  adapter): drop builder-engine → BYO ai-sdk/anthropic engine; DB default →
  Postgres; transcription → Transcriber adapter; integrations native-first
  (Nango behind ProviderReader seam only if needed; NEVER Composio; Nango=ELv2
  self-host sidecar only); 6 hardcoded accent presets → tokenized generator;
  analytics/branding → ours. Layer over (per 06): AG-UI transport rebind + MS
  governance toolkit at sharing/access.ts choke point. ui's ONE real
  build = distill 23 duplicated shadcn copies into one shared primitive
  registry (thin packaging). dispatch ≈ orchestra head-start. Folds open
  decision #1: org+sharing+dispatch = the identity/entitlement plane; only
  sign-in/federation shape stays creative-open. Risks: version drift (clone
  0.23.0 vs npm 0.32.0 — pin a fork), flat perms (RBAC is additive), rename
  Builder identity. AWAITING Jamie's go to lock into canon.
- Fact-finding pass (5 threads + `fact-finding/fact-finding-synthesis.md`).
  Corrected the pre-decision assertions the recommendation/spec-review carried:
  (1) PLANNER — Option A+, NO declarative DAG/workflow engine in the product
  runtime (agent loop + A2A task-store + run-manager + triggers + cron +
  approvals are the complete shape); the continual goal.md replacement is the
  Multica dev-system concern, not the product runtime. (2) AG-UI — keep native
  SSE as the internal spine (seq-replay + DB-sync, which AG-UI can't model); do
  NOT rebind it. AG-UI is a separately-built EXTERNAL interop adapter
  (`@assistant-ui/react-ag-ui`). Both built, neither optional. (3) GOVERNANCE —
  real package is `@microsoft/agent-governance-sdk@4.0.0` (Public Preview, NOT
  GA), API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256
  hash-chain audit, Cedar/OPA external HTTP bridges; adopt behind one
  `policyCheck()` seam. (4) DATA-MODEL — additive tables keyed org_id+email, zero
  core ALTERs. (5) Fork target = core 0.32.2 / dispatch 0.8.28 (0.23.0 is the
  read-clone); oauth_tokens read-scope gap confirmed, fix at fork.

## 2026-06-01 — Naming + separation decisions (Jamie)

- **Drop the `yrka_` table prefix.** Once forked it is all ours — no "core vs
  ours" split to mark, owner prefix is wasted weight. Natural names: `projects`,
  `resource_projects`, `capabilities`, `entitlement_keys`, `teams`,
  `team_members`, `capability_grants`. Added as a canon hard rule (§1).
- **Internal dev and product dev are strictly separated.** The internal layer
  (dev system, Multica, canon, plans, keys/secrets) sits underneath and builds
  the products; public repos sit on top with their own scoped secrets. Internal
  keys/plans never bleed into a public project repo. Added as a canon hard rule (§1).

## 2026-06-01 — Audit + flush decided items

- Full read-only audit of all 12 workstreams (16-cluster parallel pass) against
  the canon + decided-state. Verdict: drift was systematic, not random — five
  buckets (governance toolkit→SDK / GA→Public-Preview; AG-UI rebind→two-transport;
  versions 0.32.0→0.32.2 / 0.8.18→0.8.28; planner hedge→Option A+; `yrka_` prefix
  + voice "later/optional"). Clean: 02, 03, 04, 05, 07, 08, 09, 11 `report.md`.
- Two structural calls confirmed with Jamie: (1) fold workstream 12 into the
  master synthesis so it is the one complete START-HERE doc; (2) retire stale
  scaffolding (stub the 6 extraction-era review-notes; superseded-header the 12
  investigation tree) and fully-correct only the canonical set.
- Applied: corrected `synthesis.md` (12 folded in + governance/AG-UI/transport),
  `06`, `10`, `12 recommendation.md` (reconciled to fact-finding),
  `12 fact-finding-synthesis.md`, `12 data-model` (prefix stripped, DDL natural-
  named), `progress.md`. Retired 6 review-notes → stubs + 14 investigation docs →
  superseded headers (via workflow). `synthesis.md` marked START HERE.
- Status unchanged: committed direction, pending Jamie's green-light to lock into
  canon. Open items: auth sign-in shape, final names, dir arrangement (canon §4);
  leaning — Intercal/Collective own domains. Parked: paid voice live-eval.

## 2026-06-02 — Open-decision walkthrough (Jamie, one at a time)

- **#1 Auth sign-in shape — DECIDED (soft-locked).** Explained "shape" = factors ×
  IdP-topology × federation. Committed: self-hosted **BetterAuth as an OIDC issuer
  per domain**; **passkeys-preferred + OAuth fallback**; intra-domain SSO via OIDC;
  **domains unfederated by default but OIDC-ready** (federation/hosted-IdP lands late
  as config behind the auth adapter); public marketing routes ungated → gated
  `app.<domain>`; agents as first-class principals. (Industry alternatives weighed:
  hosted IdP — WorkOS/Clerk; central broker — Keycloak/Zitadel — both graduation
  paths, not now.)
- **#3 Directory arrangement — DECIDED (soft-locked).** Jamie's regroup: insert an
  org→domain tier so the three lanes he reasons in stay intact. Model is now
  **System → Org-lane (`oss`/`saas`/`personal`) → Domain → Project**
  (`dev/<org>/<domain>/projects/<repo>`). **Intercal + Collective are their own `oss`
  domains that consume the foundations — not foundations inside jami.studio**;
  foundation set = harness/ui/orchestra. **Free-tools live inside the `yrka` product
  monorepo and inherit its auth** (public on marketing domain, gated on `app.`). Domain
  = the identity/auth + brand + deploy boundary; org-lane = entity/funding/vault lane.
- **#2 Final names — still open (parked).** A cohesive naming sweep for when Jamie has
  the feel. Non-binding leanings: etymara (naming tool), intercal.dev (Intercal).
- **Voice — reframed + architected.** Off "parked-blocker": real-time is industry-proven;
  assume it works, plan it properly, live-eval becomes build-time validation. Confirmed
  three coexisting modes (text / baseline STT↔TTS retained / optional real-time
  supervisor). Supervisor = dispatch-to-harness + narrate-via-native-SSE-seq-replay,
  toggle mid-run; B (separate supervisor) over A (one agent does everything); A is B's
  degenerate case. The seq-replay we kept (vs AG-UI rebind) is what makes toggle-mid-run
  trivial. Launched **13-realtime-voice** fact-finding (6 agents) → `recommendation.md`:
  LiveKit Agents (Apache-2.0) transport behind a thin `realtime` adapter; xAI Grok Voice
  (S2S) default normalized to the OpenAI Realtime schema, behind the LLM adapter; S2S for
  the supervisor, cascading for baseline mode 2; net-new = only the dispatch/narration/
  session-mint glue; our SSE seq-replay IS the attach mechanism (no vendor ships one).
- Folded all of the above into the canonical docs: canon §2 (org/domain tier + Identity +
  Voice subsections, §4 open list → names only), synthesis (§1/§2/§3/§5/glossary/sources),
  06, 10, 04 (vault lanes oss/saas/personal), 07, 08 (four-tier model). progress + this log.
- Open decisions remaining: **only final product/brand names.** Everything else committed
  (soft-locked this phase), pending the green-light to lock into canon.

## 2026-06-02 (cont.) — Adapter-seams register

- Jamie surfaced **`@opencoredev/email-sdk`** (email-sdk.dev) — MIT, zero runtime deps,
  v0.5.0 (published 2026-06-01), unified send over Resend/SMTP/Postmark/SendGrid/Mailgun/
  SES with routing + fallback + capability checks + test adapters. Verified via npm registry.
- Decision: **adopt as the `email` seam impl** — Resend primary + SES/Postmark fallback,
  behind our own thin port (don't double-abstract; idempotency at our layer). Send-only;
  inbound/agent-mailboxes (AgentMail) stays a separate concern. Fits the agnostic ethos,
  costs nothing in bloat. Caveat noted: v0.x just-published → adopt behind our seam so a
  swap is trivial (same posture as governance SDK Public Preview).
- Generalized into a new **canon §2 "Adapter seams (the register)"**: the (a) commoditized-
  API + (b) real-portability-value test, the never-double-abstract rule, and a status table.
  Committed: inference/realtime-voice/STT-TTS/auth/governance/transport/secrets/**email**.
  Adopt-at-build (passes a+b): **OTel** observability (Sentry+GA as exporters — highest
  leverage next), thin **S3-API** storage port, **media-gen** port (Fal+peers). Bounded on
  purpose: **Stripe** = thin billing port (insurance, not agnostic); **db** already portable
  (Postgres-wire + Drizzle, no extra layer).
- Folded into canon §1 (pointer) + §2 (register table) and synthesis §3 (Adapter-seams
  subsection + Brand/funding comms line). progress + this log.

## 2026-06-02 (cont.) — Distribution & open-core model + Agent discoverability (AX)

- Jamie raised the OSS→SaaS transition strategy (fork/sync), the "full SaaS starter kit"
  idea, and agent-discoverability as preplanning concerns ahead of system mappings.
- Guidance given + corrections accepted:
  - **Depend, don't fork.** OSS↔SaaS boundary = a published package surface, not a git
    merge. Public OSS publishes versioned packages; private SaaS consumes via semver
    (`pnpm add`). Kills the merge tax AND structurally enforces the §1 no-bleed rule (OSS
    repo never contains SaaS code). Reframed Jamie's fork-and-sync model accordingly.
  - **Framework vs scaffold split.** Framework = depended-on, live-updated; scaffold
    (`create-agent-app`) = instantiated once and owned. yrka = scaffold + private `@yrka/*`
    on the public framework → we are a real user of our own OSS (reference impl, clean
    dogfood). OSS family = framework + `agent-cli` + MCP server + scaffold + adapter pkgs.
  - **Open-core line.** OSS = engine + every seam + complete single-tenant BYOK self-host
    (never crippleware); commercial = scale/hosted/enterprise-governance/billing/suites.
    Governance is the model split (seam+default engine OSS; enterprise impl commercial).
  - **Agent discoverability (AX).** Agents = first-class user persona. Legibility (uniform
    capability description via adapter/registries) = the distribution moat. AX surface:
    llms.txt, MCP server, official skills, agent-first CLI, OpenAPI+SDKs, capability
    manifest, AGENTS.md in scaffold. Discoverability ⇄ governance are one coin (safe agent
    install/provision rides the already-committed principals/policyCheck/audit primitives).
- Folded into **canon §2** (new "Distribution & open-core model" + "Agent discoverability
  (AX)" subsections) and **synthesis §3** (mirrored subsections). progress + this log.

## 2026-06-02 (cont.) — Core brand names decided

- Jamie decided the core brand names (part of the §4 naming sweep, done by him):
  - **jami** = the agent the harness presents. Backronym **"Just Another Machine Interface"**
    — self-effacing + observational humor + a play on his name.
  - **the Studio** = the environment `@jami-studio/ui` renders (the user's workspace).
  - **jami.studio** = the OSS platform/domain housing the foundations. Composition is
    deliberate: agent (jami) + environment (Studio) = platform (jami.studio).
  - **yrka** = the commercial product (unchanged).
- Captured the conceptual model: harness→presents→**jami**; ui→renders→**the Studio**.
- Folded into canon §2 Naming (now "committed core names") + §4 (open set narrowed to
  suites/Intercal/Collective/CLI/etymara/npm-scope), synthesis §1/§5/§6 glossary. progress.
- Reaffirmed: lean on proper tooling + automation throughout dev cycles (already canon §1/§2).
- **Open mapping question raised** (not assumed): how jami/Studio map onto package/repo names,
  and the npm publish scope (npm scopes can't contain dots, so `@jami.studio` isn't valid as-is).

## 2026-06-02 (cont.) — Package/repo naming convention decided

- Resolved the mapping. First principles: a scoped package has two slots (scope = brand,
  leaf = function) that should do different jobs. Picking `@jami` as scope already brands
  everything, so leaves stay clean/descriptive with zero scope-stutter. This collapses the
  two open questions (scope + package naming) into one answer.
- **Decided:** npm scope **`@jami`**; framework pkgs `@jami/harness`, `@jami/ui`,
  `@jami/orchestra`; CLI `@jami/cli` (binary `jami`); adapters `@jami/email`, `@jami/storage`, …;
  scaffold `@jami/create-app` (`npm create @jami/app`); GitHub org **`jami-studio`** (orgs can't
  contain dots either); repos = function leaves (`harness`/`ui`/`orchestra`); commercial scope
  `@yrka`. The `agent-harness`/`agent-ui`/`agent-orchestra` doc names = these leaves; they resolve
  to `@jami-studio/*` in the lock sweep.
- Folded into canon §2 Naming (new convention bullet) + §2 Distribution bullets + §4 (open set
  narrowed to suites/Intercal/Collective/etymara) + synthesis §3/§6. progress.
- **Tracked lock-sweep task:** propagate `agent-harness/ui/orchestra` → `@jami-studio/*` (+ `@agent-native`
  upstream refs stay) across the 12 workstream docs in one consistent pass.

## 2026-06-02 (cont.) — Namespace tokens finalized (availability resolved)

- Availability whack-a-mole resolved. `@jami` npm scope taken; `jami-studio`/`jamistudio`/`jami-dev`
  GitHub orgs taken; `getjami`/`jamihq`/`usejami` GitHub free (checked via GitHub API).
- **Jamie's call (final, owned):** keep npm org **`@jami-studio`** (already held) — it matches the
  `jami.studio` domain (hyphen-for-dot), which is the pairing that matters. GitHub org + socials =
  **`studio-jami`** (just claimed) — a deliberate reverse-match; GitHub need not byte-match npm.
- **Final identifier set (all owned/confirmed):** domain `jami.studio` · npm scope `@jami-studio`
  (`@jami-studio/harness|ui|orchestra|cli|create-app|email|storage…`) · GitHub org + socials
  `studio-jami` · agent + CLI binary `jami`. Commercial scope `@yrka`.
- Folded the final tokens through canon §2 Naming + §2 Distribution + §4, and synthesis §3 + §6.
  progress updated (org availability no longer pending — confirmed & owned).

## 2026-06-02 (cont.) — Commercial model & the Kit + suite philosophy + 5 research streams

- Jamie worked through the OSS↔commercial productization shape (slow-burn, long-term). Captured:
  - **OSS = the full `@jami-studio/*` family, genuinely open** (OSI, fully capable, BYOK, never
    crippleware) — adoption engine + preserves OSS funding eligibility.
  - **The Kit = a paid commercial product** (leaning under `saas`/yrka, flagship beside the suites):
    curated production-ready monorepo scaffold (marketing, billing+portal, roles/perms, suites) that
    the interactive `jami` CLI provisions to chosen vendors/configs/packages, + curated orchestration
    skills + docs + support. Differentiator = curation/assembly/support, never gating OSS. "Pay vs build."
  - **Orchestra optional + idempotent** — "set up my own SaaS" is a curated skill+instruction set (Kit),
    usable in orchestra or any LLM flow; single-agent ↔ full-orchestra is a toggle, not a re-provision.
  - **Revenue surfaces (directional):** hosted/managed ops; done-for-you dev; launch-ready Kits.
    Linchpin = hosting schema (agent-drivable, multi-tenant, platform-on-platform). Hard constraint:
    no shape may block OSS funding/credits.
  - **MakerKit = reference/model only** (proprietary $300 lifetime license; never redistributed; source
    under references/ for audit). "oars via MakerKit" not assumed forward.
  - **Payments/billing UPGRADED in the adapter register** from "thin only" → a provider-swappable
    billing adapter (Stripe/Lemon Squeezy/Paddle/Polar), revised on MakerKit evidence.
  - **Suite philosophy — bridge, don't replace:** yrka doesn't supplant specialized tools; it's where
    "the work behind the work" happens (touchpoints + adapters + normalization pipelines); suites are
    installable units interoperating via one shared registry.
  - **New hard rule (canon §1): latest official sources, always — assume training is stale** (dev AND
    security); critical on every project.
- **Open items added (§4):** packaging taxonomy (one canon term for installable units; lean "package");
  Kit placement (lean under yrka; resolved with hosting).
- Folded into canon §1 (new rule) + §2 (Commercial model & the Kit, Suites, billing register) + §4,
  and synthesis §3. progress updated. Deeper workstream-doc folding (10-product-concepts etc.) deferred
  to the consolidated post-research + naming sweep.
- **Launched 5 background research streams** (all instructed: latest official 2026 sources, cite+date):
  1. shadcn official registry — last-week developments + build-our-UI-registry-on-it implications.
  2. Hosting platform linchpin — agent-drivable, multi-tenant, platform-on-platform DX + OSS self-host.
  3. Open-core licensing + OSS funding/credit eligibility (MIT vs Apache-2.0; disqualifiers; MakerKit hygiene).
  4. MakerKit local-source audit + provider-agnostic billing adapter shape.
  5. Package/plugin/app taxonomy — one canon term for installable units.
  Findings fold into canon/synthesis (+ workstream docs) when they return.

### Research returns (4 of 5 in; all 2026-06-02 sourced)

- **Taxonomy (#5):** recommend **App** primary + 3-tier App/Package/Plugin (App = installable runnable
  surface; Package = shared lib never user-installed; Plugin = optional extension). "package" is
  unavoidable plumbing — don't overload it. Folded → canon §4 (pending Jamie's nod).
- **shadcn registry (#1):** `shadcn@4.10.0` (2026-06-01) shipped GitHub registries atop a fast-moving
  registry system (namespaced+private-auth registries, `registry:base` whole design system, MCP server +
  `shadcn/skills` = agents as first-class consumers). **Decision: build `@jami-studio/ui` ON shadcn's
  official registry, don't handroll.** We still own item-versioning (no first-class version field) + the
  host/auth. **Caveat:** distribution = source-inlining (install/seed, NOT a live render runtime) → confirm
  install-vs-runtime split for agent-to-UI payloads. Pin `shadcn@>=4.10.0`. Folded → canon §2 UI registry
  distribution.
- **Hosting (#2):** hosted Kit = **CF Workers-for-Platforms + Neon** (dispatch namespaces = deploy-on-behalf,
  per-tenant isolation, API provisioning, Workflows GA; DB-per-tenant + branch previews); OSS self-host =
  **Supabase + Neon(Apache-2.0)**. CF has no self-host parity → new **provisioning/control-plane adapter**.
  Verify Next.js-on-Workers parity + rate limits + pricing. Folded → canon §2 Commercial model + register;
  synthesis §3. (Recommendation, pending Jamie's confirm.)
- **Licensing/funding (#3):** **Apache-2.0** open foundation (OSI + patent grant + trademark reservation;
  MIT-upstream compatible). 100% OSI single-license; **DCO not CLA**; Kit/SaaS private. **AWS excludes
  VC/single-vendor → DigitalOcean + GitHub are the credit sources**; publish governance + CoC. Models:
  Supabase/PostHog; cautionary: HashiCorp/Redis/n8n/Sentry. **MakerKit strict clean-room** — EULA forbids
  building a Kit from it or training on it; keep it out of all repos + agent/training read paths. Folded →
  canon §2 Licensing & OSS-funding posture + hardened MakerKit bullet; §1 already requires latest sources.
  **Counsel to confirm** relicense mechanics + clean-room boundary.
- **Billing/MakerKit audit (#4): DONE.** MakerKit source found locally at
  `projects/rebuild/agent-primitives/agent-harness/references/makerkit-source/next-supabase-saas-kit-turbo`
  (+ `…/makerkit-plugins/…`). Audited as permitted clean-room reference (reading-for-patterns).
  - **MakerKit structure (patterns to model, not copy):** Turborepo with 4 naming tiers — `packages`
    (libs `@kit/*`) / `features` (built-in domains: auth, accounts, team-accounts, notifications, admin) /
    `plugins` (optional installs incl. Paddle, analytics, kanban, …) / `apps` (deployables). Billing is a
    mini-monorepo: `core` (provider-agnostic interfaces+Zod DTOs), `gateway` (facade+registry+webhook
    orchestration+UI), `stripe`, `lemon-squeezy` (Paddle as a plugin). RBAC + authorization live in
    Postgres (`has_role_on_account`/`has_permission` in RLS). Config = Zod schema with per-provider
    capability refinements (illegal plans fail at build). One idempotent `upsert_subscription` RPC is the
    sole entitlement writer.
  - **Adopted billing-adapter shape (canon register):** single-active swappable; two contracts (imperative
    strategy + reactive webhook handler); normalized event vocabulary (checkoutCompleted, subscription
    created/updated/deleted, payment succeeded/failed, invoicePaid, refunded, entitlement granted/revoked);
    lazy registry keyed by provider enum, env-var select, dynamic import so unused SDKs never bundle;
    provider customer-id decoupled via join table; webhooks = only writer → idempotent upsert into
    provider-neutral `subscriptions`/`subscription_items`/`orders`/`billing_customers`. **MoR vs direct is
    the one un-normalizable seam → `taxMode: 'self'|'merchant_of_record'` per provider** (MoR = Paddle/LS/
    Polar/Stripe Managed Payments; direct = Stripe + pluggable Stripe Tax). Multi/per-tenant deferred —
    same registry enables it later. Grounded in official Stripe/Polar/Paddle/LS docs (2026-06-02).
  - **Taxonomy refinement:** MakerKit's internal `features` tier (built-in first-party domains) is worth
    considering as an internal organizing layer; our user-facing unit stays **App** (canon §4).
  - Folded → canon §2 billing register row + hardened MakerKit bullet; progress. All 5 streams complete.

## 2026-06-02 (cont.) — Funding posture defined · 2 up-front research streams · naming sweep

- Jamie's clarifications/directions:
  - **Render mechanism (shadcn seed vs live runtime)** must be resolved UP FRONT — what's the
    industry-leading approach + how this product deserves to handle it. → research stream **#6** launched.
  - **CF Workers ≠ Next.js parity** is NOT a build-it-then-test decision — determine from existing
    evidence now, before committing hosted. → research stream **#7** launched (verdict may split the stack).
    Sharpened the canon UI-registry + hosting bullets to "determined up front (research #6/#7)," not "verify
    at build."
  - **Funding posture — DEFINED:** bootstrapped, NOT VC-backed (one independent dev, self-funded) → an
    asset for OSS credits (several programs exclude VC-funded). Minimal admin now (Apache-2.0 + public repo +
    LICENSE/README/CONTRIBUTING-with-DCO/CoC/light GOVERNANCE) unlocks DO + GitHub Sponsors + vendor startup
    credits, all individual-eligible. Heavy items (legal entity, trademark, accelerators) deferred to
    traction; C-corp is a commercial-lane "when ready" step, not an OSS prerequisite. Keep every door open
    without retrofitting; self-gating is the only real risk. Folded → canon §2 + synthesis §3.
  - **Green light is standing for doc cohesion** ("the light never goes red" for keeping working docs
    updated/cohesive so we don't drift). → executing the **naming sweep** (`agent-harness/ui/orchestra` →
    `@jami-studio/*`) across the research tree this session (separate agent, careful rules; keeps
    `@agent-native` upstream + real filesystem paths untouched).

### Research returns #6, #7 + naming sweep complete (all 7 streams done)

- **Render mechanism (#6) — verdict folded (canon §2 "UI render seam").** Confirms the hypothesis: TWO
  registries, two lifecycles. (1) shadcn registry = **build-time SEED** (resident tokenized vocabulary,
  never in the request path); (2) a separate, app-resident **allowlisted component registry** renders the
  harness's **`UIPayload` (data, not code: `{component, props, children?}`)** — name∈registry → Zod-validate
  props → render resident component → graceful fallback on unknown. Convergent 2026 pattern (Vercel AI SDK,
  Google A2UI "trusted catalog", CopilotKit Pattern Registry, Thesys/Crayon "spec not code"). **AG-UI (ext)
  + native SSE (int) carry the stream** — channel not renderer, sits above the registry, no new transport.
  **MCP-UI/MCP-Apps iframes = wrong for the core** (bypass the design system) → untrusted-third-party lane
  only. Safety = allowlist + Zod + no-code/HTML + sanitize. **Version skew = dominant risk** (SDUI lesson):
  vocabulary-version (build-pinned, we own it — shadcn has none) vs payload-contract-version (runtime),
  additive-only, handshake, graceful degrade.
- **CF parity (#7) — verdict folded (canon §2 hosting + register): SPLIT THE STACK.** `@opennextjs/cloudflare
  @1.19.x` is GA + production-ready for small/medium Next.js (App Router/RSC/SSR/ISR/Server Actions/PPR/
  `use cache`/`next/image`-via-CF-Images), but bounded gaps (no Edge runtime, no Node middleware, no Sharp,
  no global DB clients) + **10 MiB bundle / 128 MB isolate** ceilings make heavy per-tenant Next.js Workers
  the wrong default. **Cloudflare = platform plane** (WfP dispatch, Durable Objects, Workers AI/Vectorize/
  Queues, KV/R2/D1, edge); **Next.js apps on Vercel/Node host** (CF Containers ok) fronted by the CF router;
  optional first-party control-plane Next.js on Workers. Neon both planes; OSS self-host = Supabase + Neon.
- **Naming sweep — COMPLETE.** ~150 token replacements across 24 .md files; `agent-harness/ui/orchestra` →
  `@jami-studio/*` (package form) / bare leaves (prose). Upstream `@agent-native`/`agent-native` (1,240
  occ., incl. the whole `_pack` vendored tree) + real filesystem paths + self-referential rename-task
  descriptions all correctly left intact. Reconciled the one flagged stale `@jami/*` → `@jami-studio/*`
  (activity-log:246). A few capital-`UI`/"orchestrated"-substring false positives correctly skipped.
- **All 7 research streams complete and folded. Canon + synthesis cohesive.** Standing follow-ups: IP counsel
  (Apache mechanics + MakerKit clean-room), and the eventual workstream-doc design-detail consolidation.

## 2026-06-02 (cont.) — Hosting teaching + contribution-pattern note + hosting deep-dive

- **Taught the hosting mental model** (Jamie asked to understand node/workers/edge/runtimes + Next.js apps +
  Vercel cost). Key reframe folded to canon §2: every product = **web surfaces** (short/stateless → kiosk/
  serverless) vs **agent "kitchen"** (long-running/stateful → container host, never serverless); the
  harness/orchestra are **Node services, not Next.js apps**. Per-product mapping: **jami.studio** =
  web-surface → Vercel/static(Astro), cheap; **yrka.io** = split-stack (web on Vercel/container; kitchen on
  container + CF Durable Objects; CF platform plane; Neon). Validated Jamie's intuition that Vercel is
  mispriced for long agent sessions.
- **Multi-host principle (folded):** portability is proven by the portable build (containers + Postgres +
  provisioning adapter) + OSS self-host, NOT by redundant prod copies. Split-stack already = honestly
  multi-platform → apply to credit programs truthfully; migrate opportunistically; never duplicate prod to
  chase credits (anti-ethos). One domain is no constraint (subdomains route across platforms).
- **Contribution-pattern note added to canon §0** ("how we work best") at Jamie's explicit request:
  **user-intent → industry-informed, hackable solution** — the agent grounds Jamie's edge-lean in current
  truth and pushes back with the principle (not order-taking, not cheerleading). Worked example = the
  hosting split-stack itself.
- **Launched hosting deep-dive research** (background): per-bucket (web surfaces vs agent kitchen) × per
  product, on capabilities/cost/DX/fit/lock-in/OSS-self-host, 2026 official sources. Bucket-A (Vercel/CF
  Pages-Workers/Netlify/static-Astro) + Bucket-B container hosts (Fly/Railway/Render/Cloud Run/CF Containers
  + Durable Objects) + the CF Workers-for-Platforms plane.

### Hosting deep-dive returned — named stack folded

- **Verdict (canon §2 + register + synthesis):** **jami.studio → Cloudflare Pages** (Astro/static; ~$0–5/mo,
  unlimited bandwidth, painless subdomains). **yrka.io → one Cloudflare plane** (Pages/Workers first-party
  web via `@opennextjs/cloudflare` + **Workers-for-Platforms** tenant deploy-on-behalf + **Durable Objects**
  for agent session state — DO hibernates, idle sessions ≈ $0) **+ Google Cloud Run** as the heavy container
  **kitchen** (native scale-to-zero, 60-min request timeout, **Jobs to 7 days** for long agent runs, optional
  L4 GPU scale-to-zero) **+ Neon** (co-locate Cloud Run in Neon's primary region). Fly.io (Machines API for
  agent-spawned sessions) / Railway (best DX) = valid kitchen alternatives.
- **Cost intuition:** Vercel Fluid bills provisioned memory for the whole instance lifetime incl. I/O wait;
  agent sessions are mostly I/O wait for minutes + hard 13-min ceiling (Pro) → mispriced. Containers
  multiplex many sessions/GB, no duration ceiling; DO doesn't bill duration while hibernating. yrka kitchen
  ≈ **$50–80/mo small, $150–300/mo moderate** (Cloud Run + DO + WfP + egress). CF Pages = unlimited bandwidth
  (no Vercel $0.15/GB egress trap).
- **Portability + deliberate lock-in:** kitchen ships as plain Docker (runs on Cloud Run/Fly/Railway/Render/
  CF Containers — move in an afternoon); standard `postgres://`; OpenNext = adapter (`next start` in a
  container). Accept-on-purpose proprietary: **Durable Objects** (stateful actor + hibernation) + **WfP**
  (deploy-on-behalf) — isolate behind our own session/tenant interfaces; wrap CF/Cloud Run/Fly provisioning
  behind one "spawn session" interface (the provisioning seam).
- **Verify at decision:** Cloud Run 60-min ceiling (Jobs for longer); DO 30s-CPU/invocation (offload heavy
  compute to container); DO SQLite storage billing (live Jan 2026); Fly GPU removed after Aug 1 (GPU = Cloud
  Run L4); OpenNext Next.js-16 parity for yrka UI; Cloud Run↔Neon region co-location. All sources dated
  2026-06-02.

### Vercel-swap reasoning folded (deploy pipeline + cost-onset + don't-waypoint)

- Jamie flagged that swapping Vercel is a big internal/mental move; the bar = replicate Vercel's magic
  (push-to-deploy, secret sync, vendor/env wiring, free-until-scale, previews). Excited re Railway as a
  top target; affirmed Cloud Run fits internal plans; wants options open. Asked the key question: is the
  "Railway-for-DX-then-migrate-to-CF/Cloud-Run" two-step worth it, and do the targets cost from day one?
- **Answer folded to canon §2 + synthesis:**
  - **The real Vercel-replacement = a host-agnostic deploy+secrets pipeline** (GitHub Actions builds/deploys
    the Docker image + the committed 1Password/SOPS secrets adapter injects). We *bring* the magic → the host
    is a commodity, never re-trapped. Swap bar made explicit (5 items).
  - **Cost-onset:** CF Pages ≈ $0 (unlimited bandwidth); **Cloud Run ≈ $0** at dev scale (perpetual free
    tier — 180k vCPU-s + 360k GiB-s + 2M req/mo); **Railway ~$5/mo floor** (Hobby, metered); Vercel
    free-Hobby/$20-Pro. → **Targets are cheaper than Railway at day-one scale**; Railway's only edge is
    zero-setup DX.
  - **Don't waypoint:** "Railway → migrate later" saves no money (targets free) and the pipeline closes the
    DX gap → it's churn. Two clean choices: **(A)** build pipeline → land on CF Pages + Cloud Run from day
    one (free, final, no migration — **lean**); **(B)** Railway as the actual DX *home* if turnkey-now is
    worth ~$5/mo, migrating only when scale forces it. Railway-as-home OK; Railway-as-waypoint = avoid.
    Railway stays a fine option for prototypes/lighter projects.
  - **To verify at commit:** Railway's exact deploy/secret/preview DX + 2026 pricing against the swap bar.

### Hosting DECIDED — Option A (Jamie)

- **CF Pages + Cloud Run from day one** (Option A) is the chosen path for jami.studio/yrka.io/jnh.org, on
  the host-agnostic deploy+secrets pipeline (GitHub Actions + 1Password/SOPS secrets adapter + in-repo
  env/vendor wiring — OSS/official tooling, no bespoke). Upgraded canon/synthesis from "lean A" → "DECIDED A".
- **Railway = not in the core stack** — kept only as a documented Docker-portable fallback (with Fly) and a
  fine DX option for *unrelated* external projects (isolated per §1 no-bleed). External free-Vercel use for
  unrelated projects is fine and won't detract.
- **Refinement captured:** cheapness comes from **perpetual free tiers** (CF Pages free; Cloud Run free tier
  180k vCPU-s + 360k GiB-s + 2M req/mo), NOT the GCP/startup trial credits (bonus runway, expire) — do not
  architect around expiring credits.

### Two sharpenings (Jamie)

- **Trial credits = active dev budget (reframe).** ~$1.3k GCP credits, ~1-year window → a *deliberate
  development budget*: earmark + burn aggressively on compute-heavy dev work (provider evals, load/
  integration testing, eval-driven SaaS dev-provider selection). Free tiers govern PRODUCTION cost (never
  expire); credits fund DEVELOPMENT (exploit to the max within the year). Only rule: production must never
  *depend* on credits. Folded to canon §2 hosting cost bullet.
- **Separation is by directory home (made explicit).** `C:\Users\james\dev\` = ALL work for the three core
  domains (jami.studio/yrka.io/jnh.org) = the system. `C:\Users\james\projects\*` = the retiring legacy tree
  + unrelated/external projects (incl. external free-Vercel/Railway use), each with own accounts/secrets.
  The split is physical (two directory roots) → isolation is the default, the concrete embodiment of the §1
  no-bleed rule. Tightened the old "all new work in dev/, exclusively" line accordingly. Folded to canon §2
  Structure & layering.

## 2026-06-02 (cont.) — Feasibility-report stage scaffolded (docs/reports/)

- New doc stage agreed: `research/` = preserved thinking/trail; **`docs/reports/`** = final-shape
  pre-planning, organized by responsibility/concern, canoning down from research + cementing peripheral
  decisions. Per-report template (8 sections; §4 "remaining decisions to cement" = the heart).
- Decomposition decided: hybrid **17 reports** (from a 21 candidate map; redundancy merged) across 5 domains
  — A Platform foundations (F01–04), B Agent substrate (F05–10), C Capability adapters (F11–13),
  D Distribution/products/AX (F14–16), E Go-to-market (F17). Core (A+B) fine-grained; edges grouped.
- **Scaffolded:** `docs/reports/README.md` (index + template + authoring plan) + all 17 skeletons
  (header + seeded scope/committed-decisions/cements + sources + section stubs). Status on each: SCAFFOLD.
- Execution agreed: after Jamie eyeballs the structure, **one cohesive authoring agent** drafts the full set
  against canon/synthesis/research (single author = consistent voice/cross-refs/decisions, not fragmented).
  AWAITING Jamie's go on the authoring pass.

## 2026-06-02 (cont.) — Operations side gets a research-first pass (E expanded)

- Jamie broadened the supporting side: the single F17 "go-to-market & funding" under-served it. The whole
  periphery (brand, marketing/content, funding/grants/pitch, sales/GTM, legal/compliance/IP, finance/ops,
  community/support) deserves systems-level treatment.
- **Unifying concept = the Operations Canon:** one canonical source of truth for durable business facts/
  assets/configs → every supporting artifact is a generated/parity-maintained projection (deck, grant app,
  site copy, legal boilerplate, one-pagers, bios), never hand-maintained in parallel. The dev ethos (one
  canon, serve out, keep in parity; never hardcode transient) applied to the business layer; the §1
  "supporting components prod-ready" rule made into a system. Lean/owned/agnostic.
- Since these are NEW, un-canon-backed ideas, Jamie's call: **research + propose first, THEN feasibilities**
  (don't author E on un-researched concepts). Domain E expands: F17 Operations Canon + F18–F24 lanes;
  scaffold-all, author-staged (deep on Stage-0 = funding/pitch, legal-eligibility, brand-basics).
- **Launched** a cohesive ops research+proposal agent (background) → `docs/research/14-operations/proposal.md`
  (Operations Canon system + per-lane strategy/outcomes/lean-stack + staging aligned to the launch order;
  2026 sources, cite+date; builds on the committed funding posture; flags founder's-creative-call items).
- **Feasibility authoring pass HELD** until the ops proposal is in + refined, so the single author drafts the
  complete A–F set cohesively rather than dev-now/ops-later. (F17 scaffold is provisional — restructured
  post-proposal.)

## 2026-06-02 (cont.) — Ops proposal locked · E re-scaffolded · authoring agent launched

- Reviewed the ops proposal (strong, aligned, lean). Jamie's "lets lock it in, shape it up and run the
  report agent." Entity question reframed (Reddit Clerky/S-corp tangent): entity TYPE+tool now OPEN in the
  proposal + F22 — C-corp (QSBS clock) vs S-corp/LLC pass-through; Atlas vs Clerky; CPA-decided at
  incorporation; not a blocker (Ops Canon `company.yaml` just holds whatever's chosen).
- **E re-scaffolded** to 8 reports (F17 Operations Canon + F18–F24 lanes), seeded from the proposal; old
  single `F17-go-to-market-and-funding.md` removed. Full set = **24 reports** (A 4 · B 6 · C 3 · D 3 · E 8).
- **Locked:** infra defaults (shared org-lane `founder.yaml`, Mercury banking, apply-after-surface-live).
  **Open (flagged, not invented):** product/suite names, pricing, visual identity, deck voice, entity type+tool.
- **Launched the single cohesive authoring agent** (background) over all F01–F24: dev grounded by canon/
  synthesis/research, ops by 14-operations/proposal; full depth F01–F16 + Stage-0 ops (F17/18/20/22), staged
  lanes tighter (F19/21/23/24); house style; cross-linked; never contradict canon (flag `canon-change-needed`);
  flag `needs Jamie` creative calls. Will fold the agent's open-calls + any canon flags on return.

### Authoring pass complete — feasibility stage done

- **All 24 reports `AUTHORED 2026-06-02`** by the single cohesive author (~22k words, 84 tool-uses). Full depth
  F01–F16 + Stage-0 ops (F17/18/20/22); staged lanes solid-but-tighter (F19/21/23/24, activation deferred to
  their launch stage). Cross-linked dependency graph reads as one system (F05→F06→F07 spine; F02 principals →
  F06/F15; F17 Ops Canon → all of F18–F24; F03 → F04/F01).
- **No `canon-change-needed` flags** — every report grounded cleanly on canon/synthesis + its cited sources.
- **Quality spot-check:** F17 (Ops Canon — data model + projection table + 3 drift guards + serve-out, fully
  cross-linked) and F09 (render seam — UIPayload type + two-registry lifecycles + version-skew handshake) both
  strong + consistent. Confidence high across both halves.
- **Open `needs Jamie` calls consolidated** into `docs/reports/README.md` (creative naming sweep · visual/
  narrative identity · pricing/packaging · entity-CPA + license-counsel · banking/program-priority prefs ·
  founder-facts resolved-to-default). These are the same periphery as canon §4 + the known expert calls — now
  precisely enumerated per report. Nothing new opened.
- **Feasibility stage complete.** Pipeline closed end-to-end: research → canon → synthesis → scaffold →
  cohesive authoring (dev + ops both grounded). Natural next phase = roadmap/implementation (canon §3) on
  Jamie's go.

## 2026-06-02 (cont.) — Reports sub-foldered + agentic-access policy (god-mode, vaulted)

- **`docs/reports/` reorganized** into per-domain subdirs (`A-platform-foundations` … `E-operations-gtm`);
  relative `../research/` links auto-fixed to `../../research/`; README index now links into each subdir.
  Cross-report refs use bare `F##` ids (survived the move).
- **Agentic-access decision (Jamie, flagged non-negotiable):** internal automated dev runs on **god-mode**
  account access — agents fully provision/configure all services/projects/keys via CLI; **never settle for
  access-blocker friction.** Calculated, time-boxed risk; granular least-privilege folds in **by production**.
  Protected, frictionless form (adopted — same power, no friction): (1) **max-scope _revocable_ token per
  provider, not the Global/root key** (revoke-one beats reset-all on leak); (2) **vaulted only** in the
  secrets adapter, runtime-injected, **dev-layer-only** (no-bleed); (3) **one bootstrap god-key → a
  provisioning agent mints + vaults everything else via CLI** (dashboard once, ever). **Human-confirmed
  exceptions (outliers):** irreversible/destructive/financial (delete account/org, transfer/delete domain,
  cancel billing, drop prod data, move money). Folded → canon §1 (flagged hard rule) + F03 §2.
- Cloudflare action now: mint ONE broad Custom Token (All accounts/zones + edit groups, ~10 clicks once) →
  1Password → provisioning agent does the rest. (Token over Global Key for revocability; zero friction.)

## 2026-06-02 (cont.) — God-mode correction + account/vault topology

- **Correction (Jamie):** the "notable exceptions = destructive/financial stay human-confirmed" framing was
  WRONG. **God-mode = everything a platform exposes; we impose NO carve-outs.** The ONLY exceptions are
  **platform-imposed hard limits** (capabilities the platform itself won't expose to an agent/API — e.g., a
  console blocking programmatic project creation) — outliers outside our control, not policy choices.
  Corrected canon §1 + F03. Cloudflare full-access master token **created** (every permission) + to be vaulted.
- **Per-platform account/isolation topology decided:** the org-lane boundary maps to each platform's *natural*
  isolation unit, not a blanket "account per lane":
  - **Cloudflare = account per org-lane** (oss acct = jami.studio + future intercal/collective; saas acct =
    yrka.io + future; jnh.org stays on Vercel). Mirrors entity/funding boundary; each lane catches its own
    baseline; avoids per-domain sprawl + one-master blur.
  - **1Password = ONE account + a vault per lane** (oss/saas/personal; per-domain item namespacing; per-lane
    **Service Accounts** for headless agents). The vault is 1Password's isolation primitive → one account
    suffices (matches 04-secrets "one vault per lane"). 1Password handles multiple accounts fine if ever
    needed, but entity-owned account splits defer to traction (F22). Business tier for Service Accounts +
    custom vaults (verify plan); SOPS+age floor is plan-independent.
  - **Neon = project per lane.** General principle: same org-lane boundary, expressed in each platform's
    native isolation unit.
  - Folded → F03 §2 (per-platform topology bullet). To record in the Ops Canon `pipeline.yaml` (accounts/
    vaults/renewals per lane) when it's stood up.

## 2026-06-02 (cont.) — Secrets backend → free/OSS (1Password dropped) + vendor cost audit

- **Jamie: no paid password mgmt at this bootstrapped stage — OSS/free, easy, no sharp edges.** Implications
  for the harness considered + all paid vendors revisited.
- **Secrets swap (canon §1, synthesis, F03, 04-secrets REVISED banner):** **drop paid 1Password** (no free
  tier, $8/user/mo). **SOPS + age = the sole machine-secrets backend** (free, OSS, no server, git-native) —
  it was already our "offline floor," now promoted to primary; the adapter gets *simpler* (one backend, same
  `secrets get`/`secrets run` seam). **Per-lane isolation = a per-lane age keypair** (replaces 1Password
  vaults/Service-Accounts); agents get the lane's age key at runtime (never committed). **Interactive logins
  + age-key custody → Bitwarden (free, OSS)** [or OS keychain; Vaultwarden self-host later]. Infisical/Vault
  deferred behind the same seam if scale ever demands. The per-platform-isolation principle holds (Cloudflare
  → account-per-lane; secrets → age-key-per-lane; Neon → project-per-lane).
- **Vendor cost audit (all docs):** stack already overwhelmingly free-tier / OSS / deferred. 1Password was
  the ONLY genuine now-cost paid dependency → fixed. **Mintlify** = keep on free tier; **Astro Starlight**
  (free OSS, aligns with the Astro stack) is the fallback if the free tier pinches. Stripe Atlas ($500) /
  Clerky = one-time, deferred to launch (F22). Resend/CF/Neon/Cloud Run/Vercel = free tiers; Mercury = free;
  Bluesky/Postiz/LiveKit/OTel/governance-SDK/Supabase = OSS/free; voice-S2S/Fal/X/Stripe-% = usage-only.
  Coding runtimes = existing subs. **Conclusion: bootstrapped-lean was already baked in; no other now-cost
  leaks.** Posture recorded: free/OSS-first at this stage; paid deferred to traction.

## 2026-06-02 (cont.) — Secrets backend → Bitwarden Secrets Manager (the seam is the truth)

- Corrected an operational error (mine): said "agents never use the bw CLI" — wrong; the whole premise is
  full agentic access. Jamie found **Bitwarden Secrets Manager** (machine accounts, project scoping, `bws`
  CLI) — a real machine-secrets product. Verified free tier: **unlimited secrets, 3 projects, 3 machine
  accounts**; self-host SM = Enterprise; cloud on free.
- **Decision: backend = Bitwarden Secrets Manager** (free tier maps exactly to the 3 lanes: project-per-lane,
  machine-account-per-lane, `bws`/`BWS_ACCESS_TOKEN` for agents+CI). One Bitwarden account unifies bucket A:
  password manager (logins/folders/recovery) + Secrets Manager (machine secrets). **SOPS+age demoted to a
  documented swap-target** (offline/owned/no-tier fallback) alongside Infisical/Vault. **The `secrets` seam is
  the committed truth; the backend is config** — so this 3rd backend flip (1Password→SOPS→BWSM) cost no
  call-site change. Reframed all secrets docs around the seam to stop the churn.
- Jamie's 4-point model validated w/ sharpenings: (1) secrets = a **foundational adapter seam** (F03) the
  orchestra/harness/pipeline consume + the shipped foundations carry — not an orchestra-only module; (2)
  adapter-mentality/parity/user-choice = correct → added **`secrets` to the canon Adapter-seams register**;
  (3) dev secrets (bucket A) ≠ harness shipped user-secret store (bucket B) = correct (same pattern, walled
  instances); (4) broad-now → least-privilege-by-production = correct, **derived from observed god-mode usage**
  (not guessed), and distinct from the **product's** shipped permission baseline (policyCheck default engine,
  F06 — a sellable feature). Folded → canon §1 (god-mode rule + register row) + F03 + synthesis + 04-secrets banner.
- Free-tier ceilings noted (3 projects/3 machine accounts; cloud-only on free; self-host SM = Enterprise) —
  fit the lanes now; >3 or full self-host = a later swap via the seam (to SOPS/Infisical). Not lock-in.

## 2026-06-02 (cont.) — Real-world setup begins (planning → execution)

- **BWSM model clarified hands-on** (verified against Bitwarden docs): Org → **projects** (drawers of secrets)
  → **machine accounts** (agent identities, *assigned* to projects with read / read-write) → **access tokens**
  (`BWS_ACCESS_TOKEN`, the key an agent carries). **Secrets** = the real stored creds (name you choose + the
  actual credential), each in ONE project. **Cross-access = assignment, never duplication.** Hierarchy: master
  password → org → machine-account access token (agent bootstrap, stored in PM `keys-&-recovery` + injected)
  → secrets in assigned projects → the real infra keys.
- **Scaffolded by Jamie:** Bitwarden — 3 projects (oss/saas/personal) + 3 machine accounts (per-lane) +
  `*-master` access tokens; cross-assigned (read-write) for tightly-linked dev. No secrets yet — seeded as-we-go.
  Cloudflare — per-lane accounts; jami.studio connected + active; master token created.
- **Folded → F03 §3 (as-built setup note) + progress (Real-world setup underway section) + this log.** Per-lane
  machine accounts retained so least-privilege can later be derived by narrowing each to its project (canon §1).
- **Status:** the rebuild has crossed from pure planning into real-world account/secrets scaffolding. Feasibility
  set (F01–F24) authored + sub-foldered; secrets/CF live; next is per-lane env mapping + the provisioning-agent.

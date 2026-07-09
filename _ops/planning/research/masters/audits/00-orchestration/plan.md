# Rebuild — Operating Canon

Date: 2026-06-01
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Status: Active contract. Every agent reads this before touching any report or doc.
Supersedes: the 2026-05-31 "extraction-era" lens. That framing is retired.

This is the single source of truth for the rebuild research/doc refresh. It bakes
in the decisions Jamie has made. Agents do **not** re-open baked decisions, do
**not** present option menus for them, and do **not** invent opinions or decisions
Jamie has not given. Where something is genuinely undecided, it is **creative or
scope** only, and the default is the **final end-shape**, never an incremental one.

---

## 0. The One Ethos — "Principled Edge"

The single recurring principle behind every interaction:

> **The perfect blend of first-principles, production-grade systems design and a
> bleeding-edge, risk-seeking hacker mentality.**

Two tests every decision must pass simultaneously:

1. **Root-correct.** Is this the correct root-level, production-shaped, agnostic
   design? Implementing a feature means implementing the _capability at its root_
   — accent color ⇒ a fully tokenized, parameterized design system, never three
   hardcoded colors. Anything less is wrong 100% of the time.
2. **Zero-bloat lean.** Is this the leanest path that adds **no** weight for
   capability we don't need now or in the planned end-shape?

A **shortcut is valid only when first principles prove the skipped work is
irrelevant** now and in the end-shape — then taking it is _mandatory_, because
the edge-case rigor would be pure bloat. A shortcut taken _without_ that proof is
forbidden. Equally forbidden: adding scaffolding, abstractions, or "just in case"
work that buys no measurable capability. Cutting corners and over-engineering are
the same failure — weight uncorrelated to capability. Principled Edge removes it
in both directions.

### The contribution pattern (how we work best)

The most effective contributions follow one shape: **user-intent → industry-informed,
hackable solution.** Jamie brings the vision and a bias toward the bleeding edge; the
agent's highest-value move is to **ground that intent in current industry-informed truth
and push back with the principle** when the edge-lean overreaches — turning a raw instinct
into a root-correct, zero-bloat, _still-hackable_ solution. Not order-taking, not
cheerleading: **principled pushback** that lands the idea where capability and the edge
actually meet. (Worked example, 2026-06-02 — the hosting **split-stack**: Jamie's lean
toward running everything on the edge, grounded back to web-surface-vs-agent-kitchen + a
"migrate opportunistically" multi-host principle, instead of forcing one host or chasing
edge everywhere.)

---

## 1. Hard Rules (non-negotiable)

- **Greenfield. No extraction, no retrofit, no legacy carry-forward.** Every line,
  name, directory, contract, and standard is authored fresh. We do **not** lift
  code from `yrka/`, `_legacy/`, or any current project. Prior work is _input to
  thinking only_ — all of it is up for reconsideration; none of it is precedent.
  "Rebuild" is not an option, it is the premise.
- **Commit to the obvious answer.** When first principles point to one answer,
  state it and move. **No option menus** for settled questions. Menus exist only
  for genuine creative/scope choices, and even then carry a recommended default.
- **Official canon everywhere; we maintain almost nothing.** Use official vendor
  tooling/skills and one trusted, highly-rated community baseline that meets or
  exceeds our standards. **We never edit or upkeep official canon.** We author
  only a _tiny_ curated set of our own **thin-bridge orchestration skills**
  (goal.md-style: "do exactly this, then this, then repeat") that encode our
  no-nonsense, deterministic, repeatable workflow. If a shipped official skill
  already does it as well or better, we use it and ship nothing.
- **Industry-leading open-source or generously-free, polished, agent-friendly
  tooling** for changelog, docs, system mapping, graphing, testing, browser
  automation. **No bespoke tooling** for solved problems. Bespoke is allowed only
  when no official/trusted-community option exists _and_ Jamie has stated why —
  and then it stays extremely simple, deterministic, repeatable, durable.
- **Never hardcode anything transient** — models, colors, styles, file paths,
  doc names, plan names, vendor lists, pricing. Use a data model, config, or
  live-sync API feed. Durable docs link durable directories, never transient
  artifacts.
- **Latest official sources, always — assume training is stale.** Treat model/training
  knowledge as outdated for every development and **security** specific. Before deciding or
  building anything drift-prone (APIs, SDK/framework features, versions, pricing, protocols,
  licenses, security practices), verify against the **latest official source** and date it. This
  is a standing, **critical** requirement on every project and every kind of work — not a
  per-task option. When official guidance contradicts this doc, the official source wins and the
  doc is updated.
- **Full implementation, no partials.** Everything planned gets implemented fully.
  Never ship part and ask "want the optional extras?" — it all goes in the plan
  and all gets built. Every workstream has concrete closing criteria.
- **Agnostic + adaptable.** Host, db, storage, LLM, auth, billing, runtime all sit
  behind thin adapters. Stay ready to adopt the next better tool with no rewrite.
  The running list of seams + the test for adding one lives in §2 **Adapter seams**.
- **Final end-shape language only.** No "MVP", "prototype", "v1/v2", "phase 1",
  "for now", "defer until demand". Each stage is the production shape of its layer.
- **Don't break what works.** Build the shared dev infra _underneath_ existing
  setups without editing/removing current configs, secrets, runtimes, or the old
  `projects/` tree. The old tree retires slowly on its own.
- **Internal dev and product dev are strictly separated; internal never bleeds
  into product.** The internal development layer — the dev system, orchestration
  (Multica), the canon, plans/roadmaps, and especially **keys and secrets** —
  sits _underneath_ and *builds* the products. Public-facing product/project code
  sits _on top_. Internal keys, secrets, credentials, and internal plans must
  NEVER be committed into, imported by, referenced from, or leak into any
  public-facing project repo. Each product/org carries its own scoped secrets and
  public-appropriate docs; the way we build is never embedded in what we ship.
  Dogfooding our own tools is configured in the internal layer with internal
  secrets, kept out of the shipped artifact.
- **Agentic dev runs on full-access provisioning credentials — NEVER settle for access-blocker
  friction.** Internal automated development uses **god-mode** account access so agents can fully
  provision/configure all services, projects, and keys via CLI/API. Partial-scope tokens that block
  automation are a non-negotiable NO during active dev. **The protected, frictionless form (same power,
  strictly safer — adopt it; it adds no friction):** (1) a **max-scope _revocable_ API token per provider,
  never an unrotatable Global/root key** — identical god-power, but revocable/rotatable/auditable
  (revoke-one-token beats reset-everything on leak); (2) it lives **only in the secrets adapter**
  (the `secrets` seam — current backend **Bitwarden Secrets Manager** free tier: 3 projects/3 machine
  accounts = the 3 lanes; SOPS+age / Infisical / Vault are swap-targets behind the same seam),
  runtime-injected, **internal-dev-layer only** — never embedded in a shipped product/
  project artifact (the no-bleed boundary above); (3) **one bootstrap god-key → a provisioning agent mints
  + vaults all downstream keys/services/projects via CLI** (touch a dashboard once, ever). **The ONLY
  exceptions are platform-imposed hard limits** — capabilities a platform itself won't expose to an
  agent/API (e.g., a console that blocks programmatic project creation). Those are outliers *outside our
  control*, **not carve-outs we choose**: **any account capability a platform _does_ expose is in the
  god-mode key — we impose no self-gates** (no "destructive/financial stays human" policy; if the platform
  allows it via API, the agent has it). Granular least-privilege folds in **by production**, when dev cools
  — **derived from observed god-mode usage** (what each agent actually touched, per the audit trail), not
  guessed upfront. A deliberate, time-boxed calculated risk, not a permanent posture. *(This is internal-ops
  cleanup — distinct from the **product's shipped permission baseline**, the `policyCheck()` default engine
  (F06), which is a sellable feature most self-hosters leave permissive and enterprises tighten.)*
- **Natural naming; no ownership prefixes.** Once a foundation is forked it is
  fully ours — there is no "core vs ours" split to mark. Use natural, proper
  names (`projects`, `capability_grants`, not `yrka_projects`). Vanity/owner
  prefixes are wasted weight.
- **Testing discipline.** Test only where system health is genuinely at risk. **No
  tests** for trivial UI surface changes or trivial events with no system effect.
  Contain runaway token spend with explicit test flows.
- **Reduce overhead on every action.** For each item ask: can it be simpler, more
  elegant, without losing capability? If yes, do that.
- **Supporting components stay production-ready, in parallel.** Every relevant
  supporting/business artifact — **pitch deck, elevator pitch, funding profiles, brand
  assets, docs, demos** — is a **living, prod-ready artifact kept continuously current as
  the work lands**, never scrambled together when a call or application suddenly needs it.
  Build them alongside the systems, not after. (Prompted by an out-of-the-blue GCP
  enterprise-trial call, 2026-06-02 — be ready *before* the moment, not during it.)
- **Terminology.** Jamie is an amateur developer with strong systems-level
  thinking; he may use a non-standard term. Clarify the correct term concisely in
  passing, then proceed — never block on it.

---

## 2. Committed Decisions (baked in — do not re-open or menu)

### Structure & layering

- **System level = `C:\Users\james\dev`.** **All work for the three core domains (jami.studio / yrka.io /
  jnh.org) lives here — this is _the_ clean boundary.** Unrelated/external projects **and** the retiring
  legacy tree stay in **`C:\Users\james\projects\*`**, each with its own accounts/secrets. The split is
  **physical (two directory roots)**, so isolation is the default, not a discipline to remember — the
  concrete embodiment of the §1 no-bleed rule. (External free-Vercel/Railway use lives in `projects/`, never
  reaching into the `dev/` core stack or its secrets.)
- **Org-lane level = `dev/<org>/`** — three lanes that group the portfolio (how Jamie
  reasons about it), each able to hold multiple domains:
  - **`oss`** — open-source. Domains: **`jami.studio`** (the foundations platform — a
    BYOK showcase web app + the OSS foundation repos `@jami-studio/harness`, `@jami-studio/ui` (UI
    Registry), `@jami-studio/orchestra`); **`intercal`** (the delta/temporal knowledge graph,
    own domain ≈`intercal.dev`, lightly maintained, openly available); **`collective`**
    (the open agent society, own domain, the large undertaking). **Intercal and the
    Collective are their own domains that _consume_ the foundations — not foundations
    inside jami.studio.** The foundation set is just `harness` + `ui` +
    `orchestra`.
  - **`saas`** — commercial. Domain **`yrka`** — the unified, ala-carte multi-suite
    product (one repo/monorepo): `business-suite`, `media-suite`, `research-suite`, the
    **free-tools** cluster, and BoardRune, all sharing one identity. **Free-tools live
    _inside_ the yrka product and inherit its auth; they are not a separate lane.** Room
    for future products under the same lane.
  - **`personal`** — domain **`jnh.org`** (`.com` folds in) — `website`; light/no auth.
- **Domain level = `dev/<org>/<domain>/`** with `docs/{brand,research,roadmaps}` and
  `projects/`. A domain is the **brand + identity/auth surface + deploy boundary** — its
  own OIDC sign-in surface (see Identity & sign-in below).
- **Project level** = each repo under a domain's `projects/`. A project carries a
  succinct list of preferred dev principles + expected order of work + project-specific
  nuances/pitfalls + recurring agent mistakes.
- **Layer content & precedence.** System = durable canon (way of working). Org-lane =
  shared-lane concerns (legal entity, funding, vault lane). Domain = brand, accounts,
  identity surface, vendors. Project = transient specifics. Upper layers take precedence
  where wanted; project transients never flow up.
- **Glossaries at every level** (system / org / domain / project) so terms stay
  consistent across the family.

### Naming (committed core names)

- **jami** = the **agent** — the identity the harness presents (the engine runs; jami is who
  it shows up as). Backronym **"Just Another Machine Interface"** — self-effacing +
  observational humor (it's clearly more than that), and a play on Jamie's name.
- **the Studio** = the **environment the `@jami-studio/ui` registry renders** — the workspace the
  user actually works in ("the ui creates the studio").
- **jami.studio** = the **OSS platform/domain** housing the foundations (harness + ui).
  The composition is deliberate: agent (**jami**) + environment (**the Studio**) = platform
  (**jami.studio**).
- **yrka** = the **commercial SaaS** product (yrka.io).
- **Package & repo convention (decided): brand in the namespace, function in the leaf.** A
  scoped package has two slots — the **scope** carries the brand (mind-share, the agent-facing
  `pnpm add` surface), the **leaf** carries the function. npm scope **`@jami-studio`** (matches
  the `jami.studio` domain, hyphen for dot) brands everything, so leaves stay clean:
  **`@jami-studio/harness`**, **`@jami-studio/ui`**, **`@jami-studio/orchestra`**,
  **`@jami-studio/cli`** (binary you type: `jami`), and per-capability adapters
  (`@jami-studio/email`, `@jami-studio/storage`, …). **No scope-stutter.** Scaffold =
  **`@jami-studio/create-app`** (`npm create @jami-studio/app`). **GitHub org + social handles =
  `studio-jami`** — a deliberate reverse-match (the literal `jami-studio`/`jamistudio` GitHub orgs
  were taken; the reverse is clean, owned, and on-brand). Repos are the function leaves
  (`harness`, `ui`, `orchestra`). Commercial scope = **`@yrka`**. The `agent-harness`/`agent-ui`/
  `agent-orchestra` names in the workstream docs are these leaves under their old framing — they
  resolve to `@jami-studio/*` in the lock sweep. **Owned & confirmed:** domain `jami.studio`,
  npm org `@jami-studio`, GitHub org + socials `studio-jami`. The key pairing is npm-scope ↔
  domain; GitHub/socials intentionally carry the reverse variant.
- Remaining open names (one cohesive set, see §4): the **SaaS suites**, the **Intercal/
  Collective** product names, **etymara** (naming tool), and other free-tool names.
- Placeholder labels are placeholders — reassess the premise, never force or rotate a
  confusing label.

### Orchestration & dev system

- **Multica is the whole system** — tasks, runtime, orgs, scheduling, teams/squads,
  multi-provider routing — self-hosted. **No separate board to sync to.** Linear
  and Notion are available but **not forced** and not required. The continual
  Multica orchestrator **replaces `goal.md`**: the "read goal.md, spawn subagents"
  prompt becomes durable, scheduled pipeline parts that run as work/issues are
  added to the workspaces. (Read Multica's modified-Apache-2.0 SaaS-restriction
  clause before any hosted/productized exposure; fine for internal self-host.)
- **In-session gates first** (hooks enforce the verification ladder, fail closed
  before commit/push). Remote CI is an _additional_ gate only; nothing that fails
  local gates ever reaches the remote.
- **Coding runtimes:** Codex, Claude, Gemini, xAI — all OAuth. Daily: SuperGrok
  Heavy, Claude Max, Codex Pro, Gemini Pro. Enterprise Vertex/Azure credits for
  testing/dev API calls + compute. **Hermes stays fully separate** — its runtimes,
  proxies, configs are not part of the dev system and are not to be mixed in or
  broken by the reorg. Hermes may later support _creative_ work adjacent to coding,
  never the coding harness itself.

### Skills

- **Official canon set** = vendor official skills (gcloud, azure, cloudflare,
  vercel, supabase, neon, stripe, resend, mintlify, …) + one trusted community
  baseline (e.g. ECC or awesome-claude-skills — chosen on merit: does it offer
  deterministic, repeatable workflows that hold thousands of one-shot agent
  sessions to a predictable shape, matching/exceeding our dev style?). **Never
  edited or maintained by us.**
- **Our skills** = a tiny, thin-bridge orchestration set encoding our deterministic
  flows. If an official skill already covers planning/reporting better, we adopt it
  and ship nothing of our own there.

### Docs

- **Mintlify** (style or hosted for live projects) for docs. Well-maintained
  Markdown, minimal-to-no maintenance. Don't force Notion/Google.

### Identity & sign-in (committed shape)

- **Self-hosted BetterAuth as an OIDC issuer per domain** (the identity surface).
  **Passkeys-preferred + social-OAuth fallback.** Intra-domain SSO via OIDC (one login
  across a domain's apps — e.g. the yrka suites + free-tools). **Domains unfederated by
  default but OIDC-ready**, so cross-surface federation or a hosted IdP (WorkOS/Clerk)
  can land late as config behind the auth adapter. Public marketing routes
  (`www.<domain>`) are **ungated**; registration crosses to the gated `app.<domain>`
  surface. Agents authenticate as **first-class principals** (service-account tokens /
  Agent Passport), never by impersonating a human session. The identity/entitlement
  *model* (org/membership/role/`capability_grant`, additive natural-named tables) is
  committed; only final IdP/vendor specifics are verified at lock.

### Voice & real-time (committed shape)

- **Three interaction modes coexist:** **text** (default), **baseline turn-based STT↔TTS
  voice** (retained), and an **optional real-time supervisor layer** on top. The real-time
  agent handles voice I/O + barge-in and **dispatches** tasks to the harness (never runs
  heavy work inline), subscribes to the run's native-SSE event stream to narrate + adjust,
  and is **toggle-able mid-run** via seq-replay. Built on industry-leading self-hostable
  OSS — realtime infra behind a thin `realtime` adapter, the realtime model behind the LLM
  adapter. The live-eval is a **build-time validation, not a planning blocker.** Stack
  specifics grounded by the `13-realtime-voice` fact-finding pass and verified at lock.

### Adapter seams (the register)

Concretizes the §1 "agnostic + adaptable" rule. A capability earns a thin **port we
own** (a 1–3-function interface) when **both** hold: **(a)** the underlying provider
APIs are commoditized enough that a normalized shape covers ~90% of use, **and (b)**
provider risk / portability / fallback carries real value. Where a vendor's value is
deep and idiosyncratic, we still take a thin port for **swappability insurance** but do
**not** chase true agnosticism. **Never double-abstract:** our port is the stable seam;
a third-party multi-provider SDK (where one exists and fits) is the _impl behind it_,
swappable without touching call sites — same discipline as `policyCheck()` over the
governance SDK. Cross-cutting needs (idempotency keys, audit) live at **our** port
layer, not borrowed from the vendor.

The register (status as of this planning phase):

| Seam | Committed impl behind our port | Status | Note |
|---|---|---|---|
| **Inference / LLM** | `ai-sdk-engine` via `AGENT_ENGINE` (Vercel AI SDK) | ✅ committed | BYOK in OSS; eval-driven → gateway in SaaS |
| **Realtime voice (S2S)** | LiveKit Agents transport; realtime model behind LLM adapter | ✅ committed | `13-realtime-voice`; supervisor layer |
| **STT / TTS (cascading)** | provider behind voice adapter | ✅ committed | baseline turn-based voice |
| **Auth / identity** | self-hosted BetterAuth OIDC per domain | ✅ committed | hosted-IdP swap is later config |
| **Governance / policy** | `policyCheck()` over agent-governance-SDK | ✅ committed | Public Preview behind one seam |
| **Transport** | native SSE (internal) + AG-UI (external interop) | ✅ committed | both built |
| **Secrets** | the `secrets` seam (`get`/`run`) — backend **Bitwarden Secrets Manager** (free: 3 projects/3 machine accounts = the lanes); SOPS+age / Infisical / Vault swappable | ✅ committed | `04-secrets`, F03; dev-layer (bucket A), not the harness's shipped user-secret store (bucket B, F05/F07) |
| **Email / transactional** | **`@opencoredev/email-sdk`** (MIT, zero-dep) — Resend primary + SES/Postmark fallback | ✅ **committed** | send-only seam; idempotency at our port; inbound/agent-mailboxes (AgentMail) is a _separate_ concern |
| **Observability / errors** | **OpenTelemetry** emit seam; Sentry + GA as exporters | ◐ adopt | highest-leverage next; the standard already _is_ the adapter |
| **Object storage / blob** | thin **S3-API** port (S3 / R2 / Supabase Storage) | ◐ adopt | near-free portability |
| **Provisioning / control-plane** | hosted **CF plane (Pages/Workers + WfP + Durable Objects) + Google Cloud Run kitchen + Neon**; OSS **Supabase / Neon-self-host** | ◐ adopt | split-stack via one "spawn session" provisioning port; Docker-portable kitchen; deliberate lock-in = DO + WfP only (hosting #2/#7/deep-dive) |
| **Media gen (image/transcode)** | media-gen port (Fal + peers) | ◐ adopt | same agnostic logic as inference |
| **SMS / push (future)** | same pattern as email when multi-channel | ○ future | Twilio etc. |
| **Vector / embeddings (if RAG)** | store port (pgvector / Pinecone / …) | ○ future | only if retrieval lands |
| **Database** | Postgres-wire + Drizzle (Neon / Supabase) | ⚠️ already portable | no extra layer needed |
| **Payments / billing** | **single-active, swappable billing adapter** (Stripe direct / Stripe Managed-Payments / Paddle / Lemon Squeezy / Polar) | ◐ adopt | **confirmed (MakerKit audit + official docs).** Two contracts — imperative *strategy* (checkout/portal/cancel/usage) + reactive *webhook handler* with a normalized event vocab; lazy registry keyed by enum (env-var select, unused SDKs never bundle); **webhooks are the only writer** → one idempotent upsert into provider-neutral entitlement tables. **Un-normalizable seam = MoR vs direct (tax):** a `taxMode` flag per provider (MoR = Paddle/LS/Polar/Stripe-Managed handle tax; direct = Stripe + pluggable Stripe Tax). Ship single-active; multi/per-tenant later via the same registry |

Legend: ✅ committed · ◐ adopt at build (passes a+b) · ○ future (conditional) ·
⚠️ deliberately bounded. New seams are added by the (a)+(b) test, recorded here.

### Distribution & open-core model

- **Depend, don't fork.** The OSS↔SaaS boundary is a **published package surface, not a
  git merge.** The OSS repo is public and publishes versioned packages; the SaaS repo is
  private and consumes them as normal semver deps (`pnpm add @jami-studio/harness`).
  "Sync downstream" = `pnpm update`; "upstream a tweak" = change it in the OSS repo,
  publish, bump. **No hard fork, no merge tax.** This structurally enforces the §1 no-bleed
  rule: the OSS repo simply never contains SaaS code, so internal/secret/SaaS material
  *cannot* leak upstream via a careless merge. (Release discipline: semver + changesets in
  the OSS repo.)
- **Extend through seams, never patch source.** SaaS plugs into the harness via
  adapters/registries/hooks (the Adapter-seams register + UI/capability registries). The
  urge to "edit OSS from inside SaaS" is the signal a seam is too narrow — the fix is a
  better extension point, not easier merging. Target: ~95% of SaaS work touches only
  `@yrka/*`, never reaching OSS source.
- **Framework vs scaffold are distinct artifacts.** The **framework** (`@jami-studio/harness`,
  `@jami-studio/ui`, `@jami-studio/orchestra`, adapter packages) is *depended on* and stays live-updated.
  The **scaffold** (`create-agent-app`) is *instantiated once and then owned* — a runnable
  app shell wiring auth + adapters + ui + db ("add provider keys, point auth at your
  domain"). You don't sync a scaffold. **yrka = the scaffold instantiated once + private
  `@yrka/*` packages depending on the public framework** — we are a real user of our own
  OSS, which makes yrka the reference implementation + best demo and keeps dogfooding
  structurally clean.
- **OSS deliverable family:** the framework packages (`@jami-studio/harness`, `@jami-studio/ui`,
  `@jami-studio/orchestra`) + **`@jami-studio/cli`** (agent-first install/configure/provision) +
  the **MCP server** + the **`@jami-studio/create-app`** scaffold + per-capability **adapter
  packages** (`@jami-studio/email`, `@jami-studio/storage`, … — pull only what you need,
  zero-bloat at the package level).
- **The open-core line.** **OSS = the engine + every seam + a complete, single-tenant,
  BYOK, self-hostable product** a solo dev gets real value from alone (never crippleware).
  **Commercial = multi-tenancy at scale, hosted/managed operation, enterprise governance/
  compliance/federation, billing & entitlements, and the yrka suites.** Test both ways: a
  small team must get real value from OSS alone; an enterprise must need the commercial
  layer for scale/compliance/support. **Governance is the model split:** the `policyCheck()`
  seam + a working default policy engine ship **OSS** (genuinely governable alone); the
  **enterprise** impl (Cedar/OPA bridges, compliance reporting, federation, governance-SDK
  integration) is commercial behind that seam. The adapter pattern makes the line
  enforceable — commercial features are plugins on seams, never forks of core.

### Commercial model & the Kit (open-core productization)

- **OSS = the full package family, genuinely open.** Every foundation package (`@jami-studio/*` —
  harness, ui, orchestra, cli, adapters) ships open under **Apache-2.0** (OSI-approved), fully capable,
  fully documented, BYOK, adaptable, cohering with ~zero effort. **Never crippleware.** This is both the
  adoption + agent-recommendation engine **and** what preserves OSS funding/credit eligibility (genuine
  OSI license; all commercial code stays separate — the depend-don't-fork boundary enforces it). See
  **Licensing & OSS-funding posture** below.
- **The Kit = a paid commercial product** (housed under `saas`/yrka as a flagship alongside the
  suites — **leaning, not firm**): a curated, highly-opinionated, **production-ready monorepo
  scaffold** (marketing pages, billing + customer portal, roles/permissions, the suites) that the
  interactive **`jami` CLI** provisions to the user's chosen vendors/configs/packages, plus
  **curated orchestration skills**, full docs, and support. The OSS can do all of this with elbow
  grease; the Kit sells **time, comfort, support, and a known-good shape** — "pay vs build." The
  differentiator is **curation + assembly + support**, never gating the OSS packages.
- **Orchestra is optional and idempotent.** The "set up my own SaaS" flow is **not** native to
  vanilla orchestra — it is a curated, opinionated **skill + instruction set** (shipped with the
  Kit) usable inside orchestra **or** any LLM dev flow the user prefers. Single-agent-skill mode ↔
  full-orchestra-plan mode is a **toggle, not a reinstall/reconfigure**; choosing orchestra-or-not
  must never be a user pain point. `jami` scaffolds a production-ready harness+ui+orchestra
  configured to preference; the mode is movable (within reason) without re-provisioning code.
- **Revenue surfaces (exploring — directional, not firm):** (1) **hosted/managed ops** for users'
  projects (setup, maintenance); (2) **done-for-you development** turning a user's vision into a
  working product on our packages + dev system; (3) **launch-ready Kits** — the productized path,
  spanning personal → commercial and internal-webapp → personal-agent → SaaS → agents-as-a-service.
  yrka.io subscription = run your ops through our hosted suites/providers; the Kit = recreate the
  yrka product in your own vision.
- **The linchpin — hosting schema (research-backed; verdict in). SPLIT THE STACK.**
  - **Cloudflare = the platform plane:** Workers-for-Platforms dispatch namespaces (multi-tenant
    deploy-on-behalf + isolation), Durable Objects (agent/stateful sessions), Workers AI/Vectorize/Queues
    (agent workloads), KV/R2/D1 + edge routing/auth. Tenant **agent/edge logic** runs here as lean Workers.
  - **First-party web surfaces** (jami.studio, yrka's own UI) run on **Cloudflare Pages/Workers via
    `@opennextjs/cloudflare`** (GA) — cheap, **unlimited bandwidth**, same plane, no egress trap. Vercel is
    the *optional* alternative if we specifically want its preview-env/Next.js DX (accept $0.15/GB egress).
    The #7 caveat applies only to **heavy _per-tenant_ Next.js**: don't force tenant apps into dispatch-
    namespace Workers (10 MiB bundle + 128 MB isolate ceilings + OpenNext gaps × tenant-count) — that's a
    tenant-deploy concern, not our first-party app, which we control.
  - **Postgres = Neon** (DB-per-tenant + branch previews) both planes. **OSS self-host = Supabase + Neon
    (Apache-2.0).** The **provisioning/control-plane adapter** keeps hosted (CF + Neon + Vercel/Node) vs OSS
    (self-host) behind config — same agnostic logic as every other seam. Does not change the dev lanes.
    (Hosting #2 + CF-parity #7, 2026-06-02.)
- **Hosting mental model (the organizing principle).** Every product is **two workloads with opposite
  hosting needs:** **web surfaces** (marketing/docs/app UIs — short, stateless request→response; kiosk/
  serverless-friendly) vs the **agent/service "kitchen"** (long-running, stateful agent sessions +
  orchestration — needs a container/always-warm host, **never serverless**). Most hosting complexity is just
  refusing to run both on one thing. **The agent runtime (`@jami-studio/harness`/`orchestra`) is a Node
  service, not a Next.js app** — only the web surfaces are Next.js. (For pure content, static/**Astro** is
  even lighter than Next.js.)
- **Per-product host mapping (deep-dive verdict — named hosts).**
  - **jami.studio** (almost all web-surface, low-traffic) → **Cloudflare Pages** (Astro static for content;
    OpenNext if the showcase needs SSR). ~**$0–5/mo, unlimited bandwidth**, painless subdomains, same plane
    as yrka.
  - **yrka.io** → **one Cloudflare plane** for web + tenancy + sessions (**Pages/Workers** first-party UI,
    **Workers-for-Platforms** tenant deploy-on-behalf, **Durable Objects** for agent session state — DO
    *hibernates*, so idle open sessions ≈ $0) **+ Google Cloud Run** as the heavy container **kitchen**
    (native scale-to-zero, 60-min request timeout, **Jobs to 7 days** for long agent runs, optional L4 GPU)
    **+ Neon** (co-locate Cloud Run in Neon's primary region). **Fly.io** (Machines API is great for
    agent-spawned sessions) or **Railway** (best DX) are valid kitchen alternatives.
  - **Why not Vercel for the kitchen (cost intuition):** Vercel Fluid bills **provisioned memory for the
    whole instance lifetime including I/O wait**, and agent sessions are *mostly* I/O wait for minutes —
    plus a hard **13-min** ceiling (Pro). A container multiplexes many sessions per GB with no duration
    ceiling; a Durable Object doesn't bill duration while hibernating. Rough yrka kitchen cost: **~$50–80/mo
    small, ~$150–300/mo moderate** (Cloud Run + DO + WfP + egress).
- **Multi-host principle (portability without theatre).** Portability is **proven by building portable**
  (containers + Postgres + the provisioning/control-plane adapter) **and the OSS self-host story** — not by
  running redundant production copies. The split-stack already makes us **honestly multi-platform** (CF +
  Neon + Vercel/container host), so we can apply to multiple platform credit programs **truthfully**.
  **Migrate/add a host opportunistically** when a specific opportunity justifies it; **never stand up
  duplicate prod just to chase credits** (cost/ops uncorrelated to capability = anti-ethos). One domain is
  not a constraint — subdomains route across platforms. (Hosting teaching, 2026-06-02.)
- **Deliberate lock-in + portability (deep-dive).** Ship the kitchen as **plain Docker images** (run
  identically on Cloud Run / Fly / Railway / Render / CF Containers — move in an afternoon); keep app on
  standard `postgres://` (Neon never pins compute); OpenNext is an *adapter* (same app runs `next start` in
  a container). **Two pieces we accept proprietary on purpose** because they're the hardest to rebuild:
  **Durable Objects** (stateful-actor + hibernation session model) and **Workers-for-Platforms** (deploy-on-
  behalf) — isolate both behind our own *session* and *tenant* service interfaces so the blast radius is
  contained. Wrap provider provisioning (CF / Cloud Run / Fly APIs) behind one internal **"spawn session"**
  interface (the provisioning/control-plane seam). **Verify at decision:** Cloud Run 60-min request ceiling
  (use Jobs for longer runs); DO 30s-CPU/invocation (orchestration/state only, offload heavy compute to the
  container); DO SQLite storage billing (live Jan 2026); Fly GPU removed (after Aug 1 → GPU = Cloud Run L4);
  OpenNext Next.js-16 parity for yrka's UI; Cloud Run↔Neon region co-location. (Hosting deep-dive, 2026-06-02.)
- **The real Vercel-replacement = a host-agnostic deploy + secrets pipeline (we bring the magic).** Vercel's
  stickiness is three conveniences, all ownable portably: **push-to-deploy** → a **GitHub Actions** workflow
  that builds the Docker image + deploys (every host has a deploy action/API); **secret sync** → our
  committed **SOPS + age secrets adapter** (`04-secrets`; free/OSS, no server) injects at deploy/runtime; **vendor/env
  wiring** → in our repo + secrets adapter, not a host dashboard. Result: the host collapses to a commodity
  ("runs a container, serves traffic, gives a URL") and we never get re-trapped — the adapter ethos applied
  to deploys. **The swap bar any host must clear:** push-to-deploy from GitHub · secret sync · vendor/env
  wiring · free-until-scaling · preview envs.
- **Cost-onset + the "don't waypoint" rule.** Day-one cost at dev/low scale: **CF Pages ≈ $0** (free,
  unlimited bandwidth), **Cloud Run ≈ $0** (perpetual free tier — 180k vCPU-s + 360k GiB-s + 2M req/mo),
  **Railway ≈ $5/mo floor** (Hobby, metered), Vercel free-Hobby / $20-Pro-commercial. So the **target
  platforms are actually _cheaper_ than Railway at day-one scale** — Railway's only edge is zero-setup DX.
  Therefore **do not plan "Railway → migrate later" as a deliberate two-step:** it saves no money (targets
  are free) and the host-agnostic pipeline closes the DX gap, making the migration pure churn. Two clean
  choices: **(A)** build the pipeline → **land on CF Pages + Cloud Run from day one** (free, scale-ready,
  final — no migration ever); **(B)** adopt **Railway as the actual DX _home_** for these projects (a legit
  Vercel replacement) if its turnkey DX is worth ~$5/mo, migrating to Cloud Run only when scale forces it
  (opportunistic, not scheduled). **DECIDED = (A)** — CF Pages + Cloud Run from day one, on the
  host-agnostic pipeline. Railway is **not** in the core production stack; it stays a **documented
  Docker-portable fallback** (alongside Fly — the escape hatch stays real without staying live) and a fine
  DX option for *unrelated* external projects (kept isolated per the §1 no-bleed rule; external free-Vercel
  use is fine too). **Cheapness = perpetual free tiers** (CF Pages free; Cloud Run free tier 180k vCPU-s +
  360k GiB-s + 2M req/mo) — these govern **production** cost and never expire. **Trial credits are a separate
  pool with a different job:** the ~**$1.3k GCP credits (1-year window)** are a **deliberate development
  budget** — earmark and burn them aggressively on the **compute-heavy dev work** (provider evals, load/
  integration testing, the eval-driven SaaS dev-provider selection) where burst spend is painful on a card.
  Exploit them to the max within the year; just **never let production architecture _depend_ on them.**
  (Hosting cost reasoning, 2026-06-02; Railway DX + pricing to verify only if ever adopted.)
- **Constraint (hard):** no chosen shape may block OSS-available funding/credit opportunities. The
  OSS foundation stays OSI-licensed and cleanly separated from all commercial code.
- **MakerKit = reference only, strict clean-room.** Jamie's $300 lifetime MakerKit license (Next.js +
  Supabase + Turborepo) is for **studying patterns** (plugins, adapters, billing-adapter, Kit packaging,
  delivery/config). Its EULA (per licensing research) **forbids**: copying its files into any repo (public
  **or** private), **using it to build a starter-kit/boilerplate/Kit product**, sharing the license across
  a team, and feeding it to model training. So: **keep it out of all version control, build the Kit
  clean-room (no MakerKit-derived code), and never let an agent/training pipeline read the MakerKit dir.**
  Reference the patterns; re-implement in our own words. (Earlier "launch oars via MakerKit" is not
  assumed forward.) Local source audited at `projects/rebuild/agent-primitives/agent-harness/references/
  makerkit-source/...` (+ `…/makerkit-plugins/…`) — *reading-for-patterns is the permitted use*; we now
  hold clean-room pattern notes (see log). The adopted billing-adapter shape is grounded in **official
  provider docs**, MakerKit only confirming structure — clean-room-safe, not a copy. **Note:** MakerKit's
  own tiering is 4 names — `packages` (libs) / `features` (built-in domains) / `plugins` (optional) /
  `apps` (deployables); our user-facing unit stays **App** (the `features` tier is an internal
  organizing idea to consider at mapping).

### Licensing & OSS-funding posture (research-backed; counsel to confirm)

- **Open foundation = Apache-2.0** (not MIT): OSI-approved (keeps grant/credit eligibility) **and** adds
  an express patent grant + explicit trademark reservation (protect the brand while code stays open) —
  the better default for agent *infrastructure* others embed. Compatible with the MIT upstream (Builder.io
  agent-native): preserve MIT notices on upstream-origin files, add our Apache-2.0 `LICENSE` + `NOTICE`.
- **Open packages stay 100% OSI, single-license** — **no** BSL/SSPL/FSL/Elastic, **no** field-of-use ("no
  competing service") clause, **no** copyright-assignment CLA. Paid Kit + SaaS live in **separate private
  repos** consuming the open packages as versioned deps (the depend-don't-fork boundary again).
  Contributions via **DCO**, not a CLA.
- **OSS-funding disqualifier checklist (avoid on the open repos):** non-OSI/source-available license; any
  field-of-use restriction; assignment CLA; inactivity / no community; missing license/governance/
  Code-of-Conduct. **AWS** OSS credits exclude VC-funded/single-vendor-dominated projects → **DigitalOcean
  + GitHub** programs are the more reliable credit sources. Publish a governance doc + CoC.
- **Models to follow:** Supabase (Apache-2.0 whole) / PostHog (MIT core + `ee/`). Cautionary tales:
  HashiCorp→BSL (OpenTofu fork), Redis→SSPL (Valkey fork), n8n/Sentry FSL (non-OSI → ineligible). **IP
  counsel confirms** the MIT→Apache notice mechanics, the DCO choice, and the MakerKit clean-room boundary
  before lock.
- **Funding posture (defined): bootstrapped, minimal-burden, never self-gate.** We are **not VC-backed** —
  one independent developer, self-funded (LLM subscriptions on a credit card), a calculated risk. That is
  an **asset** for OSS credits/sponsorship (many programs favor independent OSS and several *exclude*
  VC-funded projects). Keep eligibility open with **near-zero admin now**: the OSI license (Apache-2.0), a
  public repo, and a handful of one-time copy-paste files — `LICENSE`, `README`, `CONTRIBUTING` (with DCO),
  `CODE_OF_CONDUCT.md` (Contributor Covenant), a light `GOVERNANCE.md`. That is the *entire* burden, and it
  unlocks DigitalOcean + GitHub Sponsors + vendor startup credits (Neon/Supabase/Cloudflare) — all
  individual-eligible. **Defer the heavy stuff until there's traction:** legal entity (the Delaware C-corp is
  a commercial-lane step **for when ready, not an OSS prerequisite**), trademark registration, foundation/
  fiscal-host membership, formal accelerators. The structure (Apache-2.0 + clean OSS/commercial separation)
  keeps **every door open** so we can pursue any program when ready **without retrofitting** — flexibility
  without premature overhead. **Self-gating is the only real risk; we don't.**

- **This is not SaaS-as-we-know-it.** The model is deliberately not bound by legacy SaaS habits;
  base it on the most AI-forward orgs and let the Principled Edge differentiate it. No rush — this
  is the long-term move; let the shape cook.

### Suites — bridge, don't replace

- **yrka suites do not replace specialized tools.** Research/media/business each have best-in-class,
  compute- and data-heavy apps; yrka does **not** pretend to supplant them. Each suite is **the place
  where the work _behind_ the work happens** — first-class touchpoints + adapters + robust pipelines
  that normalize data/structures across a changing landscape, bridging users/agents/teams/orgs to
  those tools. Suites look different (research vs media vs business) but are **not separate** — they
  are installable units that interoperate seamlessly, all pulling from **one shared registry**. (The
  canonical term for those units — package/app/plugin — is pending taxonomy research; provisional
  lean: **package**. See §4.)

### UI registry distribution (committed direction)

- **Distribute `@jami-studio/ui` ON shadcn's official registry mechanism — don't handroll.** As of
  `shadcn@4.10.0` (2026-06-01) the registry system (namespaced + private-auth registries, `registry:base`
  for a whole tokenized design system, a `registryDependencies` graph, and an **MCP server** + `shadcn/skills`
  that make agents first-class consumers) maps directly onto our tokenized design-system + primitive-vocabulary
  + agent-to-UI model. The shadcn namespace aligns with our scope (`@jami-studio`). The same mechanism can
  ship **Apps** and even curated **Kit** skills/instructions/templates (it distributes more than components —
  a nice unification with AX + the Kit). **We still own:** (a) **item versioning** (shadcn has no first-class
  version field — design a convention); (b) the registry host/auth/tenancy. shadcn is the **build-time seed
  only** (source-inlining, not a live runtime) — the render seam is below. Pin `shadcn@>=4.10.0`; this
  surface moved 4× in two weeks. (shadcn registry research, 2026-06-02.)

### UI render seam (committed — research #6)

- **Two registries, two lifecycles — never conflate.** **(1) Build-time SEED** = the shadcn registry:
  `registry:base` installs the tokenized design system + primitive vocabulary *resident* in the app (at
  scaffold/CI time — **never** in the agent's request path). **(2) Runtime CONTRACT** = a separate,
  app-resident, **allowlisted component registry**: the harness emits a **`UIPayload` that is data, never
  code** — `{ component, props, children? }`; the renderer checks **name ∈ registry → validates props (Zod)
  → renders the resident component**; unknown name/props → **graceful fallback, never crash**.
- **Convergent 2026 pattern** (Vercel AI SDK `tool-*`+Zod, Google **A2UI** "trusted catalog", CopilotKit
  Pattern Registry, Thesys/Crayon "spec not code"): *safe like data, expressive like code.* Borrow **A2UI's
  JSON payload model** for the `UIPayload` shape (no dependency). **AG-UI** (our external transport) +
  **native SSE** (internal) carry the render stream — channel, not renderer; they sit cleanly *above* the
  registry, so this needs no new transport.
- **MCP Apps / MCP-UI (iframe HTML) is the WRONG shape for the core** — it bypasses our design system; kept
  only as a separate **untrusted third-party** lane, never the trusted seam.
- **Safety:** allowlist-by-construction + per-component prop schema (Zod) + no code/HTML/`dangerouslySetInnerHTML`
  + sanitize prop values into URL/HTML-ish slots.
- **Version skew is the dominant risk** (SDUI lesson — Airbnb/Lyft). Two axes: **vocabulary version**
  (build/deploy-pinned; shadcn has no built-in versioning → we own it) and **payload-contract version**
  (runtime). The harness learns the app's vocabulary version (handshake); registry changes are
  **additive-only**; renderer degrades gracefully. Resolve the contract before foundations are built.
  (Render research, 2026-06-02.)

### Agent discoverability (AX — agents are a first-class user)

- **Prediction & stance.** The majority of visitors/callers to our sites, APIs, and
  products will be **agents.** Treat agents as a first-class user persona with their own UX
  ("AX"), planned through development, not bolted on. End-goal: a user's agent can install,
  configure, and provision the entire OSS suite via the CLI (user-permissioned) — "fork the
  repo and integrate my app idea → Done."
- **Legibility is the moat.** Because every capability is uniformly described and uniformly
  accessed (the adapter register + capability/UI registries), the product is **legible to
  agents** — an agent can introspect what it does and how to wire it, and recommend it
  precisely for the right use-case. Most products are illegible to agents; ours is the
  distribution advantage.
- **The AX surface (built through dev, not after):** `llms.txt` / `llms-full.txt` (Mintlify
  auto-generates — near-free); a first-class **MCP server** (hosted + self-host) exposing
  capabilities as tools; **official skills** for install/configure/common workflows; an
  **agent-first CLI** (`--json`, `--yes`, idempotent, clean exit codes, strong `--help`);
  **OpenAPI + generated typed SDKs**; a machine-readable **capability manifest** (the
  adapter register published as a discoverability asset); and an **`AGENTS.md`** shipped in
  the scaffold so a forking agent extends correctly.
- **Discoverability and governance are one coin.** Inviting agents to install/configure/
  provision "with user permissions" opens an abuse surface that is only safe because we
  already committed the primitives — **agents as first-class principals, the `policyCheck()`
  seam, the hash-chain audit.** AX consumes that safety machinery; build and market them
  together — *agent-native and agent-safe.*

### Tooling for solved problems (rebuild proper, don't invent)

- Changelog, docs generation, system mapping/graphing, testing, browser automation
  use **industry-leading OSS/free agent-friendly tools** — evaluate candidates such
  as `codegraph`, `composto`, `Maestro`, `chrome-devtools-mcp`, and their
  equivalents/competitors on merit; pick the best, don't bias to this list.

### Brand, lanes & funding

- Three org-lanes = `oss` / `saas` / `personal`; **brand surfaces are per domain**
  (jami.studio, intercal, collective, yrka, jnh.org). Brand presence is agent-run,
  open-protocol first, per-domain isolated accounts. Funding profiles are built from
  live evidence, then applications submitted to programs that fit each lane.
- Entity/accounts: scaffold scoped configs/docs/accounts per domain+project (Stripe,
  hosts, db, …) as a setup stage, not a research open-question.

---

## 3. Order of Work (Jamie's priority list)

1. Clean/organize/setup **system-level tooling, dev folders, packaging**.
2. Clean/organize/setup **runtimes, projects, configurations, skills**.
3. Stand up **canonical system architecture + plumbing**: system→org→project,
   shared secrets + access, Multica runtimes/configs, scaffold teams/workflows.
4. **Report phase** — map planned systems, architecture, lifecycles, data from the
   ground up through end-user experience, across all projects; surface and solve
   broken assumptions, outdated patterns, brittle seams, redundant ownership.
5. **Roadmap phase** — remap every system/name/file/standard/protocol/seam/api/
   service/contract/route on first-principled, audited, officially-guided truth.
   Nothing left to guess.
6. **Master roadmap** — all dev work across the system; each org flows naturally to
   the preferred timeline.
7. **Connect/configure accounts** + scaffold scoped configs/docs per org+project
   (Stripe, hosts, db, …).
8. **Transfer workstreams** onto the production-ready automation system.
9. **Work commences** — real-time additions/adjustments.
10. **Business & marketing operations** flows kick off.

### Product launch order (spitball, directional)

Marketing sites (begin branding → funding apps) → foundational systems/contracts
(Harness, Registry, Data, Permissions) via the OSS repo+domain → launch the Studio
(begin Intercal/Collective dev) → launch Yrka's flagship suite (begin MMO dev) →
free tools (benefits finder, brand-name+domain lookup, leads+competitor tracker,
daily-briefs) → applications/funding → release Intercal → release BoardRune →
launch the Collective → strategy/planning → applications/funding.

---

## 4. Genuinely Open (creative / scope only — default to end-shape)

- **Final product/brand names (the remaining set).** Core names are now decided (see §2
  Naming): **jami** (agent), **the Studio** (UI environment), **jami.studio** (OSS platform),
  **yrka** (commercial); the **package/repo convention** (`@jami-studio` scope, function leaves,
  `studio-jami` GitHub org) is also decided and owned (§2 Naming). Still open, assessed as one cohesive set
  when Jamie has the feel: the **SaaS suites**, the **Intercal/Collective** product names,
  **etymara** (naming tool), and other free-tool names. Non-binding leanings: **intercal.dev** (if
  available; not married). Domains are settled.
- **Packaging taxonomy — recommended (research-backed, pending Jamie's nod).** Primary user-facing
  unit = **App**; strict 3-tier canon: **App** = an installable, runnable suite unit users compose via
  the shared registry (Turborepo `apps/*`); **Package** = shared library Apps depend on, *never*
  user-installed (Turborepo `packages/*`, npm); **Plugin** = optional extension attaching to a single
  App (introduce only when real add-ons exist). Rationale: `package` is unavoidable plumbing in
  npm/Turborepo — don't overload it as the product noun; "App" is the runnable surface. Maps onto
  shadcn registry items. (Taxonomy research, 2026-06-02; sources: npm, Turborepo, shadcn, VS Code,
  Figma, Backstage.)
- **Kit placement** — leaning to house the paid **Kit** under `saas`/yrka as a flagship product
  (§2 Commercial model); not firm. Resolved alongside the hosting-schema decision (research in
  flight).

This is now the _only_ open decision. **Resolved since the original list** (soft-locked
this planning phase — firm enough to build on, revisitable as we learn): the **sign-in
shape** (self-hosted BetterAuth OIDC issuer per domain, passkeys-preferred, marketing/app
split — §2 Identity & sign-in) and the **org/domain/project directory arrangement**
(`oss`/`saas`/`personal` lanes → domains → projects — §2 Structure & layering). Everything
else defaults to the committed, final-shape answer.

---

## 5. Report & Doc Refresh Directive

When refreshing a report or early doc:

- **Re-ground to greenfield.** Remove every "extract from yrka", "fold under",
  "salvage into the live instance", "defer until earned" framing. Replace with the
  fresh, final-shape design built on official/industry-leading tooling.
- **Kill the option menus.** Drop "Implementation Options" / multi-option "Open
  Decisions" sections. State the **committed direction** with first-principled
  rationale. Keep at most a short **"Open (creative/scope)"** note only where §4
  genuinely applies.
- **Bake in §2 decisions** and align everything to the real `dev/` structure and
  naming in §2.
- **Fix stale facts** (verify drift-prone vendor/tooling/pricing/protocol facts
  against official 2026 sources; date them). Correct anything the prior reports got
  wrong (e.g. extraction thesis, "fold Intercal under yrka.io", criss-crossed
  Studio naming, manufactured skill-maintenance burden).
- **Apply the ethos and hard rules** (§0–§1): root-correct + zero-bloat, no
  hardcoding, full implementation, testing discipline, Mintlify docs, Hermes
  separate, Multica-only orchestration.
- **Stay lean.** Concise, decisive, no filler. Reduce overhead. Do not get ahead of
  Jamie or add decisions he hasn't made.

See `progress.md` for status and `activity-log.md` for the running log.

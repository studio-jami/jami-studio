# Rebuild — Master Synthesis

> **START HERE.** This is the single overall map of the rebuild — read it first to verify the plans,
> criteria, in-scope/out-of-scope, vendors, and naming conventions across every workstream. It sits on
> the **Operating Canon** (`plan.md`, the rules of engagement) and points down into the twelve workstream
> reports for detail. **Status: committed direction, pending Jamie's final green-light to lock into
> canon — not yet officially accepted.**

Date: 2026-06-01
Status: Committed direction (greenfield), pending green-light. Aligned to the Operating Canon (§0–§5).
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Inputs: the eleven refreshed workstream reports under `C:\Users\james\dev\docs\research\01..11\report.md`,
plus the **12-agent-native** foundation decision (`../12-agent-native/recommendation.md` +
`fact-finding/fact-finding-synthesis.md`).

This synthesis reconciles the twelve workstreams into one coherent, final-shape
picture. It states committed decisions, not options; it cites each sibling by path; and
it carries only the few genuinely-open creative/scope items canon §4 allows. It does
**not** repeat the reports — it is the single map across them.

---

## 1. Executive Summary

The rebuild is a **greenfield build on official and industry-leading tooling**. Every
line, name, directory, and contract is authored fresh; prior projects were input to
thinking only, never a code source, never precedent. There is no extraction, no
fold-under, no salvage, no "defer until earned." Each stage is the production shape of
its layer.

The system has **one home and three org-lanes** (canon §2). All new work lives under
`C:\Users\james\dev`, grouped `oss` / `saas` / `personal`, each holding one or more domains:

- **`oss`** — the open-source lane. Domains: **`jami.studio`** (the foundations platform — a
  BYOK showcase + the OSS foundation repos **`@jami-studio/harness`** (provider-agnostic agent SDK),
  **`@jami-studio/ui`** (UI Registry — tokens + primitive vocabulary), **`@jami-studio/orchestra`** (the
  orchestration/dev system)); **`intercal`** (the temporal/delta knowledge graph, own domain
  ≈intercal.dev, lightly maintained); **`collective`** (the open agent society + deposit
  protocol, own domain, the large undertaking). **Intercal and the Collective are their own
  domains that consume the foundations — not foundations inside jami.studio.**
- **`saas`** — the commercial lane. Domain **`yrka`**: one product monorepo composing the
  foundations into a unified, ala-carte interface — **`business-suite`**, **`media-suite`**,
  **`research-suite`**, the **`free-tools`** cluster (benefits finder, brand-name + domain
  lookup, leads + competitor tracker, daily briefs), and **BoardRune** — all sharing one
  identity. Free-tools live **inside** the product and inherit its auth.
- **`personal`** — domain **`jnh.org`** — **`website`** (`.com` folds in); light/no auth.

The architecture is **foundations as libraries, products as compositions**. `harness`
+ `ui` are the substrate; every suite, tool, and the Collective is a thin domain
layer over them, every capability reachable by both human UI and agent against one governed
contract, all knowledge consumed from `agent-delta` rather than per-app scraping. The
foundations `harness`, `orchestra`, and `ui` are **forked wholesale from
the MIT `agent-native` foundation** (Builder.io — fork target `@agent-native/core` 0.32.2 +
`@agent-native/dispatch` 0.8.28); greenfield forbids carrying *our* legacy forward, never
adopting a hardened MIT third party — the Principled-Edge stand-on-shoulders move. On that
substrate they stand on the settled 2026 open protocol stack as **transport** (MCP for
tools/data, A2A for inter-agent; **native SSE for the internal agent↔UI surface with AG-UI
as the external interop adapter — both built**; A2UI/MCP Apps as portable UI payloads) and
adopt **`@microsoft/agent-governance-sdk@4.0.0`** (MIT, Public Preview) behind one
`policyCheck()` seam as the policy/audit substrate, while owning the small, durable, audited
semantic vocabulary that is the actual moat. We stand on open transport; we never reinvent
it (06-rebuild-feasibility, 10-product-concepts, 12-agent-native).

The dev system is **Multica, self-hosted, as the whole orchestration system** — tasks,
runtime, orgs, scheduling, squads, and multi-provider routing in one platform. The continual
Multica orchestrator **replaces `goal.md`**: the old "read goal.md, spawn subagents" prompt
becomes durable, scheduled pipeline parts (Autopilots). There is **no separate board to sync
to**; Linear and Notion are available but not required and not forced. Quality is enforced
**in-session, fail-closed, before any remote** (hooks run the verification ladder; remote CI
is an additional gate only). Coding runtimes are OAuth (Codex, Claude, Gemini, xAI); **Hermes
stays fully separate** (03-dev-systems, 08-canonical-system).

The operating layer is lean and standard: a thin agnostic **`secrets` adapter** (free; backend = Bitwarden
Secrets Manager, swappable to SOPS+age/Infisical/Vault — 04-secrets); **pnpm + uv + fnm + scoop** as the canonical
toolchain with a single scheduled prune job (02-system-and-tooling); a **System → Org →
Project** instruction model where the system canon carries no project/vendor/account/secret
and therefore needs no routine maintenance (05-templates, 08-canonical-system); and a
**skills posture of official canon we never maintain + a tiny thin-bridge orchestration set**
we author (02, 11-skills-audit). Brand presence is a **hub-and-spoke, open-protocol-first**
plane (self-hosted Postiz, Bluesky/Mastodon anchored, gated platforms entered per-lane on
payoff) with per-org isolation and agents never holding raw platform tokens (09-brand-
development). Funding is **build live evidence first, then apply** only to programs that fit
each lane; one Delaware C-corp behind `yrka.io` (Stripe Atlas) unlocks the company-gated
credit stack (07-brands-funding).

This is feasible in complete final shape for one human and many agents, on tooling Jamie
already runs. The **sign-in shape** and the **directory arrangement** are now decided
(soft-locked — §3, §5). Core brand names are committed — **jami** (agent), **the Studio** (UI
environment), **jami.studio** (OSS platform), **yrka** (commercial); the remaining product/suite/
CLI/scope names are the open creative item (canon §4), a dedicated naming sweep for when Jamie has
the feel for the shape.

---

## 2. The System > Org-lane > Domain > Project Model

Per canon §2 (owned by 08-canonical-system, adopted by 05-templates, 02, 03, 11). Four tiers,
each owning one concern, inheriting downward, with explicit precedence. A glossary lives at
every level so terms stay consistent across the family. (The **org-lane** is the grouping tier
Jamie reasons in; the **domain** is the brand + identity/auth + deploy boundary.)

| Layer | Location | Concern | Content | Changes |
|---|---|---|---|---|
| **System** | `C:\Users\james\dev` | The durable, identical-everywhere way of working | Planning/report/doc styles, the `AGENTS.md` spine, the verification-ladder **method**, changelog-fragment discipline, the orchestration contract, the work-record schema, doc-hygiene, the thin-bridge workflow skills, the system glossary | Only when the craft improves (rarely). Carries **no** project name, vendor, account, or secret — by construction. |
| **Org-lane** | `dev/<org>/` (`oss`/`saas`/`personal`) | Shared-lane concerns | Legal entity, funding lane, secret-vault lane; the grouping Jamie reasons in. | When a lane's entity/funding/vault posture changes (rare). |
| **Domain** | `dev/<org>/<domain>/` | Brand, accounts, identity surface, vendors per domain | Domain identity, vendor accounts, brand, the OIDC **auth surface**, domain `AGENTS.md`/glossary, overrides of system defaults. The layer that knows "Jamie." | When a domain's accounts/policy change (occasional). |
| **Project** | `<org>/<domain>/projects/<repo>` | This repo's transient specifics | Thin `AGENTS.md` = inherited spine + a "Project Specifics" block (preferred dev principles, expected order of work, nuances/pitfalls, recurring agent mistakes, stack, module map, the **commands** that instantiate the ladder, secret-lane table by reference) + pointer to `system@version` + owning domain + project glossary | Freely. Transient by design. |

**Precedence (explicit, mechanical):** explicit human instruction > domain override > nearest
project `AGENTS.md` (implementation detail) > system canon (defaults). Project transients
**never** flow up; domain config never hardcodes a project; system canon never names a
vendor/account/secret. `CLAUDE.md` is a one-line pointer to `AGENTS.md` in every repo.

**Org-lane → domain → project map (canon §2):**

| Org-lane | Domain | Projects |
|---|---|---|
| `oss` | `jami.studio` (foundations platform) | `@jami-studio/harness`, `@jami-studio/ui`, `@jami-studio/orchestra` (+ BYOK showcase) |
| `oss` | `intercal` (≈intercal.dev) | the delta/temporal knowledge graph — lightly maintained, openly available |
| `oss` | `collective` | the open agent society — the large undertaking |
| `saas` | `yrka` | one product monorepo: `business-suite`, `media-suite`, `research-suite`, the **free-tools** cluster (benefits finder, brand-name + domain lookup, leads + competitor tracker, daily briefs), BoardRune — all sharing one identity |
| `personal` | `jnh.org` | `website` (`.com` folds in) |

**Intercal and the Collective are their own domains that _consume_ the foundations — not
foundations inside jami.studio.** The foundation set is `harness` + `ui` +
`orchestra`. Free-tools live **inside** the yrka product and inherit its auth.

**Canon vs domain-specific vs project-transient.** The System layer is fully reusable craft —
also the conceptual basis the `orchestra` product externalizes. The Org-lane + Domain
layers are the Jamie-specific layers (lanes, their entities/vaults; domains, their accounts and
brand voices). The Project layer is per-repo and disposable. Because System carries no transient
by construction, no project/account/vendor change ever touches it — that is the mechanism, not
discipline, by which the canon stays maintenance-free (08-canonical-system).

---

## 3. Committed Decisions

The consolidated baked-in decisions across all eleven reports, grouped by theme. These are
**decisions, not options**. Each cites its owning report.

### Structure & layering

- **System home = `C:\Users\james\dev`; domains = `dev/<org>/<domain>/` with
  `docs/{brand,research,roadmaps}` + `projects/`.** Org-lanes `oss`/`saas`/`personal` exactly as in §2.
  Built underneath existing setups without editing current configs/secrets/runtimes or the
  old `projects/` tree (canon §1). (08-canonical-system, 05-templates.)
- **Four-tier instruction model (System → Org-lane → Domain → Project)** with a glossary per tier and
  the mechanical precedence above; `CLAUDE.md` is a pointer to `AGENTS.md`. (05-templates,
  08-canonical-system.)
- **Prior projects are input-to-thinking only.** No code, name, directory, or contract
  carries forward; the old tree retires on its own. Distilled product intents and design
  lessons map onto the scaffold, but every build is fresh. (01-projects-audit.)

### Dev system & orchestration

- **Multica, self-hosted, is the whole orchestration system** — issues + agents-as-members,
  local-daemon runtime (keys/repos stay local), Squads, Autopilots, skill-compounding. The
  continual orchestrator **replaces `goal.md`**. No separate board to sync to; Linear/Notion
  available but not required. License is modified Apache 2.0 with a SaaS-resale restriction —
  fine for internal self-host; read the LICENSE before any hosted/productized exposure.
  (03-dev-systems, 08-canonical-system; corroborated 06, 10.)
- **In-session gates first, fail-closed, before any remote.** Deterministic hooks run the
  verification ladder (format, code-health, lint, typecheck, tests-where-health-at-risk,
  boundaries, docs-hygiene, changelog-check) at the tool boundary; remote CI is an additional
  gate only. (03-dev-systems, 08-canonical-system.)
- **Knowledge automation uses industry-leading OSS, never bespoke:** CodeGraph (system
  mapping/graphing), a changelog-fragment pipeline, Mintlify (docs), and a browser-automation
  pair — Playwright MCP (driving/E2E) + chrome-devtools-mcp (debugging/perf) — all chosen on
  merit and maintained by us not at all. (03-dev-systems.)
- **Coding runtimes are OAuth** (Codex, Claude, Gemini, xAI; daily: SuperGrok Heavy, Claude
  Max, Codex Pro, Gemini Pro; enterprise Vertex/Azure credits for dev/test). Unattended runs
  use a non-interactive scoped credential. **Hermes stays fully separate.** (03-dev-systems,
  08-canonical-system.)
- **Determinism from fixed contracts:** the work-record schema, the orchestration dispatch
  contract, the close-gates, and the verification-ladder method are fixed and machine-checkable
  (plain Markdown/`SKILL.md` + a Postgres-backed record). The agent's leash exists only inside
  one workstream pass. (08-canonical-system.)

### Foundations architecture

- **Foundation source: fork agent-native wholesale.** `harness`, `orchestra`, and
  `ui` are forked from the MIT **agent-native** foundation (Builder.io) — its transport-decoupled
  agent loop, open multi-provider engine registry, single persistence seam (`DbExec`), native
  connection/secret layer, A2A/MCP surface, and `dispatch` control plane (the biggest head-start toward
  `orchestra`). Fork target **`@agent-native/core` 0.32.2 + `@agent-native/dispatch` 0.8.28**
  (0.23.0 is the read-clone). Targeted swaps, all config/adapter: drop the Builder LLM gateway → BYO
  ai-sdk/anthropic engine; DB default → Postgres; transcription → `Transcriber` adapter; 6 hardcoded
  accent tints → tokenized generator; analytics/branding → ours. Fork-time hardening: lift the LICENSE
  notice; fix the `oauth_tokens` read-scope gap (owner/org-required reads). Greenfield forbids carrying
  *our* legacy forward, never adopting a hardened MIT third party. (12-agent-native.)
- **Foundations are libraries; products are compositions.** Five OSS foundations under
  `jami.studio`; every product is a thin domain layer over `harness` + `ui`, with
  dual-invocation (human UI and agent against one governed contract). (06-rebuild-feasibility,
  10-product-concepts.)
- **Stand on open transport, own the vocabulary — two UI transports, both built.** MCP (tools/data,
  final core 2026-07-28), A2A (inter-agent, Linux Foundation v1.0, Signed Agent Cards). The **internal**
  agent↔UI surface runs on agent-native's **native SSE spine** (bounded seq-replay + a global DB-sync
  channel — capabilities AG-UI cannot model) and is **kept, not rebound**; **AG-UI is the separately-built
  external interop adapter** (`@assistant-ui/react-ag-ui`); A2UI/MCP Apps are portable UI payloads. The
  owned SDUI/action vocabulary (`ui.tree.render`, `ui.action.invoke`, tool/action schemas) rides over
  whichever transport and is versioned and audited independently. (06-rebuild-feasibility,
  10-product-concepts, 12-agent-native.)
- **Adopt governance, don't rebuild it.** **`@microsoft/agent-governance-sdk@4.0.0`** (MIT, **Public
  Preview**) behind one **`policyCheck()` seam** (default-deny on error): in-process YAML `PolicyEngine`,
  real API `evaluate(action, context)` / `evaluatePolicy(agentDid, context)`, in-memory SHA-256
  **hash-chain** audit, Cedar/OPA via **external HTTP bridges** (not embedded), W3C Trace Context,
  OWASP Agentic Top-10. Adopt its `CredentialVault`/`CredentialInjector` pattern for connection-use.
  Author only the operator policy library + audit-query/export surface; the durable Postgres audit row
  is the system of record. Because it is Public Preview, the seam stays. (06-rebuild-feasibility,
  12-agent-native.)
- **No declarative planner in the product runtime (Option A+).** The forked agent loop + A2A task-store
  + run-manager/run-loop-with-resume + triggers + cron + approvals **are** the complete durable-
  orchestration shape — no DAG/workflow engine is built. (The continual orchestrator that replaces
  `goal.md` is the **Multica dev-system** concern, a separate layer — do not conflate.) (12-agent-native.)
- **One data plane + an additive, natural-named entitlement layer.** One Postgres, namespaced schemas,
  row-level security, explicit select contracts, enforced migration ordering, append-only audit — behind
  the db adapter. **Thin adapters only where churn is real** (full register below). The
  System→Org→Project hierarchy + ala-carte entitlements add **new tables keyed to `org_id` + email with
  zero ALTERs to core** — natural names, **no ownership prefix** (`projects`, `resource_projects`,
  `capabilities`, `entitlement_keys`, `teams`, `team_members`, `capability_grants`); "has business+media,
  not research" = rows present/absent (default-deny). Inter-org isolation = separate db/auth/users per
  org (a deployment fact). (06-rebuild-feasibility, 12-agent-native.)
- **Fully tokenized design system** (accent color is a token, never a hardcoded value);
  `ui`'s primitive component vocabulary is the owned UI surface that agent-to-UI payloads
  render against — one shared registry distilled from agent-native's 23 duplicated shadcn copies.
  (06-rebuild-feasibility, 10-product-concepts, 12-agent-native.)

### Adapter seams (the register)

- **The test for a seam:** a capability gets a thin **port we own** when **(a)** provider APIs are
  commoditized enough that a normalized shape covers ~90% **and (b)** portability/fallback carries real
  value. Deep/idiosyncratic vendors get a thin port for **swappability insurance only**, not agnosticism.
  **Never double-abstract** — our port is the stable seam, a third-party multi-provider SDK is the _impl
  behind it_ (same as `policyCheck()` over the governance SDK); cross-cutting needs (idempotency, audit)
  live at our layer. Full register + status table lives in **canon §2 Adapter seams.**
- **Committed seams:** inference (`ai-sdk-engine`/`AGENT_ENGINE`), realtime voice (LiveKit), STT/TTS,
  auth (BetterAuth OIDC), governance (`policyCheck()`), transport (native SSE + AG-UI), secrets/vault,
  and **email/transactional → `@opencoredev/email-sdk`** (MIT, zero runtime deps; Resend primary +
  SES/Postmark fallback; send-only — idempotency at our port, inbound/AgentMail is a separate concern).
- **Adopt-at-build (passes a+b):** **OpenTelemetry** emit seam (Sentry + GA as exporters — highest-
  leverage next), a thin **S3-API** storage port (S3/R2/Supabase), a **media-gen** port (Fal + peers), and
  a provider-swappable **billing adapter** (Stripe / Lemon Squeezy / Paddle / Polar — **revised** from
  "thin only": MakerKit proves a real billing adapter is feasible + sellable in the Kit; normalize the
  ~90%, leave tax/MoR as configured strategies; exact shape in research), and a **provisioning/control-plane**
  port (hosted CF-WfP+Neon vs OSS Supabase/Neon-self-host). **Bounded on purpose:** db is already portable
  via Postgres-wire + Drizzle (no extra layer). (canon §2; email-sdk: `email-sdk.dev`.)

### Distribution & open-core model

- **Depend, don't fork.** The OSS↔SaaS boundary is a **published package surface, not a git merge.**
  Public OSS repo publishes versioned packages; private SaaS repo consumes them as semver deps
  (`pnpm add @jami-studio/harness`). "Sync downstream" = `pnpm update`; "upstream a tweak" = change
  in OSS, publish, bump. No hard fork, no merge tax — and it **structurally enforces the no-bleed rule**
  (the OSS repo never contains SaaS code, so secrets/SaaS can't leak upstream via a merge).
- **Extend through seams, never patch source.** SaaS plugs in via adapters/registries/hooks; the urge to
  edit OSS from inside SaaS is the signal a seam is too narrow (fix the seam, not the merge). Target ~95%
  of SaaS work in `@yrka/*` only.
- **Framework vs scaffold are distinct.** Framework (`@jami-studio/harness`, `@jami-studio/ui`,
  `@jami-studio/orchestra` + adapter packages) is *depended on*, stays live-updated. Scaffold
  (`@jami-studio/create-app`) is *instantiated once and owned* — the "add keys, point auth at your domain"
  starter. **yrka = the scaffold instantiated + private `@yrka/*` packages on the public framework** →
  we're a real user of our own OSS (reference impl + best demo, clean dogfood). OSS family: framework +
  **`@jami-studio/cli`** + **MCP server** + **`@jami-studio/create-app`** + per-capability **adapter packages**.
- **The open-core line.** OSS = engine + every seam + a complete single-tenant BYOK self-hostable product
  (never crippleware). Commercial = multi-tenancy at scale, hosted ops, enterprise governance/compliance/
  federation, billing & entitlements, the yrka suites. **Governance is the split:** `policyCheck()` seam +
  default policy engine ship OSS (governable alone); enterprise impl (Cedar/OPA, compliance, federation,
  governance-SDK) is commercial behind the seam. Commercial features are plugins on seams, never core forks.

### Commercial model & the Kit (open-core productization)

- **OSS = the full `@jami-studio/*` family, genuinely open** (OSI-licensed, fully capable, BYOK, ~0-effort
  cohesion — never crippleware). It's the adoption + agent-recommendation engine **and** preserves OSS
  funding/credit eligibility (commercial stays separate; depend-don't-fork enforces it).
- **The Kit = a paid commercial product** (leaning: housed under `saas`/yrka, flagship beside the suites):
  a curated, opinionated **production-ready monorepo scaffold** (marketing, billing+portal, roles/perms,
  the suites) that the interactive **`jami` CLI** provisions to chosen vendors/configs/packages, + curated
  orchestration skills + docs + support. OSS does it with elbow grease; the Kit sells **time/comfort/
  support/known-good-shape** — "pay vs build." Differentiator = curation+assembly+support, never gating OSS.
- **Orchestra is optional + idempotent.** "Set up my own SaaS" isn't native vanilla orchestra — it's a
  curated **skill+instruction set** (ships with the Kit) usable in orchestra *or* any LLM dev flow.
  Single-agent-skill ↔ full-orchestra-plan is a **toggle, not a re-provision**; never a user pain point.
- **Revenue surfaces (directional):** hosted/managed ops · done-for-you dev · launch-ready Kits (personal→
  commercial, internal-app→agent→SaaS→agents-as-a-service). **Hard constraint:** no shape may block OSS
  funding/credits. This is **not SaaS-as-we-know-it** — base it on the most AI-forward orgs + Principled Edge.
- **Linchpin = hosting schema (verdict in — SPLIT THE STACK):** **Cloudflare = platform plane** (Workers-for-
  Platforms dispatch namespaces, Durable Objects, Workers AI/Vectorize/Queues, KV/R2/D1, edge auth — tenant
  agent/edge logic as lean Workers); **Next.js apps on Vercel/Node host** (Cloudflare Containers ok), fronted
  by the CF router — heavy per-tenant Next.js Workers hit the 10 MiB bundle + 128 MB isolate ceilings +
  OpenNext gaps, so not the default tenant target (own first-party control-plane Next.js on Workers is fine).
  **Neon** Postgres both planes; **OSS self-host = Supabase + Neon(Apache-2.0)**. A **provisioning/control-plane
  adapter** keeps hosted vs OSS behind config. (Hosting #2 + CF-parity #7, 2026-06-02.)
- **Hosting mental model + named stack (deep-dive verdict):** every product = **web surfaces** (kiosk/
  serverless-fine) + an agent **"kitchen"** (long-running/stateful → container, **never serverless**; the
  harness/orchestra are **Node services, not Next.js apps**). **jami.studio** → **Cloudflare Pages**
  (Astro/static; ~$0–5/mo, unlimited bandwidth). **yrka.io** → **one Cloudflare plane** (Pages/Workers web +
  **Workers-for-Platforms** tenancy + **Durable Objects** sessions) **+ Google Cloud Run** container kitchen
  (scale-to-zero, Jobs to 7 days, L4 GPU option) **+ Neon** (co-located); Fly/Railway = valid kitchen alts.
  Vercel mispriced for minutes-long I/O-wait agent sessions (13-min ceiling); yrka kitchen ≈ $50–80/mo small,
  $150–300/mo moderate. **Multi-host principle:** portability proven by portable build (Docker + Postgres +
  provisioning seam) + OSS self-host, not redundant prod; honestly multi-platform → credit programs
  truthfully; migrate opportunistically. Deliberate lock-in = DO + WfP only (isolate behind session/tenant
  interfaces). (Hosting deep-dive, 2026-06-02.)
- **The real Vercel-replacement = a host-agnostic deploy+secrets pipeline** (GitHub Actions builds/deploys
  the Docker image + our `secrets` adapter injects) → the host becomes a commodity; we *bring*
  Vercel's magic. **Swap bar:** push-to-deploy · secret sync · vendor/env wiring · free-until-scale · previews.
  **Cost-onset:** CF Pages ≈ $0, **Cloud Run ≈ $0** (perpetual free tier), Railway ~$5/mo floor → targets are
  *cheaper* than Railway at day-one scale. So **don't waypoint** (Railway→migrate saves nothing + the pipeline
  closes the DX gap): **DECIDED = (A)** — land on CF Pages + Cloud Run from day one (free, final, no
  migration), on the host-agnostic pipeline. Railway = not in the core stack (documented Docker-portable
  fallback + fine for *isolated* external projects). Cheapness = **perpetual free tiers**, not expiring trial
  credits — don't architect around credits.
- **UI render seam (committed — #6):** shadcn registry = **build-time seed** of the resident tokenized
  vocabulary; a **separate runtime contract** renders agent **`UIPayload` (data, not code: name+props)** against
  an app-resident **allowlisted** registry (Zod-validated, graceful fallback). Convergent 2026 pattern (Vercel
  AI SDK / A2UI / CopilotKit / Thesys). **AG-UI + native SSE carry the stream** (channel, not renderer); MCP-UI
  iframes are a separate untrusted lane only. Design for **version skew** (vocabulary vs payload-contract).
- **Licensing posture (research-backed, counsel to confirm):** open foundation = **Apache-2.0** (OSI →
  funding-eligible, + patent grant/trademark reservation; compatible with the MIT upstream). Open packages
  stay 100% OSI single-license; **DCO not CLA**; paid Kit/SaaS in private repos. **AWS credits exclude VC/
  single-vendor → DigitalOcean + GitHub are the reliable credit sources**; publish governance + CoC. Models:
  Supabase/PostHog. **MakerKit = strict clean-room** (EULA forbids building a Kit from it / training on it).
- **Funding posture (defined):** **bootstrapped, not VC-backed** (one independent dev, self-funded) — an
  *asset* for OSS credits (many exclude VC-funded). Near-zero admin now (Apache-2.0 + public repo + LICENSE/
  README/CONTRIBUTING-with-DCO/CoC/light GOVERNANCE) unlocks DO + GitHub Sponsors + vendor startup credits,
  all individual-eligible. Heavy stuff (legal entity, trademark, accelerators) deferred to traction — the
  C-corp is a commercial-lane step *for when ready, not an OSS prerequisite*. Structure keeps every door open
  without retrofitting; **self-gating is the only real risk.** (canon §2.)

### Suites — bridge, don't replace

- **yrka does not replace specialized research/media/business tools** — it's where **the work _behind_ the
  work** happens: first-class touchpoints + adapters + normalization pipelines that bridge users/agents/
  teams/orgs to those tools. Suites differ by domain but **aren't separate** — installable units that
  interoperate via **one shared registry**. (Unit term — package/app/plugin — pending taxonomy research;
  lean: package.)

### Agent discoverability (AX)

- **Stance:** most visitors/callers to our sites/APIs/products will be **agents** — a first-class user
  persona with its own UX, planned through dev. End-goal: a user's agent installs/configures/provisions the
  whole OSS suite via the CLI (user-permissioned) — "fork + integrate my app idea → Done."
- **Legibility is the moat.** Uniformly described + accessed capabilities (adapter + capability/UI registries)
  make the product legible to agents → precise, use-case-right recommendations. Most products are illegible;
  ours isn't.
- **AX surface (built through dev):** `llms.txt`/`llms-full.txt` (Mintlify auto-gen — near-free); first-class
  **MCP server** (hosted + self-host); **official skills**; **agent-first CLI** (`--json`/`--yes`/idempotent);
  **OpenAPI + typed SDKs**; machine-readable **capability manifest** (adapter register published as a
  discoverability asset); **`AGENTS.md`** in the scaffold.
- **Discoverability ⇄ governance are one coin.** Agent install/provision "with user permissions" is only safe
  because the primitives are already committed — agents as first-class principals, `policyCheck()`, hash-chain
  audit. Build + market together: *agent-native and agent-safe.* (canon §2.)

### Identity & sign-in

- **Self-hosted BetterAuth as an OIDC issuer per domain** (the identity surface).
  **Passkeys-preferred + social-OAuth fallback.** Intra-domain SSO via OIDC (one login across a
  domain's apps — e.g. the yrka suites + free-tools). **Domains unfederated by default but
  OIDC-ready** — federation or a hosted IdP (WorkOS/Clerk) lands late as config behind the auth
  adapter. Public marketing routes (`www.<domain>`) ungated; registration crosses to the gated
  `app.<domain>`. Agents authenticate as first-class principals (service-account tokens / Agent
  Passport), never by impersonating a human session. The identity/entitlement **model** is committed
  (additive natural-named tables — see Foundations architecture); only IdP/vendor specifics are
  verified at lock. (06, 10, 04, 08, 12.)

### Voice & real-time

- **Three interaction modes coexist:** **text** (default), **baseline turn-based STT↔TTS voice**
  (retained), and an **optional real-time supervisor layer** on top. The real-time agent handles
  voice I/O + barge-in and **dispatches** tasks to `harness` (never runs heavy work inline),
  subscribes to the run's **native-SSE event stream** to narrate + take mid-flight changes, and is
  **toggle-able mid-run** via seq-replay (the same seq-replay that justified keeping native SSE over
  rebinding to AG-UI). Built on industry-leading self-hostable OSS — realtime infra behind a thin
  `realtime` adapter, the realtime model behind the LLM adapter. The live-eval is a **build-time
  validation, not a planning blocker.** Stack specifics grounded by `13-realtime-voice` and verified
  at lock. (06, 10, 12, 13-realtime-voice.)

### Tooling & skills

- **Canonical toolchain (one per language, pinned, reproducible):** pnpm (JS) + Turbo
  (monorepo), uv (Python), fnm (one Node version manager), rustup/cargo (Rust), scoop (the
  canonical Windows package manager). Corepack is the pnpm shim only while on Node ≤24
  (unbundled from Node 25+). Redundant managers retired; duplicate CLI installs collapsed.
  (02-system-and-tooling.)
- **System cleanup is a policy, not a chore:** one scheduled prune job with retention caps,
  log-DB rotation, one-off-artifact sweep, cache eviction, and active-WAL safety. Accreted
  allowlists reset to a small intentional set. (02-system-and-tooling.)
- **Skills posture — two tiers, one mechanism.** (1) **Official-canon skills we never edit or
  maintain** — vendor official skills (gcloud, azure, cloudflare, vercel, supabase, neon,
  stripe, resend, mintlify, …) plus one trusted community baseline (committed: `anthropics/skills`,
  consumed as shipped). (2) **A tiny thin-bridge orchestration set we author** —
  `orchestrate` plus at most `plan`/`report`, each a deterministic "do exactly this, then this"
  bridge; if a shipped official skill fits as well or better, we ship nothing. One versioned
  skills home, distributed by symlink into every runtime via the `skills` CLI, refreshed from
  official upstream on a Multica schedule. No manufactured maintenance burden. (11-skills-audit
  owns the spine + thin-bridge shape; 02-system-and-tooling owns the mechanism.)
- **Docs = Mintlify** (style for OSS repos, hosted for live projects). Notion/Google not
  forced. (03-dev-systems, 05-templates, 08-canonical-system.)
- **Reusable workflows are skills, not duplicated documents**; repo identity + invariants stay
  in `AGENTS.md`. (05-templates.)

### Secrets & access

- **One agnostic `secrets` adapter** (`secrets get`, `secrets run`) — the seam is committed, the backend is
  config. **Current backend = Bitwarden Secrets Manager** (free: 3 projects = lanes, 3 machine accounts =
  per-lane agents, `bws` CLI); **SOPS+age / Infisical / Vault are swap-targets behind the same seam**. The
  same free Bitwarden account is also the human password manager (logins + machine-token custody + recovery).
  **1Password dropped** (no free tier). (04-secrets, F03; REVISED 2026-06-02.)
- **Lane isolation = a BWSM project + machine account per lane** (oss/saas/personal); agents read via
  `BWS_ACCESS_TOKEN`. The org-lane boundary maps to each platform's native isolation unit (Cloudflare →
  account-per-lane; secrets → project/machine-account-per-lane; Neon → project-per-lane). **This is bucket A
  (our dev secrets, never ships)** — distinct from the harness's shipped user-secret/connection store (bucket
  B, F05/F07). (04-secrets, F03.)
- **Concrete first task:** rotate, at the provider, the live-looking plaintext tokens already
  on disk (a Neon bearer in `~/.codex/config.toml`; tokens/service-account emails in
  `~/.codex/rules/default.rules`), then re-home as `op://` references — deletion alone leaks
  through git history. (04-secrets, handed off from 02.)

### Brand & funding

- **Three org-lanes (`oss`/`saas`/`personal`); one entity, brand surfaces per domain.** One Delaware
  C-corp behind `yrka` (Stripe Atlas) unlocks the company-gated credit stack; the OSS domains
  (jami.studio, intercal, collective) are its open face; the personal brand (jnh.org) is the founder's
  individual identity. (07-brands-funding.)
- **Build live evidence first, then apply** only to programs that fit each lane. Commercial
  lane targets the cloud/AI credit stack (Azure Founders Hub, Anthropic, Neon, AWS Activate,
  Google for Startups, Cloudflare, NVIDIA Inception); OSS lane targets no-equity programs
  (Vercel OSS, GitHub Sponsors); maintainer-gated AI credits are a post-adoption wave.
  (07-brands-funding.)
- **Brand plane is hub-and-spoke, open-protocol-first:** one self-hosted Postiz instance as
  the single publish API; Bluesky (AT Protocol) + Mastodon (ActivityPub) anchored on every
  lane; X metered (prefer URL-free posts), Instagram (start App Review early) and LinkedIn CMA
  (entity-gated) on the commercial lane. Per-org isolation (dedicated browser profile, MFA,
  non-linkable naming); agents never hold raw platform tokens. Outbound comms run through the
  **email seam** (`@opencoredev/email-sdk` → Resend primary + fallback); AgentMail covers agent
  inboxes/inbound, a separate concern. (09-brand-development; canon §2 Adapter seams.)

### Products

- **One coherent product family:** five OSS foundations, three commercial suites + a free-tools
  cluster + BoardRune, a personal website, and the public agent society. Public surfaces (the
  Studio showcase, free-tools routes, the Collective public view) are funnels into the commercial
  lane. (10-product-concepts.)
- **Drift-corrected build facts:** the brand/domain availability engine is **RDAP-first** (RDAP
  replaced WHOIS as the ICANN standard Jan 2025) with WHOIS fallback only for ccTLD stragglers;
  the benefits-finder browser extension is **Manifest V3-native** (Chrome removed MV2 in 2025 —
  no migration debt). (10-product-concepts, 07-brands-funding.)

---

## 4. Order of Work + Product Launch Order

Canon §3, restated as the dependency-ordered path. Full-final-shape; each stage is the
production shape of its layer (no MVP/phase language).

**Order of work (canon §3):**

1. **System-level tooling, dev folders, packaging** — the canonical toolchain (pnpm/uv/fnm/scoop),
   the system dotfiles repo, the scheduled prune job. (02-system-and-tooling.)
2. **Runtimes, projects, configurations, skills** — the OAuth coding runtimes, the one versioned
   skills home (official canon + thin-bridge set) symlinked into every runtime. (02, 11.)
3. **Canonical system architecture + plumbing** — System→Org→Project scaffold, the `secrets`
   adapter + per-lane vaults (rotate plaintext tokens first), Multica self-host + runtimes/configs,
   scaffolded teams/workflows. (04-secrets, 03-dev-systems, 08-canonical-system, 05-templates.)
4. **Report phase** — map planned systems, architecture, lifecycles, and data ground-up through
   end-user experience across all projects; surface and solve broken assumptions and brittle seams.
5. **Roadmap phase** — remap every system/name/file/standard/protocol/seam/api/service/contract/
   route on first-principled, audited, officially-guided truth.
6. **Master roadmap** — all dev work across the system; each org flows to its preferred timeline.
7. **Connect/configure accounts** + scaffold scoped configs/docs per org+project (Stripe, hosts,
   db, …); incorporate the Delaware C-corp. (07-brands-funding, 09-brand-development, 04-secrets.)
8. **Transfer workstreams** onto the production-ready automation system.
9. **Work commences** — real-time additions/adjustments.
10. **Business & marketing operations** flows kick off.

**Product launch order (canon §3, directional):**

Marketing sites (begin branding → funding apps) → foundational systems/contracts (`harness`,
`ui`, the data plane, the governed-action contract) via the OSS repo+domain → launch the
Studio (begin Intercal/Collective dev) → launch yrka.io's flagship suite (begin MMO/BoardRune dev)
→ free tools (benefits finder, brand-name + domain lookup, leads + competitor tracker, daily briefs)
→ applications/funding → release Intercal (`agent-delta`) → release BoardRune → launch the Collective
(`agent-collective`) → strategy/planning → applications/funding.

**Dependency note.** `harness` + `ui` are the family's critical path (everything composes
over them); `agent-delta` (Intercal) lands second because the daily-briefs, research-suite, free-tools
freshness, and the Collective all read from it; `orchestra` is the dogfooding ground that
perfects harness + UI UX. Stages 1–3 are pure operator/canon work with no product dependencies and run
immediately. (06-rebuild-feasibility, 10-product-concepts, 08-canonical-system.)

---

## 5. Open + Soft-Locked Decisions

**Genuinely open (canon §4) — one item:**

- **Final product/brand names — partially decided.** Core names committed (§6 glossary, canon §2
  Naming): **jami** (agent), **the Studio** (UI environment), **jami.studio** (OSS platform), **yrka**
  (commercial). Still open, assessed as one cohesive set in a **dedicated naming sweep** when Jamie has
  the feel: the **SaaS suites**, the **Intercal/Collective** product names, the **CLI** name, **etymara**
  (naming tool), and the **npm publish scope**. Leaning: **intercal.dev** (if available; not married).
  Domains are settled. (01, 07, 09, 10.)

**Resolved since the original list — soft-locked this planning phase** (firm enough to build on,
revisitable as we learn):

- **Sign-in shape (was the live §4 item).** Self-hosted **BetterAuth as an OIDC issuer per domain**
  (the identity surface); **passkeys-preferred + social-OAuth fallback**; intra-domain SSO via OIDC
  (one login across the yrka suites + free-tools); **domains unfederated by default but OIDC-ready**,
  so federation or a hosted IdP (WorkOS/Clerk) lands late as config behind the auth adapter. Public
  marketing routes ungated; registration crosses to the gated `app.<domain>`. Agents authenticate as
  first-class principals. The identity/entitlement **model** is committed (§3); only IdP/vendor
  specifics are verified at lock. (06, 10, 04, 08.)
- **Directory arrangement.** `dev/<org>/<domain>/projects/<repo>` with org-lanes `oss`/`saas`/
  `personal` (§2). Intercal + Collective are their own `oss` domains; free-tools live inside the
  `yrka` product. The layer model and all contracts are invariant under any later rearrangement.
  (02, 03, 05, 08.)

Everything else defaults to the committed answers in §3.

---

## 6. Glossary Seed

The cross-cutting terms, defined once. Lower-tier glossaries (org/project) refine but never
contradict these.

- **System / Org-lane / Domain / Project** — the four instruction tiers. System = durable craft canon
  (`dev/`); Org-lane = `oss`/`saas`/`personal`, the grouping + shared-lane concerns (entity, funding,
  vault); Domain = per-brand config/vendors/accounts/identity-surface (`dev/<org>/<domain>/`); Project =
  a repo's transient specifics (`<org>/<domain>/projects/<repo>`). Precedence: human > domain override >
  nearest project > system.
- **Principled Edge** — the One Ethos (canon §0): the perfect blend of first-principles, production-
  grade systems design and a bleeding-edge, risk-seeking hacker mentality. Every decision is
  **root-correct** (build the capability at its root — a token system, never hardcoded values) and
  **zero-bloat** (no weight uncorrelated to capability). Cutting corners and over-engineering are the
  same failure.
- **agent-native** — the MIT third-party foundation (Builder.io; `@agent-native/core` +
  `@agent-native/dispatch`) the harness/orchestra/ui are **forked wholesale from**. Fork target
  core 0.32.2 / dispatch 0.8.28. Not *our* legacy — adopting it is the Principled-Edge
  stand-on-shoulders move, fully compatible with greenfield.
- **Brand names (committed core):** **jami** = the *agent* the harness presents — backronym
  "Just Another Machine Interface" (self-effacing + a play on Jamie's name); **the Studio** = the
  *environment* `@jami-studio/ui` renders (the user's workspace); **jami.studio** = the OSS *platform/domain*
  housing the foundations — agent (jami) + environment (Studio) compose the platform name; **yrka** = the
  *commercial* product. **Package/repo convention:** brand in the namespace, function in the leaf — npm
  scope **`@jami-studio`** (matches the domain; `@jami-studio/harness`, `…/ui`, `…/orchestra`, `…/cli`
  (binary `jami`), adapter pkgs), scaffold `@jami-studio/create-app`, **GitHub org + socials `studio-jami`**
  (deliberate reverse-match), repos = the function leaves (`harness`/`ui`/`orchestra`); commercial scope
  `@yrka`. Owned: `jami.studio` + `@jami-studio` + `studio-jami`. Remaining suite/Intercal/Collective/
  etymara names = the open naming sweep (§5).
- **The foundations (the `oss/jami.studio` substrate — three repos):**
  - **`@jami-studio/harness`** — the provider-agnostic agent SDK (forked from agent-native `core`): the governed
    action loop, tool/contract registry, memory, native connection/secret layer, and thin infra adapters;
    dual-invocation against one contract.
  - **`@jami-studio/ui` (UI Registry)** — the tokenized design system + primitive component vocabulary that
    every surface composes and that agent-to-UI payloads render against.
  - **`@jami-studio/orchestra`** — the orchestration/dev system (teams, squads, scheduling) composed over
    harness + UI (forked from agent-native `dispatch` — vault, grants, approvals, audit, cross-app A2A),
    running on self-hosted Multica. No declarative planner in the product runtime (Option A+).
- **The independent `oss` domains (consume the foundations — not foundations themselves):**
  - **Intercal** (`oss/intercal`, ≈intercal.dev) — the temporal/delta knowledge graph: durable changelog
    + cross-system knowledge substrate exposed via MCP/REST + a visual web app. Own domain, lightly
    maintained, openly available — not a jami.studio foundation, not a yrka.io product.
  - **The Collective** (`oss/collective`) — the open agent society: deposit protocol,
    reputation/governance schema, public-view harness. Own domain, the large undertaking.
- **The yrka product (`saas/yrka`, one monorepo, commercial):** `business-suite` (SMB operations),
  `media-suite` (mixed-media gen/edit/upscale), `research-suite` (research + long-form writing, grounded
  in Intercal); the `free-tools` cluster (benefits finder, brand-name + domain lookup, leads + competitor
  tracker, daily briefs); **BoardRune** (massive-multiplayer org team-building game). All surfaces of one
  unified, ala-carte interface, sharing one identity; free-tools inherit the product's auth.
- **Multica** — the self-hosted whole orchestration system (issues, runtimes, squads, Autopilots,
  skill-compounding) that replaces `goal.md`. No separate board to sync to.
- **Work-record** — the single durable, tracker-agnostic schema for a unit of work
  (id/title/layer/org/project/type/intent/definition-of-done/verification/assignment/status/source/links);
  every Multica issue is a projection of it.
- **Verification ladder** — the in-session, fail-closed gate sequence (narrowest gate first, climb);
  the method is system canon, the commands live in the project leaf.
- **Official canon skills** — vendor/community skills we use as shipped and never edit or maintain.
  **Thin-bridge skills** — the tiny set we author encoding our deterministic flows.
- **Open protocol stack** — MCP (tools/data), A2A (inter-agent); **native SSE** for the internal
  agent↔UI surface (seq-replay + DB-sync), **AG-UI** for external interop (both built); A2UI/MCP Apps
  (portable UI payloads): transport we stand on, never reinvent.
- **`policyCheck()` seam** — the single choke point over `@microsoft/agent-governance-sdk@4.0.0`
  (MIT, Public Preview): our hard capability-grant gate (Postgres) → `evaluatePolicy` for policy/approval
  nuance; default-deny on error. One enforcement path, never two.
- **Entitlement layer** — additive, natural-named tables (`projects`, `resource_projects`, `capabilities`,
  `entitlement_keys`, `teams`, `team_members`, `capability_grants`) keyed to `org_id` + email, zero core
  ALTERs. Ala-carte product access = grant rows present/absent (default-deny). No ownership prefix.
- **Org-lane** — one of the three groupings `oss` / `saas` / `personal`; the entity, funding, and
  vault-lane boundary. **Domain** — a branded product under a lane (jami.studio, intercal, collective,
  yrka, jnh.org); the **identity/auth surface** + brand + deploy boundary.
- **Identity surface** — one OIDC issuer + its user pool + the apps that trust it. One per domain;
  unfederated by default but OIDC-ready. Sign-in shape: self-hosted **BetterAuth as OIDC issuer**,
  **passkeys-preferred + OAuth fallback**, public marketing routes ungated, registration crosses to
  `app.<domain>`.
- **Real-time supervisor** — the optional voice layer on top of the agent: handles voice I/O + barge-in
  and **dispatches** tasks to `harness`, subscribes to the run's native-SSE stream to narrate +
  adjust, toggle-able mid-run via seq-replay. Coexists with text (default) and baseline STT↔TTS voice.

---

## Sources

The twelve workstreams under `C:\Users\james\dev\docs\research\`:

- `01-projects-audit/report.md` — prior work as input-to-thinking; ranked product intents mapped to the scaffold.
- `02-system-and-tooling/report.md` — package/version managers, the prune policy, the skills-maintenance mechanism.
- `03-dev-systems/report.md` — Multica as the whole system, in-session gates, knowledge-automation tooling.
- `04-secrets/report.md` — the agnostic `secrets` adapter (seam = committed; backend = Bitwarden Secrets Manager free, swappable to SOPS+age/Infisical/Vault; 1Password dropped — REVISED 2026-06-02); per-lane project/machine-account topology.
- `05-templates/report.md` — the System → Org → Project instruction model; workflows-are-skills.
- `06-rebuild-feasibility/report.md` — the three jami.studio foundations + the independent oss domains; open protocol transport + adopted governance.
- `07-brands-funding/report.md` — the lane brand map, funding programs, entity scaffolding.
- `08-canonical-system/report.md` — the layer model, Multica orchestration, the inter-layer contracts + work-record.
- `09-brand-development/report.md` — the hub-and-spoke open-protocol-first brand plane; per-org isolation.
- `10-product-concepts/report.md` — per-product concept briefs; the family composition pattern.
- `11-skills-audit/report.md` — the skills spine (official canon + one community baseline) + the thin-bridge set.
- `12-agent-native/` — the foundation decision: fork agent-native wholesale (`recommendation.md`), plus the
  fact-finding pass that locked the corrected facts (`fact-finding/fact-finding-synthesis.md` — authoritative;
  planner Option A+, two transports, governance SDK, additive natural-named data-model, fork target 0.32.2/0.8.28).
- `13-realtime-voice/recommendation.md` — the real-time voice supervisor-layer architecture: the fitting
  self-hostable OSS stack + realtime model, mapped onto the foundations (dispatch-to-harness, native-SSE
  attach, toggle mid-run); the three coexisting modes.

Canon: `C:\Users\james\dev\docs\research\00-orchestration\plan.md` (§0–§5). Status and log:
`progress.md`, `activity-log.md`.

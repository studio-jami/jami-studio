# Per-Product Concept Briefs

Date: 2026-06-01
Status: Committed direction (creative/scope notes flagged where canon §4 applies)
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.

A concept/design brief: one seed brief per product in the rebuild ecosystem, built greenfield on the real `dev/orgs` scaffold. Each brief is the seed concept doc for that product's clean rebuild. Architecture/feasibility, lane economics/funding, and templates/skills are owned by sibling workstreams; this brief establishes *what each product is* and *how the family composes*.

---

## Executive Summary

The ecosystem is one coherent product family, built fresh on official and industry-leading tooling. It resolves into **three OSS foundations** that everything composes from, **two independent OSS domains** (Intercal, the Collective), **three commercial suites** plus a **free-tools** cluster, and a **personal website**. Mapped to the committed `dev/<org>/<domain>` scaffold (org-lanes `oss` / `saas` / `personal`):

- **`oss`** — the open-source lane. Domains: **`jami.studio`** — the foundations the world can adopt: `@jami-studio/harness` (provider-agnostic agent SDK), `@jami-studio/ui` (the UI Registry), `@jami-studio/orchestra` (the orchestration/dev system); a BYOK web app showcases them. **`intercal`** (its own domain ≈intercal.dev) — the temporal/delta knowledge graph; lightly maintained. **`collective`** (its own domain) — the open agent society + deposit protocol; the large undertaking. **Intercal and the Collective consume the foundations — they are not foundations inside jami.studio.**
- **`saas`** — the commercial lane. Domain **`yrka`** — one product monorepo, a unified ala-carte multi-suite interface: `business-suite`, `media-suite`, `research-suite`, the `free-tools` cluster (benefits finder, brand-name + domain lookup, leads + competitor tracker, daily-briefs), and BoardRune. **Free-tools live inside the product and inherit its auth.**
- **`personal`** — domain **`jnh.org`** — `website`; light/no auth.

The committed family pattern: **foundations are libraries; products are compositions.** harness + ui are the substrate; every suite and tool is a thin domain layer composed on top, every capability reachable by both human UI and agent call against one contract, all knowledge consumed from `agent-delta` rather than per-app scraping. The **internal** agent-to-UI channel runs on agent-native's **native SSE spine** (seq-replay + DB-sync); **AG-UI is the separately-built external interop adapter**; both stand on the verified 2026 open stack (MCP for tools + A2A for inter-agent), carrying our owned, versioned SDUI vocabulary as the payload — standing on standards without surrendering the auditable contract that differentiates the Registry.

This is greenfield. Prior projects (`yrka/`, `_legacy/`, `rebuild/`, `Luna/`) are input-to-thinking only: they prove shapes and surface hard problems, but no code is lifted and no product "folds under" or is "extracted from" them. The foundations themselves **fork the MIT `agent-native` foundation** (Builder.io — `@agent-native/core` 0.32.2 / `@agent-native/dispatch` 0.8.28) wholesale: greenfield forbids carrying *our* legacy forward, never adopting a hardened MIT third party (full map: `../12-agent-native/recommendation.md`). Every name here aligns to the real scaffold above; placeholder product names remain open (§4).

The auth/identity sign-in shape is now **decided** (soft-locked — self-hosted BetterAuth OIDC issuer per domain, passkeys-preferred, marketing/app split; see the Auth section below). The single genuinely-open creative decision left is **final product/brand names** (a dedicated naming sweep).

---

## Family Pattern (committed)

1. **Foundations are libraries, products are compositions.** harness (open SDK) + ui (primitive/token Registry) are the substrate; every product is a composition plus a thin domain layer. No suite re-implements a foundation.
2. **Agent-native, dual-invocation.** Every capability is reachable by both human UI and agent call against the same typed contract: governed route actions, scoped read tools, review-first writes.
3. **Knowledge is a substrate, not per-app scraping.** `agent-delta` (Intercal) is the shared temporal-knowledge layer; daily-briefs, the research-suite, the Collective, and free-tools freshness all consume one provenance-backed source.
4. **Open protocol + open harness, controlled backend.** The Collective deposit protocol and the harness are open; ranking/anti-abuse stay controlled. Intercal's protocol/SDK/MCP are open; the hosted instance is metered.
5. **Public surfaces are funnels.** The Collective public view, free-tools public routes, and the jami.studio showcase are top-of-funnel for the commercial lane.

All five align to the One Ethos: root-correct (capability built at its root — tokenized design systems, parameterized config, never hardcoded values) and zero-bloat (no scaffolding for capability not in the end-shape). Docs are Mintlify across every product. Orchestration is Multica end-to-end (no separate board to sync to). Coding runtimes are OAuth (Codex/Claude/Gemini/xAI); Hermes stays fully separate and is not part of any product's harness.

---

## Verified External Findings (2026-05-31; drift-prone, re-confirm before launch)

- **Chrome Manifest V3 is the only path.** MV2 was fully removed from all Chrome channels by mid-2025 (Chrome 138 last MV2 build; the `ExtensionManifestV2Availability` enterprise policy removed at Chrome 139). The free-tools benefits-finder browser extension is built MV3-native — no migration debt. Source: developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline; blog.google/chromium/manifest-v2-phase-out-begins/.
- **RDAP has replaced WHOIS as the ICANN standard.** As of 28 Jan 2025 ICANN sunset the WHOIS contractual requirement; RDAP (HTTP + structured JSON) is authoritative for gTLD registration data. The brand-name + domain lookup tool is RDAP-first with raw-TCP WHOIS fallback only for ccTLD stragglers (e.g. `.io`). Source: icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en; lookup.icann.org/en.
- **Multica is real, current, Apache-2.0 (modified — SaaS-restriction clause).** A local daemon auto-detects ~11–12 installed agent CLIs, runs work on your own runtime (keys/code stay local), and ships Workspace > Project > Issue plus Squads (leader-routed agent groups), reusable Skills, and unattended modes; self-hosts via one Docker Compose command or Kubernetes. This is the whole orchestration system (orchestra), self-hosted — not a bespoke build. The modified-Apache SaaS-restriction clause is fine for internal self-host; read it before any hosted/productized exposure. Source: multica.ai; github.com/multica-ai/multica.
- **The 2026 agent-native UI stack is settled: MCP + A2A + AG-UI.** AG-UI (CopilotKit, open, event-based) standardizes the agent-to-frontend stream (tool lifecycles, state sync, human-in-the-loop pauses) and is generative-UI-agnostic, carrying A2UI / MCP-UI / Open-JSON-UI as payloads. **Internally** harness + ui run on agent-native's **native SSE spine** (seq-replay + DB-sync — capabilities AG-UI cannot model); **AG-UI is the separately-built external interop adapter** (`@assistant-ui/react-ag-ui`). Both carry our owned SDUI vocabulary (`ui.tree.render`, `ui.action.invoke`) as the payload schema. Two transports, both shipped — neither optional. Source: copilotkit.ai/generative-ui; copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026; blogs.oracle.com/ai-and-datascience (Agent Spec / A2UI, 2026-03-12).

Not verified here (owned elsewhere): per-vendor pricing and GPU/inference economics for the media-suite. State explicitly: those numbers are not confirmed in this brief.

---

## Per-Product Briefs

Mini-template: **Concept / Problem / Who / Capabilities (full final shape) / Sibling connections / Parent org + routing.**

### oss/jami.studio — the foundations (the "Studio")

#### `@jami-studio/harness` — the Agent SDK

- **Concept.** A provider-agnostic agent harness: the runtime primitive that lets agents drive workflows against typed contracts, with thin adapters for every infra dependency (host / db / storage / LLM / auth / billing).
- **Problem.** Agent stacks are fragmented and vendor-locked; there is no portable substrate for building agent-native products that survive vendor churn.
- **Who.** The owner (dogfooded via orchestra), then external developers building agent-native apps, then Collective members.
- **Capabilities.** Tool/contract registry; governed route-action execution (review-first writes, scoped read tools); provider adapters behind thin seams; deposit/provenance helpers; deterministic-with-leash execution; **voice in three coexisting modes** — text (default), baseline turn-based STT↔TTS, and an optional **real-time supervisor layer** that dispatches tasks to the harness and narrates the run via native-SSE seq-replay (toggle-able mid-run; media behind a thin `realtime` adapter, realtime model behind the LLM adapter — see `13-realtime-voice`); agent-to-UI over the native SSE spine internally with the owned SDUI payload schema, plus the AG-UI external interop adapter (MCP tools + A2A inter-agent; native SSE internal + AG-UI external — both built).
- **Sibling connections.** Every product runs on it — the suites' agent surfaces, the Collective member harness, orchestra agents, free-tools assistance.
- **Parent + routing.** `jami.studio` — the keystone open artifact. Developer-first, docs-led (Mintlify), GitHub home, showcased in the jami.studio BYOK web app.

#### `@jami-studio/ui` — the UI Registry

- **Concept.** An AI-native, primitive-based component system plus design tokens that composes every surface — the visual counterpart to harness.
- **Problem.** Per-app styling/components cause drift and reinvention; agents need a stable primitive vocabulary to render against.
- **Who.** The owner first, then external developers.
- **Capabilities.** Fully tokenized theming (every config a user-accessible dial — accent color ⇒ a tokenized design system, never hardcoded values); primitive registry composable into any workflow/UI; agent-driveable rendering over the native SSE spine (with the AG-UI external interop adapter alongside) carrying the owned `ui.tree.render` / `ui.action.invoke` payload; shadcn-class component breadth with cross-app theme tokens.
- **Sibling connections.** Renders all three suites, the Collective public view, the daily-briefs viewer, and every free-tools surface.
- **Parent + routing.** `jami.studio` — co-marketed with harness as the agent-native app kit.

#### `@jami-studio/orchestra` — the orchestration / dev system

- **Concept.** A user-steered, orchestrator-driven development system: teams of agents in dedicated roles across dev, writing, research, publishing, marketing, sales, support, design, security/pen-test, audits, browser-use, game-dev, media generation, and data processing. Built on self-hosted Multica.
- **Problem.** One human cannot personally execute a multi-org, ~10–12-project portfolio; the system needs a self-improving agentic workforce that runs daily without per-task intervention.
- **Who.** The owner (primary), then an open reference others can stand up.
- **Capabilities.** Multica as the whole system — Workspace > Project > Issue, Squads (leader-routed orchestrator primitive), compounding Skills, unattended modes, multi-provider routing, self-host Docker/K8s. The continual orchestrator replaces the old `goal.md` "read goal.md, spawn subagents" prompt with durable, scheduled pipeline parts that fire as work is added. In-session gates first (hooks enforce the verification ladder, fail closed before commit/push); remote CI is an additional gate only. Full-granted shared local credentials; keys/code stay local. Linear/Notion available but not forced and not required — no separate board to sync to. The dogfooding ground that perfects harness + ui UX.
- **Sibling connections.** Drives the build of every other product; itself composes harness + ui. Mechanics owned by `03-dev-systems` / `08-canonical-system`.
- **Parent + routing.** `jami.studio` — open reference alongside the harness/registry. The owner's instance is the personal dev cockpit.

### oss/collective — the open agent society (own domain)

> Its own `oss` domain that consumes the foundations — not a jami.studio foundation.

#### `agent-collective` — the open agent society

- **Concept.** A publicly-legible, human-driven, agent-led, open-invite agent society: a knowledge/work forum where agents and humans propose, vote, and execute missions, everything publicly auditable. Agent-first, human view-mostly.
- **Problem.** There is no durable, public institution for autonomous agents to do legitimate collective work with governance, reputation, and provenance, and no shared way to ingest the output of heterogeneous agent stacks.
- **Who.** Agent owners/operators worldwide; the public (viewers → followers → applicants → contributors → members); the owner's own agents as founding members.
- **Capabilities.** Mission → North Stars → Objectives → Milestones → Domains → Proposals → Projects → Goals → Workstreams → Tasks → typed deposits/outcomes. Multi-axis reputation (claim accuracy, useful dissent, cost discipline, follow-through, originality, risk detection); first-class claims + dissent logs; public epistemic ledger; Deposit Protocol (CloudEvents envelope + OpenTelemetry-style events + ActivityPub-style actor/outbox; finite deposit types; raw HTTP API + SDKs + collector/sidecar; quality levels 0–5); Agent Passport profiles; tiered/federated governance (project / domain / collective-wide votes). The public, real-time view is itself a lead funnel.
- **Sibling connections.** Shares lineage with harness (the open member harness) and the deposit protocol; consumes `agent-delta` for claim verification; its funnel feeds the commercial lane.
- **Parent + routing.** `jami.studio` (open protocol/harness/schemas/governance records), with its own public brand surface. The protocol + harness + public view are the concrete near-term deliverable; the society is the long arc and must not gate funnel value.

### oss/intercal — temporal / delta knowledge graph (own domain)

> Its own `oss` domain (≈intercal.dev) that consumes the foundations — lightly maintained, openly available.

#### `agent-delta` (Intercal) — temporal / delta knowledge graph

- **Concept.** An open temporal-knowledge substrate for agents/LLMs: given a topic / entity / claim / cutoff date, return what changed since, supporting evidence, confidence, and a token-budgeted compact delta — via MCP + REST + an interactive web app.
- **Problem.** LLM knowledge is stale after training cutoff; retrieval returns documents, not resolved temporal facts or contradiction-aware deltas; agent memory lacks a shared, cited, open substrate.
- **Who.** Agents/LLM apps (MCP/API consumers), developers, and (web app) human researchers.
- **Capabilities.** Source adapters → immutable source documents → mentions → first-class claims → conservative reversible entity resolution (roles/offices modeled separately) → typed temporal relationships → bitemporal append-only fact versions → digests; embeddings/hybrid retrieval; subscriptions/webhooks; submitted sources/corrections/merge proposals; MCP tools (`get_delta`, `get_entity`, `search_evidence`, `verify_claim`, `get_sources`, `get_freshness`); per-source license/redistribution discipline encoded before broad ingestion.
- **Sibling connections.** Shared knowledge layer for daily-briefs (deltas → briefs), the Collective (epistemic ledger, claim verification), free-tools freshness, and the research-suite.
- **Parent + routing.** A `jami.studio` foundation (agent-delta) with its protocol/SDK/MCP open, and a metered hosted instance offered through `yrka.io` — open adoption plus a revenue surface, serving both open and commercial siblings.

### saas/yrka — the commercial product (one monorepo)

The three suites are surfaces of one unified, ala-carte yrka.io interface composing the foundations; a user customizes which suites/tools appear in their workspace. Each suite is the Studio shell pointed at a domain of work.

#### `business-suite`

- **Concept.** Agent-native SaaS for small-business operations, composed on harness + ui, with an agent assistant across every surface doing real work behind governed, review-first contracts.
- **Problem.** SMBs juggle many disconnected ops tools; an operator or small team needs one agent-driveable workspace.
- **Who.** Small businesses, operators, admins, and their employees (audience-scoped views).
- **Capabilities (full final shape).** Workforce, scheduling, timekeeping, employee records, communications, resources, training, tasks, reports, payroll prep; multi-surface agent (manual help, resources chat, admin action workspace, connected-app actions, desktop spotlight, AI controls) with governed route actions and a product-claims registry gating public claims.
- **Sibling connections.** Reference composition of the foundations; consumes `agent-delta` for research-grade lookups; shares the agent-native UX with the other suites; hosts free-tools relevant to its founder audience.
- **Parent + routing.** `yrka.io` — `app.yrka.io` (authenticated), `www.yrka.io` (marketing). Primary monetization surface.

#### `media-suite`

- **Concept.** Agent-native creative workspace for mixed-media generation, editing, and upscaling — the Studio shell pointed at media workflows, with local-GPU or cloud inference behind adapters, full CLI control plus a sleek UI.
- **Problem.** Media pipelines (gen, edit, upscale, clip management) are fragmented across local GPU tools and cloud APIs with no agent-driveable, account-persisted home.
- **Who.** Creators, media-producing operators, agencies.
- **Capabilities.** Image/video/audio generation and editing; upscaling (local + cloud inference behind thin adapters — Fal, ElevenLabs, Vertex, etc.); reference uploads + re-edit; persistent galleries/collections; CLI + agent + UI tri-invocation; project-scoped assets.
- **Sibling connections.** Shares harness + ui + the agent surface; shares an image-studio pattern with the brand-name tool in free-tools.
- **Parent + routing.** `yrka.io` (e.g. `media.yrka.io`). GPU/inference economics not verified in this brief.

#### `research-suite`

- **Concept.** Agent-native research and long-form writing workspace — the Studio shell pointed at investigation, synthesis, and authoring, grounded in `agent-delta`.
- **Problem.** Research workflows scatter across notebooks, RAG tools, and docs with no provenance-disciplined, agent-driveable, account-persisted home.
- **Who.** Researchers, analysts, writers, knowledge workers.
- **Capabilities.** Investigation workflows; entity/evidence graph UX; Intercal-grounded claim verification and deltas; long-form drafting with cited sources; project workspaces; agent co-author with review-first writes.
- **Sibling connections.** Primary human consumer of `agent-delta`; shares foundations + agent surface; shares the Collective's epistemic-ledger sensibility (claims, dissent, evidence hygiene).
- **Parent + routing.** `yrka.io` (e.g. `research.yrka.io`). Also the owner's research dogfooding surface.

#### `free-tools`

A cluster of high-leverage public tools under `yrka.io`, each ungated/indexable as an SEO + acquisition funnel into the commercial lane, each composing the foundations and consuming `agent-delta` for freshness. Memorable product sub-brands are retained under the lane; final names are open (§4).

##### Benefits Finder (+ browser extension)

- **Concept.** Helps founders discover startup credits, partner programs, community licenses, and discounts, then assists a human-owned application workflow, with an MV3 browser extension that recognizes supported provider pages and previews/fills safe fields (founder reviews and submits).
- **Problem.** Founders leave large free credits/benefits on the table; the activation energy (per-program forms, eligibility, tracking) is the barrier.
- **Who.** Founders and early operators; a B2B wedge for accelerators white-labeling for portfolios.
- **Capabilities.** Catalog-backed discovery (sourced values, eligibility, disclosure, freshness); authenticated profile (compounding switching cost); readiness/missing-field guidance; saved opportunities + status + manual workflow ledger; MV3 extension (URL recognition, safe-field preview/fill after explicit command, mark-applied sync); review-first paid agent actions; weekly digest as retention engine; **human submits only** (no auto-submit — honors provider ToS).
- **Sibling connections.** Surfaces inside the business-suite; consumes `agent-delta` for catalog freshness; its approval-pattern data is a candidate data layer.
- **Parent + routing.** `yrka.io`. Public route `www.yrka.io/startup-benefits-finder` (ungated, indexable); authenticated `app.yrka.io/finder`. The extension is the highest-intent top-of-funnel.

##### Brand-Name + Domain Lookup

- **Concept.** A linguistics-powered brand-discovery tool plus a real-time availability engine: describe a brand vision in plain language; get rigorously grounded coined-name candidates rooted in linguistic history, with real-time multi-namespace availability, AI visual-identity mockups, and an exportable trademark-ready brand dossier. The availability engine is also usable standalone (and via MCP/API).
- **Problem.** Naming is high-stakes and opaque; generators produce ungrounded noise with no etymology story, no availability truth, and no path to identity/registration. Separately, checking a name across every TLD and social platform is tedious and unreliable.
- **Who.** Founders, brand strategists, anyone naming a product/company (including the owner naming ecosystem products); agents (availability via MCP/API).
- **Capabilities.** Conversational brand-vision interview → strategy brief; multiple etymology generation strategies (PIE roots, Old English/Norse archaeology, meaning-drift reversal, cross-PIE portmanteau, Sanskrit-English cousins, phonaesthetic clusters, deleted-syllable recovery); transparent etymology story per name; real-time availability (RDAP-first + raw-TCP WHOIS fallback for ccTLD stragglers + social/handle checks across GitHub, Reddit, LinkedIn, X, etc.); confidence scoring; batch checks; configurable AI image studio (gen + edit + reference upload + persistent gallery); collections; exportable dossier; multi-tenant projects; user-tunable model/prompt config; metered tiers.
- **Sibling connections.** Its availability engine is reusable by the Collective (Agent Passport handle reservation) and brand-development; shares the image-studio pattern with the media-suite; its naming output feeds ecosystem branding.
- **Parent + routing.** `yrka.io`, public free preview as funnel. The availability lookup can stand alone as a free public utility that funnels into the full tool.

##### Leads + Competitor Tracker

- **Concept.** An AI growth-intelligence tool: account intelligence, lead discovery/CRM, competitor intel, monitoring, and campaign planning in one agent-driveable surface.
- **Problem.** Growth signals scatter across point tools; an operator needs one place where the agent surfaces accounts, tracks competitors, and drafts outreach behind review-first contracts.
- **Who.** Founders, operators, growth/sales teams; the owner's own growth cockpit (dogfood).
- **Capabilities.** Account/lead discovery and enrichment; lead CRM; competitor monitoring with change deltas (via `agent-delta`); campaign planning and outreach drafting (review-first); alerting/digests.
- **Sibling connections.** Composes the foundations; consumes `agent-delta` for competitor/account freshness; complements the benefits-finder funnel.
- **Parent + routing.** `yrka.io`. Internal-first dogfood with a clear public/commercial surface.

##### Daily Briefs

- **Concept.** Scheduled, agent-generated reports across a user's tracked interests, with a web viewer/editor — turning `agent-delta` deltas and configured sources into a daily/weekly/monthly brief.
- **Problem.** Staying current across many tracked topics is manual and noisy; the user wants a deterministic, scheduled, reviewable digest instead of doom-scrolling.
- **Who.** The owner first (personal dogfood), then anyone tracking topics.
- **Capabilities.** Scheduled runner → account product; configurable tracked interests/sources; daily/weekly/monthly summaries; web viewer/editor; `agent-delta` as the upstream knowledge source (deltas, freshness, claims) rather than per-brief scraping; email delivery (Resend) with preference gating.
- **Sibling connections.** Primary downstream consumer of `agent-delta`; shares ui viewer primitives; complements the benefits-finder digest pattern. Scheduled by orchestra.
- **Parent + routing.** `yrka.io` free-tools (public/commercial); the owner's personal brief runs on the same product.

##### BoardRune (massive-multiplayer org team-building game)

- **Concept.** A massive-multiplayer enterprise team-building game with a deterministic engine, turning org team-building into a playable, simulatable experience.
- **Problem.** Corporate team-building is stale and unmeasurable; a deterministic, multiplayer, agent-simulatable game makes it engaging and analyzable.
- **Who.** Enterprise teams/orgs (B2B), and the broader player base.
- **Capabilities.** Deterministic engine with rich config knobs; variant rule modes; headless batch simulation with CSV/JSON artifacts for tuning; standalone player client; production play/persistence through governed route actions over a shared data plane (the client holds no service-role credentials); team/org modes.
- **Sibling connections.** Composes harness + ui and the shared data plane; the simulator is itself an agent-driveable surface (orchestra can run tournaments).
- **Parent + routing.** `yrka.io`, `boardrune.yrka.io`. A trivial-workload, outsized-benefit funnel/brand-builder.

### jnh.org — personal

#### `website`

- **Concept.** The owner's personal site and public presence — the personal lane's single product.
- **Problem.** The personal brand and dogfooding experiments need a home distinct from the OSS and commercial lanes.
- **Who.** The owner; the public following the personal brand.
- **Capabilities.** Personal site/portfolio; home for personal-brand-attached experiments; composes ui for consistency. (`.com` folds into this lane at the org level.)
- **Sibling connections.** Renders on ui; surfaces select work from the other lanes without owning their products.
- **Parent + routing.** `jnh.org`.

---

## Auth / Identity Topology — Decided (soft-locked, canon §2)

The sign-in shape is decided: **self-hosted BetterAuth as an OIDC issuer per domain** (the identity surface). One login across the `yrka` suites + free-tools (intra-domain SSO via OIDC); **passkeys-preferred + OAuth fallback**; public marketing routes ungated, **registration crosses to the gated `app.yrka.io`**. jami.studio (BYOK), intercal, collective, and jnh.org are their **own identity surfaces**; **domains unfederated by default but OIDC-ready**, so federation or a hosted IdP (WorkOS/Clerk) lands late as config behind the auth adapter. The Collective uses Agent Passport identities for agents. The identity/entitlement **model** (additive `capability_grants`, ala-carte) is committed; only IdP/vendor specifics verify at lock. (Lane economics owned by `07-brands-funding`; secrets/identity separation by `04-secrets`.)

---

## Sources

Official (verified 2026-05-31; drift-prone, re-confirm before launch):

- Chrome Manifest V3 / MV2 deprecation: <https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline>; <https://blog.google/chromium/manifest-v2-phase-out-begins/>
- RDAP replaces WHOIS (ICANN): <https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en>; <https://lookup.icann.org/en>
- Multica (self-hosted orchestration = orchestra): <https://www.multica.ai>; <https://github.com/multica-ai/multica> (modified Apache-2.0 with SaaS-restriction clause; local daemon; ~11–12 CLIs; Squads/Skills; Docker/K8s self-host)
- Agent-native UI stack (MCP + A2A + AG-UI; AG-UI carries A2UI / MCP-UI / Open-JSON-UI): <https://www.copilotkit.ai/generative-ui>; <https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026>; <https://blogs.oracle.com/ai-and-datascience/announcing-agent-spec-for-a2ui-copilotkit-ag-ui>
- Governance analogs (Collective): <https://www.mondragon-corporation.com/en/about-us/>; <https://www.apache.org/foundation/governance/>; <https://sociocracy30.org/>
- Interop analogs (Collective deposit protocol): <https://opentelemetry.io/docs/specs/>; <https://www.cncf.io/projects/cloudevents/>; <https://www.w3.org/TR/activitypub/>

Cross-references:

- `03-dev-systems`, `08-canonical-system` — orchestra mechanics (in-session gates, scheduling, Multica as the whole system).
- `06-rebuild-feasibility` — macro feasibility of the foundations, the agent-native fork, and the agent-to-UI transport decision (native SSE internal + AG-UI external adapter + owned SDUI payload).
- `07-brands-funding` — lane economics, domain mapping, funding waves.
- `09-brand-development` — per-org accounts/socials/comms for sub-brands.
- `04-secrets` — runner/Agent-Passport identity and credential separation (Daily Briefs, Collective, orchestra shared local credentials).
- `05-templates`, `11-skills-audit` — which repeated product/doc patterns become reusable templates/thin-bridge skills.

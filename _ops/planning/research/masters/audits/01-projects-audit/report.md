# Prior-Work Inventory & Distilled Intents — Decision Brief

Date: 2026-06-01
Status: Committed direction.
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Scope: A clean inventory of prior work as *input-to-thinking only*, the lessons and product intents worth carrying into the greenfield rebuild, and where each intent lands in the `dev/orgs` scaffold. No code salvage. No keep/fold/retire-the-code plan.

---

## Executive Summary

Prior projects are read as evidence, not inheritance. None of their code, names, directories, or contracts carry forward — the rebuild is authored fresh on official and industry-leading tooling (canon §1). What the old corpus gives us is **proven product intents and hard-won design lessons**, already pressure-tested against real builds, that let the greenfield design skip rediscovery.

The corpus resolves cleanly onto the committed scaffold:

- **`jami.studio` (OSS foundations)** — the agent runtime, the tokenized UI system, the orchestration loop, the collective, and the knowledge-delta graph (Intercal). The richest prior thinking lives here: an agent-runtime spec, a standalone token/component studio, a multi-provider voice bake-off, a working scheduled-agent runner, and a knowledge-delta synthesis pipeline. These are the *design-densest* inputs and the rebuild's critical path.
- **`yrka.io` (commercial SaaS suites + free-tools)** — three proven domain models (business operations, multimedia, research/writing) and three free-tool intents (startup-benefits finder, brand-name + namespace lookup, lead/growth intelligence). The domain models are de-risked by prior prototypes; the rebuild authors them fresh as suites under the unified interface.
- **`jnh.org` (personal)** — a personal-presence site intent (music, art, projects, philosophy) for the `website` project.

Two stale claims in the old master doc are corrected and not carried forward: the "etymara is a mostly-built MVP" claim (it was vision docs + one CLI script, not an app) and the implication that a single-player Godot sandbox is the team-building-game seed (a structurally different concept). Two licensing facts that shaped prior thinking are verified current below (Mole = MIT; Nango = ELv2, source-available — relevant if any third-party dependency is ever reconsidered for the OSS lane).

The output of this workstream is a **ranked set of intents mapped to the scaffold** (below), not a disposition of old repositories. The old `projects/` tree retires slowly on its own (canon §1, "don't break what works"); nothing here edits or migrates it.

---

## Method

Read-only inventory of the prior corpus (`C:\\Users\\james\\projects\\` and its subtrees) plus the prior master docs. For each prior effort: what intent or lesson it demonstrates, how mature that demonstration was (as signal of how de-risked the intent is), and which scaffold home the intent belongs to. Maturity here is a confidence signal about the *idea*, not a code asset to be lifted. Drift-prone external facts (licenses) re-verified against official sources, dated below. Stack/version claims in old project docs are treated as unverified hearsay and are not propagated as fact.

This brief deliberately drops the prior "keep / fold-into / salvage-then-retire / retire" vocabulary: it framed the old code as a source to mine, which the canon forbids. The replacement vocabulary is **intent -> scaffold home -> confidence**.

---

## Ranked Intents (highest-confidence first)

Ranked by how strongly prior work de-risks the intent. "Confidence" = how thoroughly the idea was already exercised. Every build is fresh; prior code is reference-for-thinking only.

### Tier 1 — Foundations (jami.studio), highest-confidence

1. **Governed agent runtime + tokenized UI vocabulary.** The single densest body of prior design thinking: an agent-runtime spec (thin loop, typed artifact contracts, pluggable runtime/tools/memory/workflow/sync, auditable execution, PBAC, a skill-registry concept) and a primitive UI system (tokenized design system, primitive component families, a reusable shell contract). Multiple independent prior instances converged on the same shape — a standalone token/component studio, an agent-workspace desktop app's design system, and the business-ops app's appearance/token surface. That convergence is the signal: the contract set is real and worth authoring fresh as the first foundations. **Scaffold home: `@jami-studio/harness` + `@jami-studio/ui` (UI Registry).** Confidence: very high (design), zero shipped product — the expensive work is authoring the contracts, not discovering them.

2. **Continuous autonomous orchestration loop.** A working scheduled-agent runner (cron-shaped autonomous runs, ledger continuity, fresh-context subagent passes, numeric + judgment close-gates, resumable from repo state, multi-provider model selection) produced real daily outputs over months. This is the proven exemplar of "work continues without human intervention." In the rebuild this intent is **Multica as the whole system** (canon §2): tasks, runtime, scheduling, teams/squads, multi-provider routing, self-hosted — the continual orchestrator that *replaces* `goal.md`. The prior runner is evidence the loop works, not a component to port. **Scaffold home: `@jami-studio/orchestra`** (orchestration foundation under jami.studio; Multica is the engine). Confidence: very high — demonstrated live.

3. **Knowledge-delta graph (Intercal).** Two prior efforts demonstrate the intent: a working knowledge-update pipeline (multi-source adapters -> synthesis -> quality scoring -> tiered token output -> REST API + SDK) and a clean contracts-first monorepo scaffold carrying the Intercal product concept (knowledge-delta graph behind an MCP/API + visual webapp). The product intent — curated knowledge deltas exposed via MCP/API with a visual graph — is well-formed. **Scaffold home: `agent-delta` (Intercal).** Note (corrects a prior mistake): Intercal is an OSS foundation under **jami.studio**, *not* folded under yrka.io. Confidence: high (concept + a working pipeline ancestor).

4. **Public agent collective.** A documented vision for a human-driven, agent-led, public-facing 24/7 collective (multiple cloud agents collaborating on a mission, public view + interaction, agents recruiting agents). Docs-only, but a coherent product spec. **Scaffold home: `agent-collective`.** Confidence: medium-high (well-specified concept, no build).

### Tier 2 — Commercial suites (yrka.io), proven domain models

5. **Business operations suite.** The most mature prior code in the corpus was a business-operations platform (workforce ops: timecards, scheduling, payroll prep, records, comms, admin agent) that went through two full independent iterations. The *domain model* is thoroughly de-risked; so is the engineering discipline around it (planning/report style, code-health gates, RLS + boundary enforcement). The rebuild authors this fresh as a suite. **Scaffold home: `business-suite` (yrka.io).** Confidence: very high (domain), but built fresh on official tooling — no code, package boundary, or schema carries forward.

6. **Multimedia suite.** Two prior efforts demonstrate the lane: a cloud-GPU video-generation control plane (contracts + registry validation + agnostic backend routing + asset manifests + verify-without-compute) and a batch video-upscaling pipeline (multiple processing lanes, resumable batches keyed by content hash + settings). Together they prove an agnostic-adapter + registry + manifest discipline against a real GPU/cloud-inference workload. **Scaffold home: `media-suite` (yrka.io).** Confidence: high (two working prototypes of the same discipline).

7. **Research & writing suite.** A prior AI-assisted research workspace demonstrated the lane: multi-provider router, capability-aware model registry, typed artifact sections with provenance, an approval-first agent, research boards. It maps directly onto a research suite and onto the harness artifact contracts. **Scaffold home: `research-suite` (yrka.io); artifact/provenance patterns inform `@jami-studio/harness`.** Confidence: high.

### Tier 3 — Free tools (yrka.io)

8. **Startup-benefits finder.** A prior client-side app (track free credits / startup programs / community licenses / discounts, local-first then authed-sync) plus a real programs dataset demonstrated the intent end-to-end, including a browser-extension surface. Manifest V3 is the correct extension target (Chrome retired MV2 in 2025 — no migration debt). **Scaffold home: `free-tools` (yrka.io) — startup-benefits finder, with a browser-extension surface.** Confidence: high (working prototype + real dataset as thinking input).

9. **Brand-name + namespace lookup.** A prior effort was rich product thinking, not a built app (corrects the old "mostly-built MVP" claim): a linguistics-powered brand-discovery concept (semantic vision -> etymology-grounded coined names -> multi-namespace availability via RDAP -> AI identity mockups -> brand dossier) plus a namespace-checker CLI. The vision and the RDAP/namespace-availability approach are the valuable inputs. **Scaffold home: `free-tools` (yrka.io) — brand-name creator + domain/namespace lookup.** Confidence: medium-high (concept), low (build).

10. **Lead / growth intelligence.** A prior AI-native lead-discovery + scoring + enrichment + outreach pipeline (ICP/parameter model, social signals, outreach drafting) demonstrated the intent. In the rebuild this is a growth/lead-intelligence free tool and an Orchestra-adjacent capability. **Scaffold home: `free-tools` (yrka.io) — lead/competitor finder; pipeline patterns inform `@jami-studio/orchestra`.** Confidence: medium-high (working prototype).

11. **Team-building game.** A prior single-player Godot sandbox is *not* the seed of this intent — the intent is a multiplayer/enterprise team-building game, structurally different. A separate prior effort demonstrated a deterministic, simulated game engine that fits the team-building concept far better. The valuable transferable lesson from the Godot work is validation-harness discipline, not the game. **Scaffold home: `business-suite` or a dedicated `yrka.io` product (creative/scope — see Open).** Confidence: medium (concept clear; correct prior seed identified).

### Tier 4 — Personal (jnh.org)

12. **Personal presence site.** A prior personal site (music, art/clips gallery, projects showcase, philosophy) demonstrates the personal-lane intent and media-handling patterns. **Scaffold home: `website` (jnh.org).** Note (corrects a prior mistake): the personal lane is **jnh.org** (the `.com` folds in here), not a separately-tracked domain. Confidence: high (built prior site as content + pattern reference).

---

## Distilled Lessons (carried as thinking, not code)

- **Adapter/registry/contract-validation discipline** repeatedly proved its value across the multimedia and business-ops prototypes. The rebuild bakes this in as the agnostic-adapter posture (canon §1): host, db, storage, LLM, auth, billing, runtime behind thin adapters from day one.
- **Resumable, content-hash-keyed batch processing** (from the upscaling prototype) is the right shape for any long-running media/agent job — resume from state, never restart.
- **Approval-first agent UX + typed artifacts with provenance** (from the research workspace) is the right default for agent surfaces where output feeds downstream decisions — and aligns with the harness's auditable-execution contract.
- **Ledger-continuity + fresh-context subagent passes + numeric-and-judgment close-gates** (from the daily-brief runner) is the proven autonomous-loop shape, now realized through Multica rather than a bespoke runner.
- **Ephemeral-token / browser-never-holds-credential** security (proven in the voice bake-off against three providers) is the correct pattern for any browser-side agent surface.
- **Local-first -> authed-sync** (from the benefits-finder prototype) is the right data shape for free tools used signed-out and signed-in.
- **No bespoke tooling for solved problems.** Several prior efforts hand-rolled changelog, scheduling, and provider-bridge utilities. The rebuild uses official/industry-leading OSS instead (canon §1): Mintlify for docs, evaluated best-in-class tools for changelog/system-mapping/testing/browser-automation, OAuth coding runtimes (Codex/Claude/Gemini/xAI). Hermes stays fully separate from the dev system (canon §2).

---

## Verified External Facts (2026-06-01)

- **Mole — MIT.** Third-party Windows cleanup TUI (port of `tw93/mole`), MIT-licensed (verified at github.com/tw93/Mole). A downloaded tool, never an IP input; recorded only because prior docs referenced it.
- **Nango — Elastic License v2 (source-available, not OSI-open-source)** (verified at github.com/NangoHQ/nango). ELv2 forbids offering Nango as a managed service to third parties. Relevant *only* if any third-party integration dependency is ever reconsidered for the `jami.studio` OSS lane; the rebuild does not commit to Nango. Recorded as a license caveat, not a dependency decision.

Could not verify: stack/version claims in prior project docs (framework versions, vendor-feature specifics) were not independently confirmed and are not propagated as fact. Vendor/tooling/pricing verification for the rebuild proper is owned by the system-tooling and feasibility workstreams.

---

## Open (creative / scope)

Per canon §4, only these remain genuinely open; everything else is committed above.

- **Team-building-game home and shape.** Whether it sits inside `business-suite` or stands as its own `yrka.io` product, and its exact multiplayer/enterprise shape, is a creative/scope call. Default toward the end-shape multiplayer concept; the prior deterministic-engine work is the better thinking input than the single-player sandbox.
- **Free-tool product names.** "Benefits finder," "brand-name creator," etc. are placeholder labels. Final product/brand names are an open creative decision (canon §4), assessed against strategy — not inherited from prior projects.

---

## Sources

Prior corpus (read-only, input-to-thinking only): the prior `projects/` tree and its subtrees, and the prior master docs (`Projects.md`, the prior Rebuild doc, the two agent-primitives stack/direction reports). Read for intent and lessons; no code, name, or structure carried forward.

Canon: `C:\\Users\\james\\dev\\docs\\research\\00-orchestration\\plan.md` (§0–§5).

External (verified 2026-06-01):
- Mole license = MIT — https://github.com/tw93/Mole
- Nango license = Elastic License v2 (source-available, not OSI-open-source) — https://github.com/NangoHQ/nango

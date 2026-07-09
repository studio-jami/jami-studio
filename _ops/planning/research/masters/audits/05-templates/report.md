# Template Model: System → Org → Project — Design Brief

Date: 2026-06-01
Status: Committed direction (per Operating Canon §2; greenfield)
Owner: Jamie (jamie@yrka.io) — one human, many agents.

---

## Executive Summary

We author a **three-tier instruction model — system → org → project — built fresh**,
not extracted from any prior repo. Each tier owns exactly one concern, and the tiers
inherit downward:

- **System (`C:\Users\james\dev`)** — the durable, identical-everywhere engineering
  canon and the canonical document **templates**: `AGENTS.md`, planning style, report
  style, doc-style guide, glossary. This is the "way of working," authored once,
  changed rarely, never per-project. It carries no vendor, account, or stack detail.
- **Org (`dev/orgs/<domain>/AGENTS.md`)** — the configuration tier: vendors, accounts,
  home-directory layout, brand, identity/secret lanes, per-domain defaults. One file
  per domain (`jami.studio`, `yrka.io`, `jnh.org`). Lane-specific reality lives here;
  it never leaks into the system canon.
- **Project (`<org>/projects/<repo>/AGENTS.md`)** — the thin leaf: a succinct list of
  preferred dev principles, the expected order of work, project-specific
  nuances/pitfalls, and recurring agent mistakes for *that* repo. Transient by nature.

**A glossary lives at each tier** (system / org / project) so terms stay consistent
across the family; project glossaries refine, never contradict, the system glossary.

**Reusable workflows are SKILLS, not documents.** Anything that repeats identically
across projects — how to plan, how to report, how to verify, how to close out, the
orchestration loop — ships as one of the **tiny thin-bridge orchestration skills**
authored once and inherited everywhere. **If an official/community-canon skill already
does it as well or better, we adopt that and ship nothing of our own.** No reusable
"workflow doc" is duplicated into N repos.

**`CLAUDE.md` is a one-line pointer to `AGENTS.md`** in every repo. Orchestration is
**Multica** (canon §2) — the durable, scheduled pipeline that replaces `goal.md`;
there is no separate `goal.md` template and no board to sync to.

Drift-prone facts verified against official 2026 sources (dated below): the agents.md
open standard (no required fields, nearest-file-wins, explicit chat overrides all) and
the `SKILL.md` frontmatter contract (`name` + `description` required, with the current
length/format validation rules).

---

## The Committed Model

### Why three tiers, and why these three

First principles: an instruction has exactly one correct *altitude* — universal to all
our work (system), specific to a domain's accounts/brand (org), or specific to one
repo's reality (project). Collapsing tiers is the failure mode that produces
unmaintainable instruction files: durable principle tangled with transient command,
edited in a dozen places, drifting apart. Splitting by altitude means each fact is
authored once, at the tier that owns it, and inherited by everything below.

The agents.md standard makes this mechanically clean: the **nearest `AGENTS.md` to the
edited file wins**, and an **explicit chat instruction overrides everything**
(agents.md FAQ, verified 2026-06-01). So a project `AGENTS.md` naturally refines the
org one, which refines the system canon — no custom precedence engine, no imports to
manage. Precedence is stated once in the system template header.

### System tier — durable canon + templates

Lives at `dev/docs/` (system root). Contents, all tech-agnostic with **no** vendor
names, commands, file-size numbers, or module names baked in:

- **`AGENTS.md` template** — the durable spine every repo inherits: source-of-truth
  read order, work boundaries (greenfield, no destructive git, no branch unless asked),
  local workflow, secrets posture (by reference to the org lane table), quality bar,
  docs discipline, verification method, closeout. Draft below.
- **Planning style** and **report style** — canonical shapes for plans and reports.
- **Doc-style guide** — what each doc type is for, where it lives, the stable-vs-dated
  linking rule, promotion/retirement.
- **System glossary** — the shared vocabulary for the whole family.

The system canon is **changed rarely and never per-project** — the single "way of
working" the One Ethos and Hard Rules (canon §0–§1) describe.

### Org tier — configuration per domain

One `AGENTS.md` per domain under `dev/orgs/<domain>/`, aligned to the real scaffold
(canon §2):

- **`jami.studio`** — OSS "Studio" foundations: `@jami-studio/harness`, `@jami-studio/ui`,
  `@jami-studio/orchestra`, `agent-collective`, `agent-delta` (Intercal).
- **`yrka.io`** — commercial SaaS: `business-suite`, `media-suite`, `research-suite`,
  `free-tools`.
- **`jnh.org`** — personal: `website`.

The org `AGENTS.md` carries what is true for that domain and not the others: vendor
choices, account/secret lanes (operator vs runtime vs scheduled/automation), home-dir
conventions, brand, and any org-default that overrides a system default. It is the home
for lane/identity/vendor policy — the **configuration** tier, distinct from the
rarely-touched system canon. An org glossary captures domain-specific terms.

### Project tier — the thin leaf

One `AGENTS.md` per repo under `<org>/projects/<repo>/`. Per canon §2 it carries,
succinctly:

- **Preferred dev principles** for this repo (the few that matter here).
- **Expected order of work** for this repo's typical change.
- **Project nuances / pitfalls** — what's load-bearing, what breaks easily.
- **Recurring agent mistakes** — a short, dated "don't do this here" list (the
  war-story rung; an agent's accumulated, dated findings for this repo).
- **The verification rungs (actual commands)** for this stack — the one place
  stack-local commands belong, because an agent needs them unconditionally at session
  start and a description-gated skill might not load.

Project content is transient and **never flows up**. A project glossary refines the
system/org glossaries for local terms.

### CLAUDE.md

A one-line pointer to `AGENTS.md` in every repo (agents.md is the universal file; Claude
reads `CLAUDE.md` and follows the pointer). No ruleset is ever duplicated into it.

---

## Reusable Workflows Are Skills

The hard rule (canon §1, §Skills): **official canon everywhere; we maintain almost
nothing.** Applied here:

- **Workflows that repeat identically across projects become thin-bridge orchestration
  skills**, authored once: a plan skill, a report skill, a verification-method skill, a
  closeout skill, a doc-hygiene skill. Each is a small, deterministic, repeatable
  "do exactly this, then this" bridge — the no-nonsense flow encoded once.
- **If a shipped official skill already covers the workflow as well or better, we use it
  and ship nothing of our own there.** We do not author a competing skill out of habit.
- **Orchestration is Multica, not a `goal.md` skill.** The "read goal.md, spawn
  subagents" loop becomes Multica's durable, scheduled pipeline (canon §2). We carry no
  `goal.md` template; the orchestration *contract* (what a dispatched unit of work must
  do) is expressed by the system `AGENTS.md` spine + the verification skill, and driven
  by Multica.
- **Skills are for procedures; `AGENTS.md` is for identity + invariants.** Repo-identity
  facts (the project leaf, verification commands, the recurring-mistakes list) stay in
  `AGENTS.md` because an agent needs them unconditionally — never gated behind a skill
  description that might not match.

`SKILL.md` mechanics (official, verified 2026-06-01): a skill is a directory whose
`SKILL.md` YAML frontmatter requires `name` (≤64 chars, lowercase/numbers/hyphens) and
`description` (≤1024 chars); the description drives on-demand loading via progressive
disclosure (Claude reads only name + description at startup and loads the body on a
match). This is exactly why repeatable workflow prose belongs in skills, not permanently
resident in every `AGENTS.md`.

---

## Template Drafts

> Tech-agnostic. No vendor names, commands, file-size numbers, or module names in the
> durable body. `{{PLACEHOLDERS}}` mark fill-ins.

### 1) System `AGENTS.md` spine (inherited by every repo)

```markdown
# {{REPO_NAME}} — Agent Guide

The universal instruction file for any agent in this repo. Read it first, then the
org `AGENTS.md`, then this repo's Project block, then the active work. Precedence:
the nearest `AGENTS.md` to the edited file wins; an explicit user instruction
overrides everything; the org and system tiers are inherited defaults unless a nearer
tier overrides them.

## What This Repo Is
{{One paragraph: purpose and end-state product shape.}}

## Source Of Truth
- Read the active work and relevant durable docs before changing code.
- Live code, tests, contracts, schemas, scripts, and docs outrank stale notes.
- Search the repo before assuming; prefer fast structured search.
- Verify drift-prone facts (versions, APIs, models, pricing, licensing) against
  official sources before locking them into code or durable docs; date them.
- Never hardcode transient details into durable docs.

## Work Boundaries
- Stay scoped to the requested work and its real dependencies.
- Preserve unrelated user changes; leave dirty/untracked files outside the task alone.
- No destructive git (`reset --hard`, `checkout --`, force-push, history rewrite)
  unless explicitly requested.
- Never create, switch, or publish a branch unless explicitly asked.
- If a code-owned issue blocks completion, fix it — don't log it as external.

## Local Workflow
- {{Shell + OS convention.}}
- Identify the owning files, contracts, tests, and docs before editing. Implement the
  owning system, not a sibling workaround.
- After editing, run the narrowest meaningful gate first, then climb.

## Secrets & Safety
- Never commit secrets; never write tokens/DSNs/private URLs into code, fixtures,
  logs, UI, docs, or exported artifacts. Redact them from errors and reports.
- Keep account/secret lanes separate per the org lane table.
- Fail closed when auth, license, or cost boundaries are unclear.

## Quality Bar
- No shims, broad compatibility barrels, hidden cross-module deps, or duplicate
  contract shapes to save time.
- Shared request/response/state/error shapes get runtime validation and tests.
- No mocks, placeholders, or demo data in shipped code (fixtures belong under tests).
- Test only where system health is genuinely at risk; no tests for trivial UI surface
  changes or trivial events with no system effect.

## Docs Discipline
- Keep durable docs concise and stable. Active steps live in roadmaps, not here.
- Stable/orientation docs link durable directories or canonical docs — never a dated
  artifact-lifecycle file. Link the parent directory.
- Promote lasting rules from completed work into durable docs; retire dated artifacts.
- Never hide open decisions in prose.

## Verification
Run the narrowest gate that proves the change, then climb. The rungs (commands) for
this repo live in the Project block. Don't run an aggregate when individual checks
already cover the change.

## Closeout
- Run the gates the change requires; report what ran and the result.
- Stop any process you started in the session.
- Stage only the intentional change set; conventional commit; push to upstream — or
  state precisely why not.

---

## Project Block
> The only place stack/tooling/transient detail belongs. Prefer linking durable docs
> over inlining long lists.

- Preferred dev principles (this repo): {{the few that matter here}}
- Expected order of work: {{the typical change sequence}}
- Nuances / pitfalls: {{load-bearing seams; what breaks easily}}
- Recurring agent mistakes (dated): {{short "don't do this here" list}}
- Verification rungs (commands): {{ordered list of actual commands}}
- Glossary (local terms): {{terms refining the org/system glossary}}
```

### 2) Org `AGENTS.md` (per domain)

```markdown
# {{DOMAIN}} — Org Guide

Configuration tier for this domain. Inherits the system canon; overrides only where
this domain genuinely differs. Project `AGENTS.md` files under `projects/` refine this.

## Vendors & Tooling
{{Host, db, storage, billing, email, docs — for this domain, behind thin adapters.}}

## Accounts & Secret Lanes
{{Table: lane (operator/dev vs app runtime vs scheduled/automation) -> what it holds.}}

## Home-Directory Layout
{{Where docs/{brand,research,roadmaps} and projects/ sit for this domain.}}

## Brand
{{Brand presence, per-org isolated accounts, open-protocol-first posture.}}

## Org Defaults (override system where stated)
{{Only the defaults that differ from the system canon.}}

## Glossary (domain terms)
{{Domain-specific vocabulary.}}
```

### 3) `CLAUDE.md` (per repo)

```markdown
See [AGENTS.md](./AGENTS.md).
```

### 4) Planning style & report style

Authored fresh as system-tier canon docs (this brief follows the report style). Each is
wrapped by one thin-bridge skill whose body is "read the {style} doc, then produce the
artifact in that shape" — only if no official skill already does it better.

### 5) Doc-style guide (system tier)

```markdown
# Documentation Style Guide

## Doc types and where they live
- AGENTS.md / CLAUDE.md — agent instructions. System spine + org config + project leaf.
- Durable engineering/architecture/operations/security docs — stable contracts.
- Roadmaps — active, dated; retire when complete.
- Reports (research/feasibility) — dated; retire when consumed.

## Linking rules
- Stable/orientation docs link durable directories or canonical docs only.
- Never link a dated artifact-lifecycle file from a stable doc — link the parent dir.

## Promotion / retirement
- Promote lasting rules from completed work into durable docs; retire consumed artifacts.

## Writing rules
- Ideal/end-state only in specs and architecture (no "current vs target", no "(planned)").
- Direct answer / executive summary first in reports.
- No open decisions hidden in prose.
- Concise, evidence-backed, official sources cited; date drift-prone facts.

## Glossaries
- One per tier (system / org / project). Lower tiers refine, never contradict, higher.
```

---

## Open (creative / scope)

Per canon §4, the only genuinely-open item touching this model:

- **Directory arrangement of the org/project tiers may shift for deployment or auth
  reasons** (canon §4). The three-tier *ownership* model (system → org → project) and
  the glossary-per-tier rule are committed; the exact on-disk arrangement of
  `orgs/<domain>/projects/<repo>` can adjust if deployment or the auth topology demands
  it. This changes no template body — only where each file physically sits.

No other decision here is open; everything else defaults to the committed answer above.

---

## Sources

Official / external (verified 2026-06-01):

- agents.md open standard — no required fields, nearest-`AGENTS.md`-wins, explicit chat
  prompts override everything; layering via global/repo/subdir files. <https://agents.md>
- Claude Code / Agent Skills authoring — `SKILL.md` frontmatter requires `name`
  (≤64 chars, lowercase letters/numbers/hyphens) and `description` (≤1024 chars);
  progressive disclosure loads the body on description match.
  <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices>

Canon:

- `..\00-orchestration\plan.md` — Operating Canon (§0 ethos, §1 hard rules, §2 committed
  decisions incl. dev/orgs scaffold + Multica + skills posture, §4 open items, §5 refresh
  directive).

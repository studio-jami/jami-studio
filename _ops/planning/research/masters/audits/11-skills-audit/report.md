# Skills Strategy — The Spine + Our Thin-Bridge Set

Date: 2026-06-01
Status: Committed direction
Owner: Jamie (jamie@yrka.io) — one human, many agents

---

## Executive Summary

The committed answer: **official canon is the spine, we maintain almost nothing, and our own
skills are a tiny thin-bridge orchestration set.** There are exactly two trust tiers and no
third option:

1. **Official canon set (we never edit or upkeep).** Vendor official skills — gcloud, azure,
   cloudflare, vercel, supabase, neon, stripe, resend, mintlify, and peers — **plus one**
   trusted community baseline chosen on merit. These track their upstream; we pin and pull,
   we never patch.
2. **Our thin-bridge set (the only thing we author and maintain, kept deliberately tiny).**
   A handful of goal.md-style orchestration skills that say "do exactly this, then this,
   then repeat." They encode our no-nonsense, deterministic, repeatable flow and nothing
   more. Where a shipped official skill already does a job as well or better, we ship nothing
   of our own for it.

The spec underneath is settled and portable (verified 2026-06-01): a skill is a folder + a
SKILL.md (YAML frontmatter name + description, then Markdown instructions), progressively
disclosed, read identically by Claude Code, Codex, Gemini CLI, GitHub Copilot, Cursor and 30+
other clients off agentskills.io. Authoring once on this spec works across every OAuth coding
runtime Jamie runs (Codex, Claude, Gemini, xAI) with no per-runtime rewrite.

This report owns the **spine choice** and the **shape of our thin-bridge set**. The
**mechanism** for pulling and pinning vendor skills (package manager, shared skills home,
fan-out) is ws02's. The current sprawl across reference checkouts is inventoried below strictly
as input — none of it is a source to extract from or maintain.

---

## Why this is the only correct shape

First principles, both edges of the ethos:

- **Root-correct.** The root capability is "hold thousands of one-shot agent sessions to a
  predictable shape across many runtimes." The spec already solves portability and triggering;
  the vendors already solve their own tooling correctly and update it on release. The only
  thing no one ships for us is *our specific deterministic flow* — so that, and only that, is
  what we author.
- **Zero-bloat.** Authoring a 20-skill house catalog, harvesting bodies from other libraries,
  and running a perpetual prune/compliance loop is weight uncorrelated to capability. It
  manufactures exactly the maintenance, drift, and stale-assumption burden the canon forbids.
  A shortcut past all of it is therefore mandatory, not optional: rely on official canon
  everywhere, own a tiny bridge set.

A house catalog that duplicates planning, research, review, design, debugging, and docs skills
that vendors and the community already ship is the failure mode, not the goal. We do not
recreate solved work under our own name.

---

## The spine: official canon set

### Vendor official skills — used as shipped, pinned, never edited

The vendor layer is whatever the providers in our stack officially publish: gcloud, azure,
cloudflare, vercel, supabase, neon, stripe, resend, mintlify, and their peers. They track their
own releases; we consume them at a pinned version and pull updates. We do not fork, patch, or
re-document them. If a vendor ships no skill, that gap is a ws02 mechanism question, not a
prompt to author bespoke vendor docs here.

### One trusted community baseline — chosen on merit

We adopt **one** community baseline alongside the vendor skills, selected against a single
explicit bar:

> Does it provide **deterministic, repeatable workflows that hold one-shot sessions to a
> predictable shape**, at a quality that **matches or exceeds our own dev style** — and can we
> consume it without ever editing it?

Candidates evaluated against that bar:

- **ECC** (~246 skills + 76 commands). Rich and SKILL.md-shaped, but it is a sprawling mixed
  catalog (workflow + per-vendor + per-language + domain verticals) of uneven trust, and
  several of its workflow skills assume ECC's own infra (orchestrate, hookify, instinct,
  council) — i.e. it couples us to ECC conventions and would not be consumed cleanly without
  pruning. Pruning is editing. That fails the never-edit bar as a *whole-catalog* spine,
  though individual patterns are useful reference.
- **awesome-claude-skills lists** (ComposioHQ/VoltAgent/travisvn/Chat2AnyLLM, 1k–~10k indexed).
  Discovery surfaces, not trust sources; quality and security vary wildly and contents drift
  daily. Not a baseline we can pin and trust unedited.
- **Anthropic-shipped skills** (anthropics/skills: skill-creator, mcp-builder, the
  source-available document skills docx/pdf/pptx/xlsx). Authoritative, actively maintained,
  high quality, consumed as-is with zero upkeep. This is the strongest fit for the
  never-edit-never-maintain bar.

**Committed:** the community baseline is **Anthropic's official anthropics/skills set**,
consumed as shipped (skill-creator + the document skills are the immediate wins). ECC and the
awesome-lists remain *reference for our own thin-bridge authoring* only — read for ideas, never
imported, never maintained. This keeps a single high-trust upstream and zero pruning burden.

> Open (creative/scope): if a different single community baseline later demonstrably beats
> anthropics/skills on the determinism/quality bar above *and* is equally consumable
> unedited, it can replace it. The bar is fixed; the winning library is the only variable, and
> the default is Anthropic's set.

---

## Our thin-bridge set (the only thing we author and maintain)

These are tiny orchestration bridges, not reimplementations of vendor or community skills.
Each is a short, deterministic goal.md-style script — "do exactly this, then this, then
repeat" — encoding our flow with little room for drift or interpretation. They are authored to
the official SKILL.md spec so every runtime reads them, and they live in the shared skills
home ws02 stands up.

Committed bridge set, stated as final shape:

- **orchestrate** — the durable driver of agentic work: read the active workspace, spawn the
  ordered steps, repeat. This is the skill expression of Multica-as-the-whole-system; it
  replaces the old goal.md "read goal.md, spawn subagents" prompt with a deterministic,
  repeatable bridge. No separate board to sync to.
- **plan** — our specific decomposition flow (ordered workstreams, closing criteria), only as
  a thin bridge over how *we* sequence work. If a shipped official planning skill fits our flow
  as well or better, we adopt it and ship nothing here.
- **report** — our specific decision/design-brief shape (committed-answer-first, lean, no
  menus), only to the extent no shipped skill already produces it. Likely a thin bridge or
  nothing at all.

That is the whole set we commit to today: an orchestration driver plus, at most, two thin flow
bridges — and even those collapse to nothing wherever an official skill already fits better. We
do **not** pre-author a 15–20 skill catalog; doing so is the manufactured-maintenance trap.
Anything beyond orchestrate is added only when a real recurring flow has no good official
equivalent, and added as the thinnest possible bridge.

For everything else — code review, debugging, testing, design/UI, docs/changelog, security
review, skill authoring, document generation — we use the official/community canon directly and
maintain nothing.

---

## Current sprawl (inventory — input only, not a source to mine)

This is what exists across the machine today, recorded so we know what we are *replacing*, not
what we are extracting from. Greenfield: none of these is precedent or code source.

| Library | Location | Count (approx) | Nature |
| --- | --- | --- | --- |
| Anthropic official + Cowork role packs | live catalog / claude-plugins-official | 300+ | Business-function workflow + meta |
| Google google/skills | ~/.claude/skills, references/skills | 22 | Vendor (GCP, Firebase, BigQuery, Vertex) |
| ECC | references/ECC/skills | 246 + 76 commands | Mixed: workflow, vendor, per-language, domain |
| Hermes | Luna/hermes/skills | ~60 leaf | Mixed (Hermes is fully separate — not in scope) |
| Vercel plugin | ~/.claude/plugins/.../vercel | ~30 | Vendor (Next.js, AI SDK, deploy, storage) |
| Codex | ~/.codex/skills | 6 | Vendor/media + runtime |
| Grok | ~/.grok/skills + ~/.grok/bundled | 7 + 6 skills, 9 roles, 3 agents | Mixed workflow + meta + document |
| Tavily | ~/.claude/skills (symlink) | 8 | Vendor mechanics (research primitive) |
| awesome-claude-skills (Composio clone) | references/awesome-claude-skills | ~30 | Community sampler |

The pattern is well over 500 definitions across seven-plus competing libraries, with the same
workflows (research, code review, debugging, planning, design, skill authoring) implemented
3–6 times at different depths and quality bars. That redundancy is precisely why we do **not**
build a house catalog: the world already over-supplies these. We pick the official canon for
them and stop.

**Hermes note:** Hermes' skill tree (Luna/hermes/skills) is listed for completeness only.
Hermes stays fully separate per canon — its runtimes, skills, and configs are not part of the
dev system and are not mixed into this strategy.

---

## Official / external findings (verified 2026-06-01)

- **Spec is settled and portable.** A skill = folder + SKILL.md; required frontmatter is
  name (lowercase-hyphen) and description (what + when — drives triggering); body is
  Markdown with optional bundled scripts/, references/, templates/. Progressive
  disclosure: only name+description load until a task matches. (anthropics/skills,
  agentskills.io — verified.)
- **description is the load-bearing field.** Triggering is governed almost entirely by the
  description; this is why our thin bridges must have crisp, unambiguous descriptions, and why
  skill-creator (shipped, used as-is) exists to optimize them. (Verified.)
- **Cross-runtime portability is real and broad.** agentskills.io lists 32+ adopters as of
  March 2026 — Claude Code, Codex CLI, Gemini CLI, GitHub Copilot/VS Code, Cursor, plus Goose,
  Amp, Junie, Cline, OpenCode and more — all reading the same SKILL.md from the same layout.
  This directly covers Jamie's OAuth coding runtimes (Codex, Claude, Gemini, xAI): author once,
  run everywhere, no per-runtime rewrite. (Adoption list verified; per-client behavior not
  individually exercised.)
- **Official repo is authoritative and active.** anthropics/skills ships skill-creator,
  mcp-builder, and source-available document skills (docx/pdf/pptx/xlsx) — the basis for our
  zero-maintenance community baseline. (Verified.)
- **Standardization timeline.** Spec published 2025-12-18; within 48h adopted by VS Code and
  OpenAI Codex; 32+ tools by March 2026. (Verified.)

**Drift note:** community-list counts and contents change daily and are discovery surfaces, not
trust sources. The SKILL.md spec itself has been stable since publication and is the safe
thing to standardize on. Not verified (would require a build pass, out of scope): per-skill
triggering-accuracy benchmarks and line-by-line reads of the full ECC/community catalogs —
unnecessary, since we adopt official canon rather than curate those catalogs.

---

## Ownership boundary with ws02

- **ws11 (this report) owns:** the spine choice (official canon set + one community baseline =
  anthropics/skills) and the shape of our thin-bridge set (orchestrate + at most plan/report).
- **ws02 owns the mechanism:** how vendor + community skills are pulled, pinned, fanned out to
  each runtime, and kept current, and where the shared skills home lives. ws11 supplies the
  *what*; ws02 supplies the *how*.

No overlap: ws11 never specifies the package-manager/sync mechanism; ws02 never authors skill
bodies or picks the spine.

---

## Open (creative / scope)

- **Community baseline swap.** The bar (deterministic, repeatable, holds session shape,
  matches/exceeds our style, consumable unedited) is fixed and the default is
  anthropics/skills; the only open variable is whether a future library demonstrably beats it
  on that bar. This is a merit re-evaluation, not an option menu.

Everything else here is committed.

---

## Sources

Local (read, not modified — inventory input only):

- C:\Users\james\.claude\skills, C:\Users\james\.claude\plugins\{installed_plugins.json, marketplaces\claude-plugins-official, marketplaces\vercel}
- C:\Users\james\.codex\skills, C:\Users\james\.codex\rules\default.rules
- C:\Users\james\.grok\skills, C:\Users\james\.grok\bundled\{skills,roles,agents} (Hermes-adjacent — out of scope)
- C:\Users\james\projects\references\ECC\skills (246), ECC\commands (76)
- C:\Users\james\projects\references\skills (= google/skills), references\awesome-claude-skills
- C:\Users\james\projects\Luna\hermes\skills (Hermes — separate, out of scope)
- Live environment skill catalog (system reminder)

Official / external (verified 2026-06-01):

- https://github.com/anthropics/skills — official repo: skill-creator, mcp-builder, source-available document skills
- https://agentskills.io and https://agentskills.io/specification — open-standard home + spec
- https://github.com/agentskills/agentskills — spec repo (community-governed)
- https://developers.openai.com/codex/skills — Codex SKILL.md support
- https://code.visualstudio.com/docs/copilot/customization/agent-skills — Copilot/VS Code support
- Adoption/timeline corroboration: thenewstack.io, paperclipped.de (32-tool interoperability, 2025-12-18 publication)

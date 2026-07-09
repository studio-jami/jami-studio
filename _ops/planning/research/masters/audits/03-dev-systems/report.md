# Dev Systems — Orchestration, Gates, Knowledge Automation

Date: 2026-06-01
Status: Committed direction (per Operating Canon §2/§5). Greenfield design brief, not a feasibility survey.
Owner: Jamie (jamie@yrka.io) — one human, many agents.

---

## Executive Summary

The dev system is **Multica, self-hosted, as the whole system** — tasks, runtime,
orgs, scheduling, squads, and multi-provider routing in one self-hosted platform.
There is **no separate board to sync to** and **no sync layer to build**. The
continual Multica orchestrator **replaces `goal.md`**: the old "read goal.md, spawn
subagents" prompt becomes durable, scheduled pipeline parts (Autopilots) that run as
work is added to the workspace. Work is a Multica issue; agents are members of the
workspace; the local daemon claims an issue, runs the right OAuth coding CLI in
isolated context, and reports progress back — natively, no glue.

Quality is enforced **in-session, fail-closed, before any remote**. Deterministic
hooks run the verification ladder (format, code-health, lint, typecheck, test where
system health is at risk, boundaries, docs-hygiene, changelog-check) at the tool
boundary; nothing that fails local gates can reach the remote. Remote CI is an
*additional* confirmation gate only.

Solved problems use industry-leading OSS/free, agent-friendly tooling, never bespoke:
**CodeGraph** for system mapping/graphing (local MCP code knowledge graph),
changelog-fragment pipeline for changelog, **Mintlify** for docs, and a browser-
automation pair — **Playwright MCP** for driving/E2E and **chrome-devtools-mcp** for
debugging/perf — chosen on merit over the canon's spitball candidates. Multica's
built-in **skill-compounding** is the self-improving loop: successful solutions are
distilled into reusable skills, promoted only behind a human review gate.

Linear and Notion are **available, not required**. Neither is in the critical path.
Multica is the system of record. Hermes is fully separate from this dev system.

The single genuinely-open item (canon §4): how Multica workspaces map onto the
`dev/orgs/<domain>/projects/` arrangement — one workspace per org, or one system
workspace with per-org squads. Defaulted below to the end-shape; flagged as creative/
scope because directory arrangement may shift for deployment/auth reasons.

---

## Committed Direction

### 1. Multica is the whole system (self-hosted)

First principles: the request is "let Jamie add a project/issue in a natural place
and have an agent pick it up, do the work, report back, on a schedule." That is one
concern — orchestration — and splitting it across a human board plus a separate
dispatcher plus a sync layer manufactures two systems of record and net-new glue code
to maintain. That is weight uncorrelated to capability. The lean, root-correct answer
is one platform that already does all of it.

Multica (verified 2026-06-01) is that platform:

- **Issues + agents-as-members.** Assign an issue to an agent like a colleague; the
  agent picks up work, writes code, posts comments, reports blockers, updates status.
- **Local-first runtime.** A local daemon runs on Jamie's machine, auto-detects the
  agent CLIs on PATH, and executes work locally — keys, toolchain, and code directories
  never leave the machine. A **Runtime** is a compute environment (local-via-daemon or
  cloud) the dispatcher routes work to based on which CLI it has.
- **Supported CLIs (verified 2026-06-01):** Claude Code, Codex, GitHub Copilot CLI,
  OpenClaw, OpenCode, Hermes, Gemini, Pi, Cursor Agent, Kimi, Kiro CLI, Antigravity
  (12). Covers every OAuth coding runtime Jamie uses.
- **Autopilots = the goal.md replacement.** Recurring work scheduled via cron,
  webhooks, or manual triggers. The continual orchestrator runs as durable scheduled
  pipeline parts that fire as issues land in the workspace — exactly the "determines/
  triggers workstreams" engine, with zero bespoke dispatcher.
- **Squads.** Group agents under a leader for stable routing as the team scales.
- **Skill-compounding.** A successful solution is saved as a reusable skill for the
  workspace — the self-improving loop, built in.

**Stack (verified 2026-06-01):** Next.js 16 (App Router) frontend, Go backend (Chi,
sqlc, gorilla/websocket), PostgreSQL 17 + pgvector, local daemon runtime. Self-host
via `multica setup self-host` (Docker; Compose, single binary, or Kubernetes). Data
never leaves the network.

**License (verified 2026-06-01):** Modified Apache 2.0. The SaaS-restriction clause:
"you may not use the Multica source code to provide a hosted service to third parties,
or embed Multica as a component of a product or service that is sold, licensed, or
otherwise commercially distributed to third parties." Crucially: "Internal use within
a single organization (including multiple workspaces) does not require a commercial
license." Jamie's use is internal self-host — fully clear. The clause only matters if
Multica is ever exposed as a hosted/productized service, which is not planned.

Multica sits behind the orchestration seam (agnostic + adaptable per canon §1): if a
better platform appears, the runtime is swappable. But there is no second system to
keep in sync today — that is the whole point.

### 2. In-session gates first, fail-closed, before any remote

The non-negotiable (canon §2): code that fails local systems never reaches the remote.
Deterministic hooks enforce the verification ladder at the tool boundary in-session —
not prose an agent might forget, not a remote CI that catches failures too late:

- **PreToolUse (blocking):** block dangerous commands and edits to protected files;
  validate staged files and commit message; detect secrets. Exit-2 blocks the action.
- **PostToolUse (checks):** format, code-health (strict line gates), lint, typecheck,
  boundaries, docs-hygiene, changelog-check, `git diff --check`.
- **Tests run only where system health is genuinely at risk** (canon §1 testing
  discipline). No tests for trivial UI/no-effect changes. Explicit test flows contain
  runaway token spend.

A Multica task **cannot be marked complete with a failing gate** — wire each ladder
command as a hook or as the dispatcher's "task done" criterion. Remote CI re-runs the
same checks as the *additional* gate and must agree with local. The ladder runs
individual relevant commands (non-duplicative); the aggregate check is reserved for
release/audit.

### 3. Knowledge automation — industry-leading OSS, never bespoke

Three deterministic generators run as ladder gates so drift fails locally:

- **System mapping/graphing → CodeGraph** (verified 2026-06-01). Local-first code
  knowledge graph (tree-sitter → SQLite), exposed over MCP, a CLI, and a TS library.
  Indexes symbols, call graphs, import structure, and architecture so agents query the
  index instead of scanning files (benchmarked ~57% fewer tokens, ~62% fewer tool
  calls on Opus 4.8, 2026-05-29). 100% local — aligns with the local-first secrets
  posture. Chosen over the canon's `codegraph`/`composto` spitballs on merit: it is
  the maintained, MCP-native, agent-targeted option that supports the coding CLIs in
  use. (`composto` did not surface as a maintained agent-mapping tool in 2026
  verification; CodeGraph is the clear pick.)
- **Docs → Mintlify** (canon §2). Well-maintained Markdown, minimal-to-no maintenance;
  style for OSS repos, hosted for live projects. We never force Notion/Google.
- **Changelog → fragment pipeline.** Dated fragment files (`.changes/`) with YAML
  frontmatter, validated by a `changelog:check` gate; durable index docs link durable
  directories, never dated/lifecycle artifacts (docs-hygiene).

**Browser automation** is a two-tool split, picked on merit (verified 2026-06-01):
- **Playwright MCP** — the default for *driving*: navigate/click/type, E2E, cross-
  browser, CI-friendly, local and predictable.
- **chrome-devtools-mcp** — for *debugging/perf*: ~29 CDP-backed tools for network
  inspection, console, performance traces, Lighthouse. Best when the question is "why
  is this page slow/failing," not general automation.
- The canon's `Maestro` candidate is a mobile-UI flow tool — not a fit for this web/
  agent dev system; excluded on merit, not adopted by default.

All four (CodeGraph, Mintlify, Playwright MCP, chrome-devtools-mcp) are official or
industry-leading, agent-friendly, and **we maintain none of them** (canon §1).

### 4. Self-improving loop — Multica skill-compounding, review-gated

The loop is native: Multica distills successful solutions into reusable workspace
skills. To avoid skill sprawl, promotion is **review-gated** — candidates surface for
Jamie's approval; nothing auto-promotes to a global skill unattended. This is the
periodic, reviewable pass the ethos demands (compounding without drift). Distilled
skills land in the curated thin-bridge skill set; if an official skill already covers
the workflow better, we adopt it and ship nothing of our own there.

### 5. Coding runtimes and separation

All coding runtimes are **OAuth** (canon §2): Codex, Claude, Gemini, xAI. Daily:
SuperGrok Heavy, Claude Max, Codex Pro, Gemini Pro. Enterprise Vertex/Azure credits
back testing/dev API calls and compute. Unattended Autopilot/scheduled runs use a
**non-interactive credential** (dedicated service-account, not user ADC). **Hermes
stays fully separate** — its runtimes, proxies, and configs are not part of this dev
system and must not be mixed in or broken by the reorg.

### 6. Structure alignment (canon §2)

The dev system is system-level infrastructure under `C:\Users\james\dev`, serving all
three orgs without editing existing setups (canon §1 "don't break what works"):

- **jami.studio** (OSS "Studio") owns the foundations — `@jami-studio/harness`, `@jami-studio/ui`,
  `@jami-studio/orchestra`, `agent-collective`, `agent-delta` (Intercal). The orchestration
  primitives this report enforces are exercised first here.
- **yrka.io** (commercial SaaS) — `business-suite`, `media-suite`, `research-suite`,
  `free-tools`.
- **jnh.org** (personal) — `website`.

The ladder/gates are inherited from the system/org level into every project; project
transients never flow up. Glossaries at system/org/project keep terms consistent.

---

## Open (creative / scope)

**Workspace-to-org mapping.** How Multica workspaces map onto
`dev/orgs/<domain>/projects/`. End-shape default: **one Multica workspace per org**
(jami.studio, yrka.io, jnh.org), each with per-project squads, giving clean per-org
isolation that mirrors the directory and account scoping. The alternative — a single
system workspace with per-org squads — is simpler to run but weaker on isolation. This
stays open only because org/project directory arrangement may shift for deployment/auth
reasons (canon §4); it is a scope choice, not a re-opened decision.

---

## Sources

Official / external (verified 2026-06-01 via WebSearch + WebFetch; drift-prone facts
dated inline):

- Multica — https://github.com/multica-ai/multica , https://github.com/multica-ai/multica/blob/main/LICENSE , https://github.com/multica-ai/multica/blob/main/SELF_HOSTING.md , https://multica.ai/
- CodeGraph — https://github.com/colbymchenry/codegraph , https://colbymchenry.github.io/codegraph/getting-started/introduction/
- chrome-devtools-mcp — https://github.com/ChromeDevTools/chrome-devtools-mcp , https://developer.chrome.com/blog/chrome-devtools-mcp
- Playwright MCP vs Chrome DevTools MCP (driving vs debugging) — https://stevekinney.com/writing/driving-vs-debugging-the-browser , https://www.test-lab.ai/blog/chrome-devtools-mcp-vs-playwright-mcp-cli
- Mintlify — https://mintlify.com/docs

Could not verify against an official 2026 source: a maintained agent-mapping tool named
`composto` (canon spitball) — CodeGraph is adopted on merit instead. `Maestro` confirmed
as a mobile-UI testing tool, out of scope for this web/agent dev system.

Local context: Operating Canon `C:\Users\james\dev\docs\research\00-orchestration\plan.md`.

# F10 — Orchestra & dev-system

Status: AUTHORED 2026-06-02 · Domain: B · Agent substrate (`@jami-studio/orchestra`)
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/03-dev-systems/report.md`, `08-canonical-system`, `12-agent-native/fact-finding/orchestra-planner-options.md`, `../../research/00-orchestration/{plan,synthesis}.md`
Related: F05 (harness), F04 (sessions/hosting), F14 (Kit's curated skills)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

Multi-agent orchestration + the internal dev system. **In:** Multica, scheduling/squads, planner posture, work-record, verification ladder, Kit orchestration skills. **Out:** the harness loop (F05).

## 2. Committed decisions (from canon)

- **Multica = the whole orchestration system**, self-hosted (tasks/runtime/orgs/scheduling/squads/multi-provider routing). **Replaces `goal.md`** via durable scheduled Autopilots. No separate board to sync (Linear/Notion optional).
- **Planner = Option A+:** no declarative DAG/workflow engine in the *product* runtime (agent loop + A2A task-store + run-manager + triggers + cron + approvals = the complete shape). The continual orchestrator is a **dev-system** concern — do not conflate.
- **Work-record** = the single tracker-agnostic schema; every issue is a projection.
- **Verification ladder** = in-session, fail-closed gates (method is canon; commands live in the project leaf).
- **Kit orchestration skills** = curated, opinionated, **optional + idempotent** (single-agent ↔ full-orchestra is a toggle, not a re-provision).

## 3. Architecture & mechanics

**Two distinct layers — do not conflate.**
- **`@jami-studio/orchestra`** = the OSS **product** foundation: teams, squads, scheduling, composed over `harness` + `ui`, forked from agent-native **`dispatch` 0.8.28** (vault, grants, approvals, audit, cross-app A2A). Its planner posture is **Option A+**: the forked agent loop + A2A task-store + run-manager/run-loop-with-resume + triggers + cron + approvals **are** the complete durable-orchestration shape — **no DAG/workflow engine is built into the product runtime.**
- **Multica** = the self-hosted **internal dev-system** that runs *our* build: tasks, runtime, orgs, scheduling, squads, multi-provider routing. The continual Multica orchestrator **replaces `goal.md`** — the old "read goal.md, spawn subagents" prompt becomes durable, scheduled **Autopilots** that run as work is added. These are separate concerns; the "continual orchestrator" is Multica (dev-system), *not* a planner in the orchestra product.

**Multica runtime.** Issues + agents-as-members, a **local-daemon runtime** (keys/repos stay local), **Squads**, **Autopilots** (durable scheduled pipeline parts), skill-compounding. **No separate board to sync to** — Linear/Notion are available but not required and not forced. Coding runtimes are OAuth (Codex, Claude, Gemini, xAI); **Hermes stays fully separate**, never mixed into the coding harness.

**Work-record (the tracker-agnostic schema).** One durable record per unit of work: `id / title / layer / org / project / type / intent / definition-of-done / verification / assignment / status / source / links`. Every Multica issue is a **projection** of it; backed by Postgres (F07-style discipline). This is the determinism mechanism — the agent's leash exists only inside one workstream pass.

**Verification ladder.** In-session, **fail-closed** gates (narrowest gate first, climb): format → code-health → lint → typecheck → tests-where-health-at-risk → boundaries → docs-hygiene → changelog-check. The **method is system canon** (owned here); the **commands live in the project leaf** (F01 thin `AGENTS.md`). Remote CI (F03) re-runs it as an additional gate. Knowledge automation uses industry-leading OSS (CodeGraph, changelog-fragment pipeline, Mintlify, Playwright MCP + chrome-devtools-mcp) — never bespoke.

**orchestra↔harness seam.** Orchestra **drives harness runs**: it dispatches a work-record to a harness run (F05), subscribes to the run's native-SSE event stream (F08) for progress, and applies approvals via the F06 gate. Orchestra never reimplements the loop — it schedules + supervises it. Squads = multiple coordinated harness runs (A2A between them).

**Kit orchestration skills (curated, optional, idempotent).** The "set up my own SaaS" flow is **not** native to vanilla orchestra — it is a curated, opinionated **skill + instruction set** (shipped with the Kit, F14) usable inside orchestra **or** any LLM dev flow. **Single-agent-skill mode ↔ full-orchestra-plan mode is a toggle, not a reinstall/reconfigure** — the mode is movable (within reason) without re-provisioning code. `jami` (the CLI, F15) scaffolds a production-ready harness+ui+orchestra configured to preference.

## 4. Remaining peripheral decisions to cement

- **orchestra↔harness seam (cemented):** orchestra dispatches work-records to harness runs, supervises via native SSE, approves via F06; no loop reimplementation.
- **Work-record schema (cemented):** the field set above; every issue is a projection; Postgres-backed.
- **Kit-skills packaging + toggle (cemented):** curated skill+instruction set shipped with the Kit (F14); single-agent ↔ full-orchestra is a runtime toggle, not a re-provision.
- **Option A+ (cemented):** no declarative planner in the product runtime; the continual orchestrator is Multica's concern only.

## 5. Dependencies & interfaces

- **F05 (harness)** — orchestra drives harness runs; forked from agent-native `dispatch` 0.8.28 alongside `core` 0.32.2.
- **F08 (transport)** — supervises runs via native SSE; squads coordinate over A2A.
- **F06 (governance)** — approvals + grants + audit ride the policy gate.
- **F04 (hosting)** — orchestra is a Node service in the kitchen; it spawns sessions via the F04 provisioning seam.
- **F14 (the Kit)** — ships the curated orchestration skills; the toggle is a Kit feature.
- **F03 (pipeline)** — the verification-ladder method is canon here; commands live in each project leaf and run in F03 CI.
- **F17 (Ops Canon)** — Multica Autopilots can run the F17 drift/freshness lints on a schedule.

## 6. Verification & closing criteria

- Multica runs self-hosted with a local-daemon runtime (keys/repos local); Autopilots replace `goal.md` (a scheduled pipeline spawns subagents on new work).
- A work-record projects into a Multica issue; status round-trips; no separate board is synced.
- The verification ladder runs in-session fail-closed; remote CI re-runs it; the method is canon, commands are project-leaf.
- `@jami-studio/orchestra` builds from the `dispatch` 0.8.28 fork and drives a harness run end-to-end (dispatch → supervise via SSE → approve via F06).
- **No DAG/workflow engine is present in the product runtime** (Option A+ proven by absence).
- The Kit orchestration skill runs both inside orchestra and standalone; the single-agent↔orchestra toggle flips without re-provisioning code.
- Hermes runtimes/proxies/configs are absent from the dev system.

## 7. Risks & verify-at-build (dated)

- Multica modified-Apache-2.0 SaaS clause — read before any hosted/productized exposure (fine for internal self-host).

## 8. Sources

- `03`, `08`, `12` orchestra-planner-options, canon §2.

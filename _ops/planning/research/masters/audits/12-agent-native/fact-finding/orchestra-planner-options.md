# Fact-Finding — Orchestra planner — options, tradeoffs, codebase fit (H3)

Date: 2026-06-01. Author: orchestra-planner fact-finding thread. Status: ISOLATED PLANNING — nothing locked. Verify-then-decide.

---

## VERDICT (lead)

**Option A+ — NO dedicated declarative workflow/DAG engine for the product runtime. Keep the agent loop as executor; lean on the primitives agent-native already ships (dispatch delegation + A2A durable task-store + event-bus triggers + cron jobs + run-manager resume + checkpoints). Add only a thin owned "continual-orchestrator" seam (Option C, ~a few hundred LOC) where — and only where — work needs *durable cross-run sequencing that survives process death*. Do NOT adopt Mastra/Temporal/Inngest/DBOS/Restate into the yrka product runtime.**

Reasoning in one line: the codebase already has the two hard parts of durable orchestration — a **claimable, retryable, stuck-reset task store** (A2A `a2a_tasks`) and a **resumable run lifecycle** (run-manager + run-loop-with-resume) — both on the single Postgres plane. What it lacks is a *declarative multi-step DAG with typed dependencies/branches/joins/compensation*. The product scope (yrka suites, one human, many agents) does **not** require that declarative layer today; agent-driven sequencing + the A2A task queue + triggers cover the real cases. Adopting a heavyweight durable-execution substrate would import an operational and licensing tax (Temporal cluster; Inngest SSPL server; DBOS proprietary Conductor; Restate BSL runtime) for a capability the agent loop already approximates.

Important canon disambiguation (see "Decisive read"): the **"continual orchestrator that replaces goal.md" is already named in canon as Multica** — a *dev-system* concern, self-hosted, with its own modified-Apache-2.0 SaaS clause (`00-orchestration/plan.md` lines 125–131). That is a separate decision from the **product runtime** orchestration H3 is scoped to. Do not conflate them. The Multica/goal.md replacement is NOT a reason to bolt a workflow engine into the agent-native product runtime.

---

## What agent-native ALREADY provides (verified by source read)

Ground truth: clone at `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native` (`@agent-native/core`, clone 0.23.0, MIT). File paths below are all under that root.

### 1. Sub-agent delegation / "squads" — `packages/core/src/server/agent-teams.ts`
- `spawnTask()` / `AgentTask` — an orchestrator agent spawns background sub-agent tasks, each its own thread + background run. Queued orchestrator→sub-agent messages (`task-message:` KV prefix), follow-ups, control (stop), transcript events.
- `AgentTask` shape (lines 57–66): `{ taskId, threadId, description, status: "running"|"completed"|"errored", preview, summary, currentStep, createdAt }`. **`currentStep` is free-text, not a structured step graph.** This is dynamic, agent-driven fan-out — NOT a declarative DAG with typed dependencies/joins/compensation.
- `production-agent.ts` threads the parent's engine/model choices into sub-agents (line 594–595) so delegated work doesn't reset to a default provider.

### 2. Cross-app A2A delegation + durable task store — `packages/core/src/a2a/**`
- This is the most workflow-relevant primitive in the codebase. `a2a/task-store.ts` is a **durable, owner-scoped, claimable, retryable task queue** on the single Postgres plane (table `a2a_tasks`):
  - States: `submitted → working → processing → completed | failed | canceled`.
  - `claimA2ATaskForProcessing()` — atomic single-claim (UPDATE … WHERE state IN ('submitted','working')) so retries can't double-run a handler.
  - `resetStuckA2ATaskForRetry()` / `failStuckA2ATask()` — stuck-processing reaper with a cutoff. `touchProcessingA2ATask()` heartbeat.
  - Owner-scoped (`owner_email`, IDOR-fixed PR #369).
- `a2a/client.ts` — `callAgent()`, `send({async:true})`, **`sendAndWait()`** (poll `tasks/get` to terminal state, default 5-min timeout, 2s poll, `onUpdate` progress). This is the cross-suite delegation call. JWT identity via `signA2AToken()` (per-app/org secret). Async mode exists specifically for serverless time budgets.
- This already gives **long-running, retryable, resumable, durable cross-agent task execution** — just without declarative step composition.

### 3. Scheduled jobs ("dreams" / recurring jobs) — `packages/core/src/jobs/scheduler.ts`
- Jobs are markdown resources `jobs/*.md` with YAML frontmatter (`schedule` cron, `enabled`, `runAs`, `lastRun/lastStatus/lastError/nextRun`). Processed every 60s, sequential, **5-min timeout per job**, each spawns a fresh `runAgentLoop`. Stuck-detection (lastStatus=running > 10min → reset). Per-tick re-validation of run-as user/org membership (audit 12 #10).
- "Dreams" (`packages/dispatch/src/server/lib/dreams-store.ts`, ~100KB) is a *specific* weekly reflective-learning pipeline (`jobs/dispatch-dream.md`, cron `0 9 * * 1`) built ON jobs+approvals+audit: mine agent threads → candidates → proposals → approval → apply to memory/skills. It is a vertical feature, **not** a general workflow engine.

### 4. Event triggers — `packages/core/src/triggers/**` + `event-bus/**`
- Triggers extend job frontmatter with `triggerType: "schedule"|"event"`, `event` name, natural-language `condition` (Haiku yes/no classify, memoized 5-min TTL), `mode: "agentic"|"deterministic"` (deterministic mode is **not yet implemented** — dispatcher.ts line 256). Agentic mode runs full `runAgentLoop` with event payload as context.
- `event-bus/bus.ts` is an **in-process Node `EventEmitter`** keyed on a global symbol, payloads validated against Standard Schema. **Not durable, not cross-isolate** — events are lost on process death and don't fan out across isolates/workers. Built-in events: `agent.turn.completed`, `calendar.*`, `mail.*`, `clip.*`, `test.event.fired`.

### 5. Single-run lifecycle (durable, resumable) — `packages/core/src/agent/run-manager.ts` + `run-store.ts` + `run-loop-with-resume.ts`
- `agent_runs` / `agent_run_events` SQL tables. Background detached runs, SSE subscribe with **in-memory fast path + cross-isolate SQL polling replay**. Heartbeat (1.5s) + `last_progress_at`; stale-reaper (`RUN_STALE_MS` 6s) flips dead "running" rows to errored and appends a terminal event so reconnecting clients never hang.
- `run-loop-with-resume.ts` — soft-timeout (abort before host hard limit) + resumable-error continuation (save prefix, append "continue", re-run; prompt-cache makes resume cheap). Cap `MAX_RUN_LOOP_CONTINUATIONS = 6`.
- This is **turn/run-level durability and resume**, not multi-step workflow durability. It guarantees a single agent turn survives interruption — it does not model "step 3 depends on step 1 and 2, retry only step 3."

### 6. Approvals / vault / audit / grants — `packages/dispatch/src/server/lib/{dispatch-store,vault-store,workspace-resources-store}.ts`
- Human-in-the-loop is already first-class: `createApprovalRequest` / approval policy / `recordAudit`; vault grants + requests + approve/deny; per-app resource grants. The dreams pipeline routes high-risk proposals through approvals. **HITL pause/approve/resume exists at the action/grant level** — what's missing is HITL *as a suspendable workflow step*.

### 7. Checkpoints — `packages/core/src/checkpoints/{service,store}.ts`
- Git-commit-based rollback for self-modifying code (commit per checkpoint, restore to SHA), indexed in SQL `agent_checkpoints` by thread/run. Rollback safety, not workflow state.

**Concretely covered:** delegation (squads + A2A), scheduling (cron jobs), triggers (event + condition), approvals/HITL (action-level), multi-run lifecycle + resume, durable retryable task queue (A2A), audit, rollback.

**Concretely NOT covered:** a declarative durable WORKFLOW/DAG with typed step dependencies, branches/joins, parallel-fan-in, per-step retry/backoff policy, compensation/saga, and suspend-at-step / resume-at-step semantics that survive process death across many steps. The event-bus is in-process (not durable). Trigger "deterministic" mode is a stub.

---

## Does product scope NEED a declarative durable workflow engine?

Separation of concerns:

| Need | Handled today by | Needs durable-workflow semantics? |
|---|---|---|
| "When X happens, do Y" (single reaction) | event trigger + condition + agent loop | No |
| Recurring scheduled task | cron job (`jobs/*.md`) | No |
| Fan-out work to N sub-agents, collect | `spawnTask` squads + queued messages | No (agent sequences it) |
| Cross-suite delegation, long-running, retry on crash | **A2A task-store** (claim/retry/stuck-reset) + `sendAndWait` | Already durable — just not declarative |
| Single turn survives host timeout / crash | run-manager + run-loop-with-resume | Already durable at run level |
| HITL approve before a side-effecting action | dispatch approvals + vault grants | No (action-level gate) |
| **Multi-step pipeline where step 3 retries independently, joins two parallel branches, and resumes mid-pipeline after a week-long human approval, surviving deploys** | **nothing** | **Yes — this is the genuine gap** |
| "Continual orchestrator replacing goal.md" (dev system) | canon already assigns to **Multica** | Separate system; out of product-runtime scope |

The only product-scope case that *genuinely* needs durable-workflow semantics is the last live row: long-horizon, multi-step, cross-suite pipelines with per-step retry + mid-pipeline suspend/resume that must survive process restarts. Everything above it is already handled by agent-driven sequencing + the A2A queue + triggers. Whether yrka product scope has that long-horizon case *as a product requirement today* is the decision gate — from the canon, the durable-pipeline framing is attached to Multica (dev system), not to the yrka suites.

---

## OPTIONS — technical + practical tradeoffs + codebase fit + ethos

### A) No dedicated planner — dispatch delegation + triggers + cron jobs + agent loop as executor
- **Tech fit:** Native. Zero new deps. A2A already gives durable retryable tasks; run-manager gives resume.
- **Tradeoff:** No declarative step graph; sequencing logic lives in agent prompts / `currentStep` free-text → harder to inspect, no per-step retry policy, no deterministic replay. In-process event-bus loses events on crash.
- **Ethos:** Strongest fit. "The agent is the single AI interface; all orchestration goes through the agent loop" (delegate-to-agent SKILL). Agent-native, no shadow control plane.

### A+/C) Thin owned continual-orchestrator seam on A2A task-store + run-store (RECOMMENDED if any durable-pipeline need is real)
- **Tech fit:** Best. Reuse `a2a_tasks` (claim/retry/stuck-reset already built) as the step-execution substrate; add a small `workflow_steps` / `workflow_runs` table keyed to a parent on the same Postgres plane, with `dependsOn` edges and per-step status. The cron tick (already running every 60s) advances ready steps; each step dispatches an agent run or an A2A call. Reuse approvals for suspend-on-HITL.
- **Tradeoff:** You own ~a few hundred LOC and must get idempotency/claim right — but the hard concurrency primitive (atomic claim + stuck reset) is already written and tested in `a2a/task-store.ts`; you're composing, not inventing. No new runtime, no new license, one Postgres.
- **Ethos:** Fits "rebuild-research extract-and-compose over 4 foundations, not invent" (MEMORY). Thin-bridge, deterministic, durable — matches `plan.md` "stays extremely simple, deterministic, repeatable, durable."

### B) Adopt Mastra workflow engine behind a seam
- **Verified (2026-06-01):** `@mastra/core` **v1.37.1, Apache-2.0** (npm). Control flow `.then / .branch / .parallel / .dountil` + `.commit()`; built-in **suspend/resume** with `resume(resumeData)` and HITL; state persisted across steps.
- **Composition:** Workflow steps run **arbitrary `execute()` code** — do **not** require Mastra's Agent abstraction (mastra.ai/docs/workflows/overview confirms steps "call functions in your codebase, external APIs, agents, or tools"). So you *can* call agent-native's `runAgentLoop`/`callAgent` from inside a step.
- **Tradeoff / friction:** Durability needs a **Mastra storage adapter**, and the engine is registered on a **Mastra instance** (`new Mastra({...})`) — that's framework coupling, not a clean standalone lib. You'd be running Mastra's persistence alongside agent-native's Postgres plane (two state stores) unless you write a custom adapter onto the existing plane. Fast-moving API (v1.x, "legacy" workflow docs already exist → churn risk). Mastra can also offload execution to Inngest, pulling in Inngest's licensing.
- **Ethos:** Medium. Gives the declarative layer cleanly and is permissively licensed, but introduces a second framework's instance/lifecycle into an agent-native runtime — a parallel control plane, the thing the delegate-to-agent ethos warns against.

### D) Adopt a durable-execution substrate (verified 2026-06-01)
| Engine | npm (SDK) | SDK license | **Server/runtime license + op cost** | One-Postgres fit |
|---|---|---|---|---|
| **Temporal** | `@temporalio/workflow` **1.17.2** | MIT | Server **MIT**, *but* requires a **separate Temporal cluster** (Frontend/History/Matching/Worker) + Postgres/Cassandra + typically K8s; ~$400–900/mo small prod (AutomationAtlas, Apr 2026). | Poor — not "one Postgres"; it's a whole cluster. |
| **Inngest** | `inngest` **4.5.0** | Apache-2.0 | **Server is SSPL** with delayed-OSS → Apache after 3 years (Inngest blog, updated Jan 7 2026). `inngest start` = single binary, zero-dep self-host. | OK to run; **SSPL on the server is a productization red flag** for hosted SaaS. |
| **DBOS Transact** | `@dbos-inc/dbos-sdk` **4.18.10** | MIT | **Library MIT, runs *in your process* on *your* Postgres** — no separate orchestrator. BUT the **Conductor** management/observability tool is **proprietary; production use needs a paid license key** (DBOS, Mar 2026). | **Best fit** — Postgres-native, no extra infra; you only avoid Conductor. |
| **Restate** | `@restatedev/restate-sdk` **1.14.4** | MIT | **Runtime under BSL** (Business Source License); single-node uses a persistent volume (its own state store, not Postgres). | Poor — separate Rust runtime + its own storage; BSL. |

- **Tradeoff:** All import an external durable-execution model + (except DBOS) external infra. Temporal = cluster tax. Inngest = SSPL server. Restate = BSL + separate runtime. **DBOS is the only one that fits the one-Postgres plane** and stays in-process — if you ever decide the owned seam (C) is too much to maintain, DBOS Transact (MIT library) is the substrate to evaluate first, accepting that Conductor (the nice UI) is paid.
- **Ethos:** Weakest for Temporal/Inngest/Restate (parallel control plane + infra/licensing tax). DBOS is tolerable (in-process, your Postgres) but still a third-party durability model layered under the agent loop.

---

## DECISIVE READ

1. **The codebase already solved durability where it matters** (single run + cross-agent task), on the single Postgres plane, with tested atomic-claim + stuck-reset + heartbeat-reap code. A workflow engine's headline feature (durable retryable tasks) is therefore largely *already present*; only declarative step composition is missing.
2. **Product scope doesn't clearly need the declarative layer.** Every concrete yrka case maps onto delegation + A2A + triggers + cron + approvals. The one case that needs true durable-workflow semantics (long-horizon multi-step pipeline with per-step retry + mid-pipeline HITL suspend surviving deploys) is, per canon, the **Multica/goal.md-replacement** — a **dev-system** concern, explicitly a separate self-hosted system with its own modified-Apache-2.0 clause, NOT the product runtime H3 targets.
3. **Therefore: don't adopt a planner into the product runtime.** Default to A (agent loop + existing primitives). If a real product durable-pipeline requirement surfaces, build the **thin owned seam (C)** on `a2a_tasks` + run-store + approvals — compose, don't invent — because the hard part is already written and it keeps one Postgres, no new license, no parallel control plane. Adopt an external engine only if (C) proves insufficient; in that event **evaluate DBOS Transact first** (MIT, Postgres-native, in-process), then Mastra (Apache, but a second framework instance), and avoid Temporal/Inngest-server/Restate for the product runtime on infra + licensing grounds.
4. **Delete the hedge:** there is no need to pre-build or pre-adopt an "orchestra planner" for yrka. The continual-orchestrator vision is satisfied by Multica on the dev side and by agent-driven sequencing + A2A on the product side.

---

## What I could NOT verify

- **Whether yrka product scope actually has a long-horizon durable-pipeline requirement.** The canon attaches that framing to Multica (dev system). I could not find a product-runtime requirement that *forces* the declarative layer — this is the decision gate and is a product call, not a fact.
- **Mastra storage-adapter compatibility with agent-native's exact Postgres/Drizzle plane** — docs/overview did not specify adapter internals; would need to read `@mastra/core` source or storage docs to confirm a single-Postgres adapter is feasible without a second store.
- **Exact current Inngest server license text** (SSPL vs any 2026 relicense) beyond the blog summary — npm `inngest` SDK is confirmed Apache-2.0 4.5.0, but the *self-hosted server binary* license should be confirmed against the GitHub LICENSE before any productized exposure. Same caution the canon already raises for Multica's Apache-with-SaaS-clause.
- **DBOS Conductor's precise "production use" license boundary** — March-2026 blog says self-hosted Conductor is proprietary/paid; the core Transact library is MIT and self-sufficient, but the exact line for what counts as needing a key (vs. running library-only) should be confirmed against DBOS licensing terms.
- **Temporal 2026 self-host cost figures** are a third-party estimate (AutomationAtlas), not Temporal's own pricing; directionally reliable (it's infra-only, MIT) but not a quote.
- I did not exhaustively read all 76 grep-matched files; I confirmed there is no `dependsOn`/DAG/saga step-graph primitive by reading the candidates (`agent-teams.ts`, `a2a`, `triggers`, `jobs`, `run-*`) — a hidden one elsewhere is unlikely but not categorically ruled out.

---

## Evidence index (file paths + dated sources)

**Codebase (read 2026-06-01), under `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`:**
- `packages/core/src/agent/run-manager.ts`, `run-store.ts`, `run-loop-with-resume.ts`
- `packages/core/src/a2a/{index,task-store,client}.ts`
- `packages/core/src/jobs/scheduler.ts`; `packages/dispatch/src/server/lib/dreams-store.ts`
- `packages/core/src/triggers/{types,dispatcher}.ts`; `packages/core/src/event-bus/{bus,types}.ts`
- `packages/core/src/checkpoints/{service,store}.ts`; `packages/core/src/server/agent-teams.ts`
- Skills: `packages/core/src/templates/workspace-core/.agents/skills/{delegate-to-agent,automations}/SKILL.md`
- Canon: `C:\Users\james\dev\docs\research\00-orchestration\plan.md` lines 125–131 (Multica = goal.md replacement, dev system, modified-Apache-2.0 SaaS clause).

**npm (queried 2026-06-01):** `@mastra/core` 1.37.1 Apache-2.0 · `inngest` 4.5.0 Apache-2.0 · `@temporalio/workflow` 1.17.2 MIT · `@dbos-inc/dbos-sdk` 4.18.10 MIT · `@restatedev/restate-sdk` 1.14.4 MIT.

**Web (2026-06-01):**
- Mastra control flow / suspend-resume / standalone: https://mastra.ai/docs/workflows/control-flow , https://mastra.ai/docs/workflows/overview , https://mastra.ai/en/docs/workflows/suspend-and-resume
- Inngest self-host + SSPL→Apache delayed-OSS: https://www.inngest.com/blog/inngest-1-0-announcing-self-hosting-support , https://www.inngest.com/blog/open-source-event-driven-queue , https://github.com/inngest/inngest
- DBOS Transact MIT library + Conductor proprietary (Mar 2026): https://github.com/dbos-inc/dbos-transact-ts , https://www.dbos.dev/dbos-transact , https://www.dbos.dev/blog/dbos-new-features-march-2026
- Restate SDK MIT / runtime BSL: https://github.com/restatedev/restate , https://docs.restate.dev/server/overview
- Temporal self-host MIT + cluster cost (Apr 2026): https://automationatlas.io/answers/temporal-self-hosted-pricing-2026/ , https://docs.temporal.io/self-hosted-guide

# agent-native — Engine / Gateway / Agent Loop / Memory

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).


*Pillar investigation for the rebuild. Source = local clone at
`C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`
(`@agent-native/core` v0.23.0 in the clone; npm `latest` = **0.32.0**, MIT,
last published 2026-06-01 — verified via `npm view @agent-native/core`).
Real-world integration cross-checked against `C:\Users\james\projects\rebuild\voice-prototypes`.*

---

## 1. The committed read: **ADOPT WHOLESALE (engine + loop) + ADOPT-AND-SWAP the persistence default (Postgres-first)**

This pillar is the strongest "stand on shoulders" candidate in the whole
codebase. The engine/loop/memory layer is already built around exactly the
seam our ethos demands: a thin, provider-agnostic `AgentEngine` interface with
an open registry, a transport-decoupled agent loop, and a single
dialect-switching `DbExec` for all persistence. **Builder.io's hosted gateway
is one engine among eight registered engines, not a foundation** — it is
opt-in, env-gated, and trivially excluded.

- **Adopt wholesale, no changes:** the agent loop (`runAgentLoop`), the engine
  abstraction + registry, the AI-SDK multi-provider engine, resume/continuation,
  and the `DbExec` persistence abstraction.
- **Targeted swap (config only, zero code):** do not register the `builder`
  engine in our `registerBuiltinEngines` equivalent (or ship it but never set
  `BUILDER_PRIVATE_KEY`); default `DATABASE_URL` to Postgres instead of the
  local SQLite file. Both are first-class supported paths today.
- **Build fresh:** nothing here. First principles do not demand replacing any
  of it — the abstractions are already correct.

The only thing labelled "checkpoints" that is **not** what you'd assume:
`checkpoints/service.ts` is **git commits of the working tree**, not
LLM/agent-state snapshots (see §6). That is fine — it is the agent-UI
file-sandbox undo mechanism, orthogonal to this pillar — but don't plan around
it as conversation-state checkpointing.

---

## 2. Direct answers to Jamie's questions

### Q: "How hard to replace the Builder gateway?" → **TRIVIAL (config), it is already replaceable.**

The "Builder gateway" is **not a framework dependency** — it is one
`AgentEngine` implementation (`BuilderEngine` in
`packages/core/src/agent/engine/builder-engine.ts`) registered into an open
registry alongside seven others. Concretely it is an HTTP client that POSTs an
Anthropic-shaped body to `https://api.builder.io/agent-native/gateway/v1/messages`
(`credential-provider.ts:842`) and parses a JSONL event stream. It implements
the same `AgentEngine.stream()` interface (`engine/types.ts:250`) as every
other engine.

The loop never names it. `runAgentLoop` (`production-agent.ts:1367`) only ever
calls `engine.stream(streamOpts)` (`production-agent.ts:1451`) against the
`AgentEngine` interface. Which engine you get is decided by `resolveEngine`
(`registry.ts:392`), a 9-step resolution chain. Builder only wins when its two
env vars (`BUILDER_PRIVATE_KEY` + `BUILDER_PUBLIC_KEY`) are present
(`builtin.ts:54`) **or** a user OAuth-connected Builder via the settings flow.

**To replace it, you do nothing or one of:**
1. Don't set the Builder env vars / don't OAuth-connect → it never resolves;
   `anthropic` is the documented default (`registry.ts:501`).
2. Set `AGENT_ENGINE_PREFER_BYO_KEY=true` → registry skips Builder on the first
   pass even if its keys exist (`registry.ts:143-157`).
3. Set `AGENT_ENGINE=ai-sdk:anthropic` (or any name) → explicit override
   (`registry.ts:437`).
4. In our fork, simply delete the `registerAgentEngine({ name: "builder", … })`
   block in `builtin.ts:46-56`. Engine code is self-contained; nothing else
   imports `BuilderEngine` except `builtin.ts`.

There is **no hidden coupling**: Builder credentials, base URL
(`BUILDER_GATEWAY_BASE_URL`), and upgrade-CTA URLs are all isolated inside
`builder-engine.ts` + `builder-gateway-headers.ts` + the Builder branch of
`credential-provider.ts`. The loop, persistence, tools, and SSE layer are
engine-agnostic by construction (`engine/types.ts:1-13` documents this
explicitly). The `voice-prototypes` integration confirms it in practice — it
runs OpenAI Realtime / Gemini Live / Vertex as voice front-ends with tool
execution flowing back through agent-native actions, and never touches the
Builder gateway.

### Q: "Swap out the memory provider?" → **TRIVIAL→MODERATE depending on what "memory" means.**

There is no monolithic "memory provider." Persistence is three concrete stores,
all sitting on **one** swappable seam: the `DbExec` interface in
`packages/core/src/db/client.ts:22-26` (`execute(sql) → {rows, rowsAffected}`).

- **Swap the DB backend (storage substrate):** **TRIVIAL — pure config.**
  `getDialect()` (`client.ts:217`) auto-detects from `DATABASE_URL`: Postgres
  (`postgres://`), remote libsql/Turso, Cloudflare D1 binding, or local
  `better-sqlite3` file (default `file:./data/app.db`). Neon serverless is
  special-cased (`client.ts:589`). Changing `DATABASE_URL` switches every store
  with no code change. This is the recommended swap for us: default to Postgres.
- **Swap to a non-SQL store (e.g. Redis, a vector DB, a custom KV):**
  **MODERATE.** You'd implement the `DbExec` interface (one method) — but the
  stores emit raw SQL strings (`CREATE TABLE`, `INSERT … ON CONFLICT`), so a
  non-SQL target needs a SQL-shim or a fork of each store module. The seam
  exists; it's just SQL-shaped.
- **Conversation memory (the actual chat history):** lives as a JSON blob in
  the `chat_threads.thread_data` column (`chat-threads/store.ts:52-66`), with
  optimistic-concurrency CAS on `updated_at` (`store.ts:478-552`). Swappable by
  the same `DbExec` seam.
- **Ephemeral shared agent↔UI state:** `application_state` table, a
  `(session_id, key) → JSON value` KV (`application-state/store.ts:17-25`).

So: "swap the memory provider" = set `DATABASE_URL` (trivial) for any SQL
backend; implement `DbExec` (moderate, ~1 method + SQL shim) for anything else.

---

## 3. What each piece actually IS (file-cited)

| Concern | What it is | File |
|---|---|---|
| **Agent loop** | `runAgentLoop` — iterative call-engine → dispatch tools → append results, until no tool calls. Transport-decoupled (takes a `send(event)` fn), so it runs in background, not just behind HTTP. | `agent/production-agent.ts:1367` |
| **Engine interface** | `AgentEngine` — `stream(opts): AsyncIterable<EngineEvent>`, one LLM round-trip per call; loop drives the looping. Normalized event/message/tool types. | `agent/engine/types.ts:250` |
| **Engine registry** | Open `Map`-based registry; `registerAgentEngine()` lets any plugin add an engine. `resolveEngine()` 9-step resolution. | `agent/engine/registry.ts:56,392` |
| **Builder gateway engine** | HTTP/JSONL client to Builder's managed multi-model gateway. One engine impl. | `agent/engine/builder-engine.ts:117` |
| **AI-SDK engine (the multi-engine proof)** | Wraps Vercel AI SDK; supports anthropic/openai/openrouter/google/groq/mistral/cohere/ollama via dynamic `import()` of optional `@ai-sdk/*` peers. | `agent/engine/ai-sdk-engine.ts:177` |
| **Native Anthropic engine** | Direct `@anthropic-ai/sdk` engine (default fallback). | `agent/engine/anthropic-engine.ts` |
| **Model catalog** | Central, no hardcoding in engines; one file to bump defaults. | `agent/model-config.ts` |
| **Resume / continuation** | Soft-timeout abort before host function limit + resumable-error continuation; appends "continue from where you left off" and replays the conversation prefix (Anthropic prompt cache absorbs latency). NOT state snapshots. | `agent/run-loop-with-resume.ts`; `production-agent.ts:1107,1146` |
| **Run persistence / reconnect** | `agent_runs` + `agent_run_events` tables; heartbeat liveness, stale-run reaping, SSE replay-by-seq for page-refresh reconnection. | `agent/run-store.ts` |
| **Run manager** | In-memory `ActiveRun` registry + SQL mirror; subscribers, abort, heartbeat. The thing that actually starts/streams a run. | `agent/run-manager.ts` |
| **DB client (the swap seam)** | `DbExec` interface + dialect auto-detection (sqlite/postgres/d1/libsql). | `db/client.ts:22,217` |
| **Conversation memory** | `chat_threads.thread_data` JSON blob, CAS concurrency. | `chat-threads/store.ts` |
| **Ephemeral shared state** | `application_state` `(session_id,key)→JSON` KV; powers agent↔UI shared state. | `application-state/store.ts` |
| **Event bus** | Standard-Schema-validated named events (`calendar.booking.created` etc.) for triggers/automations. | `event-bus/types.ts` |
| **"Checkpoints"** | git add/commit/restore of the working tree (agent file-sandbox undo). NOT agent-state checkpointing. | `checkpoints/service.ts` |

How model/provider config flows (no hardcoding): engine `create(config)` →
`AISDKEngineConfig` accepts `{ model, apiKey, baseUrl, allowEnvFallback }`
(`ai-sdk-engine.ts:162`); models come from `model-config.ts`; per-user/org keys
resolve from encrypted `app_secrets`, then settings, then env, in that priority
(`registry.ts:392-509`, `production-agent.ts:136-246`).

---

## 4. Coupling to Builder.io hosted services

| Surface | Coupled? | Notes |
|---|---|---|
| LLM gateway | **Opt-in only** | `builder-engine.ts` + `api.builder.io/agent-native/gateway/v1` (`credential-provider.ts:845`). Excludable; one of 8 engines. |
| Credentials | **Opt-in only** | `BUILDER_PRIVATE_KEY/PUBLIC_KEY` or Builder OAuth. No keys → never used. |
| Telemetry | **Loose** | `captureError` (Sentry) calls in `builder-engine.ts` are no-ops without Sentry config; gateway attribution headers (`x-client-name`) only sent on Builder calls. |
| Persistence | **None** | Fully local/self-hostable: SQLite file default, or your own Postgres/Turso/D1. |
| Agent loop / tools / SSE | **None** | Engine-agnostic by design (`engine/types.ts:1-13`). |
| Transcription / templates | **Not in this pillar** | (Other pillars; this layer is clean.) |

**Verdict:** for this pillar, agent-native is fully self-hostable with zero
Builder.io services. Builder is a convenience managed-model path, not a
foundation dependency.

---

## 5. Swap-difficulty table

| Replaceable part | Difficulty | Exact seam / file |
|---|---|---|
| Builder gateway → BYO provider | **Trivial (config)** | Don't set Builder env / `AGENT_ENGINE_PREFER_BYO_KEY=true` / `AGENT_ENGINE=…`; or drop the registration block `builtin.ts:46-56`. Resolution chain `registry.ts:392`. |
| Add/replace any LLM engine | **Adapter swap** | Implement `AgentEngine` (`engine/types.ts:250`), call `registerAgentEngine()` (`registry.ts:56`). The AI-SDK engine already proves multi-engine. |
| Add a new model provider | **Trivial (config)** | Add to `AI_SDK_MODEL_CONFIG` (`model-config.ts`) + provider package map (`ai-sdk-engine.ts:126`). |
| DB backend (SQLite↔Postgres↔Turso↔D1) | **Trivial (config)** | `DATABASE_URL` only; `getDialect()` (`client.ts:217`). |
| Non-SQL memory store | **Moderate** | Implement `DbExec.execute` (`client.ts:22`) + SQL shim, since stores emit SQL strings. |
| Conversation memory format | **Moderate** | `thread_data` JSON merge logic in `chat-threads/store.ts` + `thread-data-builder.ts`. |
| Resume strategy | **Adapter/moderate** | `run-loop-with-resume.ts` wraps `runAgentLoop`; replaceable wrapper. |
| Working-tree checkpoints | **Adapter** | `checkpoints/store.ts` + `service.ts` (git). Replace with non-git VCS/snapshot if desired. |

---

## 6. Mapping to our foundation

- **`@jami-studio/harness`** ← **the entire core of this pillar.** `runAgentLoop`,
  `AgentEngine` + registry, the engine implementations, `run-loop-with-resume`,
  `run-manager`/`run-store`, model-config, credential resolution. This is the
  harness, essentially complete. Lift wholesale.
- **`@jami-studio/orchestra`** ← `run-manager` (multi-run lifecycle, abort, reconnect),
  `event-bus` (named typed events for triggers/automations), and the separate
  `@agent-native/dispatch` package (MIT — "workspace control plane: vault,
  integrations, destinations, scheduled jobs, cross-app delegation"). Sub-agent
  delegation is referenced in `production-agent.ts` (`onEngineResolved` threads
  parent engine/model into sub-agents). The orchestra layer is partly here,
  partly in `dispatch`/`scheduling` packages (out of this pillar's deep scope).
- **`@jami-studio/ui`** ← only the shared-state substrate touches this pillar:
  `application-state` (agent↔UI shared KV) and the SSE event stream
  (`AgentChatEvent`) the loop emits via `send()`. The UI primitive registry
  itself is a different pillar.

---

## 7. Risks, license, redistribution

- **License: MIT (verified `npm view`, and `packages/core/package.json`
  `"license": "MIT"`).** `@agent-native/dispatch` also MIT. Redistribution and
  forking under jami.studio OSS are unencumbered. Keep the MIT
  copyright/license notice when forking. **No CLA or trademark grant verified** —
  the "Builder.io" / "agent-native" names are theirs; rename our fork's
  package/product identity.
- **Version drift:** clone is **0.23.0**, npm `latest` is **0.32.0** (9 minors
  ahead, published 2026-06-01). Re-clone at the version you intend to fork from;
  the engine/registry shape is stable across this window but model-config
  defaults and gateway error codes churn.
- **`process.env`-heavy resolution:** engine and DB selection lean on env vars
  and a global singleton (`_exec` in `client.ts:540`). Fine for a single-tenant
  harness; for our multi-agent-per-human model, note the request-scoped
  credential path (`app_secrets`, `request-context.ts`) is the multi-tenant
  seam already built in — adopt it rather than the env path.
- **Builder error semantics leak into the loop's retry logic:**
  `production-agent.ts:646-719` special-cases `builder_gateway_error` /
  `builder_gateway_timeout` codes in `isRetryableError`/`maxRetriesForError`.
  Harmless if Builder is unused (those codes never arise), but it's Builder-aware
  code in the generic loop — a minor cleanup target, not a blocker.
- **Model IDs are speculative/future-dated** in `model-config.ts` (`gpt-5.5`,
  `claude-sonnet-4-6`, `gemini-3.1-pro`). Cosmetic; the catalog is one file.

## 8. What I could NOT verify

- **agent-native.com/docs content** — search surfaced only Builder.io *blog*
  posts on the agent-native *architecture*, not a docs site for the framework;
  could not confirm a live `agent-native.com/docs` or hosted-gateway pricing
  page. Gateway pricing/quota (the 402 `credits-limit` path in
  `builder-engine.ts:294`) is real in code but its commercial terms are
  unverified.
- **Whether 0.32.0 changed the engine/registry seam** — I read 0.23.0 source;
  did not diff against 0.32.0. Re-verify the four files (`registry.ts`,
  `builder-engine.ts`, `ai-sdk-engine.ts`, `db/client.ts`) at fork time.
- **Sub-agent / orchestra internals** — only skimmed; `dispatch` and
  `scheduling` packages are out of this pillar's deep scope and need their own
  pass for the orchestra mapping.
- **D1 / Turso paths at scale** — code exists and is dialect-correct, but I did
  not run them; only `better-sqlite3` (local) and Postgres paths are exercised
  in voice-prototypes.

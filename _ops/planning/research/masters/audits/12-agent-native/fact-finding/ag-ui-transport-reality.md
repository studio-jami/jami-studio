# Fact-Finding — AG-UI + assistant-ui adapter + CopilotKit (buy-vs-build)

> Thread: PW5 (research half). Date: 2026-06-01. Author: fact-finding agent.
> ISOLATED PLANNING — nothing locked. Verify-only so Jamie can decide.
> Ground truth: `@agent-native/core` clone 0.23.0 (npm latest 0.32.0), MIT, BuilderIO/agent-native.

---

## VERDICT (lead)

**Native-SSE is sufficient today; do NOT ride AG-UI as the internal transport. Build the thin renderer (there is almost nothing to "buy"), and treat AG-UI as an optional *edge adapter* for third-party agent interop, not as the spine.**

Two independent verdicts:

1. **Ride-AG-UI vs native-SSE-sufficient → native-SSE-sufficient (for the internal chat spine).**
   AG-UI is real, MIT, well-backed, and standardized around ~27 live event types — but it is **still pre-1.0** (`@ag-ui/core@0.0.54`, repo tagged "Release 2026-05-29", explicit "Will be removed in 1.0.0" deprecations in the enum). agent-native's current transport (custom `data: {json}` framing + `RunEvent {seq,event}` replay) maps **cleanly onto AG-UI text/tool/run/state events**, but agent-native has **two structurally-foreign concepts** (a coarse `clear` reset and a separate `version`-counter DB-sync channel) that AG-UI has no first-class slot for — they would land in `CUSTOM`/`RAW` or `STATE_SNAPSHOT`. Writing a server-side SSE→AG-UI translator is **small but real work** (≈1 file, ~15 event-kind cases, plus a synthetic START/END framing layer agent-native doesn't currently emit). Worth doing **only at the interop boundary** (exposing our agents to CopilotKit/assistant-ui/foreign clients), not for our own UI.

2. **Buy-CopilotKit-client vs build-renderer → build the renderer.**
   CopilotKit does **not** ship "the renderer we'd hand-roll." Its "generative UI" is **developer-registered React components keyed to tool calls** (`useCopilotAction` + `renderAndWaitForResponse`, `useDefaultRenderTool`) — you still write every component. It is not a generic server-driven UI-*tree* interpreter. The actual server-driven-UI-tree spec is **A2UI** (Google, v0.8 stable / v0.9 draft), which is a *different* buy decision. And agent-native already does generative UI a third way: **MCP-UI / ext-apps iframes** via `McpAppRenderer` (no JSON UI tree at all). So "UiTreeRenderer" is a choice between (a) keep ext-apps iframes, (b) adopt A2UI's tree, or (c) hand-roll tool→component mapping like CopilotKit — CopilotKit gives you (c)'s *plumbing* but not the components, and brings a heavy runtime + its own provider model.

**Proof-spike (defined below):** stand up `@assistant-ui/react-ag-ui` (`HttpAgent` + `useAgUiRuntime`) against a 1-file agent-native→AG-UI SSE translator and confirm a text+tool_call+tool_done round-trips into assistant-ui components. ~1 day. If it works, AG-UI is a viable *export* adapter; the internal spine still stays native-SSE.

---

## VERIFIED FACTS (evidence)

### A. AG-UI protocol — real, MIT, backed, but PRE-1.0

| Fact | Value | Source (dated 2026-06-01) |
|---|---|---|
| `@ag-ui/core` npm version | **0.0.54** | `npm view @ag-ui/core version` |
| `@ag-ui/client` npm version | **0.0.54** | `npm view @ag-ui/client version` |
| License | **MIT** (`Copyright (c) 2025`) | tarball `LICENSE` of `@ag-ui/core@0.0.54` |
| Repo | github.com/ag-ui-protocol/ag-ui | npm `repository.url` + repo |
| Latest repo release | **"Release 2026-05-29"** (no formal 1.0 confirmed) | github.com/ag-ui-protocol/ag-ui (fetched 2026-06-01) |
| **EventType enum count** | **33 declared values** (6 are `THINKING_*` deprecated, aliased to `REASONING_*`, "removed in 1.0.0") → **~27 live** | tarball `@ag-ui/core@0.0.54` `dist/index.d.ts` lines 4142–4197 |
| Marketed "core" count | **16–17** (CopilotKit blog "Master the 17 AG-UI Event Types") | copilotkit.ai/blog (the 16–17 = the non-reasoning/non-activity core; reconciles with the 27 live once reasoning+activity+chunk variants are added) |
| Transport bindings | **transport-agnostic**: SSE, WebSockets, webhooks; ships a **reference HTTP/SSE implementation**. `HttpAgent` (SSE) is the default client. | github.com/ag-ui-protocol/ag-ui README; adapter README uses `HttpAgent` |
| Maintainers/backers | Created by **CopilotKit** (× LangGraph, CrewAI). 1st-party: Microsoft Agent Framework, Google ADK, AWS Strands, Mastra, Pydantic AI, Agno, LlamaIndex, AG2. ~14k stars. | github.com/ag-ui-protocol/ag-ui |

**Full live EventType list** (from the .d.ts, verbatim): TEXT_MESSAGE_START, TEXT_MESSAGE_CONTENT, TEXT_MESSAGE_END, TEXT_MESSAGE_CHUNK, TOOL_CALL_START, TOOL_CALL_ARGS, TOOL_CALL_END, TOOL_CALL_CHUNK, TOOL_CALL_RESULT, STATE_SNAPSHOT, STATE_DELTA, MESSAGES_SNAPSHOT, ACTIVITY_SNAPSHOT, ACTIVITY_DELTA, RAW, CUSTOM, RUN_STARTED, RUN_FINISHED, RUN_ERROR, STEP_STARTED, STEP_FINISHED, REASONING_START, REASONING_MESSAGE_START, REASONING_MESSAGE_CONTENT, REASONING_MESSAGE_END, REASONING_MESSAGE_CHUNK, REASONING_END, REASONING_ENCRYPTED_VALUE. (Plus 6 deprecated THINKING_* aliases.)

### B. `@assistant-ui/react-ag-ui` adapter — EXISTS, MIT, "May 15 2026" claim ≈ CONFIRMED (off by ~2 weeks)

| Fact | Value | Source |
|---|---|---|
| Exists? | **Yes** | `npm view @assistant-ui/react-ag-ui` |
| Version | **0.0.34** | npm |
| License | **MIT** | tarball `package.json` |
| Created / last modified | created **2025-11-19**, modified **2026-05-31** | `npm view ... time.created time.modified` |
| Publisher (`author`) | **"AgentbaseAI Inc."** (NOT the assistant-ui core org itself — note for due diligence) | tarball `package.json` |
| Repo directory | `assistant-ui/assistant-ui` → `packages/react-ag-ui` | tarball `package.json` |
| Deps | `@ag-ui/client ^0.0.54`, `@assistant-ui/core ^0.2.8`, `assistant-stream ^0.3.18` | tarball `package.json` |
| **What it does** | "Wraps an `@ag-ui/client` agent in an assistant-ui runtime so any AG-UI-compatible backend (CopilotKit, custom Python/Go/TS agents) can drive the standard assistant-ui components." API: `useAgUiRuntime({ agent })` with `new HttpAgent({ url })`. | tarball `README.md` |

> On the **"May 15 2026" claim**: the package was *last modified* 2026-05-31 and there is a recent release in that window; I could not pin an exact 0.0.x bump to May 15 from npm `time` (which only exposes created/modified, not every version date here). Treat "mid-May 2026" as the right ballpark; the adapter is current and maintained as of 2026-05-31.

> README cross-references siblings: `@assistant-ui/react-a2a` ("A2A v1.0 protocol") and `@assistant-ui/react-langgraph`. So assistant-ui already has an adapter family — AG-UI is one of several runtimes.

### C. CopilotKit — generative UI is component-registration, NOT a tree renderer

- `@copilotkit/react-core` latest: **1.59.2** (`npm view`). CopilotKit is the **maker of AG-UI** (its own README/site).
- Generative UI mechanism (verified via docs.copilotkit.ai + github): `useCopilotAction({ render / renderAndWaitForResponse })` and `useDefaultRenderTool()` register **your** React components against tool calls; CopilotKit renders them as cards/HITL prompts. `useCopilotReadable` + `useCopilotAction` declare app state/actions to the agent.
- **It does NOT ship a generic server-driven UI-tree interpreter.** You hand-write each component either way. What you'd "buy" from CopilotKit is the provider/runtime + transport + tool-binding plumbing — at the cost of adopting CopilotKit's runtime and provider model wholesale.

### D. A2UI + MCP-UI/ext-apps — current state

- **A2UI (Google):** v0.8 **stable / Public Preview**; v0.9 **draft, published 2026-05-20** (catalog-negotiation handshake + prompt-first generation); v0.10 proposed in `specification/` folder. **Apache 2.0**, Google + CopilotKit contributions. Source: a2ui.org, github.com/google/A2UI, developers.googleblog.com (2026-05-20). *This* is the real "server-driven UI tree" spec — the thing a UiTreeRenderer would target if we go that route.
- **MCP-UI / ext-apps:** `@modelcontextprotocol/ext-apps` npm latest **1.7.3**; **the agent-native clone pins 1.7.2** (one patch behind). agent-native renders generative UI through this path today — `McpAppRenderer.tsx` uses `@modelcontextprotocol/ext-apps/app-bridge` (`AppBridge`, `PostMessageTransport`, CSP/permissions) to mount **sandboxed iframes** (`allow-scripts allow-forms allow-popups`), default height 650px. No JSON UI tree.

### E. agent-native CURRENT transport (ground truth, clone 0.23.0)

**Two distinct channels — do not conflate them.**

**1. Agent chat stream — `POST /_agent-native/agent-chat`**
- Framing: line-delimited **`data: {json}\n\n`** (SSE-shaped) but consumed via **`fetch()` + `res.body.getReader()`**, NOT native `EventSource`. (`packages/core/src/client/useProductionAgent.ts` L81–114; server `packages/core/src/agent/run-manager.ts` L470–700.)
- Envelope: **`RunEvent { seq: number; event: AgentChatEvent }`** (`packages/core/src/agent/types.ts` L198–201). **Seq-replay**: subscribe `fromSeq`, server replays buffered events then live-tails; SQL-backed path replays via `getRunEventsSince(runId, lastSeq)`. Replay window is bounded (in-memory buffer; reconnect outside window won't replay).
- **`AgentChatEvent` = 15 variants** (`types.ts` L132–196): `text`, `activity`, `tool_start`, `tool_done` (carries `mcpApp?: AgentMcpAppPayload`), `agent_call`, `agent_call_text`, `agent_task`, `agent_task_update`, `agent_task_complete`, `done`, `error` (+ `errorCode`/`upgradeUrl`/`recoverable`), `missing_api_key`, `loop_limit`, `auto_continue` (6 reasons), **`clear`**.
- Client maps these into assistant-ui via `ChatModelRunResult` content parts: `{type:"text"}` and `{type:"tool-call", ..., mcpApp?}` (`packages/core/src/client/sse-event-processor.ts` L5–40).

**2. DB-sync — `GET /_agent-native/events` (native SSE) + `GET /_agent-native/poll` (fallback)**
- `useDbSync` (`packages/core/src/client/use-db-sync.ts`): **native `EventSource`** on `/_agent-native/events`, with a `/_agent-native/poll?since=<version>` polling safety net (2s default; 15s while SSE connected) for serverless/edge where long-lived SSE dies.
- Payload is a coarse **`{ version, source, key }`** change-event (and a `{type:"batch", events:[…]}` startup burst). It carries **no content** — it just **invalidates react-query caches** / bumps per-source change counters (`bumpChangeVersion`). This is the "files/DB changed, refetch" channel, deliberately separate from the chat token stream.
- Server SSE for this channel: `packages/core/src/server/sse.ts` (h3 `createEventStream`, batch mode for sync bursts).

**Other `/_agent-native/*` endpoints seen:** `/actions`, `/open`, `/agent-chat`, `/events`, `/poll`, `/runs`, `/notifications`, `/org/*`, `/mcp`, `/a` (A2A agent card). (grep across `packages/core/src`.)

### F. Mapping: agent-native event kinds → AG-UI types

| agent-native `AgentChatEvent` | AG-UI mapping | Class |
|---|---|---|
| `text` | TEXT_MESSAGE_START / _CONTENT / _END | **1:1** (but AG-UI needs explicit START/END framing agent-native doesn't emit — synthesize) |
| `tool_start` | TOOL_CALL_START + TOOL_CALL_ARGS | **1:1** |
| `tool_done` (no mcpApp) | TOOL_CALL_END + TOOL_CALL_RESULT | **1:1** |
| `tool_done` (with `mcpApp`) | TOOL_CALL_RESULT + **CUSTOM** (ext-apps iframe payload) | **Custom-absorb** (AG-UI has no ext-apps/MCP-UI slot) |
| `activity` | ACTIVITY_SNAPSHOT / ACTIVITY_DELTA or CUSTOM | **Custom-absorb / loose** |
| `agent_call`, `agent_call_text` | STEP_STARTED/STEP_FINISHED or CUSTOM | **Custom-absorb** (sub-agent semantics don't map cleanly) |
| `agent_task*` (3 kinds) | CUSTOM | **Custom-absorb** (no task-lifecycle primitive) |
| `done` | RUN_FINISHED | **1:1** |
| `error` (+errorCode/upgradeUrl) | RUN_ERROR + CUSTOM (for CTA metadata) | **1:1 + Custom-absorb** |
| `missing_api_key`, `loop_limit`, `auto_continue` | CUSTOM | **Custom-absorb** |
| **`clear`** | **— no AG-UI equivalent —** (MESSAGES_SNAPSHOT[] empty is the nearest) | **Structurally-foreign** |
| **`RunEvent.seq` replay** | **— not an AG-UI concept —** (AG-UI relies on RUN_STARTED/STEP framing + client reducer, not seq cursors) | **Structurally-foreign** |
| **DB-sync `{version,source}` channel** | STATE_SNAPSHOT / STATE_DELTA (lossy — AG-UI state is per-run, agent-native's is app-global) | **Structurally-foreign** |
| (none) | RUN_STARTED, STEP_*, REASONING_*, MESSAGES_SNAPSHOT | AG-UI-only — must synthesize or omit |

**Read:** ~5 kinds are clean 1:1, ~7 land in CUSTOM/RAW, and **3 are structurally foreign** (`clear`, `seq`-replay, the global DB-sync channel). The translator is writable but **lossy in both directions**, and the seq-replay/DB-sync split is the part AG-UI does *not* give us for free.

### G. Server-side SSE→AG-UI translator — honest scope

- **Size:** ~1 module. Switch over 15 `AgentChatEvent` kinds → emit AG-UI events; wrap each run with synthetic `RUN_STARTED`/`RUN_FINISHED`/`RUN_ERROR` and per-message `TEXT_MESSAGE_START/END` framing (agent-native streams bare `text` deltas, so START/END must be synthesized on first/last delta — stateful per run).
- **Real cost beyond the switch:** (1) seq/replay reconciliation — AG-UI clients don't send `fromSeq`, so reconnect-replay either drops or needs a custom resume header; (2) the DB-sync channel has no AG-UI home — either fold into STATE_* (lossy) or keep it native alongside; (3) ext-apps iframe payloads ride in CUSTOM and need a matching client decoder, so "AG-UI standard client" won't render our MCP-UI apps without custom code anyway.
- **Conclusion:** cheap to expose a *degraded* AG-UI surface for interop; expensive to make AG-UI a *lossless* internal spine. Keep native-SSE internally.

---

## DECISIVE READ

- **AG-UI is a credible interop standard, not a finished foundation.** Pre-1.0 (0.0.54), enum still churning (THINKING→REASONING rename pending 1.0), MIT, real backers. Good for **exporting** our agents to the ecosystem; premature as our internal contract.
- **agent-native's native SSE already does everything our own UI needs**, and does two things AG-UI doesn't model well: bounded **seq-replay** on the chat stream and a **separate global DB-sync/poll channel** with serverless fallback. Replacing it with AG-UI would *lose* capability, not gain it.
- **The "renderer" is not buyable.** CopilotKit = component-registration plumbing (you still write components) + a heavy runtime. A2UI = the actual server-driven UI-tree spec (Apache-2.0, v0.8 stable/v0.9 draft) — a separate decision if/when we want LLM-authored layouts. agent-native today renders generative UI via **MCP-UI/ext-apps iframes**, which sidesteps both. Build the thin tool→component layer; optionally evaluate A2UI v0.9 later for declarative trees.
- **Cheapest high-value move:** use `@assistant-ui/react-ag-ui` (it already wraps `HttpAgent`→assistant-ui runtime, and agent-native already depends on `@assistant-ui/react ^0.12.19`) as the **proof that our agents can speak AG-UI outward**, behind a 1-file translator — without touching the internal transport.

### Proof-spike (defined)
1. Write `agentChatToAgUi()` server module: consume the existing `/_agent-native/agent-chat` `RunEvent` stream, emit AG-UI SSE (`RUN_STARTED` → `TEXT_MESSAGE_*` / `TOOL_CALL_*` → `RUN_FINISHED`), dropping `clear`/DB-sync, folding `agent_task*`/`mcpApp` into `CUSTOM`.
2. Mount a throwaway React page with `useAgUiRuntime({ agent: new HttpAgent({ url }) })` + `<AssistantRuntimeProvider>`.
3. Assert: one prompt round-trips text + a tool_start/tool_done into assistant-ui's standard message + tool-call components.
4. Success criterion: renders without custom client code for text+tools; note exactly what `mcpApp`/`agent_task` lose. **~1 day.** Outcome decides only "is AG-UI a viable *export* adapter," NOT whether to migrate the spine (it shouldn't).

---

## WHAT I COULD NOT VERIFY
- **Exact "May 15 2026" date** for a specific `@assistant-ui/react-ag-ui` version — npm `time` exposes only created (2025-11-19) / modified (2026-05-31), not per-version dates here. "Mid/late May 2026, actively maintained" is confirmed; the precise 15th is not.
- **AG-UI formal 1.0 status** — repo shows "Release 2026-05-29" and in-code "removed in 1.0.0" deprecations, i.e. 1.0 is *anticipated, not shipped*. Could not confirm a tagged 1.0 as of 2026-06-01.
- **A2UI v0.9 stability** — reported "live" and "draft" simultaneously by different sources (Google blog 2026-05-20 says published; CopilotKit blog frames it as usable today). v0.8 is the safe "stable" pin.
- **Whether agent-native's npm-latest 0.32.0** changed the transport vs the 0.23.0 clone — all transport facts above are from the **0.23.0 clone**; I did not pack/inspect 0.32.0 (no install into project trees per rules; would need a separate `npm pack` review if the delta matters).
- **`@assistant-ui/react-ag-ui` interrupt/HITL + multi-thread behavior** — README points to assistant-ui.com/docs/runtimes/ag-ui; not fetched/verified at depth.

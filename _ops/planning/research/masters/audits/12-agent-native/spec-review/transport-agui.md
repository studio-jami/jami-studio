# Spec Review — AG-UI Transport — flush-out + proof-of-work

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).


Reviewer lens: AG-UI Transport ("rebind the agent surface's SSE/endpoint contract to AG-UI
carrying our owned SDUI vocabulary"). Adversarial, isolated planning pass — nothing locked.
Date: 2026-06-01. Today's ground truth read from the local clone
`C:\Users\james\projects\rebuild\agent-primitives\references\agent-native` (`@agent-native/core`
v0.23.0, MIT) and dated official 2026 sources.

---

## VERDICT: SOUND IN DIRECTION, BUT UNDER-SPECIFIED — needs-change on framing + has two
medium holes before green light.

The decision to ride AG-UI rather than invent a transport is correct and *cheaper than the spec
realizes*. The single most load-bearing fact the spec never states: **agent-native's chat surface
is built on `@assistant-ui/react`, and assistant-ui ships a first-party AG-UI runtime adapter,
`@assistant-ui/react-ag-ui` (assistant-ui.com/docs/runtimes/ag-ui, "as of May 15, 2026").** The
"rebind" is therefore not a hand-rolled shim — it is a *swap of the runtime adapter the surface is
already constructed with* (`createAgentChatAdapter` → AG-UI runtime). That makes the client side a
near-drop-in and moves the real work entirely to the **server**: emitting the ~16 standardized
AG-UI events instead of agent-native's bespoke `SSEEvent` vocabulary.

But the spec is wrong-by-omission in three ways that a real review must catch:

1. It calls AG-UI an "adapter swap on the SSE/endpoint contract" (recommendation.md §3, last
   block) and stops. The client adapter is the *easy* half. The hard, unscoped half is the
   **server-side event translation layer** — agent-native emits a custom event taxonomy
   (`tool_start`/`tool_done`/`activity`/`agent_call`/`auto_continue`/`loop_limit`/`clear` …) that
   has **no 1:1 mapping** to AG-UI's lifecycle/text/tool/state events. That translator is a real
   build the spec does not name, size, or own.
2. It asserts the owned SDUI vocabulary (`ui.tree.render`/`ui.action.invoke`) "rides over" AG-UI —
   but **AG-UI defines no generative-UI/component-render event** (verified docs.ag-ui.com/concepts/events,
   2026-06-01). UI must travel as either a `Custom` event or a tool-call result. The spec never
   says which, and that choice is the entire contract for `@jami-studio/ui`'s render path.
3. It never asks the Principled-Edge question in earnest: **agent-native's native SSE+state model
   already works and is hardened.** Is AG-UI net-additive, or is it bloat we're adopting because
   the canon named it? My judgment: it is *justified but not free*, and the justification is
   ecosystem/transport-maintenance, not capability. The spec should say that out loud.

Nothing here is blocking-fatal. The direction survives. But "rebind transport to AG-UI (adapter
swap)" is a one-line hand-wave over a translator + a UI-payload contract decision + a
backpressure/reconnect re-derivation. Size them or the estimate is wrong.

---

## CURRENT 2026 STATE OF AG-UI (verified, dated)

- **Protocol / maintainer / license:** AG-UI ("Agent-User Interaction Protocol"), org
  `ag-ui-protocol` on GitHub, originated from **CopilotKit**, **MIT** licensed
  (assistant-ui.com/docs/runtimes/ag-ui; github.com/ag-ui-protocol/ag-ui — fetched 2026-06-01).
  Latest GitHub release labeled **"Release 2026-05-29"** (fetched 2026-06-01). Adoption is real and
  current: **AWS added AG-UI support to Bedrock AgentCore Runtime (March 2026)**; **Microsoft Agent
  Framework docs include AG-UI integration**; Oracle announced Agent-Spec/A2UI support via CopilotKit
  AG-UI (blogs.oracle.com, 2026). This is a live, multi-vendor-backed transport, not a single-vendor
  bet — which is exactly the "ride upstream-maintained transport" property the canon (06 §6) wants.
- **Event schema (verified docs.ag-ui.com/concepts/events, 2026-06-01):**
  - Lifecycle: `RunStarted`, `RunFinished`, `RunError`, `StepStarted`, `StepFinished`
  - Text: `TextMessageStart`, `TextMessageContent`, `TextMessageEnd`, `TextMessageChunk`
  - Tool: `ToolCallStart`, `ToolCallArgs`, `ToolCallEnd`, `ToolCallResult`, `ToolCallChunk`
  - State: `StateSnapshot`, `StateDelta` (RFC-6902 JSON Patch), `MessagesSnapshot`
  - Reasoning: `ReasoningStart/End`, `ReasoningMessageStart/Content/End`, `ReasoningMessageChunk`,
    `ReasoningEncryptedValue`
  - Activity: `ActivitySnapshot`, `ActivityDelta`
  - Special: `Raw` (wrap external events), `Custom` (app-defined extensions)
  - **No dedicated generative-UI / component-render event.** Generative UI (A2UI, MCP Apps,
    Open-JSON-UI) is carried via **tool calls or `Custom` events** — confirmed by both the events
    doc and CopilotKit's `generative-ui` repo (github.com/CopilotKit/generative-ui, 2026).
- **Transports:** "Works with any event transport (SSE, WebSockets, webhooks, etc.)"
  (assistant-ui.com/docs/runtimes/ag-ui). SSE is the canonical default; binary not named as a
  first-class transport. This matters: agent-native is **already SSE** (run-manager.ts emits
  `data: {json}\n\n`), so the wire framing carries over; only the *event payloads* change.
- **TS SDK:** `@ag-ui/core` (events/types) + `@ag-ui/client` (`HttpAgent`). `@assistant-ui/react-ag-ui`
  wraps an `@ag-ui/client` `HttpAgent` in an assistant-ui runtime layered on `ExternalStoreRuntime`,
  parsing `TEXT_MESSAGE_*`, `TOOL_CALL_*`, `STATE_SNAPSHOT/DELTA`, `THINKING_*`/`REASONING_*` into
  assistant-ui messages, with attachments/speech/feedback/history via the standard adapter slots
  (assistant-ui.com/docs/runtimes/ag-ui/overview, fetched 2026-06-01).

---

## WHAT agent-native's TRANSPORT CONTRACT IS TODAY (ground truth, file-cited)

The current chat↔harness binding (the thing being rebound):

- **Client runtime:** `createAgentChatAdapter()` returns an assistant-ui `ChatModelAdapter`
  (`packages/core/src/client/agent-chat-adapter.ts:796`), imported from `@assistant-ui/react`
  (`:1`). `AssistantChat.tsx` mounts this runtime.
- **Request:** a single `POST /_agent-native/agent-chat` (`agent-chat-adapter.ts:809,1330`) with a
  JSON body — `{ message, displayMessage, history, structuredHistory, threadId?, mode?, model?,
  engine?, effort?, attachments?, references?, internalContinuation? }` (`:1335-1354`). Surface hint
  via header `x-agent-native-surface` (`:1055`). Response is `text/event-stream`; the run id comes
  back in the **`X-Run-Id` response header** (`:1506`).
- **Wire format:** server writes `data: ${JSON.stringify({ ...event, seq })}\n\n` per event, plus
  `: ping ${ts}\n\n` keepalives and a terminal `data: {type:"done",seq}` (run-manager.ts:514-516,
  534-536, 597-599, 652-654, 686-691). Endpoint sets `Content-Type: text/event-stream`,
  `Cache-Control: no-cache`, `Connection: keep-alive` (agent-chat-plugin.ts:5718-5720).
- **The bespoke event vocabulary** (`SSEEvent`, `sse-event-processor.ts:17-44`; processed at
  `processEvent` `:230`): `text`, `activity`, `tool_start`, `tool_done`, `agent_call`,
  `agent_call_text`, `agent_task`/`agent_task_update`/`agent_task_complete`, `missing_api_key`,
  `loop_limit`, `auto_continue`, `error`, `done`, `clear`. Each event carries an optional `seq`.
  MCP-App payloads ride on `tool_done` as `ev.mcpApp` (`:333`, typed `AgentMcpAppPayload`).
- **Reconnect / resume contract** (this is the part that is genuinely sophisticated and that AG-UI
  does NOT give you for free):
  - `GET {apiUrl}/runs/:id/events?after=N` — replay-by-seq reconnect (`agent-chat-adapter.ts:1068`;
    server `agent-chat-plugin.ts:5702-5722` via `subscribeToRun(runId, after)`).
  - `GET {apiUrl}/runs/active?threadId=X` — find the live run for a thread after a page reload
    (`:1156`; server `:5724-5753`).
  - `POST {apiUrl}/runs/:id/abort` (`:1133`).
  - Client-side auto-continuation state machine: `AgentAutoContinueSignal` with reasons
    `run_timeout|loop_limit|no_progress|stream_ended|stale_run` (`sse-event-processor.ts:46-66`),
    a 75s no-progress watchdog (`:68`, `readChunkWithProgressTimeout`), and bounded continuation
    budgets (`agent-chat-adapter.ts:66-80`). This is the harness's reconnect *resilience*, encoded
    on the client against the bespoke vocabulary.
- **Shared state:** `application_state` `(session_id,key)→JSON` KV polled by the UI (appearance,
  pending selection) — `ui-registry-appearance.md` and engine-harness-memory.md confirm this is
  separate from the chat SSE channel.

So the contract = **one POST that opens an SSE stream + three reconnect GETs + a header-borne run
id + a client-side continuation state machine + a side-channel KV poll.** That is materially more
than "an SSE endpoint."

---

## HOLES (with where)

**H1 — The server-side event translator is unnamed and unsized. [the central hole]**
recommendation.md §3 final block and §5 both say "rebind transport to AG-UI (adapter swap on the
SSE/endpoint contract)." There is no adapter that turns agent-native's `SSEEvent` taxonomy into
AG-UI events; it must be written. The mapping is *not* 1:1 (see the map below). This is the actual
build, and it lives server-side in/around `run-manager.ts:500-700` + `agent-chat-plugin.ts:5702-5722`,
not in the client. The spec budgets zero for it.

**H2 — The SDUI-over-AG-UI carriage is undefined. [contract hole]**
The canon (06 §6) commits `ui.tree.render`/`ui.action.invoke` as the owned vocabulary "riding over"
AG-UI carrying A2UI/MCP-Apps payloads. AG-UI has **no render event**. So the spec must choose, and
has not: (a) carry SDUI as a `Custom` event (`{ name: "ui.tree.render", value: <tree> }`), or
(b) carry it as a `ToolCallResult` (mirroring how agent-native already attaches `mcpApp` to
`tool_done`). This is THE ui render-path contract and it is currently a blank. Recommended
default: `Custom` for proactive agent-pushed UI, `ToolCallResult` for tool-returned UI — but that is
a decision to make and prototype, not assume.

**H3 — Reconnect/resume parity under AG-UI is not addressed.**
agent-native's reconnect is `after=seq` replay + `runs/active` recovery + a client continuation
machine (above). AG-UI's resilience primitives are different: it leans on `StateSnapshot`/`StateDelta`
and `MessagesSnapshot` for re-sync, and `RunStarted`/`RunFinished`/`RunError` for lifecycle. The spec
does not say whether we (a) keep agent-native's seq-replay endpoints *underneath* AG-UI and only
translate the forward event stream, or (b) adopt AG-UI's snapshot/delta re-sync model and retire the
seq machine. These are very different amounts of work and risk. Unaddressed.

**H4 — `application_state` polling is orthogonal but unmentioned in the rebind.**
The UI's shared-state channel (appearance, selection context) is a *poll of `application_state`*, not
part of the SSE stream. AG-UI has a first-class `StateSnapshot`/`StateDelta` mechanism that is the
*natural* home for exactly this. The spec treats AG-UI as only the chat channel and silently leaves
the KV poll in place — a missed consolidation and an undefined seam. Either justify keeping the poll
or fold it into AG-UI state events; don't leave it implicit.

**H5 — `auto_continue`/`loop_limit`/`stale_run` have no AG-UI equivalent.**
These are agent-native-internal lifecycle signals that drive the client's continuation budget. AG-UI
has `RunFinished`/`RunError`/`StepFinished` but nothing matching "I hit an internal step budget,
please re-POST to continue." Either (a) these stay server-internal and never cross the AG-UI wire
(server handles continuation, emits only clean lifecycle), or (b) they become `Custom` events. Option
(a) is cleaner and is likely the right move — but it means *rewriting where continuation lives*
(today it is a **client** state machine in `agent-chat-adapter.ts`). That relocation is unscoped.

**H6 — `@assistant-ui/react-ag-ui` capability gaps vs the current surface are unverified.**
The current surface uses assistant-ui features that must survive the runtime swap: Tiptap composer,
attachments (`extractAttachmentsFromMessage`), `requestMode` plan/act metadata
(`agent-chat-adapter.ts:835-866`), per-message run-id surfacing ("Copy Request ID"), activity-trail
metadata (`sse-event-processor.ts:570-598`), sub-agent task chips (`agent_task*` CustomEvents). The
adapter doc says attachments/speech/feedback/history are supported via standard slots, but **plan/act
mode, run-id-per-message, and the sub-agent chip channel are bespoke** and their survival across the
AG-UI runtime is unverified. Carry as a fork-time/spike check.

**H7 — Version-drift compounding.** Two fast-movers stack: agent-native (0.23.0 clone vs 0.32.0 npm)
AND AG-UI (release 2026-05-29) AND `@assistant-ui/react-ag-ui` (changing weekly — "as of May 15,
2026"). The rebind sits on the seam between three independently-versioned, pre-1.0-ish moving parts.
The spec's version-drift note (recommendation.md §7) covers agent-native only.

---

## EVENT MAP: agent-native SSEEvent ↔ AG-UI (the work H1 hides)

| agent-native event (`sse-event-processor.ts`) | AG-UI target | Clean? |
|---|---|---|
| `text` (append) | `TextMessageStart`/`Content`/`End` (or `TextMessageChunk`) | Clean, but **re-chunking required** — agent-native streams raw text deltas with no message-id framing; AG-UI requires start/end bracketing with a message id. |
| `tool_start` (`tool`,`input`) | `ToolCallStart` + `ToolCallArgs` | Clean. Note agent-native sends full `input` at once; AG-UI streams arg fragments — fine to send as one `ToolCallArgs`. |
| `tool_done` (`result`, `mcpApp`) | `ToolCallResult` | Clean for `result`; **`mcpApp` payload has no AG-UI field** → must become a `Custom`/tool-result convention (ties to H2). |
| `activity` (`label`,`tool`) | `StepStarted`/`StepFinished` OR `Custom` | Lossy — AG-UI steps are coarser than agent-native's free-text activity labels. Likely `Custom`. |
| `agent_call`/`agent_call_text` (sub-agent) | nested `ToolCall*` or `Custom` | No native multi-agent-call event; A2A is the inter-agent protocol, not AG-UI. `Custom`. |
| `agent_task*` (chips) | `Custom` | No equivalent. `Custom`. |
| `clear` (discard partial on retry) | (none) | **No equivalent.** AG-UI assumes forward progress; "discard and restart" is foreign. Must be handled server-side before emitting AG-UI, or as `Custom`. |
| `loop_limit`/`auto_continue` | (none) | No equivalent (see H5). Keep server-internal. |
| `error` (`errorCode`,`recoverable`,`upgradeUrl`) | `RunError` | Partial — AG-UI `RunError` carries message/code; agent-native's rich `recoverable`/`upgradeUrl`/auto-recover taxonomy (`sse-event-processor.ts:113-198`) is richer and drives client retry. Mapping loses fidelity unless extended via `Custom`. |
| `done` | `RunFinished` | Clean. |
| `missing_api_key` | `RunError` (+ `Custom` for CTA) | Partial. |
| `seq` (every event) | (none) | **No AG-UI field for monotonic replay seq.** This is the reconnect backbone (H3). Either keep it as an out-of-band header/`Custom`, or adopt AG-UI snapshot re-sync. |
| `X-Run-Id` header | `RunStarted.runId` / `threadId` | Clean — AG-UI carries run/thread ids in lifecycle events natively (an improvement). |
| `application_state` poll | `StateSnapshot`/`StateDelta` | Opportunity (H4), not currently mapped. |

Reading this table is the whole point: **~5 of agent-native's event kinds map cleanly, ~7 require
`Custom` events or server-side absorption, and 2 (`seq`-replay, `clear`) are structurally foreign to
AG-UI.** That is a translator with real semantic decisions, not a config swap.

---

## RISKS (severity + mitigation)

- **R1 [MED] Reconnect-resilience regression.** agent-native's seq-replay + continuation machine is
  battle-tested (incident-hardened budgets, 75s watchdog). A naive AG-UI rebind that drops the
  seq-replay endpoints risks losing mid-run reconnect after a dropped socket — a real UX regression
  on long agent runs. *Mitigation:* keep `runs/:id/events?after=N` + `runs/active` **underneath**
  AG-UI as the resume substrate; have the AG-UI server emit a `MessagesSnapshot`/`StateSnapshot` on
  reconnect rather than re-deriving the seq machine on the client. Prove in the spike (P2).
- **R2 [MED] SDUI-payload contract drift.** If `ui.tree.render` is carried as a `Custom` event and we
  don't version it, AG-UI/A2UI/MCP-Apps each evolving (A2UI is **v0.9 draft; v0.8 is the stable
  production rec** — a2ui.org, developers.googleblog.com, 2026) will desync our renderer. *Mitigation:*
  pin the owned vocabulary with an explicit `version` field inside the `Custom`/tool-result envelope
  (the canon already mandates "owned, versioned, audited vocabulary" — 06 §6); target **A2UI v0.8
  stable**, not v0.9 draft, for the first render path.
- **R3 [LOW→MED] assistant-ui runtime lock-in.** The rebind binds us to assistant-ui's AG-UI runtime,
  whose internals (`ExternalStoreRuntime` layering) change frequently. *Mitigation:* the canon's
  doctrine already covers this — we own the *vocabulary*, not the runtime; if `@assistant-ui/react-ag-ui`
  stalls, `@ag-ui/client` `HttpAgent` is usable directly and the surface is replaceable. Pin versions;
  don't fork the adapter.
- **R4 [LOW] Fidelity loss on errors/CTAs.** The `error` event's `upgradeUrl`/`errorCode`/recoverable
  taxonomy is product-meaningful (billing CTAs, auto-recover). Mapping to bare `RunError` loses it.
  *Mitigation:* carry the rich error envelope as `Custom` alongside `RunError`; keep the client's
  `isAutoRecoverableError` logic server-side.
- **R5 [LOW] Triple version drift.** (H7.) *Mitigation:* pin all three (agent-native fork, `@ag-ui/*`,
  `@assistant-ui/react-ag-ui`); add a contract test that asserts the translator emits a valid AG-UI
  event stream (schema-validate against `@ag-ui/core` types) so an upstream bump fails loudly.
- **R6 [LOW] Licensing — none.** AG-UI MIT, assistant-ui MIT, agent-native MIT, A2UI/MCP-Apps open.
  No constraint. (Recorded so the review is complete.)

---

## BETTER-SUITED ALTERNATIVES (steelmanned + judged)

**A1 — Keep agent-native's native SSE+state model; do NOT adopt AG-UI. [the real challenge]**
*Steelman:* It already works, is hardened (incident-born reconnect budgets), is fully owned, and
needs zero translator. Principled Edge says under- AND over-engineering both fail; adopting a second
event vocabulary plus a translator plus a `Custom`-event carriage for SDUI is *added surface* to
replicate behavior we already have. The canon named AG-UI, but a named transport you must shim SDUI
*around* (because it has no render event) is arguably bloat — we'd be carrying our real payload in
`Custom` events either way, which we could do over our own SSE with less machinery.
*Judgment:* **Reject, but narrowly — and the spec must earn it, not assert it.** AG-UI wins on
exactly one axis: it is the **upstream-maintained, multi-vendor (AWS/MS/Oracle/CopilotKit) transport**
the canon committed to so the UI channel tracks an industry revision instead of our private one — and
critically, **the client cost is near-zero** because the surface is already assistant-ui and the
official `@assistant-ui/react-ag-ui` adapter exists. So we get ecosystem-standard wire + interop
(any AG-UI client/inspector/tool works against our agents) for the price of one server-side
translator. That trade is positive. But it is *not* "free / config" — and if the translator + SDUI
carriage prove heavier than the spike predicts, the native model is a legitimate fallback, not a
failure. The spec should state the trade in these terms.

**A2 — Use `@ag-ui/client` `HttpAgent` directly, skip `@assistant-ui/react-ag-ui`.**
*Steelman:* Fewer layers, no assistant-ui-runtime coupling, direct control of event→message mapping.
*Judgment:* **Reject for v1.** We are *adopting* assistant-ui's surface (recommendation.md §5);
throwing away its runtime to hand-wire `HttpAgent` re-introduces the composer/attachments/history
plumbing we get for free. Keep `@assistant-ui/react-ag-ui`; hold `HttpAgent`-direct as the escape
hatch (R3).

**A3 — Carry SDUI via MCP Apps only (no AG-UI Custom render).**
*Steelman:* agent-native *already* renders MCP-Apps via `McpAppRenderer` and attaches `mcpApp` to
tool results; MCP Apps is standards-based and carries over untouched (recommendation.md §3). Maybe we
never need a separate `ui.tree.render` Custom event — let all agent UI be MCP-App payloads on tool
results.
*Judgment:* **Partially adopt.** For *tool-returned* UI, yes — ride `ToolCallResult`/MCP-Apps, it's
already built. But the canon's `ui.tree.render` implies *proactive, agent-pushed* SDUI not tied to a
tool call; that still needs a `Custom` event. So: MCP-Apps-on-tool-result for tool UI (free), `Custom`
`ui.tree.render` for proactive SDUI (the new, small, owned bit). This resolves H2.

**A4 — WebSocket transport instead of SSE.**
*Steelman:* bidirectional, better for human-in-the-loop interrupts (AG-UI has `INTERRUPT`/approval
semantics). *Judgment:* **Reject for v1.** agent-native is SSE end-to-end and SSE is AG-UI's canonical
transport; the request side is a plain POST. No current requirement needs server-push-initiated
interrupts that a POST can't serve. Revisit only if interactive approvals demand it.

---

## PROOF-OF-WORK NEEDED before green light

1. **P1 — Translator spike (de-risks H1, the map).** Write the server-side adapter that subscribes to
   one real agent-native run (`run-manager.ts` event stream) and re-emits it as a valid AG-UI event
   stream, schema-checked against `@ag-ui/core` types. Drive it with the existing
   `@assistant-ui/react-ag-ui` runtime against the existing `AssistantChat` surface. Success =
   text + one tool call + done render correctly with zero changes to the chat component. **This is the
   single highest-value spike; do it first.**
2. **P2 — Reconnect/resume under AG-UI (de-risks H3, R1).** Kill the socket mid-run; prove recovery.
   Decide explicitly: seq-replay endpoints retained underneath vs AG-UI snapshot/delta re-sync.
   Measure: does a long run survive a dropped connection without losing streamed content?
3. **P3 — SDUI render path (de-risks H2, resolves via A3).** Prototype both carriages: a proactive
   `Custom` `ui.tree.render` event AND a tool-returned MCP-App payload, both landing in the
   artifact/render panel. Confirm the `mcpApp`-on-tool-result path survives the AG-UI runtime. Pin the
   envelope `version`.
4. **P4 — Surface-feature parity audit (de-risks H6).** Verify across the AG-UI runtime swap:
   plan/act `requestMode`, run-id-per-message ("Copy Request ID"), activity trail, sub-agent task
   chips, attachments. Enumerate what `@assistant-ui/react-ag-ui` does NOT cover → those become small
   owned `Custom`-event handlers.
5. **P5 — Continuation relocation decision (de-risks H5).** Decide where the auto-continuation state
   machine lives post-rebind. Recommended: move it server-side so the AG-UI stream stays clean
   lifecycle-only; the client stops owning `AgentAutoContinueSignal`. Spike the server-side
   continuation loop.
6. **P6 — Contract test (de-risks R5/H7).** A test that schema-validates the translator's output
   against pinned `@ag-ui/core` and fails on upstream drift. Lock versions of agent-native fork,
   `@ag-ui/*`, `@assistant-ui/react-ag-ui` at fork time.

---

## UNVERIFIED (carry as fork-time checks)

- **0.32.0 transport drift.** I read the 0.23.0 clone. Whether `run-manager.ts` SSE framing,
  `sse-event-processor.ts` vocabulary, or the `/runs/*` reconnect endpoints changed in 0.32.0 is
  undiffed. Re-verify the four transport files at fork time:
  `client/agent-chat-adapter.ts`, `client/sse-event-processor.ts`, `agent/run-manager.ts`,
  `server/agent-chat-plugin.ts`.
- **`@assistant-ui/react-ag-ui` exact coverage.** Confirmed to exist and to parse `TEXT_MESSAGE_*`/
  `TOOL_CALL_*`/`STATE_*`/`THINKING_*`/`REASONING_*` (assistant-ui.com/docs, fetched 2026-06-01), but
  its handling of `Custom` events, generative-UI render, and plan/act metadata was not exercised — must
  be proven in P1/P4, not assumed.
- **AG-UI complete event list / field-level schema.** The category list and ~16-count are verified
  (docs.ag-ui.com/concepts/events, 2026-06-01); exact required/optional fields per event (esp.
  `Custom.value` shape, `ToolCallResult` content typing) were not transcribed field-by-field — read the
  `@ag-ui/core` TS types directly before writing the translator.
- **`use-db-sync.ts` internals.** Cited by the UI pillar as part of the binding
  (`useDbSync`/`useFileWatcher`/`useScreenRefreshKey`) but not read this pass; confirm it is purely the
  `application_state`/file-watch poll (H4) and carries no chat-stream coupling.
- **A2UI version target.** v0.9 is draft; v0.8 is the stated stable production rec (a2ui.org / Google
  Developers Blog, 2026). The spec should pin v0.8 for the first render path; confirm at build time.

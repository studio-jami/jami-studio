# F08 — Transport & interop

Status: AUTHORED 2026-06-02 · Domain: B · Agent substrate
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/12-agent-native/spec-review/transport-agui.md`, `../../research/00-orchestration/{plan,synthesis}.md`
Related: F05 (harness), F09 (render seam rides the stream), F15 (MCP for AX)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

How data/events move agent↔UI and agent↔agent. **In:** internal + external transports, protocols. **Out:** what renders on top (F09).

## 2. Committed decisions (from canon)

- **Native SSE internal spine** (seq-replay + DB-sync) — kept; it's the attach mechanism for voice/render.
- **AG-UI external interop adapter** (`@assistant-ui/react-ag-ui`) — separately built. **Both built, neither optional.**
- **MCP** (tools/data) + **A2A** (inter-agent); **A2UI / MCP Apps** as portable UI payloads.
- We stand on open transport, never reinvent it.

## 3. Architecture & mechanics

**Two UI transports, both built, neither optional.**
- **Internal = native SSE spine (kept, not rebound).** agent-native's native Server-Sent-Events stream carries agent↔UI events with two capabilities AG-UI cannot model: **bounded seq-replay** (every event carries a monotonic seq; a client reconnecting/attaching mid-run replays from its last seq — the mechanism that lets the F11 voice supervisor *toggle on mid-run* and the F09 renderer recover) and a **global DB-sync channel** (state deltas pushed alongside events). This is *why* native SSE is kept over rebinding everything to AG-UI.
- **External = AG-UI interop adapter (separately built).** `@assistant-ui/react-ag-ui` is the **external** interop surface for third parties that speak AG-UI. It is an *adapter over* the native spine, not a replacement — a clean boundary: native SSE inside, AG-UI at the edge.

**The owned vocabulary rides above the transport.** The SDUI/action vocabulary (`ui.tree.render`, `ui.action.invoke`, tool/action schemas — F09) is **versioned + audited independently of the transport** and rides over whichever channel. Transport = the pipe; vocabulary = the contract; F09 = the renderer. They never conflate.

**seq-replay contract.** Each event = `{ seq, type, payload }` with `seq` strictly monotonic per run. A consumer presents `Last-Event-ID` (its last seq) on attach/reconnect; the spine replays bounded history from that seq then resumes live. Bounded = a retained window (not infinite log) sufficient for reconnect + late-attach; older history is in the F07 run store. This single mechanism serves render recovery (F09), voice mid-run toggle (F11), and resilient reconnect.

**Agent↔agent + tools/data.**
- **MCP** (Model Context Protocol) — the tools/data surface; the first-class **MCP server** (F15) exposes harness capabilities as MCP tools (hosted + self-host).
- **A2A** (Agent-to-Agent, Linux Foundation v1.0, **Signed Agent Cards**) — inter-agent transport; the A2A task-store is part of the durable-orchestration shape (F05/F10 Option A+).
- **A2UI / MCP Apps** — portable UI payloads (a portable lane); MCP-UI iframes are the **untrusted third-party** lane only (F09), never the trusted render seam.

**We stand on open transport, never reinvent it.** MCP, A2A, AG-UI, SSE are adopted as-is; the moat is the owned vocabulary + governance (F06) above them, not the pipes.

## 4. Remaining peripheral decisions to cement

- **seq-replay contract (cemented):** monotonic per-run `seq`, `Last-Event-ID` attach/replay, bounded retained window + F07 run-store for deep history.
- **AG-UI adapter boundary (cemented):** native SSE internal, AG-UI as an edge adapter over it; never rebind internal to AG-UI.
- Final MCP/A2A spec pins verified at lock (both are versioned, moving — §7).

## 5. Dependencies & interfaces

- **F09 (render)** — the `UIPayload` stream rides this spine; render recovery uses seq-replay.
- **F11 (voice)** — the realtime supervisor subscribes to the native-SSE event stream to narrate + adjust, and toggles mid-run via seq-replay.
- **F05 (harness)** — emits events on the spine; the A2A task-store is part of the durable run shape.
- **F15 (AX)** — the MCP server is the agent-facing capability surface, exposed over this layer.
- **F07 (data)** — the DB-sync channel + deep event history.

## 6. Verification & closing criteria

- Native SSE streams agent events with monotonic per-run `seq`; a client attaching mid-run replays from its last seq then resumes live (proven for render + voice attach).
- The AG-UI adapter exposes the same run to an external AG-UI consumer without changing the internal spine.
- An MCP client lists + calls harness capabilities as MCP tools; an A2A peer exchanges a task with a Signed Agent Card.
- The DB-sync channel delivers a state delta alongside the event stream.
- MCP-UI iframe payloads are confined to the untrusted lane and never reach the trusted F09 renderer.

## 7. Risks & verify-at-build (dated 2026-06-02)

- **MCP spec is moving** (final core dated 2026-07-28 in the research trail) — pin the MCP SDK version; re-verify at lock.
- **A2A v1.0 (Linux Foundation) + Signed Agent Cards** — verify the current card/signing spec at build.
- **AG-UI / `@assistant-ui/react-ag-ui`** version drift — keep it strictly as an edge adapter so a bump never touches the internal spine.
- **Bounded seq-replay window sizing** — too small breaks late-attach/voice-toggle, too large wastes memory; size against the longest expected run + tune.

## 8. Sources

- `12-agent-native/spec-review/transport-agui.md` + `fact-finding-synthesis.md`, synthesis §3 (two UI transports), canon §2 (transport seam, voice & real-time).

# Anam Video Layer On The ElevenLabs Voice Slice — Research + Plan

Date: 2026-07-17 (revised same day after owner review)
Status: Planning only. No implementation approved yet. **The video-path
choice (§2) is OPEN for research and discussion — the client-side lean below
is a recommendation, not a decision.** Owner-ratified so far: persona ids
stay as stored (§1.4), and cross-app floating persistence is VITAL (§3.3),
not a deferrable nice-to-have.
Purpose: the Anam 5K contest demo (due in ~2 weeks) — a talking video avatar
agent floating over Hummingbird apps, running real workflows by voice.
Companions:
- `_ops/planning/roadmaps/real-time/2026-07-08-realtime-voice-avatar-roadmap.md` (Layer 3 = Anam avatar adapter)
- `_ops/planning/roadmaps/real-time/2026-07-13-voice-adapter-interface.md` (ratified adapter contract, slice-1 shape)
- `_ops/planning/research/feasibility-reports/avatar/2026-07-08-realtime-voice-video-avatar-feasibility.md`
- Working reference project: `C:\Users\james\orgs\oss\avatar-agent` (live at avatar.jami.studio)

## TL;DR

Video is an optional layer on the existing `elevenlabs-agent` engine, not a
new engine. Anam offers two official integration paths with ElevenLabs
agents. Key tension found (still open for discussion, §2): the simpler
server-side path documents **no client-tool support**, and our current tool
bridge is client tools — so the two candidate shapes are (A) client-side
audio passthrough that keeps the bridge as-is, or (B) server-side Anam with
the tool bridge reworked to server-reachable tools. A leans lower-risk for
the two-week window; B is simpler long-term and matches how the reference
project runs today. Either way the UI layer is the same: one persistent
`<video>` element extending the existing `RealtimeVoiceModeDock` (which
already has the hover-reveal controls pattern and panel-avoidance logic) —
floating bottom-right by default, draggable, docks large above the
transcript when the agent panel is open, expands to a centered
blurred-backdrop fullscreen view. Cross-app floating persistence is a VITAL
requirement (§3.3) and needs its own workstream, for voice and video alike.

## 1. What we verified (no assumptions)

### 1.1 The working reference project (`avatar-agent`)

Live, deployed, verified working voice+video. Key facts read from source:

- `apps/web/app/lib/provider-session.ts` — server mints an ElevenLabs signed
  URL (`GET /v1/convai/conversation/get-signed-url?agent_id=…`) then requests
  an Anam session token (`POST https://api.anam.ai/v1/auth/session-token`,
  `Authorization: Bearer <ANAM_API_KEY>`) with
  `{ personaConfig: { personaId }, environment: { elevenLabsAgentSettings:
  { signedUrl, agentId, userId?, dynamicVariables? } } }`. Keys stay
  server-side; client receives only `sessionToken`.
- `apps/web/app/ui/avatar-console.tsx` — client:
  `createClient(sessionToken)` from `@anam-ai/js-sdk`, listeners for
  `MESSAGE_STREAM_EVENT_RECEIVED` / `CONNECTION_ESTABLISHED` /
  `CONNECTION_CLOSED` / `ERROR`, then
  `client.streamToVideoElement("avatar-video")` into
  `<video id="avatar-video" autoPlay playsInline />`. Teardown =
  `client.stopStreaming()`.
- **Important limitation it demonstrates**: the reference wires
  `clientTools` ONLY on its direct-ElevenLabs (voice-only) path
  (`useConversation({ clientTools })` from `@elevenlabs/react`). Its Anam
  path (server-side integration) has NO client tools — consistent with
  Anam's documented limitation (below). The reference's tools were webhooks
  to its own `/api/access-stream`, so it never hit this wall for video.
- Deps: `@anam-ai/js-sdk` (npm `latest` = **4.21.0** as of 2026-07-17),
  `@elevenlabs/react` ^1.9.0. Hummingbird already ships
  `@elevenlabs/client@1.15.0` (npm latest 1.15.1).

### 1.2 Official Anam guidance (docs.anam.ai → anam.ai/docs, fetched 2026-07-17)

Anam's pipeline: STT → LLM → TTS → face generation, with bring-your-own at
any stage. Two official ElevenLabs-agent recipes exist in the Anam cookbook
(both by Anam staff, both with working GitHub repos):

**A. Server-side integration** (`anam.ai/cookbook/elevenlabs-server-side-agents`)
- Anam engine connects to the EL agent itself via the signed URL; the browser
  only runs the Anam SDK. Client code = plain turnkey Anam.
- Works: STT/LLM/TTS, expressive V3 voices, interruption handling, knowledge
  bases, **server-side tools (webhooks)**, conversation history, session
  recordings + transcripts in Anam Lab, lower latency (server-to-server).
- **Does NOT work: "Client tools (tools that execute in the browser) are not
  yet supported."** (verbatim from the recipe, Feb 2026.)
- Constraints: EL agent user-input audio format must be PCM 16000 Hz; signed
  URL short-lived (~15 min) — mint just-in-time.
- Per-session passthrough fields inside `elevenLabsAgentSettings`:
  `dynamicVariables`, `conversationConfigOverride`, `userId`,
  `customLlmExtraBody`.

**B. Client-side audio passthrough** (`anam.ai/cookbook/elevenlabs-expressive-voice-agents`)
- Browser runs BOTH SDKs. EL SDK owns the mic and the conversation
  (STT→LLM→TTS); Anam only renders the face from the TTS audio.
- Anam session token minted with
  `personaConfig: { avatarId, enableAudioPassthrough: true }` (no
  `elevenLabsAgentSettings`).
- Client: `createClient(sessionToken, { disableInputAudio: true })` →
  `streamToVideoElement("avatar-video")` →
  `createAgentAudioInputStream({ encoding: "pcm_s16le", sampleRate: 16000,
  channels: 1 })` (EL TTS→Anam format is fixed at PCM 16 kHz mono).
- EL side: `Conversation.startSession({ signedUrl, onAudio, onMessage,
  onModeChange, … })` — **must be WebSocket, not WebRTC** ("WebRTC delivers
  audio at 1x realtime — Anam needs chunks faster than that"; signed URLs
  default to WebSocket). `onAudio` base64 PCM chunks →
  `agentAudioInputStream.sendAudioChunk(chunk)`; buffer chunks until Anam's
  `SESSION_READY` fires; `endSequence()` when EL `onModeChange` →
  `listening`; `conversation.setVolume({ volume: 0 })` so audio plays only
  through the avatar's WebRTC stream.
- Interruption: Anam `TALK_STREAM_INTERRUPTED` event; EL stops generating on
  barge-in as normal.
- **Client tools keep working** — the EL SDK session is ours, unchanged.
- Anam explicitly recommends server-side "unless you have a specific need for
  client-side audio bridging (e.g. client tools)". We have exactly that need.

Other relevant official surfaces:
- Session-token API: `POST /v1/auth/session-token` (API-reference:
  sessions/create-session-token).
- Advisory concurrency pre-check: `GET` session concurrency status — org's
  concurrent-session limit, sessions in use, whether a new session can start
  ("intended … to gate a 'Start' button"). Use this to gate the video button
  gracefully instead of failing mid-mint.
- Video options page (`/docs/personas/session/video`): session video
  dimensions and initial quality are configurable.
- Transcript note: Anam says a future audio-passthrough version will carry
  transcript data inline; today the client-side path takes transcripts from
  the EL SDK (which we already do — our transcript registry is EL-driven, so
  nothing changes).

### 1.3 Current Hummingbird voice state (jami-studio core, shipped + verified)

- Server half (`packages/core/src/server/realtime-voice-elevenlabs.ts`,
  cores 0.99.6–0.99.11): session mint at
  `POST /_agent-native/realtime-voice/elevenlabs/session` → config-as-code
  PATCH of the EL agent → **WebRTC conversation token**
  (`GET /v1/convai/conversation/token`) → returns
  `{ token, agentId, toolNames }` + per-session capability header. Tool route
  at `/_agent-native/realtime-voice/elevenlabs/tool` reuses the upstream
  `createToolHandler` trust model.
- The pushed tool manifest is **all `type: "client"` tools** (line ~279) —
  navigation set + read-first bridge (`call-agent` A2A, 120 s timeout) +
  system tools riding the same `prompt.tools` array.
- Client half (`useElevenLabsRealtimeVoiceMode.tsx`, cores 0.99.12–0.99.13):
  `Conversation.startSession({ connectionType: "webrtc", conversationToken,
  clientTools })`; clientTools relay to the authenticated tool route with the
  capability header; transcripts via EL events into the shared transcript
  registry; audio levels; app-state sync
  (`application_state["realtime-voice-session"]`).
- Engine dispatch (`RealtimeVoiceEngineProvider.tsx`): ONE seam;
  `REALTIME_VOICE_ENGINE` env → `defaultEngine` in
  `/_agent-native/voice-providers/status`; live session pins its engine; the
  shared `RealtimeVoiceModeDock` is portalled to `document.body`.
- Dock (`RealtimeVoiceMode.tsx`): `fixed bottom-4 end-4`, zIndex 270,
  **controls already hidden until hover/focus** (`controlsVisible` +
  group-hover reveal), settings popover, end button, chat toggle, and
  `useChatPanelTranslation` already slides the dock out of the way of the
  open `.agent-sidebar-panel` (with a fullscreen-layout special case). The
  AgentPanel already has an `isFullscreen` Claude-style centered mode.
- So: the exact UX grammar the owner asked for (hover-reveal controls,
  panel-aware floating position) already exists in the dock — video extends
  it rather than inventing a parallel surface.

### 1.4 Accounts and env (names only — values live in `.env`, never committed)

jami-studio `.env` § "NEW IMPROVED ELEVENLABS AND ANAM KEYS" (lines ~124–159):

| Account | ElevenLabs | Anam | Status |
|---|---|---|---|
| jamie@yrka.io | key + agent id + agent name | key + persona id + persona name | ACTIVE (both) |
| jamienavinhill@gmail.com | — | key + persona id + persona name | ACTIVE (Anam) |
| james@jami.studio | key + agent id + agent name | commented out | EL active; **Anam credits depleted ~2 weeks** |

Hummingbird `.env` (lines ~132–138) has the voice-slice keys:
`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`,
`REALTIME_VOICE_ENGINE`.

⚠️ Config hazard found: the jami-studio section declares `ANAM_API_KEY` /
`ANAM_PERSONA_ID` **twice** (yrka block and jamienavinhill block, same
variable names, both uncommented). Dotenv semantics = one silently wins.
Before implementation, the section needs account-suffixed names (e.g.
`ANAM_API_KEY_YRKA`, `ANAM_API_KEY_JNH`) with ONE canonical unsuffixed pair
selected for the runtime, or comment out the standby block.

**Persona ids (owner-ratified 2026-07-17): the stored `ANAM_PERSONA_ID`
values are persona ids and stay exactly as stored — do not revert, rename,
or swap them for avatar ids.** The reference project already mints
successfully with `personaConfig: { personaId }`, so the server-side path
consumes them directly. Remaining research item: the audio-passthrough
recipe's example uses `personaConfig: { avatarId, enableAudioPassthrough }`;
confirm against the session-token API reference (or one probe mint) whether
passthrough also accepts `personaId` — expected yes, since a persona wraps
an avatar, but verify rather than assume. If passthrough truly requires a
bare avatar id, read the avatar id OFF the persona via the Anam API at mint
time; the env keeps the persona ids either way.

## 2. The video-path decision — OPEN (owner review 2026-07-17)

The factual finding stands and is verifiable: Anam's server-side EL recipe
states verbatim that client tools "are not yet supported", and every current
Hummingbird voice tool is an ElevenLabs *client* tool relayed by the browser
to `/_agent-native/realtime-voice/elevenlabs/tool` under the user's session
cookie + per-session capability token. What is NOT settled is which way to
resolve that tension. The owner is not yet sold on the client-side lean;
both paths stay on the table for research and discussion.

### Path A — client-side audio passthrough (keeps the bridge as-is)

EL SDK stays in the browser (clientTools, capability header, transcripts,
app-state untouched); Anam renders the face from forwarded TTS PCM.

- + Zero change to the tool trust model; smallest blast radius on the
  shipped voice slice; local dev keeps working unchanged.
- + Degrades cleanly: Anam fails → unmute EL speaker, call continues
  voice-only.
- − EL transport must switch WebRTC → WebSocket (signed URL) when video is
  on; mint route grows a transport variant.
- − Browser owns audio bridging (chunk forwarding, SESSION_READY buffering,
  endSequence) — more client moving parts; slightly higher latency.
- − No Anam Lab recordings/transcripts (ours live in the app anyway).

### Path B — server-side Anam integration (reference project's shape)

Anam's engine connects to the EL agent itself; browser runs only the Anam
SDK. This is exactly what `avatar-agent` runs in production today.

- + Simplest client (turnkey Anam), lowest latency (server-to-server
  audio), Anam Lab session recordings/transcripts, Anam's recommendation.
- − Client tools don't fire (per Anam's own docs). Our bridge would need
  tools the EL cloud can reach: EL webhook tools against a publicly
  reachable Hummingbird URL, with a per-session auth grant replacing the
  session-cookie relay. That is a real rework of the ratified trust model
  (adapter-contract: "never through provider-side integrations") and
  breaks local-dev tool calls (EL cloud can't reach 127.0.0.1) unless
  tunneled.
- ? Research item: the adapter interface already anticipates a "server
  worker" caller shape (tool-caller duality, decision #10, designed for the
  future LiveKit mode). A webhook tool route COULD be framed as that second
  caller shape rather than a violation — worth a design pass instead of
  dismissal.
- ? Research item: ask Anam (contest context helps) whether client-tool
  support server-side is near; their docs say "not yet", implying intent.

### Current read (recommendation, not decision)

**Owner clarification (2026-07-17, second review): the video feed itself
carries NO tools — it is a pure face render. Conversation, tools, STT/TTS,
and orchestration stay in our stack (the engine adapters and the developing
Layer-1/2 voice layers).** That requirement maps onto the paths as follows:

- Path A **is** that shape today: Anam receives audio and returns face
  video; it never sees a tool, a prompt, or a transcript source of truth.
  Durable bonus: an audio-passthrough face layer is engine-agnostic — ANY
  current or future conversation engine that can hand us TTS PCM
  (`elevenlabs-agent` now; `gemini-live`, the owned LiveKit engine later)
  drives the same face through the same Layer-3 adapter. The video layer
  never needs to know who is thinking.
- Path B is NOT just a video feed today: Anam brokers the EL conversation
  itself, which is exactly why browser client tools stop firing. B becomes
  compatible with the tool-less-feed requirement only if Anam ships
  client-tool passthrough, or if we deliberately move the tool surface
  server-side (the webhook caller-shape design in the research items).

So the clarification substantially settles the near-term shape: A matches
the stated requirement with zero rework; B stays a future option to
re-evaluate on its research items, not a two-week candidate. A is also the
lower-risk two-week path because it leaves the verified voice slice's tool
bridge untouched. The UI layer (§3.2) and most of the server mint work are
identical under both. Formal decision point stays where it was: before the
bridge slice (§4 slice 4).

## 3. Proposed design

### 3.1 Layering (follows the ratified adapter roadmap)

Anam = **Layer 3 avatar adapter**, composed onto the `elevenlabs-agent`
engine — NOT a third engine. New sibling pair, same pattern as the voice
slice. Most of this is identical under §2 Path A or B; path-specific pieces
are marked:

- **Server** `packages/core/src/server/realtime-voice-anam.ts`:
  - `POST /_agent-native/realtime-voice/anam/session` — same-origin + session
    auth; resolves `ANAM_API_KEY` (409 + setup guidance when missing); mints
    `POST /v1/auth/session-token` from the stored `ANAM_PERSONA_ID`
    (Path A: `personaConfig` + `enableAudioPassthrough` — personaId
    acceptance verified by the slice-2 probe per §1.4; Path B:
    `personaConfig: { personaId }` + `environment.elevenLabsAgentSettings`
    with a fresh EL signed URL, exactly the reference project's mint);
    returns `{ sessionToken }`. Optional advisory: proxy the Anam concurrency
    status so the client can gate the video entry.
  - *(Path A only)* Extend the EL session mint with a `transport` request
    field: `webrtc` (default, today's path) | `websocket` (returns
    `signed_url` from `GET /v1/convai/conversation/get-signed-url`) so a
    video session can ask for the WebSocket flavor in the same mint.
  - Status surface: `avatar: { anam: boolean }` added to
    `/_agent-native/voice-providers/status` (gates all video UI, exactly how
    `elevenlabs: true` gates the engine today).
- **Client** `packages/core/src/client/composer/useAnamAvatar.ts` (companion
  hook, not a new engine): owns the Anam client lifecycle —
  `createClient(sessionToken)`, `streamToVideoElement`,
  `TALK_STREAM_INTERRUPTED`, `stopStreaming`, and under Path A also the
  passthrough pieces (`disableInputAudio: true`, `SESSION_READY` buffering,
  `sendAudioChunk`, `endSequence`). *(Path A only)* The EL hook gains an
  optional `videoBridge` seam: when video mode is active it starts the
  session with `{ signedUrl }` (WebSocket), routes `onAudio` chunks to the
  bridge, calls `setVolume({ volume: 0 })`, and signals turn ends from
  `onModeChange`. Under Path B the EL browser session is replaced by the
  Anam client for video calls (tool-bridge rework per §2). Voice-only path
  bit-for-bit unchanged either way.
- **Env/config**: `ANAM_API_KEY`, `ANAM_PERSONA_ID` (as stored — §1.4),
  optional `REALTIME_VOICE_AVATAR=anam|off` deployment default.
  Follows the same `APP_PROVIDED_DEPLOY_CREDENTIAL_KEYS` treatment issue 64
  established for `ELEVENLABS_*`.

### 3.2 UI: one persistent video element, three placements

Owner's spec mapped to the existing dock architecture:

1. **Floating tile (panel closed)** — default. Lives in the same
   body-portalled fixed container as the dock (zIndex 270), directly above
   the control pill, bottom-right (`bottom-4 end-4`). Rounded ~16:9 tile,
   ~280–320 px wide. Draggable anywhere (pointer-event drag on the tile;
   position persisted to localStorage like the microphone preference). It
   inherits the dock's existing `useChatPanelTranslation` slide-away and the
   existing hover-reveal grammar: **no visible controls until hover/focus**,
   then the same pill (settings / hide-chat / end) plus a mute toggle and an
   expand button, uniform across placements.
2. **Docked in the panel (panel open)** — prominent slot above the
   transcript at the top of the AgentPanel thread area, wide (panel width
   minus padding). The dock already knows when the panel is open (it slides
   today); with video the tile relocates INTO the panel instead of sliding
   beside it.
3. **Fullscreen** — centered large view as a focused overlay with
   backdrop blur (`backdrop-blur` scrim), actions continuing underneath —
   NOT a Radix modal that traps focus/blocks the app; a non-modal overlay
   (shadcn styling, no focus trap, Esc + collapse button to exit), consistent
   with the seamless-UX rule that the user's workflow is never blocked.
   Reachable from tile hover-expand or the panel video header.

**Critical implementation rule — never remount the `<video>`.** Anam binds a
WebRTC MediaStream to the element (`streamToVideoElement(elementId)`);
a React remount black-frames or kills the stream. Standard technique: render
ONE stable `<video>` in a persistent portal container and *reparent the DOM
container* (or reposition it fixed with FLIP transforms) as placement
changes float ⇄ panel ⇄ fullscreen. `element.appendChild` reparenting
preserves MediaStream playback; React must treat the container as an opaque
ref, not re-render children across parents. This is the one genuinely
delicate piece of the UI work and should be built and tested first.

### 3.3 Trigger and lifecycle

- **Start**: the voice entry (composer mic affordance) becomes a split
  entry when `avatar.anam` is true: "Start voice mode" / "Start video call".
  Video choice is made **at session start** — under either §2 path the
  transports differ between voice-only and video calls, so a live voice
  session cannot hot-upgrade to video without a reconnect. (A later "add
  video" mid-call affordance = graceful end + auto-restart; out of MVP.)
- **Connect sequence** *(shape shown for Path A; Path B is the reference
  project's simpler mint-then-stream)*: mint Anam token + EL signed URL
  in parallel → create Anam client, register listeners, `streamToVideoElement`
  → start EL session (WebSocket, clientTools) → buffer `onAudio` until
  `SESSION_READY` → mute EL speaker. State machine reuses the existing dock
  states (`connecting|listening|speaking|working|error|ending`).
- **End**: dock End button (hover-revealed) ends the session (EL
  `endSession` where applicable + Anam `stopStreaming()`). Under Path A an
  Anam `CONNECTION_CLOSED`/`ERROR` degrades to voice-only (unmute EL) with
  a transient dock notice, never a dead call; under Path B a failed video
  session offers a one-click voice-only restart.
- **Mute**: mic mute stays an EL-side concern (same as today); the tile's
  hover controls expose it uniformly.
- **Across apps/navigation — VITAL requirement (owner, 2026-07-17)**:
  within an app, SPA navigation keeps the session alive (the dock portal
  survives; video inherits this). **Across workspace apps (`/mail` →
  `/calendar`) is a document navigation — the WebRTC/WebSocket sessions die
  with the page.** This gap exists for voice today too. The owner has
  ratified cross-app floating persistence as vital, for voice and video
  alike — it is a required workstream, not a deferrable extra. Candidate
  mechanisms to research (not mutually exclusive; a demo can layer them):
  1. **Read-first bridge (exists now)**: the avatar answers cross-app
     questions headlessly via `call-agent` (A2A) without navigating. Real
     and shipped, but it is a *complement* to persistence, not a substitute
     — the requirement is the call surviving actual app switches.
  2. **Session re-attach**: persist call intent + position in
     `sessionStorage`/app-state; auto-restart the session after a cross-app
     load. Cheapest true-persistence approximation; visible reconnect gap
     (needs measuring — EL WebSocket mint + Anam attach are both fast).
     Research: whether an EL conversation can be *resumed* (same
     conversation id / history) rather than restarted cold.
  3. **Persistent shell**: a workspace-level layer that owns the call while
     apps swap beneath it. Candidates already in the codebase family:
     the workspace gateway serving a thin persistent top frame with apps in
     an iframe/embedding surface (`packages/frame` / `packages/embedding`,
     `AgentNativeFrame` already declares `allow="microphone"`), or the
     desktop app shell where it applies. Strongest UX (zero interruption);
     real architectural work — needs its own design note sizing it against
     the two-week window and the unified-runtime roadmap (owner decision
     recorded there before adding lanes).
  4. **Document-PiP escape hatch**: the browser Document
     Picture-in-Picture API can host the `<video>` in an OS-level floating
     window that survives page navigations of the opener only in specific
     conditions — verify honestly against current Chrome behavior before
     counting on it (the mic/WebSocket owner still dies with the page; this
     likely only helps visuals, so treat as research, not a plan pillar).
  The demo needs at least mechanism 2 working; mechanism 3 is the durable
  answer and should be scoped in its own follow-up design note.
- **Concurrency/cost gating**: pre-check Anam's concurrency-status advisory
  before showing "Start video call" as available; per-minute Anam credits
  burn only while a session is live — end sessions eagerly on idle timeout
  (EL agent timeout settings already govern this).

### 3.4 What does NOT change

- Voice-only mode remains the default; `REALTIME_VOICE_ENGINE` semantics
  unchanged; OpenAI engine dormant as before.
- Under Path A additionally: tool bridge, capability trust model,
  allow-list, redaction, and the transcript pipeline (EL `onMessage` →
  transcript registry) are all untouched — we skip Anam's message-stream
  events and the recipe's char-timing sync (optional polish, deferred).
  Under Path B the tool bridge and transcript source are exactly what
  changes — see §2 before treating them as stable.
- ElevenLabs dashboard stays config-as-code target; one addition to check:
  EL agent's *output* format to the SDK is fixed PCM 16 kHz for the bridge
  (recipe confirms this is the fixed default — verify at implementation).

## 4. Build order (proposed slices, each independently verifiable)

Slices 1–3 are path-agnostic (identical under §2 Path A or B); the A-vs-B
decision is only needed before slice 4.

1. **Env hygiene** — de-duplicate the Anam key block (suffixed names + one
   canonical selection). Persona ids stay as stored (owner-ratified). Stage
   `ANAM_API_KEY`/`ANAM_PERSONA_ID` in hummingbird `.env`. No spend.
2. **Server slice** — `realtime-voice-anam.ts` mint + status flag (+ the EL
   mint `transport: "websocket"` variant if Path A). Verify with HTTP
   probes (mint 200, token shape) — one Anam token mint is negligible spend
   but still an Anam API call: flag before running. This probe also settles
   the personaId-in-passthrough question (§1.4) with zero session minutes.
3. **Video surface slice** — the persistent-element tile with placement
   moves (float ⇄ panel ⇄ fullscreen ⇄ drag) built against a stub
   MediaStream (e.g. canvas `captureStream()`) so ALL UI work happens with
   ZERO provider spend and full Playwright coverage. Includes the
   cross-app **session re-attach** mechanism (§3.3 item 2) — testable with
   the stub stream too.
4. **Bridge slice** *(A-vs-B decision gate)* — live conversation wiring per
   the chosen path + degrade-to-voice. First live end-to-end video session
   (real Anam + EL spend — owner approval per session, per charter).
5. **Demo polish** — first-message/greeting, persona naming, dock
   affordance copy, concurrency gate, idle teardown, demo script across
   2–3 hummingbird apps (cross-app persistence via re-attach + read-first
   bridge).
6. **Persistent shell design note** (parallel, planning-only) — scope the
   durable cross-app answer (§3.3 item 3) against the unified-runtime
   roadmap; owner decision before any build.

Slices 1–3 consume no Anam credits. Slice 4 is where live verification
starts; the depleted james@jami.studio Anam account returns in ~2 weeks —
schedule live testing on the yrka.io account (active for BOTH providers,
matching the demo agent) and keep jamienavinhill as the fallback Anam
account.

## 5. Open questions / research items

1. **Path A vs B (§2)** — substantially narrowed by the owner's tool-less
   video-feed clarification (see §2 Current read): A matches the stated
   requirement today; B's research items (webhook caller-shape design,
   Anam server-side client-tool timing — worth asking directly given the
   contest) stay open for the long-term shape, not the two-week window.
2. **personaId in passthrough mint (§1.4)** — expected to work; settle with
   the slice-2 probe. Persona ids themselves are settled: keep as stored.
3. **Cross-app persistence depth for the demo (§3.3)** — discussion opened
   2026-07-17: the owner plans ONE unified shell with a domain-grouped,
   user-adjustable sidebar (unified workspaces vs disparate apps). See the
   companion note
   `_ops/planning/roadmaps/workspace/2026-07-17-unified-shell-and-sidebar-discussion.md`.
   Interim question stands: is re-attach acceptable for the contest video,
   or does a minimal shell spike get pulled forward?
4. **Default placement when panel is open at start**: dock into panel
   automatically (proposed) or stay floating until user docks it?
5. **Mid-call video toggle**: accept "choose at start" for MVP? (Hot-upgrade
   = reconnect; doable later behind the same seam.)
6. **Demo scope**: which 2–3 hummingbird apps/workflows for the contest
   script? (Shapes which read actions join the EL allow-list.)
7. **Core vs app**: this lands in jami-studio `packages/core` like the voice
   slice (hummingbird consumes via version bump) — confirm that's still the
   intended flow for the contest timeline.

## 6. Sources

- Anam docs index: https://anam.ai/docs/ (+ llms.txt index)
- Server-side EL recipe: https://anam.ai/cookbook/elevenlabs-server-side-agents
  (client-tools limitation verbatim; PCM 16 kHz; signed-URL TTL; per-session fields)
- Client-side EL recipe: https://anam.ai/cookbook/elevenlabs-expressive-voice-agents
  (audio passthrough, `enableAudioPassthrough`, `disableInputAudio`,
  WebSocket-not-WebRTC requirement, SESSION_READY buffering, interruption)
- Anam API reference: session token, session concurrency status, video options
  (via docs index)
- npm registry (2026-07-17): `@anam-ai/js-sdk@4.21.0`, `@elevenlabs/client@1.15.1`
- Working reference: `C:\Users\james\orgs\oss\avatar-agent` (provider-session.ts,
  avatar-console.tsx, .env.example)
- Current state: jami-studio `packages/core/src/server/realtime-voice-elevenlabs.ts`,
  `packages/core/src/client/composer/{useElevenLabsRealtimeVoiceMode,RealtimeVoiceMode,RealtimeVoiceEngineProvider}.tsx`;
  hummingbird `docs/operations/{verification-log,issue-log,agent-memory}.md`

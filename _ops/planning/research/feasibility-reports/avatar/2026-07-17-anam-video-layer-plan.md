# Anam Video Layer On The ElevenLabs Voice Slice — Research + Plan

Date: 2026-07-17
Status: Planning only. No implementation approved yet.
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
agents. **The server-side path does not support client tools — and our entire
tool bridge is client tools.** So Hummingbird must use the **client-side audio
passthrough path**: keep `@elevenlabs/client` in the browser exactly as today
(client-tool relay, capability header, transcripts all unchanged), switch the
EL transport from WebRTC to WebSocket when video is on, mute the EL speaker,
and forward the TTS PCM chunks into an Anam audio-passthrough session that
renders the face into one persistent `<video>` element. UI-wise the video tile
is an extension of the existing `RealtimeVoiceModeDock` (which already has the
hover-reveal controls pattern and panel-avoidance logic): floating
bottom-right by default, draggable, docks large above the transcript when the
agent panel is open, and expands to a centered blurred-backdrop fullscreen
dialog. Chosen at session start ("Start video call" next to "Start voice
mode"), because the EL transport differs between the two modes.

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
selected for the runtime, or comment out the standby block. Also note the
Anam persona id vs avatar id distinction: server-side recipes use
`personaConfig.personaId` (Anam Lab persona = face+voice+LLM bundle) while
audio-passthrough uses `personaConfig.avatarId` (face only) — verify which id
type the stored `ANAM_PERSONA_ID` values are before mint code is written
(the 2026-06-26 capabilities probe already caught an Anam UUID living in
`ELEVENLABS_VOICE_ID` once).

## 2. The decisive architecture finding

**Anam's server-side EL integration cannot run our tool bridge.** Every
Hummingbird voice tool is an ElevenLabs *client* tool relayed by the browser
to `/_agent-native/realtime-voice/elevenlabs/tool` under the user's real
session cookie + per-session capability token. That trust model is
deliberate (adapter-contract decision: "never through provider-side
integrations") and it is what makes the demo interesting — the avatar
actually drives workflows. The server-side path would force converting tools
to EL webhooks pointing at a publicly reachable URL, losing the
session-cookie trust model and breaking local dev (EL cloud cannot reach
127.0.0.1). Not acceptable, not needed.

**Therefore: client-side audio passthrough is the path.** Consequences:

1. The EL conversation stays 100% ours — clientTools, capability header,
   transcripts, app-state, read-first bridge guidance: all untouched.
2. The EL transport must be **WebSocket (signed URL)** when video is on;
   today's voice-only path is WebRTC (conversation token). Both are
   first-class in `@elevenlabs/client`; the mint route needs to return a
   signed URL variant when video is requested.
3. Anam is additive and optional by construction: video session fails →
   degrade to voice-only (EL speaker unmuted) without dropping the call.
4. Two extra moving parts in the browser (chunk forwarding + ready
   buffering), both small and fully specified by the official recipe.
5. Trade-offs vs server-side we accept: slightly higher latency (audio hops
   through the browser), no Anam Lab recordings/transcripts (ours live in
   the app anyway). When Anam ships client-tool support server-side
   (they say "not yet"), we can revisit — the seam (mint route flag) makes
   that a server-only change.

## 3. Proposed design

### 3.1 Layering (follows the ratified adapter roadmap)

Anam = **Layer 3 avatar adapter**, composed onto the `elevenlabs-agent`
engine — NOT a third engine. New sibling pair, same pattern as the voice
slice:

- **Server** `packages/core/src/server/realtime-voice-anam.ts`:
  - `POST /_agent-native/realtime-voice/anam/session` — same-origin + session
    auth; resolves `ANAM_API_KEY` (409 + setup guidance when missing); mints
    `POST /v1/auth/session-token` with
    `personaConfig: { avatarId: <ANAM_AVATAR_ID>, enableAudioPassthrough: true }`;
    returns `{ sessionToken }`. Optional advisory: proxy the Anam concurrency
    status so the client can gate the video entry.
  - Extend the EL session mint with a `transport` request field:
    `webrtc` (default, today's path) | `websocket` (returns
    `signed_url` from `GET /v1/convai/conversation/get-signed-url`) so a
    video session can ask for the WebSocket flavor in the same mint.
  - Status surface: `avatar: { anam: boolean }` added to
    `/_agent-native/voice-providers/status` (gates all video UI, exactly how
    `elevenlabs: true` gates the engine today).
- **Client** `packages/core/src/client/composer/useAnamAvatar.ts` (companion
  hook, not a new engine): owns the Anam client lifecycle
  (`createClient(sessionToken, { disableInputAudio: true })`,
  `streamToVideoElement`, `SESSION_READY` buffering, `sendAudioChunk`,
  `endSequence`, `TALK_STREAM_INTERRUPTED`, `stopStreaming`). The EL hook
  gains an optional `videoBridge` seam: when video mode is active it starts
  the session with `{ signedUrl }` (WebSocket), routes `onAudio` chunks to
  the bridge, calls `setVolume({ volume: 0 })`, and signals turn ends from
  `onModeChange`. Voice-only path bit-for-bit unchanged.
- **Env/config**: `ANAM_API_KEY`, `ANAM_AVATAR_ID` (verify id type per
  §1.4), optional `REALTIME_VOICE_AVATAR=anam|off` deployment default.
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
  Video choice is made **at session start** because the EL transport differs
  (WebSocket vs WebRTC) — a live voice session cannot hot-upgrade to video
  without a reconnect. (A later "add video" mid-call affordance = graceful
  end + auto-restart with transport swap; out of MVP.)
- **Connect sequence** (mirrors the recipe): mint Anam token + EL signed URL
  in parallel → create Anam client, register listeners, `streamToVideoElement`
  → start EL session (WebSocket, clientTools) → buffer `onAudio` until
  `SESSION_READY` → mute EL speaker. State machine reuses the existing dock
  states (`connecting|listening|speaking|working|error|ending`).
- **End**: dock End button (hover-revealed) ends both: EL `endSession` +
  Anam `stopStreaming()`. Anam `CONNECTION_CLOSED`/`ERROR` → degrade to
  voice-only (unmute EL) with a transient dock notice, never a dead call.
- **Mute**: mic mute stays an EL-side concern (same as today); the tile's
  hover controls expose it uniformly.
- **Across apps/navigation**: within an app, SPA navigation keeps the
  session alive (the dock portal survives; this is what "floats across
  navigation" means today for voice, and video inherits it). **Across
  workspace apps (`/mail` → `/calendar`) is a document navigation — the
  WebRTC/WebSocket sessions die with the page.** True cross-app floating is
  not implemented for voice either; honest options, in order:
  1. **MVP/demo posture**: lean on the read-first bridge — the avatar
     answers cross-app questions headlessly via `call-agent` (A2A) without
     navigating, and drives in-app workflows within one app per scene. This
     is already the ratified seamless-UX design and demos beautifully.
  2. **Session re-attach**: persist intent in `sessionStorage`, auto-restart
     the video session after cross-app load (brief visible reconnect).
  3. **Persistent shell**: a workspace-level frame that owns the call while
     apps swap beneath it — real work, roadmap-scale, do not build for the
     contest.
- **Concurrency/cost gating**: pre-check Anam's concurrency-status advisory
  before showing "Start video call" as available; per-minute Anam credits
  burn only while a session is live — end sessions eagerly on idle timeout
  (EL agent timeout settings already govern this).

### 3.4 What does NOT change

- Tool bridge, capability trust model, allow-list, redaction — untouched.
- Transcript pipeline (EL `onMessage` → transcript registry) — untouched;
  we skip Anam's message-stream events and the recipe's char-timing sync
  (optional polish, explicitly deferred).
- Voice-only mode remains the default; `REALTIME_VOICE_ENGINE` semantics
  unchanged; OpenAI engine dormant as before.
- ElevenLabs dashboard stays config-as-code target; one addition to check:
  EL agent's *output* format to the SDK is fixed PCM 16 kHz for the bridge
  (recipe confirms this is the fixed default — verify at implementation).

## 4. Build order (proposed slices, each independently verifiable)

1. **Env hygiene** — de-duplicate the Anam key block (suffixed names + one
   canonical selection), confirm which stored ids are persona vs avatar ids,
   stage `ANAM_API_KEY`/`ANAM_AVATAR_ID` in hummingbird `.env`. No spend.
2. **Server slice** — `realtime-voice-anam.ts` mint + status flag +
   EL mint `transport: "websocket"` variant. Verify with HTTP probes
   (mint 200, token shape) — one Anam token mint is negligible spend but
   still an Anam API call: flag before running.
3. **Video surface slice** — the persistent-element tile with placement
   moves (float ⇄ panel ⇄ fullscreen ⇄ drag) built against a stub
   MediaStream (e.g. canvas `captureStream()`) so ALL UI work happens with
   ZERO provider spend and full Playwright coverage.
4. **Bridge slice** — `useAnamAvatar` + EL WebSocket path + chunk
   forwarding + degrade-to-voice. First live end-to-end video session
   (real Anam + EL spend — owner approval per session, per charter).
5. **Demo polish** — first-message/greeting, persona naming, dock
   affordance copy, concurrency gate, idle teardown, demo script across
   2–3 hummingbird apps using the read-first bridge.

Slices 1–3 consume no Anam credits. Slice 4 is where live verification
starts; the depleted james@jami.studio Anam account returns in ~2 weeks —
schedule live testing on the yrka.io account (active for BOTH providers,
matching the demo agent) and keep jamienavinhill as the fallback Anam
account.

## 5. Open questions for the owner

1. **Persona vs avatar id**: audio-passthrough wants an `avatarId`. Are the
   stored `ANAM_PERSONA_ID` values Lab personas (face+voice+LLM) or bare
   avatar ids? (Read from lab.anam.ai; determines mint payload.)
2. **Default placement when panel is open at start**: dock into panel
   automatically (proposed) or stay floating until user docks it?
3. **Mid-call video toggle**: accept "choose at start" for MVP? (Hot-upgrade
   = reconnect; doable later behind the same seam.)
4. **Demo scope**: which 2–3 hummingbird apps/workflows for the contest
   script? (Shapes which read actions join the EL allow-list.)
5. **Core vs app**: this lands in jami-studio `packages/core` like the voice
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

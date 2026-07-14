# Voice Adapter Interface — Design Note (Slice 1)

Date: 2026-07-13
Status: Ratified design for the first `elevenlabs-agent` slice.
Companions: `2026-07-08-realtime-voice-avatar-roadmap.md` (Layer 1/4),
`2026-07-12-voice-engine-decisions.md` (decisions 1–10).

## Adapter contract (Layer 1, sharpened)

An engine adapter is a pair of sibling modules — one server, one client —
that speak a provider-neutral surface and stay silent about WHO is thinking:

- **Events (adapter → app)**: transcript events (`user`/`assistant`, partial +
  final), turn state (`connecting|listening|speaking|working|error|ending`),
  tool-call requests (`{name, callId, args}`), lifecycle
  (`started|ended|failed`), audio levels.
- **Commands (app → adapter)**: `start`, `end`, `interrupt`, `mute`,
  `setMicrophone`, `updateTools` (engines that support mid-session manifest
  updates only).
- **Tool bridge**: every tool call resolves through the app's authenticated
  `/tool` route contract (capability header, allow-list, redaction, size caps,
  approval-to-chat) — never through provider-side integrations.

Engines implementing the contract: `openai-realtime` (upstream, dormant),
`elevenlabs-agent` (this slice), `gemini-live` (next), future owned LiveKit
engine.

## Tool-caller duality (decision #10)

The `/tool` route contract must support two caller shapes:

1. **Browser relay** (ElevenLabs mode, OpenAI mode): the provider surfaces the
   tool call in the browser (client tool / data-channel event); the browser
   POSTs to `/tool` under the user's real session cookie plus the
   per-session capability token minted at session start.
2. **Server worker** (future LiveKit mode): the agent worker runs
   server-side; a LiveKit room token identifies the user, and the worker calls
   the same executor surface with an equivalent capability grant.

Both callers hit the same executor (`executeAgentToolCall`) and identical
validation/redaction. Slice 1 exercises caller shape 1 only; the capability
store API is deliberately caller-agnostic (email + org + tab + allow-list).

## Config-as-code shape (decision #4)

The ElevenLabs dashboard is a deployment target, never the source of truth.

- The agent's persona (prompt), LLM (`gemini-2.5-flash` per decision #7),
  language, first message, client-tool manifest, and event list are built in
  our server module from the same action registry + instruction builders the
  OpenAI path uses.
- At session mint, the server module pushes the config to the ElevenLabs
  agent (`PATCH /v1/convai/agents/{id}`), keyed by `ELEVENLABS_AGENT_ID`
  (auto-creates one named agent when unset and logs the id to pin). A
  config-hash guard skips redundant pushes within a process.
- TTS voice is only overridden when a valid-shaped ElevenLabs voice id is
  configured; otherwise the agent's existing voice is left untouched (the
  legacy `ELEVENLABS_VOICE_ID` env value is an Anam UUID — see the
  2026-06-26 capabilities probe).
- Per-session client overrides are NOT used in slice 1; the PATCH-at-mint
  push covers parity and keeps `enable_overrides` surface closed.

## Bridge allow-list (Layer 4)

ElevenLabs sessions get a deliberately smaller manifest than OpenAI's 32:
default allow-list is the navigation/context priority set (`navigate`,
`set-url-path`, `set-search-params`, `view-screen`). `tool-search` is
EXCLUDED: ElevenLabs cannot expand a live session's tool manifest the way
OpenAI `session.update` can, so discovery-expansion is meaningless there.
Apps can extend via `toolAllowList` option; everything still passes the
32-tool/64KB packing bounds and the capability grant only contains pushed
names.

### Target bridge shape (owner-ratified 2026-07-13 — seamless-UX north star)

The slice-1 allow-list is navigation-only and therefore LOPSIDED: the only
way the agent can "know" something is to change what the user is looking
at. That violates the north star (a question must never cost the user
their screen). The client-half slice implements the read-first target:

1. **Headless reads answer questions.** Same-app: curated GET-marked read
   actions join the allow-list (redaction/16K caps/journaling already
   apply). Cross-app: `call-agent` (A2A) joins the allow-list — one tool
   buys headless Q&A against every sibling app ("what's on my schedule"
   answered by the calendar app's agent while Design stays on screen). It
   doubles as the delegate tool for mutations (approval flow intact).
2. **Navigation is intent-gated by prompt**: `navigate`/`view-screen` fire
   only on explicit user intent ("open…", "show/pull up…", "what am I
   looking at"). Never as a data-access workaround.
3. **Answers render as transient dock cards** (generative-ui surface) —
   glanceable, zero workspace disruption. Gemini-Live-style: headless read
   + spoken answer + optional card + deep-link only on request.
4. Budget note: `call-agent` is why the 32-tool/64KB bound stays
   comfortable — one tool replaces N apps × M read actions.

## Slice 1 scope (server half)

New sibling file `packages/core/src/server/realtime-voice-elevenlabs.ts`:

- `POST /_agent-native/realtime-voice/elevenlabs/session` — same-origin +
  session auth; resolves `ELEVENLABS_API_KEY` (409 with setup guidance when
  missing); config-as-code push; mints a WebRTC conversation token
  (`GET /v1/convai/conversation/token?agent_id=…`); registers the tool
  capability; returns `{ token, agentId, toolNames }` JSON with the
  capability in the `X-Agent-Native-Realtime-Capability` header.
- `POST /_agent-native/realtime-voice/elevenlabs/tool` — the exact upstream
  tool handler (`createToolHandler`) reused via additive exports from
  `realtime-voice.ts`; identical trust model.
- Mounted unconditionally next to the OpenAI mount in `agent-chat-plugin`
  (one seam, a few lines); route self-gates on key presence like OpenAI's.

Explicitly deferred (bake rule, decision #9): the client hook
(`@elevenlabs/client` `Conversation.startSession({conversationToken,
clientTools})`), dock UI dispatch seam, engine-selection setting, Anam
companion. Upstream's 2,100-line hook is untouched.

## Client-half architecture (surveyed 2026-07-13 — IMPLEMENTED, core 0.99.12)

Shipped 2026-07-13 (late session) exactly on the surveyed seams; deltas from
the survey are noted inline:

- `useRealtimeVoiceMode.tsx` additively exports `RealtimeVoiceModeContext`,
  `useRealtimeVoiceModeController`, `useRealtimeVoiceInlineSettings`
  (extracted from the provider), `RealtimeVoiceModeComposerSurface`, and the
  shared state/header/mic-storage constants. No behavior changes.
- New sibling `useElevenLabsRealtimeVoiceMode.tsx` implements the SAME
  `RealtimeVoiceModeApi` on `@elevenlabs/client@1.15.0`
  `Conversation.startSession({ conversationToken, connectionType: "webrtc",
  clientTools })`: mint via `POST .../elevenlabs/session` (capability header
  kept), clientTools relay to `POST .../elevenlabs/tool`, transcripts from
  `onMessage` into `realtimeVoiceTranscriptRegistry`, dock states from
  `onModeChange`/tool hooks (`working` while a relay is in flight),
  agent-initiated hangup (`onDisconnect reason:"agent"` — end_call/silence)
  winds down like a user end, audio levels polled from
  `getInputVolume`/`getOutputVolume`, mic switching via `changeInputDevice`,
  the same 409 setup gate, and app-state sync under the shared
  `realtime-voice-session` key (`model: "elevenlabs-agent"`).
  Client-tool relay failures throw so the SDK reports `is_error` to the
  model without ending the session (onError ignores `clientToolName`
  contexts). Failed tool results throw; approval_required returns a JSON
  envelope with the approvalKey.
- Preferences (language/intelligence/voice) are display-inert no-ops — the
  config-as-code push at mint owns them. The dock renders a
  MICROPHONE-ONLY settings surface: `RealtimeVoiceModeInlineSettings`
  made `language`/`intelligence`/`voiceStyle` optional (additive dock
  change — the one deviation from "dock unchanged", chosen over shipping
  OpenAI voice/language pickers that would lie in an ElevenLabs session).
- Engine dispatch (ONE seam): `RealtimeVoiceEngineProvider` +
  `RealtimeVoiceEngineBoundary` (`RealtimeVoiceEngineProvider.tsx`) mount
  BOTH controllers and swap only the context VALUE + dock on
  `defaultEngine` from `/_agent-native/voice-providers/status` — children
  never remount while the async status settles (seamless-UX rule), and a
  live session pins its engine (`pickActiveRealtimeVoiceEngine`).
  AgentPanel (~3192) and TiptapComposer (~2610) swapped to the engine
  components (2 lines each).
- `VoiceButton` setup gating is engine-aware: `elevenlabs-agent`
  deployments gate on the ElevenLabs key only; the Builder/OpenAI connect
  flow remains the OpenAI engine's setup surface. Client
  `VoiceProviderStatus` gained `elevenlabs` + `defaultEngine`.
- Deps: `@elevenlabs/client` 1.15.0 in core dependencies (client-side only).
- Specs: `useElevenLabsRealtimeVoiceMode.spec.tsx` (mint parsing, tool
  relay/format/normalize, working-state hooks, engine dispatch) +
  engine-aware `VoiceButton.spec.ts`; 66 voice-area client specs green.
- Verification: Playwright browser-level (dock mounts, mint fires, engine
  gating) + owner mic-in-hand dogfood for the audio path.

### Original survey (for context)

The upstream client seam was exact and small:

- `useRealtimeVoiceMode.tsx` keeps a module-private
  `RealtimeVoiceModeContext` + `RealtimeVoiceModeProvider` that (a) runs the
  OpenAI controller hook and (b) portals `RealtimeVoiceModeDock` into
  `document.body` when active. `RealtimeVoiceModeBoundary` /
  `useRealtimeVoiceModeOptional` are how AgentPanel (line ~3192) and
  TiptapComposer (line ~2610) consume it.
- **Plan**: additively export the context (or a `createEngineProvider`
  factory); new sibling `useElevenLabsRealtimeVoiceMode.tsx` implements the
  SAME `RealtimeVoiceModeApi` shape (state machine, audioLevels store via
  `createRealtimeVoiceAudioLevelStore`, preferences no-ops where EL owns the
  setting) on `@elevenlabs/client` `Conversation.startSession({
  conversationToken, connectionType: "webrtc", clientTools })`; token from
  `POST /_agent-native/realtime-voice/elevenlabs/session` (capability header
  retained for the tool relay).
- `clientTools` handlers relay to
  `/_agent-native/realtime-voice/elevenlabs/tool` with the capability header
  and return `output` strings to EL (`expects_response: true` blocks the
  model until the relay answers — matches upstream approval semantics).
- Transcript events: `onMessage`/mode callbacks map to the same dock states
  (`listening|speaking|working`); EL owns VAD/turns so the state machine is
  ~10% the size of the OpenAI one.
- Engine dispatch (ONE seam): a thin `RealtimeVoiceEngineProvider` reads
  `defaultEngine` from `/_agent-native/voice-providers/status` (shipped in
  core 0.99.11: `REALTIME_VOICE_ENGINE=elevenlabs-agent` env selector) and
  mounts the matching provider; both AgentPanel and TiptapComposer swap to
  it (2-line changes each).
- Deps: `@elevenlabs/client` ^1.15.0 in core (client-side only).
- Verification: browser-level via Playwright (dock mounts, mint fires,
  engine gating) + owner mic-in-hand dogfood for the audio path.

## Verification plan

- Vitest specs for schema conversion, payload building, allow-list bounds,
  auth/409/key-missing paths (mocked EL API).
- Live: mint a session against the real ElevenLabs account from the built
  hummingbird workspace (owner-authorized EL spend) and confirm a real
  conversation token + capability header come back; confirm the OpenAI
  route still 409s without a key.

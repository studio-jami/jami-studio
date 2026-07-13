# Realtime Voice — Engine & Adapter Decisions (2026-07-12)

Companion to `2026-07-08-realtime-voice-avatar-roadmap.md` (the durable
roadmap; this note records decisions layered onto it after upstream's
realtime voice layer landed in the 78c9db6 source sync). Owner-ratified in
session 2026-07-12.

## What changed since the roadmap was written

Builder upstream shipped a full realtime voice layer (#2011 → #2036 → #2040,
~6,300 lines, merged to our main via sync 78c9db6):

- Client: `packages/core/src/client/composer/useRealtimeVoiceMode.tsx` +
  `RealtimeVoiceMode` dock — WebRTC session, live transcripts, audio levels,
  language/voice prefs, mounted in `AgentPanel`.
- Server: `packages/core/src/server/realtime-voice.ts` —
  `/_agent-native/realtime-voice/session` (SDP mint, key stays server-side)
  and `/_agent-native/realtime-voice/tool` (server-side tool execution under
  the user's session: redaction, size caps, TTL'd grants, approval-to-chat).
- Coupling: OpenAI `gpt-realtime-2.1` only (WebRTC + OpenAI event grammar in
  the client; SDP relay to `api.openai.com/v1/realtime/calls` on the server).
  Credential path is Builder-gateway-first with a first-class
  `OPENAI_API_KEY` fallback.

The provider-neutral half (~70% of the value) maps directly onto roadmap
Layer 4 (Jami Control Bridge): the `/tool` route, the bounded 32-tool
manifest (navigate/view-screen/tool-search prioritized), the dock UI,
transcript registry, and `voice-providers-status` gating.

## Decisions

1. **Terminology**: the conversation-loop machinery (VAD, end-of-speech,
   turn-taking, barge-in, latency pipeline) is called the **engine**. Never
   "brain" (collides with the Brain app).
2. **No OpenAI spend.** Upstream's `openai-realtime` implementation stays in
   the tree, dormant (no key configured). Upstream maintains it; zero cost.
3. **First engine: ElevenLabs Agent Mode** (matches the working prototype and
   the 2026-07-08 roadmap first slice). Their platform owns the engine;
   tool calls surface as client tools in the browser and relay to the
   existing `/tool` route under the user's real session — identical trust
   model to what upstream built.
4. **Config-as-code from day one (highest-leverage rule).** Persona,
   directions, voice, language, and tool definitions live in OUR repo and
   are pushed/overridden through the ElevenLabs API at session start
   (their API supports full programmatic agent config + per-session
   overrides). The ElevenLabs dashboard is a deployment target, never the
   source of truth. This makes every later migration a runtime swap, not a
   config migration.
5. **Second engine: Gemini Live** — the "raw realtime model" middle shape.
   Reuses nearly all of upstream's OpenAI pattern (session mint with
   ephemeral tokens, per-session instructions + tool schemas, socket event
   flow). Cheapest adapter to add; check each source sync in case upstream
   ships it themselves (their `voice-providers-status` already tracks
   Google credentials).
6. **Ownership ladder** (each rung is a config change under the same
   adapter, in order of increasing ownership):
   1. EL engine + EL-billed LLM (credits cover STT + engine + LLM + TTS)
   2. EL engine + our LLM endpoint (EL "Custom LLM" → any OpenAI-compatible
      endpoint; LLM sovereignty before engine sovereignty)
   3. Our LiveKit engine + our LLM + EL reduced to TTS/STT plugins
   - LiveKit Agents is the OSS engine skeleton (Silero VAD, turn-detector
     model, barge-in, pipeline) — assembly, not invention. EL's own WebRTC
     transport runs on LiveKit, so rung 3 is moving down one layer of the
     same stack. Pipecat is the fallback framework.
7. **LLM budget mapping**: EL agent credits cover the conversational LLM
   (pick Gemini Flash default; Claude as premium persona option). This funds
   the THIN voice persona only — anything heavier delegates to
   Dispatch/agent-chat/A2A on our own providers. Rising voice-lane credit
   burn = work leaking into the persona that should have been delegated.
   In LiveKit mode the LLM slot moves to Google free tier (planned).
8. **Adapter contract** (roadmap Layer 1, sharpened): speaks transcript
   events, turn state, tool-call requests, lifecycle, and commands
   (updateTools, interrupt, mute, end) — silent about WHO is thinking. This
   lets `elevenlabs-agent`, `gemini-live`, `openai-realtime`, and a future
   owned-engine implementation coexist behind the same dock UI, tool bridge,
   and approval flow.
9. **Merge-friction discipline**: do NOT fork-edit the 2,100-line upstream
   hook internals while upstream is iterating on it (three revisions in one
   week). Adapters are new sibling files with one minimal dispatch seam. Let
   the layer bake 1–2 syncs before cutting the seam.
10. **Tool-caller duality**: EL mode relays tool calls via the browser
    (user session cookie); LiveKit mode's agent worker runs server-side
    (LiveKit room token identifies the user). The `/tool` contract must
    support both callers — one paragraph in the adapter design note.

## Sequencing (agreed)

1. Phase-1 unified Node workspace build (fork deploy work) on the freshly
   synced main → ONE core release covering sync + issue-54 + Phase-1 →
   hummingbird repin ×18 + rebuild + regression battery.
2. Voice slice as its own work unit after: adapter interface design note
   (roadmap "required piece #1", incl. tool-caller duality + config-as-code
   shape), `elevenlabs-agent` adapter + server token mint, bridge
   allow-list as manifest filter config, dogfood against Dispatch.
3. `gemini-live` adapter second (or free if upstream ships it first).
4. Anam avatar (roadmap Layer 3) as a fork-only companion component fed by
   adapter events — untouched by upstream churn.

Budget posture: 3M EL credits (dev engine + voice + LLM), Google free tier
(Gemini Live + future LiveKit LLM slot), OpenAI $0 (dormant adapter).

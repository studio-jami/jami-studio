# Realtime Voice And Video Avatar Feasibility

Date: 2026-07-08

## Status

Feasible, but it should be built as three separate adapter layers:

1. realtime conversation / turn-taking
2. voice I/O, especially STT and TTS
3. avatar/video rendering

The prior avatar feasibility reports remain useful historical context, but they came from a handrolled prototype lens. This report is a fresh read for the current Jami Studio open-source adoption path.

## Executive Recommendation

Build the realtime layer as an adapter-backed product surface over the existing Jami Studio runtime, not as a parallel agent system.

The default internal development stack should be:

- ElevenLabs for voices and TTS.
- Google Gemini Live as the main first-party realtime conversation provider.
- Anam as the video avatar target.
- Jami Studio actions, AgentChatRuntime, Dispatch/A2A, workspace resources, and observability as the system of record.

Do not make ElevenLabs Agents the primary brain. ElevenLabs Agents are capable, but they duplicate the agent/orchestration layer that Jami Studio already owns. Keep them available as an optional adapter/prototype target, but launch architecture should preserve Jami Studio as the orchestrator.

Use an industry-standard realtime framework boundary, not custom media orchestration. LiveKit Agents and Pipecat are the two obvious references. LiveKit is especially attractive because Anam has a first-party LiveKit integration and Google lists LiveKit as a Gemini Live partner path.

## What Exists In Jami Studio Today

Jami Studio already has:

- shared agent chat surfaces
- `AgentChatRuntime` for bring-your-own realtime/chat runtimes
- action tools as the system contract
- `sendToAgentChat()` for UI-to-agent delegation
- Agent Teams for background subagents
- A2A and Dispatch for cross-app orchestration
- workspace resources and custom agents
- voice dictation in the composer
- Google realtime transcription path for dictation
- observability traces, evals, feedback, tracking, and OTel export

Current native voice is dictation-oriented. It is not yet a full duplex voice assistant with spoken responses, barge-in, avatar video, wake state, or continuous realtime session management.

Best integration seam: a realtime `AgentChatRuntime` adapter plus actions that mint provider session tokens.

## Provider Findings

### ElevenLabs

ElevenLabs has two distinct product surfaces relevant to us:

1. ElevenLabs API for TTS/STT.
2. ElevenLabs Agents for full conversational agents.

Useful capabilities:

- Text-to-Speech WebSocket can generate audio from partial streamed text.
- Multi-Context WebSocket supports multiple independent audio generation streams over one connection and documents interruption handling by closing/replacing contexts.
- Realtime Speech-to-Text uses Scribe Realtime v2 over WebSocket and returns partial plus committed transcripts.
- ElevenLabs Agents support WebSocket/WebRTC SDKs, signed URLs/tokens, tools, client events, conversation flow settings, interruptions, timeout controls, and turn eagerness.
- ElevenLabs Agents now include a more advanced turn-taking system inside Expressive Mode.

Architectural read:

- Use ElevenLabs TTS as the preferred voice provider.
- Evaluate ElevenLabs Realtime STT as an STT adapter, especially when we want an all-ElevenLabs voice path.
- Do not default to ElevenLabs Agents for Jami Studio's main workspace assistant because their agent layer duplicates Jami Studio tools, subagents, Dispatch, and observability.
- Keep an optional `elevenlabs-agent` adapter for demos, phone-like agents, or cases where a user explicitly wants ElevenLabs to own the whole realtime conversation.

Launch target:

- `voice: elevenlabs-tts`
- optional `stt: elevenlabs-scribe-realtime`
- optional `conversation: elevenlabs-agent`

### Google

Google has two useful lanes:

1. Gemini Live API for full realtime multimodal conversation.
2. Cloud Speech-to-Text / Text-to-Speech for cascaded STT/TTS.

Gemini Live current capabilities:

- Low-latency realtime voice and vision interaction.
- Stateful WebSocket protocol.
- Audio, image, and text input.
- Audio output.
- Function calling/tool use.
- Ephemeral tokens for browser/client sessions.
- Session resumption and context-window compression.
- Native audio output models.
- Partner integrations including LiveKit and Pipecat.

Important constraints:

- Google docs currently mark Live API as Preview.
- Native audio output models only support audio response modality; text requires output audio transcription.
- Audio-only sessions are limited to 15 minutes without session management.
- Audio plus video sessions are limited to 2 minutes without session management.
- Live API billing compounds by session context window, so long voice sessions need context-window management.
- Function calling must be handled manually in the Live client.

Cloud Speech-to-Text current capabilities:

- Streaming recognition via bidirectional gRPC.
- Interim and final results.
- Voice activity events and timeouts for speech begin/end.
- This is already close to Jami Studio's current Google realtime dictation bridge.

Google TTS current capabilities:

- Cloud TTS supports low-latency streaming synthesis.
- Gemini TTS models include low-latency Flash TTS variants and streaming output formats.

Architectural read:

- Gemini Live is the best Google-first realtime conversation adapter.
- Google Cloud STT/TTS is the fallback cascaded adapter when we want Jami Studio to own the LLM/tool loop directly.
- Google support should be first-party because many users already have Google Cloud/API access and because Jami Studio already has Google realtime transcription groundwork.

Launch target:

- `conversation: gemini-live`
- optional `stt: google-speech-streaming`
- optional `tts: google-tts`

### Anam

Anam is a strong video/avatar target and should remain separate from the voice and conversation stack.

Useful capabilities:

- JavaScript SDK for realtime digital personas.
- Server-minted session tokens so API keys stay server-side.
- WebRTC stream for avatar video/audio.
- Session token API with one-hour validity.
- LiveKit integration that can add an Anam avatar to LiveKit voice agents.
- Docs explicitly position Anam as compatible with any STT, LLM, or TTS, including OpenAI Realtime, Gemini Live, and custom models.
- Existing Jami prototype at `C:\Users\james\orgs\oss\avatar-agent` already mints Anam session tokens server-side and works reliably at `avatar.jami.studio`.

Architectural read:

- Use Anam as the first video provider.
- Keep avatar rendering independent from STT/TTS/turn-taking.
- Prefer Anam through LiveKit when the conversation stack uses LiveKit.
- Keep direct Anam JS SDK support for a simple browser-only avatar session and for compatibility with the working prototype.

Launch target:

- `avatar: anam`
- support direct SDK and LiveKit plugin paths

## Recommended Architecture

### Layer 1: Realtime Conversation Adapter

Purpose: owns session lifecycle, turn-taking, interruption behavior, model/provider connection, and tool-call bridge.

Interface shape:

- `createSession()`
- `start()`
- `sendAudioFrame()`
- `sendText()`
- `interrupt()`
- `sendToolResult()`
- `subscribeEvents()`
- `close()`

Adapters:

- `gemini-live`
- `livekit-agent`
- `pipecat-agent`
- later: `openai-realtime`
- optional: `elevenlabs-agent`

Jami bridge:

- expose as `AgentChatRuntime`
- tool calls resolve to Jami `defineAction` actions
- transcript/events persist to chat threads
- run events feed observability

### Layer 2: Voice Provider Adapter

Purpose: STT/TTS vendor swapping without changing conversation or avatar code.

TTS adapters:

- `elevenlabs-tts`
- `google-tts`
- later: `openai-tts`, `cartesia`, `deepgram`, local/offline if needed

STT adapters:

- `elevenlabs-scribe-realtime`
- `google-speech-streaming`
- browser speech for fallback dictation
- later: `openai-transcription`, `deepgram`, local/offline if needed

Important rule: voice providers do not own tools, app state, workspace permissions, or background work.

### Layer 3: Avatar Provider Adapter

Purpose: render speech/audio/conversation state as video avatar.

Adapters:

- `anam`
- later: Tavus, HeyGen, D-ID, LiveAvatar, Simli, or local renderer

Methods:

- `createAvatarSession()`
- `attachAudioSource()`
- `interrupt()`
- `setExpressionState()`
- `close()`

Important rule: avatar providers should not become the agent brain. Their job is presence, video, lip sync, and media state.

## Two Valid Runtime Modes

### Mode A: Model-Native Realtime

Use when we want the provider to handle realtime turn-taking and speech response.

Examples:

- Gemini Live
- OpenAI Realtime later
- ElevenLabs Agents as optional

Flow:

1. Browser captures audio.
2. Realtime provider receives audio.
3. Provider handles turn-taking and model generation.
4. Provider emits tool calls.
5. Jami bridge executes actions and returns tool results.
6. Provider emits audio.
7. Avatar adapter renders video from audio/session state.

Pros:

- lowest implementation complexity
- strong native turn-taking
- fewer timing bugs
- best match for Google first-party support

Cons:

- provider owns more of the live conversation loop
- tool bridge must be tight and auditable
- cost/context behavior differs by provider

### Mode B: Cascaded Jami-Owned Pipeline

Use when Jami Studio must own the LLM/tool loop directly.

Examples:

- STT: ElevenLabs Scribe or Google StreamingRecognize
- Agent: Jami `runAgentLoop` / Agent Teams / Dispatch
- TTS: ElevenLabs WebSocket
- Avatar: Anam
- Transport/orchestration: LiveKit or Pipecat

Flow:

1. Browser audio goes to STT.
2. Final or low-latency partial transcript enters Jami runtime.
3. Jami agent calls actions/subagents.
4. Jami streams text response.
5. TTS adapter turns response chunks into audio.
6. Avatar adapter renders video.
7. VAD/turn detector interrupts active TTS/avatar on user speech.

Pros:

- Jami remains the clear brain
- one tool/action model
- provider-neutral voice stack
- easier to align with workspace observability

Cons:

- more moving parts
- turn-taking must come from LiveKit/Pipecat/VAD, not custom code
- latency tuning becomes our responsibility

Recommendation: support both modes, but start implementation with one clean vertical slice. For launch readiness, Gemini Live should prove Mode A and ElevenLabs TTS + Anam should prove Mode B.

## Industry-Standard Framework Recommendation

Use LiveKit Agents as the first serious framework target unless implementation testing exposes a blocker.

Reasons:

- WebRTC is the right transport for realtime audio/video.
- LiveKit Agents is built for realtime voice agents.
- Anam has a LiveKit plugin.
- Google lists LiveKit as a Gemini Live partner integration.
- LiveKit keeps media/session concerns out of app UI code.
- It gives us a standard place for interruption, rooms, participants, audio tracks, and avatar plugins.

Keep Pipecat as the alternate evaluation target:

- excellent voice-agent pipeline abstraction
- good provider plugin ecosystem
- useful for Python/server pipelines
- strong fit if LiveKit feels too room/call-oriented for our product shell

Do not build our own WebRTC/media router or VAD/turn-taking framework unless both fail in concrete tests.

## Product Fit For Jami Studio

### Good Fit

- voice-first workspace assistant
- optional avatar presence
- background subagents visible as run state
- actions as tool calls
- Dispatch/Orchestra as central control plane
- user-configurable provider stack
- workspace-level voice/persona defaults
- internal dogfooding with ElevenLabs credits and Anam minutes

### Risks

- Gemini Live is still preview and has session/time/cost constraints.
- ElevenLabs Agents may pull tool/orchestration ownership away from Jami if used as the default.
- Cascaded STT -> agent -> TTS can feel slow without careful streaming.
- Avatar minutes can disappear quickly during dogfooding.
- Provider event schemas will diverge; the adapter boundary must normalize only what Jami needs.
- Realtime audio is harder to test deterministically than text chat.

## Proposed First Implementation Slice

No broad install or product rewrite yet. Build a narrow, testable Jami-native slice:

1. Add a `realtime-voice` capability design doc before code.
2. Define provider-neutral interfaces for conversation, voice, and avatar.
3. Add session-token actions:
   - `create-realtime-session`
   - `create-avatar-session`
   - `list-voice-providers`
4. Implement `gemini-live` as the first realtime conversation adapter.
5. Implement `elevenlabs-tts` as the first TTS adapter.
6. Implement `anam` as the first avatar adapter.
7. Wire a minimal `AssistantChat` / `AgentChatRuntime` route, not a separate app brain.
8. Emit observability events for session start/end, first audio, first transcript, first tool call, interruption, error, and token/minute usage.
9. Run a manual dogfood matrix:
   - Gemini Live audio-only, no avatar
   - Gemini Live with Anam
   - Jami-owned STT/TTS with ElevenLabs TTS and Anam
   - interruption while assistant is speaking
   - long-running subagent while voice session continues

## Decisions To Make Later

- Whether LiveKit becomes a required dependency or optional adapter package.
- Whether Pipecat gets a parallel adapter.
- Whether ElevenLabs Agents are exposed as a first-class user option.
- Whether Anam direct SDK support remains after LiveKit integration is working.
- Whether avatar rendering belongs in core, a package, or a template app.
- How much realtime transcript/audio metadata belongs in `application_state`.
- Whether user voice/persona preferences live in settings, workspace resources, or both.

## Source Notes

Primary provider docs checked on 2026-07-08:

- ElevenLabs TTS WebSocket: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input
- ElevenLabs realtime TTS guide: https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tts
- ElevenLabs Multi-Context WebSocket: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-multi-stream-input
- ElevenLabs realtime STT: https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime
- ElevenLabs realtime STT guide: https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming
- ElevenLabs Agents conversation flow: https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow
- ElevenLabs Agents authentication: https://elevenlabs.io/docs/eleven-agents/customization/authentication
- ElevenLabs Agents React SDK: https://elevenlabs.io/docs/eleven-agents/libraries/react
- ElevenLabs Expressive Mode: https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode
- Google Gemini Live API overview: https://ai.google.dev/gemini-api/docs/live-api
- Google Gemini Live capabilities: https://ai.google.dev/gemini-api/docs/live-api/capabilities
- Google Gemini Live ephemeral tokens: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- Google Gemini Live session management: https://ai.google.dev/gemini-api/docs/live-api/session-management
- Google Gemini Live tools: https://ai.google.dev/gemini-api/docs/live-api/tools
- Google Gemini Live best practices: https://ai.google.dev/gemini-api/docs/live-api/best-practices
- Google Cloud Speech-to-Text streaming: https://docs.cloud.google.com/speech-to-text/docs/streaming-recognize
- Google Cloud Speech voice activity events: https://docs.cloud.google.com/speech-to-text/docs/voice-activity-events
- Google Cloud Text-to-Speech streaming: https://docs.cloud.google.com/text-to-speech/docs/create-audio-text-streaming
- Google Gemini TTS: https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
- Anam JavaScript SDK authentication: https://anam.ai/docs/javascript-sdk/authentication
- Anam production usage: https://anam.ai/docs/javascript-sdk/production
- Anam session token API: https://anam.ai/docs/api-reference/sessions/create-session-token
- Anam LiveKit integration: https://anam.ai/docs/integrations/livekit/overview
- LiveKit Anam plugin: https://docs.livekit.io/agents/models/avatar/plugins/anam/
- Pipecat ElevenLabs TTS: https://docs.pipecat.ai/api-reference/server/services/tts/elevenlabs
- Pipecat Google TTS: https://docs.pipecat.ai/api-reference/server/services/tts/google

Local reference checked:

- `C:\Users\james\orgs\oss\avatar-agent`
- `https://avatar.jami.studio`

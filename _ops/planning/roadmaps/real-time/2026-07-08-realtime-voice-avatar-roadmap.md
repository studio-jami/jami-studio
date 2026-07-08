# Realtime Voice Avatar Roadmap

Date: 2026-07-08

## Direction

Build the realtime voice/avatar layer as an on-top interaction surface for Jami Studio.

The first target is ElevenLabs Agent Mode plus Anam because that combination is already working in the prototype and gives us dependable realtime voice, turn-taking, interruption, and video avatar runway without inventing a media framework.

Jami Studio remains the system of record:

- tools and app operations live in actions
- account access lives behind scoped connections, vault grants, and app surfaces
- subagents/background work run through Agent Teams, Dispatch, and A2A
- observability stays native to Jami Studio
- voice/video providers are adapters, not the product brain

## Product Shape

The voice agent is an optional on-top presence layer. It should not block or occupy background agent work.

The product surface should support:

- a small video-feed component that can accompany agent interaction
- voice-only mode
- text-only fallback
- assigned voices/personas for different agents or roles
- audible check-ins from background agents
- group review/planning sessions with multiple agent roles
- curated control-plane access instead of broad direct app access

This is not a game layer. The goal is to make agent work more legible and relatable through voice, presence, and role identity while preserving professional workspace behavior.

## Core Architecture

### Layer 1: Conversation Adapter

Owns realtime conversation session behavior:

- session start/stop
- provider connection
- turn-taking
- interruption
- transcript events
- tool-call requests
- provider errors

First-class adapters:

- `elevenlabs-agent`
- `gemini-live`
- `openai-realtime`

Initial implementation:

- `elevenlabs-agent`

### Layer 2: Voice Adapter

Owns STT/TTS when the conversation adapter does not own both.

First-class adapters:

- `elevenlabs-voice`
- `google-voice`
- `openai-voice`

Initial implementation:

- ElevenLabs voice settings and voice selection through the ElevenLabs Agent path.
- Add standalone ElevenLabs TTS/STT after the first working on-top slice.

### Layer 3: Avatar Adapter

Owns video/avatar session and rendering.

First-class adapters:

- `anam`

Initial implementation:

- `anam`

Future adapters can be added without changing the voice or conversation contracts.

### Layer 4: Jami Control Bridge

Owns the controlled touchpoints between the realtime provider and Jami Studio.

The realtime provider should receive only bounded capabilities:

- current workspace/app context summary
- current screen/route/selection summary
- available high-level commands
- selected safe actions
- handoff to Dispatch / A2A / subagents
- status stream for active background work

It should not receive:

- raw secrets
- broad database access
- arbitrary action registry access
- all workspace resources by default
- direct provider tokens
- unbounded app data dumps

## First Slice

Goal: prove a Jami-native on-top realtime layer with the working provider pair.

Provider stack:

- Conversation: ElevenLabs Agent Mode
- Voice: ElevenLabs
- Avatar: Anam
- Jami bridge: narrow control/data stream

Required pieces:

1. Create a focused design note for adapter interfaces.
2. Add server-side session token actions for ElevenLabs and Anam.
3. Create a minimal realtime panel/feed component.
4. Connect ElevenLabs Agent Mode to a constrained Jami bridge.
5. Connect Anam video feed as an optional companion.
6. Persist transcript/session events into Jami-visible state.
7. Emit observability events for session lifecycle and failure modes.
8. Dogfood against the existing Dispatch workspace surface.

Success criteria:

- user can start a realtime voice/avatar session
- provider keys stay server-side
- ElevenLabs agent can call only approved Jami bridge capabilities
- Anam video feed is optional and can be disabled
- background agents can keep running while voice layer is active
- voice layer can summarize or surface background run status
- interruption works reliably
- session events appear in Jami observability
- no new custom orchestration framework is invented

## Bridge Capability Set

Start with a deliberately small bridge.

### Read Context

Purpose: give the voice layer enough situational awareness to be useful.

Examples:

- current app
- current route
- current selected object
- active workspace
- active background runs
- recent high-level events

Implementation target:

- action-backed read surface
- scoped to current user/org/workspace
- compact response shape

### Send Command

Purpose: let the voice layer hand work to Jami instead of doing the work itself.

Examples:

- ask Dispatch to handle a task
- spawn a named background agent
- open a screen
- summarize active run state
- create a planning note

Implementation target:

- action-backed command surface
- allow-list only
- approval where needed

### Subscribe Status

Purpose: let the voice layer narrate or check in on background work.

Examples:

- run started
- run needs approval
- run completed
- run failed
- new important result available

Implementation target:

- existing application state / run state / observability events first
- avoid a parallel event bus unless required

## Dispatch Integration Options

### Option A: On-Top Companion

Keep Dispatch mostly as-is and add the realtime layer above it.

Advantages:

- lower risk
- preserves source architecture
- easier to dogfood quickly
- keeps voice provider isolated

Tradeoff:

- the bridge must translate between realtime voice and Dispatch/app state

Recommendation:

- start here

### Option B: Native Dispatch Surface

Embed the realtime layer into the existing Dispatch agent surface once the seams are proven.

Advantages:

- tighter product feel
- less duplicated UI chrome
- clearer Orchestra/control-plane story

Tradeoff:

- higher risk while we are still learning the source architecture

Recommendation:

- design for this, but do not start here

## Provider Expansion

### Phase 1: ElevenLabs + Anam

Target:

- internal dogfooding
- basic on-top control bridge
- optional avatar feed
- stable session lifecycle

### Phase 2: ElevenLabs Voice-Only

Target:

- Jami-owned conversation loop
- ElevenLabs STT/TTS
- no ElevenLabs Agent dependency

Why:

- proves the adapter split
- gives us control when provider-agent mode is too constrained

### Phase 3: Google

Target:

- Gemini Live conversation adapter
- Google Speech / TTS fallback adapters where useful

Why:

- major user-accessible provider
- natural fit for workspace users with Google accounts/credits
- important first-party support lane

### Phase 4: OpenAI

Target:

- OpenAI realtime conversation adapter
- OpenAI voice/STT/TTS adapters where useful

Why:

- expected user option
- important market baseline

### Phase 5: Framework Adapters

Target:

- LiveKit adapter if rooms/media routing/multi-party sessions become valuable
- Pipecat adapter if server-side voice pipeline composition becomes valuable

Why:

- both are strong, but neither should be foundational until concrete need appears

## LiveKit And Pipecat Position

Do not make LiveKit or Pipecat a first implementation dependency.

They are valuable when we need:

- multi-party realtime rooms
- cross-provider media routing
- telephony/call infrastructure
- complex server-side voice pipelines
- standardized media observability outside Jami
- hosted realtime infrastructure

They are not required for the first Jami target because:

- ElevenLabs Agent Mode already handles realtime conversation and turn-taking
- Anam already handles avatar/video
- Jami already owns tools, actions, agents, app state, and observability
- adding another orchestration layer now can create more work than value

Keep support open, but earn the dependency through tests.

## Near-Term Work Items

1. Update the feasibility report to reflect ElevenLabs Agent Mode as first-class.
2. Inspect the prototype implementation for the minimal reusable session-token shape.
3. Draft adapter interfaces before touching source.
4. Decide where the first realtime surface lives:
   - standalone dev route
   - Dispatch companion panel
   - app shell video-feed component
5. Implement server-side token minting actions.
6. Implement the minimal video-feed component.
7. Implement the bridge allow-list.
8. Run local dogfood against ElevenLabs + Anam.
9. Add observability hooks.
10. Write the Google/OpenAI adapter follow-up plan.

## Open Questions

- Should the first bridge be a set of Jami actions, an MCP server, A2A, or a small purpose-built action facade?
- Should the ElevenLabs agent see Jami as one tool or a few narrowly named tools?
- Where should role voices/personas live: custom agent frontmatter, workspace resources, user settings, or a shared persona table?
- Should voice sessions persist as chat threads, session transcripts, observability traces, or all three?
- What is the minimum status stream needed for background agent check-ins?
- How much should the on-top layer know about the current screen?
- How do we present multiple role voices without making the product feel like a toy?
- Should the video feed be a global shell component or owned by Dispatch first?

## Current Decision

Proceed with ElevenLabs Agent Mode plus Anam as the first Jami realtime slice.

Keep the bridge narrow and reversible.

Keep Google and OpenAI as first-class provider targets, but do not block the first implementation on them.

Do not adopt LiveKit or Pipecat until a concrete need appears in dogfooding.


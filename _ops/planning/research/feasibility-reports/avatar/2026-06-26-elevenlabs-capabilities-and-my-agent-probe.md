# ElevenLabs Account Capabilities + `My Agent` Config — Live Probe Report

Date: 2026-06-26
Status: Findings (live-verified)
Request: Probe the live ElevenLabs account across all three console sections — Creator, Agents, and Developer (API) — using the keys in the repo `.env` files, then dump the current `My Agent` configuration and recommend a foundation for the avatar voice setup.
Scope: Read-only live API probe against `api.elevenlabs.io`. No agent/account state was modified. No secret values are stored in this report (keys are masked).
Owner: Jami Studio · Avatar Agent (`oss/apps/avatar`)
Related: `2026-06-25-avatar-agent-feasibility.md`, `brainstorms/initial-avatar-agent-brainstorm.md`

---

## Executive Summary

The account is live, healthy, and already wired for exactly the shape the brainstorm wants: a server-side **ElevenLabs Conversational AI** agent (`My Agent`) with a real-time voice stack, a small tool library (Google Calendar + Slack), one knowledge-base doc pointed at the Jami Studio Registry, and a stored Linear secret. Both real-time session-minting endpoints the app depends on are verified working live.

Three keys were discovered across the env files; all three authenticate. They are **workspace-content scoped** (Creator + ConvAI + history) but **not workspace-admin scoped** — the Developer-section endpoints for managing API keys and members return `401 needs_authorization`, which is expected: those are dashboard/admin operations, not API-key operations.

The current `My Agent` is a solid, conventional default. For the foundation we want (adaptable, clean seams, true real-time interruptible voice/video, provider-portable), the agent config is good enough to build on now, with a handful of deliberate adjustments called out at the end. The most important architectural point holds from the prior feasibility report: **keep the agent thin and keep tools/accounts behind the access stream**, not baked into the ElevenLabs agent — the calendar/Slack tools currently on the agent are useful for dogfooding but are the first thing that should migrate behind the access seam.

---

## Keys Discovered + Access Posture

Probed from `oss/apps/avatar/.env` (primary app projection) and `oss/.env` (upstream account source).

| Env name                          | Source file   | Masked                               | Auth `/v1/user` | Notes                                                                                                                                            |
| --------------------------------- | ------------- | ------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ELEVENLABS_API_KEY`              | `avatar/.env` | `sk_f…1310` (len 51)                 | 200 OK          | Active key used by the app/session broker                                                                                                        |
| `ELEVEN_LABS_API_KEY`             | `oss/.env`    | `sk_f…1310` (len 51)                 | 200 OK          | **Same key** as above (upstream alias)                                                                                                           |
| `ELEVEN_LABS_SERVICE_ACCOUNT_KEY` | `avatar/.env` | `sk_7…402d` (len 51)                 | 200 OK          | Distinct service-account key, same scope observed                                                                                                |
| `ELEVENLABS_AGENT_ID`             | `avatar/.env` | `agent_6201kvtg1ezxea791970d8aks7pk` | —               | Resolves to `My Agent`                                                                                                                           |
| `ELEVENLABS_VOICE_ID`             | `avatar/.env` | `a0337b67-…-b3fb78cdda35`            | —               | **Not an ElevenLabs voice id** — UUID format is an Anam/other id; the agent actually speaks with voice `mWqiTfcp72MprLxlUR8h` (Megan). See Gaps. |

**Scope finding:** Both the primary and the service-account key reach Creator, ConvAI (Agents), history, and pronunciation dictionaries, but neither reaches `/v1/workspace/api-keys` or `/v1/workspace/members` (both `401 needs_authorization`). `/v1/workspace/groups/search` returns `200 []`. So the keys can fully drive Creator + Agents programmatically; Developer-section *key/member administration* must be done from the dashboard.

---

## Section 1 — Creator (account, plan, voices, models)

### Account / plan

- **Tier:** `grant_tier_2_2025_07_23` (grant/partner tier — matches the ElevenLabs Startup-Grant credit lane).
- **Character usage:** `38,403 / 33,010,000` used (~33M char allowance; effectively the voice-credit pool, barely touched).
- **`can_extend_character_limit`:** `false` (hard ceiling, no overage billing).
- **Voice slots:** `voice_limit: 660`, `voice_add_edit_counter: 0`.
- **`is_new_user`:** `true` (fresh workspace).

### Voices (35 available to this workspace)

- **Professional / curated (14):** Olivia, Ava (British), **Megan – Expressive conversationalist** `mWqiTfcp72MprLxlUR8h` (the one `My Agent` uses), Sia, Hazel, Avani, Ophelia, Sarah Eve, Eve, Diana, **Alexis Lancaster** `O4fnkotIypvedJqBp4yb`, Ivy, Arabella, Zara.
- **Premade (21):** Bella, Roger, Sarah `EXAVITQu4vr4xnSDxMaL`, Laura, Charlie, George, Callum, River, Harry, Liam, Alice, Matilda, Will, Jessica, Eric `cjVigY5qzO86Huf0OWal` (used by `agent-2`), Chris, Brian, Daniel, Lily, Adam, Bill.
- Note: the persona names in `avatar/.env` (`MEGAN`, `SARAH`, `ALEXIS`) line up with curated voices here — Megan, Sarah, Alexis Lancaster — so the persona seam is already coherent.

### Models (TTS / ConvAI-capable)

- `eleven_v3` (newest expressive TTS, broadest languages), `eleven_multilingual_v2` (**ConvAI-capable**), `eleven_flash_v2_5` / `eleven_turbo_v2_5` (low-latency, 20+ langs), plus v2/v1 legacy and STS variants.
- The agent itself runs `eleven_v3_conversational` — a ConvAI-internal model id that is **not** listed in the public `/v1/models` catalog (it's selected inside the agent's TTS config, not the generic TTS catalog).

---

## Section 2 — Agents (Conversational AI)

Two agents exist:

| Name         | Agent ID                             | Shape                                                                                                    |
| ------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **My Agent** | `agent_6201kvtg1ezxea791970d8aks7pk` | The real one — full config below                                                                         |
| agent-2      | `agent_9601kvv8xqsses0r9ataqbeysvn5` | Scratch/default test agent (voice Eric, `eleven_flash_v2`, `gemini-2.5-flash`, default prompt, no tools) |

### Workspace ConvAI settings

- `can_use_mcp_servers: true`, `rag_retention_period_days: 10`, `default_livekit_stack: "standard"`, post-call webhook unset (events: `transcript`, json).

### Stored secrets (ConvAI)

- `LINEAR_API_KEY` (type `stored`) — available to tools, not yet attached to a tool on `My Agent`.

### Tool library (7 tools, account-level)

- Slack: `slack_read_thread`, `slack_add_reaction`, `slack_remove_reaction` (connection `icxn_0201kvv97260ezz8ezkz7phe1zma`).
- Google Calendar: `check_availability`, `list_calendars`, `list_events`, `create_event` (connection `icxn_6301kvv98w9newk9p9mebh2s2prq`).

### Integration library (native ElevenLabs integrations)

- Connected: **Google Calendar**, **Slack**.
- Available but **disconnected**: Notion, Perplexity, HackerNews, and others (require approval-all policy).
- MCP servers configured: **none** (`mcp_servers: []`).

### Recent conversations (`My Agent`)

- 10 recent sessions, all `status: done`, short (1–9 messages). Most recent cluster is from today (2026-06-26), confirming live dogfooding traffic is already flowing.

## `My Agent` — full configuration

### ASR (speech-in)

- Provider `scribe_realtime`, quality `high`, input `pcm_16000`, no keywords.

### Turn-taking (the interruptible-voice core)

- `turn_model: turn_v3`, `mode: turn`, `turn_eagerness: patient`, `turn_timeout: 3s`, `silence_end_call_timeout: 20s`.
- `speculative_turn: true`, `transcribe_on_disabled_interruptions: true`.
- Soft-timeout filler message: `"Hhmmmm...yeah."` (single filler, no LLM-generated fillers).

### TTS (speech-out)

- `model_id: eleven_v3_conversational`, `voice_id: mWqiTfcp72MprLxlUR8h` (Megan), `expressive_mode: true`.
- `stability: 0.6`, `speed: 1.05`, `similarity_boost: 0.8`, output `pcm_48000`, `optimize_streaming_latency: 3`, `enable_phoneme_tags: true`.

### Conversation

- `max_duration_seconds: 600` (10-minute cap), `text_only: false`.
- Client events streamed: `audio`, `interruption`, `user_transcript`, `agent_response`, `agent_response_correction`, `agent_chat_response_part`, `agent_tool_request`, `agent_tool_response`.
- `file_input: enabled` (10 files/conversation), `background_voice_detection: true`.

### Agent / LLM

- `first_message:` "Hey there.. what's going on? What can i get started for us today?"
- `language: en`.
- Prompt (system): **"You are warm, friendly and engaging."** (minimal — this is the biggest content gap).
- `llm: gemini-2.5-flash-lite`, `temperature: 0.88`, `thinking_budget: 0`, `max_tokens: -1`, `cascade_timeout_seconds: 8`, backup LLM `default`, `timezone: America/New_York`.

### Tools attached to `My Agent` (5 of the 7 library tools)

- `google_calendar_check_availability`, `google_calendar_list_calendars`, `google_calendar_list_events`, `google_calendar_create_event`, `slack_add_reaction`.
- Built-in system tools enabled: `end_call`, `language_detection`, `skip_turn`. (Disabled/unused: transfer, voicemail, memory_*, procedure_*, keypad.)
- `enable_parallel_tool_calls: false`, `mcp_server_ids: []`, `native_mcp_server_ids: []`.

### Knowledge base / RAG

- One URL doc: **"Jami Studio Documentation - Jami Studio Registry"** (`GLNYVearpw3mNoWrCfi4`), `usage_mode: auto`, ~896 bytes.
- `rag.enabled: false` (knowledge base is injected directly, not retrieved).

### Platform settings

- **Widget:** variant `tiny`, placement `bottom-right`, image avatar, `text_input_enabled: true`, `supports_text_only: true`, brand styles `base #0c0e15` / border `#8c4b8a` (Jami palette).
- **Overrides allowed at session start:** TTS `voice_id` / `stability` / `speed` / `similarity_boost`; conversation `text_only`; agent `first_message` / `language` / `prompt` / `llm` / `tool_ids` / `knowledge_base`. (This is what lets the app drive persona/voice per session — important seam.)
- **Privacy:** `zero_retention_mode: true`, `record_voice: false`, `retention_days: -1`, no PII redaction.
- **Guardrails:** focus `enabled`; prompt-injection `disabled`; content moderation categories all `disabled` (consistent with the internal/no-burdensome-governance track).
- **Call limits:** concurrency `-1` (plan max), `daily_limit: 100000`, bursting off.
- **Analysis:** `analysis_llm: gemini-3.1-flash-lite`, topic discovery `enabled`.

---

## Section 3 — Developer (API)

What the API keys *can* do (verified `200`):

- Full Creator reads: `/v1/user`, `/v1/user/subscription`, `/v2/voices`, `/v1/models`.
- Full Agents control surface: `/v1/convai/agents` (+ per-agent GET), `/v1/convai/settings`, `/v1/convai/secrets`, `/v1/convai/tools`, `/v1/convai/knowledge-base`, `/v1/convai/phone-numbers`, `/v1/convai/conversations`.
- History + pronunciation dictionaries.
- **Real-time session minting (verified live, `200`):**
  - `GET /v1/convai/conversation/token?agent_id=…` → returns a WebRTC conversation token. *(This is what `apps/web/app/lib/elevenlabs-session.ts` calls.)*
  - `GET /v1/convai/conversation/get-signed-url?agent_id=…` → returns a WebSocket signed URL. *(Alternative transport for the same agent.)*

What the API keys *cannot* do (verified `401 needs_authorization`, both keys):

- `/v1/workspace/api-keys` (manage API keys) and `/v1/workspace/members` (manage members). These are **dashboard/admin** operations — API keys can't mint or list other API keys or manage seats. `/v1/workspace/groups/search` is reachable (`200 []`).

**Takeaway for the Developer section:** programmatic management of the account is fully available for *content and agents* (create/update agents, voices, tools, KB, secrets, sessions) but *account administration* (keys, members, billing) stays in the dashboard. That's the normal ElevenLabs boundary and is fine for the avatar foundation.

---

## How this maps to the avatar foundation

The app is already on the accepted Option B path, and the live wiring matches the architecture docs:

- `apps/web/app/api/elevenlabs-session/route.ts` mints a conversation token server-side via `createElevenLabsConversationToken()`, returns only the token + agent label to the client, and emits telemetry (`avatar.elevenlabs_token.created/failed`) with provider request/trace IDs.
- The client uses `@elevenlabs/react` / `@elevenlabs/client` for the real-time WebRTC session.
- Anam session broker exists in parallel (`/api/anam-session`) for the avatar video layer; ElevenLabs is the voice/ConvAI brain.

So the seams the brainstorm asked for are physically present: **transport seam** (WebRTC token vs WebSocket signed URL are interchangeable), **voice seam** (per-session `voice_id` override is enabled), **persona seam** (`prompt`/`first_message`/`language`/`tool_ids`/`knowledge_base` overridable per session), and **access/tool seam** (currently ElevenLabs-native tools, ready to migrate behind the access stream).

---

## Gaps + recommended foundation adjustments

Ordered by impact. None of these are blockers — the voice loop works today.

1. **`ELEVENLABS_VOICE_ID` is wrong/misleading.** Its value is a UUID (`a0337b67-…`), which is not an ElevenLabs voice id; the agent actually speaks as Megan (`mWqiTfcp72MprLxlUR8h`). Either set it to a real ElevenLabs voice id (Megan/Sarah/Alexis from the curated list) or rename it to reflect the Anam/other id it really is. Right now it's a latent footgun for the per-session voice override.
2. **System prompt is a one-liner.** "You are warm, friendly and engaging." is fine as a placeholder but is the single biggest lever for interaction quality. Lay down a real foundation prompt that encodes the access-stream contract (the avatar narrates and dispatches; subagents do the work), the persona, and tool-use etiquette. Keep it overridable per session.
3. **Tools are baked into the agent.** Calendar + Slack on the agent are great for dogfooding *now*, but per the prior feasibility decision they should migrate behind the access stream (server webhooks / MCP) so the avatar stays a thin, portable interaction layer. Recommendation: keep them for the current internal track, but record them as access-layer candidates and don't add more agent-native tools.
4. **Two keys, one scope.** The primary and service-account keys have the same observed scope. Decide deliberately which is "app runtime" vs "automation/CI" so rotation and revocation are clean, and document it in `account-configuration.md`.
5. **`agent-2` is scratch.** Either promote it to a deliberate second persona/profile (it's a clean place to test a different voice/LLM/persona side-by-side) or delete it to keep the workspace tidy.
6. **MCP is enabled but unused.** `can_use_mcp_servers: true` and zero servers configured. This is the natural seam for the future access stream (Lighthouse/central planning, full Google ecosystem) — leave it empty until the access stream exists, then attach one MCP server rather than piling native tools onto the agent.
7. **10-minute session cap + zero-retention.** `max_duration_seconds: 600` and `zero_retention_mode: true` are sensible internal defaults; just be aware the cap will end long dogfic sessions abruptly (with the goodbye message). Raise per profile when you start longer working sessions.

### Suggested next step (foundation, not feature-creep)

Lock a small, versioned **agent profile** in the repo (prompt + voice + turn/TTS params + tool list) that the session broker applies via the already-enabled overrides, so the agent's durable config lives in git rather than only in the ElevenLabs dashboard. That gives you reproducible, provider-portable personas (Megan/Sarah/Alexis) without hardcoding, and keeps the dashboard agent as just the runtime shell.

---

## Method / reproducibility

- Read-only probes against `https://api.elevenlabs.io` using `xi-api-key` auth, keys loaded from the two `.env` files (values never printed unmasked).
- Endpoints exercised: `/v1/user`, `/v1/user/subscription`, `/v2/voices`, `/v1/models`, `/v1/convai/{agents,agents/:id,settings,secrets,tools,knowledge-base,phone-numbers,integrations,mcp-servers,conversations}`, `/v1/convai/conversation/{token,get-signed-url}`, `/v1/workspace/{api-keys,members,groups/search}`, `/v1/history`, `/v1/pronunciation-dictionaries`.
- Probe scripts were temporary and have been deleted; no probe code or secrets were committed.
- No agent, voice, tool, secret, or account state was created, modified, or deleted.

# Real-Time Voice Supervisor Layer — Committed Recommendation

**Date:** 2026-06-02
**Status:** Committed direction (greenfield), pending green-light
**Canon:** `C:\Users\james\dev\docs\research\00-orchestration\plan.md`
**Ethos:** Principled Edge — first-principles production design, zero bloat, OSS-first, self-host, agnostic behind thin adapters, no hardcoding, full final shape (no MVP/phase/defer language).

---

## 1. Bottom Line — The Fitting Stack

For a self-hosted, agnostic, additive **supervisor** layer on top of the agent-native harness, the committed stack is:

- **OSS infra base (media/transport):** **LiveKit Agents** (Apache-2.0, v1.5.15, 2026-05-29) over the **LiveKit Go SFU** (Apache-2.0, Pion-based WebRTC). It is the only 2026 option that is Apache-2.0 *end-to-end* with no SaaS-restriction clause, the most mature/adopted, and already structured around the canon's exact two-adapter split. **Pipecat** (BSD-2, v1.3.0) is the designated second source behind the same `realtime` adapter interface — it is the better choice *only if* zero-infra serverless WebRTC (`SmallWebRTCTransport`) or maximal transport pluggability ever outranks LiveKit's batteries-included Room model.

- **Realtime model (behind the LLM adapter — BYOK/config-selected, no hardcoded default):** the model is swappable; the *abstraction* is what's committed, not any one vendor. On pure voice-latency merit **xAI Grok Voice Agent API** is the strongest candidate for the slot — lowest measured TTFT (~0.78s), **OpenAI-Realtime-protocol compatible** (zero extra adapter work), native tools, OAuth/BYOK fit, official LiveKit plugin — but it is one option among equals: **OpenAI `gpt-realtime-2`**, **Gemini 3.1 Flash Live**, and **Amazon Nova 2 Sonic** are all configured paths. Actual selection is **BYOK in the OSS lane** and **internal-eval / credit-driven in the SaaS lane** (early-launch provider → time-to-scale agnostic gateway). The **OpenAI Realtime event schema is the normalized adapter contract** — one OpenAI-shaped adapter covers xAI + OpenAI + the broad OpenAI-compatible endpoint set; Gemini-Live and Nova-Bedrock are the two additional implementations.

- **Speech-to-speech vs pipeline call — DECISIVE:** The supervisor defaults to **native speech-to-speech (S2S)**, not a cascading pipeline. The supervisor's canonical jobs (voice I/O, turn-taking, barge-in, dispatch) are precisely S2S's strengths — sub-second TTFT, native in-stream interruption, native mid-session async tool calling — while cascading's only real advantages (LLM-swap modularity, premium TTS naturalness) are near-worthless here because the heavy model lives in the harness and the supervisor merely narrates. **The retained baseline turn-based STT↔TTS path (interaction mode 2) IS the cascading stack** — that is where modular control genuinely pays off, and it stays untouched.

- **Self-host posture:** Media = LiveKit self-host (free OSS + your own TURN/SFU). Realtime model = hosted BYOK behind the LLM adapter via server-minted ephemeral tokens. If the self-host constraint must ever extend to the *model itself*, the OSS S2S/half-cascade escape hatch (Moshi/Kyutai, Ultravox v0.7 MIT, Step-Audio R1.1 Apache-2.0) is a configured adapter on the *same* LiveKit transport — never the default, never hardcoded.

---

## 2. The Architecture — Supervisor Pattern Mapped to Our Foundations

The real-time supervisor is an **OPTIONAL layer ON TOP of the harness — not the default interface.** Three interaction modes coexist:

1. **Text (default).**
2. **Baseline turn-based STT↔TTS voice (retained):** the existing Transcriber adapter / `transcribe-voice.ts` / `useVoiceDictation.ts` cascading stack, untouched.
3. **Real-time supervisor (new, additive):** S2S voice I/O + turn-taking + barge-in + **DISPATCH**.

The supervisor's **only** jobs are voice I/O, turn-taking, barge-in, and dispatching tasks to the harness. It does **not** run heavy work inline — that is exactly what keeps it responsive. It subscribes to the dispatched run's event stream (the native SSE spine) to narrate progress and accept mid-flight changes, and is **toggle-able mid-run** by attaching to a live run via seq-replay.

### The three-tier separation (every 2026 reference converges here)

- **Tier 1 — Thin realtime front agent.** Models the OpenAI Agents SDK realtime shape (RealtimeAgent / RealtimeRunner / RealtimeSession / RealtimeModel transport abstraction). The `RealtimeModel` abstraction is *literally* the canon's "realtime model behind the LLM adapter." Inline tools are restricted to voice I/O, turn-taking, barge-in, and **dispatch** — nothing heavy.

- **Tier 2 — Dispatch.** The supervisor's dispatch tool is an **async / long-running function call** (native to gpt-realtime since 2025-08-28; mirrored by xAI/Gemini/Nova) that hands the task to our **A2A task-store + run-manager** and returns immediately with an ack/preamble. The model keeps talking while the work runs; the result is folded back out-of-order when ready. This is the single most important primitive — it is now native, so we **expose it through the adapter, never reimplement it.** It rides the *same* `a2a_tasks` + run-store + transport-decoupled `runAgentLoop(send)` path that text mode uses; nothing dispatch-side is net-new.

- **Tier 3 — Narration.** The supervisor **subscribes to the dispatched run's `agent_run_events` by seq** (the existing replay-by-seq on the native SSE spine) and converts selected events into spoken preambles/updates via the equivalent of `session.say()` / `generate_reply()`. **Barge-in cancels in-flight SPEECH only — never the background run.**

### Where each adapter seam lands

- **Realtime MODEL → behind the existing LLM adapter** (the `AGENT_ENGINE` registry). Normalized to the OpenAI Realtime event schema; swappable per BYOK config.
- **Media/transport → behind the NEW `realtime` adapter.** Owns WebRTC peer setup, audio I/O, turn-taking, barge-in/interruption, VAD/semantic turn-detection — LiveKit default, Pipecat as drop-in second source.
- **Run substrate → reused unchanged:** native SSE spine (`/_agent-native/events` + `/_agent-native/poll?since=N`), run-store replay-by-seq, run-manager subscriber/abort/heartbeat, A2A task-store, app_secrets vault + request-context credential path.

The harness's only bridging job is **dispatch-and-subscribe.** Do not rebind the internal SSE surface (AG-UI stays external-interop only). Do not run heavy work inline. Do not put the realtime model behind the media adapter.

> Note: LiveKit's *documented* "supervisor pattern" (synchronous in-session `AgentTask` delegation) is explicitly **off the table** — it pauses the agent and would re-introduce inline heavy work. The async behavior we want is LiveKit's **background/long-running function tools** + **explicit Agent Dispatch** (separate worker process joins the room), which maps cleanly onto "realtime supervisor dispatches a run to the harness." Pipecat's `pipecat-subagents` Agent Bus (shared bus, `@job` dispatch, explicit progress-update/streaming/cancellation message types) is the closest design vocabulary to our target — we borrow the vocabulary but back it with our own SSE seq-replay spine + A2A task-store rather than adopting its bus wholesale.

---

## 3. Reuse Map — As-Is vs Thin New Adapter vs Net-New

### REUSE AS-IS (zero net-new)
- **Native SSE spine** (`/_agent-native/events` + `/_agent-native/poll?since=N`, `run-store.ts` replay-by-seq, `run-manager.ts` subscribers/abort/heartbeat). This is the run-attach + narration substrate; the supervisor is just one more seq-subscriber of `agent_run_events`. This gives **"toggle-able mid-run" for free** — none of LiveKit/Pipecat/OpenAI ship a bounded seq-replay buffer as a first-class primitive; our spine is the differentiator.
- **Dispatch path** — A2A SQL task-store + transport-decoupled `runAgentLoop(send)` background fn + sub-agent delegation + `@agent-native/dispatch` (vault/grants/approvals/audit). The heavy-work offload that keeps the voice loop responsive.
- **Baseline STT↔TTS voice (mode 2)** — existing Transcriber / `transcribe-voice.ts` / `useVoiceDictation.ts` stack, untouched.
- **Credentials** — `app_secrets` AES-256-GCM vault + request-context (the multi-tenant seam, not env/global-singleton).
- **Seam PATTERN to copy:** agent-native already ships a realtime audio-frame WebSocket bridge with server-side ephemeral session minting — `POST /_agent-native/transcribe-stream/session` mints an opaque ai-services WS session and keeps provider creds off the client, while batch `transcribe-voice.ts` is explicitly forbidden from carrying realtime. The new `realtime` adapter's session-mint endpoint is this exact pattern, generalized from STT-only to full-duplex voice.

### THE THIN NEW `realtime` ADAPTER (three small surfaces)
- **(A) Media/transport** — LiveKit (Apache-2.0, self-hosted Go SFU) owning WebRTC audio I/O, turn-taking, barge-in, semantic turn-detection; Pipecat drop-in behind the same interface.
- **(B) Realtime-model session** — behind the existing LLM adapter; OpenAI-Realtime-schema-normalized, BYOK/eval-selected (xAI Grok the strongest latency candidate), swaps to OpenAI/Gemini/Nova. Both LiveKit and the model providers already use the server-mint-ephemeral-then-client-connects shape our STT bridge uses.
- **(C) Net-new GLUE (small):** (a) **dispatch bridge** — translate the realtime model's tool/function-call events into harness dispatch (A2A task create + run-manager background start); (b) **run-attach / narration subscriber** — `agent_run_events` seq-replay → spoken deltas, plus injecting mid-flight user changes into the running run; (c) **session-lifecycle endpoint** — mint media room + model ephemeral token together, tied to user/org via request-context, including token-refresh/session-rollover.

### NET-NEW CODE
Only surface (C) above. Everything else — loop, persistence, SSE, tools, secrets, auth, A2A — is reused unchanged. Mode 1 (text) stays default; mode 3 is purely additive.

---

## 4. Barge-In / Attach / Detach Mechanics

### ATTACH (toggle-on mid-run) — the load-bearing piece we own
There is **no vendor "attach to a running session" primitive.** OpenAI Realtime sessions are unresumable (reconnect = empty new session); LiveKit/Pipecat agent contexts start empty by default. So on toggle-on the supervisor **instantiates a FRESH realtime session and seeds it from the native SSE spine's bounded seq-replay**, converting a **COMPACTED** snapshot of recent run state into seed conversation items (OpenAI `conversation.item.create` — incl. assistant audio history; LiveKit `chat_ctx` at construction; Pipecat `LLMContextFrame`). **The SSE spine IS the attach mechanism; the realtime vendor provides none.** Seed a compacted summary, not the raw transcript — replaying long runs verbatim blows the realtime context window and the ~30–60 min session cap.

### BARGE-IN — universal detect → cancel → truncate triad (the adapter contract)
1. **Detect** — server VAD / semantic turn model fires on user speech.
2. **Cancel** — in-progress response auto-cancels (OpenAI `response.cancelled`) or explicit `response.cancel`; LiveKit cancels TTS/LLM; Pipecat emits `StartInterruptionFrame`.
3. **Truncate** — **non-optional:** send `conversation.item.truncate` (`audio_end_ms`) so the model's memory matches what the user actually heard. Skipping this causes the known transcript-drift bug (server generates audio faster than realtime). LiveKit truncates context to the spoken point automatically.

Default turn-taking to **adaptive interruption** (ML backchannel rejection — ignores "uh-huh"/noise). Note the trade: LiveKit `adaptive` mode requires a **non-realtime LLM + aligned-transcript STT**, which a monolithic S2S model trades away. We accept this consciously: the **S2S default optimizes for the supervisor's latency/dispatch role**, and the retained mode-2 STT→LLM→TTS components are available where aligned-transcript adaptive turn-taking is the priority. Barge-in semantics are normalized into a single interruption event the `realtime` adapter emits into the harness, so narration can be cleanly cut and resumed across OpenAI/Gemini differences.

### DETACH / RESUME — durable run, disposable session
Model the voice participant as a **media participant that can leave WITHOUT ending the harness run** (LiveKit `close_on_disconnect=False`; graceful drain on the Closing phase). The harness run + SSE spine are the durable spine; the realtime session is disposable and re-seedable on the next toggle. Long sessions: wrap rolling token-refresh / session-rollover (re-mint ~every 29 min; Gemini ~15 min audio-only cap) **inside the realtime adapter** so the cap is invisible to the harness.

### MID-FLIGHT WORK on barge-in
**Never cancel dispatched harness tasks on interruption by default** (Pipecat `cancel_on_interruption=False` semantics). Let them run, narrate results when they land, cancel only when the new spoken intent contradicts the in-flight task. A "modify the running task" utterance is routed to the live run via the task-store, not by killing it.

---

## 5. Targeted Swaps / Choices (decisive)

| # | Choice | Why |
|---|--------|-----|
| 1 | **Media base = LiveKit Agents (Apache-2.0) + LiveKit Go SFU**, not TEN, not provider-direct transport | Only fully Apache-2.0-end-to-end OSS option. TEN core carries "Apache-2.0 with additional restrictions" (SaaS-clause-adjacent, fails the self-host/agnostic ethos). Provider-direct WebRTC endpoints are proprietary model endpoints — they sit *behind* adapters, never *as* the base. |
| 2 | **Pipecat (BSD-2) = designated second source** behind the same `realtime` interface, not first | LiveKit's batteries-included Room model + explicit Agent Dispatch fit dispatch/subscribe topology with least glue. Pipecat wins only if zero-infra serverless WebRTC (`SmallWebRTCTransport`) or maximal transport pluggability becomes the priority. Keep the adapter thin enough that the swap is real. |
| 3 | **Strongest voice-latency candidate = xAI Grok Voice Agent (S2S)** — not a hardcoded default; BYOK/eval-selected behind the adapter | Lowest measured TTFT (~0.78s), OpenAI-protocol compatible (zero extra adapter work), native tools, OAuth/BYOK, official LiveKit plugin. The slot is swappable; default is BYOK (OSS) / eval-driven (SaaS). |
| 4 | **Normalized adapter contract = OpenAI Realtime event schema** | De facto S2S wire standard; xAI + Inworld + broad OpenAI-compatible set repoint with minimal change. One adapter, many vendors. Gemini-Live + Nova-Bedrock are the two dedicated outlier implementations. |
| 5 | **Default = native speech-to-speech, NOT cascading**, for the supervisor | Supervisor jobs == S2S strengths (sub-second TTFT, native in-stream barge-in, native async tool calling). Cascading's wins (LLM-swap, premium TTS) are worthless here; cascading's losses (weaker barge-in, higher turn latency) are exactly what would make the supervisor feel broken. |
| 6 | **Cascading STT→LLM→TTS = mode 2 only** | Modular control genuinely pays off in the retained turn-based voice path; it is the configured escape hatch (with OSS Moshi/Ultravox/Step-Audio) if the model itself must be self-hosted — never the supervisor default. |
| 7 | **Exclude Vocode** | MIT but unmaintained (no commits since 2024-11, seeking maintainers). Not a production base. |
| 8 | **Ultravox = a self-hosted realtime model behind the LLM adapter, not the base** | MIT open-weight audio-in→text model; slots in as a plugin. Belongs behind the LLM adapter, not as transport. |
| 9 | **Dispatch primitive = native async/long-running function call** | Keeps the voice loop responsive; native since gpt-realtime GA. Expose through the adapter, never reimplement. |
| 10 | **Toggle-mid-run = re-seed from our SSE seq-replay** | No vendor attach exists. Our bounded seq-replay buffer is the differentiator that makes "attach to a live run" first-class. |

---

## 6. Risks + Drift-Prone Facts to Re-Verify at Lock

### Risks
- **Self-host scope of the MODEL.** All four leading S2S models (xAI, OpenAI, Gemini, Nova) are **hosted-only.** Confirm whether canon "self-hostable" is satisfied by a self-hosted *transport/media adapter* fronting hosted BYOK models, or requires the *model itself* to be self-hostable (forcing OSS Moshi/Ultravox/Step-Audio + cascading). This determines whether S2S is the literal default or only the default among hosted options.
- **Auth mismatch on Nova.** OpenAI/xAI/Gemini fit OAuth/BYOK cleanly; **Nova 2 Sonic uses AWS SigV4/IAM**, not OAuth. Gate Nova behind the enterprise-credits path unless Bedrock-via-IAM is ruled acceptable.
- **Cost-accumulation runaway.** Some hosted S2S pricing escalates with session context ($0.30→$1.50+/min observed for long OpenAI sessions); S2S runs ~5x a cascaded pipeline at volume (~$30k vs ~$6k per 100k min/mo). Define a max-supervisor-session-length / context-trim policy so a toggled-on supervisor on a long run does not run away on cost.
- **Compliance.** OpenAI Realtime audio is **NOT HIPAA-eligible under the BAA as of May 2026.** Factor into model selection for regulated tenants.
- **Realtime-model context-injection bugs.** Mid-session `update_chat_ctx()` on realtime models (e.g. Gemini) silently drops system/developer messages and can fail to propagate mid-conversation. **Policy:** put authoritative state in the SEED (initial items) and the harness-side text channel — never rely on mid-realtime-session system injection.
- **SDK language parity.** LiveKit Agents is ~99% Python; AgentsJS (Node/TS) is the secondary SDK. If the harness runtime is Node/TS, confirm JS feature parity (semantic turn detection, RealtimeModel plugins) — else run the realtime media/turn worker as a **separate Python sidecar** that bridges back over A2A/SSE.
- **Ops weight.** Self-hosting the LiveKit Go SFU means operating TURN/SFU/telephony/inference. Confirm acceptable vs Pipecat `SmallWebRTCTransport`'s zero-external-infra serverless WebRTC if telephony/scale-out is not in the end-shape.
- **Fork-time seam drift.** Cited agent-native seams (`run-store.ts` replay-by-seq, run-manager subscribers, `transcribe-stream/session` bridge, request-context credential path) were read at **core 0.23.0**; fork target is **core 0.32.2**. Re-diff before building the adapter.

### Drift-prone facts to re-verify at lock (all dated 2026-06-02 unless noted)
- LiveKit Agents version (1.5.15, 2026-05-29) and AgentsJS parity status.
- Pipecat version (1.3.0, 2026-05-29) and `pipecat-subagents` bus API.
- TEN Framework core license clause ("Apache-2.0 with additional restrictions") before any tertiary use.
- xAI Grok Voice Agent pricing/latency, OpenAI-protocol compatibility, LiveKit plugin status.
- OpenAI Realtime GA status (GA 2026-05-07), `gpt-realtime-2` pricing, ephemeral `client_secrets` TTL (~60s), HIPAA-eligibility.
- Gemini Live model line (3.1 Flash Live launched 2026-03-26), session caps (~15 min audio-only), ephemeral token TTLs, sync vs async tool calling.
- Nova 2 Sonic (announced 2025-12-02; Nova Sonic v1 EOL 2026-09-14) Bedrock API, regions, SigV4 auth, pricing.
- A2A version in fork (v0.3 HMAC today; v1.0 signed-card is the upgrade target for any cross-app supervisor dispatch).

### Sources (dated)
- LiveKit Agents / SFU / self-hosting / supervisor + dispatch + adaptive interruption + chat-context — github.com/livekit/agents, github.com/livekit/livekit, docs.livekit.io (turns/adaptive-interruption-handling, agents/server/agent-dispatch, agents/logic/chat-context, agents/build/sessions, models/realtime/plugins) — 2026-05-29 / 2026-06-02.
- Pipecat / pipecat-subagents Agent Bus / ParallelPipeline — github.com/pipecat-ai/pipecat, docs.pipecat.ai (subagents/fundamentals/agent-bus, context-management) — 2026-05-29 / 2026-06-02.
- TEN Framework — github.com/TEN-framework/ten-framework — 2026-06-02.
- Vocode (unmaintained) — github.com/vocodedev/vocode-core — 2026-06-02.
- Ultravox — github.com/fixie-ai/ultravox, docs.ultravox.ai — 2025-12-01.
- OpenAI Realtime (GA, async function calling, conversations, webrtc) — developers.openai.com/api/docs/guides/realtime, openai.com/index/introducing-gpt-realtime, openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api — 2025-08-28 / 2026-05-07 / 2026-06-02; transcript-trim bug — community.openai.com/t/realtime-api-interruptions-dont-properly-trim-the-transcript.
- Gemini Live — ai.google.dev/gemini-api/docs/live-api/capabilities, ai.google.dev/api/live, ai.google.dev/gemini-api/docs/ephemeral-tokens — 2026-06-02.
- xAI Grok Voice Agent — x.ai/news/grok-voice-agent-api, docs.x.ai/developers/model-capabilities/audio/voice-agent — 2026-06-02.
- Amazon Nova 2 Sonic — aws.amazon.com/blogs/aws/introducing-amazon-nova-2-sonic, docs.aws.amazon.com/nova/latest/nova2-userguide — 2026-06-02.
- OpenAI Agents SDK realtime — openai.github.io/openai-agents-python/realtime/guide, /handoffs — 2026-06-02.
- S2S vs cascading + TTS latency — softcery.com/lab/ai-voice-agents-real-time-vs-turn-based-tts-stt-architecture, gradium.ai/content/tts-latency-benchmark-2026, forasoft.com/blog/article/openai-realtime-api-voice-agent-production-guide-2026 — 2026-06-02.
- Protocol-compat / alternatives — inworld.ai/resources/openai-realtime-api-alternatives — 2026-06-02.
- LiveKit context-injection bug issues — github.com/livekit/agents/issues/4497, /3386 — 2026-06-02.
- agent-native foundations — `C:\Users\james\dev\docs\research\12-agent-native\engine-harness-memory.md`, `recommendation.md`; voice-transcription + real-time-sync SKILL packs — read at core 0.23.0, fork target 0.32.2 — 2026-06-01.

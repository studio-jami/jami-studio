# Deep-dive — Transcription & Voice — what is trivial, what is not

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

Date: 2026-06-01
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Status: Research (locks nothing). Grounded in the local clone + voice-prototypes; drift-prone facts verified against official 2026 sources and dated inline.
Evidence roots:
- agent-native clone: `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native\packages\core\src`
- voice bake-off: `C:\Users\james\projects\rebuild\voice-prototypes`

---

## 1. Committed read (lead)

**These are two different problems and they are not the same difficulty.**

1. **Transcription (speech-to-text dictation into the composer) is already done and already self-hosted-shaped — adopt as-is.** agent-native does **not** depend on a Builder STT endpoint for dictation. The built-in route `server/transcribe-voice.ts` is a **provider-routed batch transcriber** that already speaks five backends behind one seam (Builder-hosted Gemini, BYOK Gemini, Groq Whisper, OpenAI Whisper, plus the browser Web Speech API for a zero-key live path). Builder is *one optional branch in a fallback chain*, not the engine. "What's stopping it from having transcription?" — **nothing; it already has it.** The only "swap" the recommendation called for (`recommendation.md` §3 item 3) is **deleting** the Builder branch and renaming the route's provider enum into our own `Transcriber` adapter naming. That is a sweep, not a build. **Difficulty: trivial.**

2. **Voice (realtime, duplex, barge-in conversational agent) is genuinely non-trivial, and the protos deliberately did not prove it.** voice-prototypes is a *bake-off harness*, fully built across four realtime lanes (OpenAI Realtime WebRTC, Gemini Live AI-Studio, Vertex Live server-proxy, assistant-ui shell), with green contract tests — but **every live observation in the results report is still a `_pending live walk-through_` placeholder.** It proved the *plumbing* (token mint, WebRTC/WS transport, PCM capture/playback, tool-routing through the agent chat, the action contract surviving a provider swap). It did **not** prove the *experience* (latency feel, barge-in quality, tool-call correctness, which provider/shell to promote) because locked rule #14 forbade paid live provider calls without explicit approval, and that approval session never ran. That is why "the protos didn't prove voice." **Difficulty: non-trivial — but the hard part is product/operational, not architectural.** The clean self-hosted path already exists in code; what is missing is a live evaluation pass and one production decision.

**Net for the rebuild:** ship dictation now (it is free capability already in the foundation). Treat realtime voice as a separate, later, *deliberate* surface — the harness to choose it is built; the choosing was never done.

---

## 2. Direct answers

**Q: What is agent-native's transcription, what does it depend on, how trivial is swapping to self-hosted STT behind a Transcriber adapter?**

- **What it does:** click-to-toggle mic in the Tiptap composer → records audio (MediaRecorder) or runs the browser Web Speech API live → on stop, POSTs the audio blob to `POST /_agent-native/transcribe-voice` → server returns `{ text }`, inserted (never auto-sent) at the caret. A separate AI-cleanup pass can tidy the raw transcript. Source of record: the `voice-transcription` SKILL.md (`packages/core/src/templates/workspace-core/.agents/skills/voice-transcription/SKILL.md`).
- **What it depends on:** **nothing Builder-mandatory for dictation.** `transcribe-voice.ts` (1001 lines) resolves a provider preference from `application_state["voice-transcription-prefs"]` then routes:
  - `gemini` → direct Google `generativelanguage` inline-audio (`GEMINI_API_KEY`)
  - `groq` → Groq `whisper-large-v3-turbo` (OpenAI-compatible `/audio/transcriptions`)
  - `openai` → OpenAI `whisper-1` (`/audio/transcriptions`)
  - `builder` / `builder-gemini` → the **only** Builder-hosted branch (`transcription/builder-transcription.ts`, a thin `fetch` to `…/agent-native/transcribe-audio` gated on `resolveBuilderAuthHeader()`)
  - `browser` → client-only Web Speech API, **no server, no key** (`client/transcription/use-live-transcription.ts`)
  - `auto` → tries Builder-Gemini first *if connected*, else falls through to Gemini/Groq/OpenAI.
  Keys resolve request-scoped (`resolveSecret` over the `app_secrets` vault: user → org → workspace), with env fallback only outside an authenticated context — already the multi-tenant, per-org-isolated shape the new direction wants (§5).
- **How trivial the swap is:** the seam the recommendation names ("swap Builder-hosted → `Transcriber` adapter") overstates the work. The non-Builder providers are **already** self-hosted/BYOK and already behind one route. The real task is: (a) delete the two `builder` branches + `BuilderTranscriptionCta.tsx` + the Builder Gemini model constant; (b) rename the route + the `provider` union into our `Transcriber`-adapter vocabulary so the choke point is ours, not Builder-flavored; (c) optionally add a **Deepgram** or **self-hosted Whisper** branch (one more `callWhisperCompat`-style function — Deepgram and faster-whisper both expose OpenAI-compatible or trivially-adaptable HTTP). **Difficulty: trivial (a sweep + one optional new branch), not a rewrite.** The exact seam is `createTranscribeVoiceHandler()` in `server/transcribe-voice.ts` and the `provider` union in `client/composer/useVoiceDictation.ts`.

**Q: There is also a realtime STT lane in core — does *that* depend on Builder?**

- **Yes, and this is the one real Builder coupling in transcription.** `server/google-realtime-session.ts` + the `google-realtime` provider mint an opaque managed ai-services WebSocket session that bridges browser audio frames → Google Speech-to-Text gRPC `StreamingRecognize`. Per the SKILL.md (line 67), this lane "is only actually ready when both the user's `GOOGLE_APPLICATION_CREDENTIALS` secret exists **and Builder is connected**, because the framework mints the managed ai-services session with Builder auth before streaming begins." **Self-hosting this specific lane is non-trivial** — it needs our own session-bridge service (the voice-prototypes Vertex proxy is the exact pattern to copy). But it is **optional**: batch dictation (above) covers the composer dictation use-case completely without it. Realtime *dictation* and realtime *voice agent* converge on the same need: a self-hosted WS audio bridge.

**Q: What did the voice bake-off actually prove vs leave unproven, and why?**

- **Proved (contract / architecture, green via Vitest — 235 tests / 15 files at closeout):** that one provider-agnostic `ProviderAdapter` contract (`app/lib/voice/provider-contract.ts`) normalizes OpenAI Realtime, Gemini Live, and Vertex Live into a single `VoiceRuntimeEvent` stream; that **tool calls route through the agent chat** (`sendToAgentChat`), not the adapter, so the action ledger stays authoritative (locked rule #4); that tool declarations derive from one shared Zod catalog (`shared/schemas/calendar.ts`); that the **browser never holds a provider credential** via two mechanisms — ephemeral tokens (OpenAI `/v1/realtime/client_secrets`, Gemini AI-Studio `/v1alpha/authTokens`) and a **server-side WebSocket proxy for Vertex** (which has no browser transport and no ephemeral tokens at all). Adapter weight: OpenAI 705 LOC, Gemini Live 975 LOC, Vertex adapter 317 + proxy 353 LOC, shared PCM 213 LOC.
- **Left unproven (the entire qualitative half):** latency, barge-in/interruption feel, first-successful-voice-turn, tool-call correctness under real audio, confirmation-UX feel, debuggability, and **which lane to promote**. Every one of these in `docs/reports/voice-agent-calendar-bakeoff-results.md` reads `_pending live walk-through_`. The B-vs-D (AI-Studio vs Vertex) call is explicitly "a deployment-posture decision, not a model-quality one" and left open.
- **Why ("protos didn't prove voice"):** locked rule #14 — "No live paid provider calls unless the user explicitly approves a session." The harness was built to *enable* a one-sitting human evaluation; that sitting never happened. So the work proved you *can* wire any of four realtime providers cleanly behind one contract — it did not prove the resulting voice *experience* is good, fast, or worth shipping. The prototypes are a correctly-built, un-run experiment.

**Q: What is the clean self-hosted path to a working voice surface?**

- The path is already implemented and is the **Vertex lane (Lane D)**: browser PCM16 mic (`pcm-audio.ts`) ↔ our Nitro-adjacent `ws` proxy (`server/lib/vertex-live-server.ts`, booted by `server/plugins/vertex-live.ts`, bound to 127.0.0.1, discovered via `/api/vertex-live-info`) ↔ Vertex Live via `@google/genai` service-account ADC. **The browser sees no Google credential — strictly stronger than the ephemeral-token lanes** and the most production-portable Google option. This is the self-hosted-on-GCP shape. For a non-GCP / BYOK posture, OpenAI Realtime over WebRTC with ephemeral tokens is the zero-infra alternative. Both are built; neither is chosen.

---

## 3. Seams & difficulty (exact)

| Concern | Exact seam (file) | Difficulty | What it actually takes |
|---|---|---|---|
| Composer dictation (batch STT) | `server/transcribe-voice.ts` `createTranscribeVoiceHandler()`; provider union in `client/composer/useVoiceDictation.ts` | **Trivial** | Already multi-provider + BYOK + request-scoped vault. Delete Builder branches; rename enum to our `Transcriber` vocabulary; optionally add a Deepgram/self-host-Whisper branch (one `callWhisperCompat`-shaped fn). |
| Zero-key live dictation | `client/transcription/use-live-transcription.ts` (Web Speech API) | **Trivial / free** | Already self-contained, no server, no key. Keep as the offline/instant fallback. |
| Builder STT branch removal | `transcription/builder-transcription.ts`, `client/transcription/BuilderTranscriptionCta.tsx`, `BUILDER_GEMINI_TRANSCRIPTION_MODEL` const | **Trivial sweep** | Pure deletion + the broader branding sweep `recommendation.md` §3 item 6 already lists. |
| Realtime STT *dictation* lane | `server/google-realtime-session.ts` + `google-realtime` provider | **Non-trivial (optional)** | Only path with a hard Builder coupling (Builder mints the ai-services WS session). Self-hosting = stand up our own audio→STT WS bridge. **Copy the voice-prototypes Vertex proxy pattern.** Not needed if batch dictation suffices. |
| Realtime *voice agent* | voice-prototypes `app/lib/voice/*-adapter.ts` + `server/lib/vertex-live-server.ts` + ephemeral-token routes | **Non-trivial; built, unproven** | Architecture done behind `ProviderAdapter`. Remaining: a live eval pass + pick a lane + harden reconnect (`goAway`/session-resumption noted as not-yet-auto in WS5 blockers) + production deploy of the WS proxy. |

**The Transcriber adapter seam, stated plainly:** `createTranscribeVoiceHandler()` is *already* the adapter — it is a switch over `providerPref` that fans out to per-provider functions. Making it "ours" is renaming and pruning, not designing. The realtime voice equivalent is the `ProviderAdapter` interface in voice-prototypes — also already the right seam.

---

## 4. Verified 2026 options & pricing (dated; for the STT/realtime branch choices)

All verified 2026-06-01 via web search against vendor/aggregator sources (links in §7). Token→minute conversions are vendor-published ratios; treat per-minute figures as approximate.

- **OpenAI Realtime (`gpt-realtime`, default slug `gpt-realtime-1.5` per the SDK):** audio **$32 / 1M input tokens** (cached **$0.40**), **$64 / 1M output tokens**. ≈ **$0.06/min in, $0.24/min out**; typical agent **$0.18–$0.46/min uncached**, **$0.05–$0.10/min** with prompt caching. WebRTC + ephemeral tokens (`/v1/realtime/client_secrets`). Best zero-infra realtime + BYOK posture.
- **Gemini Live (native audio, AI-Studio or Vertex):** billed per audio token — input ≈ **32 tokens/sec**, output ≈ **25 tokens/sec**; audio input ≈ **$0.50/MTok (Flash-Lite)** to **$1.00/MTok (Flash)** (verified 2026-06-01; output rate model-dependent). AI-Studio = ephemeral tokens, browser-direct; **Vertex = service-account ADC, no browser transport, server proxy required** (the self-hosted-on-GCP shape).
- **Deepgram (Nova-3 streaming STT):** **$0.0077/min** (~$0.46/hr) pay-as-you-go, billed per-second no-round-up; **$0.0065/min** on Growth ($4k+/yr prepay). $200 free credit ≈ 433 hrs. Cheapest realtime *STT* (transcription-only, not a voice agent). Strong candidate for a self-hosted-adjacent dictation branch.
- **OpenAI batch transcription:** `gpt-4o-mini-transcribe` ≈ **$0.003/min**, `gpt-4o-transcribe` ≈ **$0.006/min** (diarization included at same price); legacy `whisper-1` per-minute. Groq `whisper-large-v3-turbo` is the cheap fast OpenAI-compatible option already wired.
- **Self-hosted Whisper (truly $0/min marginal):** `whisper.cpp` (MIT, CPU-capable) and **faster-whisper** (CTranslate2, up to 4× faster, lower VRAM) are the production self-host paths; **Parakeet** is the 2026 challenger for self-hosted ASR. Break-even vs API ≈ **100k+ min/month** ($300–600/mo API) before self-host GPU pays off. For Jamie's one-human scale, **API/BYOK beats self-host on TCO** until volume is real — self-host is the *option behind the seam*, not the default.

**Direction implied (not locked):** dictation default = BYOK batch (Groq/OpenAI/Gemini already wired) with Web Speech as the zero-key instant fallback; Deepgram as the easy add for streaming dictation; self-host Whisper only at volume. Realtime voice agent = OpenAI Realtime (BYOK, zero-infra) or Vertex Live (GCP-native, server proxy) — decided by deployment posture, after a live eval.

---

## 5. Fit with the new per-org-isolation direction

The transcription stack is **already per-org-isolation-correct**, which matters under the revised "each org runs its own db/auth/users" direction. `transcribe-voice.ts` resolves keys request-scoped through `runWithRequestContext({ userEmail, orgId })` against the `app_secrets` vault in scope order **user → org → workspace**, with env fallback only outside an authenticated request. So an org's STT keys/credentials live in that org's vault and never leak across tenants — no global STT plane is assumed or required. The realtime voice proxy is likewise per-deployment (127.0.0.1-bound, session-gated). Nothing here forces a shared identity/entitlement plane; the seams are tenant-local already.

---

## 6. Honest downsides / limitations

- **Realtime voice is unproven, full stop.** No latency, no barge-in, no correctness numbers exist. The "it's basically built" claim is true *for the plumbing only*. A real eval could still find a lane feels bad. Budget a live-eval sitting before committing voice to any roadmap surface.
- **The one hard Builder coupling that remains is the realtime STT *dictation* lane** (`google-realtime-session.ts`) — it mints its WS session with Builder auth. Self-hosting it is real work (a WS audio bridge). Mitigated entirely by preferring batch dictation, or by reusing the voice-prototypes Vertex-proxy pattern.
- **Reconnect/resumption is not finished** in the Gemini Live lane (WS5 blocker: adapter captures the resumption handle but the hook does not auto-reconnect on `goAway`/10-min reset). A production voice surface needs this hardened.
- **Per-provider STT client code is partly ours.** The route fans out with hand-written `fetch` calls per provider; adding Deepgram/self-host is small but non-zero, and error/timeout handling must stay consistent with the existing 45s-abort pattern.
- **`gpt-realtime-1.5`, the Gemini Live model slugs, and Vertex model IDs are fast-moving** (the bake-off already absorbed a `/v1/realtime/sessions` → `/client_secrets` migration and AI-Studio↔Vertex model-name divergence). Keep them in config (`app/lib/voice/models.ts`, `.env`) — never hardcode — and re-verify at fork time.
- **Cost asymmetry:** realtime voice ($0.18–0.46/min uncached) is ~25–60× the cost of batch dictation (~$0.003–0.008/min). Voice is a premium surface; dictation is nearly free. Price them differently in any product thinking.

## 7. What I could not verify

- **Live latency/quality of any realtime lane** — never run (locked rule #14; no approved paid session). This is the load-bearing unknown.
- **Builder hosted-transcription pricing/ToS** — moot (we delete the branch); not fetched (npm/docs returned 403 in prior passes per `recommendation.md` §7).
- **Exact Gemini Live *output* audio per-MTok rate by model variant** — input rates and tokenization confirmed; output rate is model-dependent and I did not pin every variant. Re-check `ai.google.dev/gemini-api/docs/pricing` at decision time.
- **Whether the voice-prototypes lanes still type/build at agent-native 0.32.0** — the clone is 0.23.0; prototypes were last exercised against the version they forked. Re-verify seams at fork (consistent with `recommendation.md` §7 version-drift note).
- **`gpt-realtime-1.5` as the current canonical slug** — verified via the SDK default-model page as of the bake-off (2026-05-28) and consistent with 2026-06-01 pricing pages; OpenAI rotates realtime slugs, so confirm before pinning.

---

## Sources

Local evidence (quoted paths):
- `…\agent-native\packages\core\src\server\transcribe-voice.ts` (the real transcription adapter; provider fan-out)
- `…\agent-native\packages\core\src\transcription\builder-transcription.ts` (the lone Builder STT branch)
- `…\agent-native\packages\core\src\client\transcription\use-live-transcription.ts` (Web Speech zero-key live)
- `…\agent-native\packages\core\src\client\transcription\BuilderTranscriptionCta.tsx`
- `…\agent-native\packages\core\src\client\composer\useVoiceDictation.ts` (provider union / state machine)
- `…\agent-native\packages\core\src\server\google-realtime-session.ts` (realtime STT bridge; Builder-coupled)
- `…\agent-native\packages\core\src\templates\workspace-core\.agents\skills\voice-transcription\SKILL.md`
- `C:\Users\james\projects\rebuild\voice-prototypes\AGENTS.md`, `LEARNINGS.md`
- `…\voice-prototypes\docs\reports\voice-agent-calendar-bakeoff-results.md` (all live observations `_pending_`)
- `…\voice-prototypes\app\lib\voice\provider-contract.ts`, `models.ts`, `openai-realtime-adapter.ts` (705 LOC), `google-live-adapter.ts` (975 LOC), `google-vertex-adapter.ts` (317), `pcm-audio.ts` (213)
- `…\voice-prototypes\server\lib\vertex-live-server.ts` (353), `…\server\routes\api\openai-session.post.ts`

Official / external 2026 pricing (verified 2026-06-01):
- OpenAI Realtime: <https://developers.openai.com/api/docs/pricing>, <https://openai.com/index/introducing-gpt-realtime/>, <https://callsphere.ai/blog/vw2c-openai-realtime-cost-per-minute-math-2026>
- Deepgram: <https://deepgram.com/pricing>, <https://brasstranscripts.com/blog/deepgram-pricing-per-minute-2025-real-time-vs-batch>
- Gemini Live / Vertex: <https://ai.google.dev/gemini-api/docs/pricing>, <https://cloud.google.com/vertex-ai/generative-ai/pricing>
- OpenAI batch transcription / Whisper: <https://developers.openai.com/api/docs/pricing>, <https://tokenmix.ai/blog/whisper-api-pricing>
- Self-host Whisper: <https://github.com/ggml-org/whisper.cpp>, <https://builderai.tools/blog/whisper-cpp-vs-faster-whisper-speed-and-accuracy>, <https://modelslab.com/blog/audio-generation/parakeet-cpp-vs-whisper-self-hosted-asr-comparison-2026>
- Vendor surfaces (bake-off, 2026-05-28/29): OpenAI Realtime <https://openai.github.io/openai-agents-js/guides/voice-agents/>; Gemini Live <https://ai.google.dev/gemini-api/docs/live-api>; Vertex Live GA <https://cloud.google.com/blog/products/ai-machine-learning/gemini-live-api-available-on-vertex-ai>

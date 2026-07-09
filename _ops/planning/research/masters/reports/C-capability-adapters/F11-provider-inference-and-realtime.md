# F11 — Provider, inference & real-time

Status: AUTHORED 2026-06-02 · Domain: C · Capability adapters
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/12-agent-native/deep-dives/provider-landscape-and-tradeoffs.md`, `../../research/13-realtime-voice/recommendation.md`, `../../research/00-orchestration/{plan,synthesis}.md`
Related: F05 (engine), F08 (voice narration via SSE), F13/F14

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

Model access (text + voice). **In:** the LLM adapter, provider posture, the real-time voice supervisor. **Out:** the engine registry mechanics (F05).

## 2. Committed decisions (from canon)

- **LLM behind the adapter** (`ai-sdk-engine` via `AGENT_ENGINE`); **BYOK in OSS**, **eval-driven dev-provider → time-to-scale gateway in SaaS** (LiteLLM self-host / Vercel AI Gateway / OpenRouter). No hardcoded default.
- **Three provider layers:** coding/dev runtimes (untouched) · product inference · realtime voice S2S.
- **Voice = three coexisting modes:** text (default) · baseline turn-based STT↔TTS (retained) · **optional real-time supervisor** that dispatches to the harness + narrates via SSE seq-replay, toggle-able mid-run.
- Stack: **LiveKit Agents** transport behind a thin `realtime` adapter; realtime model behind the LLM adapter (S2S supervisor / cascading baseline). Grok = strongest latency candidate, not a hardcoded default.

## 3. Architecture & mechanics

**The LLM port (one seam, swappable impl behind it).** The harness's `AGENT_ENGINE` registry (F05) resolves an engine through **our LLM port**; the committed impl is **`ai-sdk-engine`** (Vercel AI SDK). No double-abstraction: our port is the stable seam, the AI SDK is the impl behind it. The `model-config` catalog (F05) holds ids/params — **no hardcoded model/default** anywhere.

**Three provider layers (kept separate).**
1. **Coding/dev runtimes** — Codex, Claude, Gemini, xAI (OAuth; SuperGrok Heavy / Claude Max / Codex Pro / Gemini Pro daily). Untouched by the product seam; this is the F10 dev system, not product inference.
2. **Product inference** — what the harness calls for end users. **BYOK in OSS** (the user's own keys via the F05 connection layer + F03 secrets). **SaaS = eval-driven dev-provider selection → a gateway at time-to-scale.**
3. **Realtime voice (S2S)** — the supervisor's model, behind the same LLM port.

**Gateway (SaaS, at scale).** A multi-provider gateway sits *behind* the LLM port when SaaS scale justifies it: **LiteLLM self-host / Vercel AI Gateway / OpenRouter** are the candidates — selected by the **build-time live-eval** (a validation, **not a planning blocker**), and burned against the GCP dev/eval credit budget (F04). The gateway is impl-behind-the-port; call sites never change.

**Voice = three coexisting modes (canon).**
- **text** (default).
- **baseline turn-based STT↔TTS** (retained) — provider behind the **voice adapter** (cascading STT → LLM → TTS).
- **optional real-time supervisor** on top — handles **voice I/O + barge-in**, **dispatches** tasks to the harness (**never runs heavy work inline**), **subscribes to the run's native-SSE event stream** (F08) to narrate + take mid-flight changes, and is **toggle-able mid-run via seq-replay** (the capability that justified keeping native SSE over rebinding to AG-UI, F08).

**Realtime stack.** **LiveKit Agents** transport behind a thin **`realtime` adapter**; the realtime model behind the **LLM port** (S2S for the supervisor / cascading for baseline). **Grok = strongest latency candidate, not a hardcoded default** — chosen by eval, swappable. The realtime infra and the realtime model are two separate seams (transport vs model).

**Supervisor↔harness dispatch contract.** The supervisor is a thin voice layer: `dispatch(task) → runHandle`, then subscribe to `runHandle`'s SSE stream for narration; user barge-in/changes during the run are applied via the run's mid-flight change path. The supervisor holds **no business logic** — it routes voice to dispatch and reads the stream back.

## 4. Remaining peripheral decisions to cement

- **Gateway choice + timing (cemented posture):** BYOK in OSS now; a gateway (LiteLLM/Vercel AI Gateway/OpenRouter) behind the LLM port at SaaS time-to-scale, selected by the build-time live-eval; never a hardcoded default.
- **Realtime adapter boundary (cemented):** LiveKit Agents behind the `realtime` transport adapter; the realtime model behind the LLM port — two seams.
- **Supervisor dispatch contract (cemented):** `dispatch → runHandle` + SSE narration + mid-run change; no inline heavy work, no business logic in the supervisor.

## 5. Dependencies & interfaces

- **F05 (harness)** — serves the `AGENT_ENGINE` registry; the connection layer supplies BYOK keys.
- **F08 (transport)** — voice narration + mid-run toggle ride native SSE seq-replay.
- **F03/F13** — provider keys via the secrets adapter; the voice/realtime adapters are F13-family ports.
- **F04 (hosting)** — realtime infra + the kitchen run the long voice/agent sessions; GCP credits fund the eval.
- **F14/F16** — gateway-fronted inference is part of the commercial/managed layer; BYOK is the OSS story.

## 6. Verification & closing criteria

- The harness reaches a model only through the LLM port; a provider/model swap is a `model-config`/`AGENT_ENGINE` change with zero call-site edits.
- BYOK works in OSS (user keys); a gateway plugs in behind the port for SaaS without call-site changes.
- All three voice modes work: text default; baseline STT↔TTS; the real-time supervisor dispatches to the harness, narrates via SSE, and **toggles on mid-run** via seq-replay.
- The supervisor runs no heavy work inline (dispatch-only) and holds no business logic.
- The **build-time live-eval** runs as a validation (latency/quality across candidate realtime + text providers) and **does not block planning**; results select the gateway/provider, funded by the GCP eval budget.

## 7. Risks & verify-at-build (dated 2026-06-02)

- **Provider/model availability + realtime latency** move constantly — eval at build, never hardcode a default; Grok is a latency *candidate*, not a commitment.
- **LiveKit Agents version** — pin + verify the transport API at build.
- **Gateway pricing/feature drift** (LiteLLM/Vercel AI Gateway/OpenRouter) — re-verify at the time-to-scale decision; keep behind the port.
- **Realtime cost shape** — long voice sessions are I/O-wait-heavy; this is exactly why the kitchen is a container/DO, not Vercel (F04).

## 8. Sources

- `12-agent-native/deep-dives/provider-landscape-and-tradeoffs.md`, `13-realtime-voice/recommendation.md`, synthesis §3 (Voice & real-time), canon §2 (inference + realtime seams).

## 7. Risks & verify-at-build (dated)

- Provider/model availability + realtime model latency — eval at build; LiveKit version — verify.

## 8. Sources

- `12` provider-landscape, `13-realtime-voice`, canon §2.

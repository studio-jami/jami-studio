# F05 — Harness (runtime)

Status: AUTHORED 2026-06-02 · Domain: B · Agent substrate (`@jami-studio/harness`)
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/12-agent-native/{engine-harness-memory.md,recommendation.md}`, `06-rebuild-feasibility`
Related: F06 (policy seam), F07 (data), F08 (transport), F09 (render), F10 (orchestra), F11 (provider)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

The core governed agent loop + engine. **In:** loop, engine registry, memory, tool/contract registry, dual-invocation. **Out:** policy decisioning (F06), orchestration (F10).

## 2. Committed decisions (from canon)

- Forked wholesale from MIT **agent-native `core`** (fork target `@agent-native/core` 0.32.2) → `@jami-studio/harness`.
- **`AGENT_ENGINE` registry + `ai-sdk-engine`** (Vercel AI SDK) = the multi-provider abstraction; central `model-config` catalog (no hardcoded models).
- Memory; tool/contract registry; native connection/secret layer; thin infra adapters.
- **Dual-invocation:** every capability reachable by human UI and agent against one governed contract.
- The **`policyCheck()` seam** is the single authz choke point (defined in F06).

## 3. Architecture & mechanics

**Fork source.** `@jami-studio/harness` is forked **wholesale** from the MIT **agent-native `core`** (Builder.io) at fork target **`@agent-native/core` 0.32.2** (0.23.0 is the read-clone). Greenfield forbids carrying *our* legacy forward — it does not forbid adopting a hardened MIT third party; this is the Principled-Edge stand-on-shoulders move. Fork-time hardening: lift the LICENSE notice (MIT-origin files keep their notice; add our Apache-2.0 `LICENSE` + `NOTICE`, F14); **fix the `oauth_tokens` read-scope gap** (owner/org-required reads — see §4).

**The governed agent loop.** The core lifecycle: receive a turn → resolve principal (F02) → plan/step → for each tool/action call **`policyCheck()` first** (F06, default-deny on error) → execute → emit events on the native-SSE spine (F08) → persist run state → repeat until done/await/approval. The loop is **transport-decoupled** (agent-native's design): the same loop drives text, voice (F11), and agent-to-agent. **Run-manager + run-loop-with-resume** make runs durable — a run survives process restarts and can resume from persisted state; triggers + cron + approvals complete the durable shape (this is the **Option A+** planner posture: no DAG/workflow engine in the product runtime — F10).

**Engine registry (`AGENT_ENGINE` + `ai-sdk-engine`).** The multi-provider abstraction: the loop calls models through an engine resolved from `AGENT_ENGINE`; the committed default impl is **`ai-sdk-engine`** (Vercel AI SDK) behind our LLM port (F11). A central **`model-config` catalog** holds model ids/params — **no hardcoded models anywhere** (canon §1). Swapping the Builder LLM gateway → our ai-sdk/anthropic engine is a config/adapter swap, not a rewrite.

**Tool/contract registry + dual-invocation.** Every capability is registered once as a **governed contract** (tool schema + action schema, Zod-typed). Both a human (via UI → F09 `UIPayload` actions) and an agent (via the loop) invoke **the same contract against the same `policyCheck()` gate** — dual-invocation. There is exactly one enforcement path; the UI never has a privileged backdoor.

**Memory + native connection/secret layer.** Memory is the run/session store (Postgres via the db adapter, F07) + working context. The **native connection/secret layer** resolves provider credentials per principal through the F03 secrets adapter (BYOK in OSS — the user's own keys; gateway-fronted in SaaS, F11) — the harness never holds raw keys inline. Thin infra adapters (db, storage, email, realtime) sit behind their F11/F13 ports.

**Thin infra adapters.** DB default → Postgres (F07); transcription → `Transcriber` adapter (F11); 6 hardcoded accent tints → the tokenized generator (F09); analytics/branding → ours. All config/adapter swaps at fork time.

## 4. Remaining peripheral decisions to cement

- **Engine/adapter seam shapes (cemented direction):** `AGENT_ENGINE`-resolved engine over the F11 LLM port; thin db/storage/email/realtime adapters; final seam-file map verified against agent-native 0.32.2 at fork.
- **Provider-config shape (cemented):** central `model-config` catalog, no hardcoded models; ids/params data-driven.
- **`oauth_tokens` read-scope fix (cemented, security):** reads require owner/org match — close the gap **at fork**, before the harness touches any real credential. (Surfaced from the agent-native fact-finding; a genuine security fix, not optional.)

## 5. Dependencies & interfaces

- **Exposes** the run/contract surface to **F08** (event stream), **F09** (emits `UIPayload`), **F10** (orchestra drives harness runs), **F15** (capabilities = the AX surface).
- **Consumes** **F06** (`policyCheck()` on every governed action), **F11** (LLM + realtime engines), **F07** (run/memory persistence), **F02** (principal), **F03** (secrets via the connection layer), **F13** (infra adapters).
- **F04** runs the harness as a Node service in the kitchen, not as a Next.js app.

## 6. Verification & closing criteria

- `@jami-studio/harness` builds from the 0.32.2 fork with the LICENSE/NOTICE lifted and the `oauth_tokens` read-scope fix in place.
- The loop executes a governed run end-to-end: principal resolved → `policyCheck()` gates every tool call → events emit on native SSE → run state persists → resume-after-restart works.
- A model swap is a `model-config`/`AGENT_ENGINE` change with zero call-site edits; no model id is hardcoded.
- Dual-invocation proven: the same contract invoked by a human-driven UI action and by the agent loop hits one `policyCheck()` path with identical authz outcome.
- BYOK works in OSS (user keys via the connection layer); the gateway path (F11) works in SaaS — both behind the same engine seam.

## 7. Risks & verify-at-build (dated 2026-06-02)

- **Version drift:** clone 0.23.0 vs npm 0.32.2 — **pin the fork at 0.32.2** (+ `@agent-native/dispatch` 0.8.28 for orchestra, F10); verify the seam-file layout at 0.32.2 (it differs from the read-clone).
- **`oauth_tokens` read-scope gap is a live security bug** in the upstream — must be fixed at fork (§4), confirmed by test, before any real credential flows.
- **agent-native is pre-1.0** — its internal seams can move; isolate our swaps behind the ports so an upstream bump is absorbable.
- **Public-Preview governance SDK** (F06) sits on the loop's hot path — keep it behind `policyCheck()` so its API churn never reaches the loop.

## 8. Sources

- `12-agent-native/engine-harness-memory.md` + `recommendation.md` + `fact-finding/fact-finding-synthesis.md`, synthesis §3 (Foundations architecture), `06-rebuild-feasibility`.

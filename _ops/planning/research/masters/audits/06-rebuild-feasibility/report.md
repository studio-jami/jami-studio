# Foundations Architecture Brief — jami.studio Studio Foundations

Date: 2026-06-01
Status: Committed direction (greenfield). Supersedes the 2026-05-31 feasibility/options report.
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Scope: The committed final-shape architecture for the open-source layer under the `oss` org-lane. The
**foundations** (the substrate) are three: **harness** (`@jami-studio/harness`), **ui** (`@jami-studio/ui`, the UI Registry),
**orchestra** (`@jami-studio/orchestra`) — under `dev/oss/jami.studio/projects/`. Two further `oss` domains **consume** the
foundations and are covered here too: **`intercal`** (agent-delta — the delta knowledge graph, its own
domain ≈intercal.dev) and **`collective`** (agent-collective — the open agent society, its own domain).
They are **not foundations inside jami.studio.**
Forked wholesale from the MIT **agent-native** foundation (Builder.io — `@agent-native/core` 0.32.2 +
`@agent-native/dispatch` 0.8.28) and built out on the 2026 official protocol + governance stack. Greenfield
forbids carrying *our* legacy forward, never adopting a hardened MIT third-party foundation. No extraction
from any prior *yrka* project. Full module map + swap list: `../12-agent-native/recommendation.md`.

---

## Executive Summary

The three foundations (`harness`, `ui`, `orchestra` under `oss/jami.studio`) — plus the
two independent `oss` domains that build on them (`intercal`, `collective`) — are built **greenfield on
the consolidated 2026 open protocol stack**, and every commercial product (the `saas/yrka` monorepo) and
personal surface (`personal/jnh.org`) composes over the foundations. They are **forked wholesale from the MIT `agent-native` foundation**
(Builder.io) — its transport-decoupled agent loop, open multi-provider engine registry, single persistence
seam, native connection/secret layer, and A2A/MCP surface — with a short list of targeted, first-principled
swaps (BYO LLM engine, Postgres default, tokenized accent generator, our branding/sink). On that forked
substrate we own the thin, audited contract — the governed-action vocabulary and policy library — that is
the actual moat. This is the Principled-Edge stand-on-shoulders move: greenfield forbids carrying *our*
legacy forward, never adopting a hardened MIT third party. The architecture is a small set of shared
foundations with products as compositions; this is the standard 2026 agent-native shape, not
over-engineering, because every abstraction below is load-bearing for the planned end-shape.

The transport layer is **settled and adopted, not built**. The 2026 agent-protocol stack has consolidated
into four clean layers, all with first-party adoption across Anthropic, OpenAI, Google, Microsoft, AWS, and
Oracle (verified 2026-06-01):

- **MCP** — agent ↔ tools & data. Final spec **2026-07-28**, stateless protocol core, Extensions framework
  (Tasks, MCP Apps), W3C Trace Context for distributed tracing, hardened authorization.
- **A2A** — agent ↔ agent. Now a **Linux Foundation** project; **v1.0** shipped early 2026 with **Signed
  Agent Cards** (cryptographic Agent Card verification); 150+ organizations, production use.
- **AG-UI** — the **external/third-party interop** channel (our agents ↔ outside apps/agents). Open
  event-based session protocol (streamed events, typed shared state, typed tool calls); stewarded by
  CopilotKit ($27M raised), adopted by Google/Microsoft/AWS/Oracle and LangChain/Mastra/CrewAI/PydanticAI.
  Built as a shipped adapter (`@assistant-ui/react-ag-ui`) — **not** the internal transport.
- **A2UI / MCP Apps** — portable generative-UI payloads carried when an agent returns UI.

The committed architecture stands on these as **transport** and keeps an **owned, versioned, audited
semantic vocabulary** (tool/action schemas, the SDUI/primitive vocabulary) riding over them. We own the
contract that is the differentiator; we never reinvent the transport — that is the over-engineering trap.
Internally the agent ↔ app surface runs on **agent-native's native SSE spine** (bounded sequence-replay +
a global DB-sync channel — capabilities AG-UI cannot model); **AG-UI is the separately-built external
interop adapter**. Two transports, both shipped — neither optional, neither replacing the other.

The governance layer is **adopted, not rebuilt**. Microsoft's **`@microsoft/agent-governance-sdk@4.0.0`**
(MIT, **Public Preview**) is an in-process policy engine: a YAML `PolicyEngine` with
`evaluate(action, context)` / `evaluatePolicy(agentDid, context)`, an in-memory SHA-256 **hash-chain** audit,
and Cedar/OPA as **external HTTP bridge** clients (not embedded). We adopt it as a pinned MIT dependency
**behind one `policyCheck()` seam** (default-deny on error) and author only the operator policy library +
audit-query/export layer; our durable Postgres audit row stays the system of record, with the SDK's
hash-chain a complementary integrity layer. Because it is Public Preview, the seam stays. Building this from
scratch would be pure reinvention of a maturing open primitive.

This brief states the committed contracts for each foundation. **The sign-in shape is now decided**
(soft-locked, canon §2 Identity & sign-in): self-hosted **BetterAuth as an OIDC issuer per domain**,
passkeys-preferred + OAuth fallback, domains unfederated-but-OIDC-ready, public marketing routes ungated
crossing to gated `app.<domain>`. Voice is in scope as **three coexisting modes** (text / baseline STT↔TTS /
optional real-time supervisor — see Voice & real-time below). The only genuinely-open item left (canon §4)
is **final product/brand names**. Everything else is committed.

---

## The Foundations (3) + the Independent oss Domains (2)

These are independent OSS packages; the inward-import discipline is strict (apps → packages, packages →
packages, never the reverse; no sibling imports). Each is the production shape of its layer — no MVP rung.
The **first three are the foundations** (the substrate, under `oss/jami.studio`); the **last two are their
own `oss` domains** (own repos, own brands/domains) that *consume* the foundations — not foundations.

| Project | Lane / kind | Role | Stands on | Owns (the moat) |
|---|---|---|---|---|
| **`@jami-studio/harness`** | `oss/jami.studio` — **foundation** | Provider-agnostic agent runtime: the governed action loop, tool invocation, memory, the dual-invocation seam | MCP (tools), A2A (inter-agent), governance SDK (policy gate) | The governed-action contract shape; the LLM adapter; the audited loop |
| **`@jami-studio/ui`** (UI Registry) | `oss/jami.studio` — **foundation** | Primitive/token UI system + the agent-to-UI rendering vocabulary | native SSE (internal transport), AG-UI (external interop), A2UI/MCP Apps (payloads) | Design tokens; the primitive component vocabulary; the SDUI/action payload schema |
| **`@jami-studio/orchestra`** | `oss/jami.studio` — **foundation** | The build/work orchestration surface (teams, squads, scheduling) composed over harness + UI | `@jami-studio/harness`, `@jami-studio/ui`; Multica as the runtime | Operator workflow composition; the thin Multica↔record adapter |
| **agent-delta** (Intercal) | `oss/intercal` — **own domain** | The delta knowledge graph: durable changelog + cross-system knowledge substrate | the foundations; one data plane, MCP resources | The graph schema; the audited recall/store event model |
| **agent-collective** | `oss/collective` — **own domain** | The open agent-society protocol: deposit/governance/public-view harness | the foundations; A2A, Intercal | The deposit protocol contract; reputation/governance schema |

Intercal lands second (immediately after harness + UI), because the Collective and the downstream
yrka.io research/daily-brief surfaces all read from it. orchestra is the dogfooding ground that
perfects harness + UI UX through real use.

---

## Committed Architectural Contracts

These are the contracts authored fresh and locked first — expensive to change later, cheap to get right
now. Everything composes over them.

### 1. Identity / workspace / role model
One identity, workspace, membership, and role model **per domain (the identity surface)**. Every actor
(human or agent) has an identity; every action is attributed; entitlements are bundles of per-capability
grants (`capability_grants`), never plan monoliths. **The sign-in shape is decided** (canon §2): self-hosted
**BetterAuth as an OIDC issuer per domain**, passkeys-preferred + OAuth fallback, intra-domain SSO via OIDC,
domains unfederated-but-OIDC-ready, public marketing routes ungated → gated `app.<domain>`, agents as
first-class principals. The identity/entitlement *model* is committed; only IdP/vendor specifics verify at lock.

### 2. Data plane
**One Postgres, namespaced schemas, row-level security.** Tools / workspace / billing / audit each in their
own schema under RLS. Explicit select contracts (no implicit `SELECT *` across a trust boundary), enforced
migration ordering, append-only audit. This is the standard multi-tenant shape and is *less* complex than
per-capability isolated databases. The database sits behind the db adapter (canon: agnostic + adaptable).

### 3. Adapter boundaries
Thin adapters at exactly the seams where vendor churn is real: **db / storage / auth / billing / LLM /
host**. The LLM adapter spans the operator's OAuth coding-runtime set and inference providers (Claude,
Codex/GPT, Gemini/Vertex, xAI/Grok, plus inference vendors) so model choice is never a refactor. No
abstraction for seams that do not churn — that would be bloat. "Thin adapter at the seam," not "abstract
everything."

### 4. Design tokens + primitive UI vocabulary (ui)
A fully tokenized, parameterized design system — accent color is a token, never a hardcoded value (canon
§0: root-correct). The primitive component vocabulary is the UI Registry's owned surface. Nothing bypasses
tokens; no one-off visual systems. This vocabulary is what the agent-to-UI payload renders against.

### 5. Governed-action contract (harness)
Every capability is reachable by **both** human UI and agent **against the same contract** (dual-invocation).
Each action is a thin adapter over a domain action module: review-first writes, scoped read tools, an audit
write adjacent to each mutation, service-role credentials kept server-only and inventoried. Every action
exit passes through the `policyCheck()` seam (over the Microsoft governance SDK) before execution. This is the moat — the
audited, governed contract — and it is authored fresh, not extracted.

### 6. Protocol transport
**MCP** for tools/data, **A2A** for inter-agent. The **internal** agent-to-UI channel runs on agent-native's
**native SSE spine** (seq-replay + DB-sync); **AG-UI** is the separately-built **external interop** adapter;
**A2UI / MCP Apps** are portable UI payloads. The owned semantic vocabulary (e.g. `ui.tree.render`,
`ui.action.invoke`, tool/action schemas) rides over whichever transport and is versioned and audited
independently. Target the MCP **final core (2026-07-28)**, not the RC; keep the owned vocabulary insulated
behind the harness so a transport revision is contained.

### 7. Governance / audit layer
Adopt **`@microsoft/agent-governance-sdk@4.0.0`** (MIT, **Public Preview**) behind one `policyCheck()` seam:
in-process YAML `PolicyEngine`, `evaluate(action,context)` / `evaluatePolicy(agentDid,context)`, in-memory
SHA-256 hash-chain audit, Cedar/OPA via external HTTP bridges, W3C Trace Context. Author only: the
operator-specific **policy library** and a **SIEM-shaped audit-query/export** surface; the durable Postgres
audit row is the system of record. Data-layer permissions (PBAC) sit alongside tool-layer policy.

### 8. Memory + knowledge (agent-delta)
A layer/slot/lifecycle memory abstraction where every recall and store is an audited event — memory is
aligned with the governance thesis. Intercal (agent-delta) is the durable changelog and cross-system
knowledge graph; it is the single substrate the research/daily-brief surfaces and the Collective read from,
so no surface ships its own scraping/changelog.

### 9. Voice & real-time (three coexisting modes)
**Text** (default), **baseline turn-based STT↔TTS voice** (the retained cascading STT→LLM→TTS path), and an
**optional real-time supervisor layer** on top. The supervisor's only jobs are voice I/O, turn-taking,
barge-in, and **dispatch** to the harness — it never runs heavy work inline; it subscribes to the run's
native-SSE stream (seq-replay) to narrate + take mid-flight changes, and is toggle-able mid-run. Built on
self-hostable OSS: media/transport behind a thin **`realtime` adapter** (LiveKit Agents default), the
realtime **model behind the LLM adapter** (speech-to-speech default, normalized to the OpenAI Realtime
schema). Net-new is only the thin glue (dispatch bridge + narration subscriber + session-mint). The live-eval
is a build-time validation, not a planning blocker. Full architecture: `../13-realtime-voice/recommendation.md`.

---

## Why This Shape (first principles)

1. **Foundations are libraries; products are compositions.** A provider-agnostic runtime + a token/primitive
   UI kit are the substrate; each product is a thin domain layer. This is the only shape that lets one
   operator drive many products without per-product reinvention.
2. **Stand on open transport, own the vocabulary.** The transports (MCP/A2A/AG-UI) are maintained upstream by
   the majors; the owned contract (tool/action schemas, SDUI vocabulary, policy library) is small, durable,
   and is the actual differentiator. Reinventing transport buys nothing; owning the audited contract is the
   moat.
3. **Governance is an adopted layer.** ~80% of the policy/audit engine exists under MIT and covers the OWASP
   Agentic Top-10. The operator's value-add is the policy library and audit-query surface, not the engine.
4. **One data plane, namespaced + RLS.** One Postgres, one identity, one entitlement ledger is the standard
   multi-tenant shape and is leaner than isolated per-capability databases.
5. **Agnostic only where churn is real.** Adapters at db/storage/auth/billing/LLM/host; nothing abstracted
   for stable seams. Cutting corners and over-engineering are the same failure — weight uncorrelated to
   capability.
6. **Dual-invocation everywhere.** Every capability reachable by human UI and agent against the same governed
   contract — this is what makes "one human, many agents" auditable and reversible at this scope.

---

## Orchestration (orchestra)

**Multica is the whole orchestration system** — tasks, runtime, orgs, scheduling, teams/squads,
multi-provider routing — self-hosted. **The continual Multica orchestrator replaces `goal.md`**: the
"read goal.md, spawn subagents" prompt becomes durable, scheduled pipeline parts that run as work is added to
the workspaces. There is **no separate board to sync to**; Linear and Notion are available but not forced
and not required. orchestra composes Multica with harness + ui; where a one-way record
mirror is wanted it is a thin owned adapter (Multica documents no native Linear sync).

Verified 2026-06-01: **Multica v0.3.1** (released 2026-05-15) — manages coding agents as teammates
(profiles, board presence, comments, blockers), Squads (leader-routed groups), Autopilots (scheduled
recurring work), Skills (cross-agent reusable workflows), broad CLI runtime coverage; self-hosts via Docker
Compose / single binary / Kubernetes, keys and execution stay local. **License: modified Apache 2.0 with a
SaaS-hosting restriction** — fine for internal self-host; the clause must be read before any hosted/
productized exposure.

**Coding runtimes** are OAuth: Codex, Claude, Gemini, xAI. Daily drivers: SuperGrok Heavy, Claude Max, Codex
Pro, Gemini Pro; enterprise Vertex/Azure credits for dev/test API + compute. **In-session gates run first**
(hooks enforce the verification ladder, fail closed before commit/push); remote CI is an additional gate,
never the only one. **Hermes stays fully separate** — its runtimes, proxies, and configs are not part of the
dev system and are not mixed into the reorg.

---

## Skills, Docs, Tooling (committed)

- **Skills.** Official canon set = vendor official skills (gcloud, azure, cloudflare, vercel, supabase, neon,
  stripe, resend, mintlify, …) + one trusted community baseline chosen on merit. **We never edit or maintain
  official canon.** We author only a *tiny* thin-bridge orchestration skill set encoding our deterministic,
  repeatable flows; if a shipped official skill already does it as well or better, we ship nothing there. No
  manufactured skill-maintenance burden.
- **Docs.** Mintlify (style or hosted for live projects). Well-maintained Markdown, minimal maintenance. Not
  Notion, not Google.
- **Tooling for solved problems.** Changelog, docs generation, system mapping/graphing, testing, browser
  automation use industry-leading OSS/free agent-friendly tools, picked on merit (evaluate candidates such as
  `codegraph`, `composto`, `Maestro`, `chrome-devtools-mcp` and their competitors — no bias to the list). No
  bespoke tooling for solved problems.
- **Testing discipline.** Critical-path + governance-policy conformance tests on the owned governed-action
  seam; explicit test flows to contain runaway token spend. No tests for trivial UI surface changes or
  trivial events with no system effect.

---

## Closing Criteria (full implementation, no partials)

The foundations are complete when:

1. **harness** exposes the governed-action contract with dual-invocation, the LLM adapter spanning the
   runtime set, MCP tool transport, A2A inter-agent transport, the memory abstraction, and every action exit
   passing the governance gate with an adjacent audit write.
2. **ui** ships the full token system + primitive vocabulary and renders the owned SDUI/action payload
   over the native SSE spine internally, with the AG-UI external interop adapter shipped alongside (both
   carry A2UI/MCP Apps payloads).
3. **agent-delta** ships the knowledge-graph schema + audited recall/store event model as the single durable
   changelog/knowledge substrate.
4. **orchestra** runs the build via self-hosted Multica with in-session gates, replacing goal.md.
5. **agent-collective** ships the open deposit protocol + governed harness + public view over A2A and
   agent-delta.
6. The data plane (one Postgres, namespaced, RLS, select contracts, migration order, append-only audit) and
   all six adapters are in place; the operator policy library + audit-query/export surface sit on the
   `policyCheck()` seam over the governance SDK.

---

## Open (creative / scope)

- **Final product/brand names (canon §4).** The only genuinely-open item — a dedicated naming sweep for
  when Jamie has the feel for the shape; one cohesive set, conventional/canon where possible (leanings:
  etymara, intercal.dev). Domains are settled.

The **sign-in shape** and the **directory arrangement** are now decided (soft-locked — canon §2). Everything
else defaults to the committed, final-shape answer above.

---

## Sources (verified 2026-06-01)

- **MCP** — final spec + stateless core: <https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/> ;
  2026 roadmap: <https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/> ; spec: <https://modelcontextprotocol.io/specification/2025-11-25>
- **A2A** — Linux Foundation, v1.0, Signed Agent Cards, 150+ orgs:
  <https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year> ;
  <https://a2a-protocol.org/latest/>
- **AG-UI** — protocol + adoption: <https://www.copilotkit.ai/ag-ui> ;
  <https://www.copilotkit.ai/blog/oracle-adopts-ag-ui-protocol-for-agent-spec> ;
  <https://techcrunch.com/2026/05/05/copilotkit-raises-27m-to-help-devs-deploy-app-native-ai-agents/>
- **A2UI** — generative-UI payload: <https://developers.googleblog.com/a2ui-v0-9-generative-ui/>
- **Microsoft `@microsoft/agent-governance-sdk@4.0.0`** (MIT, **Public Preview**; published 2026-05-29 — the
  bare `agent-governance-toolkit` name is 404 on GitHub/npm): npm `@microsoft/agent-governance-sdk` ;
  <https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/>
  (the blog says "generally available"; the shipped artifacts are Public Preview — verify status before the critical path)
- **Multica** v0.3.1, modified-Apache-2.0 + SaaS restriction, self-host: <https://github.com/multica-ai/multica> ;
  <https://github.com/multica-ai/multica/blob/main/LICENSE> ; <https://codepick.dev/en/guides/multica-setup/>

**Could not independently re-verify (carry as open checks):** the Microsoft governance SDK's GA-vs-Public-
Preview status (artifacts read as Public Preview; confirm before putting it on the critical path); the exact
text of the Multica SaaS-restriction clause (read the LICENSE before any hosted exposure); the agent-native
seam files at fork target 0.32.2 (re-diff vs the 0.23.0 read-clone at fork time).

# agent-native Adoption — Spec-Readiness Review (DRAFT, NOT OFFICIAL)

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

Date: 2026-06-01. Owner: Jamie (<jamie@yrka.io>). Isolated planning/discussion pass — **nothing
locked, nothing declared official**. This synthesizes the four adversarial lens reviews on disk
(`transport-agui.md`, `foundation-challenge.md`, `architecture-holes.md`, `ops-legal-ethos.md`)
against the spec (`../recommendation.md` + the 4 pillars + `../deep-dives/*.md`) and ground-truth
source at `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`
(`@agent-native/core` 0.23.0 clone) and `…\rebuild\voice-prototypes`.

---

## 1. Verdict

**SOUND-AFTER-CLOSING-N-HOLES.** The foundation decision is correct and survives four independent
adversarial passes — adopt agent-native wholesale, hard-fork, own it. No lens recommends a
different foundation; the strongest challenger (Mastra) loses on the load-bearing axes (full-MIT
including the runtime, `dispatch` control plane, file-shared-state thesis). But the spec is **not
yet ready to firm up as-is**: it has **2 blocking holes** (one legal, one data-model), one
**confirmed in-source security gap** (HIGH), and a cluster of medium holes where load-bearing
claims are asserted-but-unproven and three swaps are framed as "config/adapter" when they are real,
unbudgeted builds.

The single sentence that captures all four lenses: **the architecture is excellent and the adopt
call is right; the spec's framing runs ahead of its evidence in five specific places, and those
five must be closed (mostly by proof-of-work spikes, not redesign) before green light.** This is
needs-spec-completion, not needs-rework.

One framing change is required across all lenses: re-frame agent-native from **"production-shaped,
battle-tested foundation"** to **"correctly-architected, lightly-proven, single-vendor pre-1.0
codebase we hard-fork and own."** "Battle-tested" is true only of the seams `voice-prototypes`
actually exercised (loop, engine registry, Postgres, connection/secret layer); everything else is
read-not-run. This re-frame doesn't change the decision — it corrects the risk posture and the
proof-of-work gate the spec currently under-budgets.

---

## 2. Holes that MUST close before green light (ranked)

| # | Hole | Where | What closes it |
|---|------|-------|----------------|
| **H1 (BLOCKING, data-model)** | The `System > Org > Project + entitlement-keys + capability-grant` hierarchy is treated as "mapped beforehand" but is specified **nowhere**. agent-native ships only **Org > Resource** (`org/schema.ts`: `organizations`+`org_members`; `sharing/schema.ts`: `ownerEmail\|orgId\|visibility`) — no Project tier, no entitlement-key table, no capability catalog. RBAC + MS-toolkit + `assertConnectionUse` all layer on a schema that doesn't exist. The policy hook is even quoted two incompatible ways: `policyCheck(capability, principal, resource)` (rec §3) vs the toolkit's real `evaluate({tool_name, action,…})`. | `recommendation.md` §6; `architecture-holes.md` H1 | Write the concrete hierarchy DDL + capability catalog + team/group principals, map it onto `organizations`/`org_members`/`*_shares`, and reconcile the `policyCheck` signature with the toolkit's `evaluate()`. Until this exists, the whole entitlement plane is building on sand. |
| **H2 (BLOCKING, legal)** | **No root `LICENSE` file exists** (verified absent this pass: root + `packages/core`). MIT is asserted via per-package `"license":"MIT"` fields only. MIT's one obligation — reproduce the copyright notice — cannot be met without the holder string, and the stack is intended to be **sold** via yrka.io. The spec flags this "could not verify" then proceeds as if redistribution is cleared. It is *blocked pending one file*. | `recommendation.md` §7; `ops-legal-ethos.md` H1/R1; `foundation-challenge.md` H2 | `npm pack @agent-native/core && tar -xzf` — the tarball almost always bundles the LICENSE even when GitHub 404s. Record verbatim holder+year into the fork's `LICENSE`+`NOTICE`. 10-minute fix, but a hard gate on redistribution. |
| **H3 (BLOCKING- adjacent, scope/ethos)** | The orchestra "declarative DAG/workflow engine" is named as net-new **"if and when"** (`recommendation.md:176`) — which violates canon's full-final-shape / no-"defer-until-demand" rule (`plan.md:74`). Zero contract, no build-vs-adopt call, no closing criteria. The spec straddles "we may not need a planner" and "we'll build one later." | `recommendation.md` §4; `foundation-challenge.md` H3; `architecture-holes.md` A3 | Resolve from first principles: either **prove the end-shape needs no planner** (delete the hedge) **or** scope it full-shape and name the adopt-not-build comparator (**Mastra's workflow engine**, verified Apache-2.0 core, is the candidate) + the attach-seam (dispatch's event-bus + run-manager). |
| **H4 (MED→HIGH, the central transport hole)** | "Rebind transport to AG-UI (adapter swap on the SSE/endpoint contract)" is the easy *client* half. The unbudgeted hard half is **server-side**: a `SSEEvent → AG-UI event` translator (~5 of agent-native's event kinds map cleanly, ~7 need `Custom`/server-absorption, 2 — `seq`-replay and `clear` — are structurally foreign to AG-UI). Plus AG-UI defines **no render event**, so the owned SDUI vocabulary (`ui.tree.render`/`ui.action.invoke`) has no defined carriage. The surface is 5,307 LOC of assistant-ui coupling; "adapter swap" may be a partial rebuild. | `transport-agui.md` H1/H2; `architecture-holes.md` H3; `foundation-challenge.md` H4 | The translator spike (P-AGUI below). Pick the SDUI carriage (`Custom` for proactive UI, `ToolCallResult`/MCP-Apps for tool UI). Re-budget ui honestly: "adopt tokens + agent surface, **build** the translator + render path." |
| **H5 (MED, security audit contract)** | `assertConnectionUse()` + the append-only `connection_use` audit row are named but **unshaped** — no DDL, no retention window, no append-only enforcement primitive (a Postgres table the app can `UPDATE`/`DELETE` is not tamper-evident), and no stated relationship to the MS toolkit's **own** tamper-evident Merkle/Decision-BOM audit (risk of two conflicting logs). For a system whose whole crux is non-leaking audit, the durability contract is blank. | `provider-authz-audit-crux`; `architecture-holes.md` H2; `ops-legal-ethos.md` H4 | Specify the table DDL + retention + write-once medium/export, and decide: our row, the toolkit's audit, or one subsumes the other. Resolve in the toolkit spike. |

Secondary holes to close (not blocking, but real, all flagged ≥2 lenses): the **accent-token
generator contract** (input seed → which derived tokens? OKLCH ramp? WCAG contrast guarantee? — a
goal, not a design, `architecture-holes.md` H4); the **core-provider list + shared reliability
wrapper** ("per-provider readers are ours to write" repeated 4× across docs, never enumerated or
budgeted — violates full-final-shape, `architecture-holes.md` H5/A4, `foundation-challenge.md`
H6); the **fork mechanism** (subtree vs submodule vs published-fork, CVE-watch owner, re-verify
cadence — hand-waved to two verbs, `ops-legal-ethos.md` H2); the **per-org registry contradiction**
("one shared registry" in body vs "N auth'd endpoints" in the deep-dive, `ops-legal-ethos.md` H3).

---

## 3. Risks ranked (high → low)

| Sev | Risk | One-line mitigation | Changes decision? |
|-----|------|---------------------|-------------------|
| **HIGH** | **`oauth_tokens` read path is NOT org/owner-scoped** — confirmed in source this pass: PK is `(provider, account_id)`, `getOAuthTokens(provider, accountId)` reads `WHERE provider=? AND account_id=?` with **no owner arg** (store.ts:47-59); the post-leak fix only hardened the *write* path (409 owner-guard) and `hasOAuthTokens`. `workspace_connections` enforces `scopedWhere`→`org_id` on every query; oauth_tokens does not. | Add owner/org-required reads mirroring `workspace_connections`; route all token reads through the scoped `resolveWorkspaceConnectionCredentialForApp`; cover with `assertConnectionUse` + a CI guard. Fork-time hardening, must be on the checklist. | No — closable hardening. |
| **HIGH** | **Single-vendor, pre-1.0, ~443-star, vendor-says-"very early" foundation** for a multi-year platform → bus-factor/abandonment. | The hard-fork **is** the mitigation: own CI/release line, no upstream-tracking dep; one-time "operate without upstream" audit (build from source, run tests, confirm no hidden hosted calls); treat fork as a permanent maintenance line. | No — but re-frame maturity (§1). |
| **HIGH** | **Cumulative solo-operator load** — pinned-fork rebase + N per-org auth stores + N vaults/keys + N registry endpoints + per-provider clients + optional Nango sidecar + dual render paths exceeds canon's "no burdensome maintenance." | Lean the shape: **soft per-org isolation as default, hard only on demand**; **one** auth'd registry not N; centralized KMS key custody; git-subtree fork + scheduled CVE-watch agent routine. (Reject "hard isolation is the floor" as under-justified N-multiplication — bloat in the other direction.) | Tunes §6 of spec; not the foundation. |
| **HIGH (legal)** | **Redistribution without a verified copyright notice** (= H2). | Extract LICENSE from npm tarball before any sale; record verbatim holder+year. Blocking gate. | No — gate, not a change. |
| **MED-HIGH** | **Three stacked pre-1.0 security-critical deps drifting at once**: agent-native (0.23→0.32, IDOR PR #369), BetterAuth 1.6.x, MS toolkit pre-GA; plus assistant-ui (clone `^0.12.19` vs live `0.14.13`). | One fork-and-pin policy covering all; single seam-file re-verify checklist per bump; treat assistant-ui coupling as a swap seam. | No. |
| **MED** | **MS agent-governance-toolkit is real+MIT but public-preview / ~2 months old** (released 2026-04-02) sitting on the security-critical spine. | Keep it behind our own `policyCheck()` interface (one adapter file); default-deny on eval error; author policies in Cedar/Rego (toolkit embeds both) for portability; hand-rolled resolver as interim engine if it proves immature. | No — engine is swappable behind the seam. |
| **MED** | **"One choke point" is aspirational, not structural** — today ≥3 gates (`sharing/access.ts`, inline `org/handlers.ts` role checks, connection credentials resolver) + the un-gated `oauth_tokens` read. | Enumerate every resolver needing the hook; add a CI guard (like `guard-no-unscoped-credentials.mjs`) that fails builds bypassing the gate. | No. |
| **MED** | **Builder coupling broader than "one engine"** — `builder-engine.ts` is 907 LOC and Builder error codes leak into the generic retry logic (`production-agent.ts:646-719`). | Add the engine + retry special-cases to the removal/branding sweep; delete, don't just un-register. | No. |
| **MED (scope)** | **Realtime voice is built-but-unproven** — zero latency/barge-in/correctness numbers (locked rule #14 blocked the eval), `goAway` auto-reconnect not implemented (Gemini lane), cost 25-60× dictation, realtime-STT dictation lane has a hard Builder coupling. | Run the approved paid live eval; pick one lane; harden reconnect; per-session cost ceiling — before voice hits any roadmap surface. **Dictation is ready; voice is not.** Architecture (`ProviderAdapter`) is sound. | No — gate voice, not the foundation. |
| **MED (legal)** | **Nango ELv2 contamination** of OSS/SaaS. | Separate internal-only package outside the OSS tree; CI guard banning `nango` imports in published packages; written determination that yrka use is self-host, not "Nango-as-a-service." | No — already quarantined behind seam. |
| **LOW-MED** | **`globalThis` registry** (Vite-SSR dedupe hack) is process-global; safe only one-process-per-org; a future multi-org-in-one-process topology would leak registry/tracking state cross-org. | Make **one-process-per-org** an explicit isolation constraint in the spec. | No. |
| **LOW-MED** | **Bolt-on lock-in re-entry** — AG-UI + MS toolkit + Nango are three new external version-drift surfaces the clean MIT foundation didn't have. | Hard rule: none imported outside its single adapter module (CI-guarded). | No. |
| **LOW** | **Base UI license unchecked** (Radix-vs-Base-UI fork left open). | Pick Radix (already in clone, MIT, zero migration) unless first principles favor Base UI; verify Base UI license if chosen. | No. |
| **LOW** | **AG-UI error/CTA fidelity loss** (`upgradeUrl`/`errorCode`/recoverable → bare `RunError`). | Carry rich error envelope as `Custom`; keep `isAutoRecoverableError` server-side. | No. |

No risk on any lens rises to "change the foundation decision." The two HIGH-severity items that
*gate* work (oauth read-scope, license notice) are both small, closable fixes.

---

## 4. Better-suited solutions (foundation challenge + the rest)

**Foundation challenge — does agent-native wholesale still win? YES, decisively.** Seven named
frameworks steelmanned across the lenses; none beats it for one-human-many-agents + agnostic +
full-MIT-including-runtime + dispatch control plane + file-shared-state + sellable:

- **Build-fresh (AI SDK 6 + assistant-ui + shadcn + own loop)** → **REJECT.** Would re-derive the
  multi-tenant connection/secret vault + leak-hardening + dispatch + org/sharing + A2A/MCP the
  zero-bloat rule forbids re-deriving. Note: agent-native's engine **is** AI SDK under the hood
  (`ai-sdk-engine.ts`), so you keep AI SDK 6 by bumping that adapter — you don't choose between them.
- **Mastra (1.0 Jan 2026, 22k★, Apache-2.0 core, native DAG, AG-UI adopter)** → **REJECT, but
  STRONGEST FALLBACK.** Loses on (a) enterprise SSO/RBAC behind a separate paid Mastra Enterprise
  License (the open-core wall the full-MIT sellable posture avoids), (b) no dispatch-equivalent
  control plane, (c) not the file-shared-state thesis. **Name it as the orchestra-planner candidate
  if H3 resolves to "need a planner."**
- **CopilotKit / AG-UI (MIT, AG-UI authors, $27M May 2026)** → **ADOPT THE PROTOCOL (already
  implied), REJECT as foundation.** But the spec commits to AG-UI and never mentions CopilotKit —
  which ships the reference AG-UI React client the spec is hand-rolling. **Add CopilotKit as the
  buy-vs-build comparator in the H4 transport spike**; building `UiTreeRenderer` from scratch when
  the protocol authors ship it may be bloat.
- **LangGraph** → **REJECT, and it VALIDATES the spec.** `langgraph` lib is MIT but `langgraph-api`
  (prod runtime) is ELv2 needing a commercial key — the identical trap the spec quarantines Nango
  behind a sidecar for. Proves "full-MIT including the runtime" is load-bearing, not pedantic.
- **OpenAI AgentKit / Agents SDK** → **REJECT.** Responses-API-coupled, violates BYOK/agnostic; no
  vault/dispatch/shared-state.
- **Microsoft Agent Framework** → **PARTIAL ADOPT (already correct).** The Agent Governance Toolkit
  (MIT, 2026-04-02, verified) is the right policy-engine cherry-pick; the broader .NET/Python
  framework correctly not adopted as the loop.
- **Google ADK / Cloudflare Agents** → **REJECT.** Ecosystem/host lock-in (Workers/DO), off the
  host-agnostic thesis, no connection/dispatch substrate.
- **Cherry-pick vs wholesale** → **WHOLESALE correct.** dispatch (the prize) depends on core's
  org/sharing/secret/a2a substrate, so "only dispatch" still drags in core; cherry-picking buys
  nothing and forfeits integration. The spec's actual cut (adopt core+dispatch, build only the
  shared UI registry, swap via existing seams) is the right zero-bloat shape.

**Component-level alternatives worth adopting (improve the spec without changing direction):**

- **Policy engine: MS toolkit with policies authored in Cedar/Rego** (the toolkit embeds both) →
  **ADOPT.** Strictly better than the spec's no-hedge framing: keeps the agent-specific concerns
  (tool-call interception, OWASP Agentic Top-10, Ed25519 signing) AND keeps the policy *content*
  portable to raw Cedar/OPA behind the same `policyCheck()` if preview status ever bites.
- **Consume-as-pinned-dep where no source edit is needed; fork ONLY the must-edit parts** →
  **ADOPT (partial).** Most swaps are config/adapter (engine via env, DB via `DATABASE_URL`,
  transcription via adapter). The spec wrongly assumes a wholesale fork; separating "swaps achievable
  without forking" (keep as dep, get `npm audit`/Dependabot CVE-watch free) from "swaps requiring a
  fork" (vendor only those) materially shrinks the maintenance load.
- **Soft per-org isolation as default, hard isolation as on-demand capability** → **ADOPT.** Biggest
  lean-up; the recommendation §6 over-commits to hard-isolation-as-floor.
- **One shared `ProviderReader` retry/backoff/idempotency wrapper** → **ADOPT.** Closes the
  per-reader drift hole cheaply and in-bounds.
- **Managed auth (WorkOS/Auth0/Clerk) vs BetterAuth** → **REJECT (correctly).** Re-introduces
  per-provider tenancy lock-in the direction retires; BetterAuth is MIT/library/in-foundation with a
  BYO-auth escape hatch.

---

## 5. AG-UI transport — the committed read

**Committed call after flush-out: RIDE AG-UI, do not invent transport — but the spec must EARN it,
not assert it.** Three of four lenses converge here; the transport lens's verdict is "sound in
direction, under-specified," and the ops lens's "lean toward defer" dissent is answered by the
transport lens's key finding:

- **The client side is cheaper than the spec implies.** agent-native's surface is already
  `@assistant-ui/react`, and the official **`@assistant-ui/react-ag-ui`** runtime adapter exists
  (MIT, "as of May 15 2026"). The "rebind" is a runtime-adapter swap, near-drop-in on the client.
- **The server side is more expensive than the spec implies** — and is budgeted at zero. AG-UI wins
  on exactly one axis: it is the **upstream-maintained, multi-vendor (AWS/MS/Oracle/CopilotKit)
  transport** so the UI channel tracks an industry revision instead of our private one. That trade
  is positive (ecosystem-standard wire + interop for the price of one server-side translator) — but
  it is **not "free/config."** If the translator + SDUI carriage prove heavier than the spike
  predicts, agent-native's native SSE+state model is a **legitimate fallback, not a failure.**
- **Reject the alternatives** for v1: `@ag-ui/client` HttpAgent direct (throws away free
  composer/attachments/history — hold as escape hatch); WebSocket (SSE is AG-UI canonical, no
  interrupt requirement yet); MCP-Apps-only carriage (**partially adopt** — tool-returned UI rides
  `ToolCallResult`/MCP-Apps which is already built; proactive `ui.tree.render` still needs a `Custom`
  event).

**Proof-of-work for the AG-UI call** (P-AGUI, do first — highest value):
1. **Translator spike** — re-emit ONE real agent-native run as schema-valid AG-UI events (validated
   against `@ag-ui/core` types), drive the existing `AssistantChat` via `@assistant-ui/react-ag-ui`,
   zero component changes. Compare against dropping in CopilotKit's AG-UI client (buy-vs-build).
2. **Reconnect under AG-UI** — kill the socket mid-run, prove recovery; decide seq-replay-underneath
   (keep `runs/:id/events?after=N` + `runs/active`) vs AG-UI snapshot/delta re-sync.
3. **SDUI render path** — prototype both `Custom ui.tree.render` AND `mcpApp`-on-tool-result into the
   artifact panel; pin the envelope `version` (target **A2UI v0.8 stable**, not v0.9 draft).
4. **Surface-feature parity audit** across the runtime swap (plan/act `requestMode`,
   run-id-per-message, activity trail, sub-agent chips, attachments).
5. **Continuation relocation** — move the auto-continue state machine server-side so the AG-UI stream
   stays clean lifecycle-only (today it's a client machine in `agent-chat-adapter.ts`).
6. **Contract test** schema-validating translator output vs pinned `@ag-ui/core`; lock all three
   package versions (agent-native fork, `@ag-ui/*`, `@assistant-ui/react-ag-ui`) at fork.

---

## 6. The proof-of-work checklist before real work begins ("actually verify the work")

Every asserted-but-unproven load-bearing claim, with exactly what proves it. This is the gate.

| # | Claim asserted as ready | What proves it |
|---|--------------------------|----------------|
| **PW1 — Fork target** | "Pin a fork at the target version" — but **three numbering schemes** unreconciled: GitHub tag `0.1.7-101`, npm `0.32.0`, clone `0.23.0`. The entire §2 seam-map was read against 0.23.0. | Identify the authoritative artifact + exact tag/commit; re-clone; **diff the named seam files** (`registry.ts`, `builder-engine.ts`, `ai-sdk-engine.ts`, `db/client.ts`, `sharing/access.ts`, `a2a/*`, `better-auth-instance.ts`, `oauth-tokens/store.ts`, `transcribe-voice.ts`, `McpAppRenderer.tsx`, `appearance.ts`) against 0.23.0 before any line-cited work. |
| **PW2 — License / copyright** | Redistribution/sale treated as cleared; **no LICENSE file exists** (verified absent this pass). | `npm pack @agent-native/core && tar -xzf`; extract verbatim copyright holder+year; vendor into fork `LICENSE`+`NOTICE`. Gate on sale. |
| **PW3 — Data-model / hierarchy contract** | `System>Org>Project + entitlements + capability grants` assumed "mapped beforehand"; specified nowhere; foundation ships only Org>Resource. | Write the DDL + capability catalog + principals; map onto `organizations`/`org_members`/`*_shares`; reconcile `policyCheck()` ↔ toolkit `evaluate()`. (BLOCKING H1.) |
| **PW4 — MS governance toolkit reality** | Wired into 3 load-bearing decisions; never read; ~2 months old; "sub-ms/OWASP" claims are vendor framing. | Read the real `@microsoft/agent-governance-sdk` API; confirm `(principal, action, resource)→allow/deny/require_approval` in-process behind `policyCheck()`; fail-closed on error; benchmark "sub-ms"; confirm its audit doesn't duplicate/conflict our `connection_use` row (H5); head-to-head vs Cedar/OPA. |
| **PW5 — AG-UI maturity + rebind feasibility** | "Adapter swap"; AG-UI in **zero** source files; server translator + SDUI carriage + reconnect parity all unscoped. | The full P-AGUI spike set (§5). Confirms whether ui is "adopt + rebind" or "adopt tokens + build the surface." |
| **PW6 — Fork strategy / operability without upstream** | "Vendor a pinned fork; cherry-pick security fixes" — no mechanism, no CVE-watch owner, no cadence. | Pick subtree-vs-submodule-vs-published-fork; build agent-native from source, run its test suite, confirm **no hidden hosted call paths**; stand up a scheduled CVE-watch routine + a documented `upstream-sync` skill running the seam re-verify ladder. |
| **PW7 — Realtime voice lanes** | Voice leaned on as a capability win; every live observation is `_pending live walk-through_`. | Run the one approved paid live-eval sitting: latency, barge-in, tool-call correctness; pick ONE lane; harden `goAway` auto-reconnect; add per-session cost ceiling. (Dictation IS ready — multi-provider, BYOK, request-scoped; voice is NOT.) |
| **PW8 — `@jami-studio/ui` exports decouple** | ui depends on core "only through the endpoint contract" via `./client`\|`./server`\|`./db` split — "inferred, not built." | Build ui importing only the `./client` subset; confirm it does NOT transitively pull server/auth/Drizzle. |
| **PW9 — oauth_tokens read-scope** | Isolation assumed; read path confirmed **un-scoped** in source this pass. | Add owner/org-required reads; route through the scoped resolver; cover with `assertConnectionUse` + CI guard. |
| **PW10 — A2A push** | `pushNotifications: false` on the card; conformance code-self-declared. | Confirm whether orchestra needs push-based inter-agent triggers; if so, it's a build, scope it. |

---

## 7. What is genuinely still open (creative/scope) vs what is now firm

**FIRM (survived four adversarial passes — treat as settled direction, pending the PW gate):**
- Adopt agent-native **wholesale, hard-fork, own it** — no alternative foundation wins.
- The targeted swaps are correctly shaped: BYO engine (config), Postgres default (config),
  `Transcriber` adapter, request-scoped persistence, branding sweep.
- MCP for tools, A2A for inter-agent, self-host any-SQL/any-host, MIT, BYOK — the same bet 06 commits.
- AG-UI **as the transport direction** (ride upstream, don't invent) — pending the spike earning it.
- MS toolkit **as the policy engine behind a swappable seam** — pending reading its API.
- BetterAuth for auth (per-org isolation), Radix as the primitive base, dispatch as the
  orchestra head-start, the one shared primitive registry as ui's one real build.

**STILL OPEN (creative / scope — canon §4; legitimately undecided):**
- The **sign-in / federation shape** of the identity plane (the *model* is committed; the external
  IdP/federation mechanism is Jamie's call; lands late without refactor because contracts are agnostic).
- Whether jami.studio (BYOK) / jnh.org sit on the same identity plane or their own.
- Final **product/brand names** and possible org/project **directory shifts** for deployment/auth.
- **Whether orchestra needs a planner at all** (H3) — genuinely open until resolved from first
  principles; if yes, Mastra's workflow engine is the verified adopt candidate.
- **Isolation posture** — soft-default vs hard-default per org (lean toward soft-default + hard-on-demand).

**NOT open, just unwritten (must be specified, not debated):** the hierarchy DDL (H1), the audit
durability contract (H5), the accent-generator contract, the core-provider list + reliability
wrapper, the fork mechanism. These are spec-completion work, not creative decisions.

---

*Sources: the four lens files in this directory; `../recommendation.md` + pillars + deep-dives;
ground-truth source verified this pass — no `LICENSE` at root/`packages/core`; `oauth-tokens/store.ts:47-59`
`getOAuthTokens(provider, accountId)` reads with no owner/org scope (PK `(provider, account_id)`,
`owner` nullable & ignored on read).*

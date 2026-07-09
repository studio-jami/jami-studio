# agent-native — Fact-Finding Synthesis

Date: 2026-06-01. Owner: Jamie (jamie@yrka.io) — one human, many agents.
Status: **Committed direction (greenfield), pending Jamie's final green-light to lock into canon.**
This is the authoritative agent-native decision doc — it supersedes the earlier `recommendation.md` and
the investigation tree wherever they differ. Synthesizes the five fact-finding threads in this directory
(`fork-and-source-verify` [run by orchestrator via npm/source], `ms-governance-toolkit`,
`ag-ui-transport-reality`, `orchestra-planner-options`, `data-model-hierarchy-draft`).

Two of the earlier spec recommendations are **corrected** by verified facts (planner, AG-UI). Noted inline.

---

## 1. What is now VERIFIED (vs previously asserted)

| Claim | Verified fact (2026-06-01) | Source |
|---|---|---|
| **Fork target** | npm `@agent-native/core` **latest = 0.32.2** (dist-tags: latest 0.32.2, dev 0.5.0-dev); `@agent-native/dispatch` **0.8.28**. Fork from the npm `latest` artifact; the GitHub `0.1.7-101` tag scheme is separate/internal. Re-diff the seam files vs the 0.23.0 clone before any line-cited work. | `npm view` |
| **License** | **MIT** confirmed for `core` + `dispatch` via npm metadata. Verbatim copyright-holder string still to be lifted from the tarball/repo `LICENSE` at fork time (npm field = MIT is enough to proceed; the notice text is a 10-min fork task). | `npm view … license` |
| **oauth_tokens read-scope (HIGH)** | **Confirmed gap.** `getOAuthTokens(provider, accountId)` reads `WHERE provider = ? AND account_id = ?` with **no owner/org arg** (oauth-tokens/store.ts:47–55); `owner` column + write-side 409 guard exist, read side does not. Fix: owner/org-required reads, route through the scoped resolver, CI guard. | local source |
| **MS governance toolkit** | **REAL + MIT**, but the real package is **`@microsoft/agent-governance-sdk@4.0.0`** (published 2026-05-29, **Public Preview — NOT GA**; the bare `@microsoft/agent-governance-toolkit` name is 404). Real API is `evaluate(action, context)` / `evaluatePolicy(agentDid, context)` — **not** `(principal, action, resource)`. Cedar/Rego are **HTTP bridge clients to external services, not embedded**. Audit = in-memory capped SHA-256 hash-chain, **not** Merkle/Decision-BOM/Ed25519. ~30% of the spec's framing was marketing-inherited and is corrected. | npm tarball `.d.ts` |
| **Export decouple (PW8)** | `./client` / `./server` / `./db` export split exists (package.json exports). A clean build-time confirmation that `./client` pulls no server/db/auth is a fork-time check (low risk). | package.json |

---

## 2. Orchestra planner (H3) — RECOMMENDATION (corrects the spec hedge)

**No dedicated declarative workflow/DAG engine in the product runtime. Option A+ — this is the
complete shape, not a deferral.** The codebase already ships the hard parts of durable orchestration on
one Postgres: the **A2A task-store** (claimable, retryable, stuck-reset, owner-scoped) and **run-manager
+ run-loop-with-resume** (resumable runs), plus triggers, cron jobs, sub-agent delegation, and approvals.
That set **is** the durable orchestration the product runtime needs — agent loop + dispatch delegation +
A2A queue + triggers + cron + approvals. **We build no planner.**

Critical disambiguation: the **"continual orchestrator that replaces goal.md" is the Multica
dev-system concern** (canon § Orchestration), **not** the product runtime. Don't conflate them — that
conflation is what made the planner look necessary.

Engineering guidance (not a planned phase): were some unforeseen durable-pipeline need ever to arise
(long-horizon multi-step with per-step retry + mid-pipeline HITL suspend surviving deploys), the answer
is a **thin owned seam composed on the existing `a2a_tasks` + run-store + approvals primitives** — never
a second framework (the atomic-claim/stuck-reset code is already written). DBOS Transact (MIT,
Postgres-native, in-process) is the only library even worth evaluating, and only then; Temporal (cluster
tax), Inngest-server (SSPL), Restate (BSL) are out for the product runtime.

## 3. AG-UI transport (PW5) — RECOMMENDATION (corrects the spec's "rebind to AG-UI")

**Keep native SSE as the internal spine. Do NOT rebind it to AG-UI.** AG-UI is real, MIT, well-backed
(`@ag-ui/core@0.0.54`) — but **pre-1.0**, enum still churning, and agent-native's native transport
does **two things AG-UI doesn't model**: bounded **seq-replay** on the chat stream and a separate
**global DB-sync/poll channel** with serverless fallback. Rebinding the spine would *lose* capability.

- **AG-UI = a fully-built EDGE/interop adapter (in scope, shipped).** Two distinct transports, both
  built: (1) internal app↔agent = native SSE; (2) external/third-party agents↔our agents = the AG-UI
  adapter, via the real MIT `@assistant-ui/react-ag-ui` (v0.0.34) behind a ~1-file SSE→AG-UI
  translator. ~5 of 15 event kinds map 1:1; ~7 ride `CUSTOM`; 3 are structurally foreign. Not optional
  — it is the industry-standard interop surface and ships with the harness.
- **The renderer is NOT buyable.** CopilotKit ships *component-registration plumbing* (you still write
  every component) + a heavy runtime, not a server-driven UI-tree interpreter. **A2UI** (Google,
  Apache-2.0, v0.8 stable) *is* the real server-driven-UI-tree spec for LLM-authored layouts —
  **explicitly out of scope for this build**; a separate, distinct decision if that capability is ever
  wanted. agent-native already does generative UI via **MCP-UI/ext-apps iframes** (`McpAppRenderer`). So
  `@jami-studio/ui` builds the **thin tool→component layer** over our registry.

## 4. MS governance toolkit — RECOMMENDATION

**Adopt `@microsoft/agent-governance-sdk` as a pinned MIT dependency behind ONE `policyCheck()` adapter
file; default-deny on error.** It's a leaf library (crypto + js-yaml only, no hosted calls) → no fork,
gets Dependabot for free. Use its in-process `PolicyEngine` (YAML rules) as the engine; keep raw
Cedar/OPA as the documented fallback (its own bridge classes ARE that path). **Because it's Public
Preview, keep the seam.** **Decisive find:** its `CredentialVault` + `CredentialInjector` almost
exactly models the `assertConnectionUse` / capability-bound-credential design — adopt the *pattern*.
**Our durable Postgres audit row stays the system of record;** the SDK's in-memory hash-chain is a
complementary integrity layer that feeds it, not a replacement.

## 5. Data-model (H1) — CLOSABLE, purely additive

agent-native ships **Org > Resource only** (`organizations` + `org_members` + `*_shares` + visibility;
flat `owner|admin|member`). Missing: **Project tier, capability catalog, entitlement-keys, team
principal, capability-grants** — all addable as **new natural-named tables (`projects`,
`resource_projects`, `capabilities`, `entitlement_keys`, `teams`, `team_members`, `capability_grants`)
keyed to `org_id` + email, with ZERO ALTERs to core.** No ownership prefix (it's all ours once forked).
See `data-model-hierarchy-draft.md` for the proposed DDL.

- **Inter-org isolation** = a deployment fact (separate db/auth/users per org), not a schema row. ✔ firm.
- **Intra-org ala-carte** (yrka suites share one login) = rows in `capability_grants`
  (`subject → capability_key → scope`); "has business+media, not research" = two present rows, one
  absent (default-deny). This *is* the unified-interface vision, expressed in data.
- **policyCheck reconciled** to the real SDK via one adapter: our `policyCheck(capability, principal,
  resource)` → hard capability-grant gate (our DB) → `evaluatePolicy(principal, context)` for
  policy/approval nuance. One choke point, fail-closed.

---

## 6. Updated proof-of-work status

| Item | Status |
|---|---|
| PW1 fork target / seam reconcile | **Closed** — fork from npm 0.32.2; re-diff seams at fork (mechanical). |
| PW2 license | **Closed enough** — MIT confirmed; lift the verbatim notice from the tarball at fork (10 min). |
| PW3/H1 data-model | **Closed (draft)** — additive DDL proposed; ready for Jamie's review. |
| PW4 MS-toolkit | **Closed** — real/MIT/Public-Preview; adopt behind seam; framing corrected. |
| PW5 AG-UI | **Closed** — keep native SSE; AG-UI as export adapter; renderer is build-not-buy. |
| PW8 export decouple | **Low-risk fork-time confirm.** |
| PW9 oauth read-scope | **Confirmed** — fix at fork (owner/org-required reads + CI guard). |
| PW6 fork mechanism | Open — pick subtree vs published-fork + CVE-watch routine (operational, not blocking). |
| **PW7 realtime voice live-eval** | **PARKED — needs Jamie's explicit "spend credits" go.** Dictation is ready now. |
| PW10 A2A push | Open — only if orchestra needs push-based inter-agent triggers (likely no). |

---

## 7. Committed direction (pending green-light)

These are decided; they await only Jamie's final green-light to lock into the canon.

1. **Planner:** no workflow/DAG engine in the product runtime (Option A+). The existing primitives are the complete durable-orchestration shape.
2. **AG-UI:** two transports, both built — native SSE for our own UI, AG-UI adapter for external interop. (Reverses the spec's "rebind the spine.")
3. **Governance:** adopt `@microsoft/agent-governance-sdk@4.0.0` (Public Preview) as a pinned MIT dep behind one `policyCheck()` seam; our Postgres audit row is the record; adopt the `CredentialVault` pattern for connection-use.
4. **Data-model:** additive, natural-named tables (Project tier + capability catalog + entitlement-keys + teams + capability-grants), keyed `org_id` + email, zero core ALTERs. No `yrka_` prefix.
5. **Fork:** fork from npm core 0.32.2 / dispatch 0.8.28; fork-time tasks = lift LICENSE notice + harden the oauth read-scope.
6. **Voice:** dictation ships complete; the paid realtime live-eval is the one parked item, pending Jamie's explicit "spend credits" go.

This synthesis is the informed basis for that green-light; it is not yet locked into canon.

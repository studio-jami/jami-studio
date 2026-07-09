# F06 — Governance, policy & audit

Status: AUTHORED 2026-06-02 · Domain: B · Agent substrate
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/12-agent-native/{fact-finding/fact-finding-synthesis.md,org-permissions-protocols-dispatch-license.md}`, `../../research/00-orchestration/{plan,synthesis}.md`
Related: F02 (identity), F05 (harness hook), F07 (capability grants), F14 (OSS/enterprise split)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

What agents/users may do + the audit trail. **In:** the policy seam, the gate, audit chain, OSS/enterprise split. **Out:** identity (F02), grant storage (F07).

## 2. Committed decisions (from canon)

- **One `policyCheck()` seam** over `@microsoft/agent-governance-sdk@4.0.0` (MIT, **Public Preview** — so the seam stays).
- Hard **capability-grant gate** (Postgres) → `evaluatePolicy` for policy/approval nuance; **default-deny on error**; one enforcement path, never two.
- **SHA-256 hash-chain audit** as system of record; Cedar/OPA external HTTP bridges.
- **OSS/enterprise split:** the seam + a working default policy engine ship OSS; enterprise impl (Cedar/OPA, compliance, federation, the SDK integration) is commercial behind the seam.

## 3. Architecture & mechanics

**One seam, one enforcement path.** Every governed action — human or agent (F02), UI-invoked or loop-invoked (F05 dual-invocation) — passes through a single **`policyCheck()`** function. There is never a second authz path; the UI has no privileged backdoor.

**The two-stage gate (order is load-bearing).**
1. **Hard capability-grant gate (Postgres, F07).** First, a direct query: does the principal (human email or agent DID) + `org_id` hold a `capability_grant` for this action? **Absent row → deny** (default-deny). This is *our* gate, in *our* data plane — it does not depend on the SDK and cannot be bypassed by SDK failure.
2. **`evaluatePolicy` for nuance.** If the hard grant passes, the **`@microsoft/agent-governance-sdk@4.0.0`** (MIT, **Public Preview**) evaluates policy/approval nuance — `evaluate(action, context)` / `evaluatePolicy(agentDid, context)` against an in-process YAML `PolicyEngine`. **Default-deny on any error** (SDK throw, timeout, malformed policy → deny, never fail-open).

**Why the seam stays.** The governance SDK is **Public Preview, not GA** — so it lives entirely behind `policyCheck()`. Its API can churn without touching a single call site; if it's ever dropped, the hard grant gate + a minimal local engine still enforce. We author only the **operator policy library** (YAML policies) + the **audit-query/export surface**; the durable Postgres audit row is the system of record, the SDK's in-memory chain is a within-run mechanism.

**Audit chain (system of record).** Every decision appends an **append-only Postgres audit row** (principal, action, context hash, decision, policy id, timestamp) chained by **SHA-256** (each row hashes the prior) — tamper-evident. The SDK's in-memory SHA-256 hash-chain is the per-run echo; the Postgres row is durable truth. W3C **Trace Context** propagates across the run so an action traces to its originating turn.

**Credential governance.** Adopt the SDK's `CredentialVault` / `CredentialInjector` pattern for connection-use, sitting over the F03 secrets adapter — credentials are injected per governed action, never held inline (F05 connection layer).

**External engines via HTTP bridge.** Cedar / OPA are **external HTTP bridges** (not embedded) — `policyCheck()` calls them over HTTP when a policy delegates. Embedding is explicitly avoided; the bridge keeps the heavy engines out of the hot path and the bundle.

**OSS / enterprise split (the model split).** The **`policyCheck()` seam + a working default YAML policy engine ship OSS** — genuinely governable alone, never crippleware. The **enterprise impl** (Cedar/OPA bridges, compliance reporting, federation, deep governance-SDK integration) is **commercial behind the same seam** (F14). The adapter pattern makes the line enforceable: enterprise features are plugins on the seam, never forks of core.

## 4. Remaining peripheral decisions to cement

- **Policy seam contract (cemented):** `policyCheck(principal, action, context) → allow|deny(+reason)`; stage 1 hard grant (Postgres) → stage 2 `evaluatePolicy`; default-deny on error; one path.
- **OSS-default vs enterprise line (cemented):** seam + default YAML engine = OSS; Cedar/OPA bridges + compliance/federation/reporting = commercial behind the seam.
- Final SDK API surface (`evaluate`/`evaluatePolicy` signatures) re-verified at lock (Public Preview — §7).

## 5. Dependencies & interfaces

- **F05 (harness)** — calls `policyCheck()` before every governed tool/action; the loop fails closed on deny.
- **F07 (data)** — the hard grant gate reads `capability_grants`; the audit chain writes the append-only audit table.
- **F02 (identity)** — supplies the resolved principal (human email / agent DID + org); an unresolvable principal → deny.
- **F14 (open-core)** — owns the OSS/enterprise governance split this report defines.
- **F15 (AX)** — the governance machinery is the other side of the discoverability coin: safe agent provisioning rides this gate + audit.
- **F03** — secrets adapter underlies `CredentialVault`/`CredentialInjector`.

## 6. Verification & closing criteria

- `policyCheck()` is the sole authz path: no governed action reaches execution without it (proven by a boundary test).
- **Default-deny-on-error test:** force an SDK throw/timeout/malformed-policy → the action is denied, not allowed.
- Hard grant gate denies on a missing `capability_grant` row independent of SDK state.
- Every decision writes a chained SHA-256 audit row; tampering with a row breaks the chain (detectable).
- OSS build ships the seam + default YAML engine and governs a real action with no enterprise components; enterprise Cedar/OPA bridges plug in behind the seam without touching core.
- Agent and human principals are gated identically (one path), with no impersonation shortcut.

## 7. Risks & verify-at-build (dated 2026-06-02)

- **`@microsoft/agent-governance-sdk@4.0.0` is Public Preview, not GA** — keep it fully behind `policyCheck()`; re-verify the `evaluate`/`evaluatePolicy` API + the hash-chain behavior at lock; the hard grant gate must stand alone if the SDK regresses.
- **Default-deny-on-error must be tested, not assumed** — a silent fail-open here is a critical authz hole.
- **Cedar/OPA bridges are HTTP** — bound their latency + failure mode (bridge down → deny) so they never fail-open or stall the loop.
- OWASP Agentic Top-10 is an evolving target — track it as the policy library's checklist.

## 8. Sources

- `12-agent-native/fact-finding/fact-finding-synthesis.md` + `org-permissions-protocols-dispatch-license.md`, synthesis §3 (governance), canon §2 (governance, open-core line).

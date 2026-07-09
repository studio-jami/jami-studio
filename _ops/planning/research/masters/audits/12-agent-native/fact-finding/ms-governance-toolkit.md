# Fact-Finding — Microsoft Agent Governance Toolkit — reality check

Closes **PW4** (spec-readiness.md:186). Isolated planning pass — nothing locked, nothing official.
Date: 2026-06-01. Owner: Jamie (<jamie@yrka.io>). All drift-prone facts verified against official
2026 sources (npm registry, the published tarball's TypeScript `.d.ts`, the GitHub repo, the
Microsoft OSS blog) and dated below.

---

## 1. Verdict (lead)

**REAL, MIT, usable behind a thin `policyCheck()` seam — but treat it as a Public-Preview LIBRARY
of in-process governance primitives, NOT a GA "sub-millisecond policy engine," and NOT the owner of
your audit log.** The spec's framing is ~70% right and ~30% marketing-inherited. Specifically:

- The package is **real and MIT**: `@microsoft/agent-governance-sdk@4.0.0` (npm, published
  **2026-05-29**, MIT, author "Microsoft Corporation", maintained by Microsoft 1ES/OSS-releases).
  It is the renamed continuation of `@microsoft/agentmesh-sdk` (same versions 3.2.2→4.0.0, same
  deps). **TS, Python, and .NET SDKs all exist** (the TS `PolicyEngine` doc says "full parity to the
  Python/NET SDK"). The TS SDK is **usable, not immature** — it ships compiled `dist/` + full typings.
- **It is Public Preview, not GA.** The blog says "generally available"; the actual artifacts
  contradict it. npm description and README both say **"Public Preview … APIs may change before GA"**;
  GitHub releases are all **pre-release** ("Microsoft-signed public preview releases … may have
  breaking changes before GA"). Latest tag v3.7.0 (the npm `agent-governance-sdk` line runs ahead at
  4.0.0). **Believe the artifacts: pre-GA. Keep the swap seam.**
- **The real policy API is `(action, context)`, NOT `(principal, action, resource)`.** There is no
  `(principal, action, resource) → allow/deny/require_approval` signature anywhere. See §3 — this is
  the reconciliation the spec (H1) needs.
- **Cedar and Rego are NOT embedded.** They are **HTTP bridge clients** to an *external* Cedar/OPA
  service (`endpoint` + `fetchImpl`). The only in-process engine is a hand-rolled YAML/JSON rule
  evaluator. The spec's "toolkit embeds both" (recommendation §4 / spec-readiness:67,119) is **wrong**.
- **Audit = in-memory SHA-256 hash-chain, NOT Merkle / NOT Decision-BOM / NOT Ed25519-signed.**
  It is capped (default 10 000 entries), memory-only, `exportJSON()`. This **does NOT subsume** your
  durable append-only Postgres `connection_use` row (H5) — different layer, different durability. Use
  it as a fast in-process integrity check that *feeds* your row; your row stays the system of record.
- **"Ed25519 signing" is real but for IDENTITY, not audit.** Ed25519 (`@noble/ed25519`) signs agent
  **DIDs/identities** and marketplace plugins — not policy decisions and not audit entries.
- **"Sub-millisecond <0.1ms p99" and "OWASP Agentic Top-10" are vendor claims, UNVERIFIED here**
  (no benchmark run; deferred to the spike). Plausible for the in-process YAML evaluator; **not**
  applicable when you bridge out to Cedar/OPA over HTTP (network-bound).
- **There is a better-fitting primitive than the one the spec wired in:** the toolkit's
  **`CredentialVault` + `CredentialInjector`** (TS port of the Python `agent_os.credential_vault`)
  is a near-exact match for Jamie's `assertConnectionUse` / capability-bound credential design,
  including a real `PolicyCheck` seam. See §4 — this is the decisive find.

**Decisive read:** Adopt it as a **pinned dependency** (MIT, no fork needed — it's a leaf library),
hidden behind **one** `policyCheck()` adapter file, default-deny on error. Use its in-process
`PolicyEngine` (YAML rules) as the v1 engine; keep raw Cedar/OPA as the documented fallback (the
toolkit's own bridge classes ARE that fallback path). Your `connection_use` row stays authoritative;
the toolkit's hash-chain is a complementary integrity layer, not a replacement. Reconcile the spec's
`policyCheck(capability, principal, resource)` to the real shapes in §3.

---

## 2. Verified facts (evidence)

### Package identity, license, maturity
| Fact | Value | Source (dated) |
|---|---|---|
| Real package name | `@microsoft/agent-governance-sdk` | `npm view` 2026-06-01 |
| Latest version / publish date | **4.0.0**, published **2026-05-29** ("3 days ago") | `npm view … time --json` 2026-06-01 |
| First publish (as this name) | 3.2.2 on **2026-04-22** | same |
| Prior name (same lineage) | `@microsoft/agentmesh-sdk` (3.2.2, MIT, identical deps) — superseded | `npm view @microsoft/agentmesh-sdk` 2026-06-01 |
| License | **MIT** (`"license":"MIT"`, author "Microsoft Corporation"); repo `LICENSE` = "Copyright (c) Microsoft Corporation." | tarball `package.json`; github.com/microsoft/agent-governance-toolkit/blob/main/LICENSE (2026-06-01) |
| Maturity | **Public Preview / pre-GA** — README: "Public Preview … APIs may change before GA"; GitHub releases all marked pre-release | tarball `README.md`; github releases page (2026-06-01) |
| Languages | **TypeScript + Python + .NET** (TS doc: "full parity to the Python/NET SDK"); blog adds Rust/Go for the broader toolkit | `policy.d.ts:16`; OSS blog 2026-04-02 |
| Runtime deps | `@noble/{ciphers,curves,ed25519,hashes}` + `js-yaml` only (no network/cloud SDK) → safe to vendor/pin; `node>=18` | tarball `package.json` |
| Repo | github.com/microsoft/agent-governance-toolkit (monorepo; 7 packages: Agent OS/Mesh/Runtime/SRE/Compliance/Marketplace/Lightning) | OSS blog 2026-04-02 |

Tarball extracted read-only to `%TEMP%` (NOT into any project tree): `npm pack
@microsoft/agent-governance-sdk@4.0.0 && tar -xzf` → `package/dist/*.d.ts`. unpackedSize 742.9 kB.

### The real policy API (from `policy.d.ts` + `types.d.ts`)
- Class **`PolicyEngine`**. In-process, declarative. Loads policy via `loadPolicy(Policy)` /
  `loadYaml(string)` / `loadJson(string)`.
- **Two evaluate paths:**
  - `evaluate(action: string, context?: Record<string,unknown>): 'allow'|'deny'|'review'`
    (legacy flat rules, first-match-wins, **default 'deny'** — fail-closed by design).
  - `evaluatePolicy(agentDid: string, context: Record<string,unknown>): PolicyDecisionResult`
    (rich: `{ allowed, action, matchedRule, reason, approvers[], rateLimited, evaluatedAt,
    evaluationMs }`).
- **`PolicyAction = 'allow'|'deny'|'warn'|'require_approval'|'log'`** — so `require_approval` IS a
  real first-class outcome (types.d.ts:45). The *legacy* decision type is the coarser
  `'allow'|'deny'|'review'`.
- **Conflict resolution** is built in: `deny_overrides | allow_overrides | priority_first_match |
  most_specific_wins` (`ConflictResolutionStrategy`). Rate-limits + approver lists supported.
- **Principal/Resource:** there is **no `principal`/`resource` argument**. The "subject" is `agentDid`
  (a DID string) on `evaluatePolicy`, or it lives inside the free-form `context` bag on `evaluate`.
  Rules match on `action` patterns + `condition` expressions over `context`. (This is the gap the
  spec's `policyCheck(capability, principal, resource)` must reconcile — see §3.)

### External engines (from `policy-backends/cedar.d.ts`, `opa.d.ts`)
- **`CedarBackend` / `OPABackend` are HTTP clients**, not embedded engines:
  `new CedarBackend({ endpoint, fetchImpl? })`, `new OPABackend({ endpoint, policyPath?, fetchImpl? })`.
  Both implement `ExternalPolicyBackend` and POST to a remote evaluator; you `registerBackend()` them
  and call `evaluateWithBackends()` / `evaluatePolicyWithBackends()`. README: "register **fail-closed
  external policy backends** for OPA/Rego or Cedar-style **remote** evaluators."
- **Implication:** the toolkit does NOT bundle Cedar/Rego. "Policy content portable to Cedar/OPA" is
  only true in the sense that you run your OWN Cedar/OPA service and the toolkit calls it. Good news:
  this is exactly the fallback seam the spec wants — but it's a bridge, not an embed.

### Audit (from `audit.d.ts` + `audit.js`)
- **`AuditLogger`**: "Append-only audit log with **hash-chain** integrity. Each entry's hash covers
  its content plus the previous entry's hash." Confirmed in `audit.js`:
  `createHash('sha256').update(payload).digest('hex')`, with `previousHash` linkage and a `verify()`
  that recomputes the chain.
- **`AuditEntry = { timestamp, agentId, action, decision, hash, previousHash }`** — decision is the
  coarse `'allow'|'deny'|'review'`.
- **In-memory + capped** (`maxEntries` default 10 000); `exportJSON()` for off-loading. **Not** a
  Merkle tree, **not** a "Decision-BOM", **not** Ed25519-signed. (A separate `auditDigest()` helper
  in the credential-vault produces an **HMAC-SHA256** digest over vault events — symmetric key, not a
  signature.)

### Crypto claims
- **Ed25519 is for identity**, via `@noble/ed25519`: agent DIDs (`AgentIdentity`, README "agent
  identity (Ed25519 DIDs)") and marketplace plugin signing — **not** audit entries, **not** policy
  decisions.
- Credential-vault at-rest encryption = **AES-256-GCM** (`@noble/ciphers`); secure channel uses
  X3DH + Double-Ratchet (`encryption/*`). Real, but orthogonal to the policy/audit crux.

---

## 3. Reconciling the spec's `policyCheck()` with the real API (closes the H1 sub-point)

Spec quotes two incompatible shapes (spec-readiness.md:41): `policyCheck(capability, principal,
resource)` (recommendation §3) vs the toolkit's `evaluate(...)`. **Verified real shapes:**

```ts
// In-process native engine (the v1 path):
policyEngine.evaluate(action: string, context?): 'allow'|'deny'|'review'          // default deny
policyEngine.evaluatePolicy(agentDid: string, context): PolicyDecisionResult       // rich, require_approval

// Credential-gated path (the better fit — see §4):
type PolicyCheck = (ctx: InjectionContext) => PolicyOutcome | Promise<PolicyOutcome>
// InjectionContext = { agentDid, actionClass, targetService, requestedHandles[], policyVersion }
// PolicyOutcome    = { allow: boolean, reason?: string }
```

**Recommended adapter (one file, the seam):** keep Jamie's own signature and map inward —

```
policyCheck({ capability, principal, resource }) →
   evaluatePolicy( principal /*agentDid*/, { action: capability, resource, ...attrs } )
   → map PolicyAction → { allow, requireApproval, reason }
   → default-deny on throw / on 'deny' / on unknown
```

`principal` → `agentDid`; `capability` → `action`/`actionClass`; `resource` → a `context` field.
`require_approval` surfaces cleanly. This keeps your call-sites stable and the toolkit swappable.

---

## 4. The decisive find — `CredentialVault` already models `assertConnectionUse`

From `credential-vault.d.ts` (TS port of Python `agent_os.credential_vault`, issues #2481/#2534/#2535).
Its design goals read almost verbatim like Jamie's connection-use crux:

- **Capability-bound, not identity-bound:** a `CredentialProfile` maps an **action capability**
  (e.g. `github:read_issues`, `github:push_code`) → a credential handle. "Two capabilities that share
  an underlying credential are still modelled as separate bindings so revoking one does not implicitly
  revoke the other." This is the `capability-grant` tier H1 says is "specified nowhere" in agent-native.
- **Value boundary:** agents only ever hold opaque `{{cred:NAME}}` handles; only the `CredentialInjector`
  ever resolves a value, only long enough to render an outbound HTTP/MCP/env payload.
- **Policy-first + fail-closed:** `policyCheck` runs *before* any value is read; denials return a
  **deterministic `DenyReceipt`** (same shape whether missing, mis-bound, or policy-denied — no leak).
- **Per-resolution audit events** (`VaultAuditEvent { agentDid, handleName, targetService, actionClass,
  decision, policyVersion, reason }`) + an **HMAC-SHA256 `auditDigest()`** over the sequence.
- **Untrusted-server-metadata boundary:** only handles in the caller's `allowedHandles` set may be
  substituted — anything else is treated as injection.

**Read:** this is a stronger, ready-made shape for the `connection_use` / `assertConnectionUse` design
than rolling it from scratch. Adopt the *pattern* (and possibly the class) for the credential-injection
seam; keep your **durable Postgres `connection_use` row** as the system of record and feed it from these
events. Caveat: TS uses AES-256-GCM, Python uses Fernet — **not cross-language interchangeable** (their
issue #2535). Single-language (TS) use sidesteps this.

---

## 5. Audit reconciliation (closes the H5 sub-point: ours / theirs / subsumes)

**Decision: OURS is the system of record; THEIRS is a complementary in-process integrity layer.
Neither subsumes the other.**

- Toolkit audit is **in-memory, capped, SHA-256 hash-chain, `exportJSON`** — tamper-*evident* within a
  process lifetime, but **not durable, not write-once-medium, not signed.** A process restart or
  >maxEntries drops history. It cannot be your retention-bound, sellable audit of record.
- Your planned **append-only Postgres `connection_use` row** is the durable, queryable,
  retention-governed record. The toolkit's hash-chain (and the vault's `auditDigest`) can be written
  *into* that row (store `hash`/`previousHash`/`digest` columns) to add cheap tamper-evidence — but the
  durability + append-only enforcement (separate medium / WORM export / DB triggers) remains yours.
- **No conflict** as long as you don't try to use their in-memory logger AS the durable log. There is
  no duplication risk; there is a layering opportunity.

---

## 6. Behind a thin seam? — yes (closes PW4's seam requirement)

- It's a **leaf MIT library** with only crypto + `js-yaml` deps and no hosted-call paths → **pin as a
  normal dependency, no fork required** (unlike agent-native). Gets `npm audit`/Dependabot for free.
- One adapter module (`policyCheck.ts`) exposing Jamie's `policyCheck()` signature, wrapping
  `PolicyEngine.evaluatePolicy` + the vault `PolicyCheck`. **Default-deny on any throw** (the engine
  itself already defaults to deny).
- **Preview-bite contingency named:** if the preview API churns or a capability is missing, the same
  seam swaps to (a) raw **Cedar** or (b) **OPA/Rego** via the toolkit's own `CedarBackend`/`OPABackend`
  bridge classes — or (c) **OpenFGA** / a hand-rolled YAML resolver. The fallback is first-class, not
  hypothetical, because the bridge code ships in the package.
- CI-guard rule (per spec §3 risk): no `@microsoft/agent-governance-sdk` import outside the adapter file.

---

## 7. What I could NOT verify (be explicit)

- **The "<0.1ms p99 / sub-millisecond" benchmark** — NOT independently run. It's a vendor claim (blog +
  README lineage). Plausible for the in-process YAML `evaluate()`; **false-by-construction** for the
  Cedar/OPA HTTP-bridge path (network latency dominates). Benchmark in the spike before quoting it.
- **"OWASP Agentic Top-10 — all 10" coverage** — NOT audited. The package ships modules plausibly
  mapping to the risks (`prompt-defense`, `context-poisoning`, `cascade-containment`, `kill-switch`,
  `rings`, `sandbox`, `mcp` scanner, `discovery`), but I did not verify each control against the OWASP
  list. Treat as "broad surface present," not "certified."
- **GA timeline** — unstated. Only "before GA" wording exists; no date. Plan for pre-GA churn.
- **.NET/Python API parity in detail** — asserted by the TS docstring ("full parity to the Python/NET
  SDK"); not cross-checked against NuGet/PyPI this pass (TS is the target language, so low priority).
- **Whether the in-process `evaluate` context model can express the full
  `System>Org>Project>entitlement` hierarchy** (H1) — the `context` bag is free-form so it *can* carry
  those attrs, but designing that mapping is H1/PW3 work, not a toolkit fact.

---

*Sources (all 2026-06-01 unless noted): `npm view @microsoft/agent-governance-sdk` +
`… agentmesh-sdk` + `… time --json`; tarball `@microsoft/agent-governance-sdk@4.0.0`
(`dist/policy.d.ts`, `types.d.ts`, `audit.d.ts`, `audit.js`, `client.d.ts`, `index.d.ts`,
`credential-vault.d.ts`, `policy-backends/cedar.d.ts`, `policy-backends/opa.d.ts`, `README.md`,
`package.json`) extracted read-only to `%TEMP%`;
github.com/microsoft/agent-governance-toolkit (LICENSE + releases page);
opensource.microsoft.com OSS blog "Introducing the Agent Governance Toolkit" 2026-04-02.*

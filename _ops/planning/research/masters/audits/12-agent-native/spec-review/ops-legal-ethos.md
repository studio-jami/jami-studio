# Spec Review — Ops, legal/licensing, and Principled-Edge audit

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).

Reviewer lens: operational burden, legal/licensing, Principled-Edge (over- AND under-engineering), and the "shame shame" load-bearing-but-unproven-claims audit.
Date: 2026-06-01. Isolated planning pass — locks nothing.
Scope reviewed: `recommendation.md`, the 4 pillars, the 5 deep-dives.
Ground truth: local clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native` (`@agent-native/core` 0.23.0, npm latest 0.32.0), `…\references\nango`, `…\voice-prototypes`. Canon: `dev/docs/research/00-orchestration/plan.md`.

---

## VERDICT: SOUND CORE, but **NEEDS-CHANGE before green light** — two blocking holes and an under-priced ops shape.

The adoption thesis is correct and well-evidenced: agent-native is MIT, self-hostable, multi-tenant-correct, and the Builder.io hosted services are genuinely opt-in behind clean seams (verified — `voice-prototypes` runs the stack with zero Builder services; AG-UI and the MS toolkit appear **nowhere** in the source, confirming they are bolt-ons over seams, not removals of the loop). On my lens, the **adopt** decision holds. What does **not** yet hold:

1. **BLOCKING (legal):** the spec cannot satisfy MIT's attribution requirement because the artifact that carries the attribution — the root `LICENSE` file and its copyright holder — **does not exist in the clone and could not be fetched** (GitHub 404). You cannot legally redistribute (esp. *sell* via yrka.io) until you have the exact copyright line. The spec correctly flags this as "could not verify" but then proceeds as if redistribution is cleared. It is not cleared; it is *blocked pending one file*.
2. **BLOCKING (proof-of-work):** the spec's two highest-weight additive layers — **AG-UI transport** and the **Microsoft agent-governance-toolkit** policy engine — are asserted as committed-and-mature but were **never exercised**, and one of them (MS toolkit) is **~2 months old** (released 2026-04-02). The "shame shame" voice lesson is being repeated verbatim: a load-bearing capability declared ready on the strength of a doc, not a live walk-through.
3. **NEEDS-CHANGE (ops/ethos):** the recurring maintenance shape — pinned vendored fork + N per-org auth/db stores + N per-org shadcn registry endpoints + template-owned per-provider clients + an optional Nango sidecar — is real and, in aggregate, **under-priced for a solo operator**. Some of it is the irreducible cost of isolation; some is self-imposed multiplication the canon would call bloat-in-the-other-direction. The leanest shape (below) is materially lighter.

The "adopt the foundation" instinct is right. The "we'll wrap it with AG-UI + MS toolkit + per-org registries and it'll be lean" framing is where the spec gets ahead of its evidence.

---

## HOLES (with where)

**H1 — The attribution artifact is missing, yet redistribution is treated as cleared. (recommendation.md §7 "License/redistribution" + "Could not verify"; pillar-4 "WHAT I COULD NOT VERIFY")**
Verified locally: there is **no root `LICENSE` file** in the clone (`ls LICENSE*` → none; `find -iname LICENSE*` → none under packages either). The only operative license signal is the per-package `"license": "MIT"` field (confirmed in `packages/core/package.json`). MIT's permission notice *requires reproducing the copyright line* — and the copyright holder ("Builder.io"? a person? an entity?) is nowhere in the tree. The spec says "rename the Builder.io / agent-native identity" but never resolves *whose copyright notice we must preserve*. This is a contract with no counterparty named. Hole: undefined legal contract on the single obligation MIT imposes.

**H2 — "Vendor a pinned fork; cherry-pick security fixes" is a verb with no shape. (recommendation.md §7 "Version drift"; all 4 pillars)**
The spec names the obligation (clone 0.23.0 → npm 0.32.0, pre-1.0, active security PRs e.g. IDOR #369) and the mitigation ("vendor a pinned fork, cherry-pick"). It never defines *the mechanism*: monorepo subtree vs. git submodule vs. published-fork-on-our-registry; who watches upstream for CVEs; what the re-verify cadence is; how a cherry-pick is tested against our swaps. For a solo operator this is the single largest recurring burden and it is hand-waved to two verbs. No seam, no runbook, no cadence = an unowned forever-cost.

**H3 — Per-org shadcn registry hosting is declared "infra" but never costed or shaped. (shadcn-as-agent-registry.md §5)**
The deep-dive itself admits "Per-org registry hosting is now infra … N endpoints to stand up, not one." The spec body (recommendation §5) presents the registry as "one shared primitive registry" — the singular framing contradicts the per-org-isolation reality the betterauth dive commits to. Which is it: one global registry, or N per-org auth'd endpoints? If N, where do they run, who rotates their `REGISTRY_TOKEN`s, and how does a primitive bugfix propagate across N copy-in surfaces (shadcn is copy-in, not `npm update`)? Undefined.

**H4 — The `connection_use` audit table and `assertConnectionUse()` gate are "one file" but the retention/tamper-evidence contract is undefined. (provider-authz-audit-crux.md "Honest downsides")**
The dive is admirably honest that core ships **no** retained security audit log (only sampled observability traces) and that the append-only audit row is "a *real* (small) thing we must build." But "append-only" against a Postgres table the same app can `UPDATE`/`DELETE` is not tamper-evident. The spec never says what "audit" legally/operationally means here (retention window? write-once medium? export?). For a system whose whole crux is "auditing never leaks across an external connection," the audit substrate's durability contract is a hole.

**H5 — `SECRETS_ENCRYPTION_KEY` rotation is flagged as a footgun but has no rotation procedure, multiplied per-org. (multiple)**
"Rotation invalidates the whole vault — re-encrypt, don't flip" is stated 4× across the docs. Under per-org isolation that is **N vaults × N keys**, each needing a re-encrypt migration. No rotation runbook, no key-custody model (where do N `SECRETS_ENCRYPTION_KEY`s + N `BETTER_AUTH_SECRET`s live?). This is named as a risk but left as a standing unowned operation.

**H6 — "Each stage is the production shape" (canon §1) vs. "demand-gated, not now" Nango. (integrations §, provider-landscape §)**
The canon forbids "defer until demand" / "for now" language. The Nango decision is explicitly "demand-gated — not now." This is *correct engineering* (don't build a multi-container sidecar you don't need) but it is **in tension with the canon's stated rule**, and the spec doesn't reconcile the two. Either the canon's no-defer rule has a principled exception for optional adapters-behind-seams (state it), or this violates it. As written it's an unacknowledged contradiction.

---

## RISKS (severity + concrete mitigation)

**R1 — Legal: redistribution without a verified copyright notice. [HIGH]**
Selling a yrka.io product built on a fork whose MIT copyright line you cannot reproduce is a license breach exposure, however small the practical risk.
*Mitigation:* before any redistribution, fetch the actual `LICENSE`/`LICENSE.md` from the upstream repo (try `main`, `master`, and the published npm tarball's bundled file via `npm pack @agent-native/core && tar -xzf` — the tarball almost always bundles the license even when GitHub paths 404). Record the verbatim copyright holder + year in our fork's `LICENSE` and `NOTICE`. Blocking gate, not a fork-time nicety.

**R2 — Legal: Nango ELv2 contamination of the OSS repo. [MED]**
ELv2 (verified, `references/nango/LICENSE` line 1) forbids "provide … as a hosted or managed service" and forbids circumventing the license key. The spec's guardrail ("self-hosted sidecar only, never forked into OSS, never SaaS-wrapped") is correct. The risk is *accidental* contamination: an agent copying a Nango adapter snippet into the jami.studio OSS repo, or yrka.io (commercial SaaS) exposing Nango-backed connectors such that Nango is effectively offered "as a managed service" to yrka's end users.
*Mitigation:* (a) the Nango adapter lives in a **separate, non-OSS, internal-only package** physically outside the jami.studio repo tree; (b) a CI guard (mirror the existing `guard-no-env-credentials.mjs` pattern) that fails if `nango` is imported anywhere in an OSS-published package; (c) a written determination that yrka.io's use is "internal self-host behind our own product," not "Nango-as-a-service to end users" — get this in writing before any yrka connector ships on Nango.

**R3 — Legal: Base UI license unverified; spec leaves the Radix-vs-Base-UI fork open. [LOW-MED]**
shadcn CLI v4 `--base` lets you pick Radix *or* Base UI as the primitive engine (shadcn-as-agent-registry §3). The clone uses Radix (verified: `@radix-ui/*` in `packages/core/package.json`; no Base UI). The spec never states which we pick, and **Base UI's license was never checked** in any doc despite the review brief naming it. Radix is MIT (well-established); Base UI (MUI's successor primitive lib) — unverified here.
*Mitigation:* pick Radix (already in the clone, MIT, zero migration) unless a first-principled reason favors Base UI; if Base UI, verify its license (MUI ecosystem historically MIT, but confirm the specific package + version) before adopting. Either way: pick once, register as the registry base, never mix (the dive says this — elevate it to a decision, not a downside note).

**R4 — Ops: cumulative solo-operator maintenance load exceeds "no burdensome maintenance." [HIGH]**
Stacked, the recurring burden is: (1) watch a pre-1.0 upstream for CVEs + rebase a pinned fork; (2) operate N per-org BetterAuth stores + N migration runs + N `BETTER_AUTH_SECRET`s; (3) operate N per-org SECRETS vaults + N `SECRETS_ENCRYPTION_KEY`s with re-encrypt-only rotation; (4) host N per-org shadcn registry endpoints + rotate N `REGISTRY_TOKEN`s; (5) write + maintain per-provider client code (template-owned readers); (6) optionally operate a Postgres+Redis+server Nango sidecar; (7) keep two UI render paths (native + MCP-UI iframe) token-consistent. For *one human + agents*, this is a lot of standing surface — the canon's own "no burdensome maintenance" / "reduce overhead on every action" tests are at risk.
*Mitigation — the leanest ops shape (recommendation):*
  - **Collapse "N per-org isolated stores" to "isolation as a capability, invoked per-org only when an org actually needs hard isolation."** Default the *common* case (Jamie's own orgs, jami.studio, jnh.org) to the org-plugin **soft** isolation (one DB, `org_id`-scoped rows — agent-native already runs this) and reserve **per-instance hard isolation** for the genuine multi-tenant-external case. The betterauth dive frames hard isolation as "the floor"; first principles say it's the floor *only where a tenant demands it*, otherwise it's N× bloat for one operator. This single change removes most of (2)/(3)/(4)'s N-multiplication now, without precluding hard isolation later (it's a config choice — the dive says so).
  - **One global registry endpoint, auth-gated, not N.** Per-org *auth* on one registry host satisfies isolation far more cheaply than N hosts; only split when an org genuinely cannot share the registry.
  - **Centralize secret/key custody** in one managed KMS/secret-store (the `secrets/storage.ts` swap seam exists — moderate) so "N keys" is N references, not N hand-managed strings.
  - **Pin the fork via git subtree in the monorepo** (not submodule) with a single documented `upstream-sync` skill (thin orchestration skill per canon §1) that diffs the four+ seam files and runs the verification ladder. Make CVE-watch a scheduled agent routine, not a human chore.

**R5 — Version drift on pre-1.0 dependencies (compounding). [MED-HIGH]**
Verified live: `@assistant-ui/react` latest is **0.14.13** (published the day of this review, actively churning); the clone pins **^0.12.19** — already a minor behind, and the agent surface is built directly on it. BetterAuth is 1.6.x pre-2.0 with a steady security-fix cadence (betterauth dive). agent-native itself is 0.23.0 vs 0.32.0. **Three** load-bearing pre-1.0/fast-moving deps stacked under us.
*Mitigation:* pin all three explicitly; subscribe to each changelog/security feed; budget a recurring "dependency drift" review (scheduled agent routine). Treat the agent surface's assistant-ui coupling as a swap-candidate seam (the dive notes the transport is replaceable) so a breaking assistant-ui bump can't hold the whole UI hostage.

**R6 — MS agent-governance-toolkit immaturity. [MED]**
Verified live: real, `microsoft/agent-governance-toolkit`, **MIT**, but **released 2026-04-02** — ~2 months old at review, with skeptical early coverage ("an honest take", "out-of-control AI agents"). The spec treats it as a committed, sub-ms, OWASP-conformant policy engine. License clears; **maturity does not**. Betting the entire entitlement plane on a 2-month-old toolkit is risk-seeking past the edge.
*Mitigation:* keep the policy *seam* (`assertAccess()` / `assertConnectionUse()` choke point — that part is sound and agent-native-native) but make the *engine* behind it swappable. Prototype the MS toolkit behind the seam; if it's immature, the choke point still works with a hand-rolled capability resolver (the dive's "small glue") as the interim engine. Do not let "MS toolkit" become a hard dependency before it's proven.

**R7 — Lock-in re-entry via the bolt-ons. [LOW-MED]**
The spec retires Builder lock-in but introduces three new external dependencies the foundation does *not* contain (AG-UI protocol, MS toolkit, optionally Nango). Each is a new version-drift + maintenance + lock-in surface the clean MIT foundation didn't have.
*Mitigation:* hold each behind a documented seam (AG-UI behind the transport rebind, MS toolkit behind the policy choke point, Nango behind ProviderReader) — the spec mostly does this; make it a hard rule that none of the three may be imported outside its single adapter module (CI-guarded).

---

## BETTER-SUITED ALTERNATIVES (steelmanned → adopt/reject + why)

**A1 — Track agent-native upstream as a dependency, don't fork. (vs. the spec's "vendor a pinned fork")**
*Steelman:* it's MIT and pre-1.0 but actively maintained with security PRs landing; consuming `@agent-native/core` as a normal pinned npm dependency means `npm audit` + Dependabot do the CVE-watching for free, and you inherit fixes without cherry-picking. Forking means *you* become the security maintainer of 0.3M+ LOC.
*Judgment:* **partial adopt.** The spec's swaps (drop Builder engine registration, rebind transport, rename branding) require *editing* core, which forces a fork. BUT — most swaps are config/adapter-behind-seam (engine via env, DB via `DATABASE_URL`, transcription via adapter). If the branding/identity changes can be done via *configuration + wrapper packages* rather than editing core source, you could consume core as a pinned dep for the engine/connection/secret layers and only fork the genuinely-must-edit parts. This materially shrinks R4/R5. The spec should explicitly separate "swaps achievable without forking" (keep as dep) from "swaps requiring a fork" (vendor only those) — it currently assumes a wholesale fork. Re-examine.

**A2 — BetterAuth org-plugin soft isolation as default. (vs. per-instance hard isolation as "the floor")**
*Steelman:* the betterauth dive itself says the org plugin's `org_id`-scoped single-store model is what agent-native ships and runs. Hard per-instance isolation is the more secure model, but for one operator running a handful of first-party orgs it's N× the ops for isolation no current tenant demands.
*Judgment:* **adopt soft-as-default, hard-as-capability.** This is the single biggest lean-up (see R4). The dive supports it; the recommendation §6 over-commits to the hard model. First principles: isolation is a capability you invoke where a tenant requires it, not a tax you pay N times pre-emptively. Reject the "hard isolation is the floor" framing as under-justified bloat-in-the-other-direction.

**A3 — Stack Auth / Neon Auth / Supabase Auth (provider auth). (vs. BetterAuth)**
*Steelman:* zero auth-store to operate; the provider runs it.
*Judgment:* **reject, correctly** — the betterauth dive's reasoning is sound (provider auth re-introduces exactly the per-provider tenancy lock-in the direction retires; you can't move one org off it without a migration). Confirmed: BetterAuth is the right call. No change.

**A4 — assistant-ui as the transport too (vs. rebinding to AG-UI). [the under-examined alternative]**
*Steelman:* the agent surface is *already* built on assistant-ui's runtime over `/_agent-native/*` SSE; it works in the clone. AG-UI is a protocol that appears in **zero** source files — it's a planned bolt-on. Rebinding a working transport to an unproven external protocol is net-new risk + a new version-drift surface, for a benefit (AG-UI is "the protocol the majors maintain") that is asserted, not demonstrated for our use.
*Judgment:* **flag for proof, lean toward defer.** The spec treats AG-UI as committed (per canon 06). But on *this* lens, rebinding away from a working, in-foundation transport to a not-in-foundation protocol is the kind of self-imposed work the ethos says must be first-principle-proven first. At minimum it must be on the proof-of-work list (P1). The leaner path may be: ship on the existing SSE transport, keep AG-UI as a documented seam, and rebind only once AG-UI maturity + a concrete capability need is proven. Don't bolt on the unproven protocol pre-emptively.

**A5 — Use a battle-tested policy engine (OPA/Cedar) instead of the 2-month-old MS toolkit.**
*Steelman:* Open Policy Agent (CNCF graduated, years of production) and AWS Cedar (formally verified, open source) are mature `(subject, action, resource) → allow/deny` engines that do exactly what the connection-use gate needs, with far more provenance than a 2-month-old toolkit.
*Judgment:* **add to the alternatives the spec never considered.** The spec jumped to the MS toolkit (per canon 06) without steelmanning mature policy engines. For the *capability/RBAC decision* the gate needs, Cedar or OPA is arguably the more Principled-Edge choice (proven foundation > bleeding-edge). The MS toolkit's differentiator is its OWASP-Agentic-Top-10 + signed-audit framing, which *may* justify it — but that case must be made against Cedar/OPA, not assumed. Re-open this as a genuine comparison before committing the entitlement plane.

---

## PROOF-OF-WORK NEEDED before green light (the "shame shame" list)

Every claim below is **load-bearing in the spec and asserted-but-unproven**. The voice deep-dive is exemplary in admitting its own gap; these others are not yet held to the same bar.

- **P1 — AG-UI transport rebind actually works against the agent surface.** AG-UI is in **zero** source files (verified). The spec commits to ripping out the working SSE transport and rebinding to AG-UI carrying an owned SDUI vocabulary. *Prove:* a spike that renders one real `ui.tree` round-trip over AG-UI through the actual `AssistantChat`/`use-db-sync` surface. Until then, "rebind transport to AG-UI" is a wish, not a seam.
- **P2 — MS agent-governance-toolkit policy model fits the choke point.** Released 2026-04-02; never read against ground truth (provider-authz-audit-crux "Unverified" admits this explicitly). *Prove:* read its actual API; confirm `(org, user, agent, provider, scopes) → allow/deny` shape; wire one real `assertConnectionUse()` decision through it; benchmark the "sub-ms" claim. Compare head-to-head with Cedar/OPA (A5) before committing.
- **P3 — Realtime voice (carried over from the voice dive, still unproven).** The voice bake-off proved plumbing, not experience — every live observation is `_pending live walk-through_`. The recommendation leans on voice/transcription as a capability win. *Prove:* the one approved live-eval sitting (latency, barge-in, tool-call correctness, lane pick). Dictation is genuinely ready (verified — multi-provider, BYOK, request-scoped already); realtime voice is not.
- **P4 — The `@jami-studio/ui` exports actually decouple from the server/db/auth stack.** The spec asserts ui can depend on core "only through the documented endpoint contract" via the `./client` vs `./server` vs `./db` exports split. The UI dive itself lists this as "inferred from the endpoint/SSE contract, not proven by building it." *Prove:* build ui importing only the client subset and confirm it doesn't transitively pull the server/auth/Drizzle stack.
- **P5 — 0.32.0 seams match the 0.23.0 the spec read.** All docs read 0.23.0; npm latest is 0.32.0; **never diffed** (9 minors of a pre-1.0). Every "the seam is at file:line" claim is against the older version. *Prove:* re-clone 0.32.0, diff the seam files (`registry.ts`, `builder-engine.ts`, `ai-sdk-engine.ts`, `db/client.ts`, `sharing/access.ts`, `a2a/*`, `better-auth-instance.ts`, `transcribe-voice.ts`, `McpAppRenderer.tsx`, `appearance.ts`) before any line-cited work begins.
- **P6 — A2A `pushNotifications: false` gap.** The card advertises no webhook push (verified-by-code-self-declaration, not a conformance suite). If orchestra needs push-based inter-agent triggers, this is a build, not an adopt. *Prove:* confirm whether the orchestra design needs A2A push; if so, scope it.

---

## UNVERIFIED (carry as fork-time / decision-time checks)

- Root `LICENSE` text + **copyright holder/year** — no LICENSE file in the clone; GitHub 404'd. **Blocking for redistribution** (R1). Try the npm tarball's bundled license.
- **Base UI license** (if chosen over Radix) — never checked in any doc; Radix is MIT and already in the clone (verified).
- agent-native.com/docs + hosted gateway/transcription pricing & ToS — npm 403 in prior passes; moot since swapped, but read before relying on any hosted path.
- 0.23.0 → 0.32.0 seam diff — not done (P5).
- A2A v0.3 conformance — code-self-declared, not suite-tested; `pushNotifications: false`.
- Composio MIT-SDK/self-host posture — secondary sources only; moot (not adopted).
- Nango self-host free-tier ceiling — blog/G2, not the pricing page; ELv2 + 830 providers verified from the clone.
- MS toolkit "sub-ms" + OWASP-conformance performance claims — vendor framing, not measured (P2).
- assistant-ui drift — verified live: latest 0.14.13 vs clone-pinned ^0.12.19 (R5).
- MS toolkit existence/license/date — verified live: real, MIT, released 2026-04-02 (R6).

---

## Bottom line for Jamie

Adopt the foundation — that part is right and the evidence is strong. But **gate redistribution on the missing copyright notice (R1/H1)**, **prove AG-UI and the MS toolkit before committing them (P1/P2/A4/A5)**, and **lean the ops shape**: default to soft per-org isolation + one auth'd registry + centralized key custody + consume-as-dep-where-possible, reserving hard per-org isolation and the Nango sidecar for tenants/breadth that actually demand them (R4/A1/A2). The spec's biggest Principled-Edge fault on this lens is **under-engineering disguised as leanness in two places** (the hand-waved fork-maintenance mechanism H2, and the un-shaped audit durability H4) while simultaneously **over-engineering** the per-org N-multiplication (R4/A2) and pre-emptively bolting on two unproven external systems (R6/A4/A5). Fix those and the foundation decision is clean.

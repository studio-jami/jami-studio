# Spec Review — Challenge the foundation choice itself

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
Reviewer lens: steelman the alternatives to "adopt agent-native wholesale," verify each
alternative's 2026 state, then judge honestly. Isolated planning pass — locks nothing.
Ground truth: local clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`
(`@agent-native/core` 0.23.0, `@agent-native/dispatch` 0.8.18, both MIT — verified on disk),
`voice-prototypes`, and dated 2026 official sources (cited inline).

---

## VERDICT: **SOUND — with one re-frame that must change, and three blocking holes to close before green light.**

The core decision survives scrutiny. I steelmanned build-fresh and seven named frameworks;
**none beats agent-native for this specific goal** (one-human-many-agents, agnostic,
OSS-leaning, file-shared-state, full-suite platform, fully self-hostable, sellable). The
load-bearing differentiators are real and verified: a single full-MIT stack (core + dispatch
+ embedding + migrate + pinpoint + scheduling), no hosted-runtime ELv2 trap (the trap that
bites LangGraph, Mastra-EE, and Nango), and `dispatch` — a genuine cross-app delegation +
grants + approvals + audit control plane that **no competitor ships as MIT**. Cherry-picking
would forfeit dispatch's integration (its biggest prize) for no first-principles gain;
build-fresh would re-derive the connection/secret/A2A/dispatch substrate the canon's
zero-bloat rule forbids re-deriving.

**The one thing that must change is the spec's framing of maturity.** The spec calls
agent-native "production-shaped, battle-tested." Builder.io's own public positioning (verified
2026-06-01) describes the open-source project as **"very early"**; the public GitHub repo is at
tag **`0.1.7-101`** with **443 stars** and **~1,528 commits**. "Battle-tested" is true *only*
of the seams `voice-prototypes` actually exercised (loop, engine registry, Postgres path,
connection/secret layer). Everything else — dispatch orchestration, A2A at scale, D1/Turso,
the 0.32.0 npm line — is read-not-run. Re-frame from "battle-tested foundation" to
**"correctly-architected, lightly-proven, single-vendor pre-1.0 codebase we hard-fork and own."**
That re-frame doesn't change the adopt decision; it changes the risk posture and the
proof-of-work gate, which the spec currently under-budgets.

This is decisive, not a hedge: **adopt wholesale, hard-fork, own it outright** — but go in with
eyes open that you are adopting an *architecture* (excellent) carried by a *young, thinly-starred,
single-vendor implementation* (a maintenance liability you are choosing to absorb, correctly,
because the architecture is worth more than the fork cost).

---

## HOLES (unanswered questions / hand-waved steps — with where)

**H1 — BLOCKING: the version you fork is undefined and the two version lines are unreconciled.**
`recommendation.md:9-10` and §7 ("Could not verify") admit the clone is 0.23.0, npm `latest` is
0.32.0, and the 0.32.0 source was *never diffed*. My check adds a third number: the public
GitHub repo's latest **tag is `0.1.7-101`** (2026-06-01), not 0.23.0 or 0.32.0. Three numbering
schemes (GitHub `0.1.7-NNN` build tags, npm `0.x.0` semver, local clone `0.23.0`) and the spec
never resolves which artifact is authoritative or which one we fork. The plan "vendor a pinned
fork at the target version; re-verify the key seam files" (§7) is correct in shape but has **no
defined target**. You cannot pin what you haven't identified. This blocks: the entire seam-map in
§2 was read against 0.23.0 and may not hold at the fork point.

**H2 — BLOCKING: no LICENSE file = unresolved attribution obligation for a stack you intend to SELL.**
Verified on disk: **no `LICENSE`/`LICENSE.md` at repo root or under `packages/core`**. The MIT
grant is asserted only via per-package `"license": "MIT"` fields. MIT *requires* reproducing "the
copyright notice and this permission notice" — and the copyright holder string lives in the
LICENSE file you don't have. Three pillars + the recommendation all carry this as "could not
verify" (`recommendation.md:286-287`, `org-permissions…:130`). For a foundation that yrka.io will
**sell**, shipping without the upstream copyright notice is a real (if low-severity) license
defect. This is a 10-minute fix (fetch the notice from a tagged release / npm tarball) but it is
unclosed and gating redistribution.

**H3 — BLOCKING: the orchestra "workflow engine" is named as net-new but has zero shape.**
Every pillar concedes dispatch is "app-to-app delegation + scheduled jobs + grants/approvals,
**not** a DAG/planner" (`org-permissions…:39,124`; `engine-harness-memory:181`). The
recommendation defers a "declarative multi-agent DAG/workflow engine *if and when* orchestra
needs more than delegation + scheduled jobs" (`recommendation.md:176`). But the canon commits to
**full-final-shape, no "defer until demand" language** (`plan.md:74`). So either (a) the end-shape
genuinely needs no planner — in which case say so and prove it from first principles, or (b) it
does — in which case it is unspecified net-new work with no contract, no build-vs-adopt call (a
planner is exactly where LangGraph/Temporal-style tools are strongest), and no closing criteria.
The spec straddles both. This is an undefined contract on the orchestra foundation itself.

**H4 — MED: "rebind transport to AG-UI" is the most-repeated swap and the least-specified.**
The agent surface (`AssistantChat.tsx`, verified **5,307 lines**) binds to the harness via SSE +
`application_state` polling over `/_agent-native/*`. The spec says "rebind its transport to AG-UI
(adapter swap on the SSE/endpoint contract)" (`recommendation.md:130-133`). The shadcn deep-dive
admits "no official shadcn+AG-UI render example found; the `UiTreeRenderer` is ours to build"
(`shadcn-as-agent-registry:217`). A 5,307-line assistant-ui-coupled surface is not an "adapter
swap" — assistant-ui has its own runtime/transport model, and rebinding it to AG-UI while keeping
the surface is unproven (the UI pillar itself flags this: "inferred from the endpoint/SSE contract,
not proven by building it," `ui-registry…:247`). Either the rebind is cheap (prove it with a
spike) or the surface is partly rebuilt (then it is not "adopt + rebind," it is build, and the
LOC moves to our column).

**H5 — MED: the MS governance toolkit is wired into three load-bearing decisions but never read.**
The policy/audit engine choice (`recommendation.md:135-144`, the connection-use gate in
`provider-authz-audit-crux:96-98`) all depend on Microsoft's `agent-governance-toolkit`. The crux
deep-dive is explicit: "not read in this dive (no source in the agent-native clone)… Confirm its
policy model `(subject→permission)` shape and self-host/licensing before wiring"
(`provider-authz-audit-crux:118`). I verified the toolkit *exists* (MS Open Source blog,
2026-04-02, MIT) — but the spec wires its *API shape* into the choke-point design without having
read it. If its model doesn't cleanly produce `(org, user, agent, provider, scopes) → allow/deny`,
the `assertAccess()`/`assertConnectionUse()` integration is hand-waved.

**H6 — LOW: per-provider client code is acknowledged-but-unbudgeted.** Four documents repeat that
readers are `template-owned` — core ships the typed seam + credential plumbing, **not** turnkey
Slack/Notion/HubSpot/Gmail clients (`integrations…:179`, `provider-landscape…:161`). "Adopt
wholesale" still leaves N hand-written provider clients + N OAuth app registrations + proactive
refresh (Google-only today). The spec says "budget for it" but never budgets it. For a
full-suite platform this is the largest hidden labor line and it has no estimate.

**H7 — LOW: `pushNotifications: false` on the A2A card is a named protocol gap with no plan.**
`recommendation.md:290` notes the A2A surface advertises no webhook push (a gap vs full A2A
optional features) and conformance is "code-self-declared, not suite-tested." For a
many-agents mesh, push-vs-poll is an architectural choice; carried as a footnote, not a decision.

---

## RISKS (severity + concrete mitigation)

**R1 — HIGH — Single-vendor, pre-1.0, thinly-adopted foundation (bus factor + abandonment).**
443 GitHub stars and a vendor description of "very early" (both verified 2026-06-01) mean you are
betting a multi-year platform on one company's young side-project. If Builder.io pivots or
archives it (Gartner's own 2026 note: >40% of agent initiatives may be abandoned by 2027), there
is no community to carry it. *Mitigation:* the hard-fork the spec already mandates **is** the
mitigation — but make it a true hard fork (own CI, own release line, no upstream-tracking
dependency), and front-load a one-time "can we operate this without upstream?" audit (build from
source, run the test suite, confirm no hidden hosted call paths). Budget the fork as a permanent
maintenance line, not a one-time lift.

**R2 — HIGH — Version-drift treadmill on a fast-moving pre-1.0 line.** 0.23→0.32 (npm) in weeks,
active security PRs (IDOR #369 referenced in-code). Tracking upstream = treadmill; not tracking =
you inherit known CVEs. *Mitigation:* hard-fork at one identified tag (closes H1 first), then
**cherry-pick only security fixes**, not features; subscribe to the repo's security advisories;
re-run the seam-verification checklist (`registry.ts`, `builder-engine.ts`, `ai-sdk-engine.ts`,
`db/client.ts`, `sharing/access.ts`, `a2a/*`) at each cherry-pick. Accept feature-stasis as the
price of stability — you are forking *the architecture*, not subscribing to *the product*.

**R3 — MED — Builder coupling is broader in code than "one engine among many" implies.**
Verified: `builder-engine.ts` is **907 lines** (not a thin client), and Builder error semantics
leak into the *generic* loop's retry logic (`production-agent.ts:646-719`, per
`engine-harness-memory:206-210`). The decoupling claim is *architecturally* true (the loop calls
the `AgentEngine` interface, never Builder by name) but there is more Builder-flavored surface to
sweep than "drop one registration block." *Mitigation:* the spec already lists the branding/error
sweep (§3 item 6); add the 907-line engine + the retry-logic special-cases to the sweep
checklist and treat removal (not just non-registration) as the clean-fork default.

**R4 — MED — "Adopt the architecture" silently becomes "rewrite parts" at the UI transport seam.**
See H4. If the AG-UI rebind + UiTreeRenderer + per-primitive SDUI manifest are all net-new
(`shadcn-as-agent-registry:170-174` rates them Moderate × 3), the ui "adopt" is closer to
"adopt tokens + build the rest." *Mitigation:* run a transport-rebind spike against the real
`AssistantChat` before declaring ui "adopt + thin build." If the spike is hard, re-scope
ui honestly as a build (it may *still* be the right call — but the bloat ledger must be
accurate in both directions per `plan.md:0`).

**R5 — MED — Fork burden compounds across the whole monorepo dependency graph.** Every template is
`"@agent-native/core": "workspace:*"` (`ui-registry…:222`); core pulls Amplitude, Sentry,
BetterAuth, Drizzle, Tiptap, assistant-ui, Radix, Shiki, Nitro. Forking core means owning that
transitive surface's upgrades too. *Mitigation:* the `./client` vs `./server` vs `./db` exports
split (verified design) lets ui depend on the UI subset only; enforce that boundary at fork
time so a Nitro/Sentry bump can't ripple into the UI package.

**R6 — LOW — `globalThis` registry pattern is a bundler-specific hack.** Sharing + tracking
registries use a `globalThis` singleton as a Vite-SSR dedupe trick (`recommendation.md:270`),
fragile under a different bundler. *Mitigation:* note it in the fork's "known fragilities";
re-verify if build tooling diverges from Vite.

**R7 — LOW — `SECRETS_ENCRYPTION_KEY` rotation invalidates the entire vault.** Named in three docs.
*Mitigation:* document rotation = re-encrypt migration, never flip; bake into the per-org
provisioning runbook (multiplied under per-org isolation).

---

## BETTER-SUITED ALTERNATIVES (steelmanned → judged; 2026 state verified)

**1. BUILD-FRESH on primitives (Vercel AI SDK + assistant-ui + shadcn + own thin loop) → REJECT.**
*Steelman:* AI SDK is genuinely excellent and current — **AI SDK 6 shipped** (Vercel blog), with
`Agent` class, `stopWhen` tool-loops, `prepareStep`, fully-typed multi-framework chat UI; MIT,
self-hostable. A thin loop over it is ~the harness's core, exact-fit, zero fork burden, zero
Builder cruft. *Judgment:* you'd lose — and have to re-derive — exactly what makes agent-native
worth adopting: the multi-tenant connection/secret vault with the 2026-04-29 leak hardening + CI
guards, `dispatch` (cross-app delegation + grants + approvals + audit), org/sharing centralized
access control, the A2A + MCP protocol surface, and the file-shared-state thesis wired through.
That is months of security-sensitive work the canon's zero-bloat rule forbids re-deriving when a
full-MIT implementation exists. **agent-native wins decisively.** (Note: agent-native's own engine
*is* AI SDK under the hood — `ai-sdk-engine.ts` — so you keep AI SDK 6's benefits anyway by
bumping that adapter. You don't choose between them; agent-native gives you AI SDK *plus* the
platform.)

**2. Mastra → REJECT (closest call).** *Steelman:* Mastra hit **1.0 in Jan 2026**, 22k+ stars,
300k+ weekly npm, TS-native agents+workflows+RAG, **first-class workflow/DAG engine** (the exact
H3 gap), Apache-2.0 core, deploys anywhere (Node/Bun/Deno/CF/Hono/Express), and is an **AG-UI
adopter** (so the UI transport the spec wants is native, closing H4). On maturity and stars it
*dominates* agent-native. *Judgment:* but (a) its enterprise features (SSO/RBAC/ACLs in `ee/`) are
under a **separate Mastra Enterprise License** requiring a commercial license for production — the
exact "open core with a paid wall on the governance layer" pattern the canon's full-MIT,
sellable-OSS posture avoids; (b) it has **no dispatch-equivalent** (cross-app agent delegation +
vault grants + approval/audit control plane) — Mastra is a single-app agent framework, not a
multi-app workspace control plane; (c) the file-shared-state agent↔UI parity thesis is
agent-native's, not Mastra's. **Verdict: agent-native wins on full-MIT + dispatch + shared-state
thesis — but Mastra is the strongest fallback and the place to steal the workflow engine from if
H3 resolves to "we need a planner."** Do not dismiss Mastra; name it as the orchestra-planner
candidate.

**3. CopilotKit / AG-UI → ADOPT THE PROTOCOL (already implied), REJECT as the framework.**
*Steelman:* CopilotKit are the **AG-UI authors** (MIT protocol; adopted by Google, MS, AWS,
LangChain, Mastra, Pydantic), raised **$27M in May 2026**, MIT framework, the strongest
agent↔frontend generative-UI story in 2026. The spec *commits to AG-UI* (`recommendation.md:130`)
but **never mentions CopilotKit** — yet CopilotKit is the reference implementation of the exact
ui transport the spec is hand-rolling (H4). *Judgment:* this is a genuine gap in the spec's
reasoning, not a reason to switch foundations. CopilotKit is a *frontend* stack, not a
harness/connection/dispatch foundation — it complements agent-native, doesn't replace it. **But
the spec should explicitly evaluate CopilotKit's React packages as the AG-UI client** instead of
building `UiTreeRenderer` from scratch; building the AG-UI client yourself when the protocol's
own MIT authors ship it is potential bloat. *Action: add CopilotKit to the H4 spike as the
buy-vs-build comparator for the UI transport.*

**4. LangGraph → REJECT (and it validates the spec's license vigilance).** *Steelman:* the most
mature orchestration/planner in the field, MIT library. *Judgment:* `langgraph` (lib) is MIT but
**`langgraph-api` (the production server runtime) is Elastic License 2.0 and needs a commercial
key in production** — the *identical* ELv2 trap the spec correctly quarantines Nango behind a
sidecar for. Adopting LangGraph as the orchestra runtime would re-import the lock-in the build is
retiring. Python-first also fights the TS-native stack. **agent-native (full-MIT, no hosted-runtime
wall) wins** — and LangGraph is the cautionary example proving why the spec's "full-MIT including
the runtime" criterion is load-bearing, not pedantic.

**5. OpenAI AgentKit / Agents SDK → REJECT.** Provider-coupled to OpenAI's Responses API;
strongest when locked to OpenAI's newest features (sandbox exec, durable snapshotting). Directly
violates the canon's BYOK/agnostic rule. No multi-tenant connection vault, no dispatch, no
shared-state thesis. Off-thesis.

**6. Microsoft Agent Framework → PARTIAL ADOPT (already in the spec, correctly).** The
**Agent Governance Toolkit (MIT, 2026-04-02)** is verified and is exactly the policy/audit engine
the spec layers at `assertAccess()`. That is the right cherry-pick. The broader MS Agent Framework
(Semantic Kernel lineage) is .NET/Python-centric and off-stack — correctly not adopted as the
loop. **Spec's choice here is sound; close H5 by actually reading the toolkit's policy API.**

**7. Google ADK / Cloudflare Agents → REJECT.** ADK is Google-ecosystem-leaning; Cloudflare Agents
(`agents` npm) is Workers/Durable-Objects-coupled (host lock-in vs the canon's host-agnostic rule).
Neither offers the connection/secret/dispatch/shared-state substrate. Off-thesis.

**CHERRY-PICK vs WHOLESALE → WHOLESALE is correct, with two carve-outs the spec already makes.**
The one part worth taking standalone is `dispatch` — but `dispatch` depends on `core`'s org/
sharing/secret/a2a substrate, so taking "only dispatch" still drags in core. Cherry-picking buys
nothing and forfeits the integration that is dispatch's whole value. The spec's actual shape —
adopt core+dispatch wholesale, build *only* the shared UI primitive registry, swap config/adapters
behind existing seams — is the correct zero-bloat cut. **No change to the wholesale call.**

---

## PROOF-OF-WORK NEEDED before green light

1. **Pick and pin the fork target (closes H1).** Reconcile the GitHub `0.1.7-101` tag vs npm
   `0.32.0` vs clone `0.23.0`; identify the exact commit/tag you fork; re-run the §2 seam-map
   against *that* source (the spec's six named files at minimum).
2. **Fetch and vendor the upstream LICENSE + copyright notice (closes H2).** Confirm the holder
   string; commit it into the fork. Gating for any redistribution/sale.
3. **AG-UI transport spike (closes H4 + tests Alt-3).** Rebind the real `AssistantChat` (5,307 LOC)
   to AG-UI in a throwaway branch; compare against dropping in CopilotKit's AG-UI React client.
   Outcome decides whether ui is "adopt + rebind" or "adopt tokens + build the surface."
3a. **Build agent-native from source, run its test suite, confirm no hidden hosted call paths**
   (mitigates R1) — prove you can operate the fork without Builder/upstream.
4. **Read the MS Agent Governance Toolkit's policy API (closes H5).** Confirm it emits
   `(subject, action, resource) → allow/deny` and that self-host/license fits, before wiring it
   into `assertAccess()`/`assertConnectionUse()`.
5. **Resolve the orchestra-planner question from first principles (closes H3).** Either prove the
   end-shape needs no DAG/planner (then delete the "if and when" hedge per `plan.md:74`), or scope
   it as full-shape net-new and name the build-vs-adopt comparator (Mastra's workflow engine is
   the verified candidate).
6. **Budget the per-provider client labor (closes H6).** Enumerate the core-set providers
   (Slack/GitHub/Notion/Gmail/Drive/HubSpot) × (reader client + OAuth app reg + refresh) as real
   line items, not "budget for it."

---

## UNVERIFIED (carry as fork-time checks; I could not confirm this pass)

- **Which artifact is the true fork source.** GitHub tag `0.1.7-101` (2026-06-01, 443 stars,
  ~1,528 commits) vs npm `latest 0.32.0` (spec) vs local clone `0.23.0` — three schemes, not
  reconciled by me or the spec.
- **The 0.32.0 (or chosen-target) source vs the 0.23.0 I read** — seams not diffed; the entire
  §2 map is a 0.23.0 read.
- **Upstream LICENSE text / copyright holder** — no LICENSE file on disk (verified absent at root
  and `packages/core`); MIT asserted via package fields only.
- **MS Agent Governance Toolkit policy model + self-host/license** — existence + MIT + 2026-04-02
  date verified (MS Open Source blog); its actual API shape unread.
- **AG-UI ↔ assistant-ui rebind feasibility** — inferred from the endpoint contract, never built.
- **CopilotKit React packages as a drop-in AG-UI client for this surface** — flagged as the
  buy-vs-build comparator; not prototyped.
- **dispatch live orchestration, A2A at scale, D1/Turso paths** — read from source, not exercised
  (`voice-prototypes` exercises only the loop, engine registry, Postgres, and connection/secret
  layer).
- **Mastra Enterprise License exact production triggers** — "ee/ dirs require commercial license
  for production" per Mastra docs (2026); exact feature boundary not line-verified (moot unless
  Mastra is adopted).

---

## Sources (dated 2026-06-01)

- agent-native repo/positioning: <https://github.com/BuilderIO/agent-native> (tag `0.1.7-101`,
  443 stars, MIT in README, no root LICENSE file), <https://www.builder.io/blog/agent-native-architecture>
  ("very early"), <https://www.agent-native.com/>
- Vercel AI SDK 6: <https://vercel.com/blog/ai-sdk-6>, <https://github.com/vercel/ai>
- Mastra 1.0 + Apache-2.0 core / Enterprise License: <https://github.com/mastra-ai/mastra>,
  <https://mastra.ai/>, <https://www.generative.inc/mastra-ai-the-complete-guide-to-the-typescript-agent-framework-2026>
- CopilotKit / AG-UI (MIT, $27M, May 2026): <https://www.copilotkit.ai/ag-ui>,
  <https://github.com/ag-ui-protocol/ag-ui>, <https://techcrunch.com/2026/05/05/copilotkit-raises-27m-to-help-devs-deploy-app-native-ai-agents/>
- LangGraph MIT lib / ELv2 `langgraph-api` runtime: <https://rvernica.github.io/2026/03/langchain-license>,
  <https://www.langchain.com/langgraph>
- OpenAI AgentKit / Agents SDK: <https://openai.com/index/introducing-agentkit/>
- MS Agent Governance Toolkit (MIT, 2026-04-02): <https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/>
- Google ADK: <https://adk.dev/>
- Local ground truth: `references/agent-native/packages/{core,dispatch}/package.json`,
  seam files verified present (see review body).

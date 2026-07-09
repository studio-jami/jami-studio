# Rebuild Research — Progress Checklist

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

**State (2026-06-02):** 13 workstreams researched, refreshed to greenfield, and audited. The
agent-native foundation + the open-decision walkthrough (auth, directory, voice) are folded into
the master synthesis and canon. Canonical docs are corrected and consistent; stale scaffolding is
retired. **Status: committed direction, pending Jamie's final green-light to lock into canon — not
yet officially accepted.**

**Start here:** `synthesis.md` (the single overall map) on top of `plan.md` (the Operating Canon).

## Phase 0 — Orchestration setup

- [x] Map terrain; read canon; create research tree; write plan/progress/log
- [x] Launch research workflow

## Phase 1 — Research reports (01–11)

- [x] All 11 reports written (01 projects · 02 system+tooling · 03 dev-systems · 04 secrets ·
      05 templates · 06 feasibility · 07 brands+funding · 08 canonical-system · 09 brand-dev ·
      10 product-concepts · 11 skills-audit)

## Phase 2 — Refresh to greenfield (canon)

- [x] All 11 reports rewritten in place against the Operating Canon (greenfield, no extraction,
      decisions baked, option-menus removed, aligned to `dev/orgs` structure)
- [x] Master `synthesis.md` written (the 01–11 map)

## Phase 3 — Workstream 12 (agent-native foundation)

- [x] Investigation: 4 pillars + `recommendation.md` (adopt agent-native wholesale)
- [x] Deep-dives (5) + adversarial spec-review (5)
- [x] Fact-finding pass (5 threads + `fact-finding/fact-finding-synthesis.md`) — corrected the
      pre-decision assertions: planner **Option A+** (no product-runtime DAG engine); **two transports**
      (native SSE internal + AG-UI external, both built); governance = **`@microsoft/agent-governance-sdk@4.0.0`
      (Public Preview)** behind one `policyCheck()` seam; additive **natural-named** data-model (no `yrka_`
      prefix); fork target **core 0.32.2 / dispatch 0.8.28**; `oauth_tokens` read-scope gap to fix at fork.

## Phase 4 — Audit + flush decided items (2026-06-01)

- [x] Full read-only audit of all 12 workstreams against canon + decided-state
- [x] Canonical set corrected & consistent: `synthesis.md` (12 folded in), `06`, `10`,
      `12 recommendation.md`, `12 fact-finding-synthesis.md`, `12 data-model` (prefix stripped)
- [x] Stale scaffolding retired: 6 extraction-era `review-notes.md` → superseded stubs;
      12-agent-native investigation tree (pillars/spec-review/deep-dives) → superseded headers
- [x] `synthesis.md` designated the overall **START HERE** doc
- [x] Reports 02, 03, 04, 05, 07, 08, 09, 11 `report.md` verified clean (no drift)

## Phase 5 — Open-decision walkthrough (2026-06-02)

Worked the open decisions one at a time with Jamie; folded each into the canonical docs.

- [x] **#1 Auth sign-in shape — DECIDED (soft-locked).** Self-hosted BetterAuth as an OIDC issuer per
      domain; passkeys-preferred + OAuth fallback; intra-domain SSO; domains unfederated-but-OIDC-ready;
      public marketing routes ungated → gated `app.<domain>`; agents as first-class principals.
      (canon §2 Identity, synthesis §3/§5, 06, 10.)
- [x] **#3 Directory arrangement — DECIDED (soft-locked).** Added an org→domain tier:
      **System → Org-lane (`oss`/`saas`/`personal`) → Domain → Project.** Intercal + Collective are their
      own `oss` domains (consume the foundations, not foundations inside jami.studio). Free-tools live
      inside the `yrka` product (inherit its auth). Foundation set = harness/ui/orchestra.
      (canon §2, synthesis §2, 04 vaults, 06, 07, 08, 10.)
- [x] **Voice — reframed + architected.** In scope, three coexisting modes (text / baseline STT↔TTS /
      optional real-time supervisor). Real-time = supervisor layer that dispatches to the harness +
      narrates via native-SSE seq-replay, toggle mid-run. Live-eval is build-time validation, not a
      planning blocker. New workstream **13-realtime-voice** fact-finding done → `recommendation.md`
      (LiveKit Agents transport, xAI Grok S2S default normalized to OpenAI Realtime schema, thin
      `realtime` adapter; net-new is only the dispatch/narration/session glue). (canon §2 Voice, 06 §9, 10, 13.)
- [x] **Adapter-seams register — CAPTURED.** §1 agnostic rule concretized into a canon §2 register
      (the (a) commoditized-API + (b) real-portability test; never-double-abstract). Email committed →
      `@opencoredev/email-sdk` (MIT, zero-dep; Resend primary + fallback, send-only). Adopt-at-build:
      OTel observability, S3-API storage port, media-gen port. Bounded: Stripe thin port; db already
      portable. (canon §2 Adapter seams, synthesis §3.)
- [x] **Distribution & open-core model — CAPTURED.** **Depend, don't fork** (boundary = published
      package surface, not a git merge — also enforces no-bleed). Framework (depended-on) vs scaffold
      (`create-agent-app`, instantiated once) split; yrka = scaffold + private `@yrka/*` on the public
      framework. Open-core line: OSS = engine + every seam + complete self-hostable product; commercial =
      scale/hosted/enterprise-governance/billing/suites (governance is the split). (canon §2, synthesis §3.)
- [x] **Agent discoverability (AX) — CAPTURED.** Agents = first-class user persona; legibility (uniform
      capability description) = the distribution moat. AX surface: llms.txt, MCP server, official skills,
      agent-first CLI, OpenAPI+SDKs, capability manifest, AGENTS.md in scaffold. Discoverability ⇄
      governance are one coin (rides committed principals/policyCheck/audit). (canon §2, synthesis §3.)

- [x] **Commercial model & the Kit — CAPTURED (shape forming).** OSS = full `@jami-studio/*` family,
      genuinely open (never crippleware) + funding-eligible. The **Kit** = paid commercial product
      (lean: under yrka): curated production-ready monorepo scaffold + interactive `jami` CLI provisioning
      + curated orchestration skills + support ("pay vs build"). **Orchestra optional + idempotent**
      (skill-set toggle, not re-provision). Revenue surfaces: hosted ops / done-for-you dev / launch-ready
      Kits. **Suites bridge, don't replace** (one shared registry). Billing upgraded to a real adapter.
      **MakerKit = reference only.** New canon §1 rule: latest official sources always. (canon §1/§2/§4,
      synthesis §3.)

## Active research (launched 2026-06-02)

- [x] **shadcn registry** — DONE. shadcn@4.10.0 (2026-06-01) GitHub registries; rich registry+MCP+skills.
      Decision: build `@jami-studio/ui` ON shadcn's official registry (don't handroll). Caveats: we own
      versioning; distribution = source-inlining (install/seed, not live runtime) → confirm install-vs-runtime.
      (canon §2 UI registry distribution.)
- [x] **Hosting (linchpin)** — DONE (recommendation, pending confirm). Hosted: **CF Workers-for-Platforms +
      Neon**; OSS: **Supabase + Neon(Apache-2.0)**. New **provisioning/control-plane** adapter seam.
      (canon §2 Commercial model + register; synthesis §3.)
- [x] **Open-core licensing + funding** — DONE (recommendation, counsel to confirm). **Apache-2.0** open
      foundation; DCO not CLA; OSI single-license; AWS excludes VC/single-vendor → DO+GitHub credits;
      MakerKit strict clean-room. (canon §2 Licensing & OSS-funding posture.)
- [x] **Packaging taxonomy** — DONE (recommendation, pending Jamie's nod). **App** primary; 3-tier
      App/Package/Plugin. (canon §4.)
- [x] **MakerKit local audit + billing adapter shape** — DONE. Source found + audited (clean-room
      reference). Billing = single-active swappable adapter; two contracts (strategy + webhook); normalized
      event vocab; webhooks-only-writer → idempotent upsert into provider-neutral entitlement tables;
      `taxMode` flag (MoR vs direct) = the un-normalizable seam. Grounded in official provider docs.
      (canon §2 register + MakerKit bullet; details in log.)

**First 5 research streams complete.** Two follow-up determinations launched (resolve up front, not at build):

- [x] **#6 Render mechanism (harness↔ui) — DONE.** Two registries: shadcn = build-time SEED; separate
      app-resident **allowlisted** registry renders harness `UIPayload` (data, not code; Zod-validated,
      graceful fallback). AG-UI + native SSE carry the stream; MCP-UI iframes = untrusted lane only. Design
      for version skew. (canon §2 "UI render seam".)
- [x] **#7 Next.js-on-Cloudflare parity — DONE: SPLIT THE STACK.** CF = platform plane (WfP/DO/Workers-AI/
      edge); Next.js apps on Vercel/Node host; optional first-party control-plane on Workers. Neon both;
      OSS = Supabase + Neon. (canon §2 hosting + register.)

- [x] **Funding posture — DEFINED.** Bootstrapped/not-VC-backed (asset for OSS credits); minimal admin now
      (Apache-2.0 + repo + standard community files) unlocks DO/GitHub/vendor credits; heavy items (entity,
      trademark, accelerators) deferred to traction; never self-gate. (canon §2, synthesis §3.)

**Naming sweep COMPLETE** (green-lit, standing): ~150 replacements across 24 docs, `agent-harness/ui/orchestra`
→ `@jami-studio/*`; `@agent-native` upstream + filesystem paths + rename-task descriptions intact. All 7
research streams complete and folded; canon + synthesis cohesive.

## Active research (round 2)

- [x] **Hosting deep-dive — DONE (named hosts).** **jami.studio** → Cloudflare Pages (Astro/static,
      ~$0–5/mo, unlimited bandwidth). **yrka.io** → one CF plane (Pages/Workers web + Workers-for-Platforms
      tenancy + Durable Objects sessions) + **Google Cloud Run** container kitchen (scale-to-zero, Jobs to 7d,
      L4 GPU) + Neon; Fly/Railway = alts. Vercel mispriced for long agent sessions (13-min ceiling). Kitchen
      ≈ $50–80/mo small, $150–300/mo moderate. Deliberate lock-in = DO + WfP only (isolate behind session/
      tenant interfaces); Docker-portable everywhere else. (canon §2 hosting + register; synthesis §3.)

Hosting mental model + per-product mapping + multi-host principle folded to canon §2 + synthesis. The
**contribution pattern** (user-intent → industry-informed hackable solution; principled pushback) is now a
canon §0 note ("how we work best").

## Open items (the only ambiguity that remains — creative/scope, canon §4)

- [x] **Core brand names + package convention — DECIDED.** **jami** (agent, "Just Another Machine
      Interface"), **the Studio** (UI environment), **jami.studio** (OSS platform), **yrka** (commercial).
      Package/repo convention (brand in namespace, function in leaf) — npm scope **`@jami-studio`**
      (`@jami-studio/harness|ui|orchestra|cli`, adapter pkgs, `@jami-studio/create-app`; binary `jami`),
      **GitHub org + socials `studio-jami`** (reverse-match), repos = function leaves, commercial scope
      `@yrka`. **Owned & confirmed:** `jami.studio` + `@jami-studio` + `studio-jami`. (canon §2 Naming,
      synthesis §1/§3/§6.)
- [ ] **Remaining product names** — one cohesive sweep for when Jamie has the feel: **SaaS suites**,
      **Intercal/Collective** product names, **etymara** (naming tool), other free-tool names. Leaning:
      **intercal.dev** (Intercal). Domains + core names settled; these are not.

## Feasibility-report stage (`docs/reports/`)

- [x] **Structure decided + scaffolded.** Hybrid **17 reports** (5 domains), `docs/reports/` — README index +
      template + all 17 skeletons (seeded scope/decisions/cements/sources). research/ preserved as the trail.
- [x] **Ops proposal LOCKED + E re-scaffolded.** Domain E expanded → F17 Operations Canon + F18 Brand +
      F19 Marketing + F20 Funding/pitch + F21 Sales/GTM + F22 Legal + F23 Finance + F24 Community (old single
      F17 stub removed). Set now **24 reports**. Infra defaults locked (shared founder.yaml · Mercury ·
      apply-after-surface-live); entity type+tool OPEN (CPA/QSBS); creative calls §4-open.
- [x] **Authoring pass — DONE.** All 24 reports `AUTHORED 2026-06-02` (one cohesive author; ~22k words).
      Full depth F01–F16 + Stage-0 ops (F17/18/20/22); staged lanes solid-but-tighter (F19/21/23/24). Real
      cross-linked dependency graph; house style held; spot-checked F17 (ops centerpiece) + F09 (render seam)
      = strong. **No `canon-change-needed` flags** (nothing contradicted canon). Open `needs Jamie` calls
      consolidated in `docs/reports/README.md`. **The feasibility stage is complete.**

## Operations / supporting side (the "rest of launch" — research-first)

- Agreed: the supporting/ops concepts (the **Operations Canon** + supporting lanes) are NEW, not
  canon-backed — so research + propose FIRST, then the E feasibility reports canon down from it (same flow
  as the dev side). Domain E expands from a single F17 → F17 Operations Canon + F18–F24 lanes (brand /
  marketing&content / funding&pitch / sales&GTM / legal&compliance&IP / finance&ops / community&support);
  scaffold-all, author-staged.
- **The Operations Canon (concept, pending proposal):** one canonical source of truth for durable business
  facts/assets/configs → every supporting artifact (deck, grant app, site copy, legal boilerplate, one-
  pagers, bios) is a generated/parity-maintained PROJECTION, never hand-maintained in parallel. The §1
  "supporting components stay prod-ready" rule made into a system. Lean/owned/agnostic, not a martech stack.
- [x] **Ops research + proposal — DONE** → `docs/research/14-operations/proposal.md`. Operations Canon
      (one `ops-canon/` dir of typed files → projections: Marp deck / Astro site / Mintlify docs / templated
      answer-bank+legal+bios; drift tooling = schema+freshness+no-secret; optional Keystatic; secrets stay in
      04-secrets). Stage-0 deep: funding/pitch (Kawasaki 10/20/30 via Marp), legal (Stripe Atlas $500 +
      templated governance + Termly/free-DPA, trademark deferred), brand (Figma→brand-tokens.json). Survey:
      marketing (content/PLG), sales (PLG+community-led), finance (Mercury), community. Staging tied to launch
      order (Canon once at Stage 0; later stages add records, not machinery). 8 needs-Jamie calls flagged.
      Strong + aligned. Infra defaults recommended (shared founder.yaml · Atlas · Mercury · apply-after-surface-live);
      creative calls (visual identity/voice/names/pricing) stay §4-open. Review with Jamie → refine → re-scaffold
      E + full authoring pass.

## Real-world setup underway (planning → execution begins)

- **Cloudflare:** per-org-lane accounts; **jami.studio DNS connected + active** on the oss account; old Vercel
  records cleared; full-access master API token created (→ vault). Transfer-vs-connect: connected now; transfer
  to CF Registrar (at-cost) is the June/July option before the Aug renewal.
- **Bitwarden (secrets backend):** scaffolded — one account = password manager + Secrets Manager org; **3
  projects** (oss/saas/personal) + **3 machine accounts** (per-lane, cross-assigned read-write); `*-master`
  access tokens = the agent bootstrap. **Secrets seeded as-we-go** (a few key ones first; the provisioning
  agent + agents handle the rest). Model understood: the access token is the key; secrets are the real creds.
- **Next setup (part of mapping):** each lane/project's **env + seed secrets** defined before work begins;
  the **provisioning-agent spec** ("one god-key → provision + vault the rest via CLI") is the tool to make it real.

## Awaiting

- [ ] **Green-light / canon-lock** — on Jamie's go, lock the soft-locked decisions + the agent-native
      and realtime-voice direction into canon as accepted (currently committed-but-pending).
- [ ] **Naming propagation (lock sweep)** — once green-lit, rename `agent-harness`/`agent-ui`/
      `agent-orchestra` → `@jami-studio/*` across the 12 workstream docs in one consistent pass (keep
      `@agent-native` upstream-fork refs as-is). Org/scope availability already confirmed & owned
      (`@jami-studio` npm, `studio-jami` GitHub, `jami.studio` domain).

See `synthesis.md` for the full map, `plan.md` for the canon, `activity-log.md` for the running log.

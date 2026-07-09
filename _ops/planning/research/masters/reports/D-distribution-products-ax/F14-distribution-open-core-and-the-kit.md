# F14 — Distribution, open-core & the Kit

Status: AUTHORED 2026-06-02 · Domain: D · Distribution, products & AX
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/00-orchestration/{plan,synthesis}.md` (Distribution & open-core; Commercial model & the Kit; licensing research #3), `10-product-concepts`
Related: F01 (repo strategy), F10 (orchestra skills), F16 (yrka = reference impl), F17

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

How it ships and how it's monetized. **In:** depend-don't-fork, framework-vs-scaffold, the paid Kit, open-core line, licensing/funding-eligibility structure. **Out:** the products themselves (F16), AX surface (F15).

## 2. Committed decisions (from canon)

- **Depend, don't fork** — boundary = published package surface, not a git merge (also enforces no-bleed). Extend through seams, never patch source.
- **Framework vs scaffold:** framework (`@jami-studio/*`) depended-on; scaffold (`@jami-studio/create-app`) instantiated-once. **yrka = scaffold + private `@yrka/*`** → we're a real user of our own OSS.
- **The Kit** = paid commercial product (lean: under yrka): curated production-ready monorepo scaffold + interactive `jami` CLI + curated orchestration skills + support. Differentiator = curation/assembly/support, never gating OSS. "Pay vs build."
- **Open-core line:** OSS = engine + every seam + complete self-hostable product (Apache-2.0, never crippleware); commercial = scale/hosted/enterprise-governance/billing/suites. Governance is the split.
- **Licensing/funding:** Apache-2.0; DCO not CLA; OSI single-license open packages; AWS excludes VC → DO+GitHub credits; **MakerKit strict clean-room**.

## 3. Architecture & mechanics

**Depend, don't fork (the boundary).** The OSS↔SaaS boundary is a **published package surface, not a git merge.** The public `jami.studio` repo publishes versioned `@jami-studio/*` packages; the private `yrka` repo consumes them as semver deps. "Sync downstream" = `pnpm update`; "upstream a tweak" = change in OSS → publish → bump. **No hard fork, no merge tax** — and the OSS repo *structurally cannot* contain SaaS code, so secrets/SaaS material can't leak upstream via a careless merge (§1 no-bleed, enforced by structure).

**Extend through seams, never patch source.** SaaS plugs into the harness via adapters/registries/hooks (the F11–F13 seams + the F09 UI/capability registries). The urge to "edit OSS from inside SaaS" is the signal a seam is too narrow — the fix is a **better extension point**, not easier merging. Target: **~95% of SaaS work touches only `@yrka/*`.**

**Framework vs scaffold (distinct artifacts).** The **framework** (`@jami-studio/harness`, `/ui`, `/orchestra` + adapter packages) is *depended on* and stays live-updated. The **scaffold** (`@jami-studio/create-app`, `npm create @jami-studio/app`) is *instantiated once and then owned* — a runnable app shell wiring auth + adapters + ui + db ("add provider keys, point auth at your domain"). You don't sync a scaffold. **yrka = the scaffold instantiated once + private `@yrka/*` packages depending on the public framework** → we are a real user of our own OSS (reference impl + best demo + clean dogfood — F16).

**The `jami` CLI provisioning flow (F15).** Interactive + agent-first (`--json`/`--yes`/idempotent): scaffolds a production-ready harness+ui+orchestra, then **provisions to the user's chosen vendors/configs/packages** through the F04 provisioning seam + F03 secrets adapter ("install, configure, provision" — the AX end-goal). Idempotent: re-running converges, never duplicates.

**The Kit (paid commercial product).** Housed under `saas`/yrka as a flagship alongside the suites (**leaning, not firm** — F16): a curated, highly-opinionated **production-ready monorepo scaffold** (marketing pages, billing + customer portal (F12), roles/permissions (F06/F07), the suites (F16)) that the `jami` CLI provisions, **plus curated orchestration skills** (F10, optional + idempotent), full docs (Mintlify), and support (F24). The OSS can do all of this with elbow grease; **the Kit sells time, comfort, support, and a known-good shape — "pay vs build."** The differentiator is **curation + assembly + support, never gating the OSS packages.**

**The open-core line (governance is the split).** **OSS = the engine + every seam + a complete single-tenant BYOK self-hostable product** (Apache-2.0, fully capable, never crippleware) — the adoption + agent-recommendation engine *and* what preserves OSS funding/credit eligibility. **Commercial = multi-tenancy at scale, hosted/managed ops, enterprise governance/compliance/federation, billing & entitlements, the yrka suites.** The **`policyCheck()` seam + default policy engine ship OSS** (governable alone); the **enterprise governance impl (Cedar/OPA bridges, compliance, federation) is commercial behind that seam** (F06). Commercial features are plugins on seams, never forks of core.

**Licensing / funding structure.** Open foundation = **Apache-2.0** (OSI-approved → grant/credit eligibility + patent grant + trademark reservation; compatible with the MIT agent-native upstream — preserve MIT notices on upstream-origin files, add our Apache-2.0 `LICENSE` + `NOTICE`). Open packages stay **100% OSI single-license** — no BSL/SSPL/FSL, no field-of-use clause, no assignment CLA. Contributions via **DCO, not a CLA**. Paid Kit + SaaS live in **separate private repos**. **AWS OSS credits exclude VC/single-vendor → DigitalOcean + GitHub are the reliable credit sources** (F20). **MakerKit = strict clean-room** (its EULA forbids building a Kit from it or training on it — reference patterns, re-implement in our own words; F12/F22).

## 4. Remaining peripheral decisions to cement

- **Framework/scaffold boundary (cemented):** framework depended-on + live-updated; scaffold instantiated-once-and-owned; yrka = scaffold + `@yrka/*`.
- **Kit pricing surface — `> needs Jamie`** (creative/scope, §4): the Kit's price + packaging numbers, and the firm decision to house it under yrka. The *mechanics* (curated scaffold + CLI provisioning + skills + support, "pay vs build") are committed; the numbers + final placement are Jamie's.
- **Final license confirmation — `> needs Jamie / IP counsel`:** Apache-2.0 + MIT→Apache notice mechanics + DCO + the MakerKit clean-room boundary, **confirmed by counsel before lock** (committed direction, counsel-to-confirm).

## 5. Dependencies & interfaces

- **F01 (repo strategy)** — depend-don't-fork, the package family, the scaffold-vs-framework split all originate from / align with F01.
- **F10 (orchestra)** — ships the curated orchestration skills the Kit bundles; the single-agent↔orchestra toggle is a Kit feature.
- **F16 (yrka)** — yrka = the reference implementation (scaffold instantiated + `@yrka/*`); the Kit is a yrka flagship.
- **F15 (AX)** — the `jami` CLI + capability manifest are the install/configure/provision surface the Kit's provisioning flow rides.
- **F06 (governance)** — the OSS/enterprise split is the governance-model split.
- **F12 (billing)** — the Kit's billing+portal piece; clean-room.
- **F20/F22 (funding/legal)** — the Apache-2.0 + DCO + clean-room structure is the funding-eligibility + IP posture.

## 6. Verification & closing criteria

- The public `jami.studio` repo publishes `@jami-studio/*`; the private `yrka` repo consumes them as semver deps; "downstream sync" is `pnpm update` — no fork, no merge.
- ~95% of a representative SaaS feature lands in `@yrka/*` only (measured); any need to patch OSS source surfaces a too-narrow seam, fixed by a better extension point.
- `npm create @jami-studio/app` scaffolds a runnable app; the `jami` CLI provisions it idempotently to chosen vendors via F04/F03.
- The OSS build is a complete single-tenant BYOK self-hostable product (real value alone, not crippleware); the enterprise governance impl plugs in behind the `policyCheck()` seam without forking core.
- Every open package ships Apache-2.0 single-license + NOTICE preserving MIT upstream notices; contributions use DCO; no CLA/field-of-use clause.
- The Kit + SaaS code live only in private repos; no MakerKit-derived code anywhere (clean-room verified).

## 7. Risks & verify-at-build (dated 2026-06-02)

- **IP counsel must confirm** the MIT→Apache-2.0 notice mechanics, the DCO choice, and the MakerKit clean-room boundary **before lock** (`> needs Jamie / IP counsel`).
- **MakerKit clean-room** is a hard EULA boundary — keep it out of all version control, never let an agent/training pipeline read the MakerKit dir.
- **Apache-2.0 single-license discipline** is a funding-eligibility gate (F20) — any field-of-use/BSL drift forfeits OSS credits; never add one.
- Kit pricing/placement is open (`> needs Jamie`) — don't hardcode numbers ahead of Jamie's call.

## 8. Sources

- canon §2 (Distribution & open-core, Commercial model & the Kit, Licensing posture) + licensing research #3, synthesis §3 (distribution/open-core/commercial), `10-product-concepts`.

## 7. Risks & verify-at-build (dated)

- IP counsel: MIT→Apache mechanics + MakerKit clean-room boundary, before lock.

## 8. Sources

- canon §2 Distribution + Commercial model, licensing research #3, `10`.

# F22 — Legal, compliance & IP

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: 0 (deep, eligibility)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (§2.2), `../../research/00-orchestration/plan.md` (§2 funding/licensing posture), licensing research #3, `07-brands-funding`
Related: F20 (eligibility dossier), F17 (entity facts in Company), F14 (open-core licensing), F12 (MoR billing offloads tax)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
Eligibility scaffolding + lean compliance, deferring heavy spend to traction. **In:** entity, OSS governance, ToS/privacy/DPA, trademark posture. **Out:** funding applications (F20).

## 2. Committed decisions (from proposal + canon)
- **Minimal admin now unlocks max funding eligibility** (committed). Entity sequenced at launch (§3 step 7); OSS needs no entity.
- **Entity TYPE + tool = OPEN, decide with a CPA at incorporation.** C-corp if any raise/sell chance (preserves the **QSBS/§1202** clock — starts at issuance; S-corp delays/forfeits it) vs S-corp/LLC pass-through (bootstrapped-forever + profitable). Tool: **Atlas** (Stripe-native, $500) vs **Clerky** (fundraising-grade cap-table). **Don't lock from forums.**
- **OSS governance set templated from the Canon** (Apache-2.0 LICENSE + README + CONTRIBUTING-DCO + Contributor-Covenant CoC + GOVERNANCE + SECURITY) → instant Vercel-OSS/GitHub-Sponsors eligibility; SPDX license-scan in CI.
- **ToS/privacy/DPA generated** (Termly/TermsFeed + free DPA), entity-correct from Canon; trademark **deferred** (defensive name-availability only). MoR billing (Paddle/LS/Polar/Stripe-Managed) offloads sales-tax/VAT (§2).

## 3. Architecture & mechanics

**Minimal admin now unlocks maximal funding eligibility.** The Stage-0 job is the **eligibility scaffolding** — so no program is blocked on paperwork — done leanly, deferring heavy legal spend to traction. OSS needs no entity; the commercial entity is sequenced at launch (canon §3 step 7).

**Entity formation (TYPE + TOOL open — decide with a CPA at incorporation, `> needs Jamie / CPA`).**
- **Type — C-corp vs S-corp/LLC, hinges on raise/sell intent.** **C-corp** if *any* chance of raising/selling: investors essentially can't buy S-corps/LLCs, and — the factor most "start S-corp then convert" advice omits — a domestic C-corp preserves the **QSBS / §1202** capital-gains exclusion, whose holding clock **starts at stock issuance** (so starting S-corp delays/forfeits it). **S-corp/LLC pass-through** is more tax-efficient *only* for a firmly bootstrapped-forever, profitable, distributing business (largely theoretical pre-revenue). **Consequential money/legal call → confirm with a startup CPA/attorney against Jamie's actual numbers + exit appetite; do not lock from forums. Mind the QSBS clock.**
- **Tool — Atlas vs Clerky (both Delaware C-corp).** **Stripe Atlas — $500 one-time** (incorporation + state filing, EIN, founder stock + **83(b)**, first-year registered agent, then $100/yr; ~$2,500 Stripe credits; Stripe-native for a Stripe-billing SaaS). **Clerky** ($427 pay-per-use / $819 lifetime) is strongest on **fundraising-grade cap-table hygiene** — the defensible swap if fundraising rigor later matters. **Open, CPA-decided.**
- **One entity behind `yrka.io`**; the OSS domains + `jnh.org` need no separate entity.

**OSS governance set (Stage-0, near-zero cost — templated from the Canon).** Each public repo ships, templated from `Company`/`Product` (F17) so entity name/contact/license are consistent everywhere: **Apache-2.0 `LICENSE`** (committed, OSI → funding-eligible, F14), **README**, **CONTRIBUTING with DCO** (lighter than a CLA, the modern OSS default), **CODE_OF_CONDUCT** (Contributor Covenant — a hard gate for the Vercel OSS Program), **GOVERNANCE**, **SECURITY.md**. → instant Vercel-OSS / GitHub-Sponsors eligibility.

**Dependency-license CI.** Standard **SPDX / license-scan** in CI keeps the dep tree Apache/MIT-compatible — no bespoke tool. (Aligns with the F14 single-OSI-license discipline.)

**ToS / privacy / DPA (generate, don't hand-write; don't pay a heavy compliance SaaS pre-traction).** **Termly / TermsFeed** generate GDPR/CCPA-ready Privacy + Terms at free/low tier; **free DPA generators** (LegalPolicyGen, Oneflow) cover controller↔processor once EU data is processed. **Entity-specific fields (legal name, jurisdiction, contact, effective date, sub-processor list) fill from `Company` + the vendor list** so regenerating after an entity/vendor change is mechanical. (iubenda moved to per-site pricing late 2025 → Termly/TermsFeed are the leaner fit.) The **MoR billing option** (Paddle/LS/Polar/Stripe-Managed, F12) **offloads sales-tax/VAT** as merchant-of-record — a deliberate lean compliance choice.

**Trademark (defer, know the gate).** Committed-deferred to traction. Stage-0 = **defensive only**: confirm name availability before committing a public brand (the brand workstream + the free-tools brand/domain lookup, F16); keep first-use-in-commerce dates in `Company` so a later USPTO filing is easy. **No filing now.**

**Eligibility dossier.** Entity status, license posture, **no-VC attestation**, founder identity — assembled from the Canon, ready for any program's gate (feeds F20).

## 4. Remaining peripheral decisions to cement
- Templated governance flow, policy generation + entity-field fill, eligibility dossier, dep-license CI — **all cemented mechanics**.
- **`> needs Jamie / CPA`:** **entity TYPE (C-corp vs S-corp/LLC)** + **TOOL (Atlas vs Clerky)** — **OPEN, decide with a CPA at incorporation** against real numbers + exit appetite (QSBS clock); and **incorporation timing** relative to launch (funding brief sequences it at step 7; the trigger is Jamie's).

## 5. Dependencies & interfaces
- **F17 (Ops Canon)** — `Company` legal facts (legal_name, jurisdiction, formation_date, contact, founder identity, first-use dates) + `Product.license` + the vendor/sub-processor list fill every template.
- **F20 (funding)** — feeds the eligibility dossier; entity + governance set unblock programs.
- **F14 (open-core)** — same Apache-2.0 + DCO + single-OSI-license + MakerKit clean-room posture; IP counsel confirms both.
- **F12 (billing)** — MoR offloads tax; `taxMode` aligns with the entity/tax posture.
- **F23 (finance)** — banking opens at incorporation; CPA at first filing.
- **F24 (community)** — the governance set is the contributor-experience foundation.

## 6. Verification & closing criteria
- The incorporation **path is decided** (type + tool, CPA-confirmed) and ready to execute when the commercial surface is live.
- **Every public OSS repo ships the full governance set** (Apache-2.0 + README + CONTRIBUTING-DCO + Contributor-Covenant CoC + GOVERNANCE + SECURITY), templated from the Canon, **on day one** → instant Vercel-OSS/GitHub-Sponsors eligibility.
- **ToS/privacy/DPA are generated, entity-correct, and live before yrka.io takes a single signup.**
- SPDX/license-scan in CI keeps the dep tree OSI-compatible.
- The eligibility dossier (entity, license, no-VC attestation, founder identity) is assembled from the Canon, ready for any gate.
- Name availability is confirmed defensively; first-use dates are recorded; no trademark filed pre-traction.

## 7. Risks & verify-at-build (dated 2026-06-02)
- **Entity/tax is consequential** — **CPA-confirm before incorporating** (the QSBS/§1202 clock starts at issuance; verify current 2025-expanded thresholds). **This is not legal/tax advice — verify with a professional.**
- **iubenda moved to per-site pricing late 2025** — Termly/TermsFeed free tiers are the leaner bootstrapped fit; revisit a paid platform only at real EU-user scale.
- **IP counsel confirms** (with F14) the MIT→Apache notice mechanics, the DCO choice, and the MakerKit clean-room boundary before lock.
- **Apache-2.0 single-license** is a funding gate — any non-OSI/field-of-use drift forfeits eligibility (F14/F20); never add one.
- **MakerKit clean-room** is a hard EULA boundary (F12/F14) — reference patterns only, never copy, never train on it.

## 8. Sources
- proposal §2.2, synthesis §3 (Brand & funding, licensing), canon §2 (funding/licensing posture), licensing research #3, `07-brands-funding`.

## 7. Risks & verify-at-build (dated, 2026-06-02)
- Entity/tax = consequential — CPA-confirm before incorporating (QSBS clock). iubenda moved to per-site pricing late 2025 (Termly/TermsFeed leaner). NOT legal/tax advice — verify with a professional.

## 8. Sources
- proposal §2.2, canon §2 funding/licensing, licensing research #3, `07-brands-funding`.

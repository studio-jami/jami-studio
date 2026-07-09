# F24 — Community & support

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: STAGED (activates Stage 2, OSS foundations)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (§2.7), `09-brand-development`, `../../research/00-orchestration/plan.md`
Related: F22 (governance set), F19 (community-led GTM), F13 (email/AgentMail)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
Two audiences, two motions: OSS contributor experience + lean SaaS support. **In:** community surfaces, support flow, contributor path. **Out:** the governance *files* (F22).

## 2. Committed decisions (from proposal)
- **OSS contributor experience:** the governance set (CONTRIBUTING-DCO, CoC, GOVERNANCE) + good-first-issues + clear `@jami-studio/*` docs on Mintlify lowers the contribution barrier — feeds community-led GTM *and* maintainer-gated funding.
- **SaaS support:** lean, **docs-first deflection** (Mintlify) + a single support channel + `@opencoredev/email-sdk` transactional/support mail; **AgentMail** inbound (§2) can later automate triage.
- Community lives where developers are (**GitHub Discussions/Issues**) under `studio-jami`. No Zendesk/Discourse pre-scale.

## 3. Architecture & mechanics
*(STAGED survey lane — solid but tighter; activates at Stage 2, OSS foundations.)*

Two audiences, two motions:
- **OSS contributor experience.** The **governance set** (CONTRIBUTING-DCO, CoC, GOVERNANCE — templated from F22) + **good-first-issues** + clear **`@jami-studio/*` package docs on Mintlify** lower the contribution barrier. This directly feeds **community-led GTM (F21)** *and* **maintainer-gated funding programs** (which reward real adoption, F20). The contributor path: read `AGENTS.md`/CONTRIBUTING → pick a good-first-issue → DCO-signed PR → the verification ladder (F03/F10) gates it.
- **SaaS support.** Lean, **docs-first deflection** (Mintlify docs answer most questions) + a **single support channel** + `@opencoredev/email-sdk` (F13) for transactional/support mail. **AgentMail** inbound (the separate-concern, F13) can **later** automate triage via Multica (F10).
- **Venue:** community lives where developers already are — **GitHub Discussions/Issues** under `studio-jami`. **No Zendesk/Discourse pre-scale.**

Community signal (stars/contributors, surfaced in `Metrics`, F17) compounds adoption *and* funding eligibility — the same loop F21 relies on.

## 4. Remaining peripheral decisions to cement
- Support channel choice + community venue specifics — set **at activation** (Stage 2); default = GitHub Discussions + a single email channel, no extra tooling.

## 5. Dependencies & interfaces
- **F22** — the governance set (the contributor-experience foundation); **F16 / Mintlify** — `@jami-studio/*` docs as deflection; **F13** — email (support/transactional) + AgentMail (later triage); **F10** — Multica automation of triage later; **F19/F21** — community-led GTM; **F20** — maintainer-gated funding; **F17** — community signal in `Metrics`.

## 6. Verification & closing criteria
*(Activation, Stage 2.)* A **frictionless first-contribution path** (governance set + good-first-issues + clear docs, DCO-signed PR through the ladder); **solo support that doesn't gate launch** (docs-first deflection + a single channel); community signal compounding adoption + funding eligibility. No Zendesk/Discourse pre-scale.

## 7. Risks & verify-at-build (dated 2026-06-02)
- Don't stand up community/support tooling ahead of contributors/users (STAGED — activates with the OSS foundations).
- **AgentMail-based triage is a *later* automation** (F13 separate concern) — not a launch dependency; keep support lean first.
- Solo support capacity is finite — lean on docs-first deflection (Mintlify) so support never gates launch.

## 8. Sources
- proposal §2.7, synthesis §3 (Brand & funding), `09-brand-development`.

# F23 — Finance & ops

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: STAGED (activates Stage 4, yrka flagship)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (§2.6), `../../research/00-orchestration/plan.md`
Related: F22 (entity), F12 (billing/Stripe), F17 (runway in Company)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
Lean banking/accounting/runway for a bootstrapped solo founder. **In:** banking, books, runway. **Out:** the billing rail (F12), entity (F22).

## 2. Committed decisions (from proposal)
- **Mercury** = business banking (locked default — no minimum, no personal guarantee, startup-focused; Brex skews VC-backed). Relay/Novo = lean alternatives.
- **Stripe** = the billing rail (committed adapter, F12/§2). Bookkeeping minimal pre-revenue; **CPA engaged only at first tax filing**. Runway = a single figure in `Company.funding_posture` (Canon).

## 3. Architecture & mechanics
*(STAGED survey lane — solid but tighter; activates at Stage 4, yrka flagship.)*

Lean banking/accounting/runway for a bootstrapped solo founder:
- **Banking = Mercury** (locked default): no minimum balance, no personal guarantee, free Stripe/integration access, US-incorporated-startup focus. **Brex skews VC-backed/$1M-revenue.** Relay/Novo = lean alternatives. **Open at incorporation** (F22).
- **Billing rail = Stripe** (the committed billing adapter, F12) — live for the first SaaS charge.
- **Bookkeeping minimal pre-revenue** (Atlas bundles partner perks; Mercury's built-in or a light tool suffices); **a CPA is engaged only at the entity's first tax filing** (the same CPA who confirms entity type, F22).
- **Runway = a single figure in `Company.funding_posture`** (F17) — bootstrapped means runway *is* the founder's own funding posture; no separate runway machinery.

The flow at activation: incorporate (F22) → open Mercury → Stripe live (F12) → clean books from day one → known runway figure in the Canon.

## 4. Remaining peripheral decisions to cement
- **`> needs Jamie`:** banking provider — **Mercury recommended** on 2026 evidence; Relay/Novo are lean alternatives. A founder preference, **not a blocker**.

## 5. Dependencies & interfaces
- **F22** — entity (banking opens at incorporation; same CPA at first filing); **F12** — Stripe billing rail; **F17** — `funding_posture` (runway) + `Metrics.mrr` once live; **F20** — clean books make application financials trivial.

## 6. Verification & closing criteria
*(Activation, Stage 4.)* Business banking opened at incorporation (Mercury); Stripe live for the first SaaS charge (F12); **clean books from day one** so the entity's tax filing and any application's financials are trivial; a known runway figure in `Company.funding_posture`. No ERP, no fractional-CFO.

## 7. Risks & verify-at-build (dated 2026-06-02)
- **Re-verify Mercury vs alternatives at account-open** (terms drift); Brex remains the wrong fit for bootstrapped/solo on 2026 evidence.
- Banking provider is a `> needs Jamie` preference — Mercury is the recommendation, not a hard lock.
- Engage the CPA at first filing only (lean pre-revenue) — but that CPA is also the entity-type confirmer (F22), so loop them in at incorporation.

## 8. Sources
- proposal §2.6, synthesis §3 (Brand & funding), canon §2.

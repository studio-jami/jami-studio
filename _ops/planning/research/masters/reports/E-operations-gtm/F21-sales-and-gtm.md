# F21 — Sales & GTM motion

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: STAGED (activates Stage 4, yrka flagship)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (§2.5), `10-product-concepts`, `../../research/00-orchestration/plan.md` (§2 open-core/Commercial model)
Related: F17 (ICP/pricing surface), F14 (open-core/Kit), F16 (products), F12 (billing)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
The go-to-market motion. **In:** ICP/personas, pricing/packaging surface, the conversion funnel. **Out:** marketing content (F19), billing plumbing (F12).

## 2. Committed decisions (from proposal + canon)
- **PLG + community-led** (Snyk/HashiCorp/GitHub pattern) = the open-core motion already in canon: **OSS foundations earn adoption → free tools + Studio create the funnel → yrka suites + the Kit convert** those who want managed/scale/support.
- **ICP + pricing/packaging surface live in `icp.yaml`** (canonical) → pricing page, deck business-model slide, sales one-pagers all render one source.
- **No outbound sales team** (solo, bootstrapped) — self-serve PLG. No CRM until there's a pipeline to manage.

## 3. Architecture & mechanics
*(STAGED survey lane — solid but tighter; activates at Stage 4, yrka flagship.)*

**PLG + community-led** (the Snyk/HashiCorp/GitHub dev-tools pattern) — which *is* the committed open-core motion (F14):
- **OSS foundations earn adoption** → **free tools + the Studio create the funnel** (F16 public surfaces are funnels) → **yrka suites + the Kit convert** those who want managed/scale/support. No outbound, no cold motion.
- **ICP + pricing/packaging surface live in `icp.yaml`** (F17, canonical) → the **pricing page, the deck's business-model slide (F20), and sales one-pagers all render one source** → no pricing drift across surfaces.
- **Community signal loop:** stars/contributors (F24) feed *both* funding eligibility (F20) and GTM credibility.
- **No outbound sales team** (solo, bootstrapped) — self-serve PLG. **No CRM until there's a pipeline to manage** (then a lean option, never Salesforce).

The conversion mechanics ride F12 billing (checkout/portal) + F07 entitlements (grant-row access); F21 owns the *motion + surface*, F12/F07 own the plumbing.

## 4. Remaining peripheral decisions to cement
- The *surface* is committed (pricing in `icp.yaml`, serves out to page/deck/one-pager).
- **`> needs Jamie` (creative/scope, §4-open):** final **pricing/packaging numbers per suite** and **suite names** (the naming sweep, F16). Do not invent numbers or names.

## 5. Dependencies & interfaces
- **F17** — `ICP`/`Product`/`Metrics`/pricing surface; **F14** — the open-core motion this lane *is*; **F16** — the products converted; **F12** — billing/checkout plumbing; **F07** — entitlement-grant access; **F20** — community signal feeds funding; **F24** — community-led the other half of the motion; **F19** — marketing feeds the top of funnel.

## 6. Verification & closing criteria
*(Activation, Stage 4, once yrka is live.)* Self-serve OSS adoption; a measurable **OSS → trial → paid** funnel; the pricing page/deck slide/one-pager all render from `icp.yaml` (one source, no drift); community signal compounding into funding + GTM. No outbound team; no CRM until there's a pipeline.

## 7. Risks & verify-at-build (dated 2026-06-02)
- **Pricing/packaging numbers + suite names are open (`> needs Jamie`)** — the surface ships, the numbers/names are Jamie's; don't hardcode ahead of the call.
- PLG + community-led is the verified 2026 dev-tools motion — re-confirm it still fits at activation (Stage 4).
- Keep the pricing surface single-sourced in `icp.yaml` so the page, deck, and one-pagers can never disagree.

## 8. Sources
- proposal §2.5, synthesis §3 (Products, open-core), `10-product-concepts`, canon §2 Commercial model.

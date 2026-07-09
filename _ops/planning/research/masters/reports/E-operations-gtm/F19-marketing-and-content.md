# F19 — Marketing & content

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: STAGED (activates Stage 1, marketing sites)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (§2.4), `09-brand-development`, `../../research/00-orchestration/plan.md`
Related: F17 (positioning from Canon), F18 (tokens), F21 (funnel)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
Content-led, developer-credibility marketing. **In:** positioning, website, SEO, social, email. **Out:** sales motion/pricing (F21).

## 2. Committed decisions (from proposal)
- **Content-led + dev-credibility, not paid acquisition.** Positioning flows from the Canon (`one_liner`/`value_props`/`ICP`). Marketing sites first (§3) — the **website is the first marketing artifact**, Canon-driven on Astro + Cloudflare Pages.
- **SEO = high-quality docs (Mintlify) + technical content** on real developer queries. **Social = build-in-public** under `studio-jami` (GitHub/X/dev.to). **Email = lean transactional + light newsletter** on `@opencoredev/email-sdk` (Resend). No HubSpot/Marketo.

## 3. Architecture & mechanics
*(STAGED survey lane — solid but tighter; activates at Stage 1, marketing sites.)*

**Content-led + dev-credibility, not paid acquisition** (the bootstrapped OSS+SaaS dev-tools motion).
- **Website = the first marketing artifact**, Canon-driven: Astro Content Layer reads F17 (`Product.description`/`value_props`, `Company.one_liner`, `Metrics`, `BrandTokens` from F18) → renders hero/stat/feature blocks; deploys on **CF Pages** (F04). The site has no facts of its own, so it can't go stale (F17).
- **SEO = high-quality docs (Mintlify) + technical content** ranking on real developer queries — the docs *are* the SEO surface; `llms.txt`/`llms-full.txt` (F15) also make the content agent-legible. The `searchfit-seo` skill family is available for a structured pass at activation.
- **Social = build-in-public** under `studio-jami` (GitHub/X/dev.to); a modest cadence of founder-in-public posts, not a content factory.
- **Email = lean transactional + light newsletter** on `@opencoredev/email-sdk` → Resend (F13). **No HubSpot/Marketo**, no marketing-automation SaaS.

Positioning flows from the Canon (`one_liner`/`value_props`/`ICP`) — one source feeds the site, deck (F20), and one-pagers (F21).

## 4. Remaining peripheral decisions to cement
- Content cadence + active channels — set **at activation** (Stage 1), not pre-built (zero-bloat).
- The structured SEO pass (the `searchfit-seo` skills) — run when the docs/content surface is real.

## 5. Dependencies & interfaces
- **F17** — `Product`/`ICP`/`Metrics`/positioning; **F18** — BrandTokens; **F04** — site on CF Pages; **F13** — email (Resend); **F15** — `llms.txt`/docs as agent-legible SEO; **F21** — the funnel marketing feeds; **F16** — the products being marketed; **F24** — community-led GTM overlaps the social motion.

## 6. Verification & closing criteria
*(Activation, Stage 1.)* Site live and Canon-driven on CF Pages; docs ranking on real dev queries; a modest build-in-public cadence under `studio-jami`; an announce list on the email adapter. **Measured by qualified traffic → OSS adoption → SaaS trials, not vanity reach.** No marketing-automation SaaS in the stack.

## 7. Risks & verify-at-build (dated 2026-06-02)
- Don't over-build content machinery ahead of a live surface (STAGED — activates with the marketing sites).
- Astro Content Layer (Astro 5.x GA) + CF Pages versions — verify at build (shared with F17).
- Keep email strictly behind the F13 port so the provider (Resend) is swappable.

## 8. Sources
- proposal §2.4, synthesis §3 (Brand & funding), `09-brand-development`.

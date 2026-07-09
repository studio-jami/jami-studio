# Brands, Lanes & Funding — Decision Brief

Date: 2026-06-01
Status: Committed direction (per Operating Canon §2, §4)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Scope: Commit the three-lane / three-org brand map, the funding approach, and the entity/account scaffolding stage. State the funding programs that fit each lane, verified against official 2026 sources.

---

## Executive Summary

**Three org-lanes = `oss` / `saas` / `personal`, already committed (canon §2); brand surfaces are per domain.** No candidate menu, no folding across lanes:

- **`oss` — the open-source lane.** Domains: **`jami.studio`** owns the foundations (`@jami-studio/harness`, `@jami-studio/ui`, `@jami-studio/orchestra`) + a BYOK showcase; **`intercal`** (≈intercal.dev) the delta knowledge graph; **`collective`** the open agent society. **Intercal and the Collective are their own domains that consume the foundations — not foundations inside jami.studio.** Competes on credibility/mind-share. Unlocks no-equity OSS funding (Vercel OSS Program, GitHub Sponsors / Secure OSS Fund, Cloudflare AI-exempt tier) and, once a repo earns adoption, maintainer-gated AI credit programs.
- **`saas` — the commercial lane.** Domain **`yrka`** owns `business-suite`, `media-suite`, `research-suite`, the `free-tools` cluster (benefit finder, brand-name + domain lookup, leads + competitor tracker, daily briefs), and BoardRune — one product monorepo, a unified ala-carte interface. This lane is the target for the cloud/AI credit stacks (AWS Activate, Google for Startups, Azure Founders Hub, Anthropic, Neon, Supabase, NVIDIA Inception) and any accelerator track.
- **`personal` — the personal lane.** Domain **`jnh.org`** (`.com` folds into `.org`) owns `website`. Founder brand and portfolio. The credibility surface that underwrites every funding application. Qualifies for creator/partner programs, not startup credits.

**Funding approach (committed):** build live evidence first, then apply only to programs that genuinely fit each lane. The first work is not "build the products" — it is the brand/marketing-site launch that begins branding and seeds funding applications (canon §3 product-launch order, step 1: "marketing sites → begin branding → funding apps"). Live, demonstrable surfaces are stronger evidence than a deck for a solo operator.

**Entity + account scaffolding is a setup stage, not an open question (canon §3 step 7, §2 "Entity/accounts").** One incorporated commercial entity behind `yrka.io` is the key that unlocks the company-gated credit programs; the personal `.org` and the OSS `jami.studio` repos do not need separate entities. Per-org isolated accounts (Stripe, hosts, db, GitHub, social) are provisioned during the setup stage under the correct lane identity from day one.

**Verified 2026-06-01** (drift-prone; re-verify at application time): the highest-leverage bootstrapped-reachable stacks are **Azure Founders Hub** (staged Ideate $1k → Develop $5k → Grow $25k → Scale $120k–$150k, no VC, software-product gate), **Anthropic Startup Program** (up to $25k direct, no VC), **Neon** (up to $100k), **AWS Activate Founders** ($1k self-funded → $100k once accelerator/VC-backed), **Google for Startups** ($2k Start tier → $200k–$350k via accelerator/AI track), **Cloudflare** (BOOTSTRAPPED promo + $5k–$250k, AI startups exempt from the accelerator requirement), and **Vercel OSS Program** ($3,600 + partner starter pack, OSS only). One Delaware C-corp behind `yrka.io` (Stripe Atlas is the de facto tool) unlocks the high tiers.

---

## Why this shape (first principles)

- **Lanes are already decided; this brief commits, it does not deliberate.** Canon §2 fixes the three org-lanes (`oss`/`saas`/`personal`) and the rule that **Intercal and the Collective are their own `oss` domains that consume the foundations** — not foundations inside jami.studio, and never commercial satellites folded under `yrka`. The prior report's "fold Intercal/Collective under yrka.io" framing and its criss-crossed Studio naming are corrected here.
- **Greenfield.** We rebuild fresh on official/industry-leading tooling. Prior projects (the legacy `yrka` monorepo, `jamesnavinhill-org`, `etymara`) are input to thinking only — never code source, never "lift forward," never "publish what exists." There is no first-wave "publish/polish what's on disk" step; there is a first-wave **build the production shape** of each marketing surface and free tool.
- **One entity, brand surfaces per domain** is the standard bootstrapped structure: a C-corp owns the commercial lane (`yrka`); the OSS domains (`jami.studio`, `intercal`, `collective`) are its open face under permissive licenses; the personal brand (`jnh.org`) stays the founder's individual identity. Multiple brand surfaces, one legal entity — not many entities. (Whether Intercal's metered hosted instance bills under the same entity is a setup-stage detail, not a brand decision.)
- **Credit-stacking is viable because the architecture is provider-agnostic by mandate (canon §1).** Workloads sit behind thin host/db/storage/LLM adapters, so credits from AWS + Google + Azure + Anthropic + Neon + Cloudflare can coexist and workloads move to whichever credits are live. Apply to all that fit; spread the load.
- **OSS funding is reputation-first.** Credits and grants follow stars, downloads, and demonstrated adoption — so the maintainer-gated programs are a post-adoption wave, sequenced after the foundations earn real usage, never applied prematurely.

---

## Lane / project / domain map (committed)

Aligned exactly to the canon §2 `dev/<org>/<domain>/projects/` scaffold. No "stands alone vs folds" column — ownership is fixed by domain.

| Project | Org / lane | Surface |
|---|---|---|
| `@jami-studio/harness` | `jami.studio` (OSS) | Public repo + Studio showcase |
| `@jami-studio/ui` (UI Registry) | `jami.studio` (OSS) | Public repo + Studio showcase |
| `@jami-studio/orchestra` | `jami.studio` (OSS) | Public repo + Studio showcase |
| `agent-collective` | `jami.studio` (OSS) | Public repo; community surface on the Studio |
| `agent-delta` (Intercal) | `jami.studio` (OSS) | Public repo; delta knowledge graph foundation |
| `business-suite` | `yrka.io` (commercial) | Suite within the unified yrka.io interface |
| `media-suite` | `yrka.io` (commercial) | Suite within the unified yrka.io interface |
| `research-suite` | `yrka.io` (commercial) | Suite within the unified yrka.io interface |
| `free-tools` (benefit finder, brand-name + domain lookup, leads + competitor tracker, daily briefs) | `yrka.io` (commercial) | Public free surfaces / funnels under yrka.io |
| BoardRune | `yrka.io` (commercial) | Product under yrka.io |
| `website` | `jnh.org` (personal) | Founder brand + portfolio |

Note: the free-tools' open primitives may be published openly from `jami.studio` where that earns OSS goodwill while the polished hosted tool stays commercial under `yrka.io`. That open/hosted split is an implementation detail of the foundations, not a lane reassignment — the foundations live on `jami.studio` and the products live on `yrka.io` by canon.

---

## Funding programs by lane (verified 2026-06-01)

All amounts/terms are drift-prone; each verified today against the cited source. Credit ceilings are advertised maximums; the bootstrapped-reachable tier is what matters.

### Commercial lane — `yrka.io` — cloud / AI / infra credits

| Program | Bootstrapped-reachable | Max (with VC/accel) | Key gate |
|---|---|---|---|
| **AWS Activate** | Founders: **$1,000** credits (valid 2 years) + $350 support (1yr); self-funded, no Org ID, no prior Activate | $100,000 (Portfolio — needs an Activate Provider Org ID via VC/accel/incubator) | Founded ≤10y, pre-Series B, paid-tier AWS account, company site |
| **Google for Startups Cloud** | **$2,000** Start tier (bootstrapped, <5y, working website, no prior enrollment) | $200k–$350k (accelerator network / AI track) | Incorporation date <5y; one-time benefit |
| **Microsoft for Startups Founders Hub** | Staged, no VC needed: **Ideate $1k** → **Develop $5k** (after business verification) → **Grow $25k** (traction) → **Scale $120k–$150k** | $150,000 | Must be a **software product** (not agency/consulting); privately held; pre-Series C. **Azure credits expire 12 months after issuance, no extension** — unlock a tier only when a workload exists to spend it |
| **Cloudflare Startup Program** | BOOTSTRAPPED promo for sub-$50k-raised; tiers **$5k / $25k / $100k / $250k** | $250,000 | <$3M raised; accelerator enrollment/grad — **AI startups exempt** from the accelerator requirement |
| **Neon Startup Program** | up to **$100,000** credits over 12 months; YC match guarantee | $100,000 | Early-stage; building on Neon |
| **Supabase** | ~**$2,500** startup/OSS credits (varies by partner/period); $300 via Mercury Perks | varies | Early team |
| **Anthropic Startup Program** | **up to $25k direct, no VC** (rolling ~2-week Airtable application; needs a Claude Console account + company email + usage signal). Most direct applicants land $1k–$5k; $25k is the direct ceiling | $100,000+ (via partner-VC network) | Direct track open to most legitimate startups building on Claude |
| **OpenAI startup program** | Direct $2,500 via VC-partner referral; non-VC routes: **Founder Stack via Ramp $5k** (Ramp card customers), **OpenAI Grove $50k** (selected SF cohort) | $50,000 (Grove) | VC referral for the $2.5k; Ramp card or Grove cohort for the others |
| **NVIDIA Inception** | **Free**, no equity, no cohort/deadline; solo founders eligible | (GPU/partner value, not cash credits) | Any stage; AI focus |
| **Stripe Atlas** | $500 one-time (Delaware C-corp/LLC, EIN, registered agent yr1, Cooley templates, 83(b) filing), then **$100/yr** agent renewal; bundles **$2,500 Stripe credits + $50k+ partner perks** (Mercury, AWS, etc.) | Delaware franchise tax (~$300+/yr) + bookkeeping/CPA are separate | The incorporation tool that unlocks the company-gated programs above |

### OSS lane — `jami.studio` — no-equity funding

| Program | Benefit | Key gate |
|---|---|---|
| **Vercel Open Source Program** | **$3,600** Vercel credits / 12mo ($300/mo) + up to **~$30k** partner "OSS Starter Pack" + Slack support | OSS project hosted on Vercel, Code of Conduct, measurable impact; credits for OSS only. Spring 2026 cohort open; cohort-based |
| **Claude for Open Source** | Claude Max 20x free for 6 months (~$1,200 value) — a productivity benefit, not API credits | Primary maintainer of a public repo with **5,000+ GitHub stars or 1M+ monthly NPM downloads** + recent activity; 10,000 spots; **applications close 2026-06-30**; documented critical-infrastructure exception clause for quietly-depended-on projects. Reputation-gated, post-adoption |
| **OpenAI Codex Open Source Fund** | up to **$25,000** OpenAI API credits | Active maintainer of a meaningful OSS dev-tool/framework/library; direct application; reviewed for maintainer authenticity. Reputation-gated, post-adoption |
| **GitHub Sponsors** | Recurring/one-time sponsorship to the maintainer | Reside in supported region; sustaining profile (Matching Fund closed since 2020) |
| **GitHub Secure OSS Fund** | Investment in critical OSS security | Project security relevance; cohort applications |
| **Cloudflare** | Same OSS-friendly tiers as the commercial table (AI exemption helps) | (see commercial table) |
| **Supabase OSS** | OSS sponsorship + credits | OSS project |
| **Sovereign Tech Fund / NLnet / Mozilla MOSS / Linux Foundation** | Grants for critical/infrastructure OSS | Base/infrastructure tech with ecosystem impact — high bar; harness could qualify only after adoption |
| **Open Collective** | Fiscal host + community donations | Set up a collective |

The maintainer-gated AI programs (Claude for Open Source, OpenAI Codex OSS Fund) attach to the **person who maintains the repo**, not an entity. They reward adoption of harness / ui rather than incorporation. The qualifying maintainer identity is the founder's — so the GitHub maintainer account that earns these must be provisioned under the OSS-lane identity from day one (coordinate with the brand-development workstream).

### Personal lane — `jnh.org` — creator / partner

No startup-credit program targets a personal brand. The realistic fits are **creator/partner programs** (platform partner tiers, dev-relations/ambassador programs tied to the vendors above, GitHub Stars, speaking/writing). The personal site's primary funding role is **credibility backing**: a real founder with a real portfolio converts applications. Treat this lane as trust capital, not a direct funding source.

---

## Entity & account scaffolding (setup stage — canon §3 step 7)

This is a setup task with a committed shape, not a decision to deliberate.

1. **Incorporate `yrka.io` as a Delaware C-corp via Stripe Atlas.** Single highest-leverage action: it gates the majority of the commercial credit value, bundles $2,500 Stripe credits + partner perks, and provides clean legal/financial separation. One entity; three brand surfaces (commercial C-corp, its OSS face, the founder's personal brand).
2. **Provision per-org isolated accounts** (Stripe, hosts, db, GitHub org, social) scoped per org+project, under the correct lane identity from the start. LinkedIn posting (Community Management API) requires a registered legal entity — which lands on the commercial lane where incorporation already happens.
3. **Route all vendor tokens** (cloud-credit consoles, Stripe, GitHub) through the per-org secrets topology from the start (see the secrets workstream).
4. **Funding-program sequence**, applied only after the relevant lane surface is live: Azure Founders Hub (Ideate/Develop, grow into Grow/Scale against real workload), Anthropic Startup Program (direct, up to $25k), Neon, Google for Startups Start, AWS Activate Founders, Cloudflare (BOOTSTRAPPED), NVIDIA Inception, Vercel OSS, GitHub Sponsors. Hold accelerator-gated top tiers unless an AI accelerator track is joined.

---

## Order-of-work alignment

This brief sits at canon §3 step 7 (connect/configure accounts + scaffold scoped configs/docs per org+project) and feeds the product-launch order:

- **Marketing sites → begin branding → funding apps** (launch step 1): stand up the production-shape marketing surfaces for `yrka.io`, `jami.studio`, and `jnh.org`, on the chosen agent-friendly host stack, with Mintlify docs for the OSS repos (canon: don't force Notion/Google). Branding begins; funding applications begin once each lane's surface is live.
- **Foundations via the OSS repo+domain** (launch step 2): publish `@jami-studio/harness`, `@jami-studio/ui`, `@jami-studio/orchestra` with real docs/licenses/Code of Conduct → immediately eligible for Vercel OSS Program and GitHub Sponsors.
- **Free tools** (`free-tools`: benefit finder, brand-name + domain lookup, leads + competitor tracker, daily briefs) ship as live, demonstrable funnels under `yrka.io` — the strongest funding-application evidence. (Drift-correct: brand/domain availability builds on an **RDAP-first** engine — RDAP replaced WHOIS as the ICANN standard in Jan 2025, with WHOIS fallback only for ccTLD stragglers like `.io`. The benefit finder browser extension targets **Manifest V3** — Chrome removed Manifest V2 entirely in 2025, so MV3 is the only path and carries no migration debt.)
- **Release Intercal (`agent-delta`) → release BoardRune → launch the Collective (`agent-collective`)** → further applications/funding, per the canon launch order.

The benefit finder is also a dogfooding asset: it can track and surface the very programs in this brief.

---

## Risks & constraints

- **Program terms drift fast.** Every figure verified 2026-06-01; ceilings/tiers change quarterly. Re-verify at application time.
- **One-time benefits and credit-expiry clocks.** Google for Startups and others are one-shot per entity — do not burn them before the surface exists. Azure Founders Hub credits expire 12 months from issuance with no extension (most cloud credits run a similar 12–24mo clock). Apply, then unlock/spend against real usage.
- **Software-product gate (Azure).** Founders Hub excludes service/agency-first entities — `yrka.io` is framed as a software product, which it is.
- **Accelerator gating for top tiers.** AWS $100k, Google $200k+, Cloudflare top tiers need accelerator/VC affiliation. The Cloudflare AI exemption and Google AI accelerator track are the realistic non-VC paths.
- **OSS grant bar.** Sovereign Tech/NLnet fund critical infrastructure — the foundations qualify only after demonstrated adoption. Applying prematurely burns goodwill and, for capped programs (Claude for OSS's 10,000 spots, closing 2026-06-30), wastes a review. Claude for OSS's window will almost certainly lapse before a new repo crosses the threshold — do not treat it as a reachable first target.
- **Could not verify here:** live incorporation status and the live social/account inventory (owned by the brand-development workstream). This brief commits the structure; provisioning state is confirmed during the setup stage.

---

## Open (creative / scope)

Per canon §4, only genuinely creative/scope items stay open — and these do not change the funding analysis:

- **Final product/brand names** across the suites and foundations are placeholders, assessed properly against strategy when branding begins. (Canon §4.)
- **Auth topology** across products/suites — the default is a single agnostic identity/entitlement plane the unified `yrka.io` interface composes; exact shape is open. It affects entitlement plumbing, not which lane owns which project. (Canon §4.)

Everything else here is committed.

---

## Sources (official, verified 2026-06-01)

- AWS Activate — https://aws.amazon.com/startups/credits/ ; https://aws.amazon.com/startups/lp/aws-activate-credits
- Google for Startups Cloud — https://cloud.google.com/startup/benefits ; https://cloud.google.com/startup/apply
- Microsoft for Startups Founders Hub — https://www.microsoft.com/en-us/startups ; https://learn.microsoft.com/en-us/microsoft-for-startups/benefits
- Cloudflare Startup Program — https://www.cloudflare.com/startups/ ; https://blog.cloudflare.com/startup-program-250k-credits/
- Vercel Open Source Program — https://vercel.com/open-source-program ; https://community.vercel.com/t/open-source-program-applications-open-for-spring-2026/42278
- GitHub Sponsors — https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors ; GitHub Secure OSS Fund — https://github.com/open-source/github-secure-open-source-fund
- Supabase OSS/startups — https://supabase.com/open-source ; https://supabase.com/pricing
- Neon Startup Program — https://neon.com/startups ; https://neon.com/blog/startup-program
- Stripe Atlas — https://stripe.com/atlas ; https://docs.stripe.com/atlas
- Anthropic Startup Program — https://www.anthropic.com/startup-program-official-terms
- NVIDIA Inception — https://www.nvidia.com/en-us/startups/
- Sovereign Tech Fund — https://www.sovereign.tech/programs/fund ; NLnet / Open Collective — https://opencollective.com/
- Claude for Open Source — https://www.anthropic.com (program announcement, 2026-02-27)
- OpenAI Codex Open Source Fund — https://openai.com/index/openai-codex/
- ICANN RDAP — https://www.icann.org/rdap ; Chrome Manifest V3 — https://developer.chrome.com/docs/extensions/develop/migrate

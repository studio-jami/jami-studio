# The Operations Canon & Supporting Lanes — Research + Proposal

Date: 2026-06-02
Status: Proposal (builds on Operating Canon §0–§5; commits the supporting/business layer's *shape*, flags founder calls as "needs Jamie").
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Scope: A single OWNED, version-controlled source of truth for durable **business** facts/assets/configs, from which every supporting artifact (deck, application answer-bank, site copy, about/stats pages, legal boilerplate, one-pagers, bios) is **generated or parity-checked** — never hand-maintained in parallel. Plus the per-lane supporting strategy, target outcomes, lean stacks, and a staging map on the product-launch clock. Drift-prone facts verified against official 2026 sources (dated, cited at end).

---

## Executive Summary

**The supporting/business layer gets the same treatment as the dev system: one canonical, version-controlled source of truth, agnostic projection, and nothing hand-maintained twice.** The Operating Canon already mandates this for the dev side ("never hardcode transient", "one canonical source", "supporting components stay production-ready, in parallel — never scrambled when a call needs them", §1). This proposal applies that mandate to the *business* facts. The centerpiece is the **Operations Canon**: a small directory of typed, structured data files (company profile, per-product profiles, traction metrics, brand tokens, funding pipeline, ICP/pricing surface) that lives next to the brand docs, validated by a schema, and **projected** by a thin generator/parity layer into every supporting artifact. Change a number once; the deck, the website stat block, the funding answer-bank, and the about page all reflect it on the next build. No separate copies to chase.

**It is deliberately lean — not a martech stack.** The whole thing rides tooling the canon already commits or that is free/official: **structured files** (YAML/JSON/Markdown-with-frontmatter) as the source; **Astro Content Layer with Zod schemas** (verified GA, Astro 5.x, June 2026) as the typed projection into web surfaces; **Keystatic** (git-based, zero-infra) as the optional human-friendly editor over the *same* files; **Marp CLI** (verified v4.3.x, PPTX/PDF/HTML from Markdown, CI-friendly) as the deck-from-data generator; **Mintlify** (already canon) for docs. Secrets stay in the committed per-domain secrets adapter (`04-secrets`) — the Ops Canon holds **durable public/business facts and pointers, never a credential**. This is the §1 no-bleed rule applied to the business layer.

**Stage-0 (now, ~1 month out) goes deep on three lanes — Funding/pitch, Legal-eligibility, Brand-basics — because they gate everything and the canon's "be ready *before* the moment" rule (§1, the GCP-call lesson) demands they exist before they're needed.** The committed funding analysis (`07-brands-funding`) already fixes the programs and the entity shape; this proposal adds the *artifact machinery* that keeps a current deck, a current answer-bank, and a current eligibility dossier permanently warm. Marketing, Sales, Finance, and Community get a lighter survey and activate later on the launch clock.

**Staging follows the committed product-launch order** (marketing sites → OSS foundations/contracts → Studio → yrka flagship → free tools → funding → releases). The Ops Canon stands up first (it has no dependencies and feeds everything); each lane's artifacts switch on when their surface goes live, so the supporting layer fills in on the project's clock, not all at once.

---

## Part 1 — The Operations Canon (the centerpiece)

### 1.1 First principle

There is exactly **one home for each durable business fact**, and every supporting artifact is a **projection** of that home — never an independently-edited copy. This is the dev system's "single-concern-per-layer + project transients never flow up" rule (canon §2, `08-canonical-system`) ported to business facts. The failure mode it kills: the founder's headcount, MRR, star count, tagline, or funding-stage claim drifting out of sync across a deck, a website, three application forms, and a LinkedIn bio — then being "scrambled together" the night before a call. The canon explicitly forbids that scramble (§1).

The Ops Canon is **owned and hackable** (plain files in the repo, no SaaS lock-in), **agnostic** (the data shape is independent of any one renderer), and **lean** (no fact modelled that no artifact consumes — zero-bloat, §0).

### 1.2 Where it lives

It is **domain-layer data**, not system canon — it knows "Jamie," names vendors and products, and carries brand. Per the committed layer model (§2), that places it under the domain's `docs/` tree:

```
dev/<org>/<domain>/docs/
  brand/            # existing committed brand workstream (09-brand-development)
  research/
  roadmaps/
  ops-canon/        # NEW — the durable business source of truth
    company.yaml          # the legal/founder/entity profile (one per org-lane that incorporates)
    products/
      jami-studio.yaml    # per-product profile (OSS foundations platform)
      yrka.yaml           # per-product profile (commercial SaaS)
      ...                 # one per product/suite as it gains a public surface
    metrics.yaml          # traction: stars, downloads, users, MRR, uptime — pointers to live feeds where possible
    pipeline.yaml         # funding/grant program pipeline (status per program from 07-brands-funding)
    answer-bank.yaml      # canonical answers to recurring application/interview questions
    brand-tokens.json     # logo paths, color tokens, typography, handles (mirror of brand workstream)
    icp.yaml              # ICP + positioning + pricing/packaging surface (per product)
    _schema/              # Zod (or JSON-Schema) definitions for every file above
```

Rationale for placement: the Ops Canon is per-domain because a domain *is* the brand + identity + deploy boundary (§2). `jami.studio`, `yrka.io`, and `jnh.org` each get their own `ops-canon/` — the OSS platform's "company" facts differ from the commercial entity's, and `jnh.org` is a personal brand, not a company. The **commercial entity facts** (Delaware C-corp behind `yrka.io`, EIN, registered agent, formation date) live in `yrka`'s `company.yaml`; the OSS lane's `company.yaml` is a lighter "project/maintainer profile." Shared facts (founder name, founder bio, contact) that legitimately appear in more than one are defined once at the **org-lane** level and referenced — the same precedence rule the dev system uses (higher layer defines, lower layer references, never re-keys).

> **needs Jamie:** whether the three domains' Ops Canons share a small org-lane-level `founder.yaml` (DRY founder facts) or each keep a full copy. Default lean: a single org-lane `founder.yaml` referenced down. This is a structural taste call, not a fact.

### 1.3 The data model (entities + fields)

Six durable entities. Fields are the minimum each consuming artifact actually reads (zero-bloat — add a field only when an artifact needs it).

**`Company` (`company.yaml`)** — the legal/founder/entity profile.
| Field | Example / note |
|---|---|
| `legal_name`, `trading_name` | "Yrka, Inc." / "yrka.io" |
| `entity_type`, `jurisdiction`, `formation_date`, `ein` | Delaware C-corp; EIN is **public-safe** (not a secret), but flag per comfort |
| `founder.name`, `founder.bio_short`, `founder.bio_long`, `founder.location`, `founder.links` | one canonical bio, three lengths (50/150/500 chars) so every surface pulls the right size |
| `mission`, `one_liner`, `elevator_pitch` | the canonical positioning strings |
| `stage`, `funding_posture` | "bootstrapped, pre-revenue, ~1mo to launch" — the line every application asks for |
| `contact.email`, `contact.support`, `contact.legal` | role addresses, not personal |
| `social_handles` | `studio-jami` (GitHub/social, committed §2), etc. — single source for every bio |

**`Product` (`products/*.yaml`)** — per-product profile.
| Field | Note |
|---|---|
| `name`, `tagline`, `category`, `url`, `repo` | |
| `description.short`, `description.long` | reused in deck, site hero, app-store-style listings |
| `value_props[]`, `features[]`, `differentiators[]` | the "underlying magic" + feature lists |
| `audience`, `use_cases[]` | |
| `license`, `pricing_model` | Apache-2.0 (OSS) / suite pricing (commercial) |
| `status` | pre-launch / live / beta — drives what the site renders |

**`Metrics` (`metrics.yaml`)** — traction.
| Field | Note |
|---|---|
| `github.stars`, `github.contributors`, `npm.downloads_monthly` | **pointer-preferred**: store the *source endpoint*, let the build fetch live (canon §1 "use a live-sync API feed, never hardcode transient"). Cache a snapshot for offline deck builds. |
| `product.users`, `product.mrr`, `product.uptime` | from the product's own analytics/billing once live |
| `as_of` | every metric carries its own freshness date |

**`Pipeline` (`pipeline.yaml`)** — funding/grant program tracker. One record per program from `07-brands-funding`, with `program`, `lane`, `bootstrapped_tier`, `gate`, `status` (not-yet / eligible / applied / awarded / lapsed), `applied_date`, `outcome`, `source_url`, `verified_date`. This is the living version of the funding brief's tables — it *is* the pipeline, and the answer-bank draws from it.

**`AnswerBank` (`answer-bank.yaml`)** — canonical reusable answers. Keyed question → canonical answer, each composed from `Company`/`Product`/`Metrics` references where possible so it never drifts: "What does your company do?", "What's your traction?", "Why bootstrapped?", "What's your moat?", "Team?", "Use of funds?". Most applications are 80% these questions; the bank answers them once, well.

**`BrandTokens` (`brand-tokens.json`)** + **`ICP` (`icp.yaml`)** — brand tokens mirror the committed brand workstream (`09-brand-development`): logo asset paths, color tokens, type scale, handles. ICP holds positioning, ideal-customer profile, and the **pricing/packaging surface** per product. Both are thin and reference-friendly.

### 1.4 The generator / projection layer

One source, many projections. Each projection is an **official/OSS tool driven by the same files** — no bespoke renderer where a solved tool exists (§1).

| Surface | Projection tool (verified 2026) | How it draws from the Canon |
|---|---|---|
| **Website copy / about / stats pages** | **Astro Content Layer** + Zod schema (Astro 5.x GA; `glob()`/`file()` loaders read local YAML/JSON/MD with TS type-safety + Zod validation) | The site imports the Ops Canon files as typed collections; hero text, stat blocks, feature lists, founder bio render from `Product`/`Metrics`/`Company`. The website *cannot* state a stale number — it has none of its own. |
| **Pitch deck (PPTX/PDF)** | **Marp CLI** (v4.3.x; Markdown → PPTX/PDF/HTML, standalone binary, runs in CI) | A `deck.md` template uses Canon values; `marp deck.md -o deck.pptx` in a workflow regenerates the editable deck on every fact change. The Kawasaki 10-slide shape (below) is the template. |
| **Funding application answer-bank** | a tiny generator (render `answer-bank.yaml` → Markdown/clipboard sheet) | Application forms get pasted from a generated, always-current answer sheet; no free-typing facts into a form. |
| **Legal boilerplate** | template fill from `Company` (jurisdiction, legal_name, contact, effective_date) | ToS/privacy/DPA placeholders fill from the Canon so the entity name/jurisdiction is right everywhere (the *body* comes from a generator, §2.5). |
| **Docs / OSS READMEs** | **Mintlify** (already canon) + README templates | Project metadata (license, install, links) reference the `Product` record. |
| **Social bios / one-pagers** | render `Company.social_handles` + `description.short` + `one_liner` | Every bio (GitHub org, X, LinkedIn, npm) generated from one string set — no per-platform drift. |

The projection layer is the only code we author here, and it is thin-bridge by design (§1 "tiny thin-bridge skills"): read files, validate against schema, hand to the official renderer. If a renderer already ingests the shape (Astro, Marp, Mintlify all do), we ship nothing of our own for it.

> **needs Jamie:** deck **design/visual identity** is a creative call (template look, not the data). Marp themes are CSS; the brand workstream owns the theme. The *content shape* is committed here.

### 1.5 Parity / drift tooling

Three mechanical guards, all CI-cheap (mirrors the dev system's "fixed, machine-checkable contracts", §2):

1. **Schema validation (fail-closed).** Every Canon file validates against its `_schema/` definition on commit (a hook + CI step). A missing required field, a malformed metric, a bad date → build fails before it reaches a surface. This is the dev system's in-session-gates-first rule applied to business data.
2. **Freshness check.** Every metric and verified fact carries an `as_of` / `verified_date`. A linter flags any fact older than a threshold (e.g. funding terms >90 days, metrics >30 days) — the canon's "latest official sources, re-verify at application time" rule (§1, `07-brands-funding`) made enforceable. The benefit-finder free tool can later dogfood this by tracking program terms (already noted in `07-brands-funding`).
3. **No-secret guard.** A doc-hygiene rule (the same family as the dev system's "reject any secret/credential string in canon files") rejects anything that looks like a key/token in the Ops Canon — secrets belong only in the `04-secrets` adapter. The Ops Canon is public-business-facts-only by construction, so it can be safely referenced by public artifacts without leak risk (§1 no-bleed).

Because every artifact is *generated*, "parity" is mostly structural: a regenerated artifact cannot disagree with the source. The drift tooling guards the **source's** integrity and freshness, not N hand-kept copies.

### 1.6 Serve-out (how it reaches live surfaces)

- **Build-time projection (default).** Marketing sites (Astro on the committed Cloudflare Pages stack) and the deck render the Canon at build; a fact change → rebuild → live. This suits the canon's static-first hosting verdict (§2 hosting: jami.studio = Astro static on CF Pages).
- **Live-feed pull for volatile metrics.** Star/download/MRR fields store a *source endpoint*; the build fetches the live value (with a cached fallback for offline deck builds). This honours "never hardcode transient — use a live-sync API feed" (§1) for exactly the facts that move.
- **Optional human editing via Keystatic.** Keystatic (git-based, zero-infra, reads/writes the *same* files) gives a GUI over the Canon without a database or a second source — useful if Jamie wants to edit a profile without touching YAML. It commits back to git, so the source stays canonical. Strictly optional; the files are the truth either way.
- **No headless-CMS server, no Notion-as-source.** The canon says don't force Notion/Google (§2 Docs); a git-files-as-source + Keystatic-as-optional-editor keeps it owned, lean, and diff-able. Notion can *consume* a projection if ever wanted, never be the source.

---

## Part 2 — Supporting Lanes (strategy · outcomes · lean stack · Canon dependencies)

Stage-0 (now) lanes go deep; later-stage lanes are surveyed. Funding posture, programs, and entity shape are **already committed** in `07-brands-funding` — referenced, not re-decided.

### 2.1 Funding / grants & the pitch — DEEP (Stage-0)

**Strategy.** The committed approach (`07-brands-funding`) is *build live evidence first, then apply only to programs that fit each lane*. The supporting machinery that makes this real is: a **permanently-warm pitch artifact set** (deck + elevator pitch + one-pager) generated from the Ops Canon, and a **live program pipeline + answer-bank** so any application is a paste-and-tailor job, never a scramble (the §1 GCP-call lesson). For a bootstrapped solo founder, **a live, demonstrable surface beats a deck** — so the deck leads with traction/product, and the pipeline sequences applications *after* each lane's surface is live.

**The standard pitch shape (verified 2026 — stable).** Guy Kawasaki's 10/20/30 remains the current default (10 slides, 20 min, 30pt min): **Title → Problem/Opportunity → Value Proposition → Underlying Magic → Business Model → Go-to-Market → Competition → Team → Projections/Milestones → The Ask.** This is the `deck.md` Marp template's structure; each slide pulls from the Canon (`Problem`/`Solution` from `Product`, `Traction` from `Metrics`, `Team`/`Ask` from `Company`). The **elevator pitch** = `Company.elevator_pitch` (one canonical string, three lengths). Adapt content emphasis for a *credits/grants* application vs an *equity* pitch — bootstrapped credit programs care about product + eligibility, not equity story; the answer-bank holds both framings.

**Target outcomes (Stage-0).** (1) A regenerable, current deck + one-pager + elevator pitch exist on day one of launch. (2) `pipeline.yaml` reflects every program in `07-brands-funding` with live status. (3) An answer-bank covers the recurring application questions, composed from Canon facts so it can't drift. (4) **Eligibility dossier ready** before any application opens (see Legal lane). Concretely: when a program window opens (e.g. the next Vercel OSS cohort, an Anthropic Startup application), the response is "regenerate + tailor + submit," measured in hours not days.

**Lean stack.** Marp CLI (deck), the Ops Canon (facts), git (versioning), Mintlify/Markdown (one-pager). No deck SaaS, no CRM-for-investors (overkill for a credits-and-grants bootstrapper). The pipeline *is* `pipeline.yaml`.

**Canon dependencies.** `Company` (stage, posture, founder), `Product` (problem/solution/magic), `Metrics` (traction), `Pipeline` (program status), `AnswerBank`. This lane is the Canon's single heaviest consumer.

> **needs Jamie:** which programs to *prioritize* applying to first within the committed set, and the deck's narrative voice/visual theme — creative calls. The mechanics and sequence are committed.

### 2.2 Legal, compliance & IP — DEEP (Stage-0 eligibility)

**Strategy.** Minimal admin now unlocks maximal funding eligibility (already committed, §funding-posture). The Stage-0 job is to have the **eligibility scaffolding** ready so no program is blocked on paperwork — and to do it leanly, deferring heavy legal spend to traction.

**Entity formation (verified 2026) — TYPE + TOOL OPEN, confirm with a CPA at incorporation.** Two decisions, deliberately deferred to launch (canon §3 step 7; OSS needs no entity):

- **Entity *type* (C-corp vs S-corp/LLC) — open, hinges on raise/sell intent.** **C-corp** if there is *any* chance of raising or selling: investors essentially cannot buy S-corps/LLCs, and — the factor most "start S-corp then convert" advice omits — a domestic C-corp preserves the **QSBS / §1202** capital-gains exclusion, whose holding clock starts at stock issuance (expanded in 2025 — *verify current thresholds*); starting S-corp delays/forfeits it. **S-corp/LLC pass-through** is genuinely more tax-efficient *only* for a firmly bootstrapped-forever, profitable business distributing to the founder (modest, and largely theoretical pre-revenue; a reinvesting startup barely feels C-corp double-tax). **This is a consequential money/legal call → confirm with a startup CPA/attorney against Jamie's actual numbers + exit appetite before incorporating; do not lock from forums.**
- **Entity *tool* — Atlas vs Clerky (both Delaware C-corp).** **Stripe Atlas — $500 one-time** (incorporation + state filing, EIN, founder stock + **83(b)**, first-year registered agent, then **$100/yr**; ~$2,500 Stripe credits + perks; Stripe-native for a Stripe-billing SaaS). **Clerky** ($427 pay-per-use / $819 lifetime) is strongest on clean cap-table / fundraising-grade legal hygiene (well-regarded on r/startups) — the better pick if fundraising rigor matters; note Clerky is C-corp-fundraising-oriented. Alternatives: Firstbase ($399), doola ($297, non-resident lean).

**One entity behind `yrka.io`**; the OSS domains and `jnh.org` need no separate entity (committed).

**OSS license compliance + governance (Stage-0, near-zero cost).** The committed minimal-admin set unlocks DigitalOcean + GitHub Sponsors + vendor OSS credits: **Apache-2.0 LICENSE** (committed; OSI-approved, preserves OSS-funding eligibility), **README**, **CONTRIBUTING with DCO** (Developer Certificate of Origin sign-off — lighter than a CLA, contributor-friendly, the modern OSS default), **CODE_OF_CONDUCT** (Contributor Covenant — and a CoC is a hard gate for the Vercel OSS Program), **GOVERNANCE**, and **SECURITY.md**. These are templated from the `Product`/`Company` Canon records so the entity name, contact, and license are consistent across every repo. License-compliance hygiene for *dependencies* (the canon's "official/OSS tooling" means an Apache/MIT-compatible dep tree) is checked in CI — standard SPDX/license-scan, no bespoke tool.

**ToS / privacy / DPA generation (verified 2026).** Generate, don't hand-write, and don't pay for a heavy compliance SaaS pre-traction. **Termly** and **TermsFeed** generate GDPR/CCPA-ready Privacy Policy + Terms for SaaS at a free/low tier; **free DPA generators** (e.g. LegalPolicyGen, Oneflow templates) cover the controller↔processor agreement GDPR needs once the SaaS processes EU data. The **entity-specific fields** (legal name, jurisdiction, contact, effective date, sub-processor list) fill from `Company`/`pipeline of vendors` in the Canon, so regenerating after an entity or vendor change is mechanical. Note: iubenda moved to per-site pricing + a consent-DB surcharge in late 2025 — Termly/TermsFeed free tiers are the leaner bootstrapped fit; revisit a paid compliance platform only at real EU-user scale. The committed billing adapter's **MoR option** (Paddle/Lemon Squeezy/Polar/Stripe-Managed handle sales tax/VAT as merchant-of-record, §2 payments) also offloads a chunk of tax-compliance burden — a deliberate lean choice already in canon.

**Trademark basics (defer, but know the gate).** Trademark is committed-deferred to traction (§funding-posture: "heavy items — legal entity already covered, trademark, accelerators — deferred"). Stage-0 action is *defensive only*: confirm name availability before committing a public brand (the brand workstream + the free-tools brand/domain lookup already do this), and keep the first-use-in-commerce dates in `Company` so a later USPTO filing is easy. No filing now.

**Target outcomes (Stage-0).** (1) Incorporation path decided (Atlas, committed) and ready to execute when the commercial surface is live. (2) Every OSS repo ships the full governance set, templated from Canon, the moment it's public — instant Vercel-OSS/GitHub-Sponsors eligibility. (3) ToS/privacy/DPA generated and entity-correct before yrka.io takes a single signup. (4) An **eligibility dossier** (entity status, license posture, no-VC attestation, founder identity) assembled from the Canon, ready for any program's gate.

**Lean stack.** Stripe Atlas (entity), templated governance files (Apache-2.0/DCO/Contributor Covenant), Termly/TermsFeed + free DPA generator (policies), SPDX license-scan in CI (dep compliance). No law firm, no compliance SaaS, no trademark filing — until traction.

**Canon dependencies.** `Company` (legal_name, jurisdiction, formation_date, contact, founder identity, first-use dates), `Product` (license), vendor/sub-processor list.

> **needs Jamie:** Atlas vs Clerky is *committed to Atlas* but Clerky is the one defensible swap if fundraising-grade cap-table rigor later matters — flag, don't switch. Timing of incorporation relative to launch is a founder call (the funding brief sequences it at launch step 7).

### 2.3 Brand & identity — DEEP-ish (Stage-0 basics)

**Strategy.** Core brand is **already substantially committed** (§2 Naming + `09-brand-development`): **jami** (the agent), **the Studio** (the UI environment), **jami.studio** (OSS platform), **yrka** (commercial), the `@jami-studio` npm scope, `studio-jami` GitHub org + socials — all owned and confirmed. Stage-0 brand-basics is therefore **not naming** (mostly done) but **codifying the visual identity into tokens the Ops Canon serves out**: logo, color tokens, type scale, handles — so every surface (site, deck, README, social) renders one consistent identity.

**Lean stack (verified 2026).** For a solo founder, the current best practice splits **identity design** from **content production**: design the logo + core identity as **vectors in Figma** (free tier sufficient for one person; the design-token source), then **brand-tokens.json** in the Ops Canon carries the resolved tokens (colors, type, asset paths) that Astro/Marp/Mintlify all consume. Canva is for downstream content templates, *not* the identity itself. AI logo/identity generators (Design.com, Sologo, "Claude design" workflows) are acceptable accelerators for a first mark, but the *output* must land as owned vector + tokens, never a locked SaaS asset (§1 owned/agnostic). This is the §0 "tokenized design system, never three hardcoded colors" rule applied to brand.

**Target outcomes (Stage-0).** (1) A resolved `brand-tokens.json` (logo, palette, type, handles) per domain, mirroring the brand workstream. (2) Every generated artifact (site, deck, README, social bios) pulls the same tokens — visual parity by construction. (3) Social handles single-sourced (`studio-jami` etc.) so no bio drifts.

**Canon dependencies.** `BrandTokens`, `Company.social_handles`. Feeds *every* projection.

> **needs Jamie:** the actual visual identity — logomark, palette, type choices — is squarely the founder's creative call (the brand workstream owns it). This proposal only commits *that the tokens live in the Canon and serve out*, not what they are. Final suite/product *names* remain open per §4.

### 2.4 Marketing & content — SURVEY (later stage)

**Strategy.** For a bootstrapped OSS+SaaS dev-tools founder, marketing is **content-led + developer-credibility-led**, not paid-acquisition. Positioning flows from the Ops Canon's `one_liner`/`value_props`/`ICP`. The committed launch order puts **marketing sites first** (§3) — so the website *is* the first marketing artifact, generated from the Canon on the Astro/Cloudflare stack. SEO for dev tools = high-quality docs (Mintlify, canon) + technical content that ranks on real developer queries; social = founder-in-public on the dev platforms (GitHub, X, dev.to) under the `studio-jami` identity. Email = a lean transactional + light-newsletter posture on the committed email adapter (`@opencoredev/email-sdk`, Resend primary, §2) — no heavy marketing-automation SaaS.

**Target outcomes.** Site live and Canon-driven at launch; docs ranking; a modest cadence of build-in-public posts; an announce list. Measured by qualified traffic → OSS adoption → SaaS trials, not vanity reach.

**Lean stack.** Astro + Cloudflare Pages (site, committed), Mintlify (docs, committed), the email adapter (committed), git-native content. SEO via the docs/content themselves; the `searchfit-seo` skill family is available if a structured pass is wanted. No HubSpot/Marketo.

**Canon dependencies.** `Product` (positioning, value props), `ICP`, `Metrics`, `BrandTokens`.

### 2.5 Sales & GTM motion — SURVEY (later stage)

**Strategy (verified 2026).** For dev-tools/OSS the current dominant motion is **PLG + community-led, with sales-assist layered on later** — the Snyk/HashiCorp/GitHub pattern: build adoption and trust through the open product + community, then layer monetization. The committed open-core line (§2: OSS = full single-tenant BYOK product; commercial = scale/governance/hosted + the suites + the Kit) is *exactly* this shape. So the GTM motion is: **OSS foundations earn adoption → free tools + Studio create a funnel → yrka suites + the Kit convert** the users who want managed/scale/support. ICP and the **pricing/packaging surface** live in `icp.yaml` (canonical), so the pricing page, the deck's business-model slide, and sales one-pagers all render one source.

**Target outcomes.** Self-serve adoption of OSS; a measurable OSS→trial→paid funnel once yrka is live; community signal (stars, contributors) feeding both funding eligibility and GTM. No outbound sales team (solo, bootstrapped) — PLG self-serve is the motion.

**Lean stack.** The product itself (PLG), GitHub/community surfaces, Stripe (billing, via the committed adapter), the Ops Canon for one-pagers/pricing. No CRM until there's a pipeline to manage; if/when needed, a lean option over a heavy Salesforce.

**Canon dependencies.** `ICP` (pricing/packaging, positioning), `Product`, `Metrics`.

> **needs Jamie:** final pricing/packaging numbers per suite, and the suite names (§4 open) — creative/scope. The *surface* (that pricing lives in `icp.yaml` and serves out) is committed.

### 2.6 Finance & ops — SURVEY (later stage)

**Strategy.** Lean accounting/banking/runway for a bootstrapped solo founder. **Verified 2026: Mercury** is the clear business-banking fit for a bootstrapped/solo founder (no minimum balance, no personal guarantee, free Stripe/integration access, US-incorporated startup focus) — Brex skews to VC-backed/$1M-revenue. **Stripe** is the committed billing rail (the billing adapter, §2). Bookkeeping stays minimal pre-revenue (Atlas bundles partner perks; a light tool or Mercury's built-in suffices), with a CPA engaged only at the entity's first tax filing. Runway tracking is a single sheet — bootstrapped means the runway *is* the founder's own funding posture, already in `Company.funding_posture`.

**Target outcomes.** Business banking opened at incorporation (Mercury), Stripe live for the first SaaS charge, clean books from day one (so the entity's tax filing and any future application's financials are trivial), a known runway figure in the Canon.

**Lean stack.** Mercury (banking), Stripe (payments, committed adapter), Atlas perks / light bookkeeping, CPA at first filing only. No ERP, no fractional-CFO.

**Canon dependencies.** `Company` (entity, stage, funding_posture), `Metrics` (MRR once live).

> **needs Jamie:** banking provider is a founder preference (Mercury recommended on the 2026 evidence; Relay/Novo are lean alternatives). Not a blocker.

### 2.7 Community & support — SURVEY (later stage)

**Strategy.** Two audiences, two motions. **OSS contributor experience**: the governance set (CONTRIBUTING-DCO, CoC, GOVERNANCE, good first issues, clear `@jami-studio/*` package docs on Mintlify) lowers the contribution barrier — this directly feeds the community-led GTM *and* the maintainer-gated funding programs (which reward real adoption, `07-brands-funding`). **SaaS support**: lean, docs-first deflection (Mintlify docs answer most questions) + a single support channel + the committed email adapter for transactional/support mail; the committed AgentMail inbound concern (§2) can later automate triage. Community lives where developers already are (GitHub Discussions, a chat) under `studio-jami`.

**Target outcomes.** A frictionless first-contribution path; responsive-enough solo support that doesn't gate launch; community signal that compounds adoption and funding eligibility.

**Lean stack.** GitHub (Discussions/Issues), Mintlify docs (committed), the email adapter (committed), the Multica/dogfood stack for any automation. No Zendesk/Discourse pre-scale.

**Canon dependencies.** `Product` (docs, links), `Company` (support contact), governance templates from `Company`/`Product`.

---

## Part 3 — Staging Map (on the product-launch clock)

Aligned to the committed launch order (§3): marketing sites → OSS foundations/contracts → Studio → yrka flagship → free tools → funding → releases. The Ops Canon stands up **first** because it has no upstream dependency and feeds everything; each lane's artifacts switch on as its surface goes live.

| Stage (launch order) | Ops Canon work | Lanes that activate | Artifacts that go live |
|---|---|---|---|
| **0. Now (pre-launch foundation)** | Stand up `ops-canon/` skeleton + schemas; fill `Company`, founder bio, `BrandTokens`, `one_liner`/`elevator_pitch`; seed `Pipeline` from `07-brands-funding`; start `AnswerBank` | **Brand-basics**, **Legal-eligibility**, **Funding/pitch** (the three deep Stage-0 lanes) | Brand tokens; templated governance files ready; entity path decided (Atlas); deck + one-pager + elevator pitch generable; eligibility dossier ready |
| **1. Marketing sites** | `Product` records for jami.studio/yrka/jnh.org; wire Astro Content Layer to the Canon | **Marketing** (site/positioning), Brand (tokens serve out) | Canon-driven marketing sites on CF Pages; Mintlify docs scaffolding; first build-in-public posts; **funding applications begin** as each lane's surface is live |
| **2. OSS foundations/contracts** (`@jami-studio/harness`, `ui`, `orchestra`) | Per-package `Product` metadata; wire `Metrics` to GitHub/npm live feeds | **Legal** (full governance set ships with each public repo), **Community** (contributor experience) | Apache-2.0 + DCO + CoC + GOVERNANCE + SECURITY per repo → instant Vercel-OSS/GitHub-Sponsors eligibility; live star/download metrics in the Canon |
| **3. Launch the Studio** | Studio `Product` record; showcase metrics | Marketing, Community deepen | Studio surface live and Canon-driven |
| **4. yrka flagship suite** | `ICP`/pricing surface in Canon; ToS/privacy/DPA generated entity-correct; `Metrics` gains users/MRR | **Sales/GTM** (PLG funnel, pricing), **Finance** (Mercury, Stripe live), **Legal** (policies live before first signup) | Pricing page from `icp.yaml`; legal pages live; billing live; banking open |
| **5. Free tools** (benefit finder, brand/domain lookup, leads/competitor tracker, daily briefs) | Free-tool `Product` records; benefit finder can dogfood `Pipeline`/freshness tooling | Marketing (funnels), Sales (top-of-funnel) | Live demonstrable funnels — the strongest funding-application evidence (`07-brands-funding`) |
| **6. Funding** | `Pipeline` + `AnswerBank` fully warm; deck regenerated with real traction | **Funding/pitch** at full strength | Applications submitted from generated, current artifacts — paste-and-tailor, not scramble |
| **7. Releases** (Intercal → BoardRune → Collective) | New `Product` records per release; metrics extend | Community (Collective), Marketing (launches), Funding (post-adoption maintainer-gated programs) | Each release inherits the same Canon-driven artifact machinery automatically |

The pattern: **the Ops Canon is built once at Stage 0; every later stage adds records, never new machinery.** A new product/release is a new `Product` file + its metrics — and the deck, site, answer-bank, and governance files pick it up for free. This is the §1 "full end-shape, build once" discipline applied to the business layer.

---

## Open — "needs-Jamie" calls

Genuinely founder creative/scope decisions (not facts to invent):

1. **Founder-facts DRY shape** — one org-lane `founder.yaml` referenced down, vs per-domain copies. (Default: shared, referenced.)
2. **Deck visual theme + narrative voice** — Marp theme CSS and the pitch's tone. The *content shape* (Kawasaki 10-slide) is committed; the look/voice is the brand workstream's + Jamie's.
3. **Visual identity itself** — logomark, palette, type. The Canon *holds* the tokens and serves them; *what they are* is the founder's/brand-workstream's call. Final **suite/product names** remain open per §4.
4. **Entity type + tool — OPEN, decide with a CPA at incorporation.** Type: C-corp (any raise/sell chance — preserves the QSBS clock) vs S-corp/LLC pass-through (bootstrapped-forever + profitable). Tool: Atlas (Stripe-native perks) vs Clerky (fundraising-grade cap-table; r/startups-favored). Confirm against real numbers + exit appetite; don't lock from forums.
5. **Incorporation timing** relative to launch (funding brief sequences it at launch step 7; exact trigger is Jamie's).
6. **Banking provider** — Mercury recommended on 2026 evidence; Relay/Novo are lean alternatives. Founder preference.
7. **Pricing/packaging numbers** per suite — live in `icp.yaml`; the numbers are creative/scope (§4).
8. **Application prioritization** within the committed program set — which to apply to first.

Everything else here is committed shape, derived from the Operating Canon and verified 2026 facts.

---

## Sources (verified 2026-06-02 unless noted)

Internal canon (committed context — not re-decided):
- Operating Canon — `C:\Users\james\dev\docs\research\00-orchestration\plan.md` (§0 ethos, §1 hard rules, §2 committed decisions, §3 order/launch, §4 open creative/scope, §5 refresh directive).
- Brands, Lanes & Funding — `C:\Users\james\dev\docs\research\07-brands-funding\report.md` (funding programs, entity shape, posture — verified 2026-06-01).
- Canonical Autonomous Agentic Dev System — `C:\Users\james\dev\docs\research\08-canonical-system\report.md` (layer model, single-concern, machine-checkable contracts).
- Brand development workstream — `C:\Users\james\dev\docs\research\09-brand-development\report.md`.

External / official (verified 2026-06-02):
- Astro Content Collections + Content Layer (Zod schemas, glob/file loaders, type safety) — https://docs.astro.build/en/guides/content-collections/ , https://docs.astro.build/en/reference/modules/astro-content/
- Keystatic (git-based, zero-infra CMS; Astro/Next integration) — https://docs.astro.build/en/guides/cms/keystatic/ , https://www.luckymedia.dev/insights/keystatic
- Marp (Markdown → PPTX/PDF/HTML, CLI, CI-friendly; v4.3.x) — https://marp.app/ , https://github.com/marp-team/marp
- Slidev (MIT, dev-oriented deck alternative) — https://www.pkgpulse.com/guides/slidev-vs-marp-vs-revealjs-code-first-presentations-2026
- Guy Kawasaki 10/20/30 pitch-deck standard — https://guykawasaki.com/the-only-10-slides-you-need-in-your-pitch/ , https://kruzeconsulting.com/blog/guy-kawasaki-pitch-deck-the-ultimate-guide/
- Stripe Atlas ($500 + $100/yr, EIN/83(b)/registered agent, perks) — https://stripe.com/atlas , https://docs.stripe.com/atlas
- Formation alternatives (Clerky $427/$819; Firstbase $399; doola $297) — https://www.flowjam.com/blog/stripe-atlas-vs-clerky-which-is-better-for-your-startup , https://startupsavant.com/service-reviews/stripe-atlas-alternatives
- Privacy/ToS generators (Termly, TermsFeed; SaaS GDPR/CCPA) — https://termly.io/products/privacy-policy-generator/ , https://www.termsfeed.com/privacy-policy-generator/
- Free DPA generators (LegalPolicyGen, Oneflow) — https://legalpolicygen.com/blog/what-is-data-processing-agreement-dpa-guide , https://oneflow.com/free-contract-templates-3/data-processing-agreement-template/
- iubenda per-site pricing shift (late 2025) — https://www.iubenda.com/en/blog/best-privacy-policy-generators/
- PLG + community-led GTM for dev tools / OSS (2026) — https://www.saasmag.com/product-led-growth-next-chapter-saas-2026/ , https://www.productmarketingalliance.com/developer-marketing/open-source-to-plg/ , https://business.daily.dev/resources/community-led-growth-developer-tools-revenue/
- Mercury vs Brex for bootstrapped/solo founders (2026) — https://relayfi.com/blog/brex-vs-mercury/ , https://aspireapp.com/us/blog/brex-vs-mercury
- Solo-founder brand identity (Figma for vector identity vs Canva for content; brand-kit tokens) — https://www.slammedialab.com/post/branding-tools , https://www.metabrand.digital/guides/startup-branding-guide/visual-identity

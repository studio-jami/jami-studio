# F16 — Products (yrka · Intercal · Collective · jami.studio · jnh.org)

Status: AUTHORED 2026-06-02 · Domain: D · Distribution, products & AX
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/10-product-concepts/report.md`, `06-rebuild-feasibility`, `../../research/00-orchestration/{plan,synthesis}.md`
Related: F14 (Kit/distribution), F02 (auth), F07 (data), F09 (registry/Apps), F12 (billing)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

The products composed over the foundations. **In:** each domain's product scope, boundaries, maintenance posture. **Out:** the foundations themselves (B/C reports).

## 2. Committed decisions (from canon)

- **yrka (saas)** — one product monorepo: `business-suite`, `media-suite`, `research-suite`, the **free-tools** cluster (benefits finder, brand+domain lookup, leads+competitor tracker, daily briefs), **BoardRune**. One identity; free-tools inherit auth; suites are **Apps** over **one shared registry**.
- **Suites bridge, don't replace:** "the place where the work _behind_ the work happens" — touchpoints + adapters + normalization pipelines, not replacements for specialized tools.
- **Intercal (oss)** — temporal/delta knowledge graph (≈intercal.dev), own domain, lightly maintained, openly available — consumes the foundations.
- **The Collective (oss)** — open agent society (deposit protocol, reputation/governance, public-view harness), own domain, the large undertaking.
- **jami.studio (oss)** — foundations platform / BYOK showcase. **jnh.org (personal)** — website, light/no auth.

## 3. Architecture & mechanics

**Foundations as libraries, products as compositions.** `harness` (F05) + `ui` (F09) are the substrate; every product is a **thin domain layer over them**, dual-invocation against one governed contract (F06), all knowledge consumed from Intercal's `agent-delta` rather than per-app scraping. Each product is an **App** (F01 taxonomy) composed via the **one shared registry** (F09).

**yrka (saas — one product monorepo, commercial).** One unified, ala-carte interface sharing **one identity** (F02), one entitlement plane (F07 — suite access = grant rows), one billing rail (F12):
- **`business-suite`** (SMB operations), **`media-suite`** (mixed-media gen/edit/upscale — F13 media-gen port), **`research-suite`** (research + long-form writing, grounded in Intercal).
- **free-tools cluster** — **inside** the product, inheriting its auth: benefits finder (MV3-native browser extension — Chrome removed MV2 in 2025, no migration debt), brand-name + domain lookup (**RDAP-first**, RDAP replaced WHOIS as the ICANN standard Jan 2025; WHOIS fallback for ccTLD stragglers), leads + competitor tracker, daily briefs.
- **BoardRune** — massive-multiplayer org team-building game.
- **Suites bridge, don't replace.** yrka does **not** supplant best-in-class research/media/business tools — each suite is **the place where the work *behind* the work happens**: first-class touchpoints + adapters + normalization pipelines that bridge users/agents/teams/orgs to those tools, all pulling from one shared registry. Suites *look* different but are **not separate** — installable Apps that interoperate seamlessly.

**Intercal (oss — own domain ≈intercal.dev, lightly maintained).** The **temporal/delta knowledge graph**: durable changelog + cross-system knowledge substrate (`agent-delta`) exposed via **MCP/REST** + a visual web app. **Consumes** the foundations — it is *not* a jami.studio foundation nor a yrka product. It's the second critical-path product (daily-briefs, research-suite, free-tools freshness, and the Collective all read from it).

**The Collective (oss — own domain, the large undertaking).** The **open agent society**: deposit protocol, reputation/governance schema, public-view harness. Consumes the foundations; the public view is an agent-legible funnel (F15).

**jami.studio (oss — foundations platform).** Houses `harness` + `ui` + `orchestra` + the **BYOK showcase** web app (the reference single-tenant product; mostly web-surface, CF Pages, F04). **jnh.org (personal).** Website (`.com` folds in), light/no auth.

**Public surfaces are funnels.** The Studio showcase, free-tools routes, and the Collective public view funnel into the commercial lane (F19/F21).

## 4. Remaining peripheral decisions to cement

- **Suite scope/boundaries (cemented direction):** business/media/research as Apps over one registry + one identity; free-tools inside yrka inheriting auth; BoardRune a yrka App. Exact App boundaries finalized at build.
- **App composition model (cemented):** thin domain layer over harness+ui, dual-invocation, one shared registry (F09), ala-carte via grants (F07).
- **Maintenance posture (cemented):** jami.studio + yrka actively developed; Intercal lightly maintained but openly available; Collective is the large undertaking; jnh.org light.
- **`> needs Jamie` (creative/scope, §4):** final **SaaS suite names**, **Intercal/Collective product names**, **etymara** (naming tool) + free-tool names, the **CLI** name — one cohesive naming sweep when Jamie has the feel. Domains are settled (intercal.dev leaning, not married).

## 5. Dependencies & interfaces

- **Composes F05 (harness), F06 (governance), F07 (data/entitlements), F08 (transport), F09 (UI registry/Apps), F11–F13 (adapters).**
- **F14 (distribution)** — yrka = the scaffold instantiated + `@yrka/*` (reference impl); distributed/monetized via F14.
- **F02 (auth)** — one identity per domain; yrka suites + free-tools share the yrka issuer.
- **F12 (billing)** — yrka monetization; checkout/portal in the suite shells.
- **F04 (hosting)** — per-product host mapping (jami.studio/jnh.org → CF Pages; yrka → CF plane + Cloud Run + Neon).
- **F17–F24 (ops)** — each product gets an Ops Canon `Product` record; brand/marketing/sales/support lanes activate per its launch stage.

## 6. Verification & closing criteria

- Each product is a thin composition over `harness` + `ui` with no foundation logic duplicated; ala-carte suite access works via F07 grant rows under one yrka identity.
- yrka suites interoperate via one shared registry (F09); free-tools inherit yrka auth; BoardRune is a yrka App.
- Intercal exposes `agent-delta` over MCP/REST + a web app; research-suite/daily-briefs/free-tools/Collective read from it.
- The Collective's deposit/reputation protocol + public-view harness run on the foundations.
- jami.studio's BYOK showcase is a real single-tenant product (the reference impl); jnh.org serves light/no-auth.
- Drift-corrected build facts hold: brand/domain lookup is **RDAP-first**; the benefits-finder extension is **MV3-native**.

## 7. Risks & verify-at-build (dated 2026-06-02)

- **Product names are open** (`> needs Jamie`) — do not hardcode suite/Intercal/Collective/free-tool names; placeholders stay placeholders.
- **RDAP-first** (RDAP replaced WHOIS as ICANN standard Jan 2025) — verify RDAP endpoint coverage per TLD at build; keep WHOIS fallback for ccTLD stragglers.
- **Manifest V3** is mandatory (Chrome removed MV2 in 2025) — the benefits-finder extension is MV3-native, no migration debt.
- **Intercal is critical-path #2** (everything fresh reads from it) — sequence it second (after harness+ui), per the launch order.
- **BoardRune (MMO)** is heavy/long-horizon — it's a real App but the largest single build; scope at its own stage.

## 8. Sources

- `10-product-concepts`, synthesis §3 (Products) + §6 glossary, `06-rebuild-feasibility`, canon §2 (Structure & layering, Suites).

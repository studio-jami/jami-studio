# F17 — Operations Canon

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: 0 (deep)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (Part 1), `../../research/00-orchestration/{plan,synthesis}.md`, `04-secrets`, `08-canonical-system`
Related: F18–F24 (all consume it), F01 (placement), F03 (secrets boundary)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
The single source of truth for durable **business** facts/assets/configs, projected into every supporting artifact. **In:** the data model, generators, drift tooling, serve-out. **Out:** the lane strategies (F18–F24), secrets (F03).

## 2. Committed decisions (from proposal)
- **One `ops-canon/` per domain** under `dev/<org>/<domain>/docs/`: `company.yaml`, `products/*.yaml`, `metrics.yaml`, `pipeline.yaml`, `answer-bank.yaml`, `brand-tokens.json`, `icp.yaml` + `_schema/` (Zod). Shared founder facts = **one org-lane `founder.yaml`, referenced down** (locked default).
- **Every artifact is a projection, never a hand-kept copy:** Marp CLI → deck (PPTX/PDF); Astro Content Layer (Zod) → site/about/stats; templates → answer-bank, legal boilerplate, social bios; Mintlify → docs.
- **Drift tooling:** schema validation (fail-closed) + freshness/`as_of` linting + no-secret guard. **Secrets stay in the `04-secrets` adapter** — Canon holds public business facts + pointers only.
- **Serve-out:** build-time projection (default) + live-feed pull for volatile metrics + **optional Keystatic** GUI over the same git files. No Notion-as-source, no CMS server.
- **Build once at Stage 0; later stages add records, never machinery.**

## 3. Architecture & mechanics

**First principle.** Exactly **one home for each durable business fact**; every supporting artifact is a **projection**, never an independently-edited copy. This is the dev system's "single-concern-per-layer + transients never flow up" rule ported to business facts. It kills the failure mode the canon forbids (§1): MRR/star-count/tagline/funding-stage drifting across a deck, a site, three application forms, and a bio, then scrambled the night before a call.

**Placement (domain-layer data, F01).** One `ops-canon/` per domain under `dev/<org>/<domain>/docs/`:

```
docs/ops-canon/
  company.yaml          # legal/founder/entity profile (one per incorporating lane)
  products/*.yaml       # per-product profile (one per product as it gains a public surface)
  metrics.yaml          # traction — pointers to live feeds + cached snapshot
  pipeline.yaml         # funding/grant program tracker (status per program, from 07-brands-funding / F20)
  answer-bank.yaml      # canonical reusable application/interview answers
  brand-tokens.json     # logo paths, color tokens, type scale, handles (F18)
  icp.yaml              # ICP + positioning + pricing/packaging surface (F21)
  _schema/              # Zod definitions for every file above
```

Shared founder facts = **one org-lane `founder.yaml`, referenced down** (locked default, F01) — higher layer defines, lower layer references, never re-keys. The commercial entity facts live in `yrka`'s `company.yaml`; the OSS lane's is a lighter maintainer profile; `jnh.org` is a personal brand.

**The 6-entity data model (fields = the minimum each consuming artifact reads — zero-bloat).**
- **`Company`** — `legal_name`/`trading_name`; `entity_type`/`jurisdiction`/`formation_date`/`ein` (EIN public-safe, flag per comfort); `founder.{name,bio_short(50),bio_long(500),location,links}`; `mission`/`one_liner`/`elevator_pitch`; `stage`/`funding_posture`; `contact.{email,support,legal}` (role addresses); `social_handles` (`studio-jami` …).
- **`Product`** — `name`/`tagline`/`category`/`url`/`repo`; `description.{short,long}`; `value_props[]`/`features[]`/`differentiators[]`; `audience`/`use_cases[]`; `license`/`pricing_model`; `status` (pre-launch/live/beta — drives what the site renders).
- **`Metrics`** — `github.{stars,contributors}`/`npm.downloads_monthly`/`product.{users,mrr,uptime}`, each **pointer-preferred** (store the source endpoint, build fetches live, cache a snapshot for offline deck builds); every metric carries `as_of`.
- **`Pipeline`** — one record per program (F20/`07-brands-funding`): `program`/`lane`/`bootstrapped_tier`/`gate`/`status` (not-yet/eligible/applied/awarded/lapsed)/`applied_date`/`outcome`/`source_url`/`verified_date`. The living pipeline; the answer-bank draws from it.
- **`AnswerBank`** — keyed question → canonical answer, each **composed from `Company`/`Product`/`Metrics` references** so it can't drift ("What do you do?", "Traction?", "Why bootstrapped?", "Moat?", "Team?", "Use of funds?").
- **`BrandTokens`** + **`ICP`** — F18 tokens (logo/color/type/handles) + F21 positioning/ICP/pricing surface.

**The projection layer (thin-bridge: read → validate → hand to official renderer — no bespoke where a tool exists).**
| Surface | Tool (verified 2026) | Draws from |
|---|---|---|
| Site copy/about/stats | **Astro Content Layer + Zod** (Astro 5.x GA) | `Product`/`Metrics`/`Company` — the site has *no* facts of its own, so it can't state a stale number |
| Pitch deck (PPTX/PDF) | **Marp CLI** (v4.3.x, CI-friendly) | `deck.md` template (Kawasaki 10-slide, F20) pulls Canon values |
| Answer-bank sheet | tiny generator → Markdown/clipboard | `answer-bank.yaml` → always-current paste sheet |
| Legal boilerplate | template fill from `Company` | jurisdiction/legal_name/contact/effective_date (F22) |
| Docs/READMEs | **Mintlify** + templates | `Product` metadata |
| Social bios/one-pagers | render `social_handles` + `description.short` + `one_liner` | one string set → no per-platform drift |

**The 3 drift guards (CI-cheap, mirror the dev system's machine-checkable contracts).**
1. **Schema validation (fail-closed)** — every Canon file validates against `_schema/` on commit + CI; missing/malformed/bad-date → build fails before a surface sees it.
2. **Freshness lint** — every metric/fact carries `as_of`/`verified_date`; a linter flags facts older than a threshold (funding terms >90d, metrics >30d) — the "re-verify at application time" rule made enforceable.
3. **No-secret guard** — rejects anything key/token-shaped; secrets belong only in the F03 adapter. The Canon is public-business-facts-only **by construction**, so public artifacts reference it without leak risk (§1 no-bleed).

**Serve-out.** Build-time projection (default; Astro on CF Pages, F04); **live-feed pull** for volatile metrics (source endpoint + cached fallback); **optional Keystatic** GUI over the *same* git files (commits back to git — source stays canonical). **No Notion-as-source, no CMS server** (Notion may *consume* a projection, never be the source).

**Build once at Stage 0; later stages add records, never machinery.** A new product/release = a new `Product` file + metrics; the deck, site, answer-bank, and governance files pick it up for free.

## 4. Remaining peripheral decisions to cement
- **Field set per entity (cemented direction):** the zero-bloat fields above — add a field only when an artifact reads it.
- **Stage-0 slice (cemented):** stand up the skeleton + schemas; fill `Company`, founder bio, `BrandTokens`, `one_liner`/`elevator_pitch`; seed `Pipeline` from F20; start `AnswerBank`. Don't over-build ahead of content.
- **`> needs Jamie`:** founder-facts DRY shape — **default locked: one org-lane `founder.yaml` referenced down** (canon-locked infra default). A structural taste call, not a fact.

## 5. Dependencies & interfaces
- **Feeds every E lane:** F18 (BrandTokens), F19 (positioning/ICP/Metrics), F20 (Company/Product/Metrics/Pipeline/AnswerBank — its heaviest consumer), F21 (ICP/pricing), F22 (Company legal facts/Product license), F23 (funding_posture/MRR), F24 (support contact/docs links/governance templates).
- **F01** — placement under `docs/`; `founder.yaml` at org-lane.
- **F03** — the no-secret boundary: Ops Canon holds public facts + pointers, F03 holds credentials.
- **F04** — Astro projections build + serve on CF Pages.
- **F10** — Multica Autopilots can run the drift/freshness lints on a schedule.

## 6. Verification & closing criteria
- `ops-canon/` + `_schema/` exist per domain; `founder.yaml` at org-lane referenced down.
- **Schema-validation gate** runs on commit + CI, fail-closed (a bad field/date blocks the build).
- **Freshness lint** flags stale metrics/facts past threshold; **no-secret guard** rejects any key/token-shaped string.
- A fact change → rebuild → the site stat block, deck, answer-bank, and about page all reflect it (no hand-kept copy).
- Volatile metrics pull live from a source endpoint with a cached offline fallback (deck builds offline).
- Keystatic (optional) edits the same files and commits to git; the files stay canonical; no Notion/CMS server is the source.

## 7. Risks & verify-at-build (dated, 2026-06-02)
- Astro Content Layer GA + Marp v4.3.x + Keystatic — verify versions at build. Don't over-build ahead of content (Stage-0 slice only).

## 8. Sources
- proposal Part 1, canon §1–§2, `04-secrets`, `08`.

# F20 — Funding, grants & the pitch

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: 0 (deep)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (§2.1), `07-brands-funding`, `../../research/00-orchestration/plan.md` (§2 funding posture; §1 prod-ready rule), licensing research #3
Related: F17 (pipeline + answer-bank + deck from Canon), F22 (eligibility dossier), F18 (deck theme)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
A permanently-warm pitch + a live program pipeline so any application is paste-and-tailor. **In:** deck/elevator-pitch/one-pager machinery, program pipeline, answer-bank. **Out:** entity/eligibility paperwork (F22).

## 2. Committed decisions (from proposal + canon)
- **Build live evidence first, then apply** (`07-brands-funding`); a live demonstrable surface beats a deck → deck leads with traction/product; **apply *after* each lane's surface is live** (locked sequence).
- **Pitch shape = Kawasaki 10/20/30** (Title→Problem→Value→Magic→Model→GTM→Competition→Team→Projections→Ask) as the **Marp `deck.md` template**, each slide pulling from the Canon. Elevator pitch = `Company.elevator_pitch` (3 lengths). Separate credits/grants vs equity framings in the answer-bank.
- **Funding posture committed:** bootstrapped = asset; DigitalOcean + GitHub Sponsors + vendor credits (AWS excludes VC); never self-gate; the ~$1.3k GCP credits = a dev/eval budget (1-yr).

## 3. Architecture & mechanics

**The strategy: build live evidence first, then apply.** For a bootstrapped solo founder **a live, demonstrable surface beats a deck** → the deck leads with traction/product, and the pipeline sequences applications **after each lane's surface is live** (locked sequence). The Stage-0 job is to keep a **permanently-warm** pitch + a **live program pipeline + answer-bank** so any application is paste-and-tailor, never a scramble (the §1 GCP-call lesson).

**The Marp deck-from-Canon flow.** A `deck.md` Marp template structured as **Kawasaki 10/20/30** (verified stable 2026): **Title → Problem/Opportunity → Value Proposition → Underlying Magic → Business Model → Go-to-Market → Competition → Team → Projections/Milestones → The Ask.** Each slide pulls from the Canon (F17): Problem/Solution/Magic ← `Product`; Traction ← `Metrics` (live-feed pull); Team/Ask/Model ← `Company`/`ICP`. `marp deck.md -o deck.pptx` in a workflow regenerates the editable deck on every fact change — so the deck **cannot** carry a stale number. **Elevator pitch** = `Company.elevator_pitch` (one canonical string, three lengths). **One-pager** = Mintlify/Markdown render of the same Canon refs.

**`pipeline.yaml` lifecycle.** One record per program from `07-brands-funding`, status `not-yet → eligible → applied → awarded/lapsed`, each with `applied_date`/`outcome`/`source_url`/`verified_date`. The freshness lint (F17) flags program terms older than 90 days → re-verify at application time. This *is* the living pipeline; the answer-bank draws from it.

**Answer-bank composition (drift-proof).** `answer-bank.yaml` keys recurring questions → canonical answers **composed from `Company`/`Product`/`Metrics` references** ("What do you do?", "Traction?", "Why bootstrapped?", "Moat?", "Team?", "Use of funds?"). Separate **credits/grants vs equity** framings (bootstrapped credit programs care about product + eligibility, not equity story). Most applications are ~80% these questions; the bank answers them once, well, and regenerates current.

**Eligibility-dossier assembly (with F22).** Entity status, license posture (Apache-2.0), **no-VC attestation**, founder identity — assembled from the Canon (`Company` + `Product.license`), ready before any program window opens.

**Funding posture (committed).** Bootstrapped = an **asset** for OSS credits (many programs *exclude* VC-funded). Reliable sources: **DigitalOcean + GitHub Sponsors + vendor startup credits** (Neon/Supabase/Cloudflare — all individual-eligible); **AWS excludes VC/single-vendor** (F14). **Never self-gate.** The **~$1.3k GCP credits (1-yr window) = a dev/eval budget**, not a production dependency (F04).

## 4. Remaining peripheral decisions to cement
- **Mechanics + sequence (cemented):** Marp Kawasaki deck-from-Canon; `pipeline.yaml` lifecycle; Canon-composed answer-bank (both framings); eligibility dossier; apply-after-each-surface-is-live.
- **`> needs Jamie` (creative/scope, §4):** which programs to **prioritize first** within the committed set; the deck's **narrative voice + visual theme** (the Marp theme CSS reads F18 tokens; the *look/voice* is Jamie's + the brand workstream's).

## 5. Dependencies & interfaces
- **F17 (Ops Canon)** — its **heaviest consumer**: `Company`/`Product`/`Metrics`/`Pipeline`/`AnswerBank` all feed the deck + applications; the freshness lint enforces re-verification.
- **F22 (legal)** — the eligibility dossier (entity status, license, no-VC attestation, governance set); incorporation sequencing.
- **F18 (brand)** — the deck's Marp theme reads `brand-tokens.json`; the deck visual theme is a `> needs Jamie` call.
- **F14 (open-core)** — Apache-2.0 + clean OSS/commercial separation is the funding-eligibility structure.
- **F04** — GCP credits = dev/eval budget; perpetual free tiers govern production.

## 6. Verification & closing criteria
- A current, regenerable **deck + one-pager + elevator pitch** exist and rebuild from the Canon on any fact change (no stale number possible).
- `pipeline.yaml` reflects every program in `07-brands-funding` with live status; the freshness lint flags stale program terms.
- The answer-bank covers the recurring questions, composed from Canon refs (can't drift), with credits-vs-equity framings.
- The eligibility dossier is assembled from the Canon, ready before any window opens.
- **Closing test:** a program window opens → **regenerate + tailor + submit in hours, not days.**
- Applications begin only after each lane's surface is live (locked sequence); production never depends on trial credits.

## 7. Risks & verify-at-build (dated 2026-06-02)
- **Re-verify program terms at application time** (freshness lint, F17) — funding terms drift; the committed program set is from `07-brands-funding` (verified 2026-06-01), re-check before each submit.
- **Kawasaki 10/20/30 shape stable** as of 2026-06-02 — verify no major shift before relying on it.
- **AWS excludes VC/single-vendor** — target DO + GitHub + vendor credits; don't waste effort on excluded programs.
- **Marp v4.3.x** — pin + verify the PPTX/PDF export at build (shared with F17).

## 8. Sources
- proposal §2.1, synthesis §3 (Brand & funding), `07-brands-funding`, canon §1 (prod-ready rule) + §2 (funding posture) + licensing research #3.

## 7. Risks & verify-at-build (dated)
- Re-verify program terms at application time (freshness lint, §F17); Kawasaki shape stable as of 2026-06-02.

## 8. Sources
- proposal §2.1, `07-brands-funding`, canon §2 funding + §1 prod-ready, licensing research #3.

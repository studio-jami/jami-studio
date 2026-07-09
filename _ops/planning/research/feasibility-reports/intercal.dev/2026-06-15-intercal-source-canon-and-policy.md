# Intercal Source Canon & Access-Tier Policy

Date: 2026-06-15
Status: Decision artifact — ready to sort, seed, and implement. Companion to `2026-06-15-oss-knowledge-banks-grounding-landscape.md` (the analysis) and intended to drop into `intercal.dev/docs/operations/source-policy.md` once ratified.
Decisions ratified by Jamie (2026-06-15): (1) wire OpenAlex + adopt a license-sorted source canon; (2) CC0-first / fuller-license-favored policy; (3) Grokipedia excluded; (4) structure-now / data-gated-later for broader scopes; (5) source work proceeds independently of the parked flagship roadmap.

---

## The governing principle

**Favor the fuller license; use the thinner one only where it adds unique value.** Sources are sorted into **access tiers by what the license lets the governed corpus *do* with the fact** — redistribute, summarize, or cite-only. Tier sets the *default* policy booleans (`redistribution_allowed`, `summary_allowed`, `citation_only`); a row may always tighten, never silently loosen.

Every fact in the **governed corpus** is a **cited claim** (claim → `claim_evidence` → `source_document`). The corpus' public claims are bounded by **coverage gates**. Tier never changes the citation requirement — it only changes redistribution rights.

---

## The Canon (sorted by access tier)

### Tier S — CC0 / public domain (fact-redistributable) — *the spine*
Defaults: `redistribution_allowed=true`, `summary_allowed=true`, `citation_only=false`. These are the structured backbone; facts can be served, not just pointed at.

| Source | License | Grounds (clusters) | Wired? | Priority |
| --- | --- | --- | --- | --- |
| **Wikidata** (changes + SPARQL batch) | CC0 | Entity spine, external-ID hub, leadership/org/product facts | ✅ live | Keep — deepen |
| **OpenAlex** (REST + AWS dump) | CC0 | `research_paper`, `ml_research`, `evaluation_benchmarks`, citation graph, institutions | ❌ **build `openalex_v1`** | **#1 new** |
| Google Data Commons | CC BY (graph) / Apache-2.0 (API) | Quantitative/economic grounding (out of current scope) | ❌ staged | Stage only |

### Tier A — Permissive / open-API, attribution-friendly — *the chronicle*
Defaults: `redistribution_allowed` per-row (often true for metadata + abstracts), `summary_allowed=true`, attribution preserved. High-signal dated documents the pipeline extracts claims from.

| Source | License/terms | Grounds | Wired? | Priority |
| --- | --- | --- | --- | --- |
| **arXiv** | per-paper; metadata+abstract reusable | `research_paper`, `ml_research` | ✅ live | Keep |
| **GitHub releases** | per-repo | `model_release`, `sdk_framework_release`, `runtime_infrastructure` | ✅ live | Keep — expand repo list |
| **PyPI / npm / HuggingFace** registries | per-registry; metadata open | `model_card`, `sdk_framework_release`, open-weights lineage | ✅ live | Keep |

### Tier B — CC BY-SA (share-alike, summary/cite posture) — *the archaeologist + structure*
Defaults: `redistribution_allowed=false`, `summary_allowed=true`, `citation_only` where full text would trigger share-alike. Use for temporal depth and clean structure; never redistribute full text.

| Source | License | Grounds | Wired? | Priority |
| --- | --- | --- | --- | --- |
| **Wikipedia** revision history | CC BY-SA | Bitemporal evidence, anchor-article history | ✅ live | Keep |
| **Wikimedia Enterprise Structured Contents** (HF/Kaggle public snapshots) | CC BY-SA | Clean current-state infoboxes/abstracts/refs (vs HTML parsing) | ❌ evaluate | Eval (complements revisions, doesn't replace) |
| DBpedia | CC BY-SA | — (redundant with Wikidata; fresher + CC0 there) | ❌ | Skip unless ontology-specific need |
| ConceptNet | CC BY-SA 4.0 | Commonsense relations — query understanding only, not evidence | ❌ | Skip for corpus |

### Tier C — Per-source / mixed (policy set per row)
Lab blogs, standards bodies, regulation. Booleans decided per terms; conservative until verified.

| Source | Typical posture | Grounds | Wired? |
| --- | --- | --- | --- |
| Lab announcement RSS (OpenAI/Anthropic/Meta/Google) | `summary_allowed=true` | `lab_announcement`, `frontier_models` | ✅ live |
| MCP spec / W3C / IETF / OpenAPI repos | per-repo (often permissive) | `standard_spec`, `agent_protocols` | partial (GitHub adapter) |
| EUR-Lex / Federal Register / gov AI feeds | `citation_only` typical | `regulation` | ❌ |

### Tier X — Excluded (do not ingest as evidence)
| Source | Why excluded |
| --- | --- |
| **Grokipedia** | LLM prose **without citation infrastructure** (violates provenance invariant L4); closed backend/weights/regeneration; no bulk dump; CC BY-SA Wikipedia fork → strictly dominated by going to Wikipedia/Wikidata direct. *At most a future out-of-band corroboration signal, never a `source_document`.* |
| Google Knowledge Graph Search API / Enterprise KG | Proprietary, non-redistributable, no bulk — unusable as evidence. |
| GDELT / general news firehose | Out of scope (non-goal: news/gossip). Revisit only if a world-events cluster is greenlit. |
| Raw web crawl / Common Crawl | No provenance discipline; against the curated-source thesis. |

---

## Scope timing: structure now, data gated-later (the decision for #4)

The velocity-with-integrity move — and the reason it costs nothing to defer:

- **In Intercal, scope expansion is a config/seed change, not a migration.** `source_class` is a metadata field; topic clusters are seed rows; new banks are adapters behind a port. The schema is already scale-ready. So deferring *data* loses no architectural ground.
- **Therefore: encode the full canon (incl. Tier S Data Commons, Tier C regulation, future scopes) in the taxonomy + seeded source rows NOW** — disabled/staged where out of current scope. The map is wide; the ingest is narrow.
- **Ingest in gated waves:** AI-history first-proof → broad AI-history (pass coverage gates) → only then switch on any broader-scope wave, each as its own gated wave with its own policy review.
- **Why not bring all the data forward together:** it would (a) dilute the **governed corpus'** coverage claims before the core thesis is proven, (b) burn the single managed dollar (LLM extraction budget) on unproven scope, and (c) muddy exactly the integrity you're protecting. Richer cause/effect relations are real value — but they compound *after* the spine is dense, not before.
- **Net:** the broader scopes are **planned and staged in the canon, ingested later, gated.** Sharp corner cut (no broad ingest now); foundation kept integral (full structure, no migration debt).

---

## Immediate implementation order (independent of the parked roadmap)

1. **Ratify this canon** → fold into `docs/operations/source-policy.md` + `corpus-taxonomy.md` as the access-tier defaults.
2. **Run the first-proof backfill** on the already-wired Tier S/A/B sources (engine exists, corpus is empty — this is the real bottleneck, not source count).
3. **Build `openalex_v1`** (Tier S, CC0) — the one high-value new adapter; reinforces the redistributable spine for research/benchmark clusters.
4. **Seed staged rows** for Tier C regulation + Tier S Data Commons (disabled), so the map is complete without ingesting out-of-scope data.
5. **Evaluate** Wikimedia Enterprise Structured Contents as a cleaner Wikipedia current-state feed alongside the revisions history.
6. Write Grokipedia + the other Tier X exclusions into `source-policy.md` so "comprehensiveness" can't smuggle them back in.

This whole track terminates at fact-versions and does **not** depend on the parked flagship UI roadmap — it's a safe independent move now.

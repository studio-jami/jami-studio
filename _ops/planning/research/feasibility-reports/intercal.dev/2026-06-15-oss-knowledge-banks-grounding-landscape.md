# OSS Knowledge Banks: Intercal's Grounding Position & The Landscape

Date: 2026-06-15
Status: Research / decision input. No code or seed changes proposed yet — this is the map before the move.
Request: What open-source knowledge banks / graphs should Intercal ground its "backfill" and base on, without patching together disparate APIs? What is Intercal's current position (implemented + planned)? Where does Grokipedia fit?
Method: Live codebase as source of truth (`intercal.dev/` services, db, packages, seeds), prior research/roadmap docs read as remnants, current-state web verification of each external bank (June 2026).
Owner: Jamie + collaborators.

> Note on date: the working clock for this report is **June 2026** (environment + WebSearch both anchor here). The original ask said "june 2028"; treated as a slip and flagged, not assumed.

---

## TL;DR

1. **Intercal is not a general-knowledge encyclopedia and should not try to "ground on one mega-bank."** It is a *bitemporal change substrate* — claim → evidence → source_document → entity → relationship → append-only fact-version — currently **scoped to AI/ML/agent history (Nov 2022 → now)**. The right question is not "which single knowledge graph do we copy," it's *"which CC0 structured spine + which provenance-rich document streams do we wire behind ports."* Intercal's adapter/port architecture already makes "patching APIs together" a solved, one-adapter-per-source problem — not a tangle.

2. **It already pulls from the best-in-class OSS banks for its scope.** Seven real adapters exist today, including the two that matter most: **Wikidata** (CC0 — the structured spine) and **Wikipedia revision history** (bitemporal evidence). Plus arXiv, GitHub releases, PyPI/npm/HuggingFace registries, and RSS. This is already the correct shortlist for the AI-history corpus.

3. **The single biggest *missed* OSS bank is [OpenAlex](https://openalex.org)** — 477M+ scholarly works, **CC0**, dated, graph-structured (works/authors/institutions/topics). It is the natural CC0 backbone for the `ml_research`, `evaluation_benchmarks`, and `research_paper` clusters and is strictly better than scraping arXiv alone. Not wired today.

4. **License is THE gating axis for Intercal specifically**, because the substrate's source policy defaults to `redistribution_allowed=false`. **CC0 banks (Wikidata, OpenAlex, Data Commons-adjacent) are crown jewels** — Intercal can *redistribute the facts*, not merely cite them. CC BY-SA banks (Wikipedia, DBpedia, ConceptNet, **and Grokipedia**) force a summary/citation-only posture. The whole landscape sorts cleanly along this line.

5. **Grokipedia is an anti-fit, and your instinct is right.** Its content is CC BY-SA *forked from Wikipedia*; its backend, weights, and regeneration logic are **closed**; there is **no bulk dump**; and — fatally for a provenance-native substrate — its articles are **LLM-generated without citation infrastructure**, with contested neutrality. It is the *opposite* of what Intercal is (determinism + provenance are non-negotiable, per Locked Decision L4). It is strictly dominated by going to Wikipedia/Wikidata directly. **Do not ground on it.** At most a future low-trust corroboration signal — never an evidence source.

---

## 1. What Intercal Actually Is (so we judge banks against the right shape)

Grounded in the live repo, not the docs' aspirations:

- **Storage:** single canonical store — **PostgreSQL + pgvector** (`halfvec(384)`, HNSW). No Neo4j, no RDF triplestore, no separate vector DB. (`db/migrations/0001`–`0031`.)
- **Model:** bitemporal. Two independent time axes — **world time** (`valid_from`/`valid_until`: when a fact is true in reality) and **transaction time** (`recorded_at`: when Intercal learned it). Core tables: `entities`, `entity_aliases`, `entity_external_ids` (Wikidata QIDs etc.), `claims`, `claim_evidence`, `claim_contradictions`, `relationships`, append-only `fact_versions`, `source_documents` (SHA-256 dedup), `document_chunks`, four embedding tables.
- **Provenance is the spine, not a feature:** every surfaced fact resolves `claim → claim_evidence → source_documents`. The read side (`get_delta`, `verify_claim`, `get_entity`, `search_evidence`, `get_freshness`, `get_sources`) is **deterministic and fully cited — no LLM in the query path** (`packages/core/src/delta.ts`, `verify.ts`).
- **Ingestion is port-shaped:** every source is one adapter behind `SourcePort` (`services/shared/.../adapters/`). Adding a bank = adding an adapter + a seeded `sources` row with policy booleans. **This is the answer to "I don't want to patch together disparate APIs": the patching is already abstracted into a uniform contract.**
- **Scope today:** deliberately **AI/ML/agent/infra/research/regulation**, not world news or general trivia (locked taxonomy: 9–10 source classes, 10 topic clusters in `docs/architecture/corpus-taxonomy.md`).
- **What's real vs stubbed:** ingest → normalize → extract → embed → resolve → fact-versions is real and runnable; the **synthesis tail (digests + freshness) and subscriptions are `NotImplementedError` stubs** (Plans 03/04). The substrate terminates at fact-versions today. **Corpus is configured but barely populated** — the schema is a built engine running on fumes.

**Evaluation criteria that fall out of this shape** (use these to judge any bank):

| Axis | Why it matters to Intercal |
| --- | --- |
| **License / redistribution** | Source policy defaults to no-redistribution. CC0 → can redistribute facts. CC BY-SA / ODbL → summary/citation-only. Proprietary/closed → unusable as evidence. |
| **Provenance carried with the data** | Intercal stores evidence per claim. Banks that *ship citations + qualifiers* (Wikidata statements, OpenAlex) are gold; banks of bare triples (ConceptNet, DBpedia) are thin on "why." |
| **Temporal structure** | Bitemporal model wants timestamps + revision history. Wikidata/Wikipedia history & OpenAlex dates feed world-time; static dumps don't. |
| **Structured (spine) vs document (chronicle)** | Intercal needs both: cheap structured entities + rich dated documents the LLM extracts claims from. |
| **Agent-accessible bulk + query** | SPARQL / REST / dumps / S3. Avoid anything that only offers a rate-limited UI. |
| **Scope fit** | AI-history today; general-knowledge only if/when scope broadens. |

---

## 2. Intercal's Current Position

### Implemented today (7 live adapters)

| Adapter | Bank | License posture | Role |
| --- | --- | --- | --- |
| `wikidata_changes_v1` | **Wikidata** recent changes | **CC0** | Structured spine, incremental |
| `wikidata_sparql_batch_v1` | **Wikidata** SPARQL | **CC0** | Entity-batch bootstrap |
| `mediawiki_revisions_v1` | **Wikipedia** revision history | CC BY-SA | Bitemporal evidence ("the Archaeologist") |
| `arxiv_v1` | **arXiv** | per-paper / citation-friendly | Research chronicle |
| `github_releases_v1` | **GitHub** releases | per-repo | Model/SDK release timeline |
| `registry_releases_v1` | **PyPI / npm / HuggingFace** | per-registry | Package + model-card lineage |
| `rss_feed_v1` | Lab blogs (OpenAI/Anthropic/Meta) | summary-typical | Announcements |

This is already the *correct* canonical shortlist for an AI-history substrate. Notably, **Wikidata (CC0) is the spine and it's the right choice** — highest data timeliness of the big cross-domain graphs, public SPARQL, strong external IDs for entity resolution, and a license that lets Intercal redistribute facts rather than just cite them.

### Planned (roadmap remnants)

- The **"Spine → Chronicle → Archaeologist"** hybrid (`2026-06-06-baseline-knowledge-seeding.md`): Wikidata/HF/PyPI structured bootstrap → GitHub/arXiv/RSS document flood → Wikipedia revisions for temporal depth. **All three adapter families now exist** — the gap is *backfill execution + corpus population*, not adapters.
- Substrate flush-out roadmap (`2026-06-14-...-flagship-experience.md`, **ON HOLD since 2026-06-15**): complete synthesis/subscriptions, backfill first-proof then broad corpus, prove coverage gates. Track A (substrate) is independent of the parked UI track and can un-park alone.
- **Not planned / absent:** OpenAlex, DBpedia, ConceptNet, YAGO, Data Commons, Wikimedia Enterprise structured snapshots, GDELT. None are wired or seeded.

---

## 3. The OSS Knowledge-Bank Landscape, Judged for Intercal

Sorted by fit. **License is the first filter.**

### Tier 1 — CC0 crown jewels (can redistribute facts, not just cite)

- **[Wikidata](https://www.wikidata.org)** — CC0. ~115M+ entities, statements carry **references + qualifiers + time** (best-in-class provenance among general KGs), SPARQL + dumps + recent-changes API, strongest external-ID hub for resolution. **Already wired.** Verdict: *keep as the spine; deepen, don't replace.*
- **[OpenAlex](https://openalex.org)** — **CC0**. 477M+ works + authors/institutions/topics/funders as a heterogeneous graph; dated; REST API + full dumps on AWS Open Data; ~26B RDF triples via SemOpenAlex. Verdict: **the highest-value unwired bank.** It is the CC0 backbone for `research_paper` / `ml_research` / `evaluation_benchmarks` and is strictly richer than arXiv-alone (adds citation graph, institutions, dedup'd authors). *Recommend an `openalex_v1` adapter.*
- **[Google Data Commons](https://datacommons.org)** — graph CC BY, API/libs Apache-2.0. Census/UN/CDC/NOAA/World Bank statistical graph. Verdict: *out of current scope (stats, not AI history), but the obvious bank if Intercal ever adds quantitative/economic grounding. Park it.*

### Tier 2 — CC BY-SA (forces summary/citation-only posture, still valuable)

- **[Wikipedia](https://www.wikipedia.org) (incl. [Wikimedia Enterprise](https://enterprise.wikimedia.com) Structured Contents)** — CC BY-SA. Revision history already wired for bitemporal evidence. **New in 2025–26:** the Enterprise **Structured Contents** snapshot endpoint (pre-parsed abstracts, infoboxes, sections, references) — *public versions on Hugging Face & Kaggle*. Verdict: *the structured-contents snapshots could replace brittle HTML parsing for anchor articles; worth a look as a cleaner Wikipedia feed. Keep CC BY-SA `summary_allowed=true, redistribution_allowed=false`.*
- **[DBpedia](https://www.dbpedia.org)** — CC BY-SA. Wikipedia-extracted triples, 38M+ entities, SPARQL. Verdict: *largely redundant with Wikidata for Intercal; Wikidata is fresher and CC0. Skip unless a specific DBpedia-only ontology is needed.*
- **[ConceptNet](https://conceptnet.io)** — CC BY-SA 4.0. ~13M commonsense edges (multilingual). Verdict: *commonsense relations, not dated factual change — orthogonal to Intercal's temporal thesis. Skip for the substrate; possible future enrichment for query understanding only.*
- **[YAGO](https://yago-knowledge.org)** — CC BY 4.0 (derived). 10M+ entities, cleaner ontology than DBpedia but intermittent endpoints. Verdict: *no advantage over Wikidata for this use case. Skip.*

### Tier 3 — Domain / event streams (scope-dependent)

- **Semantic Scholar (S2ORC/S2AG)** — open API, good for citation context; overlaps OpenAlex. *OpenAlex preferred (CC0 vs ODC-BY-ish terms).*
- **[GDELT](https://www.gdeltproject.org)** — open global event/news graph, 15-min cadence. *Out of scope (Intercal's non-goal is news/gossip); revisit only if a "regulation/world-events" cluster is ever greenlit.*
- **[Open Research Knowledge Graph (ORKG)](https://orkg.org)**, **CrossRef**, **OpenCitations** — scholarly metadata/citations; mostly subsumed by OpenAlex.

### Tier 4 — Closed or anti-fit

- **Grokipedia** — see §4.
- **Google Knowledge Graph Search API / Enterprise KG** — proprietary, not redistributable, not bulk. Unusable as an evidence source.

---

## 4. Grokipedia: The Verdict

Verified June 2026:

- **Launched** Oct 27, 2025 (v0.1); ~885K+ articles, **many forked from Wikipedia under CC BY-SA**.
- **Openness is half-true:** xAI says the *code* is open, but the **backend, model weights, and regeneration logic remain closed** as of early 2026, and **there is no published bulk data dump**. "Open source knowledge repository" is mostly marketing; the *content* you could reuse is just CC BY-SA Wikipedia text with extra LLM rewriting on top.
- **The disqualifier:** articles are **LLM-generated and lack citation infrastructure** — the exact opposite of Intercal's `claim → evidence → source_document` invariant and Locked Decision L4 ("determinism and provenance are non-negotiable; no surface ever fabricates a fact, date, or citation"). Independent reviews flag hallucination and contested neutrality (described as skewing to Musk's / right-leaning views), with none of Wikipedia's visible edit-history / talk-page accountability.
- **Strictly dominated:** anything true in Grokipedia traces back to Wikipedia/Wikidata, which Intercal already ingests *with* provenance and *with* a cleaner license (Wikidata CC0). Grokipedia adds LLM noise and removes the citations.

**Recommendation: do not ingest Grokipedia as evidence — now or in the flush-out.** If ever useful, it is only as a *low-trust corroboration / divergence signal* ("does an external LLM-encyclopedia agree?") sitting **outside** the evidence chain, never as a `source_document`. Your gut ("hard to take it seriously") is the correct engineering call here, not just taste.

---

## 5. The Honest Strategic Read

- The "ground on one giant OSS knowledge graph" instinct doesn't have a clean answer **because no single bank is simultaneously general + production-grade + CC0 + temporal + provenance-rich.** Wikidata is the closest (CC0 + provenance + temporal) but is a *spine*, not a document corpus. So Intercal's actual architecture — **CC0 structured spine (Wikidata, +OpenAlex) + provenance-rich dated document streams (arXiv/GitHub/Wikipedia-revisions/registries) behind uniform ports** — is the *correct* shape, not a compromise. The elegance the product wants to prove is exactly this: *one bitemporal provenance model, many small adapters, no mega-dependency.*
- **The bottleneck is not source coverage — it's population + the synthesis tail.** Intercal has more adapter surface than it has corpus. Before adding banks, the highest-leverage move is executing the **first-proof backfill** (the engine exists; it's idle).
- **The one bank worth adding now is OpenAlex** (CC0, dated, graph-structured), because it materially upgrades the research/benchmark clusters and reinforces the CC0-redistribution advantage.
- **Agent-friendliness + accessibility ("value proves itself in elegance"):** Intercal's differentiator vs. just handing an agent a Wikidata dump is the **bitemporal + cited + token-budgeted delta** — "what changed since your cutoff, with receipts." No raw OSS bank offers that. The banks are *inputs*; the substrate is the product. Keep that line bright.

---

## 6. Open Decisions / Critical Infra Questions

1. **Add OpenAlex (CC0) as the scholarly spine?** High-value, in-scope, license-ideal. Build `openalex_v1` (REST + AWS dump) — yes/no, and at what priority vs. backfilling what's already wired?
2. **CC0-first sourcing policy?** Should the source taxonomy *prefer* CC0 banks (Wikidata, OpenAlex) for anything Intercal wants to **redistribute** (vs. cite), and explicitly cap CC BY-SA banks (Wikipedia, DBpedia, ConceptNet) at `summary_allowed`? This turns a license fact into a standing policy default.
3. **Grokipedia: formally out?** Recommend writing it into `source-policy.md` as **excluded as an evidence source** (provenance + license + closed-regeneration grounds), to prevent it sneaking in as a "comprehensive" tempt later.
4. **Wikimedia Enterprise Structured Contents** (HF/Kaggle public snapshots) — adopt as a cleaner Wikipedia feed than HTML parsing, or stay on the revisions API for the bitemporal signal? (They serve different axes: snapshots = clean current state; revisions = history. Possibly both.)
5. **Scope boundary check:** Banks like Data Commons (stats) and GDELT (events) are real and open but **out of the AI-history thesis.** Confirm Intercal stays narrow-and-deep (AI history) rather than broad-and-shallow (general knowledge) — this decision determines whether half this landscape is ever relevant.
6. **Sequencing:** The flush-out roadmap is ON HOLD pending the foundation audit. Does knowledge-bank expansion wait for that un-park, or is "populate the corpus from already-wired banks" a safe independent move now (Track A is documented as un-parkable alone)?

---

## Sources

- Live repo: `intercal.dev/{services,packages,db,db/seeds}`, `docs/architecture/corpus-taxonomy.md`, `packages/core/src/delta.ts`.
- Prior planning: `_ops/planning/intercal.dev/research/2026-06-06-baseline-knowledge-seeding.md`; `_ops/planning/intercal.dev/roadmaps/2026-06-14-intercal-substrate-flush-out-and-flagship-experience.md`.
- [Grokipedia launch / openness](https://true-tech.net/xai-announces-grokipedia-v0-1/) · [Grokipedia (Wikipedia)](https://en.wikipedia.org/wiki/Grokipedia) · [Wikipedia vs Grokipedia accuracy/bias](https://almcorp.com/blog/wikipedia-vs-grokipedia/)
- [OpenAlex](https://openalex.org) · [OpenAlex on AWS Open Data](https://registry.opendata.aws/openalex/) · [OpenAlex paper](https://arxiv.org/pdf/2205.01833) · [SemOpenAlex (26B triples)](https://arxiv.org/pdf/2308.03671)
- [Wikidata/DBpedia/YAGO comparison](https://link.springer.com/chapter/10.1007/978-981-13-6031-2_40)
- [ConceptNet](https://conceptnet.io/) · [ConceptNet5 FAQ](https://github.com/commonsense/conceptnet5/wiki/FAQ)
- [Wikimedia Enterprise APIs](https://enterprise.wikimedia.com/api/) · [Structured Contents / On-demand](https://enterprise.wikimedia.com/docs/on-demand/) · [Abstract Wikipedia](https://en.wikipedia.org/wiki/Abstract_Wikipedia)
- [Google Data Commons FAQ (license)](https://datacommons.org/faq) · [Data Commons (Google Research)](https://research.google/pubs/data-commons/)

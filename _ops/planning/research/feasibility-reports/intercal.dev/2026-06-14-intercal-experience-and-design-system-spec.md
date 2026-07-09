# Intercal Experience & Design-System Specification

Date: 2026-06-14
Status: ON HOLD (parked 2026-06-15) — companion spec to `_ops/planning/intercal.dev/roadmaps/2026-06-14-intercal-substrate-flush-out-and-flagship-experience.md`. Parked pending studio-ui maturity; see the roadmap's Hold Note. Resume when the design system clears its real-vs-shipped audit.
Purpose: The full, decided shape of the Intercal public experience and its design-system foundation. The roadmap executes; this spec defines what "immersive, polished, uniform, globally reusable" concretely means, screen by screen and component by component, so there is no ambiguity at build time.

This spec is a design contract, not a second product spec. It assumes the substrate/contract reality in `docs/architecture/*` and the cost posture in `docs/operations/resource-budget.md`. The public host is `intercal.jami.studio` (decided 2026-06-15 — subdomain, OD1; all host references stay config-driven).

---

## 1. Product Positioning (what the experience must convey)

Intercal answers one question no retrieval wrapper or stale model can: **"Given a topic, entity, claim, or model-cutoff date — what changed since then, what evidence supports it, how confident is the system, and how compactly can that update be delivered?"** Every pixel serves that: provenance is visible, time is a first-class axis, confidence and freshness are always legible, and nothing is asserted without a citation.

Three experience principles, applied everywhere:

- **Provenance-native.** Every fact carries its citation, confidence, and freshness inline. Citations are first-class UI, not footnotes. The reader can always reach the source record.
- **Time is the primary axis.** The product is bitemporal (world time vs transaction time). The UI makes "as of when?" and "what changed since?" direct, visible controls — not hidden parameters.
- **Honest states.** Unknown, thin, stale, contradicted, and not-covered are designed, confident states — never blank screens or silent gaps. Coverage claims never exceed proven gates.

Voice: precise, calm, technical-but-legible. No hype, no fabricated certainty. Numbers are dated and cited or marked unavailable.

---

## 2. Design Language (Jami Studio tokens → Intercal theme)

Foundation is the published Jami Studio design system; Intercal consumes it and never forks it.

- **Tokens:** `@jami-studio/tokens` — DTCG → CSS variables (`--jami-*`) + Tailwind v4 `@theme` + TS. Categories in use: color (brand accent/teal, neutral-warm 0–950, semantic light/dark background/foreground/accent), typography (`--jami-typography-*`), spacing (`--jami-spacing-*`, base control 8px), radius (`--jami-radius-control` 8px), motion (`--jami-motion-fast` 120ms + slower steps), shadow (`--jami-shadow-overlay`), density (`--jami-density-comfortable`), component-state (`--jami-componentState-focusRing`), shell (`--jami-shell-dockWidth`).
- **Theming:** light/dark via the token contract (CSS custom properties; `color-scheme` + class/data-theme). A small **Intercal theme layer** (`components/intercal-theme.css`) sets brand accent, density, type scale, and a provenance/temporal accent ramp **on top of** Jami tokens. **No raw color/spacing literals in components** — tokens only.
- **Primitives:** `@jami-studio/ui` — `JamiButton`, `JamiPanel`, `JamiTextField`, `JamiDataList`, `docs-source-panel`, `media-grid`, `agent-panel` (Radix React wrappers, `styles.css`). These replace the hand-rolled `components/ui.tsx`.
- **Distribution:** install published packages; use `@jami-studio/cli` (`studio-ui init`/`add`) for any registry blocks/pages we adopt; lockfile + hash verification on. Tailwind v4 + React 19 match Intercal exactly.

Typography: a single readable type scale from the Jami typography token; a monospace ramp for IDs, code, and citation keys. Iconography: one consistent set (lightweight, tree-shakeable, token-colored). Density: comfortable default; a compact density for data-dense operator/graph views via the density token.

---

## 3. Information Architecture & Navigation

Global shell (B1): themed header with brand mark → command palette → primary nav → light/dark toggle; `main` content; footer with Coverage, Provenance model, Source policy, Docs, API/MCP, and AI exports.

- **Command palette** (⌘K / Ctrl-K): jump to any entity/topic, any route, or run a quick delta/verify. The fastest path through the product.
- **Primary nav (grouped):**
  - *Explore* — Delta, Graph, Topics, Entities, Compare
  - *Verify* — Verify claim, Search evidence
  - *State* — Freshness, Coverage
  - *Build* — Docs, API/MCP, Subscriptions
  - *(Operator lives behind auth; not in primary nav.)*
- **Breadcrumbs/anchors** on leaf pages (claim/source/entity) so the provenance path is always reversible.
- **Shareable state:** every query surface encodes its parameters in the URL (topic, since/until, token budget, as-of date) so any view is linkable and reproducible.

Responsive: single-column mobile with a collapsible nav + bottom-anchored command palette trigger; multi-column from `md`. Graph/timeline degrade to a scrollable, list-plus-sparkline form on small screens.

---

## 4. Component Vocabulary (B2 — the globally-reusable layer)

Authored token-driven and registry-shaped (upstream-ready per roadmap L10/OD2). Built on Jami primitives.

**Provenance vocabulary**

- **Citation chip** — source label + published date + link to source record; renders only `http(s)` links, else falls back to the source-document id route. Hover/expand reveals source class + policy state.
- **Evidence trail** — an expandable list of citation chips backing a claim/fact, with support strength (supports / partially / contradicts / neutral).
- **Confidence meter** — a compact, accessible 0–1 indicator with method label; never implies precision the data lacks.
- **Freshness badge** — last-updated + last-ingested + coverage, with stale/unknown variants.
- **Source-policy state** — the standing note that public surfaces show citation metadata + policy-allowed snippets only; raw bodies stay out.
- **As-of / point-in-time control** — a date control that sets world-time vs transaction-time evaluation, shared by entity/verify/graph.
- **Token-budget control** — a slider/stepper (200–8000, default 1500) that drives delta/digest size, with a live "included/omitted/coverage" report.

**Data-state set** (every data surface uses these, designed + accessible + themed)

- Skeleton/loading · Empty · Unknown/not-covered · Thin · Stale · Contradicted · Error.

**Layout/composition**

- Page header (eyebrow/title/description), Panel, DataList (Jami), result cards, inspector drawer (for graph/timeline nodes), comparison split, stat tiles.

---

## 5. Visualization System (B3)

Behind thin Intercal wrappers themed entirely by tokens; client islands with SSR-safe skeleton shells; `prefers-reduced-motion` honored.

- **Bitemporal knowledge graph** (`@xyflow/react`, MIT): nodes = entities (typed, colored by entity-type token ramp), edges = typed relationships. Controls: time scrubber (toggle world-time vs transaction-time), entity-type + relationship-type filters, focus/expand, contradiction highlighting. Node/edge click opens an **inspector drawer** with the entity/relationship state, evidence trail, confidence, and freshness. Performance: virtualize/throttle, cap initial node count with progressive expansion, lazy-load the island; keep INP < 200ms, CLS < 0.1.
- **Delta timeline / change-stream** (`visx`, MIT): cited changes across the `(since, until]` window, ranked by recency/confidence/evidence, scrubbable; shows the included/omitted/coverage report from `get_delta`. Embeddable as a compact strip in entity/topic/compare and the home hero.
- **Freshness/coverage charts** (`visx`): coverage by source class/topic cluster/date range, citation depth, contradiction state, review-needed rate — with explicit gap markers (no zero-filling unknowns).
- **Compare visualization:** side-by-side change-volume + freshness + coverage for two topics.

Color encodes meaning consistently (entity types, support strength, freshness, contradiction) via dedicated token ramps; never color alone — pair with shape/label for accessibility.

---

## 6. Screen-By-Screen Experience Specs

Each lists the data source (existing query primitive), the interaction model, and required states. All consume `@intercal/sdk` / `@intercal/core` only.

- **`/` Home (public front door).** *Data:* `get_delta` (live hero). *Experience:* hero asks "What changed since your model's cutoff?" with a date control + topic and a live, cited delta strip against the real corpus; below: the provenance/time/honesty narrative, canonical examples, and grouped entry points. SSR, fast LCP, the delta strip hydrates as an island. *States:* hero shows a curated default delta when no input; honest "thin/unknown" if corpus is sparse.
- **`/ai-history` Narrative.** *Data:* `get_delta`/`search_evidence` over the AI-history corpus. *Experience:* scrollable cited timeline of the GPT-era story (Nov 2022→) — the flagship public-consumption read. *States:* sections show coverage badges; uncovered eras marked explicitly.
- **`/delta` Delta briefing.** *Data:* `get_delta`. *Experience:* topic + since/until + token-budget controls; ranked cited change set; included/omitted/coverage report; cached digest (when A1 lands); copy-as-citation; shareable URL. *States:* full set; emphasize budget-trim transparency.
- **`/graph` Knowledge graph.** *Data:* `get_delta`/`get_entity` (+ `get_relationships`/`get_timeline` if added via contract). *Experience:* §5 graph + timeline, inspector drawer, filters, time scrubber. *States:* skeleton → progressive load; empty/thin for sparse topics.
- **`/entity`, `/entity/[name]` Entity dossier.** *Data:* `get_entity`, `get_sources`. *Experience:* identity header (type, aliases, external ids), state-at-date (as-of control), relationships (mini-graph), freshness meter, evidence trail, claim list. *States:* unknown entity → guided search; deprecated/merged → redirect with provenance note.
- **`/topic`, `/topic/[name]` Topic explorer.** *Data:* `get_freshness`, `get_delta`, `search_evidence`. *Experience:* topic timeline, freshness, evidence search, related entities, related clusters. *States:* uncovered topic → explicit not-covered with nearest covered suggestions.
- **`/verify` Verify claim.** *Data:* `verify_claim`. *Experience:* claim input + as-of date; verdict (supported/partial/contradicted/unverified) with confidence meter; supporting vs contradicting evidence columns. *States:* no on-topic evidence → `unverified`, confidence 0, never invented support.
- **`/search` Evidence search.** *Data:* `search_evidence`. *Experience:* query-as-you-go, date-window, policy-gated ranked cited snippets, source-class filter. *States:* policy-restricted results show citation-only treatment.
- **`/compare` Compare topics.** *Data:* `get_delta`, `get_freshness`. *Experience:* two-topic split with visualized change volume, freshness, coverage. *States:* per-side honest gaps.
- **`/freshness`, `/coverage` State dashboards.** *Data:* `get_freshness`, `@intercal/core` coverage report (A4). *Experience:* visualized recency + corpus-quality gate snapshot grouped by class/cluster/date; failed-check gaps surfaced. *States:* unavailable telemetry shown as unavailable, not zero.
- **`/claim/[id]`, `/source/[id]` Provenance leaves.** *Data:* `get_sources`. *Experience:* the citation path; source-record state preserving policy limits (no raw body). *States:* policy/redaction states explicit.
- **`/docs`, `/docs/[slug]` Docs.** *Data:* source-owned Markdown + generated OpenAPI + `llms.txt`. *Experience:* first-class reading layout (sidebar, anchors, code blocks, copyable examples), themed `docs-source-panel`.
- **`/subscriptions`, `/feedback`, `/operator` Authed.** *Data:* SDK subscription methods (A2), `submitFeedback`, `@intercal/core` observability/audit (read). *Experience:* API-key subscription create/poll/delete; audited feedback; auth-gated read-only operator console with provider-consumption/audit/review viz. *States:* operator locked without credential; key never persisted/echoed.
- **Machine surfaces:** `/api/v1/*`, `/api/openapi.json`, `/api/mcp`, `/llms.txt`, `/llms-full.txt`, `/sitemap`, `/robots`, `/opengraph-image` — contracts unchanged; OG image + JSON-LD restyled to tokens.

---

## 7. Motion

CSS-first off `--jami-motion-*` tokens: state transitions (120ms fast), panel/drawer reveals, skeleton shimmer, scrubber feedback. `motion` (Framer, MIT) is reserved for orchestrated sequences only (home hero reveal, graph layout settle, timeline scrub). Everything is `prefers-reduced-motion`-gated to instant, non-animated equivalents. No motion that conveys information without a static fallback.

---

## 8. Accessibility (WCAG 2.2 AA — non-negotiable)

- Complete keyboard operability incl. the command palette, graph (focusable nodes/edges, keyboard pan/zoom alternatives), timeline scrubber, and all controls.
- Visible focus via `--jami-componentState-focusRing`; logical focus order; skip-to-content link; correct landmarks (`header`/`nav`/`main`/`footer`).
- Color is never the sole carrier of meaning (entity type, support strength, freshness, contradiction also use shape/label/text).
- Contrast ≥ AA in light and dark; reduced-motion honored; forms have labels, descriptions, and accessible error messaging.
- Charts/graph expose accessible names + a data-table/text fallback for the same information.
- Verified with `axe` in CI and manual keyboard/screen-reader passes on key routes.

---

## 9. Performance (Core Web Vitals "good")

- Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1 on `/`, `/ai-history`, `/delta`, `/graph`, `/entity/[name]`, `/docs`.
- Server-Components-first; stream above-the-fold; defer/lazy-load viz islands; reserve space to avoid layout shift (skeletons sized to content).
- Token CSS + Jami styles loaded once; tree-shake icons; code-split graph/timeline libs; cache static/docs aggressively; image/OG via `next/og`.
- Lighthouse CI (local/free) gates perf + a11y + SEO on key routes.

---

## 10. SEO / AI Discoverability

- Per-route `generateMetadata`, canonical URLs (host-agnostic via `lib/seo.ts`), JSON-LD (`WebSite` + per-entity/claim structured data), restyled OG images, `sitemap`/`robots` with `noindex` on authed routes.
- AI exports (`llms.txt`/`llms-full.txt`) stay in parity with public docs (`pnpm docs:check`).
- Public coverage/freshness claims rendered from real gate data only (A4) — discoverability never overstates coverage.

---

## 11. Globally-Reusable & Convergence (OD2)

The registry today ships **no** graph/canvas/timeline/knowledge-graph surface (it has primitives, data-list/media-grid, the provenance-flavored `docs-source-panel` + research-writing citations/sources blocks, and the four workspaces). So there are two layers: a **generic viz surface** (graph/canvas/timeline — domain-neutral plumbing that clearly belongs in the registry) and Intercal's **prov/temporal semantics** (citation chip, evidence trail, confidence/freshness, bitemporal scrubber) composed on top.

Decided two-phase pattern (OD2): (1) build the surfaces in Intercal now as token-driven, registry-shaped wrappers (§4–§5) — pure downstream, does not touch `studio-ui`; prove them in production; (2) upstream the **generic surface** to the `studio-ui` registry as official `@jami-studio` items once `studio-ui`'s in-flight work settles, keeping Intercal's domain composition local. Only the upstream *timing* is open. Uniformity with the flagship products is already guaranteed today through the shared `@jami-studio/tokens` + `@jami-studio/ui` foundation; this just makes Intercal the proving ground that earns the registry its graph/canvas surfaces.

---

## 12. Definition Of Done (experience)

- Every route in §6 rebuilt on Jami tokens + `@jami-studio/ui` + the Intercal vocabulary; `components/ui.tsx` retired.
- Immersive graph + timeline live on `/graph` and embedded where specified, over real corpus data, within the perf budget.
- Every data surface has designed loading/empty/unknown/thin/stale/contradicted/error states.
- WCAG 2.2 AA + CWV "good" verified on key routes; reduced-motion honored.
- Public surface read-only and host-agnostic; authed boundaries intact; OG/structured data themed; AI exports in parity.
- No raw color/spacing literals; no UI-only invented data; no changes to `studio-ui`.

# Rebuild — Feasibility Reports (final-shape pre-planning)

**Stage:** the end-to-end, final-shape pre-planning layer. Each report owns one
responsibility/concern, **canons down** from the `research/` trail, and **cements the
remaining peripheral decisions** for its corner. This is the working surface we plan and
implement against.

**Two layers, clean separation:**

- **`../research/` = the thinking layer (preserved).** History, fact-finding, and the living
  **Operating Canon** (`research/00-orchestration/plan.md`) + **System map**
  (`research/00-orchestration/synthesis.md`). Stays as "how we got here & why."
- **`docs/reports/` = the final-shape spec (this).** Cohesive, decisive, implementation-oriented.
  Cites research sources; does not repeat them.

**Status:** AUTHORED 2026-06-02 — full single-author pass complete across F01–F24 (all 8 sections fleshed; dependencies cross-linked by F## id; drift-prone facts dated). Open founder calls flagged `> needs Jamie` in §4; no canon-change flags raised.

---

## The set (24 reports, 5 domains)

Reports are grouped into per-domain subdirs (`A-…` … `E-…`); cross-references between reports use the bare `F##` id.

### A · Platform foundations → `A-platform-foundations/`

- [F01 — System topology & repo strategy](A-platform-foundations/F01-system-topology-and-repo-strategy.md) (incl. skills & tooling posture)
- [F02 — Identity & access](A-platform-foundations/F02-identity-and-access.md)
- [F03 — Secrets, config & deploy pipeline](A-platform-foundations/F03-secrets-config-and-deploy-pipeline.md)
- [F04 — Hosting & infrastructure](A-platform-foundations/F04-hosting-and-infrastructure.md)

### B · Agent substrate (`@jami-studio/*`) → `B-agent-substrate/`

- [F05 — Harness (runtime)](B-agent-substrate/F05-harness-runtime.md)
- [F06 — Governance, policy & audit](B-agent-substrate/F06-governance-policy-and-audit.md)
- [F07 — Data & entitlement plane](B-agent-substrate/F07-data-and-entitlement-plane.md)
- [F08 — Transport & interop](B-agent-substrate/F08-transport-and-interop.md)
- [F09 — UI registry & render seam](B-agent-substrate/F09-ui-registry-and-render-seam.md)
- [F10 — Orchestra & dev-system](B-agent-substrate/F10-orchestra-and-dev-system.md)

### C · Capability adapters (the seams) → `C-capability-adapters/`

- [F11 — Provider, inference & real-time](C-capability-adapters/F11-provider-inference-and-realtime.md)
- [F12 — Billing & payments](C-capability-adapters/F12-billing-and-payments.md)
- [F13 — Platform adapters](C-capability-adapters/F13-platform-adapters.md) (comms · observability · storage · media)

### D · Distribution, products & AX → `D-distribution-products-ax/`

- [F14 — Distribution, open-core & the Kit](D-distribution-products-ax/F14-distribution-open-core-and-the-kit.md)
- [F15 — Agent discoverability (AX)](D-distribution-products-ax/F15-agent-discoverability-ax.md)
- [F16 — Products](D-distribution-products-ax/F16-products.md) (yrka · Intercal · Collective · jami.studio · jnh.org)

### E · Operations & go-to-market (grounded by `../research/14-operations/proposal.md`) → `E-operations-gtm/`

- [F17 — Operations Canon](E-operations-gtm/F17-operations-canon.md) (the single source-of-truth system → projections) · _Stage-0, deep_
- [F18 — Brand & identity](E-operations-gtm/F18-brand-and-identity.md) · _Stage-0, deep-ish_
- [F19 — Marketing & content](E-operations-gtm/F19-marketing-and-content.md) · _staged (Stage 1)_
- [F20 — Funding, grants & the pitch](E-operations-gtm/F20-funding-grants-and-pitch.md) · _Stage-0, deep_
- [F21 — Sales & GTM motion](E-operations-gtm/F21-sales-and-gtm.md) · _staged (Stage 4)_
- [F22 — Legal, compliance & IP](E-operations-gtm/F22-legal-compliance-and-ip.md) · _Stage-0, deep_
- [F23 — Finance & ops](E-operations-gtm/F23-finance-and-ops.md) · _staged (Stage 4)_
- [F24 — Community & support](E-operations-gtm/F24-community-and-support.md) · _staged (Stage 2)_

---

## Per-report template (every report follows this shape)

```
Header: Status · Domain · Owner · Canons-from (research/) · Related reports
1. Scope & responsibility (in / out)
2. Committed decisions (from canon)
3. Architecture & mechanics (end-to-end; the contracts & seams)
4. Remaining peripheral decisions to cement   ← the heart of this stage
5. Dependencies & interfaces (cross-report links)
6. Verification & closing criteria (definition of done)
7. Risks & verify-at-build (drift-prone facts, dated)
8. Sources
```

## Open decisions (`needs Jamie`) — consolidated from the set's §4s

The reports cement every derivable decision; these are the genuine creative / scope / expert calls left open (each lives in the cited report's §4). **Status: AUTHORED — set complete; these are the periphery to close on Jamie's clock.**

**Creative — one naming sweep** (canon §4): SaaS suite names · Intercal/Collective product names · etymara + free-tool names · the CLI name. → F01, F16, F18, F21.
**Creative — visual + narrative:** the visual identity itself (logomark/palette/type) → F18 · the pitch deck's narrative voice + theme → F20.
**Scope — pricing/packaging:** per-suite pricing numbers → F21 · Kit price + packaging + firm placement under yrka → F14 · billing default provider (MoR-leaning, couples to pricing) → F12.
**Expert-gated:** entity TYPE + tool + incorporation timing → **CPA** (QSBS clock) → F22 · license confirmation (Apache / MIT→Apache notices / DCO / MakerKit clean-room) → **IP counsel** → F14.
**Quick founder prefs:** banking provider (Mercury recommended) → F23 · funding-program prioritization → F20.
**Resolved to default (no action):** founder-facts DRY shape = one org-lane `founder.yaml` → F17.

## Authoring plan

One cohesive agent authors the full set against the canon + synthesis + research (single
author = consistent voice, cross-references, and decisions — not fragmented). Each report:
states committed decisions from canon, specs the mechanics end-to-end, **drives its §4
peripheral decisions to closure**, cross-links dependencies, dates any drift-prone fact, and
cites its `research/` sources. The canon stays authoritative; reports never contradict it
(if a report surfaces a needed change, it's raised, not silently diverged).

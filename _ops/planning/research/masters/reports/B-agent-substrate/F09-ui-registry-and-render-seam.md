# F09 — UI registry & render seam

Status: AUTHORED 2026-06-02 · Domain: B · Agent substrate (`@jami-studio/ui`)
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/12-agent-native/{ui-registry-appearance.md,deep-dives/shadcn-as-agent-registry.md}`, `../../research/00-orchestration/{plan,synthesis}.md` (UI registry distribution + render seam; research #1 + #6)
Related: F05 (harness emits payloads), F08 (stream), F15 (registry = AX surface)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

How UI is distributed and how agent-emitted UI renders. **In:** design system, registry distribution, the runtime render contract. **Out:** transport (F08).

## 2. Committed decisions (from canon)

- **Two registries, two lifecycles.** (1) **Build-time SEED** = shadcn registry (`registry:base`, namespaced `@jami-studio`, MCP + `shadcn/skills`; source-inlining, not a runtime). (2) **Runtime CONTRACT** = app-resident **allowlisted component registry**: harness emits **`UIPayload` (data, not code: `{component, props, children?}`)** → name∈registry → Zod-validate → render resident component → graceful fallback.
- **Fully tokenized design system** (accent = token, never hardcoded); primitive vocabulary distilled from agent-native's 23 shadcn copies.
- **AG-UI + native SSE carry the stream** (channel, not renderer). **MCP-UI iframes = untrusted lane only.**
- Build on shadcn's official registry (pin `shadcn@>=4.10.0`); **we own item versioning** (shadcn has none).

## 3. Architecture & mechanics

**Two registries, two lifecycles — never conflated.**

1. **Build-time SEED (the shadcn registry).** `registry:base` installs the **tokenized design system + primitive component vocabulary** *resident in the app* — at scaffold/CI time, **never in the agent's request path**. Distributed **on shadcn's official registry mechanism** (namespaced `@jami-studio`, `registryDependencies` graph, the shadcn MCP server + `shadcn/skills` making agents first-class consumers). This is **source-inlining, not a live runtime**. Distilled from agent-native's 23 duplicated shadcn copies into one shared vocabulary.

2. **Runtime CONTRACT (the render seam).** The harness emits a **`UIPayload` that is data, never code**:

```ts
type UIPayload = { component: string; props: Record<string, unknown>; children?: UIPayload[] }
```

The renderer: **name ∈ resident allowlist registry → validate props (Zod per component) → render the resident component**. Unknown name or failing props → **graceful fallback, never crash**. The resident registry is an **allowlist by construction** — the agent can only name components the app already shipped; it cannot inject code, HTML, or `dangerouslySetInnerHTML`. Prop values are sanitized into URL/HTML-ish slots.

**Why this shape.** It's the convergent 2026 pattern (Vercel AI SDK `tool-*`+Zod, Google **A2UI** "trusted catalog", CopilotKit Pattern Registry, Thesys/Crayon "spec not code"): *safe like data, expressive like code.* We borrow **A2UI's JSON payload model** for the `UIPayload` shape (no dependency on it). **MCP Apps / MCP-UI (iframe HTML) is the WRONG shape for the core** — it bypasses the design system; kept only as a separate **untrusted third-party** lane (F08), never the trusted seam.

**Tokens.** Fully tokenized design system — **accent color is a token, never a hardcoded value** (the agent-native fork's 6 hardcoded accent tints → a tokenized generator, F05). Tokens resolve via CSS custom properties (`cssVars`); a theme is a token set, parameterized end-to-end (canon §0 root-correctness applied to design).

**The stream is a channel, not a renderer.** `UIPayload`s ride the **native-SSE spine** internally + **AG-UI** externally (F08) — the transport carries the payloads; the resident registry renders them. seq-replay (F08) gives the renderer recovery on reconnect/late-attach.

**Version skew (the dominant risk — SDUI lesson, Airbnb/Lyft).** Two axes:
- **Vocabulary version** — build/deploy-pinned. shadcn has **no first-class item versioning**, so **we own it**: each registry item carries `meta.version` (F01 convention); changes are **additive-only** within a vocabulary generation.
- **Payload-contract version** — runtime. The harness **learns the app's vocabulary version via a handshake** on connect; it emits only payloads the app can render; unknown → graceful degrade. Resolve the contract before foundations are built.

**Install-vs-runtime split (explicit).** Install/CI: shadcn `registry:base` inlines source → resident components + tokens. Runtime: the harness emits `UIPayload` data → the resident renderer renders. shadcn never sits in the request path.

## 4. Remaining peripheral decisions to cement

- **`UIPayload` schema (cemented):** `{ component, props, children? }`, A2UI-modeled, Zod-validated per component, graceful fallback.
- **Vocabulary-versioning convention (cemented):** `meta.version` per registry item (F01), additive-only within a generation.
- **Version-skew handshake (cemented):** harness learns the app's vocabulary version on connect; emits only renderable payloads; unknown → degrade.
- **Install-vs-runtime split (cemented):** shadcn seeds at build, renderer runs at runtime; shadcn never in the request path.

## 5. Dependencies & interfaces

- **F05 (harness)** — emits `UIPayload`s; the version handshake is harness↔app.
- **F08 (transport)** — payloads ride native SSE / AG-UI; seq-replay gives render recovery.
- **F01 (distribution)** — `@jami-studio/ui` ships on shadcn's registry; `meta.version` convention lives in F01.
- **F15 (AX)** — the registry is itself an AX surface (agents are first-class shadcn-registry consumers via the MCP server).
- **F16 (products)** — every yrka suite App + free-tool composes this vocabulary; one shared registry.

## 6. Verification & closing criteria

- `registry:base` installs the tokenized design system + primitive vocabulary at scaffold/CI; shadcn is absent from the runtime request path.
- The harness emits a `UIPayload`; the resident renderer validates props (Zod) and renders the allowlisted component; an unknown name/bad props → graceful fallback, no crash.
- No payload can inject code/HTML/`dangerouslySetInnerHTML`; prop values are sanitized.
- Accent color (and every theme value) is a token; a theme swap is a token-set change with zero component edits.
- The vocabulary handshake reports `meta.version`; the harness withholds payloads the app can't render; additive registry changes don't break an older app.
- MCP-UI iframe content is confined to the untrusted lane.

## 7. Risks & verify-at-build (dated, 2026-06-02)

- shadcn registry surface moves fast (4× in 2 weeks); no first-class item versioning; source-inlining ≠ runtime — confirm install-vs-runtime.

## 8. Sources

- `12` ui-registry + shadcn-as-agent-registry, canon §2 (UI registry distribution + render seam), research #1 + #6.

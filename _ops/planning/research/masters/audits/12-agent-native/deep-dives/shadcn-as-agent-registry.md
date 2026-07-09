# Deep-dive — shadcn as our tokenized, agent-accessible registry

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).


Date: 2026-06-01
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Status: Research (locks nothing). Grounds the `@jami-studio/ui` UI Registry decision in the
adoption brief (`../recommendation.md` §5) and the canon (`../../00-orchestration/plan.md`).
Evidence: local clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`
(`@agent-native/core` v0.23.0) + official shadcn 2026 docs (dated inline).

---

## 1. Committed read

**shadcn is the right base, and as of CLI v4 (March 2026) it is no longer "just a component
library" — it is a first-class, agent-aware *distribution system*. We build ONE owned registry
(`@yrka` / `@jami`) as the single real build; every surface — chat panel, main workspace, the
23-template corpus, future products — consumes that one registry. We do NOT re-vendor shadcn per
app (that 23×-duplication is exactly the gap `ui` closes).**

The split, by layer:

1. **Distribution = shadcn registry, owned namespace.** A `registry.json` we author, built with
   `shadcn build`, served as flat JSON, referenced everywhere via the `registries` namespace map
   in `components.json`. This is the one real build. shadcn's CLI/MCP/schema are official canon we
   *consume, never maintain* (canon §1).

2. **Tokenization = shadcn's Tailwind-v4 CSS-var model + a thin owned design-tokens layer on top.**
   shadcn already tokenizes color/radius/charts/sidebar as OKLCH CSS vars and (v4) ships **presets**
   (shareable color/theme/font/radius bundles). We add the parts it does *not* tokenize out of the
   box — typography scale, spacing, shadow/elevation, motion — as our own `cssVars`/`registry:base`
   item so "everything is uniform and fully adjustable" holds at the root (canon §0). This *replaces*
   agent-native's 6 hardcoded preset tints (`client/appearance.ts`) with a generated, parameterized
   token set — the root-fix the brief already flagged.

3. **Agent-accessibility = shadcn primitives are the *rendering target*, not the agent contract.**
   shadcn components are React/Radix code; an agent cannot "target a Button" by shipping React. The
   bridge is the **owned SDUI vocabulary** (`ui.tree.render` / `ui.action.invoke`, committed in 06 §6)
   carried over **AG-UI**, plus **MCP-UI / A2UI** for sandboxed generative-UI payloads. shadcn is
   **primed at the token layer** (its CSS vars are *already* piped into the MCP-UI iframe host —
   proven in the clone) but is **NOT primed at the contract layer**: we add a **thin per-primitive
   manifest** (props/variants/actions the agent may target) that maps a `ui.tree` node to a registry
   component. That manifest is small, declarative, and lives beside the registry — it is the seam, and
   it is ours to author.

**Net:** base = shadcn (registry + tokens + primitives); the one real build = our namespaced registry
+ the design-tokens base item + the per-primitive SDUI manifest; the bridge = `ui.tree.render` over
AG-UI for native React surfaces, MCP-UI iframes for sandboxed/untrusted UI — both already standards-based
in the clone.

---

## 2. Direct answers

**Q: Is shadcn the right fit?** Yes, decisively. It is the industry baseline (canon's "trusted community
baseline"), MIT, framework-agnostic registry, and — critically as of v4 — explicitly built "for you and
your coding agents" (skills + MCP + presets). Nothing else gives us a tokenized component system *and* a
maintained agent-facing distribution/discovery layer for free.

**Q: Can we publish ONE owned registry consumed across all surfaces?** Yes — this is the headline
capability. `registry.json` (authored) → `shadcn build` → flat `public/r/*.json` → referenced via the
`registries` namespace map. v4 also lets us **compose** a large registry across multiple `registry.json`
files (`include`, flattened at build). One registry, every surface (chat, workspace, the 23 reference
apps, products). Cross-registry deps work (`registryDependencies: ["@shadcn/card", "@yrka/data-table"]`),
and private/auth registries are supported (`headers` + `${ENV}` token expansion) — directly relevant to
the per-org-isolation reality (each org can host/auth its own registry endpoint; the contract is identical).

**Q: How far does it tokenize, and what do we add?** Out of the box (2026): **color** (full
background/foreground semantic pairs, `--destructive`, `--border/--input/--ring`, **6 sidebar vars**,
**`--chart-1..5`**), **radius** (base `--radius` deriving `sm/md/lg/xl/2xl/3xl/4xl`), all in **OKLCH**,
with `cssVariables: true` + new base colors (Neutral/Stone/Zinc/**Mauve/Olive/Mist/Taupe**) and v4
**presets**. NOT tokenized out of the box: **typography scale, spacing, shadow/elevation, motion**. Those
are what our owned design-tokens layer (a `registry:base` item) adds — giving the "fully adjustable
everything, uniform" Jamie wants, expressed as `cssVars` the registry ships and every surface inherits.

**Q: Agent-accessible — primed, or do we add a contract?** Both, by layer. **Token bridge: already
primed** — the clone's `McpAppRenderer.tsx` reads shadcn's computed CSS vars (`--background`, `--muted`,
`--foreground`, `--border`, `--radius`, `--font-sans/-mono`) and injects them as
`host.styles.variables` into the MCP-UI iframe, so agent-rendered UI inherits the token theme today.
**Contract bridge: we add it** — a thin per-primitive manifest (the props/variants/actions schema an
agent targets) is *not* in shadcn and *not* in agent-native; it is the `ui` build. shadcn's v4
**skills** give agents install/usage context for the registry, but skills are authoring-time help, not
a runtime render contract — they do not replace the SDUI manifest.

---

## 3. Evidence

### Local clone (agent-native — what's there, what's missing)
- **No `registry.json` anywhere; 23 `components.json` files** (one per template), each re-vendoring
  ~49–50 shadcn copies → confirms "just shadcn, not a registry." `find . -name registry.json` = 0;
  `find . -name components.json` = 23.
- **Token contract is real and shadcn-shaped** but pre-2026:
  `packages/core/src/styles/agent-native.css` — Tailwind-v4 `@theme` mapping
  `--color-*: hsl(var(--*))` for the full shadcn token set incl. sidebar; `--radius-sm/md/lg` derived
  from `--radius`. Uses **HSL `hsl(var(--…))`, not the current OKLCH model** → adopting our *own*
  registry lets us move to OKLCH cleanly rather than inherit the older format.
- **A sample components.json** (`dist/templates/default/components.json`):
  `"baseColor": "slate"`, `"cssVariables": true`, `aliases` for `components/ui/lib/hooks` — the older
  single-registry shape, no `registries` namespace map. This is exactly what our `@`-namespaced
  `components.json` upgrades.
- **Token→agent-UI bridge ALREADY EXISTS** (the load-bearing find):
  `packages/core/src/client/mcp-apps/McpAppRenderer.tsx` `buildHostContext()` (lines ~368–419) reads
  `getComputedStyle(document.documentElement)` for `--background/--muted/--foreground/--border/--radius/
  --font-sans/--font-mono` and passes them as `host.styles.variables` (`--color-background-primary`,
  `--color-text-primary`, `--border-radius-md`, …) into the sandboxed iframe via the standard
  `@modelcontextprotocol/ext-apps` `AppBridge` + `PostMessageTransport`. It also forwards `theme`
  (light/dark), `displayMode: "inline"`, `containerDimensions`, and wires `oncalltool` →
  `/_agent-native/mcp/apps/call-tool`. **This is the existing proof that shadcn tokens flow into
  agent-rendered UI; we generalize it, not invent it.**
- **The slot model for "agent builds a widget into a surface"** is also present:
  `packages/core/src/client/extensions/ExtensionSlot.tsx` — named slots
  (`<app>.<area>.<position>`), install/available endpoints, and `sendToAgentChat("Create a new widget
  that fits in slot …")`. This is the seam the **workspace artifact panel** plugs into: a slot the agent
  renders registry-driven UI into.
- **Appearance = 6 hardcoded enum tints** to replace: `packages/core/src/client/appearance.ts`
  `APPEARANCE_PRESETS` (default/warm/ocean/forest/rose/slate) + the `:root[data-appearance="…"]` blocks
  in `agent-native.css` (lines 150–233). Keep the `data-appearance` + `application_state.appearance`
  write-path (server→DOM sync in `useAppearanceSync`); replace the fixed enum with our generated token set.

### Official shadcn 2026 sources (dated)
- **Registry is a "distribution system for code," framework-agnostic** — `ui.shadcn.com/docs/registry`
  (fetched 2026-06-01).
- **`registry-item.json` schema** — `ui.shadcn.com/docs/registry/registry-item-json` (fetched 2026-06-01).
  Fields incl. `name, title, description, type, author, files[]{path,type,target}, dependencies,
  devDependencies, registryDependencies, cssVars, css, tailwind (deprecated→use cssVars for v4),
  envVars, font, docs, categories, meta`. **Type enum:** `registry:base`, `registry:block`,
  `registry:component`, `registry:font`, `registry:lib`, `registry:hook`, `registry:ui`, `registry:page`,
  `registry:file`, `registry:style`, `registry:theme`, `registry:item`. → `registry:base` is our
  design-tokens layer; `cssVars`/`css` carry the owned tokens; `registryDependencies` lets primitives
  compose; `meta` can carry our per-primitive agent manifest.
- **Namespaces + auth** — `ui.shadcn.com/docs/registry/namespace` (fetched 2026-06-01). `registries` map
  in `components.json`: `"@yrka": "https://registry.yrka.io/r/{name}.json"`; object form with
  `headers: {"Authorization": "Bearer ${REGISTRY_TOKEN}"}` (env-expanded, never logged); install
  `shadcn add @yrka/button`, inspect `shadcn view @yrka/button`. Cross-registry `registryDependencies`.
  → directly supports per-org isolated registry endpoints with per-org auth.
- **MCP server** — `ui.shadcn.com/docs/registry/mcp` (fetched 2026-06-01). "Works out of the box with
  any shadcn-compatible registry"; serve a root `registry.json`; configure the same `registries` map;
  init via `shadcn mcp init --client claude`. Agents can list/inspect/install registry items. → our owned
  registry is agent-discoverable for free at authoring/install time.
- **CLI v4 (March 2026)** — `ui.shadcn.com/docs/changelog/2026-03-cli-v4` (fetched 2026-06-01). Headline:
  **shadcn/skills** (agent context), **presets** (shareable color/theme/font/radius bundles),
  `--dry-run/--diff/--view`, project templates (Next/Vite/Laravel/RR/Astro/TanStack), `--monorepo`,
  `--base` to pick **Radix *or* Base UI** primitives, `shadcn info`/`shadcn docs`, and first-class
  **`registry:base` + `registry:font`** for distributing whole design systems. "Built for you and your
  coding agents."
- **`shadcn build`** — `ui.shadcn.com/docs/cli` + getting-started (fetched 2026-06-01).
  `shadcn build [registry]` (default `./registry.json`) → `-o ./public/r`; v4 resolves `include`d
  registries and writes a flattened `registry.json`.
- **Theming/OKLCH** — `ui.shadcn.com/docs/theming` (fetched 2026-06-01). OKLCH; full token list above;
  radius scale to `4xl`; `cssVariables`/`baseColor`; typography/spacing/shadows **not** tokenized OOTB.
- **Versioning note:** "shadcn 3.0 introduced namespaced registries" (community/LogRocket/Tailkits,
  2026); the official changelog labels the current line **CLI v4 (March 2026)**. Treat **CLI v4 / the
  v3+ registry generation** as current; pin the exact CLI version at build time.

### Canon alignment (the bridge target)
- `../../06-rebuild-feasibility/report.md` §6: transports = **MCP** (tools) / **A2A** (inter-agent) /
  **AG-UI** (agent↔UI) / **A2UI + MCP Apps** (portable UI payloads over AG-UI); the **owned semantic
  vocabulary** `ui.tree.render` / `ui.action.invoke` rides over them, versioned + audited. `ui`
  owns "design tokens; the primitive component vocabulary; the SDUI/action payload schema." This deep-dive
  fills in *what that vocabulary renders into*: our shadcn-based registry.

---

## 4. The exact seams / difficulty

| Seam | What we build | Difficulty |
|---|---|---|
| **The one registry** | Author `registry.json` (`@yrka`/`@jami` namespace), `shadcn build` → flat JSON, host per org (auth via `headers`+`${ENV}`). Every `components.json` references it via `registries`. | **Low** — official, declarative; the work is curating items, not tooling. |
| **Design-tokens base layer** | A `registry:base` item carrying `cssVars`/`css` for the OOTB-missing axes (typography scale, spacing, shadow/elevation, motion) + OKLCH color/radius. Replaces `appearance.ts`'s 6 tints with a generated, parameterized set. | **Moderate / root-fix** — this is the "fully adjustable, uniform" work; the canon's accent-generator already lives here. |
| **Per-primitive SDUI manifest** | Per registry component, a small schema: which props/variants/slots/actions an agent may target, mapping a `ui.tree` node → registry component + props, and `ui.action.invoke` → component event. Store in registry-item `meta` (or a sibling file). | **Moderate** — net-new contract, but thin and declarative; **this is the actual gap**, not the components. |
| **Native render path (chat + workspace)** | A `@jami-studio/ui` `<UiTreeRenderer>` that resolves a `ui.tree` over **AG-UI** against the registry + manifest and renders real React/shadcn into both the chat panel and a workspace slot. | **Moderate** — generalize the existing slot/render machinery (`ExtensionSlot`). |
| **Sandboxed render path** | Reuse `McpAppRenderer` (MCP-UI iframe) verbatim for untrusted/generative UI; it already inherits tokens. | **Trivial / adopt-as-is** — already standards-based and token-aware. |
| **Token→iframe bridge** | Generalize `buildHostContext()` to emit the *full* owned token set (typography/spacing/shadow), not just the 7 it forwards today. | **Low** — extend an existing function. |
| **Dual-surface layout** | Chat panel = follows the user (the existing `AssistantChat`/`AgentPanel` surface, transport rebound to AG-UI per the brief). Workspace = split-panel/draggable/collapsible artifact panel; the artifact panel is a slot the `UiTreeRenderer` + `McpAppRenderer` render into. | **Moderate** — layout shell is product work; the render plumbing is the shared registry + the two paths above. |

**Sequencing:** registry + tokens first (the substrate), then the SDUI manifest + `UiTreeRenderer`
(the contract), then the dual-surface layout consuming both. The sandboxed path is free today.

---

## 5. Honest downsides / limitations

- **The agent contract is ours to invent and maintain.** shadcn distributes/themes/discovers; it has
  **no runtime "agent renders a Button" contract.** The per-primitive SDUI manifest + `UiTreeRenderer`
  are net-new and are the place bloat or drift can creep in. Keep the manifest *thin* (props/variants/
  actions only) and version it with the registry. v4 **skills** help agents *author/install*, not
  *render at runtime* — do not conflate them.
- **Two render paths is a real, permanent split.** Native (`ui.tree`→React, themed, fast, trusted) vs
  sandboxed (MCP-UI iframe, isolated, for untrusted/generative UI). Worth it (security boundary), but
  it is two code paths to keep token-consistent — mitigated by the single token source feeding both.
- **shadcn is "copy-in," not a versioned dep.** `add` copies source into the consumer. Across many
  org-isolated surfaces, a primitive bugfix must be re-pulled per surface. The owned registry + CLI
  `--diff`/update flow manages this, but it is genuine upkeep, not `npm update`.
- **Token-model migration.** The clone is HSL + `baseColor: slate`; current shadcn is OKLCH + new base
  colors. Our registry should be authored OKLCH-native from day one — clean since we don't inherit the
  clone's CSS, but it means the 23 templates are reference-only for *structure*, not copy-paste for tokens.
- **Radix vs Base UI fork (v4 `--base`).** A real upfront decision (primitive engine) that affects every
  registry item; pick once, register it as the registry's base, don't mix.
- **Per-org registry hosting is now infra.** Per-org isolation means each org may host/auth its own
  registry endpoint. The shadcn contract is identical per org (good), but it is N endpoints to stand up,
  not one — fits the "each org runs its own" reality but is operational surface to plan.

## 6. Could not verify

- **Exact current shadcn CLI version string / npm `latest`** — npm registry not queried this pass; the
  official changelog confirms **CLI v4 (March 2026)** and v3+ namespaced registries. Pin the precise
  version at build time.
- **`registry-item.json` `meta` field constraints** (size/typing) — confirmed it exists and is
  "custom key/value"; did not confirm whether it is the best home for a large per-primitive manifest vs a
  sibling `registry:file`. Decide at build time; either is supported.
- **0.32.0 of agent-native** — read against the cloned 0.23.0 only; `McpAppRenderer`/`appearance.ts`
  seams not re-diffed at the newer version (carry as a fork-time check, per the brief).
- **Whether shadcn's MCP server exposes runtime render** (vs install/discovery) — docs describe
  discovery+install; no evidence of a runtime SDUI render tool, consistent with "we own the render
  contract." Treat the MCP server as authoring/install-time, not the runtime bridge.
- **AG-UI ↔ shadcn reference integration** — no official shadcn+AG-UI render example found; the
  `UiTreeRenderer` is ours to build (expected — it is the owned vocabulary).

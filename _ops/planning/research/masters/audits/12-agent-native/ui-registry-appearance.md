# agent-native — UI / Appearance / Primitive Registry / Templates

> **STATUS — investigation artifact (2026-06-01).** This is a pre-decision research/review pass, kept for the record.
> Where it conflicts with the committed direction, the current truth lives in **recommendation.md** and
> **fact-finding/fact-finding-synthesis.md** (in the 12-agent-native tree). Corrected since this was written:
> fork target **core 0.32.2 / dispatch 0.8.28** (0.23.0/0.8.18 were the read-clone);
> governance = **@microsoft/agent-governance-sdk@4.0.0 (Public Preview)** behind one `policyCheck()` seam,
> API `evaluate(action,context)`/`evaluatePolicy(agentDid,context)`, SHA-256 hash-chain audit, Cedar/Rego external bridges;
> transport = **native SSE internal + AG-UI external adapter, both built** (no rebind of the internal surface);
> **Option A+ — no declarative planner/DAG engine in the product runtime**; natural table names (**no `yrka_` prefix**);
> voice **in scope, built complete** (paid realtime live-eval parked pending explicit go).


Pillar owner: UI foundation. Subject: Builder.io `@agent-native/core` v0.23.0 (MIT),
local clone `C:\Users\james\projects\rebuild\agent-primitives\references\agent-native`.
Date of source read: 2026-06-01. Drift-prone facts dated inline.

---

## Committed read: **adopt + targeted swaps** (not adopt-as-is, not build-fresh)

Adopt wholesale, as the foundation of `@jami-studio/ui`:

- the **theme-token contract** (shadcn/ui + Tailwind v4 CSS-variable convention),
- the **agent chat surface** (`AssistantChat` / `AgentPanel` / composer, built on
  the open-source `@assistant-ui/react`),
- the **extension-slot system** (`ExtensionSlot` + `extension_slots` tables),
- the **agent-rendered UI path** (`McpAppRenderer`, which is the **standard MCP-UI
  / MCP Apps** protocol — `@modelcontextprotocol/ext-apps` — not a Builder
  invention).

Build the **one thing that does not exist**: a **shared primitive registry**. Today
each template carries its **own full private copy** of ~49–50 shadcn/ui components.
There is no shared component package. That duplication is the gap our `ui`
"primitive registry" fills — and it is a first-principles requirement, not a nicety
(see §2). This is the only real "build", and it is a thin packaging job over
shadcn, not a new component system.

Targeted swaps on adoption: **transcription** (Builder-hosted → adapter),
**analytics** (`analytics.agent-native.com` → our sink or off), **the six
hardcoded appearance presets** (→ tokenized accent generator). All are config/
adapter-level, not architectural.

**Do not build a component library from scratch.** First principles say the root
artifact is "a tokenized design system + the canonical shadcn primitives" — Builder
already sits on exactly that substrate (shadcn/Radix/Tailwind v4), which is itself
the industry-standard official-canon baseline. Reinventing buttons/dialogs would be
pure bloat.

---

## Direct answers to the pillar questions

**Is the UI already a primitive/registry+token system, or templates to distill?**
**Both, split by layer — and the registry layer is missing.**
- The **token layer IS a clean, root-correct system**: a shadcn/ui Tailwind-v4
  contract. `packages/core/src/styles/agent-native.css` maps raw HSL CSS vars
  (`--background`, `--primary`, `--sidebar-*`, `--radius`, …) to Tailwind utilities
  via `@theme`; each template owns its palette by defining those vars in
  `:root`/`.dark` (e.g. `packages/core/src/templates/default/app/global.css:8-68`).
- The **primitive layer is NOT a registry** — it is **N duplicated copies**. Core
  exports only 4 low-level UI primitives (`packages/core/src/client/components/ui/`:
  `dropdown-menu`, `hover-card`, `popover`, `tooltip`). Every template re-vendors a
  full shadcn set into `app/components/ui/*` (mail = 49 files, forms = 49, calendar
  = 50), each with its own `components.json` shadcn config
  (`templates/mail/components.json`). The "registry" is the public **shadcn registry
  on ui.shadcn.com**, consumed per-template via the CLI — not anything Builder owns.
- The **high-level agent surface IS a shared component system** exported from
  `@agent-native/core/client` (`AgentPanel`, `AssistantChat`, `AgentConversation`,
  composer, `SettingsPanel`, `ResourcesPanel`, `CommandMenu`, `ExtensionSlot`,
  `McpAppRenderer`) — 100+ exports in `packages/core/src/client/index.ts`.

So: **distill the duplicated shadcn copies into one registry (our build); adopt the
token contract and the agent surface as-is.**

**How are design tokens + slots + extension points structured?**
- **Tokens**: HSL CSS variables → `@theme` Tailwind mapping (above). Light/dark via
  `.dark` class toggled by an inline boot script
  (`packages/core/src/client/theme.ts` — `getThemeInitScript`).
- **Appearance presets**: a *separate, weaker* layer — 6 hardcoded named tints
  (`warm/ocean/forest/rose/slate` + default) in `client/appearance.ts:5-12`, applied
  as `<html data-appearance="...">` overriding ~6 vars each in
  `styles/agent-native.css:150-238`. The agent changes it by writing
  `application_state.appearance`; `useAppearanceSync()` (`appearance.ts:106`) polls
  and reflects it to the DOM. This is **not** root-correct (violates the canon's
  "accent color ⇒ fully tokenized" test) — it is a fixed enum, not a generator.
- **Slots**: named insertion points. `<ExtensionSlot id="mail.contact-sidebar.bottom"
  context={…}/>` (`client/extensions/ExtensionSlot.tsx`) fetches per-user installs and
  renders each as a sandboxed `EmbeddedExtension`. Backed by two Drizzle tables —
  `extension_slots` (declaration: extension X may render in slot Y) and
  `extension_slot_installs` (per-user, owner-scoped install + position) —
  `extensions/slots/schema.ts`, server logic in `extensions/slots/store.ts`.
- **Extension points / agent-rendered UI**: two iframe-sandboxed paths —
  (a) **portable extensions** (`client/extensions/portable-extension.ts`,
  `AgentNativeExtensionFrame.tsx`) = agent-authored mini-apps with a manifest +
  postMessage host bridge + scoped storage; (b) **MCP Apps**
  (`client/mcp-apps/McpAppRenderer.tsx`) = the standard MCP-UI protocol, theme passed
  in as CSS vars (`buildHostContext`, lines 368-419), CSP-locked iframe.

**`design-token-utils.ts` — is that the registry?** No. The 1023-line
`packages/core/src/server/design-token-utils.ts` is an **extraction/parsing toolkit**
(parse Tailwind config / CSS / package.json / docs / scrape a URL for colors, fonts,
spacing, radius). It feeds the `import-*` actions of the **design/slides/videos
templates** so an agent can ingest a brand's tokens from an external source. It is
not a runtime theming registry — useful, self-contained, MIT, adoptable as a utility.

**How tightly is the UI coupled to the harness?**
Coupled by a **clean runtime contract, not by code entanglement** — and that coupling
is genuinely the point. The chat surface (`AssistantChat`, built on
`@assistant-ui/react` — `AssistantChat.tsx:21`) binds to the harness through:
SSE streaming, polling of `application_state` (e.g. appearance, pending selection
context — `AssistantChat.tsx:481`), and file/DB sync hooks (`use-db-sync.ts`:
`useDbSync`/`useFileWatcher`/`useScreenRefreshKey`). The shared-state model (agent and
UI read/write the same files+DB) IS the framework's thesis. But the binding is via
HTTP/SSE endpoints under `/_agent-native/*` and React Query — replaceable transport,
not hard linkage.

**Can you extract the UI as a standalone ui, or is shared-state the whole point?**
You can cleanly extract **two of three layers**: the **primitive registry** (trivial —
it is just shadcn, no harness ties) and the **token contract** (trivial — pure CSS).
The **agent surface** can be packaged standalone but only meaningfully runs against a
harness providing the `/_agent-native/*` contract (chat runs, application_state,
resources, slots). That is correct and desirable: `ui` should be the primitive
registry + token system + the *generic* agent components, and depend on `harness`
through a thin documented endpoint contract — exactly how Builder splits
`@agent-native/core` exports today (`./client` vs `./server` vs `./db`).

**Can we improve on Builder's component system, or adopt+unify?**
Adopt + unify. Builder's primitives ARE the industry baseline (shadcn/Radix/Tailwind
v4); there is nothing to improve at the component level and rebuilding is forbidden
bloat. Our additive value is precisely what Builder *lacks*: (1) one shared registry
instead of 23 duplicated copies, (2) a real tokenized accent system replacing the 6
hardcoded presets.

---

## Evidence (file paths in local source)

- Token contract: `packages/core/src/styles/agent-native.css` (`@theme` map L42-118;
  appearance presets L150-238); per-template palette `…/templates/default/app/global.css:8-68`.
- Tailwind v4 is the live path; `packages/core/src/tailwind.preset.ts` is explicitly
  `@deprecated` legacy-v3-only (file header).
- Appearance: `packages/core/src/client/appearance.ts` (presets L5-12, sync L106-126);
  `client/theme.ts` (boot script); action `appearance/actions/change-appearance.ts`.
- Slots: `extensions/slots/schema.ts`, `extensions/slots/store.ts`,
  `client/extensions/ExtensionSlot.tsx`.
- Agent surface: `client/AssistantChat.tsx` (on `@assistant-ui/react`),
  `client/AgentPanel.tsx`, `client/conversation/AgentConversation.tsx`,
  `client/composer/` (Tiptap-based), `client/index.ts` (full export surface).
- Agent-rendered UI: `client/mcp-apps/McpAppRenderer.tsx` (MCP-UI standard),
  `client/extensions/portable-extension.ts` (Builder's own extension format).
- Per-template duplicated primitives: `templates/{mail,forms,calendar}/app/components/ui/*`
  (49–50 files each) + `templates/mail/components.json` (shadcn CLI config).
- Token-extraction utility: `packages/core/src/server/design-token-utils.ts`.
- Templates (23): repo `templates/` — analytics, brain, calendar, calls, clips, code,
  content, design, dispatch, forms, issues, macros, mail, meeting-notes, migration,
  recruiting, scheduling, slides, starter, videos, voice, workbench (+ core
  default/workspace-core/workspace-root).

---

## Swap-difficulty table (UI pillar)

| Part | Builtin / coupling | Difficulty | Seam (exact) |
|---|---|---|---|
| Design tokens (palette, radius) | Pure CSS vars per template; framework only maps them | **Trivial (config)** | Redefine `:root`/`.dark` vars in app `global.css`; `@theme` in `styles/agent-native.css` already indirects through them |
| Light/dark theming | `.dark` class + inline boot script | **Trivial** | `client/theme.ts:getThemeInitScript` (drop-in, no harness tie) |
| Appearance presets (accent) | 6 hardcoded enums, DOM `data-appearance` | **Moderate (root-fix)** | `client/appearance.ts` `APPEARANCE_PRESETS` + CSS blocks `agent-native.css:150-238` — replace enum with a token/accent generator; the `data-appearance` + `application_state.appearance` write-path stays |
| Primitive components (button/dialog/…) | None shared — duplicated per template via shadcn CLI | **Moderate (our build)** | shadcn `components.json` registry per template → consolidate into one `@jami-studio/ui` registry/package; pure packaging, no harness ties |
| Core UI primitives (popover/tooltip/…) | `client/components/ui/*` (only 4) | **Trivial** | Plain Radix wrappers; lift as-is |
| Extension slots | `extension_slots` / `extension_slot_installs` (SQLite/PG) | **Adapter swap** | `extensions/slots/store.ts` uses the framework `getDb()` Drizzle layer — rides whatever DB adapter the harness uses |
| Agent chat surface | `@assistant-ui/react` (OSS) over `/_agent-native/*` SSE + `application_state` | **Adapter swap** | `AssistantChat.tsx` runtime + `use-db-sync.ts`; rebind transport to our harness endpoints |
| Agent-rendered UI | MCP-UI standard (`@modelcontextprotocol/ext-apps`) | **Trivial (adopt)** | `McpAppRenderer.tsx`; standards-based, theme via CSS vars `buildHostContext` |
| Transcription | **Builder-hosted gateway only** (`transcribeWithBuilder` needs Builder private key) | **Adapter swap** | `transcription/builder-transcription.ts` + `client/transcription/use-live-transcription.ts`; introduce a `Transcriber` interface, drop in our STT (voice-prototypes already proves a self-hosted Vertex/OpenAI lane) |
| Analytics / telemetry | Amplitude + `analytics.agent-native.com`, Sentry | **Trivial (config)** | `client/analytics.ts:49` endpoint const → our sink or disable |
| Branding (PoweredBy, links) | Links to agent-native.com / builder.io | **Trivial** | `client/PoweredByBadge.tsx`, doc-URL consts in `SettingsPanel.tsx`/`IntegrationsPanel.tsx` |

---

## Coupling to Builder.io hosted services

Almost everything is **fully local/self-hostable**. Hosted couplings are optional and
isolated:

- **Transcription**: the *only* hard hosted dependency for a built-in feature.
  `transcribeWithBuilder()` (`transcription/builder-transcription.ts:42-50`) throws
  unless a Builder.io private key is connected; routes audio through Builder's proxy
  (`resolveBuilderAuthHeader` / `getBuilderProxyOrigin` in
  `server/credential-provider.js`). Swappable behind an adapter.
- **"Connect Builder" / gateway**: optional billing/model-gateway login
  (`client/settings/useBuilderStatus.ts`, `ConnectBuilderCard.tsx`,
  `builder-frame.ts`). The app runs BYOK without it; this is an upsell path.
- **Analytics**: `analytics.agent-native.com/track` + Amplitude + Sentry
  (`client/analytics.ts`). Config/no-op-able.
- **Doc/CTA links & desktop download**: cosmetic strings to builder.io /
  agent-native.com — replace with jami.studio.
- **Embedding in the Builder visual editor** (`builder-frame.ts`,
  `isInBuilderFrame`): only active when iframed inside builder.io; inert standalone.

Everything else — tokens, theming, slots, chat surface, MCP Apps, extensions,
component primitives — is local code with no network dependency on Builder.

---

## Mapping to our foundation

- **`@jami-studio/ui` (primary owner of this pillar).** Gets: the shadcn/Tailwind-v4 **token
  contract**; a **new shared primitive registry** (the consolidation of the 23
  duplicated `components/ui` sets — our one real build); the **generic agent
  components** (chat surface, composer, conversation, command menu, slots host,
  `McpAppRenderer`); a **root-correct accent/token generator** replacing the 6
  hardcoded presets. Depends on harness only through the documented
  `/_agent-native/*` endpoint contract.
- **`@jami-studio/harness`.** Owns what ui binds to: chat-run SSE, `application_state`
  (incl. appearance write-path), resources, the slot install store
  (`extensions/slots/store.ts`), file/DB sync, transcription adapter. The shared
  file/DB state lives here; ui is the renderer over it.
- **`@jami-studio/orchestra`.** Minimal UI-pillar overlap. The dispatch control plane
  (repo `packages/dispatch`, `wrangler-dispatch.toml`) and multi-tab/multi-agent
  surface (`MultiTabAssistantChat`) inform orchestra but are out of this pillar.

---

## Risks, license/redistribution constraints

- **License**: `@agent-native/core` is **MIT** (`packages/core/package.json:license`).
  Redistribution/fork/relicense under jami.studio OSS is permitted with attribution.
  Verify each **template** carries MIT too before lifting (templates are separate
  workspace packages); the per-template shadcn copies are MIT-derived (shadcn is MIT).
- **The 23 templates are full standalone apps**, not building blocks. They are a
  *reference corpus* to distill patterns from, not something to adopt as units. Lifting
  one means lifting a whole React Router + Drizzle + Nitro app.
- **Tight `@agent-native/core` workspace dependency**: every template is
  `"@agent-native/core": "workspace:*"`. Extracting ui means cutting that
  umbilical and republishing under our scope — non-trivial packaging but mechanical.
- **Appearance preset system is below our bar** (hardcoded enum) — adopting it as-is
  would violate the canon's root-correct test; must be rebuilt as a generator. Low
  effort, but do not skip it.
- **Builder branding/telemetry leakage**: many hardcoded builder.io / agent-native.com
  strings + an analytics beacon. Easy to miss one; do a full sweep before shipping.
- **Heavy dependency surface**: core pulls Amplitude, Sentry, Better Auth, Drizzle,
  Tiptap, assistant-ui, Radix, Shiki, Nitro. ui should depend only on the UI
  subset (assistant-ui, Radix, Tailwind, Tiptap), not the server/db/auth stack —
  the existing `exports` split (`./client` vs `./server` vs `./db`) makes that feasible.

---

## What I could NOT verify

- **Official 2026 facts on agent-native.com/docs and the live GitHub repo** were not
  fetched (no web access used this pass). Version (0.23.0), MIT license, and all
  couplings are read from the **local clone dated to its checkout**, not confirmed
  against current published `@agent-native/core` or the docs site. Re-verify version,
  license scope, transcription/gateway pricing, and any new appearance/registry work
  against official sources before committing.
- **Per-template license headers** not individually audited — only core confirmed MIT.
- **Whether assistant-ui's runtime can be cleanly re-pointed** at a non-agent-native
  harness was inferred from the endpoint/SSE contract, not proven by building it.
- **voice-prototypes** confirms the framework's real behavior (e.g. `sendToAgentChat({
  submit:false })` is honored only by the MCP embed host; transcription/live-voice was
  built on self-hosted Vertex/OpenAI lanes, validating the transcription swap) — but I
  did not exhaustively map its UI customizations against core.

# Unified Workspace Shell + Domain Sidebar — Discussion Note

Date: 2026-07-17
Status: DISCUSSION OPEN (owner-initiated). Planning only — nothing here is
ratified except the two owner statements quoted below. This note exists so
the shell conversation has a durable, honest home.
Companions:
- `_ops/planning/research/feasibility-reports/avatar/2026-07-17-anam-video-layer-plan.md`
  (§3.3 — cross-app call persistence is VITAL; this note is the promised follow-up)
- hummingbird `docs/operations/reference/unified-runtime-roadmap.md`
  (Phase 3 consolidation NOT SCOPED — owner-led discussion required first;
  anti-creep guardrails 1–6)

## Owner direction (2026-07-17, verbatim intent)

1. Cross-app floating persistence for the voice/video call layer is vital.
2. "We DO plan to create one unified SHELL and reorganize the paths for the
   'apps' into a more sidebar, logically grouped by domains, adjustable by
   user — shape that matches our intended shift towards unified workspaces
   vs disparate apps."

### Round 2 (same day) — the workspace surface itself

3. **A reimagined single workspace**: the main chat with split panels and
   surfaceable, interactive UI — "the substitute for any navigation at
   all." This is the REAL payoff of the Dispatch layer, reimagined and more
   focused. Today every page has several chats and a sidebar — great for
   adaptability, but the direction is to FOCUS: one primary chat surface in
   the shell. (This directionally answers fork question 1 below: the agent
   surface moves up.)
4. **Sidebar in the shell across everything — ratified.** It can render
   small inline cards at any time; cards click through to the full
   workspace with surfaceable-UI powers across all components and
   workspaces, with **full operability as-if in the apps themselves**.
5. The workspace is both a single page and a split-panel surface: chat,
   viewer, context, terminal — plus file explorer, diff view, artifact
   view; eventually a sandbox pane. Terminal/TUI frameworks welcome.
   Quality bar: a polished, high-class agent workspace of the
   well-known open-source archetype, REUSING proven open-source libraries
   rather than inventing panes.

This is the opening of the shell discussion — NOT the Phase-3 consolidation
decision. Roadmap order stands (Phase 2.5 cohesion → 2.75 de-Builder.io →
owner-led Phase-3 mapping). The question this note frames: is the SHELL a
separate, earlier workstream than consolidation — and if so, what shape?

## The key architectural observation

A persistent shell and app consolidation are SEPARABLE:

- A shell (persistent top document owning sidebar + call dock, apps hosted
  beneath it) works over today's 14 apps **unchanged**, because the
  workspace gateway already serves every app on ONE origin at `/<app-id>`
  (same-origin iframes: shared session cookies, shared A2A, no CORS seams).
- Consolidation (14 → 4–5 domain workspaces, real package merging) changes
  what's INSIDE the panes. The shell chrome survives it untouched.
- Therefore the shell can PRECEDE Phase 3 and actually de-risks it: the
  user-adjustable domain grouping in the sidebar is a live, low-cost
  prototype of the Phase-3 workspace mapping. We watch how the groupings
  settle before committing package merges to them.

## What already exists to build on (verified in-repo)

- **Single origin**: the workspace gateway serves all apps under one
  origin; auth/session/A2A are already unified (roadmap guardrail 4).
- **Base-path discipline**: apps mount at `/<app-id>`; core 0.99.2
  `appRouterPath`/`isWithinAppBasePath` (issue 58) made cross-app links
  well-behaved — a shell URL-sync layer builds on this, not against it.
- **Frame primitives**: `AgentNativeFrame` (packages/core client) already
  exists with `allow="clipboard-read; clipboard-write; microphone;
  fullscreen"`; `packages/frame` and `packages/embedding` exist as homes
  for embedding concerns.
- **App registry**: workspace apps are discovered from
  `apps/<app-id>/package.json` (name + description, Dispatch lists them,
  users can already edit displayed name/description). Sidebar grouping =
  this registry + a per-user grouping preference in SQL
  (settings/application_state) — no new registry invention needed.
- **Voice/video dock**: body-portalled, panel-aware, hover-reveal controls
  (avatar plan §1.3). Moving its OWNER into a shell document is precisely
  what makes call sessions survive app switches with zero reconnect.

### Workspace-surface primitives (verified in-repo, round 2)

The split-panel agent workspace is mostly ASSEMBLY of things that already
exist in the stack, not greenfield:

- **Dispatch** — the workspace-level chat/orchestration app; round 2 names
  it as the layer whose real payoff the unified workspace is. The shell
  workspace is Dispatch's chat surface promoted and focused, not a rival.
- **Surfaceable UI cards** — already three primitives deep: generative-ui
  (transient/saved inline chat UI), extensions (sandboxed Alpine mini-apps
  with `appAction`/`dbQuery`/`extensionFetch`), and extension-points (named
  UI slots). The MCP app host already models exactly the card ladder the
  owner described: display modes `inline | pip | fullscreen`
  (`mcp-app-host.ts`).
- **Full operability without navigation** — this is the action surface by
  construction: actions are the single source of truth (agent tools = UI
  calls), and `call-agent`/A2A reaches every sibling app. "As-if in the
  app" has three fidelity rungs, cheapest first:
  1. action-backed cards/panels (generative-ui/extensions — exists today);
  2. same-origin iframe of the app route inside a pane (full fidelity,
     less composable — the round-1 shape A mechanism, now demoted from
     "the shell" to "one pane type");
  3. true component-level reuse of app UIs inside workspace panes — the
     polished end state, but a real component-extraction program across
     apps; honest cost, not a v1 item.
- **Code surfaces** — `@agent-native/code-agents-ui` exists as "Reusable
  React UI for Agent-Native Code surfaces" (published, versioned); the
  harness-agents runtime layer (Claude Code, Codex, Pi, ACP…) and
  context-xray already exist for the agent side of a coding pane.
- **Terminal** — `@xterm/*` is ALREADY a dependency of core and the chat,
  clips, design, and plan templates. A shell terminal pane reuses that,
  not a new framework.
- **Sandbox** — `packages/core/src/coding-tools/sandbox/` exists upstream
  today (adapter interface, local child-process adapter, background
  executions store) and is under active upstream development. The
  "eventually sandbox" pane has a landing seam already.
- **Artifacts/diff/file views** — Plan owns visual artifacts (diff,
  file-tree, annotated-code block types in its normalized schema); Code
  surfaces own diff/explorer UI. Survey-then-reuse before building panes.
- **Open-source archetype** (research item, evaluate at build time with
  current versions per the AGENTS.md dependency rule): split-pane layout
  (shadcn resizable / react-resizable-panels), chat UI kits
  (assistant-ui, CopilotKit, AG-UI protocol), agent-workspace shells of
  the OpenHands class for interaction patterns, xterm.js (already in).
  Rule: reuse where a library is genuinely better-maintained than what the
  stack already ships; the stack already ships a lot of this.

## Candidate shapes

### A. Persistent shell + same-origin app iframes (shell-first)

Thin persistent document owns: domain sidebar, voice/video call dock (and
the Anam `<video>` element), notifications, possibly the agent panel. Apps
render in a same-origin iframe pane; shell mirrors the active app's route
into the top URL (History API + postMessage), so deep links and
back/forward keep working and `/<app-id>/...` URLs stay canonical.

- \+ True call persistence immediately, across ALL 14 apps, no app rewrites.
- \+ Sidebar/domain grouping ships as shell data, user-adjustable from day 1.
- \+ Consolidation-compatible: panes get fewer/bigger later; chrome stays.
- − Iframe seams to engineer honestly: URL/history sync, focus management,
  per-app agent sidebar vs shell surface (see fork question 1), modal/
  fullscreen layering across the frame boundary, iframe keyboard shortcuts.
- − The shell is a new always-on surface: must be a run-mode-agnostic app
  inside the SAME artifact (guardrail 3 — no new lane, no config fork).

### B. Consolidation-first (Phase 3 as the persistence answer)

Merge to 4–5 domain workspaces; within a workspace everything is SPA
navigation and the dock persists naturally; app switches become rarer.

- \+ No iframe seams; the deep product target shape directly.
- − Phase 3 is explicitly NOT scoped ("a BIG deal and we're not quite
  there") and ordered after 2.5/2.75. Not a near-term persistence answer.
- − Even completed, cross-WORKSPACE switches still drop calls without a
  shell above them (4–5 documents instead of 14 — fewer seams, same class
  of gap).

### C. Staged hybrid (framing for discussion)

Shell (A) as its own workstream when owner green-lights — over unchanged
apps; contest demo rides session re-attach (avatar plan §3.3 item 2) unless
a minimal shell spike is pulled forward; Phase 3 proceeds later beneath the
shell on its own timeline, informed by observed sidebar groupings. B's end
state is reached WITH the shell rather than instead of it.

## Sequencing honesty (contest = ~2 weeks)

A minimal shell spike (sidebar + iframe pane + dock relocation) is
plausibly days of work on the happy path, but it touches auth surfaces,
the agent panel, fullscreen layering, and every app's perceived UX at
once — exactly the class of change the Phase-2.5 cohesion focus says to
keep controlled. Honest options:

1. Contest on re-attach; shell design ratified in parallel; shell build
   starts right after the demo ships. (Lowest risk to the deadline.)
2. Minimal shell spike now, behind an opt-in flag, demo uses it only if it
   proves stable in the first days. (Higher reward, bounded risk — needs
   explicit owner approval since it competes with demo polish time.)

## Fork-in-the-road questions (owner input wanted)

1. **Does the agent panel move into the shell?** Round 2 answers the
   direction: YES — one primary chat surface in the shell, the navigation
   substitute; today's several-chats-per-page adaptability gets focused.
   Remaining sub-questions: what happens to per-app panels during the
   transition (deprecate gradually? keep as a pane-local affordance that
   feeds the same thread?), and does the shell chat carry ONE continuous
   thread with per-pane context chips, or thread-per-workspace-domain?
2. **URL model**: top URL mirrors the active pane route 1:1 (recommended —
   preserves deep links, bookmarks, browser history), or shell gets its own
   nav state with app routes secondary?
3. **Grouping model**: default domains seeded from the Phase-3 sketch
   (business / design / coding / research / project-mgmt)? What can users
   adjust — reorder, regroup, rename, hide? Per-user (application_state)
   or org-shared default with per-user overrides?
4. **Desktop app relationship**: does `packages/desktop-app` adopt the same
   shell (web shell inside the desktop window) so there is exactly one
   chrome implementation?
5. **Sequencing**: option 1 or 2 above for the contest window?
6. **Where the shell lives**: a new `apps/shell` served at `/` by the
   gateway, or a gateway-level root app in the fork (framework-owned so
   every agent-native workspace gets it)? The second is the more
   upstream answer but touches the fork; the first proves the shape.
7. **Pane fidelity ladder (round 2)**: confirm the v1 pane set — chat +
   viewer + context + terminal, with file-explorer/diff/artifact views
   riding the viewer — and that "as-if in the app" starts on rungs 1–2
   (action-backed cards + same-origin iframe panes), with rung 3
   (component-level reuse) as the stated polish trajectory rather than a
   v1 requirement.
8. **Dispatch relationship — ANSWERED (recommendation accepted in
   principle, round 3): Dispatch promoted, not wrapped.** The
   industry-standard and first-principles answer agree here:
   - A "new surface that consumes Dispatch" creates two owners of one
     concern (orchestration UX) — the parallel-system trap, and exactly
     how several-chats-per-page proliferation happened. The upstream rule
     applies to product surfaces too: evolve the proven surface at source,
     don't build a sibling beside it.
   - The archetype the owner invoked IS the workbench pattern (VS Code
     class): ONE workbench owns layout, panes, sidebar, chrome; every
     capability is a pane/view contributed into it. Successful platforms
     promote and refactor the proven surface in place; they don't
     greenfield a rival shell.
   - Precise shape ("wrap in or not is up to the sensibility of the
     code"): the WORKBENCH primitives (split-pane layout, pane registry,
     sidebar, card→pane→fullscreen ladder, dock ownership) become
     framework-level packages in the fork — so every agent-native
     workspace inherits the shell — and the app at `/` is Dispatch's next
     form (renamed with the identity work) running that workbench as the
     central interaction surface. Dispatch's orchestration internals
     (jobs, resources, integrations, A2A reach) carry over as the first
     first-class pane set rather than being re-implemented.
   - Explicitly NOT: a wrapper app that iframes/embeds today's Dispatch,
     or re-export shims/barrels bridging old and new surfaces during the
     move (see engineering standard below).

## Sequenced flow (owner sketch, round 3 — 2026-07-17)

The owner's imagined order for the whole arc, recorded as the working
sketch (refines, does not replace, the roadmap's phase order — formal
ratification still lands in the hummingbird roadmap doc when each phase is
scoped):

1. **Packages reclaimed** — registry/identity work (aligns with Phase
   2.75 de-Builder.io): packages renamed under the Jami Studio name.
2. **Systems ported stable** — what exists runs clean on the reclaimed
   packages (cohesion bar from Phase 2.5 carried through the rename).
3. **Continue rename** — finish identity across fork + workspace.
4. **Reorganization around intended workspaces** — current domain sketch:
   **business / design / research / coding / full suite ("hummingbird?")**.
   (Refines the earlier 5-domain sketch — project-mgmt folds into
   business/orchestration; "full suite" is the everything-workspace,
   possibly keeping the Hummingbird name. Still a sketch — the sidebar
   grouping data (question 3) prototypes this before packages move.)
5. **Orchestration** — Dispatch renamed and promoted to the central
   interaction surface (question 8's answer executed): the workbench at
   `/`, the one chat, the sidebar, the pane sets.

### Engineering standard for this workstream (owner, round 3 — binding)

This is critical load-bearing structure and gets treated as such:

- **No shortcuts, no placeholders, no shims, no barrel re-exports** to
  bridge old→new during the moves. Pillars go up even and sturdy — each
  slice lands whole (real package homes, real imports, real deletions of
  the superseded surface) or it doesn't land.
- Ideal shape, standard and scalable, over fast: prefer the
  industry-standard pattern (workbench/pane contribution model) even when
  a bespoke hack would demo sooner.
- This standard governs the shell/workbench, the Dispatch promotion, and
  the workspace reorganization. (The contest demo lane — avatar plan —
  keeps its own smaller scope and does NOT get to violate this standard in
  shared code; demo-only glue stays in the demo slices.)

## Guardrails this work must honor (from the roadmap, restated)

- One artifact: the shell is a run-mode of the same build — never a new
  lane, parallel build, or config fork (guardrail 3).
- Auth/DB/A2A stay unified; single origin per deployment (guardrail 4).
- No resident dev daemons as a byproduct (guardrail 1).
- Phase order stands: this note does not amend the roadmap; if the owner
  ratifies a shell workstream, THAT decision gets recorded in
  hummingbird `docs/operations/reference/unified-runtime-roadmap.md`.

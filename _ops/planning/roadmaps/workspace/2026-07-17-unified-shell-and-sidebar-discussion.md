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

1. **Does the agent panel move into the shell?** Biggest product decision
   here. Shell-owned panel = ONE conversation/transcript/composer across
   all apps (matches the A2A read-first design; the panel talks to the
   active app's agent via the same call-agent bridge). Per-app panels
   stay = shell only owns the call dock/video; smaller change, keeps
   today's per-app agent identity. This choice shapes everything else.
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

## Guardrails this work must honor (from the roadmap, restated)

- One artifact: the shell is a run-mode of the same build — never a new
  lane, parallel build, or config fork (guardrail 3).
- Auth/DB/A2A stay unified; single origin per deployment (guardrail 4).
- No resident dev daemons as a byproduct (guardrail 1).
- Phase order stands: this note does not amend the roadmap; if the owner
  ratifies a shell workstream, THAT decision gets recorded in
  hummingbird `docs/operations/reference/unified-runtime-roadmap.md`.

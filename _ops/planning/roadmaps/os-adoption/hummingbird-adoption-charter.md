# Hummingbird Adoption Charter

Date: 2026-07-09
Status: Durable planning charter
Owner: Jamie
Current home: `_ops/planning/roadmaps/os-adoption/hummingbird-adoption-charter.md`
Target home after install: `hummingbird/docs/operations/hummingbird-adoption-charter.md`
Source note: `_ops/planning/user-notes/hummingbird-outline.md`

## Purpose

Hummingbird is the consumer product/workspace where we adopt the working
Agent-Native/Jami Studio codebase into our own branded product surface. This
charter converts the owner outline into a durable project contract that can be
carried into the Hummingbird repo once that repo is installed.

This is not a rebuild plan. The inherited codebase is treated as working
software. Our job is to install it fully, provision it deliberately, preserve
the upstream path, and then extend it from a position of understanding.

## Product Thesis

Hummingbird will take advantage of a polished, design-first, VC-backed open
source codebase while adding our own product direction over time:

- A voice-first, real-time agent layer with optional talking-avatar presence.
- A central orchestration experience that can route work across domain apps.
- Curated workspaces across domains rather than one oversized all-purpose app.
- A tokenized styling and branding system.
- Focused workflow surfaces across mail, dispatch, clips, assets, design,
  planning, analytics, content, calendar, forms, slides, brain, chat, and any
  internal templates we intentionally expose.

These future product tracks do not block the setup roadmap. The setup roadmap
is done when the official workspace and standalone install surfaces are
installed, connected, documented, and verified through the calls/tests chosen
for provisioning.

## Working Posture

- Treat the existing apps and framework features as complete, working upstream
  capabilities unless official docs or live source say otherwise.
- Do not spend planning time proving that upstream install paths work. Use the
  official docs and package/CLI surface as the source of truth.
- Do not settle for workaround installs. If an official path is unclear, inspect
  the official docs/source and document the supported path.
- Keep discovery flexible. Early Hummingbird work is adoption and orientation,
  not a premature fork into fixed product assumptions.
- Prefer upstream solutions for issues: find the root cause, then the cause
  behind that, until the reason is outside our control or cost approval.

## Hummingbird Shape

Default shape:

- `C:\Users\james\orgs\oss\hummingbird` becomes the canonical Hummingbird
  product workspace repo.
- The primary install is a multi-app workspace with Dispatch as the control
  plane.
- All visible first-party templates are installed into the workspace.
- Hidden first-party templates, currently including `macros`, are installed
  explicitly through the official template flag.
- The Agent-Native Code UI is included as an existing CLI/Desktop/shared UI
  capability. A browser-hosted Code surface is product development and is not
  part of the setup-only roadmap unless the official install/docs expose one.
- Standalone installs for each first-party template are created through the
  official standalone flow. Because the standalone CLI initializes each target
  as its own Git root, the recommended default is sibling standalone install
  directories with a Hummingbird manifest that records paths, package versions,
  and verification status.

## Setup Scope

The setup/provisioning roadmap covers only:

- Hummingbird repo initialization and official workspace creation.
- Full app selection and hidden-app explicit install.
- Standalone official installs for each app/template.
- Shared env examples and secret placement rules, without secret values.
- Dispatch vault, resources, workspace connections, MCP gateway, and A2A
  readiness.
- Agent observability loop and optional external telemetry configuration.
- Chrome DevTools and Playwright connection documentation.
- Source-sync intake/deviation records for the adoption.
- Confirmed calls/tests during provisioning that prove the installed workspace
  and connectors are reachable.

It does not cover:

- Voice/video/avatar feature development.
- Workspace layout redesign.
- Brand renaming of apps such as Mail, Dispatch, Clips, Assets, or Design.
- Provider replacement work for CDN, search, model gateway, or publishing.
- Namespace takeover for registry/npm publishing.
- Product pricing, SaaS launch, or production go-to-market work.

## Cost And Credential Policy

Development must remain no-cost unless Jamie explicitly approves a spend.
Use approved subscriptions, startup credits, BYOK accounts, local defaults, or
free-tier paths first. Real secret values stay in gitignored `.env` files,
provider vaults, or Dispatch vault storage. Docs, prompts, examples,
screenshots, generated content, and planning files must use placeholders only.

The current partner benefits map records account-level services, approved
credit/benefit sources, and fallback posture under `_ops/credentials/`.
Hummingbird planning may reference service names and fallback posture, but never
copy credential values.

## Source Sync Policy

Jami Studio remains the upstream-adoption framework repo. Hummingbird consumes
the framework and records product-specific deviations. Source-sync remains
manual early, then automation increases only after manual sync reports are
boring and policy is settled.

The source-sync deviation catalog must record every intentional divergence from
upstream that affects future upstream acceptance. Each entry should say:

- What changed.
- Why Hummingbird needs it.
- Impact on upstream intake.
- What can still be accepted from upstream.
- What must be adapted or rejected.

## Decision Discipline

Canonical decisions live under `_ops/planning/decisions/` until Hummingbird has
its own repo-local decision log. Planning files may recommend defaults, but
decisions that shape install/provisioning, source sync, credentials, or
product-facing adoption posture get recorded as decision entries.

Current setup defaults:

- Full Hummingbird workspace, not per-app-only adoption.
- Dispatch included as the central control plane.
- Single-origin path-prefix deployment is the default provisioning target.
- SQL observability is the baseline feedback loop.
- External telemetry is optional and env/config-driven.
- Standalone installs are official outputs, kept as sibling install surfaces by
  default to avoid nested Git repositories.

## Creative Decisions Left Open

These do not block setup:

- Whether Hummingbird becomes the public product name or stays the internal
  adoption codename.
- Whether Jami Studio remains the framework brand while Hummingbird becomes the
  commercial workspace product, or whether names consolidate later.
- Which personality layer names, voice identities, and boardroom metaphors feel
  right after the existing apps are fully used.
- When app renaming and sidebar category design should begin.

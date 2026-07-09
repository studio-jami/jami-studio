# Hummingbird Workspace Provisioning Feasibility Report

Date: 2026-07-09
Status: Feasible, recommended for setup planning
Request: Convert the Hummingbird outline into durable planning, audit the codebase/docs/plans, identify real open decisions, and prepare for a setup-only roadmap that fully provisions the Hummingbird project.
Source scope: Local Jami Studio source/docs/plans, official upstream README, npm registry package metadata, Node.js official release guidance.
Owner: Jamie

## Executive Summary

Hummingbird provisioning is feasible as an adoption/setup project, not a
development project. The official framework surface already supports the shape
the owner wants: a multi-app workspace, Dispatch as the control plane, apps
under `apps/<name>`, workspace-level shared instructions/resources, same-origin
deployment, A2A delegation, MCP connectors, SQL-backed observability, and
standalone app scaffolds.

Recommended direction: install Hummingbird as the full multi-app workspace using
the official CLI/package surface, include all visible first-party templates plus
the hidden `macros` template explicitly, provision Dispatch as the workspace
control plane, document Agent-Native Code as an existing CLI/Desktop/shared UI
capability, and create official standalone installs as sibling install surfaces
with a Hummingbird manifest. Do not include Hummingbird-specific voice/avatar,
layout redesign, provider replacement, publishing namespace takeover, or app
renaming in this setup roadmap.

The remaining decisions are mostly creative/product identity decisions. The only
technical decision worth calling out is standalone topology: sibling install
directories are the generous default because official standalone scaffolds
initialize their own Git roots.

## Question Being Answered

Can we plan Hummingbird as a full adoption and provisioning of the existing
working Agent-Native/Jami Studio codebase, including the workspace, every
available app, Dispatch, Coding UI surfaces, standalone app installs,
connections, observability, and verification, without treating upstream as a
codebase that needs to be proven or rebuilt?

Answer: yes. The supported install and provisioning surface is present. The
plan should follow official docs and source behavior, document decisions, and
reserve verification calls/tests for the actual provisioning phase.

## Source Scope And Method

Checked local project sources:

- `_ops/planning/user-notes/hummingbird-outline.md`
- `_ops/planning/standards/planning-style.md`
- `_ops/planning/standards/report-style.md`
- `_ops/planning/standards/source-of-truth-policy.md`
- `_ops/planning/research/open-source-adoption/*`
- `_ops/readiness/*`
- `_ops/source-sync/README.md`
- `_ops/source-sync/automation.md`
- `_ops/source-sync/whats-left.md`
- `README.md`
- `DEVELOPMENT.md`
- `package.json`
- `packages/shared-app-config/templates.ts`
- `packages/core/src/cli/create.ts`
- `packages/core/src/cli/templates-meta.ts`
- `packages/core/src/templates/workspace-root/README.md`
- `packages/core/src/templates/workspace-root/package.json`
- `packages/core/src/templates/workspace-core/AGENTS.md`
- `packages/core/docs/content/getting-started.mdx`
- `packages/core/docs/content/multi-app-workspace.mdx`
- `packages/core/docs/content/workspace.mdx`
- `packages/core/docs/content/deployment.mdx`
- `packages/core/docs/content/dispatch.mdx`
- `packages/core/docs/content/workspace-connections.mdx`
- `packages/core/docs/content/toolkit-setup-connections.mdx`
- `packages/core/docs/content/observability.mdx`
- `packages/core/docs/content/a2a-protocol.mdx`
- `packages/core/docs/content/external-agents.mdx`
- `packages/core/docs/content/code-agents-ui.mdx`
- `packages/code-agents-ui/package.json`
- `packages/desktop-app/README.md`
- `packages/vscode-extension/README.md`
- `_ops/credentials/partner-benefits-map.md`

Checked external/current sources:

- `pnpm view @agent-native/core version` returned `0.92.1`.
- `pnpm view @agent-native/dispatch version` returned `0.13.13`.
- `pnpm view @agent-native/code-agents-ui version` returned a public registry
  `404` from this machine.
- Local runtime check only for environment awareness: Node `v24.16.0`, pnpm
  `10.29.1`.
- Official Node.js release page for LTS/production baseline.
- Official upstream `BuilderIO/agent-native` GitHub README for the public
  upstream quick-start posture.

Intentionally not performed:

- No Hummingbird install, smoke test, scaffold run, build, or verification run.
- No package upgrades or dependency changes.
- No credential verification.
- No source-sync refresh.

## Current Project State

The current `jami-studio` repo is on `main` with a clean working tree at the
start of this pass. `C:\Users\james\orgs\oss\hummingbird` exists locally but is
effectively empty and is not yet a populated repo.

The official template metadata lists these visible/core first-party templates:

- `calendar`
- `content`
- `plan`
- `slides`
- `clips`
- `brain`
- `analytics`
- `mail`
- `dispatch`
- `forms`
- `design`
- `assets`
- `chat`

It also lists `macros` as hidden, with the source comment stating that hidden
templates are not shown in pickers but remain scaffoldable through explicit
`--template`.

The CLI source confirms these install semantics:

- Bare `agent-native create <name>` asks for a start shape.
- Multiple templates create a workspace.
- A workspace is a monorepo with apps under `apps/<name>` and a shared package
  under `packages/shared`.
- Dispatch is always included as the workspace control plane.
- `add-app` scaffolds additional workspace apps under `apps/<name>`.
- A single explicit template or `--standalone` creates a standalone app.
- Standalone scaffolds target a named directory and call `git init` inside that
  target.

The official docs confirm these runtime/provisioning capabilities:

- Multi-app workspaces share auth, database defaults, workspace instructions,
  skills, and credentials.
- Dispatch is the workspace control plane for vault, messaging, resources,
  approvals, MCP gateway, and A2A delegation.
- Workspace resources are SQL rows inherited at runtime rather than copied into
  each app.
- Workspace connections record safe provider metadata and app grants while
  secrets stay in the vault.
- Deployment supports one-origin, many-app workspace routing, with path prefixes
  such as `/mail` and `/calendar`.
- Persistent SQL is required for production deployment.
- Agent observability is SQL-backed by default and captures traces, evals,
  feedback, costs, latency, and tool calls.
- External agents connect through MCP, preferably through Dispatch for
  workspace/cross-app work.
- The Code UI is an existing CLI/Desktop/shared UI package surface. The old
  hidden `code` template has been removed; browser-hosted Code surfaces are
  built by mounting `@agent-native/code-agents-ui` in a normal app with a host
  implementation.

Existing planning/readiness notes add these adoption constraints:

- Source sync should remain manual until the intake process is settled.
- Hummingbird was previously empty and awaiting shape selection.
- Dependency/security hardening and Builder identity cleanup are separate lanes,
  not blockers for this setup planning pass.
- No real secret values belong in docs, prompts, fixtures, screenshots, or
  generated app content.
- No-cost development must use approved subscriptions, credits, BYOK accounts,
  local defaults, or explicit owner approval.

## Official / External Findings

The public upstream README describes Agent-Native as an open source framework
where one action powers UI, agent, HTTP, MCP, A2A, and CLI surfaces. Its quick
start is the same basic install posture as the local docs:
`npx @agent-native/core@latest create my-app`, then `pnpm install`, then
`pnpm dev`.

The npm registry currently resolves `@agent-native/core` to `0.92.1` and
`@agent-native/dispatch` to `0.13.13`. The public npm registry did not expose
`@agent-native/code-agents-ui` from this machine during the check, even though
the package exists locally and its docs describe the browser-host integration.
That is a distribution/provisioning note, not a code-capability gap.

The official Node.js release guidance says production applications should use
Active LTS or Maintenance LTS release lines. The local project docs recommend
Node.js 24 for production as of 2026, and this machine is already on Node
`v24.16.0`.

## Industry Standard Shape

The clean adoption shape for this kind of project is:

- Keep the framework/source repo separate from the consumer product repo.
- Consume published packages and official scaffolded outputs where possible.
- Put workspace-wide code/policies in a shared package.
- Keep runtime configuration and secret values outside source.
- Use one persistent SQL database for shared auth, orgs, settings, resources,
  credentials, traces, and app state.
- Use a central control-plane app for credentials, integrations, messaging,
  approvals, and cross-app delegation.
- Deploy a multi-app workspace behind one origin when shared login and
  same-origin A2A matter.
- Keep standalone installs as official reference surfaces for each app, without
  confusing them with the primary workspace product.
- Record every intentional upstream deviation so future source-sync intake can
  accept, adapt, or reject upstream changes knowingly.

The local official docs already match this shape.

## Implementation Options

### Option A: Full Hummingbird Workspace Plus Official Standalone Install Lab

Description: Hummingbird becomes the canonical full multi-app workspace repo.
All visible templates are installed into the workspace; hidden templates are
explicitly installed. Standalone installs are created through the official
standalone flow as sibling install directories and cataloged from Hummingbird.

When it fits: This matches the owner outline and the official workspace docs.

Technical tradeoffs: Uses official CLI behavior and avoids nested Git roots in
the primary Hummingbird repo. Requires a manifest to keep standalone install
paths and verification evidence attached to Hummingbird.

Practical tradeoffs: Broadest setup scope, but it gives the team the complete
surface to learn from before extension work begins.

Cost/ops impact: Local/default development can stay no-cost. External provider
connections use approved credits or BYOK keys only.

Migration/reversibility: High. The primary workspace remains clean, and
standalone installs can be recreated from official commands.

### Option B: Full Workspace Only

Description: Install only the all-app Hummingbird workspace and skip standalone
app installs for now.

When it fits: Only if the standalone requirement is dropped.

Technical tradeoffs: Simplest repo shape. Loses the explicit "each app as
standalone" acceptance surface requested by the owner.

Practical tradeoffs: Faster setup, but weaker coverage of how each app behaves
as a standalone product.

Cost/ops impact: Lowest local footprint.

Migration/reversibility: Easy to add standalone installs later.

### Option C: Per-App Standalone Fleet Only

Description: Install every app as standalone and use Dispatch/federation later.

When it fits: A demo fleet or independent deploy strategy.

Technical tradeoffs: Works against the workspace/control-plane direction.
Requires more SSO/A2A wiring than same-origin workspace deployment.

Practical tradeoffs: More moving pieces before the team understands the full
workspace product.

Cost/ops impact: More projects, more env files, more verification surface.

Migration/reversibility: Can be consolidated later, but that would be extra
work.

### Option D: Develop Custom Hummingbird Code UI / Layout During Setup

Description: Add a custom browser Code UI app, new sidebar categories, or
renamed app shells during provisioning.

When it fits: Later product development.

Technical tradeoffs: Mixes adoption with product design and makes it harder to
know what came from upstream.

Practical tradeoffs: Slows down the goal of fully using the existing product.

Cost/ops impact: Adds dev work and review burden.

Migration/reversibility: Reversible, but unnecessary for setup.

## Technical Implications

Architecture: Hummingbird should be a consumer workspace repo, not another
forked framework repo. The primary product surface is `apps/*` plus
`packages/shared`, with Dispatch as the control plane.

Data model: Use the framework's SQL defaults. Local can fall back to SQLite;
production needs a persistent SQL `DATABASE_URL`. Workspace resources,
credentials metadata, observability, application state, and A2A tasks are SQL
owned.

Actions/API/MCP: App operations should remain action-backed. External agent
access should use Dispatch's MCP gateway for workspace-level access and direct
app MCP only for intentionally isolated app work.

Migrations: Setup should run official install/provisioning paths. No destructive
migrations and no source schema changes are part of this roadmap.

Providers: Use Dispatch vault and workspace connections. Provider credentials
stay in vault/env storage, not docs or app tables. Use approved credit/BYOK
sources only.

Security: Set production secrets such as `BETTER_AUTH_SECRET`, `A2A_SECRET`,
`OAUTH_STATE_SECRET`, and `SECRETS_ENCRYPTION_KEY` before production. Do not
copy shared deployment secrets into external MCP client configs when scoped
connect/OAuth can be used.

Source policy: Keep source-sync manual. Add a deviation catalog before product
changes start.

Tests/verification: No install tests were run for this report. During
provisioning, verification should confirm reachability and wiring, not question
whether upstream works. Verification should include official calls such as
workspace app listing, Dispatch MCP gateway connection, selected A2A calls,
resource reads, vault/connection readiness, observability route access, and
standalone app start/build checks where the roadmap calls for them.

Performance: Use single-origin workspace deployment first to avoid unnecessary
cross-domain SSO/A2A complexity.

Observability: Start with built-in SQL observability and dashboard. External
PostHog/Amplitude/Mixpanel/Sentry/OTel are optional env/config additions.

Deployment: Default to one-origin path-prefix deployment for Hummingbird. Keep
per-app independent deploys available as official supported surfaces, but not
the initial product shape.

## Project Implications

Implementation scope: Setup-only. Product feature development begins after the
workspace is installed, provisioned, connected, and verified.

Sequencing: Create the durable planning docs first, then install Hummingbird,
then provision secrets/connections/resources, then verify calls/tests, then
record any deviations.

Ownership surfaces: Hummingbird owns product workspace context, runtime
resources, setup manifests, provider grants, and future product changes. Jami
Studio owns framework source, source-sync intake, package publishing, docs, and
template source.

Docs: Hummingbird should receive the adoption charter, setup manifest,
env/example guidance, connection map, verification log, source-sync deviation
catalog pointer, and operator runbook.

Changelog/release behavior: No changesets are needed for planning-only docs
outside publishable package source. Future publishable package changes in Jami
Studio will need changesets.

Agent orchestration: Dispatch is the central orchestrator. Domain work belongs
to the domain app through A2A, not wrapper apps or direct cross-app database
shortcuts.

User-facing claims: Do not claim new Hummingbird product capabilities until the
workspace is installed and those capabilities are exercised in the product
surface. Existing upstream capabilities can be described as installed/supported
once provisioned.

Maintainability: Keeping setup and product development separate preserves a
clean source-sync story and makes future upstream intake safer.

## Risks And Constraints

Code-owned risks:

- The Code UI package exists locally but was not visible on public npm during
  the check. Browser-hosted Code UI should wait for package availability or be
  wired from the monorepo only if that is an explicit setup decision.
- Standalone CLI scaffolds initialize Git in their target directories. Nesting
  them inside Hummingbird would create nested repos unless deliberately
  normalized.

External/provider risks:

- Provider APIs, package versions, Node release status, and hosted MCP client
  capabilities can drift. Recheck before provisioning.
- Some current runtime defaults still point at Builder services until service
  cutovers are intentionally planned.

Cost risks:

- External provider verification can spend credits or quota. Keep development
  local/default where possible and use approved benefit pools or BYOK keys.

Source/license risks:

- The upstream project is MIT, but package namespace, marketplace, registry, and
  branding takeover are separate distribution decisions.

Verification scope:

- This report did not install or test Hummingbird. Verification is intentionally
  deferred to the provisioning roadmap.

Unclear requirements:

- Whether the standalone install lab must live inside the Hummingbird Git repo
  despite CLI-created nested Git repos.
- Whether Hummingbird is the public product name or internal codename.

## Recommended Direction

Choose Option A.

Install Hummingbird as the complete official multi-app workspace, include all
first-party templates plus hidden `macros`, use Dispatch as the central control
plane, connect external agents through Dispatch, document Agent-Native Code as
an existing CLI/Desktop/shared UI capability, and create official standalone
installs as sibling surfaces cataloged from Hummingbird.

Why: this is the most generous, complete adoption path. It respects the owner's
"go big" direction without inventing development work before the full product is
installed and understood. It also preserves upstream intake, avoids nested Git
confusion, and matches the official documentation's recommended workspace shape.

## Decision Points

### Hummingbird Install Shape

Options:

- Option A: Full workspace plus official standalone install lab.
- Option B: Full workspace only.
- Option C: Standalone fleet only.

Tradeoffs:

- Option A: Broadest and best aligned with the owner outline; more setup
  inventory to track.
- Option B: Simple but misses the explicit standalone-install requirement.
- Option C: More independent surfaces but works against the workspace/control
  plane default.

Recommendation: Option A.

Why: It installs the whole supported product surface without collapsing every
app into a single unreviewable product fork.

Implication if different: Option B removes standalone verification from the
setup definition of done. Option C requires more federation/deploy work and
should be treated as a demo-fleet project instead of the Hummingbird workspace.

### Standalone Install Topology

Options:

- Option A: Sibling standalone directories with a Hummingbird manifest.
- Option B: Nested `hummingbird/standalone/<app>` directories.
- Option C: No standalone directories until later.

Tradeoffs:

- Option A: Avoids nested Git repos while preserving official standalone
  outputs and Hummingbird attachment through manifest/docs.
- Option B: Visually attached to Hummingbird, but conflicts with the official
  CLI's auto-`git init` behavior unless normalized after generation.
- Option C: Simplest, but drops a required setup surface.

Recommendation: Option A.

Why: It keeps official scaffolds intact and avoids Git ambiguity.

Implication if different: Option B needs a deliberate rule for removing nested
`.git` metadata or accepting nested repos. Option C changes the scope.

### Deployment Default

Options:

- Option A: Single-origin path-prefix workspace deploy.
- Option B: Per-app subdomains first.
- Option C: Local-only until product development.

Tradeoffs:

- Option A: Matches official workspace guidance, shared login, and same-origin
  A2A.
- Option B: Preserves demo-fleet style but adds SSO/A2A complexity.
- Option C: Good for local exploration, incomplete for provisioning.

Recommendation: Option A.

Why: Hummingbird is a workspace product. One origin is the clean default.

Implication if different: Option B requires cross-app SSO/federation planning.
Option C means setup is not fully provisioned.

### Code UI Provisioning

Options:

- Option A: Include existing CLI/Desktop/shared Code UI capability and document
  browser-host path for later.
- Option B: Build a Hummingbird browser Code UI during setup.
- Option C: Exclude Code UI from Hummingbird setup.

Tradeoffs:

- Option A: Honors the existing capability without turning setup into product
  development.
- Option B: Adds custom host actions and UI integration work.
- Option C: Misses an explicitly requested surface.

Recommendation: Option A.

Why: The official docs say the old hidden `code` template was removed and
browser Code surfaces are built by mounting the shared package in a normal app.
That is product development, not install provisioning.

Implication if different: Option B needs its own implementation plan. Option C
weakens the "full extent" setup claim.

### Observability Baseline

Options:

- Option A: Built-in SQL observability first, optional external exporters.
- Option B: PostHog/Amplitude/Mixpanel/Sentry all on from day one.
- Option C: Skip observability until later.

Tradeoffs:

- Option A: No-cost, no-secret default with immediate feedback loop.
- Option B: Useful once credentials and data policy are explicit, but increases
  provider setup and data hygiene burden.
- Option C: Violates the owner requirement for agent-observability feedback.

Recommendation: Option A.

Why: It is built in, SQL-backed, and production-safe as a baseline.

Implication if different: Option B needs explicit credential and sampling
policy. Option C should not be accepted.

## Decision Questions For Discussion

- Install shape: proceed with full workspace plus standalone install lab?
  Recommendation: yes.
- Standalone topology: use sibling standalone directories cataloged from
  Hummingbird? Recommendation: yes.
- Deployment default: use one-origin path-prefix Hummingbird first?
  Recommendation: yes.
- Code UI: include CLI/Desktop/shared Code UI capability now, defer browser Code
  host to product development? Recommendation: yes.
- Product identity: is Hummingbird public product name or internal codename for
  now? Recommendation: leave undecided until after the full install is used.

## Next Step If Accepted

Use this report to execute the Hummingbird provisioning roadmap in
`_ops/planning/roadmaps/os-adoption/2026-07-09-hummingbird-workspace-provisioning-plan.md`.
Before running install commands, recheck the exact current package versions and
read the version-matched packaged docs from the installed `@agent-native/core`.

## Sources

Local sources:

- `_ops/planning/user-notes/hummingbird-outline.md`
- `_ops/planning/research/open-source-adoption/builder-io-coupling-audit.md`
- `_ops/planning/research/open-source-adoption/repo-and-infra-shapes.md`
- `_ops/planning/research/open-source-adoption/session-summary-2026-07-07.md`
- `_ops/readiness/2026-07-08-takeoff-audit.md`
- `_ops/source-sync/README.md`
- `README.md`
- `DEVELOPMENT.md`
- `package.json`
- `packages/shared-app-config/templates.ts`
- `packages/core/src/cli/create.ts`
- `packages/core/src/cli/templates-meta.ts`
- `packages/core/src/templates/workspace-root/README.md`
- `packages/core/src/templates/workspace-core/AGENTS.md`
- `packages/core/docs/content/getting-started.mdx`
- `packages/core/docs/content/multi-app-workspace.mdx`
- `packages/core/docs/content/workspace.mdx`
- `packages/core/docs/content/deployment.mdx`
- `packages/core/docs/content/dispatch.mdx`
- `packages/core/docs/content/workspace-connections.mdx`
- `packages/core/docs/content/observability.mdx`
- `packages/core/docs/content/a2a-protocol.mdx`
- `packages/core/docs/content/external-agents.mdx`
- `packages/core/docs/content/code-agents-ui.mdx`
- `packages/code-agents-ui/package.json`
- `_ops/credentials/partner-benefits-map.md`

External/current sources:

- Official upstream README: https://github.com/BuilderIO/agent-native/blob/main/README.md
- Official Node.js release guidance: https://nodejs.org/en/about/previous-releases
- npm registry checks through `pnpm view @agent-native/core version`,
  `pnpm view @agent-native/dispatch version`, and
  `pnpm view @agent-native/code-agents-ui version`

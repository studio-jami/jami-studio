# Hummingbird Workspace Provisioning Implementation Plan

Date: 2026-07-09
Status: Ready for owner review, setup-only
Source reports:

- `_ops/planning/research/feasibility-reports/os-adoption/2026-07-09-hummingbird-workspace-provisioning-feasibility.md`
- `_ops/planning/roadmaps/os-adoption/hummingbird-adoption-charter.md`
- `_ops/planning/decisions/2026-07-09-hummingbird-os-adoption-provisioning.md`

Owner: Jamie
Surface: Hummingbird repo setup, official Agent-Native workspace install, standalone install lab, provisioning, connections, and verification

## Purpose

Stand up Hummingbird as a fully provisioned adoption of the existing working
Agent-Native/Jami Studio codebase. This plan covers setup, install,
configuration, connection, documentation, and verification only. It does not
include additional product development.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked or needs owner decision

## Source Findings

- The official CLI creates a multi-app workspace when multiple templates are
  selected or passed through `--template`.
- Dispatch is always scaffolded into workspaces as the control plane.
- Workspace apps live under `apps/<name>` and share a root env, auth/database
  defaults, `packages/shared`, workspace resources, and A2A/MCP surfaces.
- Hidden templates are not shown in pickers but remain explicit-template
  scaffold targets.
- The current template inventory is `analytics`, `assets`, `brain`,
  `calendar`, `chat`, `clips`, `content`, `design`, `dispatch`, `forms`,
  `mail`, `plan`, `slides`, and hidden `macros`.
- Agent-Native Code is an existing CLI/Desktop/shared UI surface. The old
  hidden browser `code` template has been removed.
- Standalone scaffolds initialize their own Git root.
- Production deployment requires persistent SQL and production secrets.
- Built-in agent observability is SQL-backed and requires no external provider.
- External agents should connect through Dispatch for workspace/cross-app work.
- The Hummingbird local directory exists but is not yet populated.

## Locked Decisions

- Hummingbird is the full consumer workspace repo.
- Include all first-party app templates and hidden `macros`.
- Include Code UI as existing CLI/Desktop/shared capability, not a new custom
  browser app during setup.
- Keep standalone installs as official sibling install surfaces with a
  Hummingbird manifest.
- Use single-origin path-prefix deploy as the default production shape.
- Use SQL observability as the baseline feedback loop.
- Keep external telemetry optional and env/config-driven.
- Use approved credits/BYOK/local defaults only unless Jamie approves spend.
- Do not copy secret values into tracked files.

## Scope Boundaries

Security:

- No secret values in source, docs, examples, screenshots, generated app
  content, prompts, or planning artifacts.
- Production secrets must be generated fresh and stored in the appropriate
  platform secret store or Dispatch vault.

Runtime exposure:

- Public claims wait until provisioning verification records the installed
  Hummingbird surface.
- MCP clients connect through scoped OAuth/connect flows, not copied shared
  deployment secrets.

Providers:

- Use existing framework provider seams and official setup flows.
- Do not replace Builder runtime providers, CDN, search, model gateway, or
  publishing machinery in this plan.

Migrations:

- No destructive migrations.
- No application schema changes beyond official scaffolding/provisioning.

Customer-visible claims:

- Hummingbird may be described as provisioned only after the verification log is
  complete.

## Repo Guidance

- Stay on the current branch unless explicitly asked to do branch operations.
- Use official docs/source as the setup authority.
- Do not test Hummingbird install paths during planning. Verification belongs
  to execution.
- Record every setup-changing decision under `_ops/planning/decisions/`.
- Record future product deviations from upstream in the source-sync deviation
  catalog before merging them into Hummingbird.
- Keep Hummingbird docs durable and repo-attached, not a breadcrumb chain into
  dated planning files.

## Target Product Shape

Primary Hummingbird workspace:

```text
hummingbird/
  package.json
  pnpm-workspace.yaml
  .env.example
  AGENTS.md
  docs/
    operations/
      hummingbird-adoption-charter.md
      provisioning-manifest.md
      verification-log.md
      source-sync-deviations.md
  packages/
    shared/
  apps/
    dispatch/
    analytics/
    assets/
    brain/
    calendar/
    chat/
    clips/
    content/
    design/
    forms/
    mail/
    macros/
    plan/
    slides/
```

Standalone install lab:

```text
C:\Users\james\orgs\oss\hummingbird-standalone\
  analytics\
  assets\
  brain\
  calendar\
  chat\
  clips\
  content\
  design\
  dispatch\
  forms\
  mail\
  macros\
  plan\
  slides\
```

The Hummingbird repo records the standalone lab in
`docs/operations/provisioning-manifest.md`.

## Cross-Stream Dependency Map

- Workstream 1 creates repo/doc foundations used by every later stream.
- Workstream 2 performs official workspace install and produces app inventory.
- Workstream 3 performs standalone installs and produces standalone manifest.
- Workstream 4 provisions env/secrets/resources/connections after the app tree
  exists.
- Workstream 5 connects external agent, A2A, MCP, browser, Playwright, and
  observability surfaces after provisioning.
- Workstream 6 verifies and closes only after all previous streams produce
  evidence.

## Workstream 1: Repo And Documentation Foundations

Goal: Prepare Hummingbird as an intentional product workspace with durable docs
before running install commands.

Depends on:

- [x] Hummingbird outline captured.
- [x] Feasibility report and decision record drafted in Jami Studio `_ops`.

Enables:

- [ ] Official workspace install.
- [ ] Source-sync deviation tracking.
- [ ] Verification log.

Repo guidance:

- Do not copy secrets.
- Keep setup docs durable and ready to move into Hummingbird.

Primary areas:

- `C:\Users\james\orgs\oss\hummingbird`
- `_ops/planning/roadmaps/os-adoption`
- `_ops/planning/decisions`
- `_ops/source-sync`

Implementation tasks:

- [ ] Initialize or confirm the Hummingbird repo at
  `C:\Users\james\orgs\oss\hummingbird` using the target remote
  `https://github.com/studio-jami/hummingbird.git`.
- [ ] Add the durable adoption charter to Hummingbird docs.
- [ ] Add `docs/operations/provisioning-manifest.md`.
- [ ] Add `docs/operations/verification-log.md`.
- [ ] Add `docs/operations/source-sync-deviations.md` or a pointer to the
  canonical source-sync deviation catalog.
- [ ] Add Hummingbird `AGENTS.md` with setup, secret, source-sync, and
  no-workaround-install rules.
- [ ] Recheck latest official package versions immediately before install.

Exit criteria:

- [ ] Hummingbird has a repo root, docs skeleton, and remote.
- [ ] Setup rules are discoverable from Hummingbird itself.

Suggested verification:

- `git status --short --branch`
- `git remote -v`
- Read back the Hummingbird operation docs.

## Workstream 2: Official Full Workspace Install

Goal: Install the full Hummingbird multi-app workspace through the official CLI
surface.

Depends on:

- [ ] Workstream 1 docs and repo root.

Enables:

- [ ] Dispatch provisioning.
- [ ] Workspace connections and resources.
- [ ] Same-origin app verification.

Repo guidance:

- Use official CLI commands and version-matched docs.
- Include Dispatch and every visible first-party template.
- Include hidden `macros` through explicit template selection.

Primary areas:

- `hummingbird/package.json`
- `hummingbird/pnpm-workspace.yaml`
- `hummingbird/apps/*`
- `hummingbird/packages/shared`

Implementation tasks:

- [ ] Run the official create flow for Hummingbird workspace with all templates:
  `dispatch,analytics,assets,brain,calendar,chat,clips,content,design,forms,mail,macros,plan,slides`.
- [ ] Confirm the workspace app inventory matches the required app list.
- [ ] Confirm required shared packages are scaffolded for apps that need them.
- [ ] Install dependencies using the package manager pinned by the generated
  workspace.
- [ ] Copy the generated `.env.example` guidance into the provisioning manifest
  with placeholders only.
- [ ] Record the exact `@agent-native/core` version used.

Exit criteria:

- [ ] All required workspace apps exist under `apps/`.
- [ ] Dispatch exists and is the workspace control-plane app.
- [ ] Hidden `macros` is present.
- [ ] No secrets were written to tracked files.

Suggested verification:

- Read `apps/*/package.json` inventory.
- Read root `package.json` for `agent-native.workspaceCore`.
- Confirm generated docs/env files contain placeholders only.

## Workstream 3: Official Standalone Install Lab

Goal: Install each app as its own official standalone app and attach the lab to
Hummingbird through a manifest.

Depends on:

- [ ] Workstream 1 Hummingbird docs skeleton.

Enables:

- [ ] Standalone app acceptance evidence.
- [ ] Comparison between workspace and standalone behavior.

Repo guidance:

- Use official standalone scaffolds.
- Keep standalone outputs as sibling install surfaces to avoid nested Git repos.
- Do not hand-copy templates as a substitute for CLI output.

Primary areas:

- `C:\Users\james\orgs\oss\hummingbird-standalone\*`
- `hummingbird/docs/operations/provisioning-manifest.md`

Implementation tasks:

- [ ] Create sibling standalone installs for `analytics`, `assets`, `brain`,
  `calendar`, `chat`, `clips`, `content`, `design`, `dispatch`, `forms`,
  `mail`, `macros`, `plan`, and `slides`.
- [ ] Record each standalone path, template, package version, and generated
  command in the Hummingbird provisioning manifest.
- [ ] Install dependencies per standalone app using official/pinned package
  manager guidance.
- [ ] Record whether each standalone app needs provider credentials before a
  meaningful live check.

Exit criteria:

- [ ] Every app has an official standalone install surface.
- [ ] Hummingbird docs attach every standalone path and version.

Suggested verification:

- Read each standalone `package.json`.
- Confirm each standalone repo has a clean initial status after generation.

## Workstream 4: Provisioning, Secrets, Resources, And Connections

Goal: Provision Hummingbird with safe local/default config and approved provider
connection posture.

Depends on:

- [ ] Workstream 2 workspace exists.

Enables:

- [ ] Dispatch vault and MCP gateway verification.
- [ ] Workspace app readiness checks.
- [ ] Observability feedback loop.

Repo guidance:

- Secret values stay outside tracked files.
- Prefer Dispatch vault and workspace connections for reusable provider access.
- Use no-cost/approved-credit defaults.

Primary areas:

- `hummingbird/.env.example`
- Provider/platform secret stores
- Dispatch Vault
- Dispatch Resources
- Workspace Connections

Implementation tasks:

- [ ] Generate required local/production secret placeholders in docs:
  `BETTER_AUTH_SECRET`, `A2A_SECRET`, `OAUTH_STATE_SECRET`,
  `SECRETS_ENCRYPTION_KEY`, `DATABASE_URL`.
- [ ] Choose local development database posture and production persistent SQL
  target without writing secrets to source.
- [ ] Seed Dispatch workspace resources:
  `context/company.md`, `context/brand.md`, `context/messaging.md`,
  `instructions/guardrails.md`, `skills/company-voice/SKILL.md`, and initial
  `agents/*.md` profiles if available.
- [ ] Provision workspace connection metadata for approved providers without
  secret values in docs.
- [ ] Configure vault access default and document when manual grants should be
  used.
- [ ] Record provider fallback posture from the partner benefits map.

Exit criteria:

- [ ] Required env keys and secret locations are documented.
- [ ] Dispatch resources and vault posture are documented.
- [ ] Workspace connection readiness can be checked without asking for
  duplicate raw keys.

Suggested verification:

- Dispatch resource list/read calls.
- Workspace connection catalog/readiness calls.
- Vault key presence checks that do not print secret values.

## Workstream 5: Connected Surfaces

Goal: Connect the workspace surfaces the owner explicitly requires: Dispatch,
MCP/external agents, A2A, observability, Chrome DevTools, and Playwright.

Depends on:

- [ ] Workstream 4 provisioning.

Enables:

- [ ] End-to-end verification.
- [ ] Future product development from a known-good environment.

Repo guidance:

- Connect through official helpers and docs.
- Prefer Dispatch for workspace/cross-app external-agent access.
- Do not add a custom browser Code UI unless separately approved.

Primary areas:

- Dispatch MCP URL
- A2A endpoints
- Agent observability dashboard
- Chrome DevTools documentation
- Playwright documentation
- Agent-Native Code CLI/Desktop docs

Implementation tasks:

- [ ] Connect external agents through Dispatch MCP.
- [ ] Document direct app MCP URLs only for intentionally isolated app work.
- [ ] Verify workspace A2A discovery and at least one Dispatch-to-domain app
  delegation path.
- [ ] Confirm SQL observability dashboard route and trace capture.
- [ ] Configure optional Sentry/PostHog/Amplitude/Mixpanel only when approved
  credentials and sampling posture are ready.
- [ ] Document Chrome DevTools connection flow.
- [ ] Document Playwright connection flow.
- [ ] Document Agent-Native Code CLI/Desktop usage and browser Code UI deferral.

Exit criteria:

- [ ] Dispatch MCP is connected and scoped.
- [ ] A2A delegation is proven through a confirmed call.
- [ ] Observability feedback loop is accessible.
- [ ] Browser/debug tooling is documented for development.
- [ ] Code UI capability is documented without inventing a new app.

Suggested verification:

- Dispatch MCP connect/status check.
- `list_apps` or equivalent external-agent tool call through Dispatch.
- One A2A `ask_app`/`call-agent` path.
- Observability dashboard route load and trace listing.
- Playwright browser open/screenshot against the running workspace.

## Workstream 6: Final Verification And Closeout

Goal: Prove the Hummingbird setup is installed, provisioned, connected, and
documented.

Depends on:

- [ ] Workstream 2 workspace install.
- [ ] Workstream 3 standalone lab.
- [ ] Workstream 4 provisioning.
- [ ] Workstream 5 connected surfaces.

Enables:

- [ ] Future Hummingbird product development.
- [ ] Source-sync/deviation-controlled changes.

Repo guidance:

- Verification calls/tests prove this Hummingbird environment is connected.
- Do not add feature work during closeout.

Primary areas:

- `hummingbird/docs/operations/verification-log.md`
- `hummingbird/docs/operations/provisioning-manifest.md`
- Source-sync deviation catalog
- Hummingbird git history

Implementation tasks:

- [ ] Record workspace app inventory.
- [ ] Record standalone app inventory.
- [ ] Record official package versions used.
- [ ] Record env/secret locations without values.
- [ ] Record Dispatch resources, vault posture, workspace connections, and MCP
  gateway setup.
- [ ] Record A2A, MCP, observability, Chrome DevTools, and Playwright evidence.
- [ ] Record any source-sync deviations or state that no Hummingbird deviations
  exist yet.
- [ ] Commit and push Hummingbird setup work unless explicitly told not to push.

Exit criteria:

- [ ] Hummingbird workspace is fully installed.
- [ ] All requested apps are present in the workspace.
- [ ] All requested standalone install surfaces exist and are cataloged.
- [ ] Dispatch, A2A, MCP, observability, Chrome DevTools, and Playwright are
  connected or documented with exact blockers.
- [ ] No secrets are tracked.
- [ ] Future product development can begin from a documented baseline.

Suggested verification:

- Hummingbird `git status --short --branch`
- Package/app inventory reads.
- Official app/agent calls documented in the verification log.
- Secret scan/grep for credential-looking literals before commit.

## Final Verification And Closeout

- [ ] Read back all Hummingbird operation docs.
- [ ] Confirm the app inventory matches the charter.
- [ ] Confirm no tracked file contains real secrets.
- [ ] Confirm Hummingbird remote points at `studio-jami/hummingbird`.
- [ ] Push the branch when the work unit is complete unless Jamie explicitly
  says not to push.
- [ ] Update Jami Studio `_ops` with the final outcome and any deviations.

## Acceptance Criteria

- Hummingbird is a populated product workspace repo.
- The workspace contains Dispatch, all visible first-party apps, and hidden
  `macros`.
- Every app has an official standalone install surface cataloged from
  Hummingbird.
- Provisioning docs identify env keys, secret homes, approved provider posture,
  and no-cost constraints.
- Dispatch controls resources, vault posture, workspace connections, MCP, and
  A2A delegation.
- Agent observability feedback loop is connected and documented.
- Chrome DevTools and Playwright are connected and documented.
- Source-sync deviation tracking exists before product changes begin.
- Verification evidence proves the installed Hummingbird environment.
- Additional product development is explicitly out of scope for this plan.

## Implementation Order

1. Recheck package versions and version-matched docs.
2. Initialize or confirm the Hummingbird repo and operation docs.
3. Run the full official workspace install.
4. Install dependencies for the workspace.
5. Create official standalone install lab.
6. Fill the provisioning manifest.
7. Configure env/secret homes and Dispatch resources.
8. Configure workspace connections and vault posture.
9. Connect Dispatch MCP and A2A surfaces.
10. Connect observability, Chrome DevTools, and Playwright.
11. Record verification evidence.
12. Commit and push completed setup work.

## Expansion Track

These are explicitly after setup:

- Hummingbird public identity and naming.
- Voice-first real-time agent layer.
- Optional talking-avatar and boardroom presence.
- App renaming and workspace sidebar/category redesign.
- Tokenized styling and brand-system rollout.
- Provider replacement and namespace takeover.
- Browser-hosted Code UI product surface.

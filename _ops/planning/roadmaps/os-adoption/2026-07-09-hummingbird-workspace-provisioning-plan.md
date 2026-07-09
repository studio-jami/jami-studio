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

## Execution Contract

This roadmap is an execution runbook, not only a strategy note. During setup,
each workstream must leave a durable artifact that another agent or developer
can read without needing chat history.

Rules for the operator:

- Do not improvise around official install paths. If a command fails, inspect
  the current official docs/source, record the supported correction, and retry
  through the official surface.
- Recheck package versions immediately before install. Use the command form
  from current official docs, then record the exact command and package version
  in `docs/operations/provisioning-manifest.md`.
- Do not create custom app code, rename app surfaces, redesign navigation, or
  add product features in this roadmap.
- Do not paste secrets into docs, screenshots, examples, prompts, commits, or
  verification logs. Record secret homes and key names only.
- Every verification item needs evidence: command/call used, timestamp, result,
  and location of any supporting log or screenshot.
- If an item is blocked, mark it `[!]`, record the blocker, record the next
  unblock action, and keep going on independent workstreams.

Source-of-truth order:

1. Current official Agent-Native docs/source for command syntax and runtime
   behavior.
2. Hummingbird repo-local docs under `docs/operations/`.
3. Jami Studio `_ops` decision records and source-sync policy.
4. Chat notes only as temporary context until copied into one of the above.

Stop conditions:

- A command would write a secret value into a tracked file.
- A generated tree differs materially from official docs and the reason is not
  understood.
- A setup step requires paid spend not already approved by Jamie.
- A change would turn setup into product development.
- A destructive git, database, or migration operation would be needed.

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

## Required Deliverables

These files are the minimum handoff package inside the Hummingbird repo:

| File | Owner | Required contents |
| --- | --- | --- |
| `AGENTS.md` | Hummingbird repo | Setup rules, source-sync posture, secret policy, branch/commit rules, and where to record decisions. |
| `docs/operations/hummingbird-adoption-charter.md` | Workstream 1 | Durable copy of the adoption charter. |
| `docs/operations/provisioning-manifest.md` | Workstreams 1-6 | App inventory, exact commands, versions, paths, env key inventory, secret homes, provider posture, and standalone lab catalog. |
| `docs/operations/verification-log.md` | Workstreams 2-6 | Timestamped evidence for workspace install, standalone installs, connections, calls, screenshots, and secret scan. |
| `docs/operations/source-sync-deviations.md` | Workstream 1 | Empty deviation log at setup start, then any future product-specific divergence from upstream. |
| `docs/operations/provider-posture.md` | Workstream 4 | Provider names, approved/no-cost fallback, credential location type, and apps granted access. |
| `docs/operations/external-agent-connections.md` | Workstream 5 | Dispatch MCP URL shape, scoped client setup notes, direct app MCP exceptions, and connected-agent evidence. |
| `docs/operations/development-tooling.md` | Workstream 5 | Chrome DevTools, Playwright, Agent-Native Code CLI/Desktop, and local run/debug notes. |

The Jami Studio repo keeps these planning artifacts:

| File | Required update |
| --- | --- |
| `_ops/planning/roadmaps/os-adoption/2026-07-09-hummingbird-workspace-provisioning-plan.md` | Keep as the canonical pre-install roadmap until Hummingbird docs exist. |
| `_ops/planning/decisions/2026-07-09-hummingbird-os-adoption-provisioning.md` | Add any setup-shaping decision that changes these defaults. |
| `_ops/source-sync/` | Record future divergence policy and upstream sync notes when Hummingbird begins product changes. |

## Manifest Templates

Use these tables in `docs/operations/provisioning-manifest.md`.

Workspace app inventory:

```md
| App | Template | Path | Package version | Generated by | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| dispatch | dispatch | apps/dispatch | <version> | <command> | pending | Control plane. |
```

Standalone lab inventory:

```md
| App | Template | Path | Package version | Generated by | Git root | Status |
| --- | --- | --- | --- | --- | --- | --- |
| analytics | analytics | C:\Users\james\orgs\oss\hummingbird-standalone\analytics | <version> | <command> | yes/no | pending |
```

Env and secret inventory:

```md
| Key | Required for | Secret? | Local home | Production home | Value recorded? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| BETTER_AUTH_SECRET | Auth | yes | .env | deploy secret store | no | Generate fresh. |
```

Connection inventory:

```md
| Provider | Used by apps | Credential home | Grant path | Cost posture | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GitHub | dispatch, code workflows | Dispatch vault / provider OAuth | workspace connection | approved/BYOK | pending | No token in docs. |
```

Use this format in `docs/operations/verification-log.md`:

```md
## <YYYY-MM-DD HH:mm ET> - <surface>

- Operator:
- Command/call:
- Expected:
- Result:
- Evidence path:
- Follow-up:
```

## Command Patterns

Resolve the exact command from current official docs immediately before
execution. The local July 2026 docs/source show these supported shapes:

```powershell
# From C:\Users\james\orgs\oss
npx @agent-native/core@latest create hummingbird --template dispatch,analytics,assets,brain,calendar,chat,clips,content,design,forms,mail,macros,plan,slides

# From a workspace root, if an app must be added after initial create
npx @agent-native/core@latest add-app <app-name> --template <template>

# From C:\Users\james\orgs\oss
npx @agent-native/core@latest create hummingbird-standalone\<app-name> --standalone --template <template>
```

Package/version checks to record before install:

```powershell
node --version
pnpm --version
pnpm view @agent-native/core version
pnpm view @agent-native/dispatch version
```

If docs and package metadata disagree, prefer the current official docs/source,
record the disagreement in the manifest, and do not invent a workaround.

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

## App Setup Checklist

Each required app needs both a workspace row and a standalone row in the
provisioning manifest.

| App | Workspace path | Standalone path | Credential-gated? | Minimum evidence |
| --- | --- | --- | --- | --- |
| dispatch | `apps/dispatch` | `hummingbird-standalone\dispatch` | yes | Control plane package, route, MCP/A2A evidence. |
| analytics | `apps/analytics` | `hummingbird-standalone\analytics` | likely | Package, route, provider posture. |
| assets | `apps/assets` | `hummingbird-standalone\assets` | likely | Package, route, storage/provider posture. |
| brain | `apps/brain` | `hummingbird-standalone\brain` | possibly | Package, route, resource/read evidence. |
| calendar | `apps/calendar` | `hummingbird-standalone\calendar` | likely | Package, route, provider posture. |
| chat | `apps/chat` | `hummingbird-standalone\chat` | model-key gated | Package, route, agent chat readiness. |
| clips | `apps/clips` | `hummingbird-standalone\clips` | likely | Package, route, media/provider posture. |
| content | `apps/content` | `hummingbird-standalone\content` | likely | Package, route, provider posture. |
| design | `apps/design` | `hummingbird-standalone\design` | likely | Package, route, design/provider posture. |
| forms | `apps/forms` | `hummingbird-standalone\forms` | possibly | Package, route, local data readiness. |
| mail | `apps/mail` | `hummingbird-standalone\mail` | likely | Package, route, email provider posture. |
| macros | `apps/macros` | `hummingbird-standalone\macros` | possibly | Package, hidden-template evidence. |
| plan | `apps/plan` | `hummingbird-standalone\plan` | possibly | Package, route, planning artifact readiness. |
| slides | `apps/slides` | `hummingbird-standalone\slides` | possibly | Package, route, export/provider posture. |

Credential-gated means the app may install and route correctly while live
provider workflows wait for approved credentials. It is not a setup failure.

## Acceptance Evidence Matrix

| Acceptance criterion | Evidence source | Must include |
| --- | --- | --- |
| Hummingbird repo exists | `provisioning-manifest.md` | Path, remote, branch, initial commit hash if available. |
| Full workspace installed | `provisioning-manifest.md` | Create command, version, package manager, app list. |
| All apps present | `provisioning-manifest.md` | One row per required app, from filesystem/package reads. |
| Standalone lab installed | `provisioning-manifest.md` | One row per app, path, command, package version. |
| Secrets safe | `verification-log.md` | Scan command, result, ignored runtime secret files. |
| Dispatch ready | `verification-log.md` | Route/status check, workspace app listing, MCP status. |
| A2A ready | `verification-log.md` | Discovery result and one confirmed cross-app call. |
| MCP ready | `external-agent-connections.md` | Dispatch MCP URL shape, client setup, scoped access notes. |
| Observability ready | `verification-log.md` | Dashboard route and trace/log evidence. |
| Chrome DevTools documented | `development-tooling.md` | URL, launch/connect instructions, evidence path. |
| Playwright documented | `development-tooling.md` | Command, target URL, screenshot/log location. |
| Code UI covered | `development-tooling.md` | CLI/Desktop usage and browser Code deferral. |
| Source-sync ready | `source-sync-deviations.md` | Initial no-deviation state or recorded deviations. |

## Provider Posture Defaults

Use these defaults unless Jamie approves a different provider or spend:

| Category | Default posture | Notes |
| --- | --- | --- |
| Database | Local SQLite for dev, persistent SQL for production | Production target chosen during provisioning; no URL in source. |
| Auth secrets | Generated fresh per environment | Store in `.env` locally and deploy secret store in production. |
| Model keys | BYOK or approved credits | Do not commit model/provider keys. |
| Email | Existing framework/provider seams | Record provider choice and webhook secret home only. |
| Storage/media | Existing app/provider seams | Prefer no-cost local or approved provider setup first. |
| Analytics/telemetry | SQL observability baseline | External telemetry optional and env/config-driven. |
| Browser automation | Playwright with local browser target | Store screenshots/logs under untracked evidence path unless approved. |
| External agents | Dispatch MCP by default | Direct app MCP only for isolated app work. |

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

Deliverables:

- Hummingbird repo root with remote configured.
- `AGENTS.md` containing setup rules and secret policy.
- `docs/operations/` package with the required files listed above.
- Initial `provisioning-manifest.md` with empty tables ready to fill.
- Initial `verification-log.md` with a "planning accepted" entry.
- Initial `source-sync-deviations.md` stating "No Hummingbird deviations yet."

Directions:

1. Confirm whether `C:\Users\james\orgs\oss\hummingbird` is empty, already a
   Git repo, or a placeholder folder. Record the observed state in the
   manifest.
2. If it is not a Git repo, initialize only the Hummingbird repo. Do not create
   or switch branches in Jami Studio.
3. Add remote `origin` only after confirming the intended URL is
   `https://github.com/studio-jami/hummingbird.git`.
4. Copy the adoption charter into `docs/operations/` and keep the Jami Studio
   copy as the planning source until Hummingbird is committed.
5. Create empty operational docs before install so later steps have a place to
   record evidence as they work.
6. Add a Hummingbird `AGENTS.md` rule that setup verification proves this
   installed environment and is not a license to change product behavior.

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

Deliverables:

- Generated multi-app workspace in `C:\Users\james\orgs\oss\hummingbird`.
- Root package and workspace files committed-ready.
- All required app directories present.
- Workspace app inventory table filled in the provisioning manifest.
- Install command, package versions, and generated package manager recorded.

Directions:

1. From `C:\Users\james\orgs\oss`, run the current official create command for
   the Hummingbird workspace. Prefer the non-interactive `--template` list when
   supported by current docs/source; otherwise use the official picker and
   select the exact required templates.
2. Required templates: `dispatch`, `analytics`, `assets`, `brain`, `calendar`,
   `chat`, `clips`, `content`, `design`, `forms`, `mail`, `macros`, `plan`,
   `slides`.
3. If `dispatch` is automatically added by the CLI, record that behavior rather
   than adding a duplicate.
4. If hidden `macros` is not available through the picker, use explicit
   `--template macros` or the official add-app path documented in source.
5. After generation, fill the workspace app inventory from actual files, not
   memory.
6. Install dependencies with the generated package manager. Record lockfile
   type and package manager version.
7. Do not edit generated source to "fix" app behavior in this workstream.

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

Deliverables:

- One sibling standalone install directory per required template.
- Standalone lab inventory filled in the provisioning manifest.
- Per-standalone package version and command recorded.
- Note for every app stating whether meaningful live use requires provider
  credentials.

Directions:

1. Create `C:\Users\james\orgs\oss\hummingbird-standalone` as the lab root.
2. Generate each standalone app through the official standalone command. Do not
   copy from the workspace app tree.
3. Because standalone scaffolds may initialize Git, keep each app as a sibling
   directory under the lab root. Do not nest those Git roots inside the
   Hummingbird repo.
4. Use the app name as the directory name unless current official docs require a
   different generated name. Record any difference in the manifest.
5. After each app generates, read its `package.json` and record package/version
   evidence.
6. If an app cannot be meaningfully opened without provider setup, mark that as
   "credential-gated" rather than treating it as failed.

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

Deliverables:

- Complete env/secret inventory with no values.
- Provider posture doc with approved/no-cost defaults.
- Dispatch resource seed list and import/read evidence.
- Vault access posture and manual grant rules.
- Workspace connection catalog with provider labels and app grants.

Directions:

1. Start from the generated `.env.example`; do not invent env keys unless the
   generated workspace or official docs require them.
2. For every key, classify it as `secret`, `public config`, or `local-only`.
3. Generate real secrets only in the appropriate runtime location, never in
   tracked docs. For generated docs, use placeholders such as
   `<better-auth-secret>`.
4. Record production homes as location types: `Vercel env`, `Cloudflare secret`,
   `Dispatch vault`, `local .env`, or another explicit platform store.
5. Seed workspace resources through official Dispatch/resource tooling, then
   verify reads through the same surface.
6. For provider connections, record scopes and grants. Do not record tokens,
   OAuth refresh tokens, webhook secrets, signing secrets, or private keys.
7. For cost posture, prefer local/BYOK/approved-credit defaults and mark any
   paid dependency as `[!] Jamie approval required`.

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

Deliverables:

- `external-agent-connections.md` with Dispatch MCP setup and direct app MCP
  exceptions.
- A2A discovery evidence and one confirmed cross-app call.
- Observability route and trace evidence.
- `development-tooling.md` with Chrome DevTools, Playwright, and Code
  CLI/Desktop setup notes.
- Tooling connection evidence captured in `verification-log.md`.

Directions:

1. Treat Dispatch as the default external-agent entry point. Direct app MCP URLs
   are exceptions for isolated app work only.
2. Verify Dispatch can see all workspace apps before testing delegation.
3. Choose one low-risk cross-app call, such as Dispatch asking Plan or Brain
   for a simple read-only response. Record request, response summary, and any
   trace id.
4. Open observability through the official dashboard route and record the trace
   generated by the cross-app call.
5. Document Chrome DevTools and Playwright connection flows as repeatable local
   instructions. Include URL, command, browser profile expectations, and where
   screenshots/logs should be stored.
6. Document Agent-Native Code CLI/Desktop as existing capability. Do not add a
   browser Code app in this setup roadmap.

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

Deliverables:

- Final filled provisioning manifest.
- Final verification log with every acceptance criterion mapped to evidence.
- Secret scan result recorded without printing secrets.
- Hummingbird commit and push, unless Jamie explicitly says not to push.
- Jami Studio `_ops` update with final outcome and any changes to this plan.

Directions:

1. Do not close the roadmap on "looks good." Close it only when each acceptance
   criterion has an evidence entry or an explicit blocker.
2. Run a final inventory of workspace apps and standalone apps from the
   filesystem/package files.
3. Run a credential-looking literal scan before commit. If placeholders match
   the scan, record why they are placeholders or sanitize them.
4. Confirm ignored/private paths before commit. Secret-bearing runtime files
   must stay untracked.
5. Commit the Hummingbird setup as one coherent baseline commit unless the
   working tree naturally needs separated commits for generated workspace,
   standalone manifest, and docs.
6. Push the branch if it has a tracked remote and Jamie has not said otherwise.

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

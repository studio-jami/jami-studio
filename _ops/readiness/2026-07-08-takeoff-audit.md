# Takeoff Readiness Audit - 2026-07-08

## Scope

- Repo: `jami-studio` on `main`
- Hummingbird: read-only inspection only; no install or dependency writes
- Source sync: intentionally resting after first successful intake/staging run

## Current State

- `main` is clean and pushed to `origin/main`.
- Full local install has passed after the Windows build fixes.
- The repo currently exposes 32 pnpm workspace projects.
- Hummingbird exists locally at `C:\Users\james\orgs\oss\hummingbird`, but it is not a git repo and has no package/workspace files yet.
- Root `.env` exists locally in `jami-studio` and is untracked. It was not read during this audit.

## Ready

- Source sync has a working first pass: upstream source landed in `sync/intake/*`, merged to `sync/staging`, and left `main` untouched.
- Commit/push rules are now explicit in `AGENTS.md`.
- Local install/build prep is in a good state for Windows.
- Core observability primitives are already present:
  - SQL-backed trace, feedback, eval, experiment, and satisfaction tables.
  - Auto-instrumented agent runs.
  - `ObservabilityDashboard` for app/admin surfaces.
  - Optional tracking and OTel export paths without requiring external services.

## Needs Attention Before Hummingbird Install

1. Dependency security queue

   `pnpm audit --audit-level moderate --prod` currently reports 31 production vulnerabilities: 1 critical, 2 high, 23 moderate, and 5 low. Notable paths include `shell-quote` through React Native tooling, `ws` through libsql client dependencies, and `lodash-es` through the Plan mermaid/excalidraw stack.

   This should be treated as the first cleanup lane before heavy development or Hummingbird installation.

2. Builder identity remnants

   Root and package metadata still reference `BuilderIO/agent-native` in places such as `package.json`, `DEVELOPMENT.md`, package `repository` fields, and the VS Code extension README/media links.

   Generated corpus copies also contain Builder metadata. Those should be handled after source-of-truth metadata is corrected, not by hand-editing generated output first.

3. Hummingbird bootstrap shape

   Hummingbird is present but empty. Before installing anything there, decide whether it is:

   - a workspace root that consumes selected Jami packages/templates,
   - an app repo built from one Jami template,
   - or an aggregator/control-plane repo for multiple Jami workspaces.

   This choice determines package manager files, AGENTS guidance, env examples, and observability wiring.

4. Observability policy

   The recommended baseline is local SQL observability first, using the built-in dashboard and trace tables. External exporters, PostHog/Agent Native Analytics, Langfuse, Datadog, or OTel should be optional env/config integrations and should not be hardcoded during bootstrap.

5. Secrets and private ops cleanup

   The local `.env` should be reviewed manually before any ops folder is made public. Do not copy live tokens, webhook URLs, provider credentials, or private Builder/internal values into docs, examples, screenshots, or generated app content.

6. Hardening TODOs

   A few TODOs are worth keeping visible during takeover:

   - Extension SQL safety currently has a parser/allowlist follow-up.
   - Extension host bridge gating/consent needs a security audit.
   - Dispatch still has a SQL-backed counter-table follow-up.
   - Core and Plan strict TypeScript flips are still deferred.
   - Analytics collab has a structured JSON follow-up.

## Suggested Next Moves

1. Run a focused dependency remediation lane in `jami-studio`.
2. Run an identity cleanup lane for root/package metadata and public docs.
3. Decide the Hummingbird repo shape before creating package/workspace files.
4. Draft Hummingbird bootstrap docs and env examples without secrets.
5. Wire Hummingbird observability around local SQL first, with optional exporter settings only after runtime shape is clear.
6. Install selected Jami workspaces/packages into Hummingbird only after the above decisions are made.

## Do Not Do Yet

- Do not install dependencies in Hummingbird yet.
- Do not run another source-sync cycle until we intentionally resume that flow.
- Do not add external observability secrets or endpoints to source.
- Do not change package publishing metadata casually; handle identity changes in a focused lane.

# Source Sync Curation Notes - 610fe16

## Intake Scope

Upstream `source/main` at `610fe16aee3b4170f708188c44769cb59af34758` is being
curated on `sync/intake/610fe16` for a pull request into `sync/staging`.
`main` is not an integration target for this work.

The intake spans 74 upstream commits and 3,095 changed files since the shared
merge base `e6a3ac7`. Its material capability lanes include:

- resilient Core client loading and safe migrations (#2232)
- reusable Toolkit app surfaces and editor migrations (#2230, #2234)
- mobile companion capture, remote push, request telemetry, and desktop media
  reliability (#2226, #2228, #2208)
- delegated-run recovery, integrations, remote MCP discovery, and delivery
  reliability (#2224, #2216, #2207)
- workspace-template improvements across design, slides, plan, content,
  analytics, mail, forms, tasks, clips, calendar, and related skills

## Curation Posture

- Accept upstream runtime, reliability, security, test, and product work by
  default on this isolated staging intake.
- Preserve Jami Studio's operational records, source-sync machinery, visual
  identity, domain and repository ownership, and Jami-owned public docs shell.
- Keep inherited Builder workflows, publishing, deployment, billing, and
  dispatch automation out of the intake unless Jami explicitly adopts them.
- Treat registry/catalog changes as a Jami-owned lane: retain upstream
  capability metadata only when it does not reassert Builder product identity
  or public catalog ownership.
- Keep Hummingbird product-local documentation and its runtime integration
  separate from this framework intake. Hummingbird remains the full-suite
  reference implementation on the path back into Jami Studio; this boundary
  prevents its operating context from being flattened into framework source
  curation.

## Protected-Lane Decisions

| Lane | Decision |
| --- | --- |
| `.github/workflows/**` and inherited composite actions | Strip upstream additions and preserve Jami source-sync workflows. |
| `deploy/**`, Netlify/Cloudflare, release/publish automation | Preserve Jami deployment ownership; do not reactivate Builder infrastructure. |
| `_ops/**` | Preserve all Jami planning, source-sync, readiness, and historical records. |
| Root identity files and public docs chrome | Keep Jami ownership; take only isolated functional improvements after an explicit identity-safe review. |
| Registry/template catalog | Review as a Jami-owned capability lane; no automatic Builder catalog or public-copy reversion. |

## Conflict Handling Plan

The dry merge identified conflicts in Core MCP catalog content, Skills package
metadata, Pinpoint documentation, and Design/Slides files. Resolve each by
taking upstream behavior where safe, then reapply the existing Jami identity
overlay. Preserve explicit Jami-only instructions and product copy rather than
performing broad text replacement.

## Pending Evidence

- Record exact accepted, adapted, and stripped paths after the quarantined
  merge is resolved.
- Run focused validation for the changed Core, Toolkit, and affected template
  surfaces before the staging PR is considered ready to merge.

## Merge Resolution

The quarantined merge has no remaining conflicts. Upstream behavior was kept in
each resolution, with the Jami overlay re-applied only where the conflict was
about product identity or an existing Jami-owned link.

### Accepted

- The full 74-commit upstream capability set, including Core loading and
  migration hardening, remote MCP catalog expansion, Toolkit app surfaces and
  editor migrations, mobile capture/remote-push/reliability work, delegated
  run recovery, and the associated workspace-template improvements.
- Root guard scripts and feature-flag instructions: they add framework safety
  without asserting an upstream hosted-product identity.
- Shared UI/editor catalog additions. The declared incoming versions were
  checked against the registry on 2026-07-18; all match current releases,
  apart from `tailwind-merge` where the existing `^3.5.0` range already admits
  the current 3.6.0 release.
- `packages/pinpoint` Toolkit-capability documentation and the latest upstream
  Skills package version.

### Adapted

- `packages/core/src/client/resources/mcp-integration-catalog.ts`: preserved
  upstream connection state, availability, verification, logos, and updated
  endpoints; retained the existing Jami Studio connection-guide URLs for
  Linear, Supabase, and Neon.
- `packages/pinpoint/README.md` and `packages/skills/package.json`: retained
  upstream capability and version information while keeping Jami Studio-facing
  product copy.
- `templates/design/AGENTS.md`, `create-fusion-app.ts`, `MotionDock.tsx`,
  `ReviewPanel.tsx`, `Index.tsx`, and `shared/full-app.ts`: preserved upstream
  feature-flag behavior and implementation changes. Jami Studio is the
  experience-facing owner; Builder-named code, credentials, and endpoints stay
  only as the temporary runtime compatibility layer until Jami replaces them.
- `templates/slides/actions/index-design-system-with-builder.ts`: retained the
  upstream indexing behavior while presenting the user workflow as Jami Studio
  owned.

### Stripped

- `.github/actions/restore-dist-cache/action.yml`
- `.github/workflows/neon-preview-branches.yml`

Both conflicted with intentionally absent inherited automation and remain out
of the merge. No upstream workflow, publish, deploy, billing, or dispatch
automation is reintroduced. Jami `_ops` and source-sync records remain intact.

## Validation Record

- `git diff --check`: passed after conflict resolution.
- A focused Core MCP catalog test was prepared but could not start because the
  local workspace lacks the `vitest` executable after dependency state changed.
- `pnpm install --frozen-lockfile` was attempted twice (125 seconds and 306
  seconds, respectively) and timed out without output or completion. This is a
  local install-environment constraint, not a test failure. Focused Core,
  Design, and Slides tests remain required before this PR is merged into
  `sync/staging`.

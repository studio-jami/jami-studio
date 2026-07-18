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

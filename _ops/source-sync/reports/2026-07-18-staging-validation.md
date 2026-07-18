# Staging Validation - 2026-07-18

## Scope

This records post-merge validation of source-sync intake `610fe16`, merged into
`sync/staging` as `a2469360ae619e08158bc6ffa3c18d0296148a37`.

The validation ran from the matching intake tree after the staging merge. It
does not authorize a wholesale `sync/staging` to `main` merge.

## Passed

- Full workspace postinstall lifecycle: `pnpm run postinstall`
  - built 11 workspace packages;
  - rebuilt `better-sqlite3`;
  - Core corpus materialization and dist-import checks passed.
- Focused intake suites, previously recorded in
  `_ops/source-sync/intake/610fe16/curation-notes.md`:
  - Core MCP catalog: 13 tests;
  - Design full-app/motion/review surfaces: 29 tests;
  - Slides design-system indexing: 6 tests.
- `git diff --check` on the curated intake.

## Validation Harness Improvement

`pnpm guards` initially failed before starting any check on Windows because
`scripts/run-guards.ts` spawned `pnpm.cmd` without shell handling. The runner
now uses the same Windows-safe process option as the repository's other
cross-platform runners.

The localhost-fallback security guard also now excludes ignored
`packages/core/corpus.tmp-*` directories. Those are generated only when a
corpus materialization attempt is interrupted; scanning them creates a false
security signal from a transient source mirror.

## Remaining Guard Follow-Ups

After the harness fix, 20 of 26 guards pass. The remaining findings are
deliberate follow-up lanes, not reasons to revert the staged runtime intake:

| Guard | Current signal | Handling lane |
| --- | --- | --- |
| `guard:db-tool-scoping` | stale raw-DB denylist entries | audit the current action/query surface, then refresh only confirmed stale entries |
| `guard:plan-skills` | generated Plan skill copies are out of sync | review generated diff before running `pnpm sync:plan-skills` in its own change |
| `guard:plan-marketplace` | marketplace/plugin bundles are out of sync | review generated diff before running `pnpm sync:plan-marketplace` in its own change |
| `guard:no-env-mutation` | archived planning migration script is scanned as production code | decide whether the guard should exclude archived planning artifacts; do not alter the archive blindly |
| `guard:i18n-catalogs` | large localization and baseline debt after the intake | handle as a dedicated localized-docs/catalog normalization wave, not as a source-sync merge-side rewrite |

## Next Promotion Gate

Before selecting a capability lane for `main`, resolve or explicitly baseline
the applicable guard debt for that lane. The next main port should remain small
and product-shaped—for example one Core/Toolkit reliability slice or one
workspace surface—not the entire staging intake.

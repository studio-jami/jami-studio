# Core Client And Migration Safety — Promotion Packet

## Outcome

Give every Jami Studio workspace a faster client startup path and a dependable
upgrade path. Focused Core client entrypoints avoid loading unrelated editor
and widget code, while migration manifests, Doctor, and codemods make package
evolution understandable instead of surprising.

This is a candidate main-promotion lane, not a main merge authorization.

## Upstream Boundary

- Source implementation: `079e19a89cc895cee56063b4428b13b6abf67640`
  (`Improve Core client loading and migration safety`, upstream #2232).
- Staging baseline: `aefcb2fa58ad92176b8d00849cff098e052c14df`.
- No later functional Core commit follows that implementation in staging; the
  only later commit is the 610fe16 source-curation merge.

The upstream implementation is accepted in principle. This packet divides its
review surface so it can be proved without discarding useful capability.

| Supporting surface | Files in upstream implementation | Why it moves together |
| --- | ---: | --- |
| Focused Core client entrypoints and route recovery | 28 | Provides lazy widget loading, focused imports, client bootstrap, and route-chunk recovery. |
| Package lifecycle, Doctor, CLI, and manifests | 17 | Provides the migration inventory, warnings, upgrade codemods, and publishable manifest. |
| Mail compatibility consumers | 61 | Mechanical consumer migration to the focused Core entrypoints and shared route-recovery bootstrap. |
| Core documentation and matching locales | 225 | Explains the upgrade path; localized source meaning must move together. |
| Root/package metadata and changesets | 5 | Exposes entrypoints, ships the migration manifest, records release intent, and guards against regressions. |

## Curation Decision

- **Accepted:** focused client entrypoints, lazy built-in tool widgets,
  route-chunk recovery bootstrap, migration manifests/tombstones, Doctor
  preflight, and manifest-driven codemods.
- **Adapted only if necessary:** Jami-facing documentation terminology and
  examples. The runtime and migration behavior stay intact.
- **No product identity hold is expected:** this is framework reliability work;
  it does not impose Builder marketing, account, or hosted-delivery ownership.

## Validation Evidence

On 2026-07-19, the directly affected Core tests were run from the staged
implementation:

```sh
pnpm --filter @agent-native/core exec vitest run \
  src/client/client-bootstrap.spec.ts \
  src/client/uploads/index.spec.ts \
  src/client/chat/tool-call-display.spec.tsx \
  src/client/conversation/AgentConversation.spec.tsx \
  src/client/i18n-key-coverage.spec.ts \
  src/cli/doctor.spec.ts \
  src/cli/migration-codemod.spec.ts \
  src/cli/upgrade.spec.ts \
  src/package-lifecycle/deprecated-imports.spec.ts \
  src/package-lifecycle/upgrade-error.spec.ts \
  src/vite/client.spec.ts \
  --maxWorkers=25%
```

Result: **147 passed; 13 failed across four test files**. This is a Windows
portability and test-contract follow-up, not a feature rejection.

| Area | Finding | Promotion condition |
| --- | --- | --- |
| Doctor and workspace discovery | Fixtures return Windows `\\` separators where assertions and rule matching expect `/`; violation fixtures can therefore be missed. | Normalize relative paths at the tool boundary and prove violation discovery on Windows. |
| Migration codemods | Changed source paths are normalized to `/`, while expected package paths retain Windows separators; the package-file update is consequently omitted from the expected change set. | Use one canonical display/relative-path form throughout discovery, preview, and apply output. |
| Vite local-Core aliases | The affected test expects a regular-expression alias but receives a string alias. | Reconcile the intended alias contract and test the i18n focused-client entrypoint. |

The remaining seven test files passed. The previously recorded focused Core MCP,
Design, and Slides tests also remain passing for the broader staging intake.

### Follow-up Validation

The cross-platform correction was applied without changing the accepted client
or migration behavior:

- use `path.basename()` for the Doctor's `no-drizzle-push` guard instead of
  assuming POSIX separators;
- emit stable POSIX-relative paths from Doctor, upgrade diagnostics, and
  codemod diffs while retaining native paths for filesystem operations;
- normalize the codemod's filesystem boundary before looking up the nearest
  package manifest; and
- make Vite and workspace-glob assertions express platform-neutral path
  contracts.

Validation after the correction:

- the focused Core suite above plus `no-drizzle-push.spec.ts`: **12 files,
  163 tests passed**;
- `pnpm --filter @agent-native/core typecheck`: passed;
- `pnpm typecheck`: passed across all 35 workspace projects after making the
  shared workspace runner invoke `pnpm.cmd` through the Windows shell, matching
  the already-proven source-sync guard-runner behavior;
- `pnpm oxlint`: passed with existing warnings only; and
- `git diff --check`: passed.

`pnpm lint` still stops at the repository-wide `oxfmt --check .` baseline,
which currently reports 11,312 files and is unrelated to this focused change.
No mass formatting was performed. The Windows runner emits Node's `DEP0190`
shell-argument warning while invoking `.cmd`; it is recorded for a future
runner-hardening lane, not hidden.

## Promotion Guardrails

1. Keep the Windows portability fixes and regression coverage with this lane;
   do not paper over platform differences by removing migration coverage or
   loosening assertions.
2. Keep the 61 Mail compatibility changes with the focused-client entrypoints;
   separate review is welcome, but a partial client split must not leave the
   consumer on an obsolete bootstrap path.
3. Move matching Core documentation and locales with the public migration
   behavior, per repository documentation rules.
4. Retain the existing Core minor and dependent-package changesets, or replace
   them with an explicitly reviewed equivalent when this lane is promoted.
5. Require the focused test suite above, `git diff --check`, and a Core build
   before a main PR. A Linux CI pass complements but does not replace the
   Windows proof gathered here.

## Next Review Unit

Review and merge this Windows-safe staging follow-up. It removes a real
cross-platform blocker from the accepted Core lane. After that, prepare a main
PR containing this one complete reliability outcome—not a directory-wide
staging merge.

# Source Sync Curation Notes - 78c9db6

## Intake Result

Upstream `source/main` at `78c9db6113880186e081bf117082e061e015349b` (71
commits since `d5e07fc`) was merged into `sync/intake/78c9db6`.

Posture used:

- accept upstream source by default
- do not defer based on size
- strip only obvious Jami takeover contradictions
- keep inherited Builder infrastructure out of the intake branch

## Accepted By Default

- core runtime: replay upload hardening/bounds, integration identity work,
  external agent access, realtime sync hardening, SSR cache policy handling,
  observability sentiment analysis (new `observability/sentiment.ts`),
  framework reliability improvements (#2034, #2036, #2040)
- deploy pipeline: netlify background function multi-processor dispatch
  (`processorPathFromBody` for agent-chat `_process-run`, A2A `_process-task`,
  allow-listed background routes), anonymous SSR request context +
  cache-header scrubbing in generated edge workers, base-path-aware
  `assertSingleTemplateNetlifyBuildOutput`
- CLI: `skills.ts` content refactor into `cli/skills-content/*`, upgrade
  tooling, OpenAI-compatible PR recap providers
- templates: analytics replay fidelity/search/demo, clips mobile playback,
  calendar multi-account routing fixes, content database properties + Builder
  database refresh accuracy, design workspace workflows, forms UI polish,
  Slack A2A continuations (#2022)
- mobile-app: TypeScript 7 compatibility, safe-area migration
- package dependency/toolchain movement (typescript-7 only at root, kysely
  override dropped)

## Adapted

Conflicts were resolved by keeping upstream behavior and re-applying the
staging identity renames (`agent-native.com` -> `jami.studio`, `builder.io`
host family -> `jami.studio`, `Builder.io`/`Builder`/`BuilderIO` branding ->
`Jami Studio`), protecting `github.com/BuilderIO/...` URLs,
`vscode://builder.agent-native`, `itemName=Builder.agent-native`, and
`BUILDER_*` env names:

- 58 `packages/core/docs/content/**` mdx files (incl. all locale copies) —
  upstream content with Jami domains/branding re-applied
  (`resolve-docs-conflicts.mjs` in this folder)
- 14 source/template files with full branding renames, 2 CLI files with
  domain-only renames, `packages/skills/package.json` (upstream version,
  Jami description) (`resolve-source-conflicts.mjs` in this folder)
- renames carried through upstream refactors that MOVED staging-renamed
  content into new files:
  - `cli/skills.ts` -> `cli/skills-content/*.ts` (hosted `jami.studio`
    domains)
  - `observability/traces.ts` -> `observability/tracking-identity.ts`
    (`.jami.studio` app-slug suffix)

## Stripped Or Kept Out

- `.github/workflows/ci.yml`, `clips-desktop-build-check.yml`,
  `clips-desktop-release.yml`, `pr-visual-recap-fork.yml`,
  `pr-visual-recap-reusable.yml`, `pr-visual-recap.yml` (upstream modified;
  intentionally remain deleted — inherited workflows are never automatic)
- `.github/actions/restore-dist-cache/` (new upstream composite action that
  only serves the stripped `ci.yml`)
- Jami `_ops/source-sync` machinery preserved (upstream deletions predate the
  merge base and did not re-apply)

## Human Review Focus

- 18 files where NEW upstream code introduces `agent-native.com` references
  staging never renamed (e.g. `client/url-scrub.test.ts`,
  `a2a/artifact-response.ts`, `observability/sentiment.ts`,
  `desktop-app/src/main/ipc/updates.ts`, extension sidebar). The lab already
  tolerates upstream domains in specs/misc source; deeper identity decisions
  stay main-side.
- `packages/core/src/deploy/*` changes overlap the fork's Phase-1 surface
  (unified Node workspace build) and the fork's own deploy fixes
  (netlify-guard `dce7e5768` — upstream now has an equivalent base-path-aware
  guard; dedupe deliberately at the main merge).
- `upstream/changes-458` (Slack continuation retry hardening, 3 commits) is
  in-flight upstream work NOT on `source/main`; excluded from this intake.

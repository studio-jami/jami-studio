# Source Sync Curation Notes - e6a3ac7

## Intake Result

Upstream `source/main` at `e6a3ac7d6a52b6a1b98ee741f4e0cf63805c55c1` (192
commits since `78c9db6`, core 0.98.8 -> 0.105.0) was merged into
`sync/intake/e6a3ac7`.

Posture used:

- accept upstream source by default
- do not defer based on size
- strip only obvious Jami takeover contradictions
- keep inherited Builder infrastructure out of the intake branch

## Accepted By Default

All 192 upstream commits except the strip list below, including core runtime,
CLI, deploy pipeline, and template work across analytics/clips/content/design/
slides/mail/calendar/forms/plan (2,215 files in the merge commit).

## Adapted

Merge conflicts (186) were resolved by keeping upstream behavior and
re-applying staging identity renames (`agent-native.com` -> `jami.studio`,
Builder branding -> `Jami Studio`, protected `github.com/BuilderIO/...`,
`vscode://builder.agent-native`, `itemName=Builder.agent-native`):

- 121 `packages/core/docs/content/**` mdx + 44 other files auto-resolved by
  `resolve-conflicts.mjs`, which PROVES staging's side equals a pure rename
  transform of the merge base before taking upstream + re-applying the rename.
- 7 files where staging made selective display-string renames under larger
  upstream changes (`core-routes-plugin.ts`, `PromptComposer.tsx`,
  `TiptapComposer.tsx`, 4 content-template action/UI files):
  `resolve-rename-overlays.mjs` re-applied staging's exact base->ours hunks
  onto upstream content; `resolve-missed-strings.mjs` handled hunks upstream
  had reshaped.
- `README.md`: kept staging's Jami identity README (upstream delta was one
  Builder marketing tagline inside a section staging rewrote).
- `packages/docs/app/routes/templates.analytics.tsx`: took upstream's new
  FullStory-positioning copy with Jami identity re-applied. NOTE: staging's
  bespoke meta description ("Connect your warehouse...") was superseded by
  upstream copy — re-decide at main port if the bespoke copy matters.
- `templates/analytics/netlify.toml`: composed — upstream's explicit core
  rebuild in the build command + staging's `deploy/netlify/` ignore path and
  blanked `GA_MEASUREMENT_ID`.
- `packages/core/src/a2a/artifact-response.ts` line 371: upstream's NEW
  canonical-document origin check hardcoded `content.agent-native.com` while
  staging had renamed the artifact-host allow-list to `jami.studio`; renamed
  to `content.jami.studio` and renamed the new upstream test fixtures in
  `artifact-response.spec.ts` to match (a2a suite 262/262 green after).
- `packages/code-agents-ui/package.json` build script: upstream still uses
  Unix `cp`; re-applied jami main's portable
  `node -e "require('fs').copyFileSync(...)"` fix (postinstall was failing on
  Windows without it).

## Stripped Or Kept Out

- 8 delete/modify workflow conflicts kept deleted: `auto-publish.yml`,
  `ci.yml`, `clips-desktop-build-check.yml`, `clips-desktop-release.yml`,
  `desktop-release.yml`, `pr-visual-recap-fork.yml`,
  `pr-visual-recap-reusable.yml`, `pr-visual-recap.yml` (inherited workflows
  are never automatic).
- No new upstream `.github` files were introduced by the merge (verified
  against staging).
- Jami `_ops/source-sync` machinery preserved.

## Validation On This Branch (Windows)

- `pnpm install` + root postinstall green (after the `cp` portability fix).
- `packages/core` build green (tsc + cli tsc + finalize + check-dist-imports).
- Core vitest full run: 8,039 passed / 183 failed. Every failure category was
  baselined against pre-merge `origin/sync/staging` code via file-swap runs
  and matches: better-sqlite3 parallel EBUSY/EPERM file locks (77), timeouts
  (21), and Windows-environment assertion failures (e.g. `skills.spec.ts`
  Context X-Ray installs, `core-routes-plugin.spec.ts` signed-callback state)
  that fail identically on staging's own code. No merge-introduced failures
  found; a2a and all rename-touched suites green in isolation.

## Human Review Focus

- New upstream code still introduces `agent-native.com` references staging
  never renamed (same class as last intake); deeper identity decisions stay
  main-side with the de-Builder wave (Phase 2.75).
- `templates.analytics.tsx` meta copy supersession noted above.
- Upstream moved to TS 7 / core 0.105.0; version churn is not automatically
  useful for main — port by lane.

## Deploy-check signal (post-merge, 2026-07-17)

Vercel builds every push to this repo for two projects; they are a real
integration check on sync merges, with one structural caveat:

- **jami-studio-docs: SUCCESS on merge 296bee191** — the docs site built
  end-to-end from the merged tree (core 0.105 content + our identity
  overlays). Treat this as the meaningful green.
- **jami.studio-marketing: FAILURE on every sync-lane commit** (also failed
  on pre-merge f8d23506d) — NOT a merge regression. `packages/marketing`
  is a Jami-main-only package; it has never existed on the sync lane
  (upstream mirror has no marketing site), so the Vercel project's
  rootDirectory is missing and the build dies before it starts. Because this
  red is permanent, it poisons the combined commit status and will mask real
  failures on sync branches.
- Fix APPLIED (2026-07-17): stub `packages/marketing/vercel.json` added on
  the sync lane containing only `git.deploymentEnabled: { "sync/*": false,
  "sync/**": false }`. This makes the root directory exist (the failure was
  clone-time rootDirectory validation, which fires BEFORE any Ignored Build
  Step could run) and tells Vercel to never create deployments for sync
  branches. Port-safe: if it ever merges into main's real marketing package,
  disabling `sync/*` is a no-op for main. Verified error verbatim from
  deployment dpl_F6qQybKEtcmUz2hqbvmmJBynXhJK logs: `The specified Root
  Directory "packages/marketing" does not exist.` Note: fresh CLI OAuth
  tokens 403 on raw Bearer API calls (proof-of-possession) — all Vercel ops
  must go through the CLI now; `_ops/scripts/vercel-inspect.mjs` is dead.
  After this, sync-branch status = docs project only, and red means red.

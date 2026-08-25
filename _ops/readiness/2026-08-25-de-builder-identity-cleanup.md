# De-Builder.io Identity Cleanup - 2026-08-25

Closes the identity tail of the ratified Phase 2.75 (de-Builder.io) workstream:
repoints stale self-identity that still named the old owner, and removes the
dead upstream-intake pipe. Deliberately does NOT touch functional
identifiers or live upstream integrations — see "Intentionally left" below.
Supersedes the source-sync system described in `_ops/planning/...`
(source-sync docs deleted in this change; see history for the old
`_ops/source-sync/` content).

## Context decision (2026-08-25)

`BuilderIO/agent-native` is no longer upstream-to-us. It is a separate,
independently maintained open-source project that publishes its own
`@agent-native/*` npm versions and GitHub releases (verified 2026-08-25:
upstream core 0.174.x; our fork core 0.99.x). We publish under
`@jami-studio/*` via `scripts/publish-jami-scope.mjs`. Identity that *described
our repo* and pointed at BuilderIO was stale metadata — repointed. Identity
that *consumes assets hosted by the upstream project* stays until we host the
equivalent ourselves (npm/org rename decision).

## Repointed (self-identity -> studio-jami/jami-studio)

Self-referencing metadata that named the old owner. Our repo is public and
keeps the `templates/<name>` layout, so the download paths keep working.

- `registry.json` — shadcn registry `homepage`
- `packages/core/src/cli/create.ts` — `REPO` (template download source for
  `agent-native create` published builds)
- `packages/core/src/cli/index.ts` — `BUGS_URL`
- `packages/core/src/client/error-reporting.ts` — issue prefill URL
  (+ matching assertion in `error-reporting.spec.ts`)
- `packages/core/src/client/PoweredByBadge.tsx` — Open Source badge `href`
- `packages/core/src/server/onboarding-html.ts` — onboarding OSS link
- `packages/core/src/cli/app-skill.ts` — generated plugin manifest
  `repository` field
- `scripts/sync-plan-marketplace.ts` — generated plugin manifest
  `repository` field (committed outputs
  `.agents/plugins/agent-native-{design,visual-plans}/.claude-plugin/plugin.json`
  updated in the same change)
- `scripts/changeset-publish-sequential.ts` — missing-package error message
- `packages/desktop-app/src/main/ipc/updates.ts` — comment (see below)

## Removed (dead owner-intake machinery)

- `_ops/source-sync/` — README, policy, runbook, hard-rules, automation,
  intake packets, reports, scripts (`refresh-source-fork.ts`,
  `create-intake-packet.ts`, `source-sync-report.ts`)
- `.github/workflows/source-sync-intake.yml`
- `.github/workflows/source-sync-review.yml`
- Root `package.json` scripts `source-sync:refresh|intake|report`

Nothing else imports these; the content/plan/brain templates that contain the
word "source-sync" are an unrelated data-connector concept and were not
touched.

## Intentionally left (functional / separate project — flag on rename)

Repointing these without the prerequisite would break live features. Each has
a comment in-place at the most easily flipped spot.

1. **Recap reusable workflow** — `packages/core/src/cli/recap.ts`
   `uses: BuilderIO/agent-native/.github/workflows/pr-visual-recap-reusable.yml`.
   Upstream hosts the canonical workflow; our repo has no equivalent file.
2. **Public skills catalog default** — `packages/core/src/cli/skills.ts` and
   `packages/skills/src/index.ts` (`BuilderIO/skills`). studio-jami hosts no
   equivalent catalog; `BuilderIO/skills` is a live external repo.
3. **Desktop updater + release download URLs** —
   `packages/desktop-app/electron-builder.yml` `publish:` (owner BuilderIO),
   `packages/docs/lib/desktop-releases.ts`,
   `packages/docs/app/routes/download.tsx`,
   `templates/clips/**` release URLs. Upstream publishes the release
   artifacts; our repo has zero releases. Matches the 2026-07-17 canon:
   "BuilderIO release-download URLs ... wait on the npm/org rename."
4. **Builder SaaS / Builder-CMS** — `builder.io`/`builderio.xyz` host
   trust lists (`server/auth.ts`, `google-auth-plugin.ts`, `google-oauth.ts`,
   `oauth-return-url.ts`, `builder-browser.ts`, `mcp-embed-headers.ts`,
   `useBuilderStatus.ts`), `cdn.builder.io` assets (README images, uploads),
   and the Content template's Builder CMS integration. Live third-party
   platform + CMS, not legacy owner identity.
5. **VS Code extension marketplace identity** —
   `packages/vscode-extension` `"publisher": "Builder"` and the
   `vscode://builderio.agent-native/...` URI scheme documented in the
   external-agents skills. Renaming the publisher strands the listed VS Code
   extension; repointing the URI scheme breaks deep links already shipped in
   Plan/Design. Needs its own coordinated rename (marketplace listing +
   every URL emitter + docs).
6. **`@agent-native/*` npm scope, `/_agent-native/*` routes, CLI name,
   `AGENT_NATIVE_*` env vars** — the big functional-identifier rename.
   Owner-led decision per the 2026-07-17 Jami reframe canonical record and
   the `scripts/publish-jami-scope.mjs` design (dual-scope publishing).

## Follow-ups (owner actions, not done here)

- Local git state still carries the old intake topology: remotes
  `source` (studio-jami/agent-native-source) and `upstream`
  (BuilderIO/agent-native, push-disabled), and branches
  `sync/{base,staging,intake/*}` locally and on `origin`. Not removed
  because branch/remote deletion is owner-gated per AGENTS.md. If upstream
  intake is permanently retired, the equivalent ops are:
  `git remote remove source && git remote remove upstream` locally,
  delete the `sync/*` branches on `origin` (GitHub → Settings → Branches),
  and archive `studio-jami/agent-native-source` (GitHub repo settings) once
  accepted as unrecoverable-unnecessary.
- When the npm/org rename lands: stand up GitHub Releases in
  `studio-jami/jami-studio` (desktop artifacts + `clips-latest.json`),
  add `pr-visual-recap-reusable.yml` under `.github/workflows/`, create a
  skills-catalog repo, then flip items 1–3 in one coordinated change.
- `guard-public-packages.ts` and any future guard set should assert that the
  files in the "Repointed" list never regress to the old owner (optional;
  only if you want it).

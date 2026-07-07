# Claim Reset Execution — 2026-07-07

Status: executed from local workspace on 2026-07-07. Secrets were read only through masked tooling or
temporary process-local config and were not written to this repo.

## GitHub

Active org canon after cleanup:

| Repo | State |
| --- | --- |
| `studio-jami/jami-studio` | Public, standalone, not a fork, default branch `main` |
| `studio-jami/hummingbird` | Private, fresh repo, default branch `main` |
| `studio-jami/intercal` | Public, retained |
| `studio-jami/avatar-agent` | Public, retained |
| `studio-jami/.github-private` | Private, retained |
| `studio-jami/legacy` | Internal, retained archive |

Actions taken:

- Archived source snapshots into `studio-jami/legacy` commit `d11d4cd`:
  - `oss-legacy/`
  - `jami-harness-legacy/`
  - `studio-ui-legacy/`
  - `registry-legacy/`
  - `local-evals-legacy/`
  - `orchestra-legacy/`
  - `collectiva-legacy/`
  - `jami-studio-legacy/` (old separate `jami.studio` repo)
  - `hummingbird-legacy/`
- Created a standalone bridge repo, pushed current `main`, deleted old fork `studio-jami/JAMISTUDIO`,
  and renamed the standalone repo to `studio-jami/jami-studio`.
- Deleted active legacy repos after archive:
  - `oss`
  - `registry`
  - `jami-harness`
  - `studio-ui`
  - `local-evals`
  - `orchestra`
  - `collectiva`
  - `jami.studio`
  - old `hummingbird`
- Recreated `studio-jami/hummingbird` fresh.
- Local `origin` now points to `https://github.com/studio-jami/jami-studio.git`.
- Local `upstream` fetches `https://github.com/BuilderIO/agent-native.git`; push URL is set to
  `DISABLED`.

## Workflows

All inherited workflows were disabled by moving them out of `.github/workflows` into:

`_ops/planning/research/disabled-workflows-2026-07-07/`

Disabled files:

| Workflow | Intended role | Current disposition |
| --- | --- | --- |
| `ci.yml` | Main CI/test matrix | Replace with small Jami-owned CI once package names/env are settled |
| `changeset-check.yml` | Changeset enforcement | Keep concept, reintroduce after publishing decision |
| `auto-publish.yml` | npm release + downstream Builder dispatches | Remove/refactor; old npm/Builder assumptions |
| `auto-merge-version-packages.yml` | Release PR automation | Remove/refactor with new release policy |
| `sync-builder-starter.yml` | Notify Builder starter repo | Remove; upstream-specific |
| `sync-public-skills.yml` | Notify BuilderIO skills repo | Remove/refactor for Jami-owned marketplace |
| `neon-preview-branches.yml` | Neon + Netlify preview env wiring | Refactor only if Netlify preview shape returns |
| `keep-neon-warm.yml` | Scheduled health pings | Recreate later with real target URLs |
| `pr-visual-recap*.yml` | PR visual recap automation | Refactor after Jami-hosted Plan endpoint and npm package policy |
| `desktop-release.yml` | Desktop release | Refactor after signing/release ownership is defined |
| `clips-desktop-release.yml` | Clips desktop release | Refactor after product/release ownership is defined |
| `clips-desktop-build-check.yml` | Desktop build smoke | Recreate as needed in fresh CI |
| `evals.yml` | Gated evals | Recreate after eval substrate is confirmed |
| `hide-preview-bot-comments.yml` | Preview comment cleanup | Low priority; recreate only if needed |

`.github/workflows` is empty, so GitHub Actions will not run inherited jobs.

## Sentry

Old projects deleted:

- `avatar`
- `collectiva`
- `garden`
- `intercal`
- `jami-harness`
- `jami-studio-web`
- `local-evals`
- `orchestra`
- `registry`
- `studio-ui`

Fresh projects created:

- `avatar-agent`
- `hummingbird`
- `intercal`
- `jami-studio`

Verification: Sentry org `jami-studio` now reports exactly those four projects.

## PostHog

Old projects deleted:

- `marketing`
- `jami-harness`
- `studio-ui`
- `registry-docs`
- `orchestra`
- `collectiva`

Fresh projects created:

- `jami-studio` (`502357`)
- `hummingbird` (`502358`)
- `intercal` (`502359`)
- `avatar-agent` (`502360`)

Verification: PostHog project list now reports exactly those four projects.

## npm

Connected account:

- npm token verifies as `jamesnavinhill`.
- Verified Jami-owned packages under `@jami-studio/*` are still live and were not targeted.

Old public packages found under `@agent-native`:

- `@agent-native/core`
- `@agent-native/dispatch`
- `@agent-native/toolkit`
- `@agent-native/skills`
- `@agent-native/scheduling`
- `@agent-native/pinpoint`

Attempted `npm unpublish --force` for all six. npm CLI returned success-like output, but registry
packuments still show live versions. Ownership check shows the packages are owned by `steve8708`, not
`jamesnavinhill`, so deletion/deprecation is blocked from the current npm credentials.

Disposition: this was an over-broad cleanup attempt against upstream-owned packages, not Jami-owned
packages. It had no registry effect. npm is connected, and old `@agent-native/*` package deletion would
require owner access to the old scope/packages or npm support action. Do not treat those packages as
Jami-owned canon.

## Amplitude

Status: connected at account/API level. Existing local verification reports dashboard API `200`.

No Amplitude project deletion/creation was performed in this pass because the local canon treats
Amplitude as account-level/product analytics posture rather than a map-driven per-repo project surface.

## Provider Verification

`node _ops/credentials/verify-connections.mjs` from `oss-legacy` reports:

- 15 OK
- 0 fail
- 0 skipped

Verified providers include GitHub, npm, Sentry, PostHog, Amplitude, Cloudflare, Neon, Vercel, AWS,
Supabase, Algolia, ElevenLabs, Multica, Depot, and Confluent.

## Explicitly Out Of Scope

- GCS knowledge data warehouse: intentionally retained and untouched.
- Runtime provider replacement for `builder.io` services: not performed here.
- Package rename / npm scope migration in source: not performed here.
- Fresh CI implementation: workflows are parked; replacements should be introduced deliberately.

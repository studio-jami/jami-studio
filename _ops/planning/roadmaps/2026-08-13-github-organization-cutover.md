# GitHub Organization Cutover Roadmap

**Status:** Approved scope; ready to build the dry-run execution tooling.

**Prepared:** 2026-08-13

**Source:** `studio-jami` organization

**Destination:** `JamiStudio` organization, owned by `jamesnavinhill`

## Approved Decisions

- Use GitHub's native repository transfer API. Do not fork, zip, recreate, or mirror-push repositories.
- Keep `jami-studio-hq` as a member of `JamiStudio` for now.
- Keep `oss-legacy` local only. Do not create `JamiStudio/oss`.
- Keep `.github-private` local only. Do not transfer it and do not configure enterprise Copilot governance.
- Transfer the other nine online repositories from `studio-jami` to `JamiStudio`.
- Retain only these active GitHub-connected integrations: Vercel, PostHog, Sentry, Mintlify, Neon, npm, and Supabase.
- Do not migrate or reconnect the other source GitHub Apps unless later evidence proves they are active.
- Keep the existing `JamiStudio` base repository permission of `read`.
- Keep `studio-jami` as an empty namespace-preserving organization after the observation period. Do not delete it during this cutover.
- Use a seven-day observation period.
- Treat the `skills` references as repository-owned content. Keep the skills with `jami-studio` and update links to their real path inside that repository rather than creating a separate `skills` repository.
- Keep all domains, databases, provider accounts, projects, environment values, buckets, workers, queues, and analytics data where they are.

## Why Native Transfer

GitHub's native transfer preserves repository identity, complete Git history, branches, issues, pull requests, releases, projects, wiki, stars, watchers, repository secrets, webhooks, deploy keys, fork relationships, and Git LFS objects. GitHub redirects old repository web and Git URLs to the new location.

Do not create a repository or fork at an old `studio-jami/REPOSITORY` path after transfer. Doing so permanently removes that repository redirect.

The transfer command for each approved repository will be:

```powershell
$env:GH_TOKEN = gh auth token --user jamesnavinhill
gh api --method POST "repos/studio-jami/REPOSITORY/transfer" -f new_owner=JamiStudio
```

The API returns before the asynchronous transfer necessarily finishes. The execution script must poll and verify completion before continuing.

## Transfer Manifest

### Transfer to `JamiStudio`

| Order | Repository | Visibility | Main GitHub connections |
| --- | --- | --- | --- |
| 1 | `agent-native-source` | Public fork | Source fork for `jami-studio`; Actions disabled |
| 2 | `benefit-hunter` | Public | Vercel |
| 3 | `avatar-agent` | Public | Vercel, PostHog |
| 4 | `agency` | Private | Neon, Sentry, PostHog; manual production deployment |
| 5 | `etymalia` | Public | Vercel, Supabase |
| 6 | `hummingbird` | Private | Neon, Sentry, PostHog |
| 7 | `intercal` | Public | Vercel, Neon, Sentry |
| 8 | `jami-studio` | Public | Vercel, Mintlify, npm, source fork |
| 9 | `my-gardens` | Private | Neon, Sentry, PostHog; production Cloudflare workflow |

### Keep Local Only

| Repository | Action |
| --- | --- |
| `oss-legacy` | Leave the dirty local checkout unchanged. Its `studio-jami/oss` remote is already nonexistent. Do not publish it. |
| `.github-private` | Make a local archival clone before source cleanup, verify all refs, then remove the online source copy. Do not publish it to `JamiStudio`. |

The existing `oss-legacy` `.gitmodules` reference to `studio-jami/.github-private` becomes archival metadata. Do not rewrite it to a nonexistent destination.

## Confirmed Current State

- `studio-jami` has ten repositories: six public and four private.
- `JamiStudio` currently has no repositories.
- `jamesnavinhill` is an owner/admin of both organizations.
- `JamiStudio` currently has only `jamesnavinhill` as a member. Add `jami-studio-hq` as approved before transfer.
- `jami-studio-hq` is a personal account. No owned repositories were found, but personal-account shutdown is a separate future task.
- `studio-jami` has no teams, outside collaborators, organization webhooks, self-hosted runners, or GitHub Packages.
- No active GitHub Pages sites, repository webhooks, or deploy keys were found.
- `studio-jami` has one organization Actions secret: `MULTICA_SECONDPASS_WEBHOOK_URL`.
- Repository secrets or variables exist on `intercal`, `hummingbird`, and `my-gardens`.
- `intercal` has two open Dependabot pull requests. `jami-studio` has two open pull requests.
- The source organization has 20 GitHub App installations. Only the approved active integration set will be carried forward.
- Local `avatar-agent` and `oss-legacy` worktrees are dirty. The migration must not alter or discard those changes.
- Local `avatar-agent` is behind the online repository. The online repository is authoritative for transfer.

## Integration Scope

### Retain and Reconnect

| Integration | Required action |
| --- | --- |
| Vercel | Install/authorize for `JamiStudio`, reconnect existing projects to transferred repositories, and retain all project IDs, domains, and environment variables. |
| PostHog | Install/authorize where its GitHub integration is actively used; retain existing projects, keys, and data. |
| Sentry | Install/authorize where repository integration is active; retain existing organizations, projects, DSNs, and data. |
| Mintlify | Install/authorize for the documentation repository that uses it; retain the current project. |
| Neon | Install/authorize for repositories using Neon; retain project IDs, branches, credentials, and databases. |
| npm | Retain npm organization/scope and package ownership. Update GitHub repository metadata and any trusted-publisher owner references before the next publish. npm is not a GitHub App installation. |
| Supabase | Install/authorize for repositories with an active Supabase GitHub link; retain projects, databases, Auth, Storage, and credentials. |

Target App access may need to be granted after each repository arrives because `JamiStudio` currently has no repositories. Use the simplest supported access mode. There is no requirement to change the current trusted-member model or add new access restrictions.

### Do Not Carry Forward

Do not install or reconnect these source Apps during this cutover unless live evidence contradicts the approved decision:

`ara-swe`, `builder-io-integration`, `cloudflare-casb`, `confidence-bot`, `cursor`, `depot-code-access`, `depot-managed-runners`, `galaxy-push-to-deploy-app`, `github-copilot-for-linear`, `grok-by-xai`, `linear-code`, `multica-ai`, `notion-ai-connector`, and `notion-workspace`.

Cloudflare, GCP, DigitalOcean, Upstash, Stripe, Amplitude, Anam, ElevenLabs, Google OAuth, and other providers remain active where used, but they are not being treated as GitHub Apps. Their resources and credentials stay unchanged. We verify their deployments and runtime health only.

## Preflight

1. Authenticate `gh` explicitly as `jamesnavinhill`.
2. Confirm `jamesnavinhill` remains owner/admin of both organizations.
3. Add `jami-studio-hq` to `JamiStudio` and verify membership.
4. Confirm the nine destination names are still available and `JamiStudio` has no fork in the `BuilderIO/agent-native` network.
5. Keep `JamiStudio` base repository permission at `read`.
6. Record the expected private-repository access. The organizations contain trusted members; do not add new teams or access gates.
7. Install or prepare the approved active GitHub integrations only.
8. Do not recreate `MULTICA_SECONDPASS_WEBHOOK_URL` or install Multica; it is outside the approved active integration set.
9. Check active workflows for `id-token: write`. For any active OIDC deployment, update its cloud trust for GitHub's post-transfer immutable subject before moving that repository. This is required compatibility work, not a new access restriction.
10. Create a local archival clone of `.github-private` outside the live repositories, verify all refs, then remove its source copy.
11. Record a simple before-state snapshot for the nine transfer repositories.

The before-state snapshot contains no secret values. Record repository ID, visibility, fork parent, default branch SHA, branches, tags, open PRs/issues, Actions state, environment names, secret and variable names, and the latest relevant workflow status.

## Transfer Procedure

Run the same loop for one repository at a time:

1. Temporarily avoid pushes and merges for that repository.
2. Record its latest default-branch SHA.
3. Submit the native transfer request as `jamesnavinhill`.
4. Poll `JamiStudio/REPOSITORY` until the owner, repository ID, and SHA match.
5. Confirm the old URL redirects to the destination. Use authenticated checks for private repositories.
6. Verify visibility, branches, tags, fork parent, open PRs/issues, Actions state, environments, and secret/variable names.
7. Grant the transferred repository access to only the approved integrations it actually uses and reconnect the existing provider project.
8. Run its repository-specific smoke check.
9. Update its known local Git remote without changing the worktree.
10. Continue only after the repository is healthy.

If a transfer succeeds but an integration does not reconnect, stop the sequence and fix the existing provider link. Do not create a replacement repository, external project, database, domain, or deployment.

## Repository Checks

### 1. `agent-native-source`

- Keep Actions disabled.
- Confirm it remains a fork of `BuilderIO/agent-native` and preserves its repository ID.
- Pause `jami-studio` source-sync before transfer.
- Immediately update the source-sync Git URL to `JamiStudio/agent-native-source` after the fork arrives.
- Keep source-sync paused until `jami-studio` is also transferred and verified.
- Do not enable its upstream npm, Netlify, Neon, or release workflows.

### 2. `benefit-hunter`

- Reconnect its existing Vercel project.
- Verify `benefits.jami.studio` without changing Cloudflare DNS.
- Leave dormant Supabase configuration dormant.

### 3. `avatar-agent`

- Reconnect its existing Vercel project.
- Verify Preview, Production, `avatar.jami.studio`, and PostHog event flow.
- Do not modify the dirty or behind local checkout beyond updating its Git remote after transfer.

### 4. `agency`

- Preserve the manual DigitalOcean/Cloudflare production deployment at `gateway.jami.studio`.
- Verify Neon, Sentry, PostHog, and the production health endpoint.
- A credential-like `apiKey` is tracked in `opencode.json`. Record a separate security follow-up to rotate and remove it; it is not a cutover blocker. Do not expose its value in migration evidence.
- Record the current CI startup-failure state so it is not incorrectly blamed on transfer.

### 5. `etymalia`

- Reconnect Vercel and Supabase.
- Verify the `staging` and `Production` environments and `CLOUDFLARE_API_TOKEN` environment-secret name remain.
- Preserve Supabase, Cloudflare runtime resources, Stripe, and `etymalia.jami.studio`.
- Run the Cloudflare image workflow only after authorization is confirmed.

### 6. `hummingbird`

- Reconnect Neon, Sentry, and PostHog.
- Verify repository secret `NEON_API_KEY` and variable `NEON_PROJECT_ID` remain.
- Preserve Cloudflare resources and any confirmed live Netlify projects without recreating them.

### 7. `intercal`

- Reconnect Vercel, Neon, and Sentry.
- Verify all existing repository secret names, `NEON_PROJECT_ID`, environments, CodeQL, Dependabot, and both open PRs.
- Leave Multica second-pass disabled and do not recreate its organization secret or install its GitHub App.
- Keep the manually disabled Cloud Run and scheduled pipeline workflows disabled.
- Preserve the database, GCP, R2, Upstash, and `intercal.jami.studio`.
- The pipeline references `SENTRY_DSN`, but it was absent from the repository-secret list. Confirm its actual source before calling CD healthy.

### 8. `jami-studio`

- Transfer after `agent-native-source`.
- Update the `origin` and `source` Git remotes; leave `BuilderIO/agent-native` as `upstream`.
- Reconnect existing Vercel and Mintlify projects.
- Keep the npm scope and package ownership unchanged.
- Update package repository/homepage/bugs metadata and npm trusted-publisher records, if any, before the next publish.
- Keep repository-owned skills in this repository. Locate their real in-repository path and update extension/docs links to that path rather than a standalone `JamiStudio/skills` repository.
- Re-enable source-sync only after both repositories and updated paths are verified.

### 9. `my-gardens`

- Transfer last in a quiet production window.
- Reconnect Neon, Sentry, and PostHog where their GitHub links are active.
- Verify repository secrets `CLOUDFLARE_API_TOKEN`, `GARDENS_ENV_FILE`, `NEON_API_KEY`, and `SENTRY_OPERATIONAL_AUTH_TOKEN`, plus variable `NEON_PROJECT_ID`.
- Manually dispatch `Deploy Gardens app`.
- Preserve Cloudflare Worker `gardens-app`, `play.mygardens.app`, R2, Hyperdrive, runtime secrets, Neon, Stripe, observability, provider accounts, and the Framer apex site.
- Do not attach `play.mygardens.app` to Vercel.

## Local Remote Updates

Update only these known GitHub-owned remotes after the corresponding transfer succeeds:

```text
avatar-agent  -> https://github.com/JamiStudio/avatar-agent.git
benefit-hunter -> https://github.com/JamiStudio/benefit-hunter.git
etymalia -> https://github.com/JamiStudio/etymalia.git
hummingbird -> https://github.com/JamiStudio/hummingbird.git
intercal -> https://github.com/JamiStudio/intercal.git
jami-studio origin -> https://github.com/JamiStudio/jami-studio.git
jami-studio source -> https://github.com/JamiStudio/agent-native-source.git
```

Keep the existing `etymalia` remote name unless there is a practical reason to rename it. Leave `oss-legacy` unchanged.

## Documentation Update

After each repository is verified, update active references from `studio-jami` to `JamiStudio`:

- Workflow clone, checkout, dispatch, and source-sync URLs.
- Package `repository`, `homepage`, and `bugs` fields.
- Public links, clone instructions, badges, source/edit links, operational `gh` commands, and User-Agent project URLs.
- External provider repository links.
- Current organization identity references.

Do not bulk-replace all `studio-jami` strings. Preserve historical records, Vercel account/project notation, and package scopes such as `@studio-jami/*` unless separately changing those products. Label historical references only when they could be mistaken for current instructions.

Search all live repositories for:

```text
github.com/studio-jami
github.com/jami-studio-hq
studio-jami/
jami-studio-hq/
```

Classify every remaining result as current and updated, historical and retained, external account notation and retained, package scope and retained, or broken and fixed.

## Final Verification

- Exactly nine approved repositories exist under `JamiStudio` with their original repository IDs and expected visibility.
- `studio-jami` contains only `.github-private` until its local archive and removal are separately confirmed, then contains no repositories.
- `oss-legacy` remains local only and unchanged.
- `.github-private` exists in the verified local archive and is not under `JamiStudio`.
- `jami-studio-hq` is a member of `JamiStudio`.
- Old public repository URLs redirect to their destination; old private URLs redirect when authenticated.
- Destination clone/fetch works with intended credentials.
- Vercel, PostHog, Sentry, Mintlify, Neon, and Supabase have access only where needed.
- npm package ownership and scopes remain unchanged; current repository metadata points to `JamiStudio`.
- Unapproved legacy GitHub Apps were not installed in `JamiStudio`.
- Required CI and deployment checks pass or match a documented pre-existing failure.
- Domains, auth, database, storage, billing, jobs, and telemetry are healthy.
- No domain, DNS record, external project, database, bucket, worker, queue, or analytics project was recreated.
- Active documentation points to `JamiStudio`.

Known public/service domains to verify include:

- `www.jami.studio`
- `avatar.jami.studio`
- `benefits.jami.studio`
- `etymalia.jami.studio`
- `intercal.jami.studio`
- `gateway.jami.studio`
- `media.jami.studio`
- `mygardens.app`
- `play.mygardens.app`

Enumerate any additional committed production domains in the execution snapshot.

## Observation and Source Retirement

1. Observe the completed transfer for seven days.
2. Monitor deployments, scheduled workflows, provider events, auth, telemetry, database jobs, npm metadata, and old-URL redirects.
3. Keep `studio-jami` as the empty namespace-preserving organization.
4. After all target integrations are verified, uninstall the obsolete source GitHub Apps. GitHub App installations cannot be transferred.
5. Do not delete `studio-jami` during this cutover.
6. Do not close `jami-studio-hq` during this cutover.

## Execution Tooling

The execution pass should add one small PowerShell script with:

- Dry-run behavior by default and an explicit execute switch.
- An allowlist of the nine transfer repositories in the approved order.
- Assertions for authenticated user, source owner, target owner, and available destination names.
- Before-state snapshot with no secret values.
- One asynchronous transfer at a time.
- Polling for destination owner, unchanged repository ID, and expected SHA.
- Public and authenticated-private redirect checks.
- Repository-specific post-transfer checks with a hard stop on failure.
- Idempotent updates for known local remotes.
- Machine-readable and human-readable result reports.
- No support for deleting organizations, deleting personal accounts, changing DNS/databases, or publishing local-only archives.

## Sources

- GitHub, [Transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- GitHub REST API, [Transfer a repository](https://docs.github.com/en/rest/repos/repos#transfer-a-repository)
- GitHub, [Installing a GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-github-marketplace-for-your-organizations)
- GitHub, [OpenID Connect and immutable subject claims](https://docs.github.com/en/actions/reference/security/oidc#immutable-subject-claims)
- npm, [Trusted publishing](https://docs.npmjs.com/trusted-publishers/)

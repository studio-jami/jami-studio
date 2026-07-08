# Dependabot Remediation Handoff

Date: 2026-07-08

## Context

GitHub reports open Dependabot alerts on `studio-jami/jami-studio` after the upstream source-sync merge to `main`.

We have not attempted remediation yet. The source-sync merge fixed many older npm lockfile alerts, but several direct manifest and Rust lockfile alerts remain open.

This should be handled as a focused security remediation work unit, separate from source-sync.

## Current Open Alerts

Queried with:

```sh
gh api repos/studio-jami/jami-studio/dependabot/alerts --paginate
```

Open alerts observed:

| Severity | Ecosystem | Package | Manifest | Patched version | Notes |
| --- | --- | --- | --- | --- | --- |
| high | rust | `rustls-webpki` | `templates/clips/desktop/src-tauri/Cargo.lock` | `0.103.13` | Denial of service via panic on malformed CRL BIT STRING. |
| medium | rust | `tar` | `templates/clips/desktop/src-tauri/Cargo.lock` | `0.4.46` | PAX header desynchronization issue. |
| medium | rust | `glib` | `templates/clips/desktop/src-tauri/Cargo.lock` | `0.20.0` | Unsound iterator implementations. |
| low | rust | `rand` | `templates/clips/desktop/src-tauri/Cargo.lock` | `0.8.6` | Unsound custom logger case. |
| medium | npm | `nitro` | `packages/core/package.json` | `3.0.260429-beta` | Open redirect advisory. Patched version is beta; handle carefully. |
| medium | npm | `nitro` | `packages/core/package.json` | `3.0.260429-beta` | Proxy scope bypass advisory. Same upgrade path as above. |
| medium | npm | `@anthropic-ai/sdk` | `packages/core/package.json` | `0.91.1` | Insecure default file permissions in local filesystem memory tool. |
| low | npm | `esbuild` | `templates/design/package.json` | `0.28.1` | Dev server arbitrary file read on Windows. |

Many older alerts in `pnpm-lock.yaml` were already marked `fixed` by GitHub after the upstream merge. Do not chase fixed alerts unless GitHub reopens them.

## Recommended Order

1. Refresh the alert list.
2. Fix direct npm alerts that have stable patched versions.
3. Evaluate `nitro` separately because the patched version is beta.
4. Fix Rust lockfile alerts in Clips desktop.
5. Run focused validation.
6. Commit and push remediation as one or more security-focused commits.

## NPM Remediation

### `@anthropic-ai/sdk`

Target: `>=0.91.1`.

Likely command:

```sh
pnpm --filter @agent-native/core add @anthropic-ai/sdk@^0.91.1
```

Then validate:

```sh
pnpm --filter @agent-native/core exec vitest --run src/agent/engine/anthropic-engine.spec.ts src/server/credential-provider.spec.ts --passWithNoTests
```

### `esbuild`

Target: `>=0.28.1` in `templates/design/package.json`.

Likely command:

```sh
pnpm --filter design add -D esbuild@^0.28.1
```

Then validate a focused design command/test if available:

```sh
pnpm --filter design typecheck
```

### `nitro`

Target reported by GitHub: `3.0.260429-beta`.

Caution: this is a core server dependency and the patched version is a beta. Do not blindly upgrade without reading release notes/changelog and running server/plugin tests.

Suggested approach:

1. Confirm whether a newer stable patched Nitro version exists.
2. If only beta is patched, decide whether to:
   - upgrade to the beta and test thoroughly,
   - pin an upstream transitive safe version if applicable,
   - document risk and defer until stable if the vulnerable route-rule behavior is not reachable in our templates.
3. Run focused core server tests before merging.

Useful validation:

```sh
pnpm --filter @agent-native/core exec vitest --run src/server/core-routes-plugin.spec.ts src/server/framework-request-handler.spec.ts --passWithNoTests
```

## Rust Remediation

Affected manifest:

```txt
templates/clips/desktop/src-tauri/Cargo.lock
```

Start in:

```sh
cd templates/clips/desktop/src-tauri
```

Likely commands:

```sh
cargo update -p rustls-webpki --precise 0.103.13
cargo update -p tar --precise 0.4.46
cargo update -p rand --precise 0.8.6
cargo update -p glib --precise 0.20.0
```

If dependency constraints prevent precise updates, inspect the dependency chain:

```sh
cargo tree -i rustls-webpki
cargo tree -i tar
cargo tree -i rand
cargo tree -i glib
```

Then update the parent crate where needed.

Validation:

```sh
cargo check
```

If desktop dependencies are heavy or platform-sensitive, at minimum document any blocked checks and run the closest package-level JS/Rust tests available.

## Verification Checklist

- `gh api` shows fewer open alerts, or the remaining alerts are explicitly documented.
- `pnpm-lock.yaml` changes are limited to security dependency movement.
- `Cargo.lock` changes are limited to security dependency movement and necessary parents.
- No Builder/Jami identity files are changed incidentally.
- Focused core/design/clips checks pass.
- Final commit is pushed to `origin/main` or a review branch, depending on risk.

## Suggested Commit Shape

If the fixes are straightforward:

```sh
git commit -m "Remediate Dependabot alerts"
```

If `nitro` requires a beta upgrade or behavior review, split:

```sh
git commit -m "Remediate direct Dependabot alerts"
git commit -m "Update Nitro for Dependabot advisories"
```

## Notes

- Do not mix this with source-sync changes.
- Do not use `pnpm audit fix` blindly; this repo has many workspaces and package catalogs.
- Prefer targeted package manager updates so review stays understandable.
- If an alert remains because the patched version is beta or blocked by an upstream dependency, record the reason in this file or a follow-up readiness note.

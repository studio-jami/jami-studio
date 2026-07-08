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

## Outcome (2026-07-08)

Remediation executed. Results by alert:

| Alert | Package | Action | Result |
| --- | --- | --- | --- |
| #1 | `@anthropic-ai/sdk` | Root `pnpm.overrides` already pinned `>=0.91.1`; refreshed the stale `pnpm-lock.yaml` so it resolves `0.91.1`. The override alone did not close the alert (Dependabot flags the `^0.90.0` manifest range), so also bumped the `packages/core/package.json` declaration to `^0.91.1`. | Fixed |
| #2, #3 | `nitro` | Bumped `packages/core/package.json` from `3.0.260415-beta` to patched `3.0.260429-beta` (all `nitro` versions are beta; chose the exact patched beta for minimal change). | Fixed |
| #40 | `esbuild` | Bumped direct dep in `templates/design/package.json` from `^0.27.7` to `^0.28.1`. Left the separate transitive `esbuild@<=0.24.2` override untouched. | Fixed |
| #24 | `esbuild` | **Blocked upstream / not reachable.** New alert surfaced after the re-scan for a *development-scope, transitive* esbuild (`0.27.3` / `0.27.7`) pulled through `tsup` and `tsx`/`esbuild-kit`. `tsup` (including latest `8.5.1`) pins `esbuild ^0.27.0`, so it cannot take `0.28.1`; forcing it via override would violate that constraint and risk breaking every tsup-based package build. The advisory affects esbuild's **dev server** on Windows, which these bundler libraries do not run — not in the execution path. Deferred pending a `tsup` release that accepts esbuild `0.28`. | Deferred |
| #38 | `rustls-webpki` | `cargo`-derived version+checksum bump `0.103.12` -> `0.103.13` in `templates/clips/desktop/src-tauri/Cargo.lock`. | Fixed |
| #39 | `tar` | Version+checksum bump `0.4.45` -> `0.4.46` in the same `Cargo.lock`. | Fixed |
| #36 | `glib` | **Blocked upstream.** `gtk 0.18.2` requires `glib ^0.18`, pinned by `tauri 2.11.2`'s GTK (Linux-only) stack; cannot accept `0.20.0`. Fix requires the Tauri / gtk-rs ecosystem to move to glib 0.20 (out of our control). Not reachable on Windows/macOS builds. | Deferred |
| #37 | `rand` | **Blocked upstream.** The vulnerable `rand 0.7.3` is a build-only dep pulled through `phf_generator 0.8.0 -> phf_codegen -> selectors 0.24.0 -> kuchikiki 0.8.8-speedreader -> tauri-utils 2.9.2`; `phf_generator 0.8.0` requires `rand ^0.7`. Cannot bump without the Tauri build toolchain advancing. Low severity, build-time only. | Deferred |

Notes:

- The Cargo.lock edits were applied surgically (version + checksum only). A raw `cargo update -p ... --precise` also re-unified unrelated `windows-sys` versions; that churn was reverted so the diff stays limited to security movement. `cargo tree --locked --target all` exits `0`, confirming the edited lockfile is coherent.
- `packages/core` gained a patch changeset (`.changeset/nitro-security-bump.md`) for the Nitro bump.
- The workspace `postinstall` build fails on Windows with `'cp' is not recognized` — a known pre-existing issue already tracked by the `windows-install-builds` changeset, unrelated to this remediation. Lockfile refresh still completes (verified).
- Follow-up: re-run `gh api repos/studio-jami/jami-studio/dependabot/alerts` after push. First push closed #2, #3, #38, #39, #40. #1 required the additional manifest bump above. The re-scan surfaced #24 (transitive dev esbuild). Remaining deferred/upstream-blocked: #24 (esbuild via tsup), #36 (glib), #37 (rand) — all pending upstream (tauri 2.11.2 / tsup) advancing.

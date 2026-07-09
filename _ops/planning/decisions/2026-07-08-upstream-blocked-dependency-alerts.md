# Decision: Upstream-Blocked Dependency Alerts — Carry-Through Watch List

Status: Active
Date: 2026-07-08
Owner: security / dependency remediation
Related: `_ops/readiness/2026-07-08-dependabot-remediation-handoff.md`

## Decision

When a Dependabot (or equivalent) alert cannot be closed because the vulnerable
package is pinned by an upstream dependency we do not control, we:

1. Fix everything reachable and fixable in the same remediation pass (direct
   deps, manifest floors, lockfile refresh, transitive overrides that do not
   break a constraint).
2. Do NOT force a risky override that violates an upstream dependency's declared
   range just to silence an alert. Forcing a version the parent does not accept
   trades a low/unreachable advisory for a real build-breakage risk.
3. Defer the remaining alert, record the exact upstream constraint that blocks
   it and the condition that would unblock it, and carry it forward here.
4. Re-evaluate each deferred item when its blocking upstream advances, not on a
   fixed clock — the trigger is "the pin moved," not "N weeks passed."

Rationale: upstream pins are the single source of the constraint. Patching the
symptom (forced override, alert dismissal without cause) leaves drift and risk.
Fix at the source when it moves; until then, track it honestly.

## Carry-Through Watch List

Recheck each when its blocking upstream ships a compatible release, then close
the alert and delete the row.

| Alert | Package | Scope | Blocked by | Unblocks when |
| --- | --- | --- | --- | --- |
| #36 | `glib` (0.18 → 0.20) | runtime, Linux-only GTK | `tauri 2.11.2` → `gtk 0.18.2` requires `glib ^0.18` | Tauri / gtk-rs desktop stack moves to `glib 0.20` |
| #37 | `rand` (0.7.3 → 0.8.6) | build-only | `tauri-utils` → `kuchikiki 0.8.8-speedreader` → `selectors 0.24.0` → `phf_generator 0.8.0` requires `rand ^0.7` | Tauri build toolchain moves `phf` to `>=0.10` (rand 0.8) |
| #24 | `esbuild` (0.27.x → 0.28.1) | development, transitive | `tsup` (incl. latest `8.5.1`) requires `esbuild ^0.27.0` | `tsup` releases with `esbuild ^0.28` support |

Notes:

- All three affect the `templates/clips/desktop` Tauri stack or shared build
  tooling; none is reachable in a way that forcing the version would justify the
  breakage risk (glib is Linux-GTK-only, rand is build-time, esbuild's advisory
  is its dev server which the bundler libraries do not run).
- Recheck command: `gh api repos/studio-jami/jami-studio/dependabot/alerts --paginate`
  and, for the Rust items, `cargo update -p <pkg> --precise <patched>` inside
  `templates/clips/desktop/src-tauri` to see if the constraint has lifted.

## History

- 2026-07-08 — Created after the Dependabot remediation pass. Fixed and pushed:
  `@anthropic-ai/sdk`, `nitro`, `esbuild` (design template), `rustls-webpki`,
  `tar`. The three rows above were deferred as upstream-blocked.

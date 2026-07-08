# Source Sync Intake - 7c84f30

## Inputs

- Source ref: `source/main`
- Source SHA: `7c84f30b17d743f241dcf9c27e4d9db0c9dc0a8c`
- Base branch: `sync/staging`
- Report: `_ops/source-sync/reports/2026-07-08-7c84f30-intake.md`

## Agent Job

Prepare a curated upstream patch for Jami Studio.

Read these first:

- `_ops/source-sync/hard-rules.md`
- `_ops/source-sync/policy.md`
- `_ops/source-sync/reports/2026-07-08-7c84f30-intake.md`

Do not merge upstream wholesale.

Port useful upstream changes by lane, keep commits small, and preserve Jami
takeover decisions. If a lane is too broad or risky, document the deferral in
this folder instead of forcing it through.

## Expected Output

- Curated commits on this intake branch.
- Notes for accepted, rejected, and deferred upstream changes.
- A PR from this branch into `sync/staging`.

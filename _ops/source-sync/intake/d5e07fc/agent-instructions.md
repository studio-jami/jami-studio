# Source Sync Intake - d5e07fc

## Inputs

- Source ref: `source/main`
- Source SHA: `d5e07fca51d2a17795f390b7c8ef0942ef92d790`
- Base branch: `sync/staging`
- Report: `_ops/source-sync/reports/2026-07-10-d5e07fc-intake.md`

## Agent Job

Prepare a curated upstream intake merge for Jami Studio.

Read these first:

- `_ops/source-sync/hard-rules.md`
- `_ops/source-sync/policy.md`
- `_ops/source-sync/reports/2026-07-10-d5e07fc-intake.md`

Accept upstream source by default on this branch. The branch separation is the
safety layer; size alone is not a reason to defer.

Strip or adapt only obvious Jami takeover contradictions:

- inherited Builder GitHub workflows
- Builder publish, deploy, billing, or dispatch automation
- root repo identity, branding, domain, legal, OAuth, or ownership assumptions
- changes that delete or replace Jami `_ops/source-sync` machinery

If a decision is ambiguous, document it in this folder for human review instead
of silently dropping upstream code.

## Expected Output

- Upstream merged into this intake branch with contradictions stripped or
  adapted.
- Notes for accepted, adapted, and human-review-needed changes.
- A PR from this branch into `sync/staging`.

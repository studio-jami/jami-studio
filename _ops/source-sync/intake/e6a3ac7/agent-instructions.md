# Source Sync Intake - e6a3ac7

## Inputs

- Source ref: `source/main`
- Source SHA: `e6a3ac7d6a52b6a1b98ee741f4e0cf63805c55c1`
- Base branch: `sync/staging`
- Report: `_ops/source-sync/reports/2026-07-17-e6a3ac7-intake.md`

## Agent Job

Prepare a curated upstream intake merge for Jami Studio.

Read these first:

- `_ops/source-sync/hard-rules.md`
- `_ops/source-sync/policy.md`
- `_ops/source-sync/reports/2026-07-17-e6a3ac7-intake.md`

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

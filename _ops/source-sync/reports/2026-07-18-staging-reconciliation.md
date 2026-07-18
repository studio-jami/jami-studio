# Source Sync Staging Reconciliation — 2026-07-18

## Purpose

Establish the exact landing state of the July 17 source intake before a later
upstream batch enters the intake lane. This keeps the product moving toward one
cohesive Jami Studio workbench: a workspace-first environment where people can
move naturally between conversation, voice, video, research, creation, and
delivery without losing their place.

## Confirmed State

- The source mirror was last curated at
  `e6a3ac7d6a52b6a1b98ee741f4e0cf63805c55c1`.
- That 192-commit upstream intake was curated on
  `sync/intake/e6a3ac7`, then merged into `sync/staging` through pull request
  #5.
- `main` contains the intentionally selective docs port `bd127fa77`, not the
  full staging intake. The port kept the useful docs behavior while preserving
  Jami-owned docs chrome and identity.
- `sync/staging` also carries the curation record, a sync-branch-only marketing
  deployment guard, and the owner-ratified docs-chrome rule.

## Local Staging Directory

`C:\Users\james\orgs\oss\js-staging-wt` is not a Git worktree. It contains
only `_ops/source-sync/intake/e6a3ac7/curation-notes.md`; that file is byte-for-
byte equivalent to the tracked note on `sync/staging`. It is a disposable local
remnant, not uncommitted intake work. Leave it untouched until routine
worktree cleanup is explicitly chosen.

## Promotion Posture

The July intake remains a distinct, reviewable promotion unit. It must not be
silently folded into the next upstream batch.

A dry merge of `sync/staging` into current `main` yields 49 conflicts. The
conflicts cluster in these deliberate ownership boundaries:

- Jami-branded docs, localized docs, and the retired docs theme component;
- core runtime surfaces that have continued to evolve on both sides;
- package/version history and the workspace lockfile.

The later `main` work includes the Jami identity sweep, the unified workbench
and sidebar direction, Dispatch promotion, and the voice/video planning arc.
Those decisions remain authoritative. The staging promotion should accept its
runtime, reliability, security, and product improvements while preserving that
Jami-owned experience and rejecting Builder operational, publishing, domain,
and identity assumptions.

## Next Controlled Move

1. Curate the July staging promotion against present-day `main` as its own
   complete change, resolving conflicts by ownership rather than by file.
2. Verify the resulting product and runtime behavior, then land that promotion
   independently.
3. Refresh the clean source mirror and open the next intake only after the
   July unit has a recorded promotion decision.

This preserves a clean narrative: each upstream capability advances the Jami
Studio workbench without diluting the end-state experience or obscuring which
upstream changes shaped it.

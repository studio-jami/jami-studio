# Source Sync Curation Notes - 9b8ee99

## Intake Result

Upstream `source/main` at `9b8ee99b8d19f8228d282d089cc420fbb45de8d4` was merged into `sync/intake/9b8ee99`.

Posture used:

- accept upstream source by default
- do not defer based on size
- strip only obvious Jami takeover contradictions
- keep inherited Builder infrastructure out of the intake branch

## Accepted By Default

Accepted the upstream source changes across:

- core runtime and agent run management
- first-party analytics/error capture/session replay improvements
- toolkit docs and client surfaces
- Dispatch task queue and automation UI work
- Clips reliability fixes
- Content database source batching and filtering improvements
- Design bridge and write-consent improvements
- Slides image drop-to-agent fallback improvements
- Mail, Plan, Forms, Macros settings and reliability changes
- package dependency/catalog movement to the newer TypeScript toolchain shape

## Adapted

The following conflicts were resolved by keeping upstream behavior while adapting obvious Jami identity or takeover boundaries:

- `packages/core/src/client/analytics.ts`
  - accepted upstream first-party exception capture and analytics session extraction
  - kept the default analytics endpoint on `https://analytics.jami.studio/track`
  - kept docs-host filtering pointed at `jami.studio`
- `packages/skills/package.json`
  - accepted upstream version/toolchain changes
  - kept package description as Jami Studio copy
- `templates/clips/actions/lib/audio-only-transcription.ts`
  - accepted upstream timeout fallback in addition to ffmpeg-unavailable fallback
  - adapted the comment from Builder to Jami Studio
- `templates/slides/app/components/editor/ImageDropPromptPopover.tsx`
  - accepted upstream inline data-URL fallback when hosted upload is unavailable
  - adapted provider wording from Builder to Jami Studio

## Stripped Or Kept Out

- `.github/workflows/ci.yml`
- `.github/workflows/pr-visual-recap-fork.yml`

These were modified upstream but intentionally remain deleted in the sync lab because inherited GitHub workflows are never automatic in Jami.

Existing Jami `_ops/source-sync` machinery was preserved.

## Human Review Focus

Reviewers should focus on:

- `package.json` and `pnpm-lock.yaml` for dependency/toolchain movement
- package versions/changelog churn that may not matter until Jami publishing policy is settled
- registry/template catalog changes that may affect public surface ownership
- analytics/error capture behavior and whether all hosted endpoints point to Jami-controlled services
- any remaining Builder-branded copy that is product-facing rather than provider/domain-specific

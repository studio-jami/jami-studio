# Curation Notes - 7c84f30

## Policy Calibration

Default posture is now **accept upstream main**, then strip or adapt obvious
Jami contradictions. Size alone is not a reason to defer in `sync/intake` or
`sync/staging`; those branches are the safety layer.

## Accepted Before Full Merge

- `7c84f30b1` / `#1955`: ported Clips first-play startup reliability.
  - Added the first-play rewind guard for stale duration-probe seeks.
  - Added upstream focused coverage in `video-player.test.ts`.
  - Kept the Clips changelog entry.
- `14110434f` / `#1952`: ported Clips chapter regeneration chat handoff.
  - Added `openInChat` support to `regenerate-chapters`.
  - Preserved the existing full-video AI instructions path.
  - Added upstream focused coverage for the auto-title/chat bridge.
  - Kept the Clips changelog entry.

## Full Merge Handling

The remaining upstream delta should be merged into this intake branch. During
that merge, keep upstream code by default and strip or adapt only takeover
contradictions:

- keep Jami source-sync workflows and `_ops/source-sync`
- keep inherited Builder workflows disabled
- keep Jami deploy relocation decisions
- preserve Jami identity/domain/repo ownership decisions
- avoid importing upstream agent attribution trailers

## Notes

Cherry-picked upstream commits were committed with Jami-owned curated messages
and without upstream agent co-author trailers.

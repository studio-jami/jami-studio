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

The remaining upstream delta was merged into this intake branch with upstream
accepted by default. The curation pass only stripped or adapted takeover
contradictions:

- kept Jami source-sync workflows and `_ops/source-sync`
- kept inherited Builder workflows out of `.github/workflows`
- preserved Jami root `README.md`, root `package.json`, and `.gitignore`
- advanced `packages/skills` to the upstream version while keeping the Jami
  package description
- accepted Content template conflicts from upstream because they are product
  code, not takeover wiring

## Notes

Earlier cherry-picked upstream commits were committed with Jami-owned curated
messages and without upstream agent co-author trailers. The final upstream merge
uses a Jami-owned merge commit message.

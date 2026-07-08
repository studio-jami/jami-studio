# Curation Notes - 7c84f30

## Accepted

- `7c84f30b1` / `#1955`: ported Clips first-play startup reliability.
  - Added the first-play rewind guard for stale duration-probe seeks.
  - Added upstream focused coverage in `video-player.test.ts`.
  - Kept the Clips changelog entry.
- `14110434f` / `#1952`: ported Clips chapter regeneration chat handoff.
  - Added `openInChat` support to `regenerate-chapters`.
  - Preserved the existing full-video AI instructions path.
  - Added upstream focused coverage for the auto-title/chat bridge.
  - Kept the Clips changelog entry.

## Deferred

- `bba733221` / `#1953`: background agent routing hardening.
  - Broad core-agent surface.
  - Includes `.changeset` package-release files.
  - Should be reviewed as a dedicated core reliability lane.
- `d6153fdcb` / `#1949`: deploy guards and analytics reliability.
  - Mixes deploy guard changes, analytics, file-upload behavior, desktop Clips,
    docs, and changesets.
  - Should be split into smaller lanes.
- `3995e4e8c` / `#1946`: Dispatch overview simplification.
  - Large UI rewrite.
  - Needs product review before intake.
- `179d5ed8e` and related Content bulk source changes.
  - Already called out as broad/conflict-prone by the report.
  - Needs a separate Content-source lane.

## Notes

Cherry-picked upstream commits were committed with Jami-owned curated messages
and without upstream agent co-author trailers.

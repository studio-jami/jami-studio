# Source Sync What's Left

Small backlog for turning the manual sync lab into a reliable automation loop.

## Next Automation Steps

1. Add a schedule or source-pushed dispatch once manual runs feel boring.
   - Preferred: `agent-native-source/main` changes dispatch `jami-studio`.
   - Fallback: hourly `jami-studio` schedule with last-seen SHA tracking.
2. Teach the intake workflow to run the pre-merge agent automatically after it
   creates or updates `sync/intake/<source-sha>`.
3. Have the agent update curation notes and PR body after its contradiction pass.
4. Add a post-merge `sync/staging` review step that summarizes what changed and
   flags human decisions before anything is ported to `preview` or `main`.
5. Add basic checks for the sync branches once dependencies are installed in CI.

## Guardrails To Add

- Last-reviewed source SHA state so scheduled runs do not repeat work.
- A protected-path assertion that inherited Builder workflows stay out of
  `.github/workflows`.
- A root identity assertion for Jami README/package/domain ownership.
- Notifications for new intake PRs and merged `sync/staging` updates.

## Not Yet Automated

- Creating source-pushed dispatch from `agent-native-source`.
- Running the pre-merge agent from GitHub Actions.
- Running tests on intake/staging branches.
- Opening the final human-review PR from `sync/staging` toward `preview` or
  `main`.

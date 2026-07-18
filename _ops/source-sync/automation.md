# Source Sync Automation

Start manual, then increase automation only after the reports prove useful.

## Modes

### 1. Manual Review

Current mode.

Run the `Source sync review` workflow by hand when we want a fresh report. This
is best while policy and classification are still settling.

### 2. Manual Review With Ping

Current workflow supports this without turning on a schedule.

Set `create_issue` to `true` when dispatching the workflow. The workflow will
upload the report, write it to the run summary, and create a GitHub issue.

### 3. Scheduled Watch

Future mode.

Use a scheduled workflow in `jami-studio` to generate a report every hour or a
few times per day. This is simple and cheap, but it may report the same source
SHA repeatedly unless the workflow learns the last reviewed SHA.

Recommended first schedule when ready:

```yml
on:
  workflow_dispatch:
  schedule:
    - cron: "17 * * * *"
```

Use a non-round minute so GitHub does not run with the top-of-hour crowd.

### 4. Source-Pushed Dispatch

Future preferred mode.

Let `agent-native-source` refresh from Builder upstream. When its `main` branch
changes, it sends a `repository_dispatch` event to `jami-studio`.

This is closer to a true "watch" flow than polling:

```txt
Builder upstream changes
  -> source fork refreshes
  -> source fork dispatches Jami intake
  -> Jami workflow reports and optionally opens/updates an issue
```

This avoids spending Action minutes when nothing changed and keeps reports or
intake PRs bite-sized.

### 5. Intake Branch

Current scaffold.

The `Source sync intake` workflow creates or updates `sync/intake/<source-sha>`
from `sync/staging`, commits an intake packet, and opens a PR into
`sync/staging`.

The packet is not the curated patch yet. It is the handoff point for the
pre-merge agent.

### 6. Validation Pipeline

Next automation milestone.

Keep validation manual-dispatch or PR-triggered while the intake taxonomy is
settling; it must never merge an intake automatically. The first stable job
should:

1. run `pnpm install --frozen-lockfile --ignore-scripts` to materialize a
   reproducible test workspace without accidentally treating `postinstall` as
   a short dependency step;
2. run `git diff --check` against the intake branch;
3. run the reviewed, path-scoped test commands recorded by curation; and
4. publish the results as a required PR check and a durable intake artifact.

The root `postinstall` builds workspace packages and rebuilds native SQLite.
That belongs in an explicit full-workspace build job with a longer timeout,
not in the fast source-sync preflight. Add that job only after its runtime is
measured on the GitHub runner and its result is useful to staging decisions.

Each intake's `curation-notes.md` is the feedback loop: append the actual
conflict choices, focused tests, setup constraints, and any new protected-path
rule. Promote a repeated lesson into this runbook, an intake-packet instruction,
or a workflow only after it has held across more than one intake.

## Recommendation

Use manual mode while we tune rules. Then test intake PR creation. After that,
add source-pushed dispatch from `agent-native-source`. Use hourly schedule only
as a fallback if dispatch becomes awkward.

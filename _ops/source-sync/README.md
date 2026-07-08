# Source Sync

Source sync is the Jami Studio upstream-intake system.

`studio-jami/jami-studio` is the standalone takeover repo. It should not pull
Builder upstream state directly into `main`.

`studio-jami/agent-native-source` is the clean upstream mirror. It can remain a
fork of `BuilderIO/agent-native` because it is not product canon; it is the
reviewable intake pipe. Its only sync branch is `main`.

```txt
BuilderIO/agent-native
        |
        v
studio-jami/agent-native-source/main
        |
        v
accept upstream / strip contradictions
        |
        v
studio-jami/jami-studio
```

## Local Remotes

Expected remotes:

- `origin`: `https://github.com/studio-jami/jami-studio.git`
- `source`: `https://github.com/studio-jami/agent-native-source.git`
- `upstream`: `https://github.com/BuilderIO/agent-native.git`

Keep `upstream` push-disabled.

## Branch Model

```txt
studio-jami/agent-native-source/main

studio-jami/jami-studio/main
studio-jami/jami-studio/preview
studio-jami/jami-studio/feat/<thing>
studio-jami/jami-studio/sync/base
studio-jami/jami-studio/sync/staging
studio-jami/jami-studio/sync/intake/<source-sha>
```

`sync/base` mirrors the Jami working repo for sync work.

`sync/intake/<source-sha>` is the disposable pre-merge agent branch. It starts
from `sync/staging`, accepts upstream by default, and strips or adapts obvious
takeover contradictions before opening a PR back to `sync/staging`.

`sync/staging` is the long-lived curated sync branch. It is the mirror lab where
Jami can inspect the current upstream merge before anything moves toward
`preview` or `main`.

## Commands

Generate a local review report:

```sh
pnpm source-sync:report
```

Refresh the source mirror first, then report:

```sh
pnpm source-sync:refresh
pnpm source-sync:report
```

Reports are written to `_ops/source-sync/reports/`.

Prepare the intake branch and PR packet:

```sh
pnpm source-sync:intake -- --create-pr
```

## Automation

The GitHub workflow is manual by default. It can optionally create an issue when
dispatched with `create_issue=true`.

See `automation.md` for the path from manual review to scheduled or
source-pushed watch mode. See `whats-left.md` for the remaining setup work.

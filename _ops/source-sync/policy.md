# Source Sync Policy

## Repo Roles

- `jami-studio`: standalone Jami takeover repo and product canon.
- `agent-native-source`: upstream mirror and quarantine repo.
- `BuilderIO/agent-native`: upstream source only.

## Protected Decisions

Automation should accept upstream `main` by default, then strip or adapt changes
that contradict Jami takeover decisions.

Automation must flag and clean changes that affect:

- `.github/workflows/**`
- `deploy/netlify/**`
- `deploy/cloudflare/**`
- package publishing and changeset automation
- branding, domain, legal, OAuth, or hosted URL assumptions
- `_ops/**` operational records

Large upstream changes are not a reason to defer on their own. The sync branches
are the safety layer; the pre-merge pass is a contradiction filter, not a broad
code-quality gate.

## Registry Lane

Registry changes are special. They are likely useful because Jami expects to own
the registry surface, but they still need review until the takeover is complete.

Registry lane paths are listed in `fixtures/registry-paths.json`.

## Report Requirements

Each report should include:

- compared refs and SHAs
- ahead/behind counts
- upstream commits since the merge base
- changed-file counts by lane
- protected-path changes
- merge conflicts from a dry merge analysis
- a recommended handling note

## Hard Rules

See `hard-rules.md` for the current never-automatic and always-flag rules.

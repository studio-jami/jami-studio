# Source Sync Hard Rules

These are the first-pass rules. Update them as we learn the upstream rhythm.

## Never Automatic

- Never merge source directly into Jami `main`.
- Never reactivate inherited Builder workflows automatically.
- Never restore Builder publish, deploy, billing, or dispatch automation without
  an explicit Jami decision.
- Never rewrite Jami domain, branding, legal identity, or repository ownership
  back to Builder defaults.
- Never push to Builder upstream.

## Always Flag

- `.github/workflows/**`
- `deploy/**`
- `.changeset/**`
- `package.json` and `pnpm-lock.yaml`
- docs/site identity files
- template `AGENTS.md`, `DEVELOPING.md`, and `README.md`
- registry files

## Likely Good Intake

- upstream `main` changes by default
- isolated bug fixes, security hardening, and performance fixes
- broad runtime, product, and template changes once Jami contradictions are
  stripped or adapted
- test fixes that cover real behavior
- registry/template catalog updates
- reusable framework improvements that do not assume Builder infrastructure

## Strip Or Adapt

- inherited Builder workflows
- Builder publish, release, deploy, billing, or dispatch automation
- Builder domains, repository identity, or hosted-service defaults that conflict
  with Jami takeover decisions
- reversions of Jami deploy relocation or `_ops/source-sync`
- changes that would make `jami-studio` behave like a GitHub fork again

Do not defer only because a change is large. The sync branches are the safety
layer.

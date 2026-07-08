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

- upstream source changes merged into `sync/intake/**`
- isolated bug fixes
- security hardening
- performance fixes
- test fixes that cover real behavior
- registry/template catalog updates
- reusable framework improvements that do not assume Builder infrastructure

## Strip Or Adapt

- release automation
- Netlify or Builder deploy routing changes
- Builder-owned service integrations unless we are actively replacing that
  surface
- root repo identity files when upstream would restore Builder ownership
- inherited Builder GitHub workflows
- `_ops/source-sync/**` when upstream would delete or replace Jami operations

Do not defer only because a change is large. The sync branches are the safety
layer.

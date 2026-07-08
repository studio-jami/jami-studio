# Inherited Hardening Triage - 2026-07-08

## Scope

This triage covers preexisting TODO/FIXME items surfaced during takeover prep.
It does not change Hummingbird and does not resume source sync.

## Recommended Priority

### P0 before exposing untrusted extensions broadly

- `packages/core/src/extensions/routes.ts`
  - Issue: extension SQL safety still relies on a regex blocklist and depth checks.
  - Best option: replace with a parser/allowlist model that only permits scoped, supported SQL forms.
  - Why: this is a trust-boundary item. It should not be hand-waved once extensions handle untrusted or shared workspace content.

- `packages/core/src/extensions/html-shell.ts`
  - Issue: host-side bridge capabilities do not yet have full gating/consent.
  - Best option: add explicit capability grants and consent before exposing higher-impact bridge methods.
  - Why: extension iframe boundaries are only useful if bridge permissions stay narrow and reviewable.

### P1 before Dispatch is treated as durable production infrastructure

- `packages/dispatch/src/server/lib/dispatch-store.ts`
  - Issue: local counter state should move to a SQL-backed counter table.
  - Best option: add an additive counter table and migrate reads/writes to SQL.
  - Why: durable coordination should not depend on process-local behavior.

### P2 quality/correctness follow-ups

- `packages/core/tsconfig.json`
  - Issue: strict mode is still deferred.
  - Best option: flip strict after current takeover/install churn settles.

- `templates/plan/tsconfig.json`
  - Issue: strict mode is still deferred.
  - Best option: handle as part of a Plan hardening lane.

- `templates/analytics/server/plugins/collab.ts`
  - Issue: JSON collab support is deferred until structured data is ready.
  - Best option: handle with analytics collaboration work, not bootstrap.

- `packages/core/src/eval/runner.ts`
  - Issue: live-sampling scorer parity is tracked.
  - Best option: handle with eval/observability improvements.

- `packages/core/src/agent/production-agent.ts`
  - Issue: processor plumbing is deferred.
  - Best option: handle when production-agent extension points are actively needed.

- `templates/design/actions/apply-design-token-edit.ts`
- `templates/design/app/components/design/EditPanel.tsx`
- `templates/clips/desktop/src-tauri/src/permission_status.rs`
- `templates/clips/desktop/README.md`
  - Issue: template-specific implementation/polish TODOs.
  - Best option: defer until those templates are selected for active product work.

## Hummingbird Gate

Do not block the first Hummingbird planning pass on these inherited TODOs.
Do block any broad untrusted-extension rollout on the P0 extension boundary items.

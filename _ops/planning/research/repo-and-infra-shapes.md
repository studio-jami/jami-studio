# Repos & Infrastructure Shapes — Jami Studio

**Date:** 2026-07-07
**Status:** SHAPES / PLANNING — nothing executed. Capturing repo topology, the fork
strategy, and the pending GitHub / Sentry / PostHog cleanup so we act deliberately.

---

## Fork strategy — standalone copy + upstream remote (not a dev fork)

- **Don't develop in a GitHub *fork*.** A fork is publicly tied to upstream, awkward to make private,
  and muddies PR/issue flows.
- **`jami-studio` = a standalone repo we own** (a "copy," not a fork). De-fork this repo (leave the
  fork network, or push into a fresh standalone repo).
- **Track upstream via a remote, not a repo:**
  `git remote add upstream https://github.com/BuilderIO/agent-native` → pull into an
  **`upstream-sync`** branch → test / vet → merge into `main`. `main` / `preview` never see raw
  upstream until we choose. This gives the isolation we want as a **branch** concern, not a repo one.
- Optional: a thin read-only mirror of upstream for a clean staging clone — **not required.**

## Repo topology — minimal

| Repo | Role | Notes |
|---|---|---|
| **jami-studio** | Framework monorepo | Already holds packages (core / dispatch / …), templates (the apps), `packages/docs` (**www + docs + landing**), `registry/` + `registry.json` (shadcn), plans. **No separate api / docs / landing / registry repos.** |
| **hummingbird** | Consumer product surface | Built from **published packages** in a clean repo — does **not** fork the monorepo. |
| **intercal** | TBD | Purpose not yet defined — scaffold on confirmation. |

- **Registry needs no special repo:** a shadcn registry is just static `registry.json` + `registry/…`
  files served over HTTP from the www deploy (`jami.studio/registry.json`); it ships with `packages/docs`.
- **Deploy shape:** single-origin path-prefix workspace (one demo site) — see the coupling audit's
  "Deployment / frame / payments" leanings.

## Capability notes (verified 2026-07-07)

- **GitHub:** `gh` authed as **JamiStudio** (company `@studio-jami`) with admin scopes incl.
  `admin:org`, `repo`, `delete_repo`. Repo create / rename / transfer / delete are executable from here.
- **Sentry / PostHog:** **no tooling reachable** — project deletions are manual (dashboard) or via each
  service's API with your own token (never handed through the assistant).

---

## Legacy consolidation — PENDING decision (NOT executed)

Target: `https://github.com/studio-jami/legacy.git`. A repo can't contain repos, so one of:

- **(A) Mega monorepo:** fold all 8 into `studio-jami/legacy` as subdirs `<name>-legacy/`, history
  preserved via `git subtree`. Matches the earlier "mega legacy repo" intent.
- **(B) Separate repos:** transfer each of the 8 to the `studio-jami` org and rename to `<name>-legacy`.

Repos to archive: `oss, hummingbird, jami-harness, studio-ui, registry, local-evals, orchestra, collectiva`.

**Open before execution:** (1) current owner/org of the 8? (2) archive vs hard-delete sources after the
move? (3) new `jami-studio` = **fresh empty scaffold** vs **de-forked copy of this framework** (different
actions)? (4) `hummingbird` + `registry` appear both here and as fresh/in-monorepo — confirm old→legacy,
new created.

## New repos to create (scaffold: starter README + .gitignore)

`jami-studio` (⚠️ empty scaffold vs de-forked framework copy — TBD), `hummingbird`, `intercal`.

---

## External-service cleanup — MANUAL (no tooling here)

**Sentry — disconnect + delete:** `jami-harness, jami-studio-web, orchestra, local-evals, collectiva`
→ Settings → Projects → [project] → remove integrations / client keys ("disconnect") → Danger Zone →
Remove Project. Irreversible.

**PostHog — delete:** `jami-harness, jami-studio, orchestra, registry-docs, studio-ui, collectiva`
→ Settings → Project → Danger Zone → Delete project. Irreversible.

---

Cross-reference: Builder.io coupling + provider / observability / deploy / frame / payments leanings live
in `builder-io-coupling-audit.md` (same folder).

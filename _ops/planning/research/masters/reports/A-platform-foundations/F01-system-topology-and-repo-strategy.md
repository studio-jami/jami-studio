# F01 — System topology & repo strategy

Status: AUTHORED 2026-06-02 · Domain: A · Platform foundations
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/00-orchestration/{plan,synthesis}.md`, `06-rebuild-feasibility`, `08-canonical-system`, `12-agent-native`, `02-system-and-tooling`, `11-skills-audit`
Related: F02, F03, F04, F14

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

The physical + organizational shape of everything, and how code ships as packages.
**In:** dir topology, the package family, taxonomy, release flow, skills/tooling posture. **Out:** runtime internals (F05+), hosting (F04).

## 2. Committed decisions (from canon)

- `dev/` (3 core domains) vs `projects/*` (legacy + external) — physical no-bleed boundary.
- System → Org-lane (`oss`/`saas`/`personal`) → Domain → Project.
- **Depend-don't-fork**; Apache-2.0 open-core line; package family `@jami-studio/*`; **App/Package/Plugin** taxonomy.
- Naming: jami (agent) · the Studio (UI env) · jami.studio (platform) · yrka (commercial); GitHub org `studio-jami`; npm `@jami-studio`.
- Skills posture: official-canon (never maintained) + tiny thin-bridge set; tooling for solved problems; Mintlify docs; latest-official-sources rule.

## 3. Architecture & mechanics

**Two directory roots (physical no-bleed).** `C:\Users\james\dev` holds all work for the three core domains; `C:\Users\james\projects\*` holds the retiring legacy tree + unrelated/external projects, each with isolated accounts/secrets. The split is a filesystem fact, not a discipline — internal dev secrets *cannot* reach a product repo because the product repos live where the internal layer never imports from.

**Four-tier tree (canon §2 / synthesis §2).**

```
dev/
  <org>/                         # org-lane: oss | saas | personal
    founder.yaml                 # org-lane shared founder facts (locked default; F17/F18 ref)
    <domain>/                    # brand + identity/auth surface + deploy boundary
      docs/{brand,research,roadmaps,ops-canon}/
      AGENTS.md  glossary.md
      projects/
        <repo>/                  # one repo = one project; thin AGENTS.md + CLAUDE.md pointer
```

Org-lane → domain → project map: `oss` → {`jami.studio` (foundations: `harness`/`ui`/`orchestra` + BYOK showcase), `intercal`, `collective`}; `saas` → {`yrka` (one monorepo: business/media/research suites + free-tools + BoardRune)}; `personal` → {`jnh.org`}.

**Repo strategy — per domain.**
- **`jami.studio` = one OSS publishing monorepo** (pnpm + Turborepo). Workspaces: `packages/*` = the published framework + adapter leaves (`@jami-studio/harness`, `/ui`, `/orchestra`, `/cli`, `/create-app`, `/email`, `/storage`, …); `apps/*` = the BYOK showcase. Public; publishes versioned packages to npm. Every package Apache-2.0.
- **`yrka` = one private SaaS monorepo** consuming the public packages as normal semver deps (`pnpm add @jami-studio/harness`). `packages/@yrka/*` = private suite code; `apps/*` = the suite Apps over one shared registry. The OSS↔SaaS boundary is the **published package surface, not a git merge** (canon: depend-don't-fork) — which is also why no SaaS/secret material can leak upstream.
- **`intercal`, `collective`, `jnh.org` = one repo each** (poly-repo across domains, monorepo within). Decision rule below.

**Taxonomy (3-tier, canon §4 recommendation, adopted).** **App** = installable runnable suite unit users compose via the shared registry (`apps/*`); **Package** = shared library Apps depend on, never user-installed (`packages/*`, npm); **Plugin** = optional extension attaching to one App (introduced only when real add-ons exist). "Package" stays plumbing; "App" is the product noun. Maps 1:1 onto shadcn registry items (F09).

**Release flow.** OSS repo: **changesets + semver**, DCO sign-off, publish on tag via the F03 GitHub Actions pipeline. "Sync downstream" = `pnpm update` in `yrka`; "upstream a tweak" = change in OSS → publish → bump. The **scaffold** (`@jami-studio/create-app`) is instantiated-once-and-owned, never synced; `yrka` = that scaffold instantiated once + private `@yrka/*` (canon: framework-vs-scaffold).

**Registry-item versioning (we own it — shadcn has none).** Each `@jami-studio/ui` registry item carries an explicit `meta.version` (semver) in its registry JSON; the harness↔app vocabulary handshake (F09) reads it. Convention: registry-item version tracks the publishing package's minor line; additive-only changes bump minor, never major within a vocabulary generation. This is the F09 version-skew defense at the distribution layer.

**Skills & tooling posture.** Official-canon skills (vendor + one trusted community baseline `anthropics/skills`) used as shipped, **never edited or maintained** by us; a *tiny* thin-bridge orchestration set we author (`orchestrate`, at most `plan`/`report`) lives in one versioned skills home, symlinked into every runtime via the `skills` CLI, refreshed on a Multica schedule (F10). Solved-problem tooling (changelog, docs, system-mapping, testing, browser-automation) = industry-leading OSS chosen on merit (CodeGraph, Mintlify, Playwright MCP + chrome-devtools-mcp). Docs = **Mintlify**. The **latest-official-sources rule** (canon §1) governs every drift-prone fact in every report.

## 4. Remaining peripheral decisions to cement

- **Mono- vs poly-repo (cemented):** monorepo *within* a domain, poly-repo *across* domains — a domain is the deploy + identity boundary, so cross-domain code never shares a repo. `jami.studio` and `yrka` are each one monorepo; `intercal`/`collective`/`jnh.org` each one repo.
- **Release workflow (cemented):** changesets + semver + DCO in the OSS repo; publish-on-tag via F03 CI; `pnpm update` is the only "downstream sync."
- **Registry-item versioning convention (cemented):** explicit `meta.version` per item, additive-only within a vocabulary generation, surfaced in the F09 handshake.
- Open only as creative/scope: final suite/product names (§4 naming sweep — `> needs Jamie`), carried in F16/F18.

## 5. Dependencies & interfaces

- **Feeds every report** — F01 fixes the names, scopes, repo boundaries, and taxonomy all others assume.
- **F02** (identity surface = per-domain, matching the domain tier) · **F03** (the deploy/secrets pipeline that publishes these repos; secrets vault lane = org-lane) · **F04** (each domain = a deploy boundary mapped to a host) · **F14** (depend-don't-fork, framework-vs-scaffold, open-core line all originate here) · **F09** (registry-item versioning convention) · **F10** (skills home + thin-bridge set) · **F16** (the products that occupy these domains) · **F17** (`ops-canon/` placement under `docs/`, `founder.yaml` at org-lane).

## 6. Verification & closing criteria

- Tree exists under `dev/` with all three org-lanes, each domain carrying `docs/{brand,research,roadmaps,ops-canon}/` + `projects/` + `AGENTS.md` + glossary; `CLAUDE.md` is a one-line pointer to `AGENTS.md` in every repo.
- `jami.studio` monorepo builds + publishes a package to npm under `@jami-studio` via F03 CI; `yrka` consumes it as a semver dep and builds.
- A changesets release cuts a version, updates the changelog, and tags; `pnpm update` in `yrka` pulls it.
- Every `@jami-studio/ui` registry item emits `meta.version`; the F09 handshake reads it.
- No `dev/` repo imports from `projects/`; no product repo contains an internal secret (enforced by the F03 no-secret guard).
- Skills home symlinks resolve in every runtime; the thin-bridge set is ≤3 skills.

## 7. Risks & verify-at-build (dated 2026-06-02)

- npm scope `@jami-studio` + GitHub org/socials `studio-jami` + domain `jami.studio` **confirmed owned** (canon §2 Naming, 2026-06-02).
- **shadcn registry has no first-class item versioning** — our `meta.version` convention is load-bearing; the surface moved 4× in two weeks (F09). Pin `shadcn@>=4.10.0`.
- **Corepack** is the pnpm shim only on Node ≤24 (unbundled from Node 25+) — verify the pin at toolchain setup (canon, `02`).
- **Turborepo/pnpm** major versions drift — pin both in the root; verify at scaffold.

## 8. Sources

- canon §1–§2 (Structure & layering, Naming, Distribution & open-core, Skills, Tooling), synthesis §2, `06-rebuild-feasibility`, `08-canonical-system`, `12-agent-native`, `02-system-and-tooling`, `11-skills-audit`.

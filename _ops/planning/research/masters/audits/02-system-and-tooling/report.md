# System Tooling, Package Managers & Skills-Maintenance Mechanism — Decision & Design Brief

Date: 2026-06-01
Status: Committed direction (canon §2/§5 aligned). Verified facts dated; open items limited to canon §4.
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Scope: WS02 owns the **system tooling mechanism** — package/version managers, the system-cleanup ("chuff") policy, and the **skills-maintenance engine** (versioned home + sync into every runtime). WS11 owns the workflow/task skill *content* that rides this same mechanism.

---

## Executive Summary

The committed toolchain is **pnpm (JS) + uv (Python), one Node version manager (fnm), and scoop as the canonical Windows system package manager** — each pinned and bootstrapped reproducibly, each sitting behind the thin adapter the canon requires (pinned `packageManager` field, `.node-version`, `pyproject`/`uv.lock`). This is not a menu; first principles point to exactly one answer per language, and these are the verified-current industry standards for 2026.

System cleanup is a **policy, not a chore**: disposable agent state (logs, sessions, transcripts, caches, stale `.bak`/`.tmp`) is bounded by a single scheduled prune job with retention caps and active-WAL safety; durable config is version-controlled and never touched. Accreted one-off allowlists reset to a small intentional rule set.

The skills-maintenance mechanism — this workstream's core deliverable — is the **`skills` CLI engine (vercel-labs/skills, "skills.sh") with one versioned home, distributed by symlink into every runtime, refreshed from official upstream on a schedule**. Two skill tiers share that one home and one engine: (1) **official-canon skills we never edit or maintain** — vendor official skills (gcloud, supabase, vercel, neon, stripe, resend, mintlify, …) plus one trusted community baseline; and (2) WS11's **tiny thin-bridge orchestration set**. WS02 owns the engine, the home, the sync convention, the schedule, and the lockfile; WS11 fills the thin-bridge tier into the same home.

All of this is authored fresh in `C:\Users\james\dev`. Current machine state (`~/.claude`, `~/.codex`, `~/.agents`, `references/`) is **evidence of what 2026 tooling looks like and where rot accretes** — it is input to thinking, not a source to salvage. We build the mechanism greenfield in the `dev/` system layer and let the old trees retire on their own (canon §1: don't break what works).

Drift-prone facts re-verified 2026-06-01 (see Sources): Corepack is **unbundled from Node 25+** (Node.js TSC vote — explicit `npm i -g corepack` required from Node 25 on); the `skills` CLI surface (`find`/`add`/`update`/`list`/`remove` plus `experimental_install` as the npm-ci-equivalent lockfile restore) and GitHub-as-registry model; pnpm's active 2026 release cadence; the `SKILL.md` folder+frontmatter spec.

---

## What This Brief Decides

For a single operator running many agents across the `dev/` system (three orgs — jami.studio, yrka.io, jnh.org — and their projects):

1. The canonical package manager and version manager per language, and the canonical Windows system package manager — committed, with the redundant managers retired.
2. The system-cleanup policy and its mechanism.
3. The skills-maintenance engine: one versioned home, official-canon + thin-bridge tiers, sync into every runtime, scheduled upstream refresh — and the boundary with WS11.

---

## 1. Package Managers & Language Toolchains (committed)

**Decision — one manager per language, pinned in-repo, bootstrapped reproducibly:**

| Responsibility | Committed tool | Pin / bootstrap | Retired |
|---|---|---|---|
| JS package manager | **pnpm** | `packageManager` field in each repo root; Corepack as shim while on Node ≤24, explicit `npm i -g pnpm` from Node 25+ | npm (bootstrap only), bun (only an Amp dependency) |
| JS monorepo orchestration | **Turbo** | per-repo `turbo.json` | — |
| Node version | **fnm** | `.node-version` per repo | nvm4w, plus the redundant second/third manager |
| Python package/runtime | **uv** | `pyproject.toml` + `uv.lock`, pinned `python` | pip-as-manager (uv wraps it) |
| Rust | **rustup / cargo** | per-repo `rust-toolchain.toml` | — |
| Windows system packages | **scoop** | manifest list in the system dotfiles repo | choco, winget demoted to ad-hoc OS/GUI only |
| Cloud/vendor CLIs | per-vendor (`gh`, `gcloud`, `vercel`, `supabase`, …) | installed via scoop or vendor installer; one install each | duplicate `vercel` (global + shim) collapses to one |

**First-principles rationale (why these, no menu):**

- **pnpm** is the verified 2026 monorepo standard — content-addressed store, strict hoisting, fastest cold installs, native workspace support. Turbo layers task orchestration on top. There is no second JS PM worth carrying.
- **uv** is the verified 2026 Python standard — a single Rust-based tool replacing pip/venv/pip-tools/pyenv with a real lockfile and 10–100× installs. One tool, behind a pinned lockfile adapter.
- **fnm** is the single Node version manager: fast, Rust-based, cross-platform (so the same setup survives a future non-Windows box), reads `.node-version`. Carrying a Windows-only manager *and* fnm *and* Corepack-as-version-manager is exactly the "weight uncorrelated to capability" the ethos forbids — one wins, the rest go.
- **Corepack is the pnpm shim only while it exists.** It is **unbundled from Node 25+** (Node.js TSC, verified 2026-06-01), so the committed bootstrap is: pinned `packageManager` + Corepack shim on Node ≤24, and an explicit `npm i -g pnpm` (or scoop install) the moment the system moves to Node 25. The pin is the durable contract; the shim is incidental.
- **scoop** is canonical for dev CLIs — user-scoped, no admin, clean uninstalls, reproducible from a manifest. winget stays available for OS-level/GUI apps; choco retires. The whole toolchain becomes re-buildable on a fresh machine from the dotfiles manifest + one bootstrap script.

**Adapter posture (canon §1 agnostic):** the pinned `packageManager`/version files *are* the thin adapter — swapping a tool later is a one-line pin change, not a rewrite. Nothing transient (a Node patch version, a CLI's install path) is hardcoded anywhere; it lives in the pin file or the scoop manifest.

---

## 2. System Cleanup ("Chuff") Policy (committed)

**Decision — disposable state is bounded by one scheduled prune job; durable config is version-controlled and excluded from pruning. No manual deletion, ever.**

The single prune job enforces:

- **Retention caps** on agent sessions, transcripts, and rollout files (default 30 days; archived sessions exported to cold storage if longer history is wanted, so disk stays flat without losing history).
- **Log-DB rotation/truncation** — telemetry/log SQLite DBs capped and rotated rather than growing unbounded.
- **Sweep of one-off artifacts** — `*.bak`, `*.tmp`, stale `*-global-state.json.tmp-*` and similar.
- **Cache eviction** for regenerable caches.
- **Active-WAL safety** — never touch live `*.sqlite-wal`/`-shm` or sessions while a runtime is running; the job targets only closed/idle state.

**Allowlist hygiene:** accreted append-only command-allowlist files (the kind that grow into dozens of one-off `prefix_rule` entries carrying dead project paths and, worse, secrets embedded in command strings) are **not** a disk problem — they are config rot. The committed shape is a **small, intentional prefix-rule set**, version-controlled, re-derived from policy rather than appended to per command. Any embedded secrets found during the reset hand off to WS04 for **rotation**, not mere deletion (deletion alone leaks through git history).

**Why a job, not a habit (ethos):** runtime built-in cleanup demonstrably does not bound growth (the evidence on this machine is multi-GB session/log accretion the runtime never pruned). A deterministic, repeatable, scheduled job is the root-correct fix; manual cleanup re-accretes and reintroduces the toil the rebuild exists to remove. The job logs what it reclaims so the policy stays observable.

The prune job is authored fresh as one of the **thin-bridge orchestration skills/jobs** and scheduled by Multica (canon §2 — Multica is the whole system; it replaces `goal.md`-style triggers and owns scheduling). No separate scheduler, no bespoke daemon.

---

## 3. Skills-Maintenance Mechanism (core deliverable, committed)

**Decision — one versioned skills home, one engine (`skills` CLI / skills.sh), distributed into every runtime by symlink, refreshed from official upstream on a Multica schedule. Two tiers, one mechanism.**

### The shape

- **One home.** All skills live once in a single machine-level directory under one lockfile. This is the "versioned, outside any project" record the canon and the original request both demand. The home and its lockfile are committed to the **system dotfiles repo** under `dev/`.
- **Sync by reference, never copy.** Each agent runtime (Claude Code, Codex, Gemini, xAI, and any future OAuth coding runtime) receives the skills by **symlink** into its skills directory. One source of truth; every runtime sees the same skills; nothing drifts because nothing is duplicated. The failure mode to avoid is exactly the copied-not-linked tree that silently drifts from upstream — copies are forbidden here.
- **Official upstream, scheduled.** Every official-canon skill is installed via `skills add <official-repo>` so it enters the lockfile with its source repo, path, and content hash. `skills update` runs on a Multica schedule so upstream vendor changes flow in automatically; the update surfaces a diff of what changed. Reproducible restore on a fresh machine is the lockfile + `skills experimental_install` (the npm-ci equivalent) — verified 2026-06-01.

### The two tiers (canon §1 skills rules)

1. **Official-canon skills — we never edit or maintain these.** Vendor official skills for the live fleet (gcloud, supabase, vercel, neon, stripe, resend, mintlify, tavily, …) plus **one** trusted, highly-rated community baseline chosen on merit — does it deliver deterministic, repeatable workflows that hold thousands of one-shot agent sessions to a predictable shape, matching or exceeding our dev style? Candidates such as the awesome-claude-skills collection or an ECC-style pack are evaluated against that bar; the winner is adopted wholesale and **never edited**. If a shipped official skill already does a job as well or better, we ship nothing of our own for it.
2. **Thin-bridge orchestration skills — the only tier we author (WS11 owns the content).** A *tiny* curated set encoding our deterministic, no-nonsense flows ("do exactly this, then this, then repeat") — the system-prune job above is one; the planning/reporting/review flows are WS11's. These live in the same home, ride the same lockfile and the same symlink-into-runtime convention. If an official skill covers a flow better, WS11 adopts it and authors nothing.

There is **no manufactured maintenance burden**: we maintain *only* the thin-bridge tier (a handful of files), and even that shrinks wherever an official skill subsumes it. Everything else is upstream's job, pulled on a schedule.

### Why this engine (no menu)

The `skills` CLI is the verified 2026 de-facto package manager for the open Agent Skills ecosystem: folder + `SKILL.md` is the unit, **GitHub is the registry** (any public `owner/repo` with a `SKILL.md` is installable), it auto-detects 40+ agents and links per-agent, and it writes a human-readable lockfile for reproducibility. It is upstream-connected, cross-agent, and reproducible out of the box — building our own submodule-and-sync-script harness would reinvent exactly this and add maintenance against the "don't reinvent solved problems" rule. The engine is young, but the underlying store is plain folders + git and the lockfile is human-readable JSON, so it is fully inspectable and hand-recoverable — no lock-in. (Upstream caveats verified 2026-06-01: `skills remove` does not yet update the lockfile and project-scoped installs aren't tracked — both irrelevant to a single global home, which is what we run.)

### Boundary with WS11

WS02 owns the **mechanism**: the engine, the one versioned home, the symlink-into-runtime convention, the upstream-refresh schedule, and the lockfile. WS11 owns the **thin-bridge content** — which flows we encode and how. Both tiers share the one home and one engine; they differ only in *who authors* (upstream vendors/community vs Jamie's thin bridges) and *what* they curate. This brief defines the spine; WS11 fills the thin-bridge tier into it.

---

## Technical Implications

- **Agnostic + adaptable (§1):** the symlink boundary is the skills adapter; pinned `packageManager`/version files are the toolchain adapter. Swapping any tool later is a pin or symlink change, not a rewrite.
- **Source policy:** every official-canon skill traces to an official GitHub repo recorded in the lockfile — no source-less copied trees anywhere.
- **Determinism / reproducibility:** lockfile + pinned manager versions + scoop manifest make the entire environment re-buildable on a new machine from the dotfiles repo + one bootstrap script.
- **Security handoff:** any plaintext secrets found in runtime configs or allowlists during cleanup hand to WS04 for rotation (not deletion); the skills-update job runs git-backed installs from public repos pinned by repo+hash in the lockfile (low supply-chain surface).
- **Observability:** the prune job logs reclaimed space; the skills-update job surfaces a per-skill diff.

---

## Dependencies & Handoffs

- **WS11 (skills audit):** fills the thin-bridge orchestration tier into the same home/engine this brief defines. Shared spine, separate content.
- **WS04 (secrets):** receives any embedded-secret findings from the allowlist/config reset for rotation.
- **Multica / canonical-system workstreams:** host the scheduled prune + `skills update` jobs (Multica owns scheduling per canon §2) and the system→org→project layering the dotfiles repo expresses.
- **Projects-audit workstream:** retires the dead project paths that pollute runtime trusted-project lists and allowlists.

---

## Closing Criteria (full implementation, no partials)

- System dotfiles repo stood up under `dev/`: committed manager pins (`packageManager`, `.node-version`, `uv.lock`/`pyproject`), the scoop manifest, sanitized runtime configs, the skills lockfile, and both maintenance jobs (prune + skills-update).
- One Node manager (fnm) and one Windows PM (scoop) canonical; redundant managers removed from PATH; duplicate CLI installs collapsed.
- All official-canon skills installed through the engine into the one home, symlinked into every runtime; zero copied skill trees remain.
- Prune job + `skills update` job authored and scheduled on Multica with active-WAL safety and change-diff logging.
- Accreted allowlists reset to a small intentional set; any secrets handed to WS04.

---

## Open (creative/scope — canon §4)

Only one item here genuinely sits in §4 territory, and lightly:

- **Org/project directory arrangement under `dev/`** may shift for deployment/auth reasons, which would change *where* the system dotfiles repo and per-org config sit — not *what* the mechanism is. The mechanism above is fixed; its mount point follows the §4 directory decision.

Everything else is committed.

---

## Sources

Official / external (verified 2026-06-01):

- Corepack unbundled from Node 25+: https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack · https://github.com/nodejs/corepack/issues/783 · https://github.com/nodejs/nodejs.org/issues/7555
- `skills` CLI (vercel-labs/skills, skills.sh): https://github.com/vercel-labs/skills · https://vercel.com/docs/agent-resources/skills · lockfile restore (`experimental_install`, npm-ci equivalent): https://github.com/vercel-labs/skills/issues/549 · lockfile/update caveats: https://github.com/vercel-labs/skills/issues/542 · https://github.com/vercel-labs/skills/issues/1143
- pnpm (active 2026 release cadence, install/bootstrap): https://github.com/pnpm/pnpm/releases · https://pnpm.io/installation
- uv (Python standard): https://docs.astral.sh/uv/
- fnm (Node version manager): https://github.com/Schniz/fnm
- scoop (Windows package manager): https://scoop.sh/

Local evidence (input-to-thinking, machine state on 2026-05-31): system PATH probe (pnpm, npm, node v24.x, uv, scoop/choco/winget, fnm + redundant Node managers, gcloud, vercel, supabase, gh, cargo/rustup, Python 3.14); `~/.claude`, `~/.codex`, `~/.agents` size/state breakdowns showing multi-GB disposable accretion and copied-vs-linked skill trees; `references/` skill collections (google/skills, awesome-claude-skills, ECC, Maestro) as community-baseline candidates.

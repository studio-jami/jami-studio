# F03 — Secrets, config & deploy pipeline

Status: AUTHORED 2026-06-02 · Domain: A · Platform foundations
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/04-secrets/report.md`, `../../research/00-orchestration/{plan,synthesis}.md`
Related: F01, F04 (hosting), F06

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

How secrets/config flow and how code ships. **In:** **OUR (dev-layer) secrets** — the creds we use to build + operate infra (god/provisioning keys, the deployed app's own ops secrets) via SOPS+age + Bitwarden; vault lanes; the host-agnostic deploy pipeline. **Out:** host choice (F04); and — critically — the **PRODUCT's runtime secret/connection layer** (end-users' BYOK provider keys + OAuth connection tokens, per-tenant, DB-encrypted), which is a **shipped harness capability** → **F05** (connection/secret layer) + **F07** (the encrypted store). Bucket A (this report, never ships) and bucket B (F05/F07, ships) are separate systems; the no-bleed boundary is the wall between them.

## 2. Committed decisions (from canon)

- **Agnostic `secrets` adapter (`get`/`run`); current backend = Bitwarden Secrets Manager** (free tier: 3 projects = `oss`/`saas`/`personal`; 3 machine accounts = per-lane agents; the `bws` CLI is the agent/CI read path via `BWS_ACCESS_TOKEN`). **SOPS+age / Infisical / Vault are swap-targets behind the same seam** (config, no rewrite — the durable truth is the seam, not the backend). The same **Bitwarden account's password manager** holds interactive logins + machine-account access-token custody + recovery. **1Password dropped** (no free tier). *(Free-tier ceilings: 3 projects/3 machine accounts fit the lanes; >3 or self-host-SM is a later swap/upgrade. Cloud-dependent on free; self-host SM = Enterprise — swap to SOPS/Infisical if full self-host is ever required.)*
- **Host-agnostic deploy + secrets pipeline** = the real Vercel-replacement: GitHub Actions builds the Docker image + deploys; the secrets adapter injects at deploy/runtime; vendor/env wiring in-repo (not a host dashboard).
- Internal dev secrets NEVER bleed into product repos (§1).
- **Agentic provisioning (canon §1):** internal dev runs on **god-mode** access — agents fully provision via CLI, never blocked by partial scopes. Protected, frictionless form: a **max-scope _revocable_ token per provider** (never an unrotatable Global/root key), held **only in the secrets adapter**, runtime-injected, **dev-layer-only**. **One bootstrap god-key → a provisioning agent mints + vaults all downstream keys/services/projects** (touch a dashboard once, ever). **Only exception = platform-imposed hard limits** (capabilities a platform won't expose programmatically) — **no self-imposed carve-outs**; any access a platform offers is in god-mode. Granular least-privilege folds in by production.
- **Per-platform account/isolation topology:** the org-lane boundary maps to each platform's *natural* isolation unit — **Cloudflare = account per org-lane** (oss acct = jami.studio + future intercal/collective; saas acct = yrka.io + future; jnh.org stays on Vercel); **Secrets = the `secrets` seam**, backend **Bitwarden Secrets Manager** (1 project + 1 machine account per lane; the project is the per-lane isolation primitive); the same Bitwarden account's **password manager** holds interactive logins + machine-token custody. SOPS/Infisical/Vault swappable behind the seam. **Neon = project per lane**. Separate platform *accounts* only where that platform's funding/entity boundary needs it (CF free-tier/programs); entity-owned account splits defer to traction (F22).
- First task: rotate (not delete) the plaintext tokens found in `~/.codex/*`.

## 3. Architecture & mechanics

**The `secrets` adapter (one seam, swappable backend).** Two verbs are the durable contract: **`secrets get <ref>`** (resolve one value to stdout, ephemeral) and **`secrets run -- <cmd>`** (inject resolved env into a child process, never writing plaintext to disk). The backend behind them is config.
- **Current backend = Bitwarden Secrets Manager (free).** **Projects** scope secrets per lane (`oss`/`saas`/`personal`); **machine accounts** = non-human agent/CI identities (one per lane) that read via the `bws` CLI with `BWS_ACCESS_TOKEN`. Central store + UI + rotation + access logging; cloud-hosted on free (self-host SM = Enterprise). The same **Bitwarden account** also is the human password manager (interactive logins, machine-token custody, recovery).
- **Swap-targets behind the same seam (no call-site change):** **SOPS + age** (offline, git-committable, fully-owned, no-tier — the fallback if cloud-independence/self-host is ever required), **Infisical** (OSS, free self-host), **Vault**.

This is the agnostic-adapter mentality applied to secrets: the seam is committed, the backend is a choice — and the shipped foundations (orchestra/harness) carry the *seam* so users plug their own backend (their choice, easy migration).

**Setup (as built, 2026-06-02 — bucket A, dev secrets).** One Bitwarden account = the **password manager** (interactive logins, foldered by lane, + a `keys-&-recovery` folder) **+** an **Organization running Secrets Manager**: **3 projects** (`oss`/`saas`/`personal`) + **3 machine accounts** (per-lane), each machine **assigned to all 3 projects (read-write)** for tightly-linked dev — cross-access is by *assignment*, never by duplicating a secret (a secret lives once, in its lane's project). A machine account's **access token** (`BWS_ACCESS_TOKEN`, stored in `keys-&-recovery` + injected into agent/CI env) is the agent **bootstrap/god-key**; the real infra creds (Cloudflare master token, Neon, …) are **secrets** seeded into their lane's project over time (agent-assisted — the provisioning agent seeds/rotates). Per-lane machine accounts are kept so least-privilege can later be **derived by narrowing each to its own project** (observed-usage method, canon §1). **Bucket B** — the harness's shipped user-secret/connection store — is entirely separate (F05/F07).

**Lane selection.** `OP_ACCOUNT` selects the vault lane, **defaulted per project/org by the adapter** (canon `04`). Vault topology maps 1:1 onto org-lanes (F01): `studio` (oss), `yrka` (saas), `personal`, plus a shared `dev-tokens` vault. A project resolves its lane from its org-lane; nothing cross-lane is reachable by default — the §1 no-bleed rule made mechanical at the secret layer.

**Config vs secret.** Public business facts + vendor pointers live in the F17 Ops Canon (git, public-safe); **only credentials** live in the adapter. The Ops Canon no-secret guard (F17) and this adapter are the two halves of the same boundary.

**The host-agnostic deploy + secrets pipeline (the real Vercel-replacement).** Vercel's stickiness = three conveniences, all owned portably:
1. **push-to-deploy** → a **GitHub Actions** workflow: build the Docker image (kitchen) or run the OpenNext/Astro build (web surface) → push to the host via its deploy action/API. Every F04 host (CF Pages, Cloud Run, Fly, Railway) has one.
2. **secret sync** → the `secrets` adapter injects at **deploy time** (build args / runtime env) from the lane vault; the workflow authenticates to 1Password via a **Service Account token** (itself the only bootstrap secret, stored as a GH Actions secret).
3. **vendor/env wiring** → lives **in the repo + the adapter**, never a host dashboard.

The host collapses to a commodity ("runs a container, serves traffic, gives a URL"). **The swap bar any host must clear:** push-to-deploy from GitHub · secret sync · vendor/env wiring · free-until-scaling · preview envs.

**CI gate ladder (in-session first, fail-closed).** Deterministic hooks run the **verification ladder** at the tool boundary *before* commit/push (format → code-health → lint → typecheck → tests-where-health-at-risk → boundaries → **docs-hygiene** → changelog-check → **no-secret guard**); remote CI re-runs the ladder as an *additional* gate only. Nothing that fails local gates reaches the remote. The deploy job runs only after the ladder is green.

**Preview-env secrets.** Preview deploys (Neon branch + a CF preview/Workers route, or a Cloud Run revision) inject from a **scoped preview profile** in the lane vault — never the production items. Preview secrets are lower-privilege and rotate independently.

**First task (canon `04`).** Rotate, *at the provider*, the live-looking plaintext tokens already on disk — a Neon bearer in `~/.codex/config.toml`; tokens/service-account emails in `~/.codex/rules/default.rules` — then re-home them as `op://` references. **Deletion alone is insufficient** (git history leaks); rotate first, then reference.

## 4. Remaining peripheral decisions to cement

- **Secrets-adapter interface (cemented):** `secrets get` / `secrets run`, `OP_ACCOUNT` lane-defaulted, 1Password + SOPS/age behind one seam.
- **Pipeline shape (cemented):** GitHub Actions → Docker build / OpenNext-Astro build → host deploy API; 1Password Service Account as the single CI bootstrap secret; vendor/env wiring in-repo.
- **CI gate sequence (cemented):** the verification ladder above, fail-closed, no-secret guard included, deploy gated on green.
- **Preview-env secret handling (cemented):** scoped lower-privilege preview profile per lane vault, never production items.

## 5. Dependencies & interfaces

- **F04 (hosting)** — this pipeline is the deploy mechanism for every F04 host; the host is a swappable target behind the swap bar.
- **F01 (repos)** — publishes the `@jami-studio/*` packages (publish-on-tag) and deploys product repos; vault lane = org-lane.
- **F06 (governance)** — the no-secret guard + audit chain align with the policy/audit substrate; CI deploy is itself a governed action.
- **F10 (orchestra)** — the verification ladder method is system canon owned by F10; the commands live in each project leaf.
- **F17 (Ops Canon)** — the public-facts/secret split: Ops Canon holds pointers, this adapter holds credentials; the F17 no-secret guard mirrors the §1 boundary.
- **Every product repo** consumes the adapter for its runtime secrets.

## 6. Verification & closing criteria

- `secrets get` / `secrets run` resolve from both 1Password and SOPS/age behind one interface; `OP_ACCOUNT` lane-defaults correctly per project.
- A push to a product repo builds + deploys via GitHub Actions with secrets injected at deploy/runtime; no plaintext secret is written to disk or baked into an image layer.
- **"No plaintext tokens in any repo" gate** passes: the no-secret guard rejects any key/token-shaped string in the working tree and in Ops Canon files; CI fails closed on a hit.
- The verification ladder runs in-session and blocks commit/push on failure; remote CI re-runs it.
- The three plaintext tokens in `~/.codex/*` are **rotated at the provider** and re-homed as `op://` references; the originals are revoked.
- Preview deploys inject preview-profile secrets only; production items never appear in a preview.

## 7. Risks & verify-at-build (dated 2026-06-02)

- **1Password Service Account token** is the single CI bootstrap secret — scope it minimally (read-only to the relevant lane vault) and rotate on a schedule; its compromise is the pipeline's blast radius.
- **`op` CLI + SOPS/age** versions drift — pin both; verify `op` Service Account + Shell Plugin behavior at build.
- **git history** already contains the plaintext tokens — rotation (not deletion) is mandatory; consider history scrub only if the repo is/becomes public.
- Host deploy APIs (CF, Cloud Run, Fly, Railway) change — keep each behind a thin workflow step so a host swap is a workflow edit, not a rewrite.

## 8. Sources

- `04-secrets`, synthesis §3 (Secrets & access), canon §1 (no-bleed, no-hardcode) + §2 (deploy pipeline, host-agnostic swap bar, secrets adapter).

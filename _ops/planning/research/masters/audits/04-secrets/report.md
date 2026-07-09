# Shared Secrets & Access Plumbing — Design Brief

Date: 2026-06-01
Status: Committed direction
Owner: Jamie (jamie@yrka.io) — one human, many agents
Scope: System-layer plumbing (priority #3). One agnostic secrets-and-access contract serving all orgs, projects, and agent runtimes.

> **REVISED 2026-06-02 — backend swapped to free; the SEAM is the committed truth (authoritative: canon §1–§2
> register + F03).** Bootstrapped-stage decision: **drop paid 1Password** (no free tier, $8/user/mo). The
> `secrets` adapter (`secrets get`/`secrets run`) is the durable contract; the **current backend = Bitwarden
> Secrets Manager (free)** — 3 projects = the lanes (`oss`/`saas`/`personal`), 3 machine accounts = per-lane
> agents, the `bws` CLI is the agent/CI read path (`BWS_ACCESS_TOKEN`). The same free Bitwarden account is also
> the human password manager (logins + machine-token custody + recovery). **Swap-targets behind the same seam:
> SOPS+age** (offline/owned/no-tier — the fallback if cloud-independence or full self-host is ever required),
> **Infisical, Vault**. Free-tier ceilings (3/3, cloud-only on free, self-host-SM = Enterprise) fit the lanes
> now; >3 or self-host is a later swap/upgrade. No-bleed + rotate-plaintext-first stand. **The 1Password `op`
> mechanics below are retained only as if-ever-adopted reference — not the current backend.**

---

## Executive Summary

We build one simple, agnostic secrets-and-access plane, fresh, on industry-standard tooling. Two layers behind a single thin `secrets` adapter:

- **Central reusable store: 1Password, driven entirely through the `op` CLI.** Plaintext values in every `.env` are replaced by `op://<vault>/<item>/<field>` secret references resolved ephemerally at runtime via `op run` / `op inject`; the 1Password SSH agent handles git/server keys; Shell Plugins handle recurring dev-tool CLIs (GitHub, Vercel, Stripe, AWS, …); Service Account tokens (`OP_SERVICE_ACCOUNT_TOKEN`) give headless agents scoped, non-interactive reads.
- **Local-first hard copy: SOPS + age.** The subset of secrets that must be committable and decrypt with zero network dependency live encrypted in-repo, decrypted by an age key on Jamie's machine. This is the offline, deterministic floor of the system.

Everything sits behind a thin `secrets` adapter (`secrets get NAME`, `secrets run -- cmd`) so app code, scripts, and agents read one contract regardless of backing store — keeping the host/db/auth-agnostic principle, and keeping the door open to swap vaults with no rewrite.

**Vault topology maps one-to-one onto the three org-lanes:** one vault per lane — `oss`, `saas`, `personal` — with per-domain item namespacing inside each (jami.studio / intercal / collective under `oss`; yrka under `saas`; jnh.org under `personal`), plus one shared **Dev Tokens** vault for cross-lane CLI credentials. The `op` CLI is signed into one account at a time; `OP_ACCOUNT` (defaulted per project/domain by the adapter) selects the lane, preventing cross-lane bleed.

This is reuse, not invention: a central zero-knowledge vault for human+agent reads, references-not-values in repos, an agent identity primitive for headless reads, and an offline encrypted fallback — the conventional 2026 operator-secrets shape.

**Concrete first task (do before anything else builds on this):** rotate, at the provider, any live-looking plaintext tokens already on disk. The `02-system-and-tooling` workstream surfaced a Neon bearer token in `~/.codex/config.toml` and embedded tokens / service-account emails in `~/.codex/rules/default.rules`. Deleting the files leaves the values recoverable in git history, so each must be **rotated at its provider**, then re-homed as an `op://` reference.

---

## First-Principles Rationale

The requirements are fixed: (1) a local-first decryptable hard copy on Jamie's machine; (2) one central home for API keys and frequently-used dev tokens so they stop being copied per-project or regenerated; (3) fewer service accounts/tokens overall; (4) clean separation of multiple `@`-accounts per platform (gcloud, Vercel, Supabase, …) across the three lanes.

A single tool cannot satisfy all four well: a pure cloud vault fails the offline hard-copy requirement, and a pure file-encryption scheme has no friendly multi-account UX, SSH agent, or shell-plugin token injection. The minimal correct shape is therefore exactly two complementary primitives, no more:

- **1Password** is the human/agent-facing vault and identity boundary. It directly answers requirements (2), (3), and (4): one canonical home for tokens, ephemeral injection so values stop multiplying across files, native per-account selection for clean lane separation, and a Service Account token as the agent-native non-interactive read primitive. ~$8/user/mo, no server to operate.
- **SOPS + age** is the offline, git-committable floor that answers requirement (1): encrypted values diff cleanly in git and decrypt with a local age key, zero network dependency.

Adding a third tool (e.g. a self-hosted secret server) buys no capability the two-layer shape lacks and imposes an always-on service to run, back up, and secure — pure operational bloat for one operator. Skipping the offline layer drops a hard requirement. So the shape is two layers, both standard, both unmaintained-by-us, unified by one thin adapter. That is the leanest design that loses no required capability.

---

## Design (final shape)

### The `secrets` adapter (the only thing we author)

One thin contract, system-layer, used identically by the human and every agent:

- `secrets get NAME` — resolve a single value (delegates to `op read` or SOPS decrypt).
- `secrets run -- <cmd>` — launch a process with secrets injected as ephemeral env vars (delegates to `op run --env-file=...`), never writing values to disk.

The adapter defaults `OP_ACCOUNT` per project/org from project config, so an agent in a `yrka.io` project cannot accidentally read or write a `jami.studio` vault. It is the single integration point: agent runtimes are launched under `secrets run -- <agent>`, so the process inherits resolved secrets regardless of whether the runtime natively dereferences `op://` references (most do not yet — see Verified Facts). This keeps the system agnostic: if the backing vault ever changes, only the adapter changes.

### Vault topology (aligned to the three org-lanes)

| Vault | Lane / purpose (per-domain item namespacing inside) |
|---|---|
| `oss` | the open-source lane — `jami.studio` foundations (`@jami-studio/harness`, `@jami-studio/ui`, `@jami-studio/orchestra`), `intercal`, `collective` |
| `saas` | the commercial lane — `yrka` product monorepo (business / media / research / free-tools / BoardRune) |
| `personal` | `jnh.org` — personal (website) |
| `dev-tokens` | shared CLI credentials reused across lanes (GitHub, Vercel, Stripe, AWS, …) — kept DRY |

One vault per lane gives clean isolation that mirrors the `dev/<org>/<domain>/` structure; the shared Dev Tokens vault stops common credentials being duplicated. `--account` / `OP_ACCOUNT` selects the lane per command. gcloud gets one named configuration per identity to match (today it has a single `config_default` despite three identities on disk: `jamie@yrka.io` plus two service accounts).

### Env files, references, and agent reads

- `.env*` files hold references (`KEY=op://yrka/Item/field`), not values, and are resolved at launch by `secrets run`. Plaintext local env files are retired in favor of references plus a per-machine 1Password unlock. Parallel env copies collapse toward generated-at-runtime injection.
- **Agents** authenticate non-interactively via a least-privilege Service Account token (`OP_SERVICE_ACCOUNT_TOKEN`) scoped to the vaults that agent role needs — no desktop app, no human unlock. This replaces ad-hoc service-account-JSON patterns for scheduled/unattended runs (Multica orchestrator pipelines, prune/maintenance jobs).
- **SSH keys** are served by the 1Password SSH agent; `~/.config/1Password/ssh/agent.toml` maps keys to hosts and extends beyond the default vault when more than a handful of keys/identities are in play.
- **Recurring dev-tool CLIs** authenticate via Shell Plugins (`op plugin`), injecting credentials at runtime instead of leaving long-lived tokens in plaintext — the direct answer to "dev tokens recreated / leaking into project secrets."

### Source & security policy

- SOPS-encrypted files are git-safe and committable; any remaining plaintext env files stay gitignored until retired.
- Ephemeral injection removes long-lived plaintext tokens from disk, cutting leak surface materially.
- The Service Account token is itself a high-value, scoped read key: least-privilege scope, careful storage, regular rotation.
- In-session gates read from the vault via the Service Account token (fail-closed locally before commit/push); remote CI is an additional gate only.

---

## Verified Facts (official sources, verified 2026-06-01)

All pricing/feature facts are drift-prone; verified on the date above.

**1Password (`op` CLI + vault).**
- Secret references use `op://<vault>/<item>/[section/]<field>`. `op run` resolves references (from env / `--env-file`) and runs the command with secrets as ephemeral env vars that never touch disk; `op inject` templates a file from references and is safe to commit; `op read` fetches one value.
- **Multiple accounts:** the CLI is signed into **one account at a time**; `OP_ACCOUNT` (or `--account`) selects which account/vault references resolve against. References must target a vault in the account matching `OP_ACCOUNT`. There is an open community request (Apr 2026) to extend the URI to embed an account (`op://account@vault/item/field`); not yet shipped. This is why the adapter defaults `OP_ACCOUNT` per project. (Verified 2026-06-01.)
- **Service Accounts:** `OP_SERVICE_ACCOUNT_TOKEN` authenticates `op` headlessly, scoped to specific vaults/actions — the agent-native primitive.
- **Pricing:** Business **$7.99/user/month billed annually**, including developer/CLI features. A general price increase took effect **2026-03-27**; treat all figures as freshly drift-prone. No secrets-only standalone plan and no free tier (14-day trial only); Individual ($3.99) and Families ($5.99) lack Service Accounts. (Verified 2026-06-01.)
- **Agent-runtime injection** is via launching under `op run`, not native config dereferencing — most agent harnesses do not yet resolve `op://` inside their own config (e.g. Claude Code issue #23642, open). The `secrets run -- <agent>` contract is the robust path.
- **Could not verify:** the exact Service Account quota threshold at which Business usage requires Enterprise was not pinned to a number against Jamie's account; confirm at provisioning.

**SOPS + age (local-first, git-committable).** Free, OSS. age uses small modern X25519 keys; SOPS encrypts values inside YAML/JSON/`.env` while preserving structure, so encrypted files diff and commit cleanly and decrypt with only a local age key — fully offline. The recognized 2026 GitOps standard for committable secrets.

**Not adopted (and why):** Infisical (self-host CE is free with dynamic secrets, but adds an always-on server to run/back-up/secure — operational bloat for one operator; managed cloud Pro ~$18/identity/mo and gates dynamic secrets to Enterprise). Doppler (managed-only, no local copy — conflicts with local-first). Bitwarden Secrets Manager (viable budget option; weaker CLI reference-injection and shell-plugin breadth than 1Password). HashiCorp Vault (enterprise dynamic-secrets-at-scale; over-engineered for a solo operator).

---

## Concrete First Tasks

1. **Rotate live plaintext tokens at the provider.** The Neon bearer in `~/.codex/config.toml` and the tokens / service-account emails in `~/.codex/rules/default.rules` (surfaced by `02-system-and-tooling`) are recoverable from git history — rotate each at its provider, then re-home as `op://` references. This is week-one, not hypothetical.
2. Stand up the `secrets` adapter contract (`secrets get`, `secrets run`) over `op` + SOPS, documented as a system-layer concern in the system/dotfiles repo.
3. Create the per-lane vaults (`oss`, `saas`, `personal`) + the shared `dev-tokens` vault; migrate `GITHUB_TOKEN`, `VERCEL_TOKEN`, and the OAuth/dev tokens out of every `.env`.
4. Convert `.env*` to `op://` references; retire plaintext local env files.
5. Provision a least-privilege Service Account token per agent role.
6. Add per-identity gcloud named configurations to match the three identities on disk.
7. Generate the age key(s) on Jamie's machine and define which repo-committable secrets move to SOPS+age.

---

## Open (creative / scope)

Per canon §4, the only genuinely-open item touching this plumbing is **auth topology across products/surfaces** — whether end-users get all-individual, some-shared, or one identity plane with ala-carte entitlements. That is an end-user identity decision, distinct from this operator/agent secrets plane, which is committed above. The default leans toward a single agnostic identity/entitlement plane the unified `yrka.io` interface composes; when that shape lands, this secrets plane already isolates per-lane credentials to support it. Nothing else here is open.

---

## Cross-References

- **02-system-and-tooling** — owns the system/dotfiles repo where the `secrets` adapter, vault topology, and Service Account tokens live; hands this workstream the plaintext-token rotation findings above.
- **03-dev-systems** — unattended Multica orchestrator pipelines and scheduled maintenance jobs read via the Service Account token / age key defined here. WS03 owns *where* jobs run; this brief owns *how they read secrets*.
- **09-brand-development** — per-org / per-`@user` credential isolation rides on the per-lane vaults selected by `OP_ACCOUNT`.
- **07-brands-funding** — the three-lane (personal / OSS / commercial) mapping this vault topology mirrors one-to-one.

---

## Sources

Official / external (verified 2026-06-01):
- 1Password secret references / `op run` / `op inject` — https://developer.1password.com/docs/cli/secret-references/
- 1Password use multiple accounts (`--account` / `OP_ACCOUNT`) — https://developer.1password.com/docs/cli/use-multiple-accounts/
- 1Password Service Accounts — https://developer.1password.com/docs/service-accounts/
- 1Password SSH agent — https://developer.1password.com/docs/ssh/agent/
- 1Password Shell Plugins — https://developer.1password.com/docs/cli/shell-plugins/
- 1Password pricing (Business $7.99/user/mo; 2026-03-27 price increase; no free tier) — https://1password.com/pricing/password-manager
- Multiple-account support in `op run` (community, Apr 2026) — https://www.1password.community/discussions/developers/multiple-account-support-in-op-run/169004
- Claude Code native `op://` in settings.json env (open) — https://github.com/anthropics/claude-code/issues/23642
- SOPS — https://github.com/getsops/sops ; age workflow guidance (2026)
- Infisical pricing — https://infisical.com/pricing
- Bitwarden Secrets Manager plans — https://bitwarden.com/help/secrets-manager-plans/

Local (read-only, structure/patterns only):
- `~/.codex/config.toml`, `~/.codex/rules/default.rules` (plaintext-token findings, via WS02)
- `~/.codex/auth.json` (structure only)
- `C:\Users\james\AppData\Roaming\gcloud\configurations\`, `...\gcloud\legacy_credentials\`

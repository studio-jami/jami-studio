# F15 — Agent discoverability (AX)

Status: AUTHORED 2026-06-02 · Domain: D · Distribution, products & AX
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/00-orchestration/{plan,synthesis}.md` (Agent discoverability), `11-skills-audit`, `10-product-concepts`
Related: F06 (governance = the other side of the coin), F08 (MCP), F09 (registry), F14 (Kit)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

Agents as a first-class user persona. **In:** the AX surface + the legibility moat. **Out:** the safety machinery it rides (F06).

## 2. Committed decisions (from canon)

- **Prediction/stance:** most visitors/callers will be agents; treat AX as first-class, planned through dev. End-goal: a user's agent installs/configures/provisions the whole OSS suite via the CLI (user-permissioned) — "fork + integrate → Done."
- **Legibility is the moat:** uniform capability description (adapter + capability/UI registries) → agents recommend precisely.
- **AX surface:** `llms.txt`/`llms-full.txt` (Mintlify auto-gen); first-class **MCP server**; official skills; **agent-first CLI** (`--json`/`--yes`/idempotent); OpenAPI + typed SDKs; **capability manifest** (the adapter register published); `AGENTS.md` in the scaffold.
- **Discoverability ⇄ governance are one coin** — safe agent provisioning rides the committed principals/policyCheck/audit (F06).

## 3. Architecture & mechanics

**Legibility is the moat.** Because every capability is **uniformly described and uniformly accessed** (the F11–F13 adapter register + the F09 capability/UI registries), the product is **legible to agents** — an agent can introspect what it does and how to wire it, and recommend it precisely for the right use-case. Most products are illegible to agents; ours is the distribution advantage.

**The AX surface (built through dev, not bolted on).**
- **`llms.txt` / `llms-full.txt`** — Mintlify auto-generates them (near-free); the machine-readable doc index for agents.
- **First-class MCP server** (hosted + self-host) — exposes harness capabilities as MCP tools (F08); the primary agent-facing programmatic surface.
- **Official skills** — install/configure/common-workflow skills (the F10 thin-bridge set + Kit skills), consumed as shipped.
- **Agent-first CLI (`jami`)** — `--json`, `--yes`, **idempotent**, clean exit codes, strong `--help`. The install/configure/provision surface (F14): "fork the repo and integrate my app idea → Done."
- **OpenAPI + generated typed SDKs** — the typed programmatic surface for the REST endpoints.
- **Capability manifest** — the F11–F13 **adapter register published as a discoverability asset**: a machine-readable list of every capability (id, description, input/output schema, the governing capability key). This is the introspection root an agent reads to know what the product can do.
- **`AGENTS.md`** — shipped in the `@jami-studio/create-app` scaffold (F14) so a *forking* agent extends correctly.

**Capability-manifest format.** A generated JSON/JSON-Schema document, **derived from the adapter register + F09 registry** (single-sourced — never hand-kept): each entry `{ id, name, description, inputSchema, outputSchema, capabilityKey, transport }`. Published at a well-known URL + bundled in the MCP server's tool list + referenced by `llms.txt`. Because it's generated from the same registries the runtime uses, it cannot drift from actual behavior.

**Discoverability ⇄ governance are one coin.** Inviting agents to install/configure/provision "with user permissions" opens an abuse surface that is **only safe because the primitives are already committed** — **agents as first-class principals (F02), the `policyCheck()` seam (F06), the hash-chain audit (F06/F07).** AX *consumes* that safety machinery; build and market them together — *agent-native and agent-safe.* Every CLI/MCP/manifest action an agent takes is gated by `policyCheck()` against the agent principal's grants.

## 4. Remaining peripheral decisions to cement

- **Capability-manifest format (cemented):** generated from the adapter register + F09 registry; `{ id, name, description, inputSchema, outputSchema, capabilityKey, transport }`; published at a well-known URL + in the MCP tool list + `llms.txt`; never hand-kept.
- **CLI command surface (cemented direction):** `jami` install/configure/provision, `--json`/`--yes`/idempotent/clean-exit/strong-`--help`; final command tree finalized at build against the F04 provisioning seam + F14 scaffold.

## 5. Dependencies & interfaces

- **F08 (transport)** — the MCP server is the agent-facing capability surface over the transport layer.
- **F09 (UI registry)** — agents are first-class shadcn-registry consumers; the capability manifest draws from the registry.
- **F06 (governance)** — the safety machinery AX rides; every agent action is `policyCheck()`-gated (the other side of the coin).
- **F02 (identity)** — the agent authenticates as a first-class principal to use the CLI/MCP/provisioning.
- **F14 (distribution)** — the `jami` CLI + scaffold `AGENTS.md` + Kit skills ship here; the provisioning flow is the CLI's job.
- **F11–F13 (adapters)** — the adapter register is the source of the capability manifest.
- **F16 (products)** — public surfaces (Studio showcase, free-tools, Collective view) are agent-legible funnels.

## 6. Verification & closing criteria

- `llms.txt`/`llms-full.txt` auto-generate (Mintlify); an agent can read them to navigate the docs.
- The MCP server lists + calls harness capabilities as tools (hosted + self-host); every call is `policyCheck()`-gated against the agent principal.
- The `jami` CLI installs/configures/provisions idempotently with `--json`/`--yes`/clean exit codes; re-running converges.
- The capability manifest is generated from the live registries (not hand-kept) and matches actual runtime capabilities; published at a well-known URL + in the MCP tool list.
- A forking agent reads the scaffold `AGENTS.md` and extends correctly through seams, not by patching source.
- An unauthorized/over-scoped agent provisioning action is denied by F06 (safe-by-construction).

## 7. Risks & verify-at-build (dated 2026-06-02)

- **AX safety is entirely dependent on F06** — if `policyCheck()` ever fails open, the agent-provisioning surface becomes an abuse vector; the default-deny-on-error test (F06) is load-bearing for AX.
- **`llms.txt` is a convention, not a ratified standard** — track its evolution; Mintlify generation insulates us from churn.
- **MCP spec is moving** (F08) — pin the server SDK; re-verify at lock.
- **Manifest drift** is prevented by generating it from the live registries — never allow a hand-edited manifest (it would silently lie to agents).

## 8. Sources

- canon §2 (Agent discoverability — AX), synthesis §3 (AX), `11-skills-audit`, `10-product-concepts`.

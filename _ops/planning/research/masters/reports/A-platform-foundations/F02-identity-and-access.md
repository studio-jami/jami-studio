# F02 — Identity & access

Status: AUTHORED 2026-06-02 · Domain: A · Platform foundations
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/00-orchestration/{plan,synthesis}.md` (Identity & sign-in), `12-agent-native/deep-dives/betterauth-per-org.md`, `06-rebuild-feasibility`
Related: F06 (governance), F07 (entitlement plane), F04, F16

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

Who can do what — human and agent. **In:** sign-in, sessions, SSO, the principal model, gating. **Out:** the policy gate itself (F06), entitlement tables (F07).

## 2. Committed decisions (from canon)

- Self-hosted **BetterAuth as an OIDC issuer per domain** (the identity surface).
- **Passkeys-preferred + social-OAuth fallback**; intra-domain SSO via OIDC.
- Domains **unfederated by default but OIDC-ready** (hosted-IdP/federation later as config).
- Public marketing (`www.`) ungated → gated `app.<domain>`.
- **Agents authenticate as first-class principals** (service tokens / Agent Passport), never impersonating a human.

## 3. Architecture & mechanics

**One OIDC issuer per domain.** Each domain (`jami.studio`, `yrka`, `jnh.org`) runs a self-hosted **BetterAuth** instance as a standard **OIDC provider** — its own user pool + the apps that trust it. The issuer is part of the domain's deploy boundary (F04) and rides the gated `app.<domain>` surface. `jnh.org` runs light/no auth. Domains are **unfederated by default but OIDC-ready** — every issuer speaks standard OIDC, so cross-domain federation or a swap to a hosted IdP (WorkOS/Clerk) lands **later as config behind the auth adapter**, no rebuild.

**Surface split (canon).** `www.<domain>` (marketing) is **ungated**; registration crosses to `app.<domain>` (gated). One login federates across a domain's apps via intra-domain OIDC SSO — e.g. one yrka session spans `business-suite`, `media-suite`, `research-suite`, free-tools, BoardRune (all trust the `yrka` issuer).

**Human auth flows.** **Passkeys-preferred** (WebAuthn, the default registration + sign-in path) with **social-OAuth fallback** for users without a passkey. Sessions are issuer-minted OIDC tokens; apps validate against the domain issuer's JWKS. No app holds credentials — they hold a relying-party trust relationship with their domain issuer.

**Agent principals (first-class, never impersonation).** Agents authenticate as their **own principals** — a service-account token / Agent Passport minted by the issuer, carrying an agent DID and the granting org. An agent **never** rides a human's session cookie. The principal model is the input to the F06 `policyCheck()` gate: every governed action is attributed to either a human principal or an agent principal, and the F07 `capability_grants` are keyed to that principal + org. This is the discoverability↔governance coin (F15): inviting agents to install/provision "with user permissions" is only safe because the agent is a distinct, attributable, grantable principal.

**Token shapes.** Human session = short-lived OIDC access token + refresh, passkey-bound where possible. Agent principal = a scoped service-account token (issuer-minted, org-scoped, audience = the target domain's resource servers), introspectable so F06 can resolve the principal on every call. Both flow as standard Bearer tokens; the resource servers validate, then hand the resolved principal to `policyCheck()`.

**The identity/entitlement model is committed; only IdP/vendor specifics verify at lock.** The org/membership/role/`capability_grant` tables (additive, natural-named) live in F07; F02 owns *who the principal is*, F07 owns *what it may access*, F06 owns *the decision*.

## 4. Remaining peripheral decisions to cement

- **Agent-principal token shape (cemented direction):** issuer-minted, org-scoped, audience-bound service-account token carrying an agent DID; introspectable for F06. Final claim set verified against BetterAuth's OIDC/JWT plugin at build.
- **Federation timing (cemented posture):** unfederated by default, OIDC-ready; federation or a hosted-IdP swap lands as config behind the auth adapter **only when a real cross-domain SSO need appears** — never pre-built.
- **Final IdP/vendor specifics** verified at lock (BetterAuth plugin maturity for passkeys + OIDC-provider mode).

## 5. Dependencies & interfaces

- **F06 (governance)** — consumes the resolved principal on every governed action; default-deny if the principal can't be resolved.
- **F07 (entitlement plane)** — `capability_grants` + membership keyed to the F02 principal (human email or agent DID) + `org_id`.
- **F04 (hosting)** — the issuer is a per-domain deploy boundary; agent-principal tokens authorize the F04 "spawn session" provisioning calls.
- **F16 (products)** — each product domain trusts its domain issuer; yrka's suites + free-tools share one yrka session.
- **F15 (AX)** — the agent-first CLI authenticates as an agent principal to install/configure/provision.
- **F05 (harness)** — carries the principal through the run; the native connection/secret layer uses the principal for scoped credential access.

## 6. Verification & closing criteria

- A self-hosted BetterAuth OIDC issuer runs per domain; standard discovery (`/.well-known/openid-configuration`) + JWKS resolve.
- Passkey registration + sign-in works end-to-end; social-OAuth fallback works.
- One sign-in on `app.yrka.io` SSOs across all yrka suite Apps + free-tools.
- An agent obtains its own service-account token, calls a governed endpoint, and F06 resolves it as an **agent** principal (not a human); impersonation paths are absent.
- `www.<domain>` routes are reachable ungated; `app.<domain>` requires a valid session.
- Token validation fails closed: an unresolvable/expired/wrong-audience token → F06 default-deny.

## 7. Risks & verify-at-build (dated 2026-06-02)

- **BetterAuth plugin maturity** for passkeys + OIDC-**provider** mode (issuing, not just consuming) — verify the current plugin set + version at build; this is the one component whose maturity gates the shape.
- **Passkey UX edge cases** (cross-device, recovery) — verify the recovery/fallback path so no user is locked out (social-OAuth fallback covers it).
- Agent-passport / service-account token claim conventions are still settling in the agent-protocol ecosystem (A2A Signed Agent Cards, F08) — keep the claim set behind the auth adapter so it tracks the standard.

## 8. Sources

- canon §2 Identity & sign-in, synthesis §3 (Identity & sign-in), `12-agent-native/deep-dives/betterauth-per-org.md`, `06-rebuild-feasibility`.

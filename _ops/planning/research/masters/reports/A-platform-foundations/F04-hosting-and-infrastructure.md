# F04 — Hosting & infrastructure

Status: AUTHORED 2026-06-02 · Domain: A · Platform foundations
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/00-orchestration/{plan,synthesis,activity-log}.md` (hosting research #2/#7/deep-dive), `06-rebuild-feasibility`
Related: F03 (pipeline), F10 (orchestra/sessions), F12 (provisioning seam consumer), F16

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

Where everything runs. **In:** the split-stack, per-product host mapping, provisioning seam, cost model. **Out:** the deploy pipeline mechanics (F03).

## 2. Committed decisions (from canon)

- **Mental model:** web surfaces (kiosk/serverless-fine) vs agent **"kitchen"** (long-running/stateful → container, never serverless). Harness/orchestra are Node services, not Next.js apps.
- **DECIDED (Option A):** **jami.studio → Cloudflare Pages**; **yrka.io → one CF plane** (Pages/Workers + Workers-for-Platforms + Durable Objects) **+ Google Cloud Run** kitchen **+ Neon**. Fly/Railway = documented Docker-portable fallbacks.
- **Provisioning/control-plane adapter** ("spawn session") keeps hosted vs OSS-self-host behind config.
- Multi-host principle: portability proven by Docker + Postgres + OSS self-host, not redundant prod; migrate opportunistically.
- Cost: perpetual free tiers govern production; the ~$1.3k GCP trial credits are a dev/eval budget (1-yr).

## 3. Architecture & mechanics

**The split-stack (canon, verdict in).** Every product is **two workloads with opposite hosting needs**: **web surfaces** (marketing/docs/app UIs — short, stateless request→response; serverless-friendly) vs the agent **"kitchen"** (long-running, stateful agent sessions + orchestration — container/always-warm, **never serverless**). Most hosting complexity is just refusing to run both on one thing. The harness/orchestra (F05/F10) are **Node services, not Next.js apps**; only web surfaces are Next.js (or Astro for pure content).

**Per-product host mapping (named hosts).**
- **`jami.studio`** (almost all web-surface, low-traffic) → **Cloudflare Pages**: Astro static for content; OpenNext if the showcase needs SSR. ~$0–5/mo, unlimited bandwidth, painless subdomains, same plane as yrka.
- **`yrka.io`** → **one Cloudflare plane + Google Cloud Run kitchen + Neon**:
  - **CF Pages/Workers** — first-party web UI (the suite shells) via `@opennextjs/cloudflare`.
  - **Workers-for-Platforms (WfP)** dispatch namespaces — tenant deploy-on-behalf + isolation; lean per-tenant **agent/edge logic** as Workers.
  - **Durable Objects (DO)** — agent/stateful **session** state; DO *hibernates*, so idle open sessions ≈ $0.
  - **Google Cloud Run** — the heavy container **kitchen**: native scale-to-zero, 60-min request timeout, **Jobs to 7 days** for long agent runs, optional L4 GPU.
  - **Neon** — Postgres, DB-per-tenant + branch previews, **co-located in Cloud Run's region**.
- **`jnh.org`** → **Cloudflare Pages** (Astro static; light/no auth).

**Why not Vercel for the kitchen.** Vercel Fluid bills **provisioned memory for the whole instance lifetime including I/O wait**; agent sessions are *mostly* I/O wait for minutes, plus a hard **13-min** ceiling (Pro). A container multiplexes many sessions per GB with no duration ceiling; a DO doesn't bill duration while hibernating. Vercel stays the *optional* web-surface alternative if its preview-env/Next.js DX is specifically wanted (accept $0.15/GB egress). Rough yrka kitchen cost: **~$50–80/mo small, ~$150–300/mo moderate** (Cloud Run + DO + WfP + egress).

**The provisioning / control-plane adapter ("spawn session").** One internal interface wraps provider provisioning (CF / Cloud Run / Fly APIs) so hosted (CF + Neon + Cloud Run) vs **OSS self-host (Supabase + Neon-self-host, Apache-2.0)** is **config, not code**. F10 orchestra spawns sessions through this seam; F12 reads it as the hosted-vs-OSS switch. Shape: `spawnSession(spec) → handle`, `getSession(handle)`, `terminate(handle)` over a provider-keyed registry (same lazy-registry discipline as the billing adapter, F12).

**Deliberate lock-in (isolated).** Two pieces we accept proprietary *on purpose* because they're hardest to rebuild: **Durable Objects** (stateful-actor + hibernation session model) and **Workers-for-Platforms** (deploy-on-behalf). Both sit behind our own **session** and **tenant** service interfaces so the blast radius is contained. Everything else is portable: the kitchen ships as **plain Docker images** (run identically on Cloud Run / Fly / Railway / Render / CF Containers — move in an afternoon); the app stays on standard `postgres://` (Neon never pins compute); OpenNext is an *adapter* (the same app runs `next start` in a container).

**Multi-host principle (portability without theatre).** Portability is **proven by building portable** (Docker + Postgres + the provisioning seam) + the OSS self-host story — **not** by running redundant production copies. The split-stack already makes us **honestly multi-platform** (CF + Neon + container host), so we apply to multiple platform credit programs **truthfully**. **Migrate/add a host opportunistically** when a specific opportunity justifies it; never stand up duplicate prod to chase credits.

**Cost model.** Day-one production runs on **perpetual free tiers** (CF Pages ≈ $0 unlimited bandwidth; Cloud Run free tier 180k vCPU-s + 360k GiB-s + 2M req/mo). Targets are *cheaper* than Railway's ~$5/mo floor at day-one scale → **don't waypoint** Railway→migrate (DECIDED = land on CF Pages + Cloud Run from day one, on the F03 host-agnostic pipeline). Railway/Fly = **documented Docker-portable fallbacks** only. The **~$1.3k GCP trial credits (1-yr window)** are a separate pool: a **dev/eval budget** to burn aggressively on compute-heavy dev work (provider evals, load/integration testing, the eval-driven SaaS provider selection); **production architecture never depends on them.**

## 4. Remaining peripheral decisions to cement

- **Kitchen host (cemented = Google Cloud Run)** for production from day one; Fly Machines / Railway documented as Docker-portable fallbacks (escape hatch stays real without staying live).
- **Provisioning interface (cemented):** `spawnSession`/`getSession`/`terminate` over a provider-keyed registry; DO + WfP isolated behind session/tenant interfaces.
- **Region/co-location (cemented direction):** Cloud Run + Neon primary co-located in one region; pick the region at account-open against Neon primary availability (verify-at-build).

## 5. Dependencies & interfaces

- **F03 (pipeline)** — the host-agnostic deploy+secrets pipeline is *how* everything here deploys; F04 chooses the target, F03 ships to it.
- **F10 (orchestra)** + **F05 (harness)** — the kitchen runs the Node harness/orchestra services; orchestra spawns sessions via the provisioning seam; DO holds session state.
- **F12 (billing/provisioning consumer)** — shares the provisioning/control-plane seam as the hosted-vs-OSS switch.
- **F09 (render) / F16 (products)** — web surfaces (CF Pages/Workers) front the products; the CF router routes subdomains across the plane.
- **F07 (data)** — Neon DB-per-tenant is the deployment fact behind inter-org isolation.
- **F02 (identity)** — per-domain OIDC issuer is a per-domain deploy boundary; agent-principal tokens authorize provisioning calls.

## 6. Verification & closing criteria

- `jami.studio` + `jnh.org` serve from CF Pages (Astro static), ~$0/mo, custom subdomains resolving.
- `yrka.io` first-party UI serves from CF Pages/Workers via OpenNext; a tenant Worker deploys through a WfP dispatch namespace; a DO holds session state and hibernates when idle.
- A long agent run executes on Cloud Run (Jobs path for >60-min runs); Neon is co-located in the Cloud Run region.
- The provisioning seam spawns/terminates a session against CF + Cloud Run, and against the OSS self-host target (Supabase + Neon-self-host) with only a config change.
- The kitchen image runs unchanged on a fallback host (Fly or Railway) — portability proven, not theorized.
- Production cost sits on perpetual free tiers at dev/low scale; GCP trial credits are tagged as dev/eval budget, not production dependencies.

## 7. Risks & verify-at-build (dated, 2026-06-02)

- Cloud Run 60-min request ceiling (use Jobs >60min); DO 30s-CPU/invocation (offload heavy compute); DO SQLite storage billing (Jan 2026); Fly GPU removed after Aug 1 (GPU → Cloud Run L4); OpenNext Next.js-16 parity; Cloud Run↔Neon co-location.

## 8. Sources

- canon §2 (hosting), hosting research #2/#7/deep-dive (activity-log 2026-06-02), `06`.

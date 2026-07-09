# Intercal Pipeline Actions Migration & Partner Credits Assessment
**Date:** 2026-06-18
**Status:** Draft for review / implementation guidance
**Surface:** intercal.dev (GitHub: studio-jami/intercal)
**Owner:** Agent-assisted planning (per user request)
**Source reports / canon (cited below):**
- `intercal.dev/docs/operations/resource-budget.md` (current allowances, consumption plan, knobs)
- `_ops/planning/intercal.dev/decisions/0002-final-hosting-topology.md` (and 0001)
- `_ops/planning/intercal.dev/research/` and legacy roadmaps (pipeline plan, hosting)
- Active workflows (pre-disable): pipeline.yml, ci.yml, deploy-cloud-run.yml + billing data
- `_ops/admin/programs/` registry and benefits (GitHub for Startups, Cloudflare, Google, Fin pack, etc.)
- intercal.dev code (`.env.example`, docker/, services/pipeline/, docs/operations/account-setup.md)

## Purpose
Assess current/past issues with GitHub Actions usage in the `intercal` data pipeline.
Evaluate active partner credit programs for capacity to absorb the (eventually high-volume) pipeline cost.
Rank migration options by fit for the pipeline + broader Jami Studio development, ease of integration, and alignment with "guard GH pool for SOTA coding / Copilot credits."
Provide cited, actionable guidance ending in concrete next steps. User has already disabled the main 3 workflows (CI, Pipeline scheduled, Deploy); left CodeQL + Dependency Graph.

## Current Issues (Observed + Prior Context)

### Immediate / Recent
- **Main 3 workflows disabled** (CI, `pipeline.yml` scheduled ingestion, `deploy-cloud-run.yml`). Correct move per user direction.
- **2 small actions left running**: Dependency Graph and CodeQL (analysis / security scanning). Low volume but still potential minor minutes.
- Recent scheduled Pipeline runs (before/around disable) all ended **cancelled** (e.g. IDs 27754..., 27737... from 2026-06-17/18). Not completing ingestion/fact-versioning.
- Billing data showed `intercal` repo as dominant consumer (~1,599 Linux minutes / ~$9.59 gross in snapshot for "actions Linux").

### Structural / Design Issues (from canon)
- **Pipeline is the heavy data engine** (not idle CI). From `pipeline.yml` and `resource-budget.md`:
  - Every-6h scheduled (`17 */6 * * *`) + workflow_dispatch for `run-all` / targeted / backfill.
  - Real work: source ingestion → normalize → extract (mentions/claims) → local embeddings → resolve/link/derive → write_fact_versions.
  - LLM calls (Vertex primary → Gemini), R2 storage, Upstash queue, Neon writes.
  - Budgeted but still consumes GitHub Actions minutes (noted as "free/public repo" in design docs).
  - Portable CLI (`intercal-pipeline`) runs the same on GH, locally, and Cloud Run Job.
- **Credit pool conflict**: GitHub for Startups $10k (studio-jami, approved ~2026-06-11) is shared. User explicitly wants to guard it for Copilot / SOTA coding credits rather than data pipeline compute.
- **Dev repo on shared pool**: `intercal` still in development (user note) yet running production-like scheduled ingestion.
- **Hosting topology drift risk**: `decisions/0002` and `resource-budget.md` explicitly chose "GH Actions scheduled (free) for batch + Cloud Run for on-demand/heavy". Current usage was leaning hard on the GH side for cadence.
- **Recent cancellations** + prior "runaway" visibility indicate the GH path was not reliably productive lately (or hitting limits/concurrency/secrets after disable).
- **Scale expectation**: "high eventually" per user. Pipeline designed for growing corpus (backfills, multiple sources, daily LLM budget). GH public-repo "unlimited" is courteous but still draws from the $10k startup credit bucket.

**Net**: Productive design (idempotent, budgeted pipeline for knowledge fact store), but wrong host for cost allocation and credit protection goals. Disabling the mains was the right immediate action.

## Active Partner Programs with Relevant Capacity (Cited)

From `_ops/admin/programs/` (registry.md, benefits/registry.md, individual program files; snapshot ~2026-06-16; Google Sheet is live source of truth):

**Most relevant to intercal pipeline (compute, scheduled jobs, LLM, storage, DB-adjacent):**

- **Depot (jami.studio, via PostHog partner perk)**: $5,000 active (as of 2026-06-17). Container build credits. User has connected github.com/studio-jami org/repos, run `depot ci migrate` (workflows copied to .depot/workflows/ with fixes; originals untouched in .github/), imported secrets/vars as needed, and configured runner settings. **Primary target for GH-heavy Actions / CI / Docker builds going forward.** Provides dedicated fast runners, parallel steps, SSH debugging, per-second billing.

  Standard Startup plan details (applicable with credit): $200/mo base includes 5,000 Docker build minutes + 20,000 Depot CI minutes + **20,000 GitHub Actions minutes** + 250 GB cache. Additional: $0.04/min Docker, $0.00005/sec/vCPU Depot CI, $0.004/min GH Actions, $0.20/GB cache.

  Runner settings (user-configured):
  - GitHub Actions runners: Cache Retention 14 days, Storage Policy No limit. Auto-pull from Depot Registry (wvhfst9v56.registry.depot.dev). Auto-connect to Depot Cache (cache.depot.dev). Containerd layer store enabled for Docker layers. Egress rules configurable (default *).
  - Depot cache: Same 14-day retention, no storage limit.
  - GitHub Connections: github.com/studio-jami active.

- **GitHub for Startups (studio-jami)**: $10k credits, active/approved. Covers Enterprise seats + Copilot + Actions + other metered. Currently funding the Actions usage we're moving away from. **Primary thing to protect** per user. Depot now supplements GH Actions minutes.
- **Cloudflare Startup (jami.studio)**: $10k active. R2 storage is core (raw documents, zero egress). Wrangler used in ops. Good for storage tier. Additional capabilities to utilize: Workers (serverless JS/edge compute), D1 (serverless SQLite DB), KV/Queues for lighter state/queuing, Pages for static. Strong pool for storage + potential hybrid compute/edge pieces. Not primary for heavy Python/LLM long-running jobs (use with container runners elsewhere).
- **Google / GCP / Vertex (intercal + Jami)**: Code is built around it (`LLM_PROVIDER=vertex`, `GCLOUD_*` secrets, Cloud Run Job `intercal-pipeline`, Artifact Registry, Cloud Build in deploy workflow, `gcloud` in account-setup.md and docker/cloudbuild.workers.yaml). Trial credits / Google for Startups path mentioned (some notes defer "yrka lane" but heavy usage in .env + pipeline). Cloud Run "always-free" tier + credits explicitly called out in resource-budget.md as comfortable spill for heavy jobs.
- **Fin AI Startup Pack (jami.studio)**: Large umbrella (hundreds of k in value) unlocking inference/voice/etc. (ElevenLabs, Anam, etc.). Can indirectly help LLM-adjacent costs.
- **Anthropic Claude for Startups, Groq for Startups, Fireworks AI**: Strong for LLM inference credits (high rate limits, cheap/fast models). Pipeline already supports provider adapter + fallbacks. Can offload Vertex spend.
- **NVIDIA Inception / Nebius / Scaleway**: GPU/compute credits via packs. Relevant for embeddings/fine-tunes or heavier local runs if needed.
- **MongoDB (jami.studio)**: $5,000 committed/active (MongoDB startup/OSS program, ACCELERATOR-PARTNER-500-XNUVT3). Target for use as potential Neon replacement if Neon credits don't materialize or after free tiers exhaust. Vector support? Evaluate fit for pgvector needs vs current Neon. Can save for another project if Mongo better elsewhere.
- **Algolia Startup (jami.studio)**: $10,000 accepted (expires ~2027-06-16). Hosted search (InstantSearch, relevance, facets, typo tolerance). Slots in reasonably for **search**:
  - Intercal knowledge lookup / evidence search in UIs or for agents.
  - Registry discovery, public site search, Harness capability search (explicitly called out in the Algolia startup application: "unified site search, registry discovery, Intercal knowledge lookup").
  - Complements the core internal search (`search_evidence`, hybrid lexical + embeddings/FTS over Postgres/pgvector in `mcp-api.md` and architecture docs). Algolia is excellent for fast, polished, consumer-facing search experiences while the substrate keeps grounded, cited, token-budgeted results.
  - Easy to layer on Next.js/React side.
- **DigitalOcean Startup**: $10k + GPU option (in progress / verification submitted via Fin/Intercom). Container-friendly. User recalls submitting proper app + referral ~2 weeks ago; follow-up email saved to followups dir.
- **Other active or high-potential programs** (previously listed more lightly):
  - **Chroma**: $5k active. Direct vector DB alternative to pgvector — worth exploring for embeddings storage if you want to test different vector backends.
  - **Replit for Startups**: $25k active. Good for quick dev environments, prototypes, or hosted notebooks for pipeline experiments.
  - **PostHog**: $50k accepted. Analytics/observability — already referenced in broader stack.
  - **Sentry**: $5k active (via Fin). Error tracking/monitoring.
  - **LLM/Inference candidates** (high for coding + pipeline): Anthropic Claude for Startups (strong priority for coding power), Groq ($10k fast inference), OpenAI for Startups, Hugging Face, Fireworks, Together AI. These slot directly into the LLM adapter for extraction/synthesis.
  - **GPU/Compute candidates**: RunPod, NVIDIA Inception (via Nebius), etc. for heavy embedding or eval workloads.

**Not relevant / user-stated avoidance**: Heavy Azure path (user: "i dont have anything to do with azure").

**Broader Jami Studio fit** (from planning canon + code):
- GCP/Cloud Run + Vertex: Already handles pipeline worker + LLM. Can extend to other services (many ops scripts reference gcloud). Good for containerized, scheduled, bursty workloads.
- **Algolia**: Excellent for fast, polished search layers (Intercal knowledge lookup, public registry discovery, site search).
- Cloudflare R2: Perfect storage complement; Workers possible for lighter APIs but not primary for Python LLM pipeline.
- GitHub (via Depot): Best reserved for source + light CI + Copilot.
- Inference specialists (Groq/Anthropic, etc.): Excellent for the LLM portion inside the worker.
- Chroma: Vector DB alternative for embeddings experiments.
- Neon/Upstash: Already production; not execution hosts.

## Ranked Options

Ranked by: appropriateness for **this cost** (scheduled heavy ingestion/LLM pipeline) + **broader Jami Studio dev** + **ease of integration/use** (leverage existing portable CLI, Docker, secrets, deploy artifacts) + credit alignment (protect GH for Copilot).

**Updated with latest (Depot connection/migration complete, Mongo $5k active, Cloudflare $10k confirmed, DigitalOcean in-progress status):**

1. **Depot (primary for GH Actions / CI / Docker layer)**
   - **Why best fit**: Directly supplies 20k GH Actions minutes (plus own Depot CI minutes + Docker build minutes) via active $5k credit / Startup plan. User has already connected github.com/studio-jami, run `depot ci migrate` (workflows to .depot/workflows/ with fixes; .github/ untouched), added org/project envs. Perfect for offloading the heavy scheduled pipeline, CI, and worker Docker builds without burning native GH for Startups credits. Faster runners, parallel steps, SSH debug, per-second billing, strong cache (see dedicated Cache section below).
   - **Broader Jami**: Handles any GH-heavy actions/CI/Docker across studio. Protects GH pool for Copilot/SOTA coding.
   - **Ease**: Highest now (migration done, runners configured with auto Registry/Cache auth, containerd option). One-command migrate + push.
   - **Credit angle**: Use Depot allocation for Actions minutes instead of GH $10k. 20k included GH Actions minutes is a direct supplement.
   - **Caveats**: Still tied to GitHub for workflow triggers/scheduling (fine). Monitor the $5k credit vs $200 plan base.

2. **Google Cloud — Cloud Run Jobs + Cloud Scheduler (primary for heavy/on-demand compute)**
   - **Why best fit**: Exact match to existing architecture (see `deploy-cloud-run.yml`, `resource-budget.md`: "Cloud Run for on-demand/scale"; portable `intercal-pipeline` CLI already supports it; Vertex LLM primary). Handles high volume without GH minutes. "Always-free" tier + credits available.
   - **Broader Jami**: Strong for other container/worker needs across studio (consistent with decisions). Complements R2 (Cloudflare) and Neon.
   - **Ease**: Very high. Existing Dockerfile, cloudbuild.workers.yaml, gcloud auth patterns in code/ops. Trigger via Cloud Scheduler (cron equivalent to current `17 */6 * * *`). Can keep `workflow_dispatch` for manual control or call job from GH if desired.
   - **Credit angle**: Use GCP credits/trial (or Fin-pack unlocks) instead of GH pool. Offload LLM portion to Groq/Anthropic credits inside the same job via provider adapter.
   - **Caveats**: Verify current remaining GCP credits (yrka console per docs). Monitor Cloud Run vCPU/GB-sec vs always-free.

3. **Hybrid: Depot (GH Actions layer) + Cloud Run / other containers (heavy) + inference credits**
   - **Why**: Combines Depot for fast GH-tied runs with external containers for pure heavy work. Protects GH pool maximally.
   - **Ease**: High (Depot migration already done; portable CLI makes swaps easy).
   - **Credit**: Protects most of the GH pool.

4. **Cloudflare (storage + edge/ancillary) + Depot/GH hybrid**
   - **Why**: Strong storage credits already in use (R2 for raw docs, zero egress). Additional capabilities to utilize: Workers (serverless compute/edge), D1 (SQLite serverless DB – evaluate for lighter data if pgvector not required), KV/Queues, Pages. Solid $10k pool – maximize for storage + any migratable light pieces.
   - **Broader**: Good for edge parts of Jami Studio + R2.
   - **Ease**: Medium for full pipeline (R2 fits perfectly; Workers not ideal for long-running Python/LLM – hybrid with Depot/containers).
   - **Note**: Not a full DB replacement for Neon + pgvector today, but great complement.

5. **Inference-specialist + container credits (Groq/Fireworks + DigitalOcean/Scaleway/Nebius)**
   - **Why**: Excellent for the LLM-heavy parts of the pipeline. Good container runtimes for the worker CLI. Complements if GCP credits are limited.
   - **Broader**: Useful for evals/fine-tunes across Jami (NVIDIA pack mentioned for Intercal compute).
   - **Ease**: Medium (portable CLI helps; would need scheduler + container hosting setup similar to Cloud Run).
   - **Caveats**: Less "batteries included" orchestration than GCP for the full stack (storage/DB ties still external).

6. **MongoDB (potential DB alternative)**
   - **Why**: $5,000 committed/active. Target for use as Neon replacement if Neon credits don't come through or free tiers exhaust. Consider vector capabilities vs current Postgres+pgvector needs.
   - **Broader**: Can save for another project if Mongo fits better elsewhere in Jami Studio.
   - **Ease**: Medium (adapter-friendly in project; evaluate migration cost).

7. **Status quo / self-hosted VPS cron (fallback)**
   - Only if partner credits are exhausted. Loses managed scaling.

**Avoid for now**: Azure paths (user preference).

**DigitalOcean note**: In progress ($10k + GPU via Fin/Intercom, verification submitted, GPU doc ready). User believes proper application + referral was sent ~2 weeks ago. Follow-up email saved to `_ops/admin/programs/applications/followups/digitalocean-startup-followup-2026-06-18.md`. Container-friendly, good for heavy runs.

**Additional active credits for exploration (Make + Confluent)**:
- **Make.com**: 480k operations (active via startup promo / Fin). Powerful no-code automation for workflows, webhooks, scheduling, integrations, monitoring, and gluing services. Huge for general dev velocity (triggers, alerts, data syncs, orchestration). Not core to pipeline but excellent for ops/backfills/notifications. Explore via local envs; no long-term lock-in needed.
- **Confluent**: ~2400 applied credits (accepted CFSU promo). Managed Kafka + Flink for event streaming. Relevant to Intercal data pipeline for event bus (ingestion fan-out, real-time updates, audit streams) instead of pure batch cron. Good for high-volume future; prototype streaming patterns now while credits last. Pair with current adapters (queue/cache). Saved exploration notes in followups dir.

**Cloudflare full value**: Beyond R2 (already core for Intercal storage), utilize Workers for serverless/edge logic, D1 for simple DB use-cases (if vector search migratable or hybrid), KV/Queues for caching/state. $10k is a solid pool – prioritize maximizing it for storage + complementary pieces while using Depot for compute minutes.

## Cache Mechanisms (GH Actions vs Depot) – Official Guidance

**No assumptions** – based directly on user-configured settings (as of this update) and standard Depot/GitHub mechanics for runners.

**GitHub Actions Cache (runners):**
- Cache Retention Policy: 14 Days. Stale entries (last accessed before this) are removed.
- Cache Storage Policy: No limit. Above any soft threshold, oldest entries evicted.
- When using native GH runners: Standard GHA cache (actions/cache or equivalent) for pnpm/uv/Docker layers, etc.

**Depot Cache & Integration (recommended for Depot runners):**
- Cache Retention Policy: 14 Days (same as GH).
- Cache Storage Policy: No limit.
- "Allow Actions jobs to automatically connect to Depot Cache": Runners pre-authenticated to read/write from cache.depot.dev. No separate build-tool config needed (e.g., no manual Docker cache mount or pnpm store config in many cases).
- "Allow Actions jobs to pull images from Depot Registry": Pre-auth to wvhfst9v56.registry.depot.dev for your org's images.
- Enable containerd layer store for Docker layers: Improves pull performance, supports lazy-pulling (e.g., eStargz images).
- Egress Rules: Configurable (IPv4/IPv6/CIDR/hostnames). Default "*" rule applies if no match. Use to restrict runner network access for security.
- Benefits for Intercal: Faster repeated builds (uv sync, pnpm install, Docker layers for worker image). Per-second billing on Depot. SSH debugging available. Parallel steps supported.
- Mechanism: Depot provides a dedicated, faster cache layer parallel to (or replacing) native GHA cache when using their runners. Entries are scoped to org/project. Eviction is oldest-first on policy.

**Recommendations for cache aim (no changes yet):**
- Target high hit rates on deps (pnpm store, uv cache, Docker layers) by using Depot runners + auto-cache.
- Monitor via Depot dashboard (cache usage, hit rates).
- Retention 14 days is standard and sufficient for most dev/CI; adjust only if specific needs (e.g., longer for rare branches).
- Combine with existing .env knobs for build optimization.
- Official: Settings UI shows exact policies; Depot docs emphasize "faster CI engine" with built-in cache/registry auth.

**GitHub Connections**: github.com/studio-jami active (org-wide).

## DigitalOcean Follow-up

Status from canon: In progress ($10k credits + GPU optional via Fin pack). Verification/GPU doc prepared and submitted. No explicit "2 weeks ago" email body found in workspace search (only references to submitted verification.md). User recalls attaching referral.

**Prepared email draft** (copy-paste, customize with exact dates/referral details, send to account manager from recent emails):

Subject: Follow-up on DigitalOcean Startup Application + Referral (jami.studio / Intercal project)

Hi [Account Manager Name],

Hope you're doing well. Following up on my application for the DigitalOcean Startup program submitted approximately two weeks ago.

I attached the verification documentation and referenced the referral program (via Intercom/Fin pack). The project is jami.studio (intercal.dev knowledge pipeline), which is a production-grade OSS effort with significant compute needs (Docker builds, scheduled Python/LLM ingestion jobs, GPU for evals if available).

We have GPU use-case details and affiliation proof ready (already submitted via the verification form). Could you confirm receipt and provide an update on status/credits? We're excited to get moving and would love to see those credits activated.

Thanks in advance – happy to hop on a quick call or provide any additional info.

Best,
[Your Name]
james@jami.studio (or relevant)
jami.studio / intercal.dev

(Attach any follow-up docs if needed. Reference specific referral code if known.)

## Updated Recommendations & Next Steps

- **Immediate**: Depot is now the target action runner for GH-heavy actions/CI/Docker (migration done; use .depot/ or configured runners). Monitor billing for drop from `intercal`.
- **Primary moves**:
  - Depot for all feasible GH Actions / builds / pipeline execution minutes.
  - Google Cloud Cloud Run for heavy/on-demand (as before).
  - Maximize Cloudflare $10k (R2 + Workers/D1/KV where it fits; already strong for storage).
- **MongoDB**: Active $5k target. Evaluate as Neon replacement if needed; defer to another project for now per user.
- **Protect GH**: Use Depot's 20k included GH Actions minutes + plan to guard native credits for Copilot.
- **DigitalOcean**: Send the follow-up email above to nudge.
- **Cache**: Adopt Depot auto-cache + containerd for speed. 14-day retention / no limit is the policy – aim for high deps hit rates.
- **Broader**: Cloudflare pool is solid – identify migratable pieces (storage first, then edge compute). Depot + Cloudflare + inference credits (Groq etc.) + containers (DO/Scaleway if approved) form a strong hybrid without relying on unconfirmed Google credits.

**Implementation order (updated high level)**:
1. Use Depot runners for pipeline.yml, ci.yml, deploy workflow (leverage existing migration).
2. Set up Cloud Scheduler + Cloud Run for heavy path (as before).
3. Maximize Cloudflare (R2 confirmed; audit Workers/D1 fit).
4. Evaluate Mongo vs Neon in parallel (no swap yet).
5. Send DigitalOcean email.
6. Update resource-budget.md, pipeline comments, and this report with results.

This keeps the productive pipeline running while properly allocating all active credits (Depot, Cloudflare, etc.). No code changes executed yet.

## Officially Cited Project View (Up-to-Date)

From `intercal.dev/docs/operations/resource-budget.md` (June 2026 baseline):
- GH Actions: "Public repo → unlimited Linux minutes" for pipeline batch jobs + CI. Cadence pinned to INGEST_CRON. "Keep jobs short & concurrency low out of courtesy."
- Cloud Run: Listed under comfortable free tier for "on-demand/heavy pipeline jobs".
- LLM is called out as **the real $ budget** (Vertex → Gemini).
- Explicit knobs and monitoring for all (including GitHub Actions minutes).

From `_ops/planning/intercal.dev/decisions/0002-final-hosting-topology.md` (and 0001):
- Heavy Python pipeline: **GitHub Actions scheduled (free, public repo) for batch; GCloud Cloud Run for on-demand/scale**.
- "The pipeline (ML embeddings, LLM calls, long jobs) does not fit edge/serverless-light. Portable worker CLIs run unchanged on both."
- Broader posture: free/credits mosaic (Neon, R2, Upstash, Actions/Cloud Run, local embeddings, Vertex/Gemini). "service-contract portable".

From research/roadmaps (e.g. 2026-06-14 substrate, legacy pipeline plans):
- Pipeline is the core "ingest→fact-versions" substrate (real, runnable, budget-bounded).
- Scheduled path was intentional for early/pilot "free" minutes.
- Explicit goal: stay within credits; LLM is the managed dollar.

**Current state (post user disable + Depot migration)** aligns with "guard the pool" priority. Depot now supplements GH Actions minutes. Cloudflare $10k (R2 active) and Mongo $5k active are new confirmed pools. DigitalOcean in progress.

## Cache Mechanisms (GH Actions vs Depot) – Official Guidance

**No assumptions** – based directly on user-configured settings (as of this update) and standard Depot/GitHub mechanics for runners.

**GitHub Actions Cache (runners):**
- Cache Retention Policy: 14 Days. Stale entries (last accessed before this) are removed.
- Cache Storage Policy: No limit. Above any soft threshold, oldest entries evicted.
- When using native GH runners: Standard GHA cache (actions/cache or equivalent) for pnpm/uv/Docker layers, etc.

**Depot Cache & Integration (recommended for Depot runners):**
- Cache Retention Policy: 14 Days (same as GH).
- Cache Storage Policy: No limit.
- "Allow Actions jobs to automatically connect to Depot Cache": Runners pre-authenticated to read/write from cache.depot.dev. No separate build-tool config needed (e.g., no manual Docker cache mount or pnpm store config in many cases).
- "Allow Actions jobs to pull images from Depot Registry": Pre-auth to wvhfst9v56.registry.depot.dev for your org's images.
- Enable containerd layer store for Docker layers: Improves pull performance, supports lazy-pulling (e.g., eStargz images).
- Egress Rules: Configurable (IPv4/IPv6/CIDR/hostnames). Default "*" rule applies if no match. Use to restrict runner network access for security.
- Benefits for Intercal: Faster repeated builds (uv sync, pnpm install, Docker layers for worker image). Per-second billing on Depot. SSH debugging available. Parallel steps supported.
- Mechanism: Depot provides a dedicated, faster cache layer parallel to (or replacing) native GHA cache when using their runners. Entries are scoped to org/project. Eviction is oldest-first on policy.

**Recommendations for cache aim (no changes yet):**
- Target high hit rates on deps (pnpm store, uv cache, Docker layers) by using Depot runners + auto-cache.
- Monitor via Depot dashboard (cache usage, hit rates).
- Retention 14 days is standard and sufficient for most dev/CI; adjust only if specific needs (e.g., longer for rare branches).
- Combine with existing .env knobs for build optimization.
- Official: Settings UI shows exact policies; Depot docs emphasize "faster CI engine" with built-in cache/registry auth.

**GitHub Connections**: github.com/studio-jami active (org-wide).

## DigitalOcean Follow-up

Status from canon: In progress ($10k + GPU via Fin/Intercom, verification submitted, GPU doc ready). User believes proper application + referral was sent ~2 weeks ago. See prepared follow-up email below.

**Prepared email draft** (copy-paste, customize with exact dates/referral details, send to account manager from recent emails):

Subject: Follow-up on DigitalOcean Startup Application + Referral (jami.studio / Intercal project)

Hi [Account Manager Name],

Hope you're doing well. Following up on my application for the DigitalOcean Startup program submitted approximately two weeks ago.

I attached the verification documentation and referenced the referral program (via Intercom/Fin pack). The project is jami.studio (intercal.dev knowledge pipeline), which is a production-grade OSS effort with significant compute needs (Docker builds, scheduled Python/LLM ingestion jobs, GPU for evals if available).

We have GPU use-case details and affiliation proof ready (already submitted via the verification form). Could you confirm receipt and provide an update on status/credits? We're excited to get moving and would love to see those credits activated.

Thanks in advance – happy to hop on a quick call or provide any additional info.

Best,
[Your Name]
james@jami.studio (or relevant)
jami.studio / intercal.dev

(Attach any follow-up docs if needed. Reference specific referral code if known.)

## Updated Recommendations & Next Steps

- **Immediate**: Depot is now the target action runner for GH-heavy actions/CI/Docker (migration done; use .depot/ or configured runners). Monitor billing for drop from `intercal`.
- **Primary moves**:
  - Depot for all feasible GH Actions / builds / pipeline execution minutes.
  - Google Cloud Cloud Run for heavy/on-demand (as before).
  - Maximize Cloudflare $10k (R2 + Workers/D1/KV where it fits; already strong for storage).
- **MongoDB**: Active $5k target. Evaluate as Neon replacement if needed; defer to another project for now per user.
- **Protect GH**: Use Depot's 20k included GH Actions minutes + plan to guard native credits for Copilot.
- **DigitalOcean**: Send the follow-up email above to nudge.
- **Cache**: Adopt Depot auto-cache + containerd for speed. 14-day retention / no limit is the policy – aim for high deps hit rates.
- **Broader**: Cloudflare pool is solid – identify migratable pieces (storage first, then edge compute). Depot + Cloudflare + inference credits (Groq etc.) + containers (DO/Scaleway if approved) form a strong hybrid without relying on unconfirmed Google credits.

**Implementation order (updated high level)**:
1. Use Depot runners for pipeline.yml, ci.yml, deploy workflow (leverage existing migration).
2. Set up Cloud Scheduler + Cloud Run for heavy path (as before).
3. Maximize Cloudflare (R2 confirmed; audit Workers/D1 fit).
4. Evaluate Mongo vs Neon in parallel (no swap yet).
5. Send DigitalOcean email.
6. Update resource-budget.md, pipeline comments, and this report with results.

This keeps the productive pipeline running while properly allocating all active credits (Depot, Cloudflare, etc.). No code changes executed yet.

## Acceptance / Closeout
- Report updated to `_ops/planning/intercal.dev/research/2026-06-18-intercal-actions-pipeline-credits-migration-assessment.md`.
- All new info (Depot migration/connection/settings, Mongo $5k, Cloudflare $10k details, cache policies, DigitalOcean status + email draft) incorporated with citations.
- User can execute using existing artifacts and connections.
- All claims backed by cited project files, registry, and user-provided settings.

Next user action: Send DigitalOcean email or request concrete Depot workflow diffs / cache tuning.
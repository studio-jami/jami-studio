# Neon Pricing & Capabilities Analysis

## Executive Summary
We have received a $1,000 credit pool on Neon. Moving off the Free plan opens up higher compute (CU), more storage, extra branches, and access to the new Backend Beta features (Functions, Object Storage, AI Gateway).

**Recommendation:** Upgrade the organization to the **Launch plan**. The Scale plan's 2x compute cost is largely unjustified for our current development stage unless we explicitly require Private Networking or $>64$ GB RAM for massive analytical workloads.

## The Beta Features (Neon Backend)
Currently, Neon's Object Storage, Functions, and AI Gateway are in **beta and free to use** (though AI Gateway requires being on a paid plan like Launch/Scale). 

**Important Region Constraint:** The beta features are currently *only available in `us-east-2`*. 
* `hummingbird` and `intercal` are in `us-east-2` and can take advantage immediately.
* `gardens` is in `us-east-1` and cannot currently use the beta features until Neon expands region support.

### 1. Object Storage
* **What it is:** S3-compatible object storage that branches alongside your database via copy-on-write.
* **Rate Limits/Costs:** Free during beta (with abuse guardrails).
* **Advantage:** No syncing issues between prod/dev files. We use S3 heavily, so replacing some S3 buckets with Neon Storage for branch-specific file testing is highly advantageous.

### 2. Neon Functions
* **What it is:** Long-running Node.js 24 HTTP handlers deployed next to the database.
* **Rate Limits/Costs:** Free during beta.
* **Advantage:** Solves timeouts for agent/LLM-heavy workloads. The injected credentials and co-location with the DB reduce latency.

### 3. AI Gateway
* **What it is:** A Databricks-backed proxy offering a single endpoint/credential for 7 model providers (Anthropic, OpenAI, Meta, Gemini, etc.).
* **Rate Limits/Costs:** Free *usage/routing* during beta, but requires the Launch or Scale plan. No Neon markup on token costs.
* **Advantage:** Eliminates the need to juggle provider keys across environments.

## Launch vs. Scale Plan

| Feature | Launch Plan | Scale Plan |
| :--- | :--- | :--- |
| **Compute Cost** | $0.106 / CU-hour | $0.222 / CU-hour (2x) |
| **Autoscaling Max** | 16 CU (64 GB RAM) | 56 CU (224 GB RAM) |
| **Scale to Zero** | 5 mins (can disable) | Configurable (1 min to always-on) |
| **Private Networking**| No | Yes ($0.01 / GB transfer) |
| **History Window** | Up to 7 days | Up to 30 days |

### What does 56 CU (224 GB RAM) afford us?
On the Scale plan, you can provision up to 56 CUs. This is designed for:
* **Massive working sets:** Caching huge datasets entirely in memory (e.g., massive `pgvector` similarity searches without hitting disk).
* **High concurrency:** Environments handling thousands of active concurrent transactions (far beyond typical startup or development workloads).
* For `hummingbird`, `gardens`, `intercal`, or `etymalia`, 16 CU (64 GB RAM) on the Launch plan is already massive for our current usage. The 56 CU option is overkill until we have intensive, sustained production read/write throughput.

### Scale-to-Zero & Private Networking
* **Scale-to-Zero:** Both plans support it. Launch suspends after 5 minutes of inactivity (can be disabled). Scale allows customizing the timeout (from 1 min up to always-on). 
* **Private Networking:** Only on Scale. Essential if we were moving to strict VPC peering with AWS where internet ingress/egress is blocked for security/compliance. 

## Proposed Budgeting Matrix ($1,000 Credit Pool)

Assuming an upgrade to the **Launch Plan** and moving `hummingbird`, `gardens`, `intercal`, and `etymalia` to paid workloads:

* **Storage:** $0.35 / GB-month. (Current footprint is minimal, ~250MB combined).
* **Compute (Scale-to-zero active):** At $0.106 / CU-hour. If 4 databases are active 8 hours a day at an average of 1 CU (4GB RAM), that's `4 DBs * 8 hrs * 30 days * $0.106 = ~$101 / month`.
* **Extra Branches:** 10 branches included. $1.50 per branch-month beyond that.
* **Total Estimated Burn Rate:** ~$120 - $150 / month across all projects.

This burn rate gives us **6 to 8 months of runway** on the $1,000 credit, allowing us to extensively leverage and build around the free beta products (Storage, Functions, AI Gateway) without spending cash.

## Conclusion & Next Steps
1. **Upgrade to the Launch Plan:** It unlocks the AI Gateway and eliminates Free plan limits (100 CU-hours/month) at half the compute cost of the Scale plan.
2. **Leverage the Beta in `us-east-2`:** Start utilizing Object Storage and Functions on `hummingbird` and `intercal`.
3. **Monitor Beta Expansions:** Keep an eye out for `us-east-1` support for `gardens`.

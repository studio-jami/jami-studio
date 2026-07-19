# Source Sync Runbook

## Goal

Keep Jami Studio aware of upstream Agent-Native changes without allowing upstream
operational assumptions to flow into Jami `main` by accident.

## Curation Position

Source sync is **accept-first**. Upstream framework, runtime, reliability,
security, testing, documentation, and workspace capability work is presumed
valuable and should enter the isolated staging intake intact unless keeping it
would make the Jami Studio end shape materially harder to deliver.

Most differences are an adaptation, not a rejection: Jami terminology,
product-facing copy, domains, catalog ownership, and temporary compatibility
layers can be overlaid while retaining the underlying upstream behavior. Treat
the source implementation with respect; do not remove or rewrite useful work
simply because it carries an upstream semantic or name.

Use only these intake classifications, recorded in `curation-notes.md`:

- **Accepted** — bring the upstream implementation through unchanged.
- **Adapted** — retain the implementation and make the smallest necessary Jami
  identity, ownership, safety, or integration adjustment.
- **Held for explicit adoption** — keep the change out of the current intake
  only when it controls credentials, deployment, publishing, billing, release,
  or another owner-operated surface that needs a separate Jami decision.

An implementation may be held only with a concrete reason, the affected paths,
and the condition that would make it safe to adopt. A name difference or
unfinished Jami-facing copy is not by itself a reason to withhold capability.

## Flow

1. Refresh the source mirror:

   ```sh
   pnpm source-sync:refresh
   ```

2. Generate a review report:

   ```sh
   pnpm source-sync:report
   ```

3. For a GitHub-hosted run, dispatch `Source sync review`. Set `create_issue` to
   `true` only when you want the run to ping the team with an issue.

4. Review the report:

   - Protected-path changes need human handling.
   - Registry-lane changes are tracked separately because Jami expects to take
     over that surface.
   - Conflict files should be handled by domain, not mechanically.
   - Start from acceptance. For every material exception, record whether it is
     an adaptation or a hold for explicit operational adoption, and why.

5. Create the intake packet:

   ```sh
   pnpm source-sync:intake -- --create-pr
   ```

6. Run the pre-merge agent on `sync/intake/<source-sha>`.

7. Bootstrap and validate the curated intake before it can merge:

   ```sh
   # Fast, reproducible dependency linking for review and focused tests.
   pnpm install --frozen-lockfile --ignore-scripts
   git diff --check
   ```

   Run the focused test files for changed conflict and high-risk paths. Record
   the exact commands and results in the intake's `curation-notes.md`.

   Do not use a plain root `pnpm install` as a quick test bootstrap. Its
   `postinstall` deliberately builds 11 workspace packages and rebuilds
   `better-sqlite3`; that is a full workspace build lifecycle and may take
   several minutes on Windows. Run it separately when a built workspace is the
   thing being validated, and report it as such.

8. Merge accepted intake work into `sync/staging`.

9. Human-review or port curated changes from `sync/staging` into `main` or
   `preview`.

## Do Not

- Do not merge upstream directly into `main`.
- Do not reactivate inherited Builder workflows by accident.
- Do not restore Builder publishing, deploy, or dispatch automation without an
  explicit Jami decision.
- Do not treat release/version churn as automatically useful.

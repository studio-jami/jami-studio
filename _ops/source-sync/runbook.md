# Source Sync Runbook

## Goal

Keep Jami Studio aware of upstream Agent-Native changes without allowing upstream
operational assumptions to flow into Jami `main` by accident.

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

5. Create the intake packet:

   ```sh
   pnpm source-sync:intake -- --create-pr
   ```

6. Run the pre-merge agent on `sync/intake/<source-sha>`.

7. Merge accepted intake work into `sync/staging`.

8. Human-review or port curated changes from `sync/staging` into `main` or
   `preview`.

## Do Not

- Do not merge upstream directly into `main`.
- Do not reactivate inherited Builder workflows by accident.
- Do not restore Builder publishing, deploy, or dispatch automation without an
  explicit Jami decision.
- Do not treat release/version churn as automatically useful.

import { runAnalyticsEventsRetentionOnce } from "../jobs/analytics-events-retention";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_SWEEP_DELAY_MS = 5 * 60 * 1000;
let skippingLogged = false;

export default function registerAnalyticsEventsRetentionJobs(): void {
  const isProd = process.env.NODE_ENV === "production";
  const flag =
    process.env.ANALYTICS_EVENTS_RETENTION_JOBS ??
    process.env.RUN_BACKGROUND_JOBS;
  const enabled = flag === "1" || (isProd && flag !== "0");

  if (!enabled) {
    if (!skippingLogged) {
      console.log(
        "[analytics-events] Skipping retention job (set ANALYTICS_EVENTS_RETENTION_JOBS=1 or RUN_BACKGROUND_JOBS=1 to enable in dev; on by default in production)",
      );
      skippingLogged = true;
    }
    return;
  }

  const sweep = () => {
    runAnalyticsEventsRetentionOnce()
      .then((result) => {
        if (result.expiredEvents || result.expiredHttpEvents) {
          console.log("[analytics-events] Retention sweep completed", result);
        }
      })
      .catch((err) =>
        console.error("[analytics-events] retention sweep failed:", err),
      );
  };

  // One sweep shortly after boot (delayed past cold-start contention) so a
  // backlog never has to wait a full day, then daily.
  setTimeout(sweep, INITIAL_SWEEP_DELAY_MS);
  setInterval(sweep, ONE_DAY_MS);

  console.log("[analytics-events] Retention sweep scheduled daily.");
}

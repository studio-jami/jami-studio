import { and, eq, lt } from "drizzle-orm";

import { getDb, schema } from "../db/index.js";

let running = false;

function retentionDays(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function cutoffIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Bounded retention for the raw `analytics_events` ingest table.
 *
 * Any per-request event stream with no TTL eventually fills any database —
 * observed live 2026-07-13 when `http.response` server telemetry filled the
 * workspace Postgres to its storage cap in a day. Two windows:
 *
 * - `ANALYTICS_EVENTS_RETENTION_DAYS` (default 90) — every event.
 * - `ANALYTICS_HTTP_EVENTS_RETENTION_DAYS` (default 30) — the `http.response`
 *   server-request telemetry class (highest volume, lowest long-term value).
 *
 * Set a window to `0` or a negative number to disable that sweep. Deletes
 * key off `received_at` (NOT NULL, ISO-8601 text in every dialect — string
 * comparison is chronologically correct).
 */
export async function runAnalyticsEventsRetentionSweep(): Promise<{
  expiredEvents: number;
  expiredHttpEvents: number;
}> {
  const db = await getDb();
  const result = { expiredEvents: 0, expiredHttpEvents: 0 };

  const allDays = retentionDays("ANALYTICS_EVENTS_RETENTION_DAYS", 90);
  if (allDays > 0) {
    const deleted = await db
      .delete(schema.analyticsEvents)
      .where(lt(schema.analyticsEvents.receivedAt, cutoffIso(allDays)))
      .returning({ id: schema.analyticsEvents.id });
    result.expiredEvents = deleted.length;
  }

  const httpDays = retentionDays("ANALYTICS_HTTP_EVENTS_RETENTION_DAYS", 30);
  if (httpDays > 0) {
    const deleted = await db
      .delete(schema.analyticsEvents)
      .where(
        and(
          eq(schema.analyticsEvents.eventName, "http.response"),
          lt(schema.analyticsEvents.receivedAt, cutoffIso(httpDays)),
        ),
      )
      .returning({ id: schema.analyticsEvents.id });
    result.expiredHttpEvents = deleted.length;
  }

  return result;
}

/**
 * Run one analytics-events retention sweep. Exported for deployment-specific
 * scheduled functions that should not rely on a long-lived Node process.
 */
export async function runAnalyticsEventsRetentionOnce(): Promise<{
  expiredEvents: number;
  expiredHttpEvents: number;
}> {
  if (running) {
    return { expiredEvents: 0, expiredHttpEvents: 0 };
  }
  running = true;
  try {
    return await runAnalyticsEventsRetentionSweep();
  } finally {
    running = false;
  }
}

import { afterEach, describe, expect, it } from "vitest";

import {
  normalizeHttpTelemetryPath,
  shouldTrackHttpResponse,
} from "./http-response-telemetry.js";

describe("http response telemetry", () => {
  it("normalizes high-cardinality path segments before tracking", () => {
    expect(
      normalizeHttpTelemetryPath(
        "/design/_agent-native/agent-chat/runs/run-1783002639448-8rptjt/events",
      ),
    ).toBe("/design/_agent-native/agent-chat/runs/:id/events");
    expect(
      normalizeHttpTelemetryPath(
        "/api/session-replay/recordings/2f6d6628-b9fa-4c09-8cef-306928123456",
      ),
    ).toBe("/api/session-replay/recordings/:id");
  });

  describe("ingest-path exclusion", () => {
    afterEach(() => {
      delete process.env.APP_BASE_PATH;
      delete process.env.VITE_APP_BASE_PATH;
    });

    it("never tracks its own tracking-ingest endpoints", () => {
      expect(shouldTrackHttpResponse("/api/analytics/track", 202)).toBe(false);
      expect(shouldTrackHttpResponse("/track", 202)).toBe(false);
      expect(shouldTrackHttpResponse("/api/analytics/replay/x", 202)).toBe(
        false,
      );
      expect(shouldTrackHttpResponse("/some-page", 200)).toBe(true);
    });

    it("excludes ingest endpoints under a workspace mount (base path)", () => {
      // Regression: on unified workspace deployments the app sees its
      // MOUNTED path. A miss here is a self-sustaining feedback loop — each
      // ingest POST emits another http.response event that POSTs again
      // (observed live 2026-07-13: 557k rows in a day with zero users).
      process.env.APP_BASE_PATH = "/analytics";
      expect(
        shouldTrackHttpResponse("/analytics/api/analytics/track", 202),
      ).toBe(false);
      expect(shouldTrackHttpResponse("/analytics/track", 202)).toBe(false);
      expect(
        shouldTrackHttpResponse("/analytics/api/analytics/replay/x", 202),
      ).toBe(false);
      expect(shouldTrackHttpResponse("/analytics/dashboard", 200)).toBe(true);
    });
  });
});

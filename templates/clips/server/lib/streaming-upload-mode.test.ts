import { afterEach, describe, expect, it, vi } from "vitest";

// streaming-upload-mode pulls video-storage (SQL-scratch policy), which
// imports core server/file-upload modules that don't load in this suite's
// node environment — mock them like video-storage.spec.ts does.
vi.mock("@agent-native/core/file-upload", () => ({
  listFileUploadProviders: () => [],
}));

vi.mock("@agent-native/core/server", () => ({
  resolveHasBuilderPrivateKey: async () => false,
  runWithRequestContext: async (
    _context: unknown,
    fn: () => Promise<unknown>,
  ) => fn(),
}));

import {
  isStreamingUploadDisabled,
  shouldEnableStreamingUpload,
} from "./streaming-upload-mode";

const originalDisable = process.env.CLIPS_DISABLE_STREAMING_UPLOAD;
const originalEnable = process.env.CLIPS_ENABLE_STREAMING_UPLOAD;
const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDisable === undefined) {
    delete process.env.CLIPS_DISABLE_STREAMING_UPLOAD;
  } else {
    process.env.CLIPS_DISABLE_STREAMING_UPLOAD = originalDisable;
  }
  if (originalEnable === undefined) {
    delete process.env.CLIPS_ENABLE_STREAMING_UPLOAD;
  } else {
    process.env.CLIPS_ENABLE_STREAMING_UPLOAD = originalEnable;
  }
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe("streaming upload mode", () => {
  it("keeps requested video streaming disabled by default on SQL-scratch-capable deployments", () => {
    delete process.env.CLIPS_DISABLE_STREAMING_UPLOAD;
    delete process.env.CLIPS_ENABLE_STREAMING_UPLOAD;
    delete process.env.DATABASE_URL;

    expect(
      shouldEnableStreamingUpload({
        client: "desktop-native",
        mimeType: "video/mp4",
      }),
    ).toBe(false);
    expect(
      shouldEnableStreamingUpload({
        client: undefined,
        mimeType: "video/webm",
      }),
    ).toBe(false);
    expect(shouldEnableStreamingUpload({ mimeType: undefined })).toBe(false);
  });

  it("auto-enables streaming when SQL chunk scratch is unavailable (remote database)", () => {
    delete process.env.CLIPS_DISABLE_STREAMING_UPLOAD;
    delete process.env.CLIPS_ENABLE_STREAMING_UPLOAD;
    process.env.DATABASE_URL = "postgres://user:pass@db.example.com/app";

    expect(shouldEnableStreamingUpload({ mimeType: "video/webm" })).toBe(true);
    expect(shouldEnableStreamingUpload({ mimeType: "audio/webm" })).toBe(false);

    // The kill switch still wins everywhere.
    process.env.CLIPS_DISABLE_STREAMING_UPLOAD = "1";
    expect(shouldEnableStreamingUpload({ mimeType: "video/webm" })).toBe(false);
  });

  it("honors explicit enable and disable flags", () => {
    process.env.CLIPS_ENABLE_STREAMING_UPLOAD = "true";
    delete process.env.CLIPS_DISABLE_STREAMING_UPLOAD;
    delete process.env.DATABASE_URL;
    expect(shouldEnableStreamingUpload({ mimeType: "video/webm" })).toBe(true);
    expect(shouldEnableStreamingUpload({ mimeType: "audio/webm" })).toBe(false);

    process.env.CLIPS_DISABLE_STREAMING_UPLOAD = "true";
    expect(isStreamingUploadDisabled()).toBe(true);
    expect(
      shouldEnableStreamingUpload({
        client: "desktop-native",
        mimeType: "video/mp4",
      }),
    ).toBe(false);
  });
});

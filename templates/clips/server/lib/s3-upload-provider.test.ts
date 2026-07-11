import { beforeEach, describe, expect, it, vi } from "vitest";

const mockResolveSecret = vi.fn();

vi.mock("@agent-native/core/server", () => ({
  resolveSecret: (...args: any[]) => mockResolveSecret(...args),
}));

import {
  deleteS3ObjectByUrl,
  s3FileUploadProvider,
} from "./s3-upload-provider.js";

describe("s3FileUploadProvider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
    for (const key of [
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_ENDPOINT",
      "S3_REGION",
      "S3_PUBLIC_BASE_URL",
      "R2_BUCKET",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_ENDPOINT",
      "R2_REGION",
      "R2_PUBLIC_BASE_URL",
    ]) {
      delete process.env[key];
    }
  });

  it("reports configured from request-scoped DB secrets", async () => {
    const values: Record<string, string> = {
      S3_BUCKET: "clips",
      S3_ACCESS_KEY_ID: "access",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_ENDPOINT: "https://s3.example.com",
    };
    mockResolveSecret.mockImplementation(async (key: string) => {
      return values[key] ?? null;
    });

    expect(s3FileUploadProvider.isConfigured()).toBe(false);
    await expect(s3FileUploadProvider.isConfiguredForRequest?.()).resolves.toBe(
      true,
    );
  });

  it("keeps sync env configuration as a legacy runtime signal", () => {
    process.env.S3_BUCKET = "clips";
    process.env.S3_ACCESS_KEY_ID = "access";
    process.env.S3_SECRET_ACCESS_KEY = "secret";
    process.env.S3_ENDPOINT = "https://s3.example.com";

    expect(s3FileUploadProvider.isConfigured()).toBe(true);
  });

  it("deletes objects that match the configured public base URL", async () => {
    const values: Record<string, string> = {
      S3_BUCKET: "clips-bucket",
      S3_ACCESS_KEY_ID: "access",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_ENDPOINT: "https://s3.example.com",
      S3_REGION: "us-east-1",
      S3_PUBLIC_BASE_URL: "https://cdn.example.com/media",
    };
    mockResolveSecret.mockImplementation(async (key: string) => {
      return values[key] ?? null;
    });
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteS3ObjectByUrl(
        "https://cdn.example.com/media/clips/123-thumb.jpg?cacheBust=1",
      ),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://s3.example.com/clips-bucket/clips/123-thumb.jpg",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("AWS4-HMAC-SHA256"),
        }),
      }),
    );
  });

  it("skips URLs that do not belong to the configured S3 bucket", async () => {
    const values: Record<string, string> = {
      S3_BUCKET: "clips-bucket",
      S3_ACCESS_KEY_ID: "access",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_ENDPOINT: "https://s3.example.com",
    };
    mockResolveSecret.mockImplementation(async (key: string) => {
      return values[key] ?? null;
    });
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteS3ObjectByUrl("https://loom.com/share/not-owned"),
    ).resolves.toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("resumable multipart uploads", () => {
    const values: Record<string, string> = {
      S3_BUCKET: "clips-bucket",
      S3_ACCESS_KEY_ID: "access",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_ENDPOINT: "https://s3.example.com",
      S3_REGION: "auto",
      S3_PUBLIC_BASE_URL: "https://cdn.example.com/media",
    };

    beforeEach(() => {
      mockResolveSecret.mockImplementation(async (key: string) => {
        return values[key] ?? null;
      });
    });

    it("advertises the 5 MiB S3 multipart part size", () => {
      expect(s3FileUploadProvider.resumable?.preferredChunkBytes).toBe(
        5 * 1024 * 1024,
      );
    });

    it("startSession creates a multipart upload and returns the UploadId", async () => {
      const fetchMock = vi.fn(
        async () =>
          new Response(
            `<InitiateMultipartUploadResult><UploadId>upload-123</UploadId></InitiateMultipartUploadResult>`,
            { status: 200 },
          ),
      );
      vi.stubGlobal("fetch", fetchMock);

      const session = await s3FileUploadProvider.resumable!.startSession(
        "rec-1.webm",
        "video/webm",
        100,
      );

      expect(session.sessionId).toBe("upload-123");
      expect(session.meta.uploadId).toBe("upload-123");
      expect(String(session.meta.key)).toMatch(/^clips\/\d+-\w+\.webm$/);
      expect(session.meta.parts).toEqual([]);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toContain("?uploads=");
      expect(init.method).toBe("POST");
    });

    it("relayChunk uploads one part per chunk and accumulates ETags in meta", async () => {
      const fetchMock = vi.fn(
        async () =>
          new Response(null, {
            status: 200,
            headers: { etag: '"etag-1"' },
          }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await s3FileUploadProvider.resumable!.relayChunk(
        {
          sessionId: "upload-123",
          meta: { key: "clips/1-a.webm", uploadId: "upload-123", parts: [] },
        },
        "bytes 0-4/*",
        new Uint8Array([1, 2, 3, 4, 5]),
      );

      expect(result.ok).toBe(true);
      expect(result.updatedMeta?.parts).toEqual([
        { partNumber: 1, etag: '"etag-1"' },
      ]);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toContain("partNumber=1");
      expect(url).toContain("uploadId=upload-123");
      expect(init.method).toBe("PUT");
    });

    it("relayChunk treats the close sentinel as a no-op", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await s3FileUploadProvider.resumable!.relayChunk(
        {
          sessionId: "upload-123",
          meta: { key: "clips/1-a.webm", uploadId: "upload-123", parts: [] },
        },
        "bytes */10",
        new Uint8Array(0),
      );

      expect(result.ok).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("completeSession completes the multipart upload and returns the public URL", async () => {
      const fetchMock = vi.fn(
        async () =>
          new Response(
            `<CompleteMultipartUploadResult><Location>x</Location></CompleteMultipartUploadResult>`,
            { status: 200 },
          ),
      );
      vi.stubGlobal("fetch", fetchMock);

      const url = await s3FileUploadProvider.resumable!.completeSession(
        {
          sessionId: "upload-123",
          meta: {
            key: "clips/1-a.webm",
            uploadId: "upload-123",
            parts: [
              { partNumber: 1, etag: '"etag-1"' },
              { partNumber: 2, etag: '"etag-2"' },
            ],
          },
        },
        "rec-1.webm",
      );

      expect(url).toBe("https://cdn.example.com/media/clips/1-a.webm");
      const [reqUrl, init] = fetchMock.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(reqUrl).toContain("uploadId=upload-123");
      expect(init.method).toBe("POST");
      const body = new TextDecoder().decode(init.body as ArrayBuffer);
      expect(body).toContain("<PartNumber>1</PartNumber>");
      expect(body).toContain("<ETag>&quot;etag-1&quot;</ETag>".replace(/&quot;/g, '"'));
      expect(body).toContain("<PartNumber>2</PartNumber>");
    });

    it("completeSession rejects a 200 response that carries an S3 <Error> body", async () => {
      const fetchMock = vi.fn(
        async () =>
          new Response(`<Error><Code>InternalError</Code></Error>`, {
            status: 200,
          }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        s3FileUploadProvider.resumable!.completeSession(
          {
            sessionId: "upload-123",
            meta: {
              key: "clips/1-a.webm",
              uploadId: "upload-123",
              parts: [{ partNumber: 1, etag: '"etag-1"' }],
            },
          },
          "rec-1.webm",
        ),
      ).rejects.toThrow(/CompleteMultipartUpload failed/);
    });

    it("relayChunk surfaces provider failures as non-ok results", async () => {
      const fetchMock = vi.fn(
        async () => new Response("denied", { status: 403 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await s3FileUploadProvider.resumable!.relayChunk(
        {
          sessionId: "upload-123",
          meta: { key: "clips/1-a.webm", uploadId: "upload-123", parts: [] },
        },
        "bytes 0-4/*",
        new Uint8Array([1, 2, 3, 4, 5]),
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(403);
    });
  });
});

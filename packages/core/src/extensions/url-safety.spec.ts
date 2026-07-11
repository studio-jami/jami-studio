import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isBlockedExtensionUrl,
  isBlockedExtensionUrlWithDns,
  isTrustedInternalUrl,
  ssrfSafeFetch,
  trustedInternalOrigins,
} from "./url-safety.js";

describe("isBlockedExtensionUrl", () => {
  it.each([
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://172.31.255.255/",
    "http://192.168.1.1/",
    "http://169.254.169.254/",
    "http://100.64.0.1/",
    "http://192.0.2.1/",
    "http://198.18.0.1/",
    "http://198.51.100.1/",
    "http://203.0.113.1/",
    "http://224.0.0.1/",
    "http://[::1]/",
    "http://[fc00::1]/",
    "http://[fe80::1]/",
    "http://[ff00::1]/",
    "http://[::ffff:7f00:1]/",
    "http://metadata.google.internal/",
  ])("blocks non-public target %s", (url) => {
    expect(isBlockedExtensionUrl(url)).toBe(true);
  });

  it("allows ordinary public HTTP origins", () => {
    expect(isBlockedExtensionUrl("https://93.184.216.34/api")).toBe(false);
    expect(isBlockedExtensionUrl("https://example.com/api")).toBe(false);
  });
});

describe("isBlockedExtensionUrlWithDns (DNS rebinding guard)", () => {
  it("blocks a public hostname that resolves to a private IP", async () => {
    // Mock node:dns/promises so this test doesn't hit the network.
    vi.doMock("node:dns/promises", () => ({
      lookup: async () => [{ address: "169.254.169.254", family: 4 }],
    }));
    vi.resetModules();
    const mod = await import("./url-safety.js");
    expect(
      await mod.isBlockedExtensionUrlWithDns("https://attacker.example.com/"),
    ).toBe(true);
    vi.doUnmock("node:dns/promises");
    vi.resetModules();
  });

  it("blocks even when one of multiple resolved IPs is private", async () => {
    vi.doMock("node:dns/promises", () => ({
      lookup: async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ],
    }));
    vi.resetModules();
    const mod = await import("./url-safety.js");
    expect(await mod.isBlockedExtensionUrlWithDns("https://example.com/")).toBe(
      true,
    );
    vi.doUnmock("node:dns/promises");
    vi.resetModules();
  });

  it("allows a hostname that resolves to a public IP", async () => {
    vi.doMock("node:dns/promises", () => ({
      lookup: async () => [{ address: "93.184.216.34", family: 4 }],
    }));
    vi.resetModules();
    const mod = await import("./url-safety.js");
    expect(await mod.isBlockedExtensionUrlWithDns("https://example.com/")).toBe(
      false,
    );
    vi.doUnmock("node:dns/promises");
    vi.resetModules();
  });
});

describe("ssrfSafeFetch httpsOnly", () => {
  // Public IP literals skip the DNS lookup, so these tests stay offline.
  const httpsOrigin = "https://93.184.216.34/image.png";
  const httpOrigin = "http://93.184.216.34/image.png";

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a non-HTTPS initial URL before any request is sent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      ssrfSafeFetch(httpOrigin, {}, { httpsOnly: true }),
    ).rejects.toThrow(/SSRF blocked: refusing to fetch non-HTTPS/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an HTTPS→HTTP redirect downgrade before following it", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, { status: 302, headers: { location: httpOrigin } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      ssrfSafeFetch(httpsOrigin, {}, { httpsOnly: true }),
    ).rejects.toThrow(/SSRF blocked: refusing to fetch non-HTTPS/);
    // Only the initial HTTPS request went out; the HTTP hop was never fetched.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(httpsOrigin);
  });

  it("still follows HTTP redirects when httpsOnly is not set", async () => {
    const redirectResponse = new Response("moved", {
      status: 302,
      headers: { location: httpOrigin },
    });
    const fetchMock = vi.fn(async (url: string) =>
      url === httpsOrigin
        ? redirectResponse
        : new Response("ok", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await ssrfSafeFetch(httpsOrigin);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The followed hop's body must be drained so its connection is released.
    expect(redirectResponse.bodyUsed).toBe(true);
  });
});

// The deployment's OWN configured origins (APP_URL, gateway URL, workspace app
// manifest URLs) are operator config, not user input — a fetch to them is a
// self-call. Without this allowance every workspace-internal A2A call
// (call-agent to a sibling app) was SSRF-blocked in local dev and self-hosted
// private networks, where the deployment origin is loopback/RFC-1918.
describe("ssrfSafeFetch trusted internal origins (workspace self-calls)", () => {
  const ENV_KEYS = [
    "APP_URL",
    "BETTER_AUTH_URL",
    "WEBHOOK_BASE_URL",
    "WORKSPACE_GATEWAY_URL",
    "AGENT_NATIVE_WORKSPACE_APPS_JSON",
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    vi.unstubAllGlobals();
  });

  it("collects origins from APP_URL and the workspace app manifest", () => {
    process.env.APP_URL = "http://127.0.0.1:8787";
    process.env.AGENT_NATIVE_WORKSPACE_APPS_JSON = JSON.stringify([
      { id: "forms", url: "http://127.0.0.1:8787/forms" },
      { id: "broken", url: "not a url" },
    ]);
    expect(trustedInternalOrigins()).toEqual(
      new Set(["http://127.0.0.1:8787"]),
    );
    expect(
      isTrustedInternalUrl("http://127.0.0.1:8787/forms/_agent-native/a2a"),
    ).toBe(true);
    // Same host, different port = different origin — NOT trusted.
    expect(isTrustedInternalUrl("http://127.0.0.1:9999/")).toBe(false);
  });

  it("allows a fetch to a configured loopback origin (workspace A2A self-call)", async () => {
    process.env.APP_URL = "http://127.0.0.1:8787";
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await ssrfSafeFetch(
      "http://127.0.0.1:8787/forms/_agent-native/a2a",
    );
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still blocks private addresses that are NOT configured origins", async () => {
    process.env.APP_URL = "http://127.0.0.1:8787";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(ssrfSafeFetch("http://192.168.1.1/steal")).rejects.toThrow(
      /SSRF blocked: refusing to fetch private\/internal address/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("re-validates redirect hops — a trusted origin cannot 30x into the private network", async () => {
    process.env.APP_URL = "http://127.0.0.1:8787";
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "http://169.254.169.254/latest/meta-data" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(ssrfSafeFetch("http://127.0.0.1:8787/forms")).rejects.toThrow(
      /SSRF blocked: refusing to fetch private\/internal address/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("blocks loopback with no configured internal origins (default posture unchanged)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(ssrfSafeFetch("http://127.0.0.1:8787/")).rejects.toThrow(
      /SSRF blocked: refusing to fetch private\/internal address/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

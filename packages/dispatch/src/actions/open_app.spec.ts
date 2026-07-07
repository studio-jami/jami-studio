import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listGrantedDispatchMcpAppOrigins: vi.fn(),
  openGrantedDispatchMcpApp: vi.fn(),
}));

vi.mock("../server/lib/mcp-gateway.js", () => ({
  listGrantedDispatchMcpAppOrigins: mocks.listGrantedDispatchMcpAppOrigins,
  openGrantedDispatchMcpApp: mocks.openGrantedDispatchMcpApp,
}));

import openAppAction from "./open_app.js";

describe("open_app MCP App metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses exact granted app origins instead of broad HTTPS CSP", async () => {
    mocks.listGrantedDispatchMcpAppOrigins.mockResolvedValue([
      "https://dispatch.jami.studio",
      "https://mail.jami.studio",
      "https://calendar.jami.studio",
    ]);

    const cspBuilder = openAppAction.mcpApp?.resource.csp;
    expect(typeof cspBuilder).toBe("function");

    const csp = await (cspBuilder as any)({
      actionName: "open_app",
      appId: "dispatch",
      requestOrigin: "https://dispatch.jami.studio",
    });

    expect(csp.connectDomains).toEqual([
      "https://esm.sh",
      "$requestOrigin",
      "https://mail.jami.studio",
      "https://calendar.jami.studio",
      "http://localhost:*",
      "http://127.0.0.1:*",
    ]);
    expect(csp.resourceDomains).toEqual(csp.connectDomains);
    expect(csp.frameDomains).toEqual([
      "$requestOrigin",
      "https://mail.jami.studio",
      "https://calendar.jami.studio",
      "http://localhost:*",
      "http://127.0.0.1:*",
    ]);
    expect(csp.baseUriDomains).toEqual(csp.frameDomains);
    expect(JSON.stringify(csp)).not.toContain('"https:"');
  });

  it("keeps exact granted origins when request origin is unavailable", async () => {
    mocks.listGrantedDispatchMcpAppOrigins.mockResolvedValue([
      "https://mail.jami.studio",
      "https://calendar.jami.studio",
    ]);

    const cspBuilder = openAppAction.mcpApp?.resource.csp;
    const csp = await (cspBuilder as any)({
      actionName: "open_app",
      appId: "dispatch",
    });

    expect(csp.frameDomains).toEqual([
      "$requestOrigin",
      "https://mail.jami.studio",
      "https://calendar.jami.studio",
      "http://localhost:*",
      "http://127.0.0.1:*",
    ]);
  });

  it("promotes embed and chrome from params for hosts that nest open options", async () => {
    mocks.openGrantedDispatchMcpApp.mockResolvedValue({
      app: "mail",
      view: "inbox",
      url: "https://mail.jami.studio/inbox",
      embed: true,
      chrome: "minimal",
      embedStartUrl:
        "https://mail.jami.studio/_agent-native/embed/start?ticket=test",
    });

    await openAppAction.run({
      app: "mail",
      view: "inbox",
      params: {
        embed: true,
        chrome: "minimal",
        threadId: "abc",
      },
    });

    expect(mocks.openGrantedDispatchMcpApp).toHaveBeenCalledWith({
      app: "mail",
      view: "inbox",
      params: { threadId: "abc" },
      embed: true,
      chrome: "minimal",
    });
  });
});

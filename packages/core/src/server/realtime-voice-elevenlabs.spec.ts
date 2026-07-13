import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("h3", () => ({
  defineEventHandler: (handler: any) => handler,
  getHeader: (event: any, name: string) =>
    event.headers?.[name] ?? event.headers?.[name.toLowerCase()],
  getMethod: (event: any) => event.method ?? "GET",
  readRawBody: async (event: any) =>
    event.rawBody == null ? event.rawBody : new Uint8Array(event.rawBody),
  setResponseHeader: (event: any, name: string, value: string) => {
    (event.responseHeaders ??= {})[name] = value;
  },
  setResponseStatus: (event: any, status: number) => {
    event.statusCode = status;
  },
}));

const getSession = vi.hoisted(() => vi.fn());
vi.mock("./auth.js", () => ({
  getSession: (...args: unknown[]) => getSession(...args),
}));

const resolveSecret = vi.hoisted(() => vi.fn());
vi.mock("./credential-provider.js", () => ({
  resolveSecret: (...args: unknown[]) => resolveSecret(...args),
  resolveBuilderCredentials: async () => ({}),
  getBuilderGatewayBaseUrl: () => "https://gateway.invalid",
}));

vi.mock("../agent/engine/builder-gateway-headers.js", () => ({
  getBuilderGatewayRequestHeaders: () => ({}),
}));

const runWithRequestContext = vi.hoisted(() =>
  vi.fn(async (_ctx: unknown, fn: () => unknown) => await fn()),
);
vi.mock("./request-context.js", () => ({
  runWithRequestContext: (...args: [unknown, () => unknown]) =>
    runWithRequestContext(...args),
}));

vi.mock("./framework-request-handler.js", () => ({
  getH3App: (nitroApp: any) => nitroApp.h3,
}));

vi.mock("./request-origin.js", () => ({
  isSameOriginRequest: (event: any) => event.sameOrigin !== false,
}));

const actionsToEngineTools = vi.hoisted(() => vi.fn());
vi.mock("../agent/production-agent.js", () => ({
  actionsToEngineTools: (...args: unknown[]) => actionsToEngineTools(...args),
}));

import type { ActionEntry } from "../agent/production-agent.js";
import {
  buildElevenLabsAgentPayload,
  ELEVENLABS_DEFAULT_TOOL_ALLOW_LIST,
  ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
  ELEVENLABS_REALTIME_VOICE_TOOL_PATH,
  elevenLabsClientToolFromRealtimeTool,
  mountElevenLabsRealtimeVoiceRoutes,
} from "./realtime-voice-elevenlabs.js";
import { REALTIME_VOICE_CAPABILITY_HEADER } from "./realtime-voice.js";

type Handler = (event: any) => Promise<any>;

function fakeEvent(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" } as Record<string, string>,
    responseHeaders: {} as Record<string, string>,
    statusCode: 200,
    sameOrigin: true,
    ...overrides,
  };
}

function fakeNitro() {
  const routes = new Map<string, Handler>();
  return {
    nitroApp: {
      h3: {
        use: (path: string, handler: Handler) => {
          routes.set(path, handler);
        },
      },
    },
    routes,
  };
}

const ENGINE_TOOLS = [
  {
    name: "navigate",
    description: "Navigate the app",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Route path" } },
      required: ["path"],
    },
  },
  {
    name: "view-screen",
    description: "Describe the visible screen",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "delete-everything",
    description: "Not on the allow-list",
    inputSchema: { type: "object", properties: {} },
  },
];

function mountWithDefaults(options: Record<string, unknown> = {}) {
  const { nitroApp, routes } = fakeNitro();
  const executeTool = vi.fn();
  mountElevenLabsRealtimeVoiceRoutes(
    nitroApp,
    {} as Record<string, ActionEntry>,
    {
      executeTool,
      ...options,
    } as any,
  );
  return { routes, executeTool };
}

beforeEach(() => {
  vi.restoreAllMocks();
  actionsToEngineTools.mockReturnValue(ENGINE_TOOLS);
  getSession.mockResolvedValue({ email: "owner@example.com", orgId: "org-1" });
  resolveSecret.mockImplementation(async (key: string) => {
    if (key === "ELEVENLABS_API_KEY") return "el-test-key";
    if (key === "ELEVENLABS_AGENT_ID") return "agent_abc123";
    return undefined;
  });
});

describe("elevenLabsClientToolFromRealtimeTool", () => {
  it("converts an object schema into an ElevenLabs client tool", () => {
    const clientTool = elevenLabsClientToolFromRealtimeTool({
      type: "function",
      name: "navigate",
      description: "Navigate",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Route", enum: ["/a", "/b"] },
          count: { type: "integer" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["path", "missing-not-declared"],
      },
    });
    expect(clientTool).toMatchObject({
      type: "client",
      name: "navigate",
      expects_response: true,
      parameters: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string", enum: ["/a", "/b"] },
          count: { type: "integer" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    });
  });

  it("drops tools whose schemas use unsupported constructs", () => {
    expect(
      elevenLabsClientToolFromRealtimeTool({
        type: "function",
        name: "union-tool",
        description: "",
        parameters: {
          type: "object",
          properties: { value: { oneOf: [{ type: "string" }] } },
        },
      }),
    ).toBeNull();
  });
});

describe("buildElevenLabsAgentPayload", () => {
  it("builds config-as-code payload with prompt, llm, and client tools", () => {
    const payload = buildElevenLabsAgentPayload({
      name: "Jami Voice",
      instructions: "Speak briefly.",
      llm: "gemini-2.5-flash",
      language: "en",
      voiceId: "mWqiTfcp72MprLxlUR8h",
      clientTools: [{ type: "client", name: "navigate" }],
    }) as any;
    expect(payload.name).toBe("Jami Voice");
    expect(payload.conversation_config.agent.prompt.llm).toBe(
      "gemini-2.5-flash",
    );
    expect(payload.conversation_config.tts.voice_id).toBe(
      "mWqiTfcp72MprLxlUR8h",
    );
    expect(payload.platform_settings.auth.enable_auth).toBe(true);
  });

  it("omits tts override for non-ElevenLabs-shaped voice ids", () => {
    const payload = buildElevenLabsAgentPayload({
      name: "Jami Voice",
      instructions: "x",
      llm: "gemini-2.5-flash",
      language: "en",
      voiceId: "a0337b67-0000-0000-0000-b3fb78cdda35",
      clientTools: [],
    }) as any;
    expect(payload.conversation_config.tts).toBeUndefined();
  });
});

describe("mountElevenLabsRealtimeVoiceRoutes", () => {
  it("registers both routes and enforces the default allow-list", () => {
    const { routes } = mountWithDefaults();
    expect([...routes.keys()]).toEqual([
      ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
      ELEVENLABS_REALTIME_VOICE_TOOL_PATH,
    ]);
    expect(ELEVENLABS_DEFAULT_TOOL_ALLOW_LIST).not.toContain("tool-search");
  });

  it("mints a session: config push, token, capability header, tool names", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input: any) => {
        const url = String(input);
        if (url.includes("/v1/convai/agents/agent_abc123")) {
          return new Response("{}", { status: 200 });
        }
        if (url.includes("/v1/convai/conversation/token")) {
          return new Response(JSON.stringify({ token: "el-token" }), {
            status: 200,
          });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      });

    const { routes } = mountWithDefaults();
    const handler = routes.get(ELEVENLABS_REALTIME_VOICE_SESSION_PATH)!;
    const event = fakeEvent();
    const body = await handler(event);

    expect(body).toMatchObject({
      token: "el-token",
      agentId: "agent_abc123",
    });
    expect(body.toolNames).toEqual(["navigate", "view-screen"]);
    expect(event.responseHeaders[REALTIME_VOICE_CAPABILITY_HEADER]).toMatch(
      /^[a-f0-9]{32}$/,
    );

    const patchCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes("/v1/convai/agents/agent_abc123"),
    );
    expect(patchCall?.[1]?.method).toBe("PATCH");
    const pushed = JSON.parse(String(patchCall?.[1]?.body));
    expect(
      pushed.conversation_config.agent.prompt.tools.map((t: any) => t.name),
    ).toEqual(["navigate", "view-screen"]);
    // Second mint with unchanged config skips the PATCH (config-hash guard).
    fetchMock.mockClear();
    await handler(fakeEvent());
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).includes("/v1/convai/agents/agent_abc123"),
      ),
    ).toHaveLength(0);
  });

  it("409s with setup guidance when no ElevenLabs key is configured", async () => {
    resolveSecret.mockResolvedValue(undefined);
    const { routes } = mountWithDefaults();
    const handler = routes.get(ELEVENLABS_REALTIME_VOICE_SESSION_PATH)!;
    const event = fakeEvent();
    const body = await handler(event);
    expect(event.statusCode).toBe(409);
    expect(body.code).toBe("realtime_voice_setup_required");
  });

  it("rejects unauthenticated and cross-origin requests", async () => {
    const { routes } = mountWithDefaults();
    const handler = routes.get(ELEVENLABS_REALTIME_VOICE_SESSION_PATH)!;

    const crossOrigin = fakeEvent({ sameOrigin: false });
    await handler(crossOrigin);
    expect(crossOrigin.statusCode).toBe(403);

    getSession.mockResolvedValue(null);
    const anonymous = fakeEvent();
    await handler(anonymous);
    expect(anonymous.statusCode).toBe(401);
  });

  it("propagates ElevenLabs config-push failures as 502 without key leakage", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("bad el-test-key things", { status: 422 }),
    );
    const { routes } = mountWithDefaults();
    const handler = routes.get(ELEVENLABS_REALTIME_VOICE_SESSION_PATH)!;
    const event = fakeEvent();
    const body = await handler(event);
    expect(event.statusCode).toBe(502);
    expect(body.error).toContain("[REDACTED]");
    expect(body.error).not.toContain("el-test-key");
  });
});

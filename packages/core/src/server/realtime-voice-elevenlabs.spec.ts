import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("h3", () => ({
  defineEventHandler: (handler: any) => handler,
  getHeader: (event: any, name: string) =>
    event.headers?.[name] ?? event.headers?.[name.toLowerCase()],
  getMethod: (event: any) => event.method ?? "GET",
  readBody: async (event: any) => event.body,
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

const runWithRequestContext = vi.hoisted(() =>
  vi.fn(async (_ctx: unknown, fn: () => unknown) => await fn()),
);
vi.mock("./request-context.js", () => ({
  runWithRequestContext: (...args: [unknown, () => unknown]) =>
    runWithRequestContext(...args),
}));

vi.mock("./request-origin.js", () => ({
  isSameOriginRequest: (event: any) => event.sameOrigin !== false,
}));

import {
  buildElevenLabsSystemBlock,
  buildElevenLabsVoicePayload,
  composeElevenLabsPrompt,
  ELEVENLABS_REALTIME_VOICE_INTENT_PATH,
  ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
  mountElevenLabsRealtimeVoiceRoutes,
  stripElevenLabsSystemBlock,
} from "./realtime-voice-elevenlabs.js";

type Handler = (event: any) => Promise<any>;

function fakeEvent(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    responseHeaders: {},
    statusCode: 200,
    sameOrigin: true,
    ...overrides,
  };
}

function mount(
  executeIntent = vi.fn(async () => ({ status: "completed", output: "Done" })),
) {
  const routes = new Map<string, Handler>();
  mountElevenLabsRealtimeVoiceRoutes(
    {
      h3App: {
        use: (path: string, handler: Handler) => routes.set(path, handler),
      },
    },
    { executeTool: vi.fn(), executeIntent } as any,
  );
  return { routes, executeIntent };
}

beforeEach(() => {
  vi.restoreAllMocks();
  getSession.mockResolvedValue({ email: "owner@example.com", orgId: "org-1" });
});

describe("ElevenLabs workspace voice broker", () => {
  it("pushes only ElevenLabs system tools, never workspace tools", () => {
    const payload = buildElevenLabsVoicePayload({ prompt: "persona" }) as any;
    const tools = payload.conversation_config.agent.prompt.tools;
    expect(tools.map((tool: { name: string }) => tool.name)).toEqual([
      "end_call",
      "skip_turn",
      "language_detection",
    ]);
    expect(tools.some((tool: { type: string }) => tool.type === "client")).toBe(
      false,
    );
  });

  it("preserves dashboard personality while enforcing workspace ownership", () => {
    const composed = composeElevenLabsPrompt(
      "You are Megan, upbeat.",
      buildElevenLabsSystemBlock("Current app: mail"),
    );
    expect(composed).toContain("You are Megan, upbeat.");
    expect(composed).toContain("You have no workspace tools.");
    expect(composed).toContain("delegate over A2A");
    expect(stripElevenLabsSystemBlock(composed).trim()).toBe(
      "You are Megan, upbeat.",
    );
  });

  it("mounts a session mint and authenticated intent route, not a tool route", () => {
    const { routes } = mount();
    expect([...routes.keys()]).toEqual([
      ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
      ELEVENLABS_REALTIME_VOICE_INTENT_PATH,
    ]);
    expect([...routes.keys()].some((path) => path.endsWith("/tool"))).toBe(
      false,
    );
  });

  it("passes a completed utterance through the authenticated broker", async () => {
    const { routes, executeIntent } = mount();
    const result = await routes.get(ELEVENLABS_REALTIME_VOICE_INTENT_PATH)!(
      fakeEvent({
        body: { utterance: "Open my calendar", sessionId: "conv-1" },
        headers: { "x-agent-native-browser-tab": "tab-1" },
      }),
    );
    expect(executeIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        utterance: "Open my calendar",
        userEmail: "owner@example.com",
        orgId: "org-1",
        sessionId: "conv-1",
        browserTabId: "tab-1",
      }),
    );
    expect(result).toEqual({ status: "completed", output: "Done" });
  });

  it("rejects cross-origin or empty intent requests", async () => {
    const { routes, executeIntent } = mount();
    const handler = routes.get(ELEVENLABS_REALTIME_VOICE_INTENT_PATH)!;
    const crossOrigin = fakeEvent({
      sameOrigin: false,
      body: { utterance: "x" },
    });
    await expect(handler(crossOrigin)).resolves.toEqual({
      error: "Cross-origin request rejected",
    });
    expect(crossOrigin.statusCode).toBe(403);

    const empty = fakeEvent({ body: {} });
    await expect(handler(empty)).resolves.toEqual({
      error: "A completed spoken utterance is required.",
    });
    expect(empty.statusCode).toBe(400);
    expect(executeIntent).not.toHaveBeenCalled();
  });
});

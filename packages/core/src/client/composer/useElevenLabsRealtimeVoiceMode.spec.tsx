// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  pickActiveRealtimeVoiceEngine,
  resolveRealtimeVoiceEngineName,
} from "./RealtimeVoiceEngineProvider.js";
import {
  buildElevenLabsClientTools,
  createElevenLabsToolCallId,
  formatElevenLabsToolResultForModel,
  normalizeElevenLabsToolParameters,
  parseElevenLabsRealtimeVoiceSession,
  useElevenLabsRealtimeVoiceModeController,
  type ElevenLabsRealtimeVoiceToolResult,
} from "./useElevenLabsRealtimeVoiceMode.js";
import type { RealtimeVoiceModeApi } from "./useRealtimeVoiceMode.js";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("parseElevenLabsRealtimeVoiceSession", () => {
  it("parses a mint response and keeps the capability", () => {
    const session = parseElevenLabsRealtimeVoiceSession(
      {
        token: "conv-token",
        agentId: "agent_123",
        toolNames: ["navigate", "call-agent", 7, ""],
      },
      "cap-token",
    );
    expect(session).toEqual({
      token: "conv-token",
      agentId: "agent_123",
      toolNames: ["navigate", "call-agent"],
      capability: "cap-token",
    });
  });

  it("omits the capability when the header is absent", () => {
    const session = parseElevenLabsRealtimeVoiceSession(
      { token: "t", agentId: "a", toolNames: [] },
      null,
    );
    expect("capability" in session).toBe(false);
  });

  it("rejects a response without a conversation token", () => {
    expect(() =>
      parseElevenLabsRealtimeVoiceSession({ agentId: "a" }, null),
    ).toThrowError(/no conversation token/);
  });
});

describe("normalizeElevenLabsToolParameters", () => {
  it("passes through object parameters", () => {
    expect(normalizeElevenLabsToolParameters({ path: "/mail" })).toEqual({
      path: "/mail",
    });
  });

  it("parses JSON-string parameters", () => {
    expect(normalizeElevenLabsToolParameters('{"path":"/mail"}')).toEqual({
      path: "/mail",
    });
  });

  it("falls back to empty args for malformed input", () => {
    expect(normalizeElevenLabsToolParameters("not json")).toEqual({});
    expect(normalizeElevenLabsToolParameters(null)).toEqual({});
    expect(normalizeElevenLabsToolParameters([1, 2])).toEqual({});
  });
});

describe("formatElevenLabsToolResultForModel", () => {
  it("returns the raw output for completed calls", () => {
    expect(
      formatElevenLabsToolResultForModel({
        callId: "c1",
        status: "completed",
        output: "42 events this week",
      }),
    ).toBe("42 events this week");
  });

  it("throws for failed calls so the SDK reports is_error", () => {
    expect(() =>
      formatElevenLabsToolResultForModel({
        callId: "c1",
        status: "failed",
        output: "not allowed",
      }),
    ).toThrowError("not allowed");
  });

  it("wraps approval-required results with their approval key", () => {
    const formatted = formatElevenLabsToolResultForModel({
      callId: "c1",
      status: "approval_required",
      output: "Waiting for approval in chat.",
      approvalKey: "approve-1",
    });
    expect(JSON.parse(formatted)).toEqual({
      status: "approval_required",
      output: "Waiting for approval in chat.",
      approvalKey: "approve-1",
    });
  });
});

describe("createElevenLabsToolCallId", () => {
  it("produces unique ids", () => {
    expect(createElevenLabsToolCallId()).not.toBe(createElevenLabsToolCallId());
  });
});

describe("buildElevenLabsClientTools", () => {
  const completed = (output: string): ElevenLabsRealtimeVoiceToolResult => ({
    callId: "server-call",
    status: "completed",
    output,
  });

  it("relays every pushed tool through the executor with normalized args", async () => {
    const execute = vi.fn(async (input: { name: string }) =>
      completed(`ran ${input.name}`),
    );
    const tools = buildElevenLabsClientTools(
      ["navigate", "call-agent"],
      execute,
    );
    expect(Object.keys(tools)).toEqual(["navigate", "call-agent"]);
    await expect(tools.navigate!({ path: "/mail" })).resolves.toBe(
      "ran navigate",
    );
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "navigate",
        args: { path: "/mail" },
        callId: expect.stringMatching(/^el_tool_/),
      }),
    );
  });

  it("signals working state around the relay, even on failure", async () => {
    const onToolStart = vi.fn();
    const onToolSettled = vi.fn();
    const tools = buildElevenLabsClientTools(
      ["view-screen"],
      async () => {
        throw new Error("relay down");
      },
      { onToolStart, onToolSettled },
    );
    await expect(tools["view-screen"]!({})).rejects.toThrowError("relay down");
    expect(onToolStart).toHaveBeenCalledWith("view-screen");
    expect(onToolSettled).toHaveBeenCalledWith("view-screen");
  });
});

describe("realtime voice engine dispatch", () => {
  it("resolves the engine from the deployment status with an OpenAI default", () => {
    expect(resolveRealtimeVoiceEngineName(null)).toBe("openai-realtime");
    expect(resolveRealtimeVoiceEngineName(undefined)).toBe("openai-realtime");
    expect(resolveRealtimeVoiceEngineName({})).toBe("openai-realtime");
    expect(
      resolveRealtimeVoiceEngineName({ defaultEngine: "elevenlabs-agent" }),
    ).toBe("elevenlabs-agent");
    expect(resolveRealtimeVoiceEngineName({ defaultEngine: "bogus" })).toBe(
      "openai-realtime",
    );
  });

  it("locks the engine to the live session over the configured default", () => {
    expect(
      pickActiveRealtimeVoiceEngine({
        configured: "elevenlabs-agent",
        openaiActive: true,
        elevenLabsActive: false,
      }),
    ).toBe("openai-realtime");
    expect(
      pickActiveRealtimeVoiceEngine({
        configured: "openai-realtime",
        openaiActive: false,
        elevenLabsActive: true,
      }),
    ).toBe("elevenlabs-agent");
    expect(
      pickActiveRealtimeVoiceEngine({
        configured: "elevenlabs-agent",
        openaiActive: false,
        elevenLabsActive: false,
      }),
    ).toBe("elevenlabs-agent");
  });
});

describe("useElevenLabsRealtimeVoiceModeController", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    if (root) act(() => root!.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    vi.unstubAllGlobals();
  });

  function renderController(): { readonly api: RealtimeVoiceModeApi } {
    let api: RealtimeVoiceModeApi | null = null;
    function Probe() {
      api = useElevenLabsRealtimeVoiceModeController("tab-regression");
      return null;
    }
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root!.render(<Probe />));
    return {
      get api() {
        return api!;
      },
    };
  }

  it("keeps the in-flight session mint alive across the connecting re-render", async () => {
    // Regression (found live 2026-07-13): an unstable audio-meter object
    // re-keyed cleanupTransport, so the pagehide effect's cleanup re-ran on
    // the idle→connecting re-render and aborted the mint mid-flight,
    // freezing the dock at "connecting" with no request in the log.
    vi.stubGlobal("RTCPeerConnection", class {});
    const mediaDevices = {
      getUserMedia: vi.fn(async () => ({ getTracks: () => [] })),
      enumerateDevices: vi.fn(async () => []),
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    });
    let mintSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/realtime-voice/elevenlabs/session")) {
          mintSignal = init?.signal ?? undefined;
          return new Promise<Response>(() => {});
        }
        return Promise.resolve(
          new Response("{}", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }),
    );

    const controller = renderController();
    await act(async () => {
      void controller.api.start();
      await Promise.resolve();
    });
    expect(controller.api.state).toBe("connecting");

    // Flush the effects scheduled by the idle→connecting re-render; they
    // must NOT tear down the in-flight attempt.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mintSignal).toBeDefined();
    expect(mintSignal!.aborted).toBe(false);
    expect(controller.api.state).toBe("connecting");
  });
});

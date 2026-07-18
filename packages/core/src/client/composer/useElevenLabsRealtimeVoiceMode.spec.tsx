// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import {
  pickActiveRealtimeVoiceEngine,
  resolveRealtimeVoiceEngineName,
} from "./RealtimeVoiceEngineProvider.js";
import { parseElevenLabsRealtimeVoiceSession } from "./useElevenLabsRealtimeVoiceMode.js";

describe("ElevenLabs workspace voice client", () => {
  it("parses the tool-free session mint response", () => {
    expect(
      parseElevenLabsRealtimeVoiceSession({
        token: "conv-token",
        agentId: "agent_123",
        toolNames: ["navigate"],
      }),
    ).toEqual({ token: "conv-token", agentId: "agent_123" });
  });

  it("rejects a response without a conversation token", () => {
    expect(() =>
      parseElevenLabsRealtimeVoiceSession({ agentId: "agent_123" }),
    ).toThrowError(/no conversation token/);
  });

  it("keeps the engine selection stable during an active session", () => {
    expect(
      resolveRealtimeVoiceEngineName({ defaultEngine: "elevenlabs-agent" }),
    ).toBe("elevenlabs-agent");
    expect(
      pickActiveRealtimeVoiceEngine({
        configured: "openai-realtime",
        openaiActive: false,
        elevenLabsActive: true,
      }),
    ).toBe("elevenlabs-agent");
  });
});

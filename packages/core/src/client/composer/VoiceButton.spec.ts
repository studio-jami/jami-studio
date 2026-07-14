import { describe, expect, it } from "vitest";

import type { VoiceProviderStatus } from "../voice-provider-status.js";
import { isRealtimeVoiceSetupRequired } from "./VoiceButton.js";

function status(
  overrides: Partial<VoiceProviderStatus> = {},
): VoiceProviderStatus {
  return {
    builder: false,
    openai: false,
    elevenlabs: false,
    defaultEngine: "openai-realtime",
    ...overrides,
  };
}

describe("isRealtimeVoiceSetupRequired", () => {
  it("waits for the voice-specific provider status before prompting setup", () => {
    expect(isRealtimeVoiceSetupRequired(null, false)).toBe(false);
  });

  it("does not wait on the redundant Builder status after voice status resolves", () => {
    expect(isRealtimeVoiceSetupRequired(status(), null)).toBe(true);
  });

  it("accepts either managed Builder voice or an OpenAI key", () => {
    expect(isRealtimeVoiceSetupRequired(status({ builder: true }), false)).toBe(
      false,
    );
    expect(isRealtimeVoiceSetupRequired(status({ openai: true }), false)).toBe(
      false,
    );
    expect(isRealtimeVoiceSetupRequired(status(), true)).toBe(false);
  });

  it("prompts setup only when neither realtime provider is configured", () => {
    expect(isRealtimeVoiceSetupRequired(status(), false)).toBe(true);
  });

  it("gates ElevenLabs deployments on the ElevenLabs key only", () => {
    expect(
      isRealtimeVoiceSetupRequired(
        status({ defaultEngine: "elevenlabs-agent", elevenlabs: true }),
        false,
      ),
    ).toBe(false);
    // OpenAI/Builder credentials are irrelevant to the ElevenLabs engine.
    expect(
      isRealtimeVoiceSetupRequired(
        status({
          defaultEngine: "elevenlabs-agent",
          builder: true,
          openai: true,
        }),
        true,
      ),
    ).toBe(true);
  });
});

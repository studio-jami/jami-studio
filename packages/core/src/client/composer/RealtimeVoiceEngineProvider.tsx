/**
 * Realtime voice engine dispatcher — the ONE seam that picks which engine
 * provider serves the shared RealtimeVoiceModeContext.
 *
 * The engine choice is deployment-owned: `REALTIME_VOICE_ENGINE` surfaces as
 * `defaultEngine` in `/_agent-native/voice-providers/status` (core 0.99.11).
 * Both controllers stay mounted so the async status fetch can settle without
 * ever remounting children (seamless-UX rule: engine resolution must never
 * flicker the app shell); only the context VALUE and the dock swap. A live
 * session locks the engine until it ends.
 */

import { useMemo } from "react";
import { createPortal } from "react-dom";

import { getBrowserTabId } from "../browser-tab-id.js";
import { useVoiceProviderStatus } from "../voice-provider-status.js";
import { RealtimeVoiceModeDock } from "./RealtimeVoiceMode.js";
import {
  useElevenLabsRealtimeVoiceInlineSettings,
  useElevenLabsRealtimeVoiceModeController,
} from "./useElevenLabsRealtimeVoiceMode.js";
import {
  RealtimeVoiceModeComposerSurface,
  RealtimeVoiceModeContext,
  useRealtimeVoiceInlineSettings,
  useRealtimeVoiceModeController,
  useRealtimeVoiceModeCopy,
  useRealtimeVoiceModeOptional,
  type RealtimeVoiceModeProviderProps,
} from "./useRealtimeVoiceMode.js";

export type RealtimeVoiceEngineName = "openai-realtime" | "elevenlabs-agent";

export function resolveRealtimeVoiceEngineName(
  status: { defaultEngine?: string } | null | undefined,
): RealtimeVoiceEngineName {
  return status?.defaultEngine === "elevenlabs-agent"
    ? "elevenlabs-agent"
    : "openai-realtime";
}

/**
 * A live session pins its engine: a status refresh (window focus) must never
 * strand an active conversation on a controller the context no longer serves.
 */
export function pickActiveRealtimeVoiceEngine(input: {
  configured: RealtimeVoiceEngineName;
  openaiActive: boolean;
  elevenLabsActive: boolean;
}): RealtimeVoiceEngineName {
  if (input.openaiActive) return "openai-realtime";
  if (input.elevenLabsActive) return "elevenlabs-agent";
  return input.configured;
}

export function RealtimeVoiceEngineProvider({
  children,
  browserTabId,
}: RealtimeVoiceModeProviderProps) {
  const resolvedBrowserTabId = useMemo(
    () => browserTabId ?? getBrowserTabId(),
    [browserTabId],
  );
  const copy = useRealtimeVoiceModeCopy();
  const { status } = useVoiceProviderStatus();
  const openai = useRealtimeVoiceModeController(resolvedBrowserTabId, copy);
  const elevenLabs = useElevenLabsRealtimeVoiceModeController(
    resolvedBrowserTabId,
    copy,
  );
  const engine = pickActiveRealtimeVoiceEngine({
    configured: resolveRealtimeVoiceEngineName(status),
    openaiActive: openai.active,
    elevenLabsActive: elevenLabs.active,
  });
  const voice = engine === "elevenlabs-agent" ? elevenLabs : openai;
  const openaiSettings = useRealtimeVoiceInlineSettings(openai, copy);
  const elevenLabsSettings = useElevenLabsRealtimeVoiceInlineSettings(
    elevenLabs,
    copy,
  );
  const settings =
    engine === "elevenlabs-agent" ? elevenLabsSettings : openaiSettings;

  return (
    <RealtimeVoiceModeContext.Provider value={voice}>
      {children}
      {voice.active && typeof document !== "undefined"
        ? createPortal(
            <RealtimeVoiceModeDock
              state={voice.state === "idle" ? "ending" : voice.state}
              copy={copy}
              chatVisible={voice.chatVisible}
              audioLevels={voice.audioLevels}
              onToggleChat={voice.toggleChat}
              onEndVoiceMode={voice.end}
              settings={settings}
              errorMessage={voice.errorMessage}
            />,
            document.body,
          )
        : null}
    </RealtimeVoiceModeContext.Provider>
  );
}

/**
 * Engine-aware sibling of RealtimeVoiceModeBoundary: standalone/full-page
 * composers get realtime voice without nesting a second session owner inside
 * the persistent AgentSidebar provider.
 */
export function RealtimeVoiceEngineBoundary({
  children,
  browserTabId,
}: RealtimeVoiceModeProviderProps) {
  const existing = useRealtimeVoiceModeOptional();
  if (existing) {
    return (
      <RealtimeVoiceModeComposerSurface>
        {children}
      </RealtimeVoiceModeComposerSurface>
    );
  }
  return (
    <RealtimeVoiceEngineProvider browserTabId={browserTabId}>
      <RealtimeVoiceModeComposerSurface>
        {children}
      </RealtimeVoiceModeComposerSurface>
    </RealtimeVoiceEngineProvider>
  );
}

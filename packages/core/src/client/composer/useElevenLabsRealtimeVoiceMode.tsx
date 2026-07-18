/**
 * ElevenLabs Agent Mode client engine — sibling to useRealtimeVoiceMode.
 *
 * Implements the SAME RealtimeVoiceModeApi on @elevenlabs/client
 * Conversation.startSession (WebRTC + conversationToken) so AgentPanel,
 * TiptapComposer, VoiceButton, and RealtimeVoiceModeDock work unchanged.
 * ElevenLabs owns VAD, turn-taking, ASR, and TTS; this hook owns the mint,
 * the authenticated intent broker, compact application-state sync, and dock
 * state. ElevenLabs receives no workspace action or navigation tools.
 *
 * ElevenLabs owns voice, language, LLM tier, personality, and conversation
 * settings. The workspace updates only the client-tool contract at mint, so
 * the preference setters here are deliberate no-ops and the dock gets a
 * microphone-only settings surface.
 *
 * Design note: jami-studio
 * `_ops/planning/roadmaps/real-time/2026-07-13-voice-adapter-interface.md`.
 */

import { Conversation } from "@elevenlabs/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { agentNativePath } from "../api-path.js";
import { setClientAppState } from "../application-state.js";
import { getBrowserTabId } from "../browser-tab-id.js";
import {
  createRealtimeVoiceAudioLevelStore,
  smoothRealtimeVoiceLevel,
} from "./realtime-voice-audio-level.js";
import type {
  RealtimeVoiceModeCopy,
  RealtimeVoiceModeInlineSettings,
  RealtimeVoiceModeState,
} from "./RealtimeVoiceMode.js";
import { RealtimeVoiceModeDock } from "./RealtimeVoiceMode.js";
import {
  createRealtimeVoiceConnectionTimeout,
  DEFAULT_REALTIME_VOICE_PREFERENCES,
  isRealtimeVoiceSetupRequiredError,
  readRealtimeVoiceMicrophoneId,
  REALTIME_VOICE_REQUEST_SOURCE,
  REALTIME_VOICE_STATE_KEY,
  RealtimeVoiceModeContext,
  useRealtimeVoiceModeCopy,
  writeRealtimeVoiceMicrophoneId,
  type RealtimeVoiceMicrophone,
  type RealtimeVoiceModeApi,
  type RealtimeVoiceModeProviderProps,
} from "./useRealtimeVoiceMode.js";

const ELEVENLABS_REALTIME_VOICE_SESSION_PATH =
  "/_agent-native/realtime-voice/elevenlabs/session";
const ELEVENLABS_REALTIME_VOICE_INTENT_PATH =
  "/_agent-native/realtime-voice/elevenlabs/intent";

/** Value reported in the shared realtime-voice app-state for this engine. */
export const ELEVENLABS_REALTIME_VOICE_MODEL = "elevenlabs-agent";

type ElevenLabsConversation = Awaited<
  ReturnType<typeof Conversation.startSession>
> & {
  type: "voice";
  getInputVolume: () => number;
  getOutputVolume: () => number;
  changeInputDevice: (config: { inputDeviceId?: string }) => Promise<void>;
};

export interface ElevenLabsRealtimeVoiceSession {
  token: string;
  agentId: string;
}

export interface ElevenLabsWorkspaceIntentResult {
  status: "completed" | "failed" | "approval_required";
  output: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function readErrorResponse(response: Response): Promise<string> {
  const raw = await response.text().catch(() => "");
  if (!raw) return response.statusText || `HTTP ${response.status}`;
  try {
    const parsed = JSON.parse(raw) as { error?: unknown; message?: unknown };
    return String(parsed.error ?? parsed.message ?? raw);
  } catch {
    return raw.slice(0, 500);
  }
}

export function parseElevenLabsRealtimeVoiceSession(
  body: unknown,
): ElevenLabsRealtimeVoiceSession {
  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const token = typeof record.token === "string" ? record.token : "";
  const agentId = typeof record.agentId === "string" ? record.agentId : "";
  if (!token) {
    throw new Error("The ElevenLabs session returned no conversation token.");
  }
  return {
    token,
    agentId,
  };
}

export async function createElevenLabsRealtimeVoiceSession(
  options: {
    browserTabId?: string;
    signal?: AbortSignal;
  } = {},
): Promise<ElevenLabsRealtimeVoiceSession> {
  const response = await fetch(
    agentNativePath(ELEVENLABS_REALTIME_VOICE_SESSION_PATH),
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        ...(options.browserTabId
          ? { "X-Agent-Native-Browser-Tab": options.browserTabId }
          : {}),
      },
      signal: options.signal,
    },
  );
  if (!response.ok) {
    const message = await readErrorResponse(response);
    const error = new Error(message);
    (error as { status?: number }).status = response.status;
    throw error;
  }
  return parseElevenLabsRealtimeVoiceSession(await response.json());
}

export async function submitElevenLabsWorkspaceIntent(input: {
  utterance: string;
  sessionId?: string;
  browserTabId?: string;
  signal?: AbortSignal;
}): Promise<ElevenLabsWorkspaceIntentResult> {
  const response = await fetch(
    agentNativePath(ELEVENLABS_REALTIME_VOICE_INTENT_PATH),
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(input.browserTabId
          ? { "X-Agent-Native-Browser-Tab": input.browserTabId }
          : {}),
      },
      body: JSON.stringify({
        utterance: input.utterance,
        sessionId: input.sessionId,
      }),
      signal: input.signal,
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return (await response.json()) as ElevenLabsWorkspaceIntentResult;
}

function useElevenLabsAudioMeter(
  audioLevels: ReturnType<typeof createRealtimeVoiceAudioLevelStore>,
) {
  const frameRef = useRef<number | null>(null);
  const lastSampleRef = useRef(0);
  const conversationRef = useRef<ElevenLabsConversation | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastSampleRef.current = 0;
    conversationRef.current = null;
    audioLevels.reset();
  }, [audioLevels]);

  const start = useCallback(
    (conversation: ElevenLabsConversation) => {
      conversationRef.current = conversation;
      if (frameRef.current !== null) return;
      const sample = (timestamp: number) => {
        frameRef.current = requestAnimationFrame(sample);
        if (timestamp - lastSampleRef.current < 50) return;
        lastSampleRef.current = timestamp;
        const active = conversationRef.current;
        if (!active) return;
        try {
          const current = audioLevels.getSnapshot();
          audioLevels.set({
            input: smoothRealtimeVoiceLevel(
              current.input,
              active.getInputVolume(),
            ),
            output: smoothRealtimeVoiceLevel(
              current.output,
              active.getOutputVolume(),
            ),
          });
        } catch {
          // Metering is visual-only; never let it end a healthy call.
        }
      };
      frameRef.current = requestAnimationFrame(sample);
    },
    [audioLevels],
  );

  useEffect(() => stop, [stop]);

  // The controller keys cleanupTransport (and its pagehide/unmount effect) on
  // this object. It MUST be referentially stable across renders — a fresh
  // object here re-runs that effect's cleanup on every state transition,
  // silently aborting the in-flight session mint (found live 2026-07-13).
  return useMemo(() => ({ start, stop }), [start, stop]);
}

export function useElevenLabsRealtimeVoiceModeController(
  browserTabId?: string,
  copy?: RealtimeVoiceModeCopy,
): RealtimeVoiceModeApi {
  const [state, setState] = useState<"idle" | RealtimeVoiceModeState>("idle");
  const [error, setError] = useState<string | null>(null);
  // ElevenLabs voice is an independent overlay, never a control for the app
  // agent-chat panel. Keep the shared API field false for the generic dock.
  const [chatVisible] = useState(false);
  const [microphones, setMicrophones] = useState<RealtimeVoiceMicrophone[]>([]);
  const [microphoneDeviceId, setMicrophoneDeviceId] = useState(
    readRealtimeVoiceMicrophoneId,
  );
  const [microphoneSwitching, setMicrophoneSwitching] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [audioLevels] = useState(createRealtimeVoiceAudioLevelStore);
  const stateRef = useRef(state);
  const conversationRef = useRef<ElevenLabsConversation | null>(null);
  const sessionGenerationRef = useRef(0);
  const cancelConnectionTimeoutRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const startedAtRef = useRef<string | undefined>(undefined);
  const lastUserTextRef = useRef("");
  const lastAssistantTextRef = useRef("");
  const lastSubmittedUtteranceRef = useRef("");
  const meter = useElevenLabsAudioMeter(audioLevels);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncAppState = useCallback(
    (nextState: "idle" | RealtimeVoiceModeState) => {
      const value =
        nextState === "idle"
          ? null
          : {
              active: true,
              status: nextState,
              model: ELEVENLABS_REALTIME_VOICE_MODEL,
              startedAt: startedAtRef.current,
              sessionId: sessionIdRef.current,
              browserTabId,
              lastUserText: lastUserTextRef.current || undefined,
              lastAssistantText: lastAssistantTextRef.current || undefined,
            };
      void setClientAppState(REALTIME_VOICE_STATE_KEY, value, {
        requestSource: REALTIME_VOICE_REQUEST_SOURCE,
      }).catch(() => undefined);
    },
    [browserTabId],
  );

  const transition = useCallback(
    (nextState: "idle" | RealtimeVoiceModeState) => {
      stateRef.current = nextState;
      setState(nextState);
      syncAppState(nextState);
    },
    [syncAppState],
  );

  const refreshMicrophones = useCallback(async (): Promise<
    RealtimeVoiceMicrophone[] | null
  > => {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.enumerateDevices) return null;
    try {
      const devices = await mediaDevices.enumerateDevices();
      const inputs = devices
        .filter(
          (device) =>
            device.kind === "audioinput" &&
            device.deviceId &&
            device.deviceId !== "default" &&
            device.deviceId !== "communications",
        )
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }));
      setMicrophones(inputs);
      return inputs;
    } catch {
      return null;
    }
  }, []);

  const cleanupTransport = useCallback(() => {
    sessionGenerationRef.current += 1;
    cancelConnectionTimeoutRef.current?.();
    cancelConnectionTimeoutRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    meter.stop();
    const conversation = conversationRef.current;
    conversationRef.current = null;
    if (conversation) {
      void conversation.endSession().catch(() => undefined);
    }
  }, [meter]);

  const fail = useCallback(
    (message: string) => {
      cleanupTransport();
      setError(message);
      transition("error");
    },
    [cleanupTransport, transition],
  );

  const endInternal = useCallback(() => {
    transition("ending");
    cleanupTransport();
    setError(null);
    sessionIdRef.current = undefined;
    startedAtRef.current = undefined;
    transition("idle");
  }, [cleanupTransport, transition]);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle") return;
    if (
      typeof RTCPeerConnection === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      fail(
        copy?.errors.unsupported ??
          "This browser does not support realtime voice conversations.",
      );
      return;
    }
    setError(null);
    startedAtRef.current = new Date().toISOString();
    lastUserTextRef.current = "";
    lastAssistantTextRef.current = "";
    lastSubmittedUtteranceRef.current = "";
    sessionIdRef.current = undefined;
    transition("connecting");

    const generation = ++sessionGenerationRef.current;
    const isCurrent = () => sessionGenerationRef.current === generation;
    const abortController = new AbortController();
    abortRef.current = abortController;
    cancelConnectionTimeoutRef.current?.();
    cancelConnectionTimeoutRef.current = createRealtimeVoiceConnectionTimeout(
      () => {
        if (!isCurrent()) return;
        fail(
          copy?.errors.connectionTimedOut ??
            "The realtime voice connection timed out.",
        );
      },
    );

    try {
      const session = await createElevenLabsRealtimeVoiceSession({
        browserTabId,
        signal: abortController.signal,
      });
      if (!isCurrent()) return;

      const storedMicrophoneId = readRealtimeVoiceMicrophoneId();
      const conversation = (await Conversation.startSession({
        conversationToken: session.token,
        connectionType: "webrtc",
        ...(storedMicrophoneId !== "default"
          ? { inputDeviceId: storedMicrophoneId }
          : {}),
        onConnect: ({ conversationId }) => {
          if (!isCurrent()) return;
          sessionIdRef.current = conversationId;
          cancelConnectionTimeoutRef.current?.();
          cancelConnectionTimeoutRef.current = null;
          transition("listening");
          void refreshMicrophones();
        },
        onModeChange: ({ mode }) => {
          if (!isCurrent()) return;
          const current = stateRef.current;
          if (current !== "listening" && current !== "speaking") return;
          transition(mode === "speaking" ? "speaking" : "listening");
        },
        onMessage: ({ message, role }) => {
          if (!isCurrent()) return;
          const transcriptRole = role === "user" ? "user" : "assistant";
          if (transcriptRole === "user") {
            lastUserTextRef.current = message;
            const utterance = message.trim();
            if (utterance && utterance !== lastSubmittedUtteranceRef.current) {
              lastSubmittedUtteranceRef.current = utterance;
              transition("working");
              void submitElevenLabsWorkspaceIntent({
                utterance,
                sessionId: sessionIdRef.current,
                browserTabId,
              })
                .then((result) => {
                  if (!isCurrent()) return;
                  const update = result.output.trim();
                  if (update) {
                    lastAssistantTextRef.current = update;
                    conversationRef.current?.sendContextualUpdate(
                      `Workspace agent update: ${update}`,
                    );
                  }
                  if (stateRef.current === "working") transition("listening");
                })
                .catch(() => {
                  if (!isCurrent()) return;
                  conversationRef.current?.sendContextualUpdate(
                    "Workspace agent update: I could not submit that request. Please try again.",
                  );
                  if (stateRef.current === "working") transition("listening");
                });
            }
          } else {
            lastAssistantTextRef.current = message;
          }
          syncAppState(
            stateRef.current === "idle" ? "working" : stateRef.current,
          );
        },
        onError: (message, context) => {
          if (!isCurrent()) return;
          // Client-tool relay failures already answer the model with
          // is_error; the conversation keeps going. Only transport-level
          // errors end the session.
          const clientToolName =
            context && typeof context === "object"
              ? (context as { clientToolName?: unknown }).clientToolName
              : undefined;
          if (typeof clientToolName === "string") return;
          fail(
            message ||
              copy?.errors.sessionFailed ||
              "The realtime voice session encountered an error.",
          );
        },
        onDisconnect: (details) => {
          if (!isCurrent()) return;
          if (details.reason === "error") {
            fail(
              details.message ||
                copy?.errors.channelDisconnected ||
                "The realtime voice connection disconnected.",
            );
            return;
          }
          if (details.reason === "agent") {
            // Agent-initiated hangup (end_call tool or silence timeout):
            // wind the session down exactly like a user-initiated end.
            endInternal();
          }
        },
      })) as ElevenLabsConversation;

      if (!isCurrent()) {
        void conversation.endSession().catch(() => undefined);
        return;
      }
      conversationRef.current = conversation;
      meter.start(conversation);
    } catch (startError) {
      if (!isCurrent() || abortController.signal.aborted) return;
      if (isRealtimeVoiceSetupRequiredError(startError)) {
        // Same authoritative setup gate as the OpenAI path: clean up the
        // attempt, reopen chat, and refresh the provider setup surfaces.
        cleanupTransport();
        setError(null);
        startedAtRef.current = undefined;
        sessionIdRef.current = undefined;
        transition("idle");
        window.dispatchEvent(new Event("agent-engine:configured-changed"));
        return;
      }
      fail(errorMessage(startError));
    }
  }, [
    browserTabId,
    cleanupTransport,
    copy,
    endInternal,
    fail,
    meter,
    refreshMicrophones,
    syncAppState,
    transition,
  ]);

  const end = useCallback(() => {
    if (stateRef.current === "idle" || stateRef.current === "ending") return;
    endInternal();
  }, [endInternal]);

  const setMicrophone = useCallback(
    async (deviceId: string) => {
      if (deviceId === microphoneDeviceId || microphoneSwitching) return;
      setMicrophoneSwitching(true);
      setMicrophoneError(null);
      try {
        const conversation = conversationRef.current;
        if (conversation) {
          await conversation.changeInputDevice(
            deviceId === "default" ? {} : { inputDeviceId: deviceId },
          );
        }
        writeRealtimeVoiceMicrophoneId(deviceId);
        setMicrophoneDeviceId(deviceId);
        await refreshMicrophones();
      } catch {
        setMicrophoneError(
          copy?.settings.microphoneSwitchFailed ??
            "Could not switch microphones. Your current microphone is still active.",
        );
      } finally {
        setMicrophoneSwitching(false);
      }
    },
    [copy, microphoneDeviceId, microphoneSwitching, refreshMicrophones],
  );

  const toggleChat = useCallback(() => undefined, []);

  useEffect(() => {
    const cleanup = () => cleanupTransport();
    window.addEventListener("pagehide", cleanup);
    return () => {
      window.removeEventListener("pagehide", cleanup);
      cleanupTransport();
    };
  }, [cleanupTransport]);

  return {
    state,
    active: state !== "idle",
    errorMessage: error,
    chatVisible,
    audioLevels,
    // Configure language, LLM tier, voice, and personality in ElevenLabs;
    // these workspace settings are deliberately display-inert.
    preferences: DEFAULT_REALTIME_VOICE_PREFERENCES,
    microphones,
    microphoneDeviceId,
    microphoneSwitching,
    microphoneError,
    voiceChangePending: false,
    setLanguage: () => undefined,
    setIntelligence: () => undefined,
    setVoice: () => undefined,
    setMicrophone,
    start,
    end,
    toggleChat,
  };
}

/**
 * Microphone-only dock settings: configure every other voice setting in
 * ElevenLabs, where it remains under the operator's direct control.
 */
export function useElevenLabsRealtimeVoiceInlineSettings(
  voice: RealtimeVoiceModeApi,
  copy: RealtimeVoiceModeCopy,
): RealtimeVoiceModeInlineSettings {
  return useMemo(
    () => ({
      dialogLabel: copy.voiceSettings,
      ...(voice.microphoneError
        ? { microphoneError: voice.microphoneError }
        : {}),
      microphone: {
        label: copy.settings.microphone,
        value: voice.microphoneDeviceId,
        disabled: voice.microphoneSwitching,
        options: [
          { value: "default", label: copy.settings.defaultMicrophone },
          ...voice.microphones.map((microphone) => ({
            value: microphone.deviceId,
            label: microphone.label,
          })),
        ],
        onValueChange: (value: string) => {
          void voice.setMicrophone(value);
        },
      },
    }),
    [copy, voice],
  );
}

/**
 * Standalone ElevenLabs engine provider — same contract as
 * RealtimeVoiceModeProvider. Most apps should mount the engine dispatcher
 * (RealtimeVoiceEngineProvider) instead, which picks the provider from the
 * deployment's defaultEngine.
 */
export function ElevenLabsRealtimeVoiceModeProvider({
  children,
  browserTabId,
}: RealtimeVoiceModeProviderProps) {
  const resolvedBrowserTabId = useMemo(
    () => browserTabId ?? getBrowserTabId(),
    [browserTabId],
  );
  const copy = useRealtimeVoiceModeCopy();
  const voice = useElevenLabsRealtimeVoiceModeController(
    resolvedBrowserTabId,
    copy,
  );
  const inlineSettings = useElevenLabsRealtimeVoiceInlineSettings(voice, copy);

  return (
    <RealtimeVoiceModeContext.Provider value={voice}>
      {children}
      {voice.active && typeof document !== "undefined"
        ? createPortal(
            <RealtimeVoiceModeDock
              state={voice.state === "idle" ? "ending" : voice.state}
              copy={copy}
              chatVisible={voice.chatVisible}
              showChatToggle={false}
              audioLevels={voice.audioLevels}
              onToggleChat={voice.toggleChat}
              onEndVoiceMode={voice.end}
              settings={inlineSettings}
              errorMessage={voice.errorMessage}
            />,
            document.body,
          )
        : null}
    </RealtimeVoiceModeContext.Provider>
  );
}

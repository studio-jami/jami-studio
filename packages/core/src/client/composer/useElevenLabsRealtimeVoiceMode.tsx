/**
 * ElevenLabs Agent Mode client engine — sibling to useRealtimeVoiceMode.
 *
 * Implements the SAME RealtimeVoiceModeApi on @elevenlabs/client
 * Conversation.startSession (WebRTC + conversationToken) so AgentPanel,
 * TiptapComposer, VoiceButton, and RealtimeVoiceModeDock work unchanged.
 * ElevenLabs owns VAD, turn-taking, ASR, and TTS; this hook owns the mint,
 * the client-tool relay back to our authenticated tool route (capability
 * header trust model), transcripts, app-state sync, and dock state.
 *
 * Engine-owned settings (voice, language, LLM tier) are pinned server-side
 * by the config-as-code push at session mint, so the preference setters here
 * are deliberate no-ops and the dock gets a microphone-only settings surface.
 *
 * Design note: jami-studio
 * `_ops/planning/roadmaps/real-time/2026-07-13-voice-adapter-interface.md`.
 */

import { Conversation } from "@elevenlabs/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { requestAgentChatThreadOpen } from "../agent-chat.js";
import {
  SIDEBAR_STATE_CHANGE_EVENT,
  type AgentSidebarStateChangeDetail,
} from "../agent-sidebar-state.js";
import { agentNativePath } from "../api-path.js";
import { setClientAppState } from "../application-state.js";
import { getBrowserTabId } from "../browser-tab-id.js";
import {
  createRealtimeVoiceAudioLevelStore,
  smoothRealtimeVoiceLevel,
} from "./realtime-voice-audio-level.js";
import { realtimeVoiceTranscriptRegistry } from "./realtime-voice-transcript.js";
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
  REALTIME_VOICE_CAPABILITY_HEADER,
  REALTIME_VOICE_REQUEST_SOURCE,
  REALTIME_VOICE_STATE_KEY,
  RealtimeVoiceModeContext,
  shouldRestoreRealtimeVoiceTranscriptThread,
  useRealtimeVoiceModeCopy,
  writeRealtimeVoiceMicrophoneId,
  type RealtimeVoiceMicrophone,
  type RealtimeVoiceModeApi,
  type RealtimeVoiceModeProviderProps,
} from "./useRealtimeVoiceMode.js";

const ELEVENLABS_REALTIME_VOICE_SESSION_PATH =
  "/_agent-native/realtime-voice/elevenlabs/session";
const ELEVENLABS_REALTIME_VOICE_TOOL_PATH =
  "/_agent-native/realtime-voice/elevenlabs/tool";

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
  toolNames: string[];
  capability?: string;
}

export interface ElevenLabsRealtimeVoiceToolResult {
  callId: string;
  status: "completed" | "failed" | "approval_required";
  output: string;
  approvalKey?: string;
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
  capability: string | null,
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
  const toolNames = Array.isArray(record.toolNames)
    ? record.toolNames.filter(
        (name): name is string => typeof name === "string" && name.length > 0,
      )
    : [];
  return {
    token,
    agentId,
    toolNames,
    ...(capability ? { capability } : {}),
  };
}

export async function createElevenLabsRealtimeVoiceSession(
  options: {
    browserTabId?: string;
    threadId?: string;
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
        ...(options.threadId
          ? { "X-Agent-Native-Voice-Thread": options.threadId }
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
  return parseElevenLabsRealtimeVoiceSession(
    await response.json(),
    response.headers.get(REALTIME_VOICE_CAPABILITY_HEADER),
  );
}

export async function executeElevenLabsRealtimeVoiceTool(input: {
  name: string;
  args: Record<string, unknown>;
  callId: string;
  sessionId?: string;
  browserTabId?: string;
  capability?: string;
  signal?: AbortSignal;
}): Promise<ElevenLabsRealtimeVoiceToolResult> {
  const response = await fetch(
    agentNativePath(ELEVENLABS_REALTIME_VOICE_TOOL_PATH),
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(input.browserTabId
          ? { "X-Agent-Native-Browser-Tab": input.browserTabId }
          : {}),
        ...(input.capability
          ? { [REALTIME_VOICE_CAPABILITY_HEADER]: input.capability }
          : {}),
      },
      body: JSON.stringify({
        name: input.name,
        args: input.args,
        callId: input.callId,
        sessionId: input.sessionId,
        browserTabId: input.browserTabId,
      }),
      signal: input.signal,
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return (await response.json()) as ElevenLabsRealtimeVoiceToolResult;
}

/**
 * The ElevenLabs SDK stringifies whatever a client tool returns and blocks
 * the model until it arrives (expects_response). Failed relays THROW so the
 * SDK reports is_error to the model instead of a fake success string.
 */
export function formatElevenLabsToolResultForModel(
  result: ElevenLabsRealtimeVoiceToolResult,
): string {
  if (result.status === "failed") {
    throw new Error(result.output || "The tool call failed.");
  }
  if (result.status === "approval_required") {
    return JSON.stringify({
      status: "approval_required",
      output: result.output,
      ...(result.approvalKey ? { approvalKey: result.approvalKey } : {}),
    });
  }
  return result.output;
}

export function normalizeElevenLabsToolParameters(
  parameters: unknown,
): Record<string, unknown> {
  if (
    parameters &&
    typeof parameters === "object" &&
    !Array.isArray(parameters)
  ) {
    return parameters as Record<string, unknown>;
  }
  if (typeof parameters === "string" && parameters.trim()) {
    try {
      const parsed = JSON.parse(parameters) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Fall through to the empty-args shape below.
    }
  }
  return {};
}

let elevenLabsToolCallSequence = 0;

export function createElevenLabsToolCallId(): string {
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `el_tool_${++elevenLabsToolCallSequence}_${unique}`;
}

/**
 * Build the clientTools map handed to Conversation.startSession. Every
 * pushed tool name relays through the authenticated tool route with the
 * per-session capability token — identical trust model to the OpenAI path.
 */
export function buildElevenLabsClientTools(
  toolNames: readonly string[],
  execute: (input: {
    name: string;
    args: Record<string, unknown>;
    callId: string;
  }) => Promise<ElevenLabsRealtimeVoiceToolResult>,
  hooks: {
    onToolStart?: (name: string) => void;
    onToolSettled?: (name: string) => void;
  } = {},
): Record<string, (parameters: unknown) => Promise<string>> {
  const clientTools: Record<string, (parameters: unknown) => Promise<string>> =
    {};
  for (const name of toolNames) {
    clientTools[name] = async (parameters: unknown) => {
      hooks.onToolStart?.(name);
      try {
        const result = await execute({
          name,
          args: normalizeElevenLabsToolParameters(parameters),
          callId: createElevenLabsToolCallId(),
        });
        return formatElevenLabsToolResultForModel(result);
      } finally {
        hooks.onToolSettled?.(name);
      }
    };
  }
  return clientTools;
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
  const [chatVisible, setChatVisible] = useState(false);
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
  const transcriptThreadIdRef = useRef<string | undefined>(undefined);
  const transcriptSequenceRef = useRef(0);
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

  const publishTranscript = useCallback(
    (role: "user" | "assistant", text: string) => {
      const threadId = transcriptThreadIdRef.current;
      const trimmed = text.trim();
      if (!threadId || !trimmed) return;
      const sessionIdentity =
        sessionIdRef.current ?? startedAtRef.current ?? "pending";
      realtimeVoiceTranscriptRegistry.publish({
        id: `realtime-voice:${sessionIdentity}:${role}:sequence-${++transcriptSequenceRef.current}`,
        threadId,
        role,
        text: trimmed,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const endInternal = useCallback(
    (options: { reopenChat: boolean }) => {
      const transcriptThreadId = transcriptThreadIdRef.current;
      const activeThreadId = realtimeVoiceTranscriptRegistry.activeThreadId();
      transition("ending");
      cleanupTransport();
      setError(null);
      sessionIdRef.current = undefined;
      startedAtRef.current = undefined;
      transcriptThreadIdRef.current = undefined;
      if (options.reopenChat) {
        setChatVisible(true);
        if (
          shouldRestoreRealtimeVoiceTranscriptThread(
            transcriptThreadId,
            activeThreadId,
          )
        ) {
          requestAgentChatThreadOpen({
            threadId: transcriptThreadId,
            onlyIfActiveThreadId: transcriptThreadId,
          });
        } else {
          window.dispatchEvent(new Event("agent-panel:open"));
        }
      }
      transition("idle");
    },
    [cleanupTransport, transition],
  );

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
    sessionIdRef.current = undefined;
    transcriptThreadIdRef.current =
      realtimeVoiceTranscriptRegistry.activeThreadId();
    transcriptSequenceRef.current = 0;
    transition("connecting");
    setChatVisible(false);
    window.dispatchEvent(new Event("agent-panel:close"));

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
        threadId: transcriptThreadIdRef.current,
        signal: abortController.signal,
      });
      if (!isCurrent()) return;

      const clientTools = buildElevenLabsClientTools(
        session.toolNames,
        (input) =>
          executeElevenLabsRealtimeVoiceTool({
            ...input,
            sessionId: sessionIdRef.current,
            browserTabId,
            capability: session.capability,
          }),
        {
          onToolStart: () => {
            if (isCurrent()) transition("working");
          },
          onToolSettled: () => {
            if (isCurrent() && stateRef.current === "working") {
              transition("listening");
            }
          },
        },
      );

      const storedMicrophoneId = readRealtimeVoiceMicrophoneId();
      const conversation = (await Conversation.startSession({
        conversationToken: session.token,
        connectionType: "webrtc",
        clientTools,
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
          } else {
            lastAssistantTextRef.current = message;
          }
          publishTranscript(transcriptRole, message);
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
            endInternal({ reopenChat: true });
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
        transcriptThreadIdRef.current = undefined;
        transition("idle");
        setChatVisible(true);
        window.dispatchEvent(new Event("agent-panel:open"));
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
    publishTranscript,
    refreshMicrophones,
    syncAppState,
    transition,
  ]);

  const end = useCallback(() => {
    if (stateRef.current === "idle" || stateRef.current === "ending") return;
    endInternal({ reopenChat: true });
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

  const toggleChat = useCallback(() => {
    setChatVisible((current) => !current);
    window.dispatchEvent(new Event("agent-panel:toggle"));
  }, []);

  useEffect(() => {
    const onSidebarState = (event: Event) => {
      const detail = (event as CustomEvent<AgentSidebarStateChangeDetail>)
        .detail;
      if (detail && typeof detail.open === "boolean") {
        setChatVisible(detail.open);
      }
    };
    window.addEventListener(SIDEBAR_STATE_CHANGE_EVENT, onSidebarState);
    return () =>
      window.removeEventListener(SIDEBAR_STATE_CHANGE_EVENT, onSidebarState);
  }, []);

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
    // ElevenLabs pins language, LLM tier, and voice server-side via the
    // config-as-code push at mint; these preferences are display-inert here.
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
 * Microphone-only dock settings: every other knob is engine-owned and pinned
 * at session mint by the server module.
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

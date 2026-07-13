import {
  defineEventHandler,
  getMethod,
  setResponseHeader,
  setResponseStatus,
  type H3Event,
} from "h3";

import type { ActionEntry } from "../agent/production-agent.js";
import { sanitizeToolErrorText } from "../agent/tool-error-redaction.js";
import { resolveSecret } from "./credential-provider.js";
import { getH3App } from "./framework-request-handler.js";
import {
  authenticateVoiceRequest,
  buildInstructions,
  buildRealtimeTools,
  createToolHandler,
  packRealtimeTools,
  registerRealtimeToolCapability,
  REALTIME_VOICE_CAPABILITY_HEADER,
  type MountRealtimeVoiceRoutesOptions,
  type RealtimeFunctionTool,
  type RealtimeToolCapabilityStore,
} from "./realtime-voice.js";
import { runWithRequestContext } from "./request-context.js";
import { isSameOriginRequest } from "./request-origin.js";

export const ELEVENLABS_REALTIME_VOICE_SESSION_PATH =
  "/_agent-native/realtime-voice/elevenlabs/session";
export const ELEVENLABS_REALTIME_VOICE_TOOL_PATH =
  "/_agent-native/realtime-voice/elevenlabs/tool";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io";
const DEFAULT_AGENT_NAME = "Jami Voice";
const DEFAULT_LLM = "gemini-2.5-flash";
/** ElevenLabs voice ids are short base62 tokens, not UUIDs. */
const ELEVENLABS_VOICE_ID_SHAPE = /^[A-Za-z0-9]{16,32}$/;
const ELEVENLABS_AGENT_ID_SHAPE = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * ElevenLabs sessions cannot expand their tool manifest mid-conversation the
 * way the OpenAI path can via session.update, so tool-search discovery is
 * excluded and the default bridge allow-list is the bounded navigation set.
 */
export const ELEVENLABS_DEFAULT_TOOL_ALLOW_LIST = [
  "navigate",
  "set-url-path",
  "set-search-params",
  "view-screen",
] as const;

const CLIENT_EVENTS = [
  "audio",
  "interruption",
  "user_transcript",
  "agent_response",
  "agent_response_correction",
  "client_tool_call",
  "vad_score",
];

export interface MountElevenLabsRealtimeVoiceRoutesOptions extends Pick<
  MountRealtimeVoiceRoutesOptions,
  "instructions" | "getInstructions" | "resolveOrgId" | "executeTool"
> {
  /** Display name pushed to the ElevenLabs agent. */
  agentName?: string;
  /** Conversational LLM slot (decision #7: Gemini Flash default). */
  llm?: string;
  /** ISO 639-1 language for ASR/TTS. Defaults to en. */
  language?: string;
  /**
   * ElevenLabs voice id override. Applied only when it matches the
   * ElevenLabs id shape; otherwise the agent's existing voice is preserved.
   */
  voiceId?: string;
  /** Bridge allow-list of action names exposed as client tools. */
  toolAllowList?: readonly string[];
}

interface ElevenLabsSchemaProperty {
  type: string | string[];
  description?: string;
  enum?: string[];
  items?: ElevenLabsSchemaProperty;
  properties?: Record<string, ElevenLabsSchemaProperty>;
  required?: string[];
}

const LITERAL_TYPES = new Set(["boolean", "string", "integer", "number"]);

/**
 * Convert a JSON-schema property into the restricted ElevenLabs client-tool
 * schema dialect. Returns null when the schema uses constructs the dialect
 * cannot express (oneOf/anyOf/allOf/$ref/etc.) so the tool is dropped rather
 * than pushed broken.
 */
function convertSchemaProperty(
  value: unknown,
): ElevenLabsSchemaProperty | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const schema = value as Record<string, unknown>;
  if (schema.oneOf || schema.anyOf || schema.allOf || schema.$ref) return null;
  const type = schema.type;
  const description =
    typeof schema.description === "string"
      ? sanitizeToolErrorText(schema.description)
      : undefined;

  if (type === "object" || (!type && schema.properties)) {
    const source =
      schema.properties && typeof schema.properties === "object"
        ? (schema.properties as Record<string, unknown>)
        : {};
    const properties: Record<string, ElevenLabsSchemaProperty> = {};
    for (const [name, propertyValue] of Object.entries(source)) {
      const converted = convertSchemaProperty(propertyValue);
      if (!converted) return null;
      properties[name] = converted;
    }
    const required = Array.isArray(schema.required)
      ? schema.required.filter(
          (name): name is string =>
            typeof name === "string" && name in properties,
        )
      : undefined;
    return {
      type: "object",
      ...(description ? { description } : {}),
      properties,
      ...(required?.length ? { required } : {}),
    };
  }

  if (type === "array") {
    const items = convertSchemaProperty(schema.items ?? { type: "string" });
    if (!items) return null;
    return { type: "array", ...(description ? { description } : {}), items };
  }

  if (typeof type === "string" && LITERAL_TYPES.has(type)) {
    const allowed = Array.isArray(schema.enum)
      ? schema.enum.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : undefined;
    return {
      type,
      description: description ?? "",
      ...(allowed?.length ? { enum: allowed } : {}),
    };
  }

  return null;
}

export function elevenLabsClientToolFromRealtimeTool(
  tool: RealtimeFunctionTool,
): Record<string, unknown> | null {
  const parameters = convertSchemaProperty(tool.parameters);
  if (!parameters || parameters.type !== "object") return null;
  return {
    type: "client",
    name: tool.name,
    description: tool.description,
    parameters,
    expects_response: true,
    response_timeout_secs: 30,
  };
}

export function buildElevenLabsAgentPayload(input: {
  name: string;
  instructions: string;
  llm: string;
  language: string;
  voiceId?: string;
  clientTools: Record<string, unknown>[];
}): Record<string, unknown> {
  return {
    name: input.name,
    tags: ["agent-native"],
    conversation_config: {
      agent: {
        first_message: "",
        language: input.language,
        prompt: {
          prompt: input.instructions,
          llm: input.llm,
          temperature: 0.3,
          tools: input.clientTools,
          built_in_tools: {
            end_call: {
              name: "end_call",
              params: { system_tool_type: "end_call" },
            },
            skip_turn: {
              name: "skip_turn",
              params: { system_tool_type: "skip_turn" },
            },
            language_detection: {
              name: "language_detection",
              params: { system_tool_type: "language_detection" },
            },
          },
        },
      },
      // Engine tuning matched to the proven prototype agent (2026-06-26
      // capabilities probe): expressive v3 conversational voice, low-latency
      // speculative turns, and a bounded silence hangup so abandoned
      // sessions do not burn credits.
      turn: {
        speculative_turn: true,
        silence_end_call_timeout: 60,
      },
      tts: {
        model_id: "eleven_v3_conversational",
        expressive_mode: true,
        stability: 0.6,
        speed: 1.05,
        similarity_boost: 0.8,
        ...(input.voiceId && ELEVENLABS_VOICE_ID_SHAPE.test(input.voiceId)
          ? { voice_id: input.voiceId }
          : {}),
      },
      conversation: {
        client_events: CLIENT_EVENTS,
      },
    },
    platform_settings: {
      auth: { enable_auth: true },
      // This agent serves the signed-in workspace owner through our
      // authenticated session mint, never anonymous external callers.
      trust_context: "high",
      // Durable rule: no unbounded data stream. Voice transcripts/audio on
      // the provider side expire like our own event retention windows.
      privacy: { retention_days: 30 },
    },
  };
}

async function safeElevenLabsErrorDetail(
  response: Response,
  apiKey: string,
): Promise<string | null> {
  const raw = await response.text().catch(() => "");
  if (!raw) return null;
  const redacted = sanitizeToolErrorText(raw).replaceAll(apiKey, "[REDACTED]");
  return redacted.slice(0, 500) || null;
}

interface ElevenLabsSessionState {
  agentId?: string;
  lastPushedConfigHash?: string;
}

async function pushAgentConfig(input: {
  apiKey: string;
  state: ElevenLabsSessionState;
  configuredAgentId: string | undefined;
  payload: Record<string, unknown>;
}): Promise<{ agentId: string } | { error: string; status: number }> {
  const serialized = JSON.stringify(input.payload);
  const configHash = `${input.configuredAgentId ?? ""}:${serialized.length}:${serialized}`;
  const agentId = input.configuredAgentId ?? input.state.agentId;

  if (agentId && input.state.lastPushedConfigHash === configHash) {
    return { agentId };
  }

  const headers = {
    "xi-api-key": input.apiKey,
    "Content-Type": "application/json",
  };

  if (agentId) {
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/v1/convai/agents/${encodeURIComponent(agentId)}`,
      { method: "PATCH", headers, body: serialized },
    );
    if (!response.ok) {
      const detail = await safeElevenLabsErrorDetail(response, input.apiKey);
      return {
        error: `ElevenLabs rejected the agent config push (${response.status})${detail ? `: ${detail}` : ""}`,
        status: 502,
      };
    }
    input.state.agentId = agentId;
    input.state.lastPushedConfigHash = configHash;
    return { agentId };
  }

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/v1/convai/agents/create`,
    { method: "POST", headers, body: serialized },
  );
  if (!response.ok) {
    const detail = await safeElevenLabsErrorDetail(response, input.apiKey);
    return {
      error: `ElevenLabs rejected agent creation (${response.status})${detail ? `: ${detail}` : ""}`,
      status: 502,
    };
  }
  const created = (await response.json().catch(() => null)) as {
    agent_id?: unknown;
  } | null;
  const createdAgentId =
    typeof created?.agent_id === "string" ? created.agent_id : null;
  if (!createdAgentId) {
    return {
      error: "ElevenLabs returned no agent id for the created voice agent",
      status: 502,
    };
  }
  console.warn(
    `[realtime-voice-elevenlabs] Created ElevenLabs agent ${createdAgentId}. ` +
      "Pin it with the ELEVENLABS_AGENT_ID secret to keep config-as-code " +
      "pushes targeting one durable agent.",
  );
  input.state.agentId = createdAgentId;
  input.state.lastPushedConfigHash = configHash;
  return { agentId: createdAgentId };
}

function invalidMethod(event: H3Event): { error: string } {
  setResponseStatus(event, 405);
  return { error: "Method not allowed" };
}

function createElevenLabsSessionHandler(
  tools: RealtimeFunctionTool[],
  clientTools: Record<string, unknown>[],
  capabilities: RealtimeToolCapabilityStore,
  state: ElevenLabsSessionState,
  options: MountElevenLabsRealtimeVoiceRoutesOptions,
) {
  return defineEventHandler(async (event: H3Event) => {
    if (getMethod(event) !== "POST") return invalidMethod(event);
    if (!isSameOriginRequest(event)) {
      setResponseStatus(event, 403);
      return { error: "Cross-origin request rejected" };
    }
    setResponseHeader(event, "Cache-Control", "no-store");

    const auth = await authenticateVoiceRequest(event, options);
    if (!auth) {
      setResponseStatus(event, 401);
      return { error: "Authentication required" };
    }

    return runWithRequestContext(
      {
        userEmail: auth.userEmail,
        orgId: auth.orgId,
        timezone: auth.timezone,
        run: auth.browserTabId
          ? { browserTabId: auth.browserTabId }
          : undefined,
      },
      async () => {
        const apiKey = (await resolveSecret("ELEVENLABS_API_KEY"))?.trim();
        if (!apiKey) {
          setResponseStatus(event, 409);
          return {
            error:
              "Configure an ElevenLabs API key to use ElevenLabs realtime voice.",
            code: "realtime_voice_setup_required",
          };
        }

        const configuredAgentIdRaw = (
          await resolveSecret("ELEVENLABS_AGENT_ID")
        )?.trim();
        const configuredAgentId =
          configuredAgentIdRaw &&
          ELEVENLABS_AGENT_ID_SHAPE.test(configuredAgentIdRaw)
            ? configuredAgentIdRaw
            : undefined;

        const instructions = await buildInstructions(auth, options);
        const configuredVoiceId =
          options.voiceId?.trim() ||
          (await resolveSecret("ELEVENLABS_VOICE_ID"))?.trim();
        const payload = buildElevenLabsAgentPayload({
          name: options.agentName?.trim() || DEFAULT_AGENT_NAME,
          instructions,
          llm: options.llm?.trim() || DEFAULT_LLM,
          language: options.language?.trim().toLowerCase() || "en",
          ...(configuredVoiceId ? { voiceId: configuredVoiceId } : {}),
          clientTools,
        });

        let pushed: Awaited<ReturnType<typeof pushAgentConfig>>;
        try {
          pushed = await pushAgentConfig({
            apiKey,
            state,
            configuredAgentId,
            payload,
          });
        } catch {
          setResponseStatus(event, 502);
          return { error: "Could not reach the ElevenLabs API" };
        }
        if ("error" in pushed) {
          setResponseStatus(event, pushed.status);
          return { error: pushed.error };
        }

        let tokenResponse: Response;
        try {
          const tokenUrl = new URL(
            "/v1/convai/conversation/token",
            ELEVENLABS_API_BASE,
          );
          tokenUrl.searchParams.set("agent_id", pushed.agentId);
          tokenResponse = await fetch(tokenUrl, {
            headers: { "xi-api-key": apiKey },
          });
        } catch {
          setResponseStatus(event, 502);
          return { error: "Could not reach the ElevenLabs API" };
        }
        if (!tokenResponse.ok) {
          const detail = await safeElevenLabsErrorDetail(tokenResponse, apiKey);
          setResponseStatus(event, 502);
          return {
            error: `ElevenLabs rejected the conversation token request (${tokenResponse.status})${detail ? `: ${detail}` : ""}`,
          };
        }
        const tokenBody = (await tokenResponse.json().catch(() => null)) as {
          token?: unknown;
        } | null;
        const token =
          typeof tokenBody?.token === "string" ? tokenBody.token : null;
        if (!token) {
          setResponseStatus(event, 502);
          return {
            error: "ElevenLabs returned an empty conversation token",
          };
        }

        setResponseHeader(
          event,
          REALTIME_VOICE_CAPABILITY_HEADER,
          registerRealtimeToolCapability(
            capabilities,
            auth,
            tools.map((tool) => tool.name),
          ),
        );
        return {
          token,
          agentId: pushed.agentId,
          toolNames: tools.map((tool) => tool.name),
        };
      },
    );
  });
}

/**
 * Mount the authenticated ElevenLabs Agent Mode session-mint and tool bridge
 * routes. Sibling to mountRealtimeVoiceRoutes: same auth, capability, and
 * tool-execution trust model; ElevenLabs owns the conversation engine and the
 * browser relays client-tool calls back to the tool route.
 */
export function mountElevenLabsRealtimeVoiceRoutes(
  nitroApp: any,
  actions: Record<string, ActionEntry>,
  options: MountElevenLabsRealtimeVoiceRoutesOptions,
): { sessionPath: string; toolPath: string } {
  if (typeof options?.executeTool !== "function") {
    throw new Error("mountElevenLabsRealtimeVoiceRoutes requires executeTool");
  }

  const allowList = new Set(
    options.toolAllowList?.length
      ? options.toolAllowList
      : ELEVENLABS_DEFAULT_TOOL_ALLOW_LIST,
  );
  const eligible = buildRealtimeTools(actions).filter((tool) =>
    allowList.has(tool.name),
  );
  const converted = eligible
    .map((tool) => ({
      tool,
      clientTool: elevenLabsClientToolFromRealtimeTool(tool),
    }))
    .filter(
      (
        entry,
      ): entry is {
        tool: RealtimeFunctionTool;
        clientTool: Record<string, unknown>;
      } => entry.clientTool !== null,
    );
  const tools = packRealtimeTools(
    {},
    converted.map((entry) => entry.tool),
  );
  const packedNames = new Set(tools.map((tool) => tool.name));
  const clientTools = converted
    .filter((entry) => packedNames.has(entry.tool.name))
    .map((entry) => entry.clientTool);
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));
  const capabilities: RealtimeToolCapabilityStore = new Map();
  const state: ElevenLabsSessionState = {};

  const app = getH3App(nitroApp);
  app.use(
    ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
    createElevenLabsSessionHandler(
      tools,
      clientTools,
      capabilities,
      state,
      options,
    ),
  );
  app.use(
    ELEVENLABS_REALTIME_VOICE_TOOL_PATH,
    createToolHandler(toolsByName, capabilities, options),
  );
  return {
    sessionPath: ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
    toolPath: ELEVENLABS_REALTIME_VOICE_TOOL_PATH,
  };
}

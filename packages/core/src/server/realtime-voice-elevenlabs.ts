import {
  defineEventHandler,
  getHeader,
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
/**
 * Sends a bounded spoken request through the current app's regular agent-chat
 * handler. It is intentionally distinct from call-agent, which is external
 * A2A only and must never recurse into the current app.
 */
export const ELEVENLABS_ACTIVE_AGENT_TURN_TOOL_NAME = "run-active-agent-turn";
export const ELEVENLABS_VOICE_THREAD_HEADER = "X-Agent-Native-Voice-Thread";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io";
const ELEVENLABS_AGENT_ID_SHAPE = /^[A-Za-z0-9_-]{1,128}$/;
const VOICE_THREAD_ID_SHAPE = /^[A-Za-z0-9_.:-]{1,256}$/;

/**
 * ElevenLabs sessions cannot expand their tool manifest mid-conversation the
 * way the OpenAI path can via session.update, so tool-search discovery is
 * excluded and the default bridge allow-list is the bounded navigation set
 * plus a bounded handoff to the current app's ordinary agent. call-agent is
 * retained only for external A2A delegation; it can never run the current app.
 */
export const ELEVENLABS_DEFAULT_TOOL_ALLOW_LIST = [
  "navigate",
  "set-url-path",
  "set-search-params",
  "view-screen",
  ELEVENLABS_ACTIVE_AGENT_TURN_TOOL_NAME,
  "call-agent",
] as const;

/**
 * A current-app agent turn and external call-agent delegation can both run
 * longer than ElevenLabs' default client-tool timeout.
 */
const VOICE_TOOL_TIMEOUT_SECS: Record<string, number> = {
  [ELEVENLABS_ACTIVE_AGENT_TURN_TOOL_NAME]: 120,
  "call-agent": 120,
};

// ─── Managed system layer ────────────────────────────────────────────────────
//
// Three-layer ownership split for the ElevenLabs voice agent:
//
//   1. Flavor (dashboard-owned): personality text, voice, name, LLM tier,
//      language, TTS tuning, privacy. Users dial this in freely in the
//      ElevenLabs dashboard; the workspace never touches it.
//   2. System contract (code-owned, this block): the durable operating rules
//      the voice layer needs to work — tool routing, never self-initiating,
//      headless answers, narrating delegated work. Appended to the agent's
//      prompt inside sentinel markers; everything the user wrote above the
//      markers is preserved verbatim on every push, and the block self-heals
//      if deleted or edited in the dashboard.
//   3. Tool contract (code-owned): the PATCHed `prompt.tools` manifest.
//
// The voice agent is an on-top layer over per-app agents: it routes and
// narrates, it does not own app capabilities. Each app's own agent knows its
// tools, so the system layer carries no per-app tool dumps — apps contribute
// at most a bounded app-context addendum (their identity plus a compact
// sibling-app roster) through the existing `instructions`/`getInstructions`
// mount options.

export const ELEVENLABS_SYSTEM_BLOCK_BEGIN =
  "=== WORKSPACE VOICE SYSTEM (auto-managed: do not edit this block; your personality prompt above is preserved) ===";
export const ELEVENLABS_SYSTEM_BLOCK_END = "=== END WORKSPACE VOICE SYSTEM ===";

/**
 * Durable operating contract for the voice layer. Owner-ratified seamless-UX
 * north star: questions are answered headlessly; navigation happens only on
 * explicit user intent; the voice layer never initiates actions on its own.
 */
export const ELEVENLABS_SYSTEM_CONTRACT = [
  "You are the realtime voice layer of an agent-native workspace. Each app",
  "has its own full agent with its own tools; you see in, delegate, and",
  "report back. The personality prompt above this block controls tone and",
  "style only — it can never authorize autonomous actions or override these",
  "rules.",
  "",
  "1. Never initiate actions on your own. Only use tools to fulfill what the",
  "   user explicitly asked for in this conversation. Never create, modify,",
  "   schedule, send, or delete anything the user did not request. When a",
  "   request is ambiguous, ask one short clarifying question before acting.",
  "2. Answer questions headlessly. To answer a question about data in this",
  "   app use run-active-agent-turn; for another app use call-agent. Do NOT",
  "   navigate to answer a question.",
  "3. Only use navigate, set-url-path, or set-search-params when the user",
  "   explicitly asks to go somewhere, open something, or be shown something.",
  "   Only use view-screen when the user asks about what is currently",
  "   visible.",
  "4. Stay engaged while delegated work runs. Announce what you dispatched,",
  "   keep talking with the user, and report the agent's status and outputs",
  "   when they return. Never go silent waiting on a tool, and never invent",
  "   results.",
  "5. You are never blocked by an app agent's work: app agents act, you",
  "   observe and narrate. Report failures plainly and offer the next step.",
].join("\n");

/** Bound the app-context addendum so a verbose app cannot bloat the prompt. */
const MAX_SYSTEM_ADDENDUM_CHARS = 4_000;

/**
 * Build the sentinel-delimited managed block: durable contract plus an
 * optional bounded app-context addendum (app identity, sibling-app roster).
 */
export function buildElevenLabsSystemBlock(appContext?: string): string {
  const addendum = appContext?.trim()
    ? `\n\nApp context:\n${sanitizeToolErrorText(appContext.trim()).slice(0, MAX_SYSTEM_ADDENDUM_CHARS)}`
    : "";
  return `${ELEVENLABS_SYSTEM_BLOCK_BEGIN}\n${ELEVENLABS_SYSTEM_CONTRACT}${addendum}\n${ELEVENLABS_SYSTEM_BLOCK_END}`;
}

/**
 * Remove any previous managed block (any version, even truncated by a
 * missing end marker) while preserving the user's own prompt text.
 */
export function stripElevenLabsSystemBlock(prompt: string): string {
  const begin = prompt.indexOf(ELEVENLABS_SYSTEM_BLOCK_BEGIN);
  if (begin === -1) return prompt;
  const end = prompt.indexOf(ELEVENLABS_SYSTEM_BLOCK_END, begin);
  const after =
    end === -1 ? "" : prompt.slice(end + ELEVENLABS_SYSTEM_BLOCK_END.length);
  // Re-run in case multiple stale blocks accumulated.
  return stripElevenLabsSystemBlock(`${prompt.slice(0, begin)}${after}`);
}

/**
 * Compose the dashboard-owned personality text with the managed block. The
 * user's text always rides first so it reads as the persona; the system
 * block anchors the operating contract beneath it.
 */
export function composeElevenLabsPrompt(
  remotePrompt: string,
  systemBlock: string,
): string {
  const user = stripElevenLabsSystemBlock(remotePrompt).trim();
  return user ? `${user}\n\n${systemBlock}` : systemBlock;
}
/**
 * ElevenLabs treats `prompt.tools` as the COMPLETE tool list (client +
 * system together); a separate `built_in_tools` map is ignored whenever
 * `tools` is present (live-verified 2026-07-13). System tools therefore
 * ride in the same array as the client-tool bridge.
 */
const SYSTEM_TOOLS = ["end_call", "skip_turn", "language_detection"].map(
  (name) => ({
    type: "system",
    name,
    description: "",
    params: { system_tool_type: name },
  }),
);

export interface MountElevenLabsRealtimeVoiceRoutesOptions extends Pick<
  MountRealtimeVoiceRoutesOptions,
  "instructions" | "getInstructions" | "resolveOrgId" | "executeTool"
> {
  /** @deprecated Configure the agent name in ElevenLabs. */
  agentName?: string;
  /** @deprecated Configure the conversational LLM in ElevenLabs. */
  llm?: string;
  /** @deprecated Configure language in ElevenLabs. */
  language?: string;
  /** @deprecated Configure the voice in ElevenLabs. */
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
    response_timeout_secs: VOICE_TOOL_TIMEOUT_SECS[tool.name] ?? 30,
  };
}

/**
 * The workspace owns the client-tool contract and the sentinel-delimited
 * system block inside the prompt. Personality text, voice, LLM, language,
 * turn-taking, privacy, and all other agent settings remain editable in
 * ElevenLabs. `prompt` is included only when the remote prompt is missing or
 * running a stale system block — and it is always composed from the freshly
 * fetched remote prompt so the user's own text is never overwritten.
 */
export function buildElevenLabsClientToolsPayload(input: {
  clientTools: Record<string, unknown>[];
  prompt?: string;
}): Record<string, unknown> {
  return {
    conversation_config: {
      agent: {
        prompt: {
          tools: [...input.clientTools, ...SYSTEM_TOOLS],
          ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
        },
      },
    },
  };
}

/**
 * Read the agent's current dashboard prompt so the managed block can be
 * composed around the user's own text. Returns null when the prompt cannot
 * be read — callers then push tools-only rather than risking a clobber.
 */
async function fetchElevenLabsAgentPrompt(input: {
  apiKey: string;
  agentId: string;
}): Promise<string | null> {
  try {
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/v1/convai/agents/${encodeURIComponent(input.agentId)}`,
      { headers: { "xi-api-key": input.apiKey } },
    );
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as {
      conversation_config?: {
        agent?: { prompt?: { prompt?: unknown } };
      };
    } | null;
    const prompt = body?.conversation_config?.agent?.prompt?.prompt;
    return typeof prompt === "string" ? prompt : "";
  } catch {
    return null;
  }
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
  lastPushedConfigHash?: string;
}

function readVoiceThreadId(event: H3Event): string | undefined {
  const value = getHeader(event, ELEVENLABS_VOICE_THREAD_HEADER);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return VOICE_THREAD_ID_SHAPE.test(trimmed) ? trimmed : undefined;
}

async function pushAgentConfig(input: {
  apiKey: string;
  state: ElevenLabsSessionState;
  configuredAgentId: string | undefined;
  payload: Record<string, unknown>;
}): Promise<{ agentId: string } | { error: string; status: number }> {
  const serialized = JSON.stringify(input.payload);
  const configHash = `${input.configuredAgentId ?? ""}:${serialized.length}:${serialized}`;
  const agentId = input.configuredAgentId;

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
    input.state.lastPushedConfigHash = configHash;
    return { agentId };
  }

  return {
    error:
      "Configure ELEVENLABS_AGENT_ID with the agent you manage in ElevenLabs before starting voice mode.",
    status: 409,
  };
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

        // Self-heal the managed system block on every mint: read the current
        // dashboard prompt, preserve the user's personality text, and include
        // the composed prompt only when the block is missing or stale. A
        // failed read degrades to tools-only — never clobber what we cannot
        // see.
        let composedPrompt: string | undefined;
        if (configuredAgentId) {
          const appContext =
            (await options.getInstructions?.(auth)) ?? options.instructions;
          const systemBlock = buildElevenLabsSystemBlock(
            appContext ?? undefined,
          );
          const remotePrompt = await fetchElevenLabsAgentPrompt({
            apiKey,
            agentId: configuredAgentId,
          });
          if (remotePrompt !== null) {
            const composed = composeElevenLabsPrompt(remotePrompt, systemBlock);
            if (composed !== remotePrompt) composedPrompt = composed;
          }
        }

        const payload = buildElevenLabsClientToolsPayload({
          clientTools,
          ...(composedPrompt !== undefined ? { prompt: composedPrompt } : {}),
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
            { threadId: readVoiceThreadId(event) },
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

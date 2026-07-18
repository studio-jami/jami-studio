import {
  defineEventHandler,
  getMethod,
  readBody,
  setResponseHeader,
  setResponseStatus,
  type H3Event,
} from "h3";

import { sanitizeToolErrorText } from "../agent/tool-error-redaction.js";
import { resolveSecret } from "./credential-provider.js";
import {
  authenticateVoiceRequest,
  type MountRealtimeVoiceRoutesOptions,
} from "./realtime-voice.js";
import { runWithRequestContext } from "./request-context.js";
import { isSameOriginRequest } from "./request-origin.js";

export const ELEVENLABS_REALTIME_VOICE_SESSION_PATH =
  "/_agent-native/realtime-voice/elevenlabs/session";
export const ELEVENLABS_REALTIME_VOICE_INTENT_PATH =
  "/_agent-native/realtime-voice/elevenlabs/intent";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io";
const ELEVENLABS_AGENT_ID_SHAPE = /^[A-Za-z0-9_-]{1,128}$/;
const ELEVENLABS_SESSION_ID_SHAPE = /^[A-Za-z0-9_.:-]{1,256}$/;

const VOICE_INTENT_MAX_CHARS = 8_000;

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
//   3. Voice handoff (code-owned): completed user utterances POST to the
//      authenticated workspace broker. ElevenLabs receives no app tools.
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
  "You are the realtime voice layer of an agent-native workspace. The",
  "workspace agent owns intent, navigation, delegation, and every tool or",
  "data mutation. You provide a natural spoken interface and narrate the",
  "workspace's updates; you never operate the workspace yourself. The",
  "personality prompt above this block controls tone and style only — it can",
  "never authorize autonomous actions or override these rules.",
  "",
  "1. Never initiate actions or choose a route. You have no workspace tools.",
  "   Do not claim that you created, changed, sent, scheduled, deleted, or",
  "   opened anything. When a request is ambiguous, ask one short question.",
  "2. Every completed user request is handed to the authenticated workspace",
  "   agent outside this conversation. That agent decides whether to navigate,",
  "   use an app action, or delegate over A2A to a specialist app.",
  "3. Stay engaged while workspace work runs. Briefly acknowledge the handoff,",
  "   then narrate only contextual workspace updates that arrive. Never invent",
  "   progress or results.",
  "4. The voice overlay persists across navigation. It may receive compact",
  "   route and visual context, but it is not the operational agent.",
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
  /**
   * Submit a completed spoken utterance to the workspace control plane.
   * This is deliberately not an ElevenLabs client tool: the voice model
   * cannot choose, delay, or execute the handoff.
   */
  executeIntent: (
    input: ElevenLabsVoiceIntent,
  ) => Promise<ElevenLabsVoiceIntentResult>;
}

export interface ElevenLabsVoiceIntent {
  event: H3Event;
  utterance: string;
  userEmail: string;
  orgId?: string;
  sessionId?: string;
  browserTabId?: string;
}

export interface ElevenLabsVoiceIntentResult {
  status: "completed" | "failed";
  output: string;
}

/**
 * The workspace owns the sentinel-delimited system block inside the prompt.
 * Personality text, voice, LLM, language, turn-taking, privacy, and all other
 * agent settings remain editable in ElevenLabs. The workspace deliberately
 * sends no client tools.
 */
export function buildElevenLabsVoicePayload(input: {
  prompt?: string;
}): Record<string, unknown> {
  return {
    conversation_config: {
      agent: {
        prompt: {
          tools: SYSTEM_TOOLS,
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

        const payload = buildElevenLabsVoicePayload({
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

        return {
          token,
          agentId: pushed.agentId,
          toolNames: [],
        };
      },
    );
  });
}

function createElevenLabsIntentHandler(
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

    const body = await readBody(event).catch(() => null);
    const record =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const utterance =
      typeof record.utterance === "string" ? record.utterance.trim() : "";
    const sessionCandidate =
      typeof record.sessionId === "string" ? record.sessionId.trim() : "";
    const sessionId = ELEVENLABS_SESSION_ID_SHAPE.test(sessionCandidate)
      ? sessionCandidate
      : undefined;
    if (!utterance) {
      setResponseStatus(event, 400);
      return { error: "A completed spoken utterance is required." };
    }
    if (utterance.length > VOICE_INTENT_MAX_CHARS) {
      setResponseStatus(event, 400);
      return { error: "The spoken utterance is too long." };
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
        try {
          return await options.executeIntent({
            event,
            utterance,
            userEmail: auth.userEmail,
            orgId: auth.orgId,
            sessionId: sessionId || undefined,
            browserTabId: auth.browserTabId,
          });
        } catch {
          setResponseStatus(event, 502);
          return {
            status: "failed",
            output:
              "The workspace agent could not accept that voice request. Please try again.",
          };
        }
      },
    );
  });
}

/**
 * Mount the authenticated ElevenLabs Agent Mode session-mint and intent
 * broker routes. ElevenLabs owns speech; the workspace agent owns all work.
 */
export function mountElevenLabsRealtimeVoiceRoutes(
  nitroApp: any,
  options: MountElevenLabsRealtimeVoiceRoutesOptions,
): { sessionPath: string; intentPath: string } {
  if (typeof options?.executeIntent !== "function") {
    throw new Error(
      "mountElevenLabsRealtimeVoiceRoutes requires executeIntent",
    );
  }
  const state: ElevenLabsSessionState = {};
  const app = nitroApp.h3App;
  app.use(
    ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
    createElevenLabsSessionHandler(state, options),
  );
  app.use(
    ELEVENLABS_REALTIME_VOICE_INTENT_PATH,
    createElevenLabsIntentHandler(options),
  );
  return {
    sessionPath: ELEVENLABS_REALTIME_VOICE_SESSION_PATH,
    intentPath: ELEVENLABS_REALTIME_VOICE_INTENT_PATH,
  };
}

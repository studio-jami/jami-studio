import ReactDOMServer from "react-dom/server.browser";
import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";
const { renderToReadableStream } = ReactDOMServer;
import { isbot } from "isbot";

export const streamTimeout = 5_000;

const AGENT_NAMESPACE = "/_agent-native";

/**
 * The docs site ships no agent endpoints, but legacy/framework clients still
 * poll /_agent-native/auth/session and /_agent-native/events (and open an SSE
 * stream). On Vercel the React Router server entry renders every unmatched
 * path — including a loader-thrown 404 — into a full HTML document per hit
 * with `cache-control: max-age=0`, which is the origin CPU burn.
 *
 * Short-circuit the namespace here, before any rendering, with a tiny
 * cacheable 404 (and a terminal 410 + connection close for EventSource).
 */
function agentNamespaceResponse(request: Request): Response | null {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  const isAgentPath =
    pathname === AGENT_NAMESPACE || pathname.startsWith(`${AGENT_NAMESPACE}/`);
  if (!isAgentPath) return null;

  const wantsEventStream = (request.headers.get("accept") ?? "").includes(
    "text/event-stream",
  );
  if (wantsEventStream) {
    return new Response("Gone: no agent endpoints on this site", {
      status: 410,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control":
          "public, max-age=86400, stale-while-revalidate=2592000",
        connection: "close",
      },
    });
  }

  return Response.json(
    { error: "Not found. This site has no agent endpoints." },
    {
      status: 404,
      headers: {
        "cache-control":
          "public, s-maxage=86400, stale-while-revalidate=2592000",
      },
    },
  );
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  const agentResponse = agentNamespaceResponse(request);
  if (agentResponse) return agentResponse;
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  const userAgent = request.headers.get("user-agent");
  const waitForAll = (userAgent && isbot(userAgent)) || routerContext.isSpaMode;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), streamTimeout);

  try {
    const body = await renderToReadableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        signal: abortController.signal,
        onError(error: unknown) {
          if (!abortController.signal.aborted) {
            responseStatusCode = 500;
            console.error(error);
          }
        },
      },
    );

    if (waitForAll) {
      await body.allReady;
    }

    responseHeaders.set("Content-Type", "text/html");
    return new Response(body, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

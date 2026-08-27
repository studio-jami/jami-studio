import type { LoaderFunctionArgs } from "react-router";

/**
 * Catch-all for the docs deployment's React Router (Vercel) surface.
 *
 * The docs site ships no agent endpoints, but legacy/framework clients still
 * poll /_agent-native/auth/session and /_agent-native/events (and open an SSE
 * stream). Without this route those requests fall through to the root 404
 * error boundary, which renders a full SSR HTML document per hit with
 * `cache-control: max-age=0` — the CPU burn on Vercel.
 *
 * This returns a tiny, cacheable 404 instead, and a terminal 410 for
 * `Accept: text/event-stream` so old EventSource clients stop reconnecting.
 * Any other unmatched path surfaces the normal 404 document.
 */
const AGENT_NAMESPACE = "/_agent-native";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const isAgentPath =
    pathname === AGENT_NAMESPACE || pathname.startsWith(`${AGENT_NAMESPACE}/`);

  if (!isAgentPath) {
    throw new Response("Not Found", { status: 404 });
  }

  const wantsEventStream = (request.headers.get("accept") ?? "").includes(
    "text/event-stream",
  );

  if (wantsEventStream) {
    return new Response("Gone: no agent endpoints on this site", {
      status: 410,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        // Identical body for the whole namespace → cache at the edge.
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
        // Identical body for every path in the namespace → cache at the edge
        // so repeat hits never reach the origin.
        "cache-control":
          "public, s-maxage=86400, stale-while-revalidate=2592000",
      },
    },
  );
}

export default function CatchAll() {
  return null;
}

import {
  getRequestHeader,
  getRequestURL,
  setHeader,
  setResponseStatus,
  type H3Event,
} from "h3";

/**
 * Docs ship no agent surface — no agent chat, no sessions, no DB routes.
 * Any request under the /_agent-native namespace is answered with a cheap,
 * edge-cacheable 404 here instead of falling through to the SSR catch-all
 * (a full React Router document render per hit — the poll storm that was
 * burning the docs origin's CPU on Vercel).
 *
 * This is a defensive backstop. The real fix is that the docs client no longer
 * ships any agent runtime, so no browser polls these endpoints; this route
 * turns any stray / legacy / crawler hits into a tiny cached 404.
 */
export function agentNamespaceGuard(event: H3Event): string {
  const pathname = getRequestURL(event).pathname;
  if (
    pathname !== "/_agent-native" &&
    !pathname.startsWith("/_agent-native/")
  ) {
    // Not in the namespace (shouldn't happen for the routes wired to this
    // handler); surface a 500 rather than silently 404 a real page.
    setResponseStatus(event, 500);
    return "Internal error";
  }

  // SSE consumers (EventSource) keep reconnecting on any non-success. Return a
  // terminal error *and* close the stream immediately so a legacy client stops
  // retrying instead of holding a slow-opened socket.
  if (
    (getRequestHeader(event, "accept") ?? "").includes(
      "text/event-stream",
    )
  ) {
    setResponseStatus(event, 410);
    setHeader(event, "content-type", "text/plain; charset=utf-8");
    setHeader(
      event,
      "cache-control",
      "public, max-age=86400, stale-while-revalidate=2592000",
    );
    setHeader(event, "connection", "close");
    return "Gone: no agent endpoints on this site";
  }

  setResponseStatus(event, 404);
  setHeader(event, "content-type", "application/json; charset=utf-8");
  // Identical body for every path in the namespace → cache at the edge so
  // repeat hits never reach the origin.
  setHeader(
    event,
    "cache-control",
    "public, s-maxage=86400, stale-while-revalidate=2592000",
  );
  return JSON.stringify({
    error: "Not found. This site has no agent endpoints.",
  });
}

export default agentNamespaceGuard;

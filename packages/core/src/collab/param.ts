/**
 * Router-param helper for collab routes.
 *
 * Collab docIds are structured (`plan:<id>:<block>`) and go into the URL
 * path. Well-behaved HTTP clients percent-encode path segments
 * (`encodeURIComponent(docId)` → `plan%3A...`), but h3 router params are NOT
 * decoded by default — resolvers then see the encoded form, prefix checks
 * (`docId.startsWith("plan:")`) fail, and the request 404s even though the
 * raw-colon form works. Decode the param, tolerating docIds that contain a
 * literal `%` (malformed escape sequences fall back to the raw value).
 */
import { getRouterParam } from "h3";
import type { H3Event } from "h3";

export function getCollabDocIdParam(event: H3Event): string | undefined {
  const raw = getRouterParam(event, "docId");
  if (!raw) return raw ?? undefined;
  if (!raw.includes("%")) return raw;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

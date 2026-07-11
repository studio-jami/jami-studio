/**
 * Platform-aware per-request chunk upload cap.
 *
 * Netlify functions buffer request bodies with a 6 MB cap, and binary bodies
 * are base64-encoded by the gateway (effective cap ~4.5 MB) — so Netlify
 * deployments must keep chunks at 4 MiB. Every other runtime (local dev,
 * Cloudflare workerd, Vercel) accepts larger bodies, and S3-compatible
 * multipart uploads NEED 5 MiB parts (see s3-upload-provider), so the cap is
 * lifted to 5 MiB + slack there.
 */

const NETLIFY_MAX_CHUNK_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_CHUNK_BYTES = 5 * 1024 * 1024 + 256 * 1024;

export function maxChunkUploadBytes(): number {
  return process.env.NETLIFY
    ? NETLIFY_MAX_CHUNK_BYTES
    : DEFAULT_MAX_CHUNK_BYTES;
}

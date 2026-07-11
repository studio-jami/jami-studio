import { enabledFlag } from "./env-flags.js";
import { requiresConfiguredVideoStorage } from "./video-storage.js";

// Streaming resumable uploads are deployment opt-in while the provider/finalize
// path hardens — EXCEPT when the deployment cannot buffer chunks in SQL at all
// (production / remote database), where streaming to the provider is the only
// viable upload path and gating it behind the opt-in flag guarantees every
// upload dies with a 409. Set CLIPS_ENABLE_STREAMING_UPLOAD=1 to opt in on
// SQL-scratch-capable deployments; CLIPS_DISABLE_STREAMING_UPLOAD=1 still
// forces the buffered fallback everywhere.
export function isStreamingUploadDisabled(): boolean {
  return enabledFlag(process.env.CLIPS_DISABLE_STREAMING_UPLOAD);
}

export function shouldEnableStreamingUpload(args: {
  client?: string | null;
  mimeType?: string | null;
}): boolean {
  if (isStreamingUploadDisabled()) return false;
  const optedIn = enabledFlag(process.env.CLIPS_ENABLE_STREAMING_UPLOAD);
  if (!optedIn && !requiresConfiguredVideoStorage()) return false;

  const mimeType = (args.mimeType ?? "").split(";")[0]?.trim().toLowerCase();
  return !mimeType || mimeType.startsWith("video/");
}

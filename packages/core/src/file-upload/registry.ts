import { getScopedGlobal } from "../shared/global-scope.js";
import { builderFileUploadProvider } from "./builder.js";
import type {
  FileUploadInput,
  FileUploadProvider,
  FileUploadResult,
} from "./types.js";

// Why globalThis: in dev (Vite HMR) and in some Nitro/Rollup bundle splits,
// this module can be evaluated more than once — the plugin file that
// registers a provider lands in one module instance and the request handler
// that reads providers lands in another, so the call site sees an empty map
// even though `registerFileUploadProvider` succeeded. Pinning the singletons
// on `globalThis` guarantees one set of providers per Node process,
// independent of how the bundler split the chunks.
//
// Why scope-aware + lazy: on a unified workspace deployment every app shares
// one isolate, so a raw globalThis pin would merge every app's providers into
// one map (an /assets upload was served by clips' provider). The keys are
// namespaced per app via `getScopedGlobal`, resolved lazily on every access
// so the scope id set by the generated worker entry is always honored.
function getProviders(): Map<string, FileUploadProvider> {
  return getScopedGlobal(
    "agent-native.file-upload.providers",
    () => new Map<string, FileUploadProvider>(),
  );
}
function getWarnedFallbackRef(): { value: boolean } {
  return getScopedGlobal("agent-native.file-upload.warned-fallback", () => ({
    value: false,
  }));
}

/**
 * Register a file upload provider. Call from a server plugin or app
 * bootstrap. Idempotent per id — later calls with the same id replace.
 */
export function registerFileUploadProvider(provider: FileUploadProvider): void {
  getProviders().set(provider.id, provider);
}

export function unregisterFileUploadProvider(id: string): void {
  getProviders().delete(id);
}

export function listFileUploadProviders(): FileUploadProvider[] {
  return [...getProviders().values()];
}

/**
 * Returns the first configured provider, checking user-registered ones first
 * and falling back to the built-in Builder.io provider when its env is set.
 * Returns `null` when nothing is configured — callers should then use the
 * SQL fallback.
 */
export function getActiveFileUploadProvider(): FileUploadProvider | null {
  for (const provider of getProviders().values()) {
    if (provider.isConfigured()) return provider;
  }
  if (builderFileUploadProvider.isConfigured()) {
    return builderFileUploadProvider;
  }
  return null;
}

export async function getActiveFileUploadProviderForRequest(): Promise<FileUploadProvider | null> {
  for (const provider of getProviders().values()) {
    if (provider.isConfigured()) return provider;
    if (provider.isConfiguredForRequest) {
      try {
        if (await provider.isConfiguredForRequest()) return provider;
      } catch {
        // Treat failed scoped credential lookups as unavailable. The upload
        // call will surface real provider errors after a provider is selected.
      }
    }
  }
  if (builderFileUploadProvider.isConfigured()) {
    return builderFileUploadProvider;
  }
  return null;
}

/**
 * Upload a file via the active provider, or `null` if no provider is
 * configured. Callers use `null` as the signal to fall back to SQL
 * storage. On the first fallback we log a one-time warning because
 * storing files in SQL is not optimal for production.
 */
export async function uploadFile(
  input: FileUploadInput,
): Promise<FileUploadResult | null> {
  const provider = await getActiveFileUploadProviderForRequest();
  // User-registered providers (S3, etc.) may be configured by sync runtime
  // state or request-scoped DB secrets. Builder still gets an explicit async
  // credential check below because its sync isConfigured() only checks env.
  if (provider && provider !== builderFileUploadProvider) {
    return provider.upload(input);
  }

  // Resolve credentials asynchronously (works when request context is set
  // via runWithRequestContext — actions always have one via action-routes.ts).
  // Two separate try-catch blocks ensure a real upload failure is never
  // silently swallowed as a "no credentials" case.
  let builderKey: string | null = null;
  try {
    const { resolveBuilderPrivateKey } =
      await import("../server/credential-provider.js");
    builderKey = await resolveBuilderPrivateKey();
  } catch (err) {
    // DB unavailable or credential store not ready — can't resolve key.
    // Log and fall through to the SQL fallback below.
    console.warn(
      "[agent-native] Builder credential check failed:",
      err instanceof Error ? err.message : String(err),
    );
  }

  if (builderKey) {
    // Credentials confirmed — attempt the upload. Real errors (network,
    // API, rate-limit) propagate to the caller; do NOT catch them here.
    return await builderFileUploadProvider.upload(input);
  }

  const warnedFallbackRef = getWarnedFallbackRef();
  if (!warnedFallbackRef.value) {
    warnedFallbackRef.value = true;
    console.warn(
      "[agent-native] No file upload provider configured. " +
        "Connect or reconnect Builder.io in Settings → File uploads, " +
        "or register a custom provider (S3, R2, GCS, …) via registerFileUploadProvider().",
    );
  }
  return null;
}

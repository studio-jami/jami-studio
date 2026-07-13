/**
 * Optional AI SDK provider packages shared between the deploy build and the
 * agent engine registry.
 *
 * These are optional peer dependencies with LITERAL dynamic import()
 * specifiers in ai-sdk-engine (so bundlers include provider packages when
 * present). The deploy build stubs the uninstalled ones (worker bundles) and
 * bakes the installed ones into the artifact via the env marker below; the
 * engine registry's install check consults the marker inside bundled
 * artifacts where a runtime `require.resolve` probe cannot see inlined
 * modules.
 *
 * Dependency-free on purpose — imported from both the deploy layer and the
 * agent engine layer.
 */
export const OPTIONAL_AI_SDK_MODULES = [
  "ai",
  "@ai-sdk/anthropic",
  "@ai-sdk/openai",
  "@ai-sdk/google",
  "@ai-sdk/groq",
  "@ai-sdk/mistral",
  "@ai-sdk/cohere",
  "@openrouter/ai-sdk-provider",
  "ai-sdk-ollama",
];

/**
 * Env key whose value is a comma-separated list of the optional AI SDK
 * provider packages that were installed (and therefore bundled) when this
 * app's artifact was built. Baked by the unified deploy entries as a
 * module-graph env default (per-app value — never shared `process.env`).
 * Real env wins when set, so a platform that bakes plain env (per-function
 * isolation) can use the same key.
 */
export const BUNDLED_AI_SDK_MODULES_ENV_KEY =
  "AGENT_NATIVE_BUNDLED_AI_SDK_MODULES";

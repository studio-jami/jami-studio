# Jami Studio Capability Deep Dive

Date: 2026-07-08

## Summary

The source is already built around the shape Jami Studio wants: a workspace control plane, agent-first operations, composable apps, provider swappability, background subagents, generated UI, native chat widgets, MCP/A2A bridges, observability, and runtime resources.

The main product bet should not start by rebuilding orchestration. The strongest path is to use Dispatch as the control plane, eventually present it as Orchestra when branding is ready, and extend around the existing seams.

The largest gap against the Jarvis-like vision is not orchestration. It is the voice-first realtime layer: continuous interruptible speech, spoken output, wake/barge-in behavior, and optional video avatar presence. The framework already has voice dictation and realtime transcription pieces, but not a full duplex realtime voice agent.

## Capability Map

### Workspace Control Plane

Native target: Dispatch.

Dispatch already acts as the workspace control plane:

- central workspace shell
- cross-app delegation
- secret vault
- workspace resources
- MCP gateway
- approval flow
- Dreams/improvement reports
- messaging/inbox hooks
- app discovery and creation

Relevant docs and source:

- `packages/core/docs/content/dispatch.mdx`
- `packages/core/docs/content/template-dispatch.mdx`
- `packages/core/docs/content/multi-app-workspace.mdx`
- `packages/dispatch/src/actions/*`
- `packages/dispatch/src/server/plugins/integrations.ts`

Recommendation: keep Dispatch mechanically intact for now. Use "Orchestra" as a product concept first, then rename package/UI/routes later only when publishing and migration risk are understood.

### Actions

Native target: `defineAction`.

Actions are the system contract. One action can be used by:

- the agent as a tool
- React via `useActionQuery` / `useActionMutation`
- HTTP
- CLI
- MCP
- A2A
- native chat widgets
- embedded MCP Apps

Relevant docs and source:

- `packages/core/docs/content/actions.mdx`
- `.agents/skills/actions/SKILL.md`
- `packages/core/src/action.ts`

Recommendation: every meaningful operation should enter through actions unless there is a documented lower-level framework seam. Do not create REST wrappers around actions.

### Cross-App Orchestration

Native targets: Dispatch, A2A, `call-agent`, `invokeAgent`, agent mentions.

The preferred architecture is many focused apps and agents, not one giant workspace app. Dispatch discovers workspace apps as A2A peers and routes work across them.

Relevant docs:

- `packages/core/docs/content/a2a-protocol.mdx`
- `packages/core/docs/content/agent-mentions.mdx`
- `.agents/skills/composable-mini-apps/SKILL.md`
- `.agents/skills/a2a-protocol/SKILL.md`

Recommendation: domain workspaces should compose small apps and headless agents. Pass artifact ids, URLs, and bounded summaries between apps instead of copying large payloads through prompts.

### Subagents And Background Work

Native targets: Agent Teams, custom agents, durable background runs, recurring jobs.

The framework supports:

- `agent-teams` spawn/status/read-result/send/list
- custom agents in `agents/*.md`
- background chat runs
- durable background hosted runs
- recurring jobs in `jobs/*.md`
- event-triggered automations
- code-agent harnesses

Relevant docs and source:

- `packages/core/docs/content/agent-teams.mdx`
- `packages/core/docs/content/durable-background-runs.mdx`
- `packages/core/docs/content/harness-agents.mdx`
- `.agents/skills/delegate-to-agent/SKILL.md`
- `.agents/skills/recurring-jobs/SKILL.md`
- `packages/core/src/server/agent-teams.ts`

Recommendation: the central assistant should orchestrate subagents through these primitives. Avoid a custom job runner unless the built-in scheduler/run-manager cannot express the case.

### Chat Surfaces

Native targets: `AgentSidebar`, `AgentPanel`, `AgentChatSurface`, `AssistantChat`, `AgentChatRuntime`.

The UI is layered well. We can use stock surfaces where possible and drop down only when needed:

- sidebar for normal apps
- panel/page for workspace views
- `AssistantChat` for custom chrome
- `AgentChatRuntime` for external or realtime runtimes
- `sendToAgentChat()` for product UI handing work to the agent

Relevant docs and source:

- `packages/core/docs/content/agent-surfaces.mdx`
- `packages/core/docs/content/drop-in-agent.mdx`
- `packages/core/docs/content/components.mdx`
- `packages/core/src/client/AssistantChat.tsx`
- `packages/core/src/client/chat/runtime.ts`

Recommendation: the voice-first shell should still drive the same chat/action/thread runtime. Start from `AssistantChat` and `AgentChatRuntime`, not a parallel chat stack.

### Native And Generated UI

Native targets: native chat widgets, Generative UI, Extensions, MCP Apps.

The framework has three good UI lanes:

- native widgets for predictable rendered results
- generated inline extensions for one-off interactive UI
- MCP Apps / embedded routes for durable app-quality workflows

Relevant docs:

- `packages/core/docs/content/native-chat-ui.mdx`
- `packages/core/docs/content/generative-ui.mdx`
- `packages/core/docs/content/mcp-apps.mdx`
- `packages/core/docs/content/components.mdx`

Recommendation: use native widgets for repeatable structured results, generated inline UI for flexible one-off controls, and real app routes for durable workflows. Do not turn generated UI into the primary app architecture.

### Voice

Native targets: composer voice dictation, Google realtime transcription route, voice cleanup, context pack.

Current native capability:

- mic in the shared composer
- browser speech fallback
- batch transcription providers
- Google realtime transcription path
- cleanup preferences
- context-aware voice guidance
- live interim/final transcript callbacks
- dictation cancel/stop state

Relevant docs and source:

- `packages/core/docs/content/voice-input.mdx`
- `.agents/skills/voice-transcription/SKILL.md`
- `packages/core/src/client/composer/useVoiceDictation.ts`

Current gap:

- no full duplex realtime voice agent loop
- no native TTS layer identified
- no wake word or always-listening mode identified
- no barge-in/interruptible spoken output layer identified
- no video avatar feed identified

Recommendation: treat voice-first as the main extension program, not a refactor of the existing app system. The first version should use existing composer/transcription and `sendToAgentChat()`. The later version should be a dedicated realtime `AgentChatRuntime` adapter that can stream audio/text/events, cancel turns, and preserve the normal action/tool/widget path.

### Provider And Model Swapping

Native targets: `AgentEngine` registry, AI SDK engines, app model defaults, user/org API keys.

Current engines include Builder/Jami gateway, direct Anthropic, and AI SDK providers for OpenAI, OpenRouter, Google, Groq, Mistral, Cohere, and Ollama.

Relevant source:

- `packages/core/src/agent/engine/registry.ts`
- `packages/core/src/agent/engine/builtin.ts`
- `packages/core/src/agent/model-config.ts`
- `packages/core/src/agent/app-model-defaults.ts`
- `packages/core/src/server/agent-engine-api-key-route.ts`

Recommendation: do not hardcode one provider path. Google credits can be a default operational preference, but the product architecture should remain engine/provider-neutral.

### Provider APIs And Data Work

Native targets: provider API substrate, data programs, run-code, staged datasets.

The framework already has a strong "don't build one action per endpoint" answer:

- `provider-api-catalog`
- `provider-api-docs`
- `provider-api-request`
- provider pagination helpers
- data programs for saved reusable joins/rollups
- staged datasets for large responses

Relevant docs:

- `packages/core/docs/content/data-programs.mdx`
- `.agents/skills/actions/SKILL.md`

Recommendation: build first-class actions only for common shortcuts and ergonomic workflows. For broad provider coverage, use the provider API substrate.

### Workspace Resources, Memory, Skills, Custom Agents

Native targets: SQL-backed workspace resources.

The workspace model already supports:

- AGENTS.md
- instructions
- skills
- context
- custom agents
- MCP server configs
- workspace/shared/personal scopes
- app overrides

Relevant docs:

- `packages/core/docs/content/workspace.mdx`
- `packages/core/docs/content/multi-app-workspace.mdx`

Recommendation: operating instructions, durable preferences, agent profiles, and cross-app context should live in resources, not hardcoded app prompts.

### Connections And Secrets

Native targets: Dispatch vault, workspace connections, grants.

The framework separates connection metadata from secret values and grants access per app.

Relevant docs:

- `packages/core/docs/content/workspace-connections.mdx`
- `packages/core/docs/content/dispatch.mdx`

Recommendation: app installs should request access to workspace connections. Do not copy provider tokens into app configs or generated code.

### Observability, Evals, Tracking

Native targets: agent observability, CI evals, tracking, session replay, Sentry, OTel export.

The stack already has:

- automatic agent run traces
- LLM call spans
- tool call spans
- token/cost/latency capture
- deterministic evals
- sampled LLM-as-judge evals
- thumbs feedback
- frustration index
- experiments
- ObservabilityDashboard
- server-side product analytics fan-out
- session replay
- optional OTel export
- Sentry integration

Relevant docs and source:

- `packages/core/docs/content/observability.mdx`
- `packages/core/docs/content/tracking.mdx`
- `.agents/skills/observability/SKILL.md`
- `packages/core/src/observability/*`

Recommendation: for dogfooding and early hosted planning, wire the native dashboard and conservative capture settings first. Export to Langfuse/Datadog/Grafana only after local trace quality is proven.

### UI Adaptation

Native targets: app-local UI adapters, Toolkit, shared components.

The UI layer supports app-local wrappers around reusable toolkit primitives. This is the correct seam for branding and product feel.

Relevant docs:

- `packages/core/docs/content/toolkit-app-adapters.mdx`
- `packages/core/docs/content/components.mdx`

Recommendation: do not fork core UI primitives early. Use app-local adapters and workspace-level shared packages first.

## Extension Seams To Prefer

- Workspace app structure: `apps/*` plus `packages/shared`.
- Control plane UI: `app/dispatch-extensions.tsx` for Dispatch-specific additions.
- Operations: `actions/*.ts` with `defineAction`.
- Cross-app work: A2A and `call-agent`.
- Subagent work: Agent Teams and custom `agents/*.md`.
- Background work: `jobs/*.md`, event automations, durable background runs.
- Provider coverage: provider API catalog/docs/request.
- Provider auth: workspace connections and Dispatch vault.
- Model/provider changes: `registerAgentEngine`, app model defaults, user/org keys.
- Chat UI: `AssistantChat`, `AgentChatSurface`, `PromptComposer`.
- External realtime chat: `AgentChatRuntime`.
- Generated UI: inline extensions and durable extensions.
- Native chat result UI: `chatUI.renderer` and `registerActionChatRenderer`.
- Context: `useAgentRouteState`, `view-screen`, `navigate`, selection state.
- Sync: `useDbSync`, `useActionQuery`, `useActionMutation`.
- Guardrails: processors and TripWire aborts.
- Code agents: AgentHarness and existing code-agent runners.
- Integration recipes: `agent-native add` blueprint installer.

## Do Not Handroll

- Do not build REST endpoints for app data when an action can express it.
- Do not direct-call LLMs from UI; route through agent chat or server-side actions.
- Do not build a separate orchestration bus before exhausting Dispatch/A2A/Agent Teams.
- Do not copy provider data between apps when a provider-owning app can answer over A2A.
- Do not copy secrets into app files; use vault/connections/grants.
- Do not make Dispatch standalone; the docs explicitly frame it as workspace-first.
- Do not use generated UI as a replacement for durable app routes.
- Do not build a custom analytics/LLM trace system before using native observability.
- Do not rename packages/routes as an early branding move.

## Vision Fit

### Strong Fit Now

- workspace with Dispatch as central control plane
- familiar app UI plus agent sidebar/panel
- app-to-app orchestration
- background subagents
- provider-neutral model configuration
- MCP gateway for external agents
- generated UI and native chat components
- installable standalone domain apps
- dogfooding with local SQL-backed observability

### Partial Fit

- voice input exists, but it is dictation-oriented
- realtime transcription exists, but not a full realtime agent session
- background runs exist, but product flows still need careful UX around run state and user interruption
- Dreams exist as improvement reports, but need dogfooding before we lean on them for self-improvement workflow

### Real Gaps

- full duplex realtime speech agent
- spoken response/TTS layer
- wake word / always-listening mode
- barge-in interruption over generated speech
- optional video avatar feed
- voice-first command model across apps
- product-ready "Orchestra" branding and navigation

## Recommended Development Path

1. Keep source-sync resting and do not modify upstream architecture yet.
2. Create the focused Hummingbird install plan before putting anything in that repo.
3. Stand up an official multi-app workspace with Dispatch and a representative full suite.
4. Configure keys through settings, vault, and workspace connections, not source files.
5. Add observability/dashboard routes where missing and verify agent traces.
6. Dogfood core flows: chat, voice dictation, Dispatch app discovery, A2A calls, MCP connector, generated UI, native widgets, Agent Teams, recurring jobs, data programs.
7. Stand up standalone installs for representative domain apps to understand isolation.
8. Only after dogfooding, decide on branding changes and the Dispatch-to-Orchestra migration shape.
9. Plan voice-first as a dedicated extension program around `AgentChatRuntime`, not as a rewrite of Dispatch or the app framework.

## Near-Term Research Questions

- Which first-party templates belong in the initial workspace suite?
- Which apps must be standalone-tested before brand or runtime changes?
- Which realtime voice provider should be the first adapter target?
- Does the existing run cancellation path satisfy voice interruption requirements?
- Should avatar/video be a first-party feature or an integration surface?
- Which observability capture flags are safe for internal dogfooding?
- How should "Orchestra" appear first: product language, route label, app name, or package rename?


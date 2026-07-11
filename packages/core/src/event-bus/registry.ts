/**
 * In-process registry of event definitions.
 *
 * Integrations and templates call `registerEvent()` at module load to declare
 * the event types they emit. The bus uses these definitions to validate
 * payloads, and the Automations UI lists them so users can build triggers.
 */

import { z } from "zod";

import { getScopedGlobal } from "../shared/global-scope.js";
import type { EventDefinition } from "./types.js";

// Pin to globalThis so multiple ESM graphs (dev-mode Vite + Nitro, symlinks,
// dist/ vs src/) share a single registry. Same pattern as secrets/register.ts.
// Scope-aware + lazily resolved so unified workspace deployments (all apps in
// one isolate) keep per-app event definitions. See shared/global-scope.
function getEventRegistry(): Map<string, EventDefinition> {
  return getScopedGlobal(
    "agent-native.event-bus.registry",
    () => new Map<string, EventDefinition>(),
  );
}

/**
 * Register (or replace) an event definition.
 *
 * Subsequent registrations with the same `name` replace the previous
 * definition — later plugins can override built-in defaults.
 */
export function registerEvent(def: EventDefinition): void {
  if (!def || typeof def.name !== "string" || !def.name) {
    throw new Error("registerEvent: def.name is required");
  }
  if (typeof def.description !== "string" || !def.description) {
    throw new Error("registerEvent: def.description is required");
  }
  if (!def.payloadSchema) {
    throw new Error("registerEvent: def.payloadSchema is required");
  }
  getEventRegistry().set(def.name, def);
}

/** Return all registered events in registration order. */
export function listEvents(): EventDefinition[] {
  return Array.from(getEventRegistry().values());
}

/** Look up a single registered event by name. */
export function getEvent(name: string): EventDefinition | undefined {
  return getEventRegistry().get(name);
}

/** Test helper — clears the registry between runs. */
export function __resetEventRegistry(): void {
  getEventRegistry().clear();
  registerBuiltInEvents();
}

function registerBuiltInEvents(): void {
  registerEvent({
    name: "test.event.fired",
    description:
      "Developer test event — fired manually from the Automations UI or via the test-event action.",
    payloadSchema: z
      .object({ data: z.record(z.string(), z.unknown()).optional() })
      .optional() as unknown as EventDefinition["payloadSchema"],
  });

  registerEvent({
    name: "agent.turn.completed",
    description: "Fires after the agent completes a conversational turn.",
    payloadSchema: z.object({
      threadId: z.string().optional(),
      turnIndex: z.number().optional(),
      model: z.string().optional(),
    }) as unknown as EventDefinition["payloadSchema"],
  });
}

registerBuiltInEvents();

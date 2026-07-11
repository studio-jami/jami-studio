import { describe, expect, it } from "vitest";

import { validateRawToolInputWithoutCodegen } from "./production-agent.js";

// The non-codegen fallback validator used when Ajv cannot compile (workerd
// forbids `new Function` — issue: every raw-JSON-schema tool call on the
// unified Cloudflare worker was refused with "tool schema is invalid:
// Code generation from strings disallowed").
describe("validateRawToolInputWithoutCodegen", () => {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      count: { type: "number" },
    },
    required: ["title"],
  } as never;

  it("accepts an object with all required properties", () => {
    expect(
      validateRawToolInputWithoutCodegen(schema, { title: "Deck" }),
    ).toBeNull();
  });

  it("reports missing required properties", () => {
    expect(validateRawToolInputWithoutCodegen(schema, {})).toBe(
      "input must have required property 'title'",
    );
  });

  it("rejects non-object input for object schemas", () => {
    expect(validateRawToolInputWithoutCodegen(schema, "nope")).toBe(
      "input must be object",
    );
    expect(validateRawToolInputWithoutCodegen(schema, [1, 2])).toBe(
      "input must be object",
    );
  });

  it("stays permissive beyond required-key checks (Ajv coerces types)", () => {
    // Wrong TYPES pass here on purpose — the action's own parameter
    // validation is authoritative at execution time, and Ajv itself runs
    // with coerceTypes enabled.
    expect(
      validateRawToolInputWithoutCodegen(schema, { title: 42, count: "3" }),
    ).toBeNull();
  });

  it("passes everything through for non-object schemas", () => {
    expect(
      validateRawToolInputWithoutCodegen({ type: "string" } as never, 5),
    ).toBeNull();
    expect(validateRawToolInputWithoutCodegen(null as never, {})).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  cleanSubmitterEmail,
  isAgentNativeAnonymousEmail,
  publicSubmitterEmail,
} from "./submitter-email.js";

describe("submitter email helpers", () => {
  it("keeps real email hints", () => {
    expect(cleanSubmitterEmail(" user@example.com ")).toBe("user@example.com");
  });

  it("drops synthetic Agent Native anonymous owner emails", () => {
    expect(cleanSubmitterEmail("anon-abc123@jami.studio")).toBeNull();
    expect(cleanSubmitterEmail(" ANON-owner@jami.studio ")).toBeNull();
    expect(publicSubmitterEmail("anon-visitor@jami.studio")).toBeNull();
  });

  it("does not treat other jami.studio emails as anonymous owners", () => {
    expect(cleanSubmitterEmail("support@jami.studio")).toBe(
      "support@jami.studio",
    );
    expect(isAgentNativeAnonymousEmail("anon@jami.studio")).toBe(false);
  });
});

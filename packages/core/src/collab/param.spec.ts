import { describe, expect, it } from "vitest";

import { getCollabDocIdParam } from "./param.js";

function eventWithDocId(docId: string | undefined) {
  return {
    context: { params: docId === undefined ? {} : { docId } },
  } as never;
}

describe("getCollabDocIdParam", () => {
  it("returns raw docIds unchanged", () => {
    expect(getCollabDocIdParam(eventWithDocId("plan:abc:block"))).toBe(
      "plan:abc:block",
    );
  });

  it("decodes percent-encoded docIds (encodeURIComponent'd path segment)", () => {
    expect(
      getCollabDocIdParam(eventWithDocId(encodeURIComponent("plan:abc:block"))),
    ).toBe("plan:abc:block");
  });

  it("falls back to the raw value on malformed escapes", () => {
    expect(getCollabDocIdParam(eventWithDocId("doc%zz"))).toBe("doc%zz");
  });

  it("returns undefined for a missing param", () => {
    expect(getCollabDocIdParam(eventWithDocId(undefined))).toBeUndefined();
  });
});

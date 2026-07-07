import { beforeEach, describe, it, expect, vi } from "vitest";

import type { FormField, FormIntegration } from "../../shared/types.js";

const fetchMock = vi.hoisted(() => ({
  requests: [] as Array<{ url: string; payload: any }>,
}));

vi.mock("@agent-native/core/tools/url-safety", () => ({
  isBlockedToolUrl: () => false,
  ssrfSafeToolFetch: async (url: string, init: { body?: unknown }) => {
    fetchMock.requests.push({
      url,
      payload: JSON.parse(String(init.body ?? "{}")),
    });
    return { ok: true, status: 200 };
  },
}));

import { buildSlackPayload, fireIntegrations } from "./integrations.js";

const field: FormField = {
  id: "msg",
  type: "textarea",
  label: "Feedback",
  required: true,
};

function payload(overrides: Record<string, unknown> = {}) {
  return {
    formId: "form-1",
    formTitle: "Agent Native Feedback",
    responseId: "resp-1",
    fields: [field],
    data: { msg: "the comments are buggy" },
    submittedAt: "2026-06-23T12:00:00.000Z",
    ...overrides,
  };
}

function integration(type: FormIntegration["type"]): FormIntegration {
  return {
    id: type,
    type,
    name: type,
    enabled: true,
    url: `https://example.com/${type}`,
  };
}

/** Pull the trailing context block's mrkdwn text out of a Slack payload. */
function contextText(p: ReturnType<typeof buildSlackPayload>): string {
  const ctx = p.blocks.find((b) => b.type === "context") as
    | { elements: Array<{ text: string }> }
    | undefined;
  return ctx?.elements?.[0]?.text ?? "";
}

describe("buildSlackPayload page context", () => {
  beforeEach(() => {
    fetchMock.requests.length = 0;
  });

  it("shows real submitter emails in the context line", () => {
    const text = contextText(
      buildSlackPayload(payload({ submitterEmail: "user@example.com" })),
    );

    expect(text).toContain("by *user@example.com*");
  });

  it("hides synthetic anonymous Agent Native submitter emails", () => {
    const text = contextText(
      buildSlackPayload(
        payload({
          submitterEmail:
            "anon-ee79aaee-98e2-452a-9476-5205713803c0@jami.studio",
        }),
      ),
    );

    expect(text).not.toContain("@jami.studio");
    expect(text).not.toContain(" by *");
  });

  it("shows a friendly App label and a readable page link for a per-app host", () => {
    const text = contextText(
      buildSlackPayload(
        payload({ pageUrl: "https://plan.jami.studio/plans/plan-abc123" }),
      ),
    );
    expect(text).toContain("App: Plan");
    // The page is legible inline (host+path as link text), not hidden behind "open".
    expect(text).toContain(
      "Page: <https://plan.jami.studio/plans/plan-abc123|plan.jami.studio/plans/plan-abc123>",
    );
    expect(text).not.toContain("|open>");
  });

  it("title-cases hyphenated subdomains", () => {
    const text = contextText(
      buildSlackPayload(
        payload({ pageUrl: "https://analytics.jami.studio/dashboards/7" }),
      ),
    );
    expect(text).toContain("App: Analytics");
  });

  it("omits the App label for non-app hosts but keeps the page legible", () => {
    const text = contextText(
      buildSlackPayload(
        payload({ pageUrl: "https://www.jami.studio/pricing" }),
      ),
    );
    expect(text).not.toContain("App:");
    expect(text).toContain("www.jami.studio/pricing");
  });

  it("falls back gracefully when no page url is present", () => {
    const text = contextText(buildSlackPayload(payload()));
    expect(text).not.toContain("App:");
    expect(text).not.toContain("Page:");
  });

  it("scrubs synthetic anonymous submitter emails from integration payloads", async () => {
    await fireIntegrations(
      [
        integration("slack"),
        integration("discord"),
        integration("google-sheets"),
        integration("webhook"),
      ],
      payload({
        submitterEmail:
          "anon-ee79aaee-98e2-452a-9476-5205713803c0@jami.studio",
      }),
    );

    const payloadByType = new Map(
      fetchMock.requests.map((request) => [
        new URL(request.url).pathname.slice(1),
        request.payload,
      ]),
    );
    const slackText = contextText(payloadByType.get("slack"));
    const discordFields = payloadByType.get("discord").embeds[0].fields;

    expect(slackText).not.toContain("@jami.studio");
    expect(discordFields).not.toContainEqual(
      expect.objectContaining({ name: "Submitted by" }),
    );
    expect(payloadByType.get("google-sheets").submitterEmail).toBe("");
    expect(payloadByType.get("webhook").submitterEmail).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  isAgentNativeFirstPartyAppOrigin,
  isChatGptMcpSandboxOrigin,
  isLocalMcpEmbedOrigin,
  isMcpEmbedCorsOrigin,
  MCP_EMBED_CORS_ALLOW_HEADERS,
  shouldAllowMcpEmbedCredentials,
} from "./mcp-embed-headers.js";

describe("MCP embed headers", () => {
  it("allows frontend action-client headers from embedded apps", () => {
    expect(MCP_EMBED_CORS_ALLOW_HEADERS).toContain("X-Agent-Native-Frontend");
  });

  it("allows ChatGPT web-sandbox origins", () => {
    for (const origin of [
      "https://web-sandbox.oaiusercontent.com",
      "https://shakira-professor-conscious-frederick-trycloudflare-com.web-sandbox.oaiusercontent.com",
    ]) {
      expect(isChatGptMcpSandboxOrigin(origin)).toBe(true);
      expect(isMcpEmbedCorsOrigin(origin)).toBe(true);
    }
  });

  it("allows localhost origins for local MCP app QA", () => {
    for (const origin of [
      "http://localhost:9310",
      "http://127.0.0.1:9310",
      "http://[::1]:9310",
    ]) {
      expect(isLocalMcpEmbedOrigin(origin)).toBe(true);
      expect(isMcpEmbedCorsOrigin(origin)).toBe(true);
    }
  });

  it("allows known MCP product host origins without credentialed CORS", () => {
    for (const origin of [
      "https://claude.ai",
      "https://chatgpt.com",
      "https://chat.openai.com",
    ]) {
      expect(isMcpEmbedCorsOrigin(origin)).toBe(true);
      expect(shouldAllowMcpEmbedCredentials(origin)).toBe(false);
    }
  });

  it("allows first-party hosted apps to embed sibling MCP apps without credentialed CORS", () => {
    for (const origin of [
      "https://design.jami.studio",
      "https://assets.jami.studio",
      "https://team.design.jami.studio",
    ]) {
      expect(isAgentNativeFirstPartyAppOrigin(origin)).toBe(true);
      expect(isMcpEmbedCorsOrigin(origin)).toBe(true);
      expect(shouldAllowMcpEmbedCredentials(origin)).toBe(false);
    }
  });

  it("rejects non-sandbox oaiusercontent origins", () => {
    for (const origin of [
      "https://files.oaiusercontent.com",
      "https://example.oaiusercontent.com",
      "https://web-sandbox.oaiusercontent.com.evil.example",
      "https://localhost:9310",
      "http://example.com",
    ]) {
      expect(isChatGptMcpSandboxOrigin(origin)).toBe(false);
      expect(isMcpEmbedCorsOrigin(origin)).toBe(false);
    }
  });

  it("rejects agent-native suffix spoofs and non-hosted app origins", () => {
    for (const origin of [
      "https://jami.studio",
      "https://design.jami.studio.evil.example",
      "https://evil-jami.studio",
      "http://design.jami.studio",
      "https://design.jami.studio:4443",
    ]) {
      expect(isAgentNativeFirstPartyAppOrigin(origin)).toBe(false);
      expect(isMcpEmbedCorsOrigin(origin)).toBe(false);
    }
  });
});

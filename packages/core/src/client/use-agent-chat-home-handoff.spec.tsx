// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SIDEBAR_OPEN_KEY } from "./agent-sidebar-state.js";
import {
  consumeAgentChatHomeHandoff,
  markAgentChatHomeHandoff,
} from "./chat-view-transition.js";
import { useAgentChatHomeHandoffLinks } from "./use-agent-chat-home-handoff.js";

function installMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

function Probe() {
  useAgentChatHomeHandoffLinks({ storageKey: "chat", chatPath: "/" });
  const location = useLocation();
  return (
    <div>
      <a href="/dashboard" data-testid="chrome-link">
        Dashboard
      </a>
      <a href="/settings/connections" data-testid="settings-link">
        Settings
      </a>
      <a href="/api/export.csv" data-testid="api-link">
        API
      </a>
      <a href="/_agent-native/env-status" data-testid="framework-link">
        Framework
      </a>
      <a href="/favicon.svg" data-testid="asset-link">
        Asset
      </a>
      <div className="agent-panel-root">
        <a href="/dashboard" data-testid="chat-content-link">
          Chat content link
        </a>
      </div>
      <output data-testid="pathname">{location.pathname}</output>
    </div>
  );
}

function RecentOnlyProbe() {
  useAgentChatHomeHandoffLinks({
    storageKey: "chat",
    chatPath: "/",
    ttlMs: 5_000,
    requireActiveHandoff: true,
  });
  const location = useLocation();
  return (
    <div>
      <a href="/dashboard" data-testid="chrome-link">
        Dashboard
      </a>
      <output data-testid="pathname">{location.pathname}</output>
    </div>
  );
}

/**
 * Simulates the forms app mounted at `/forms` in a multi-app workspace:
 * the chat route is `/ask`, in-app anchors carry the `/forms` prefix
 * (React Router basename), and cross-app anchors point at sibling mounts.
 */
function MountedProbe() {
  useAgentChatHomeHandoffLinks({ storageKey: "forms", chatPath: "/ask" });
  const location = useLocation();
  return (
    <div>
      <a href="/forms/forms" data-testid="base-collision-link">
        All forms
      </a>
      <a href="/forms/settings" data-testid="mounted-settings-link">
        Settings
      </a>
      <a href="/mail" data-testid="cross-app-link">
        Mail
      </a>
      <output data-testid="pathname">{location.pathname}</output>
    </div>
  );
}

function renderProbe(element: React.ReactElement = <Probe />) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return { container, root };
}

function renderMountedProbe() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={["/ask"]}>
        <Routes>
          <Route path="*" element={<MountedProbe />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return { container, root };
}

function clickLink(container: HTMLElement, testId: string): MouseEvent {
  const link = container.querySelector(
    `[data-testid="${testId}"]`,
  ) as HTMLAnchorElement | null;
  if (!link) throw new Error(`Missing link ${testId}`);
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
  });
  act(() => {
    link.dispatchEvent(event);
  });
  return event;
}

function pathname(container: HTMLElement): string {
  const output = container.querySelector(
    '[data-testid="pathname"]',
  ) as HTMLOutputElement | null;
  return output?.value ?? output?.textContent ?? "";
}

describe("useAgentChatHomeHandoffLinks", () => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  beforeEach(() => {
    installMatchMedia();
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = null;
    container = null;
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("intercepts app chrome links from the chat route", () => {
    ({ container, root } = renderProbe());

    const event = clickLink(container, "chrome-link");

    expect(event.defaultPrevented).toBe(true);
    expect(pathname(container)).toBe("/dashboard");
    expect(window.localStorage.getItem(SIDEBAR_OPEN_KEY)).toBeNull();
    expect(consumeAgentChatHomeHandoff("chat")).toBe(true);
  });

  it.each([
    "api-link",
    "framework-link",
    "asset-link",
    "settings-link",
    "chat-content-link",
  ])("leaves %s alone", (testId) => {
    ({ container, root } = renderProbe());

    const event = clickLink(container, testId);

    expect(event.defaultPrevented).toBe(false);
    expect(pathname(container)).toBe("/");
    expect(consumeAgentChatHomeHandoff("chat")).toBe(false);
  });

  it("can require a recent chat marker before intercepting chrome links", () => {
    ({ container, root } = renderProbe(<RecentOnlyProbe />));

    const event = clickLink(container, "chrome-link");

    expect(event.defaultPrevented).toBe(false);
    expect(pathname(container)).toBe("/");
    expect(consumeAgentChatHomeHandoff("chat")).toBe(false);
  });

  it("intercepts recent-only links when a chat marker exists", () => {
    markAgentChatHomeHandoff("chat");
    ({ container, root } = renderProbe(<RecentOnlyProbe />));

    const event = clickLink(container, "chrome-link");

    expect(event.defaultPrevented).toBe(true);
    expect(pathname(container)).toBe("/dashboard");
    expect(consumeAgentChatHomeHandoff("chat", { ttlMs: 5_000 })).toBe(true);
  });

  it("does not intercept recent-only links after the marker expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    markAgentChatHomeHandoff("chat");
    vi.setSystemTime(6_001);
    ({ container, root } = renderProbe(<RecentOnlyProbe />));

    const event = clickLink(container, "chrome-link");

    expect(event.defaultPrevented).toBe(false);
    expect(pathname(container)).toBe("/");
    expect(consumeAgentChatHomeHandoff("chat", { ttlMs: 5_000 })).toBe(false);
  });

  describe("mounted at a workspace base path", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_APP_BASE_PATH", "/forms");
    });

    it("strips the base exactly once when a route segment equals the base", () => {
      ({ container, root } = renderMountedProbe());

      const event = clickLink(container, "base-collision-link");

      // `/forms/forms` = base `/forms` + router-local `/forms` (the list
      // route). A double strip would corrupt it to `/` and bounce the user
      // back to the chat home.
      expect(event.defaultPrevented).toBe(true);
      expect(pathname(container)).toBe("/forms");
      expect(consumeAgentChatHomeHandoff("forms")).toBe(true);
    });

    it("leaves cross-app links to sibling mounts to the browser", () => {
      ({ container, root } = renderMountedProbe());

      const event = clickLink(container, "cross-app-link");

      // `/mail` is another workspace app. Re-dispatching it through the
      // basename-scoped router would trap it under `/forms/mail`.
      expect(event.defaultPrevented).toBe(false);
      expect(pathname(container)).toBe("/ask");
      expect(consumeAgentChatHomeHandoff("forms")).toBe(false);
    });

    it("still excludes settings under the mounted base", () => {
      ({ container, root } = renderMountedProbe());

      const event = clickLink(container, "mounted-settings-link");

      expect(event.defaultPrevented).toBe(false);
      expect(pathname(container)).toBe("/ask");
      expect(consumeAgentChatHomeHandoff("forms")).toBe(false);
    });
  });
});

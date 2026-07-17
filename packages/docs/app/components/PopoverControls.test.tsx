// @vitest-environment jsdom

import { AgentNativeI18nProvider } from "@agent-native/core/client";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { docsI18nCatalog } from "../i18n";
import { TemplateCard, templates } from "./TemplateCard";
import { BuildOnlinePopover } from "./WaitlistPopover";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function renderWithProviders(children: ReactNode) {
  return render(
    <MemoryRouter>
      <AgentNativeI18nProvider
        catalog={docsI18nCatalog}
        initialLocale="en-US"
        initialPreference="en-US"
        persistPreference={false}
      >
        {children}
      </AgentNativeI18nProvider>
    </MemoryRouter>,
  );
}

function expectAnimatedPopover(element: HTMLElement) {
  expect(element.className).toContain("data-[state=open]:animate-in");
  expect(element.className).toContain("data-[state=closed]:animate-out");
  expect(element.className).toContain("data-[side=bottom]:slide-in-from-top-2");
}

describe("docs popover controls", () => {
  it("opens Build online in the shared animated popover", () => {
    renderWithProviders(<BuildOnlinePopover location="templates_index" />);

    fireEvent.click(screen.getByRole("button", { name: "Build online" }));

    const content = screen
      .getByText("Join the waitlist")
      .closest("[role=dialog]");
    expect(content).not.toBeNull();
    expectAnimatedPopover(content as HTMLElement);
  });

  it("keeps Customize It modes inside the shared animated popover", () => {
    renderWithProviders(<TemplateCard template={templates[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Customize It" }));

    const editOnline = screen.getByRole("button", { name: "Edit Online" });
    const content = editOnline.closest("[role=dialog]");
    expect(content).not.toBeNull();
    expectAnimatedPopover(content as HTMLElement);

    fireEvent.click(editOnline);
    expect(screen.getByText("Join the waitlist")).toBeTruthy();
  });

  it("links Customize It's edit-online waitlist to the configured Google Form", () => {
    vi.stubEnv("VITE_WAITLIST_FORM_URL", "https://forms.gle/example-waitlist");
    renderWithProviders(<TemplateCard template={templates[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Customize It" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Online" }));

    const link = screen.getByRole("link", { name: /Join waitlist/ });
    const href = link.getAttribute("href");
    expect(href).not.toBeNull();
    const url = new URL(href as string);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://forms.gle/example-waitlist",
    );
    // Lane prefill: interests + how-did-you-find-us ride along as
    // Google Forms pp_url params.
    expect(url.searchParams.get("usp")).toBe("pp_url");
    expect(url.searchParams.get("entry.424717529")).toBe("EARLY ACCESS / BETA");
    expect(url.searchParams.get("entry.1248361760")).toBe(
      "Marketing or Docs site",
    );
    expect(link.getAttribute("target")).toBe("_blank");
  });
});

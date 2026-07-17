import { trackEvent, useLocale, useT } from "@agent-native/core/client";
import { useState } from "react";
import { Link } from "react-router";

import { sitePathForLocale } from "./docs-locale";
import { TemplateDocsLink } from "./template-docs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { WaitlistContent } from "./WaitlistPopover";

export { trackEvent };

export const templates = [
  {
    name: "Clips",
    slug: "clips",
    cliCommand:
      "npx @agent-native/core@latest create my-clips-app --template clips",
    color: "#0EA5E9",
    screenshot: "/screenshots/clips.png",
  },
  {
    name: "Plans",
    slug: "plan",
    cliCommand: "npx @agent-native/core@latest skills add visual-plan",
    color: "#52525B",
    screenshot: "/screenshots/content.png",
  },
  {
    name: "Design",
    slug: "design",
    cliCommand:
      "npx @agent-native/core@latest create my-design-app --template design",
    color: "#F472B6",
    screenshot: "/screenshots/slides.png",
  },
  {
    name: "Content",
    slug: "content",
    cliCommand:
      "npx @agent-native/core@latest create my-content-app --template content",
    color: "#7928ca",
    screenshot: "/screenshots/content.png",
  },
  {
    name: "Slides",
    slug: "slides",
    cliCommand:
      "npx @agent-native/core@latest create my-slides-app --template slides",
    color: "#f59e0b",
    screenshot: "/screenshots/slides.png",
  },
  {
    name: "Analytics",
    slug: "analytics",
    cliCommand:
      "npx @agent-native/core@latest create my-analytics-app --template analytics",
    color: "var(--docs-accent)",
    screenshot: "/screenshots/analytics.png",
  },
  {
    name: "Mail",
    slug: "mail",
    cliCommand:
      "npx @agent-native/core@latest create my-mail-app --template mail",
    color: "#0ea5e9",
    screenshot: "/screenshots/mail.png",
  },
  {
    name: "Forms",
    slug: "forms",
    cliCommand:
      "npx @agent-native/core@latest create my-forms-app --template forms",
    color: "#06B6D4",
    screenshot: "/screenshots/forms.png",
  },
  {
    name: "Brain",
    slug: "brain",
    cliCommand:
      "npx @agent-native/core@latest create my-brain-app --template brain",
    color: "#8B5CF6",
    screenshot: "/screenshots/chat.png",
  },
  {
    name: "Assets",
    slug: "assets",
    cliCommand:
      "npx @agent-native/core@latest create my-assets-app --template assets",
    color: "#0F766E",
    screenshot: "/screenshots/dispatch.png",
  },
  {
    name: "Calendar",
    slug: "calendar",
    cliCommand:
      "npx @agent-native/core@latest create my-calendar-app --template calendar",
    color: "#10b981",
    screenshot: "/screenshots/calendar.png",
  },
  {
    name: "Dispatch",
    slug: "dispatch",
    cliCommand:
      "npx @agent-native/core@latest create my-dispatch-app --template dispatch",
    color: "#14B8A6",
    screenshot: "/screenshots/dispatch.png",
  },
  {
    name: "Chat",
    slug: "chat",
    cliCommand:
      "npx @agent-native/core@latest create my-chat-app --template chat",
    color: "#18181B",
    screenshot: "/screenshots/chat.png",
  },
  // ── DO NOT add new templates here directly. ──
  // The public-facing template list is the strict allow-list defined in
  // `packages/shared-app-config/templates.ts` (the entries with
  // `hidden: false`). To surface
  // a new template on the homepage, first flip its `hidden` flag in that
  // file. The CI guard
  // `scripts/guard-template-list.mjs` enforces this — adding a slug here
  // that isn't in the allow-list will fail the build.
];

export type Template = (typeof templates)[number];

export const featuredTemplates = templates;

function CliPopoverContent({ template }: { template: Template }) {
  const [copied, setCopied] = useState(false);
  const { locale } = useLocale();
  const t = useT();

  function handleCopy() {
    navigator.clipboard.writeText(template.cliCommand);
    setCopied(true);
    trackEvent("copy cli command", {
      template: template.slug,
      location: "card",
    });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-2 px-3 py-2">
        <code className="block min-w-0 truncate text-xs leading-relaxed text-[var(--fg)]">
          {template.cliCommand}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md p-1 text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          aria-label={t("common.copyCommand")}
        >
          {copied ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      <div className="border-t border-[var(--code-border)] px-3 py-1.5 text-[10px] text-[var(--fg-secondary)]">
        {t("templateCard.pasteIntoTerminal")}{" "}
        <Link
          data-an-prefetch="render"
          to={sitePathForLocale("/docs/getting-started", locale)}
          className="text-[var(--docs-accent)] no-underline hover:underline"
        >
          {t("templateCard.newToCli")}
        </Link>
      </div>
    </>
  );
}

function TemplateLaunchButton({ template }: { template: Template }) {
  const [showCustomize, setShowCustomize] = useState(false);
  const [customizeMode, setCustomizeMode] = useState<
    "menu" | "editOnline" | "runLocally"
  >("menu");
  const t = useT();

  function handleCustomizeOpenChange(open: boolean) {
    if (open) {
      trackEvent("click customize it", {
        template: template.slug,
        location: "card",
      });
    } else {
      setCustomizeMode("menu");
    }
    setShowCustomize(open);
  }

  function showEditOnline() {
    trackEvent("click edit online", {
      template: template.slug,
      location: "card",
    });
    setCustomizeMode("editOnline");
  }

  function showRunLocally() {
    trackEvent("click run locally", {
      template: template.slug,
      location: "card",
    });
    setCustomizeMode("runLocally");
  }

  return (
    <div className="mt-auto flex flex-col gap-2 pt-3">
      <div className="flex gap-2">
        <Popover open={showCustomize} onOpenChange={handleCustomizeOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-[var(--docs-border)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition hover:border-[var(--fg-secondary)]"
            >
              {t("common.customizeIt")}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            collisionPadding={16}
            className={
              customizeMode === "runLocally"
                ? "w-max max-w-[calc(100vw-32px)]"
                : customizeMode === "editOnline"
                  ? "w-[min(100vw-32px,360px)] p-4"
                  : "w-[min(100vw-32px,220px)] p-1"
            }
          >
            {customizeMode === "runLocally" ? (
              <CliPopoverContent template={template} />
            ) : customizeMode === "editOnline" ? (
              <WaitlistContent
                location="card"
                template={template.slug}
                source="docs_template_card"
                useCase="docs_edit_online_waitlist"
              />
            ) : (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={showEditOnline}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--fg)] transition hover:bg-[var(--bg-secondary)]"
                >
                  {t("common.editOnline")}
                </button>
                <button
                  type="button"
                  onClick={showRunLocally}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--fg)] transition hover:bg-[var(--bg-secondary)]"
                >
                  {t("common.runLocally")}
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <TemplateDocsLink
          template={template}
          location="card"
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-[var(--docs-border)] px-4 py-2 text-sm font-medium text-[var(--fg)] no-underline transition hover:border-[var(--fg-secondary)] hover:no-underline"
        />
      </div>
    </div>
  );
}

export function TemplateCard({ template }: { template: Template }) {
  const { locale } = useLocale();
  const t = useT();
  const templatePath = sitePathForLocale(`/apps/${template.slug}`, locale);
  const replaces = t(`templates.${template.slug}.replaces`);
  const description = t(`templates.${template.slug}.description`);

  return (
    <div className="feature-card flex flex-col gap-3 overflow-hidden">
      <Link
        data-an-prefetch="render"
        to={templatePath}
        className="-mx-[24px] -mt-[24px] mb-1 flex aspect-[924/729] items-center justify-center overflow-hidden border-b border-[var(--docs-border)] bg-[var(--bg-secondary)] transition hover:opacity-90"
        onClick={() =>
          trackEvent("click template", {
            template: template.slug,
            location: "card",
          })
        }
      >
        {template.screenshot ? (
          <img
            src={template.screenshot}
            alt={t("templateCard.screenshotAlt", { name: template.name })}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${template.color}, ${template.color}22)`,
            }}
          >
            <span className="rounded-lg bg-[var(--bg)]/80 px-4 py-2 text-sm font-semibold text-[var(--fg)] shadow-sm">
              {template.name}
            </span>
          </div>
        )}
      </Link>
      <h3 className="text-base font-semibold">
        <Link
          data-an-prefetch="render"
          to={templatePath}
          className="text-[var(--fg)] no-underline hover:text-[var(--docs-accent)]"
        >
          {template.name}
        </Link>
      </h3>
      <p className="m-0 text-xs text-[var(--docs-accent)]">{replaces}</p>
      <p className="m-0 text-sm leading-relaxed text-[var(--fg-secondary)]">
        {description}
      </p>
      <TemplateLaunchButton template={template} />
    </div>
  );
}

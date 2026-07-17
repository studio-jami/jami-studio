import { trackEvent, useT } from "@agent-native/core/client";
import { IconExternalLink } from "@tabler/icons-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export type WaitlistLocation = "homepage_rail" | "templates_index" | "card";

type WaitlistProps = {
  location: WaitlistLocation;
  template?: string;
  source?: string;
  useCase?: string;
};

// Set VITE_WAITLIST_FORM_URL to the published Google Form link (Form ->
// Responses -> linked Google Sheet). No backend involved — the click just
// opens the form in a new tab.
function waitlistFormUrl(): string | undefined {
  return import.meta.env.VITE_WAITLIST_FORM_URL as string | undefined;
}

const primaryButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200";

export function WaitlistContent({
  location,
  template,
  source = "docs_build_from_scratch",
  useCase = "docs_build_online_waitlist",
}: WaitlistProps) {
  const t = useT();
  const formUrl = waitlistFormUrl();

  function handleClick() {
    trackEvent("waitlist form opened", {
      location,
      source,
      useCase,
      ...(template ? { template } : {}),
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="m-0 text-sm font-semibold text-[var(--fg)]">
          {t("buildFromScratch.popoverTitle")}
        </p>
        <p className="mt-2 mb-0 text-sm leading-relaxed text-[var(--fg-secondary)]">
          {t("buildFromScratch.popoverBody")}
        </p>
      </div>

      {formUrl ? (
        <a
          href={formUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
          className={primaryButtonClassName}
        >
          {t("buildFromScratch.joinWaitlist")}
          <IconExternalLink size={16} />
        </a>
      ) : (
        // Temporary fallback while VITE_WAITLIST_FORM_URL is unset — not
        // worth a translated string for a config-missing state that should
        // never ship to production.
        <p className="m-0 text-sm leading-relaxed text-[var(--fg-secondary)]">
          Waitlist form coming soon.
        </p>
      )}
    </div>
  );
}

export function BuildOnlinePopover({
  location,
}: {
  location: WaitlistLocation;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          trackEvent("click build online", { location });
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className={primaryButtonClassName}>
          {t("buildFromScratch.buildOnline")}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        collisionPadding={16}
        className="w-[min(100vw-32px,360px)] p-4"
      >
        <WaitlistContent location={location} />
      </PopoverContent>
    </Popover>
  );
}

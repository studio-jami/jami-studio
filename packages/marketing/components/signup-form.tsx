"use client";

import { useEffect, useId, useRef, useState } from "react";

// Canonical Jami Studio signup form (Google Form + linked Sheet).
// Direct POST to formResponse verified working 2026-07-17. The collected
// email uses Google's own `emailAddress` field; everything else is an
// entry.<id> from the form schema.
const FORM_RESPONSE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdryI3A_e7jG0Mf-_2c4B-u2BhDSM3tQKLyVwjG4Vu-G3qT2w/formResponse";

const ENTRY_FIRST_NAME = "entry.319718329";
const ENTRY_LAST_NAME = "entry.47181662";
const ENTRY_INTERESTS = "entry.424717529";
const ENTRY_FOUND_US = "entry.1248361760";
const ENTRY_MESSAGE = "entry.1251213265";

const INTERESTS = [
  "EARLY ACCESS / BETA",
  "COMMUNITY & NEWSLETTER",
  "ANNOUNCEMENTS & RELEASES",
] as const;

const FOUND_US_OPTIONS = [
  "Socials",
  "LLM or Agent",
  "Search",
  "Marketing or Docs site",
  "Word of Mouth",
  "Other",
] as const;

const inputClassName =
  "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

const labelClassName =
  "font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground";

// Custom on-brand listbox: native <select> popups are OS-rendered and can't
// be themed, so this replaces it with an accessible button + listbox pair
// styled with the site tokens (sharp corners, hairline borders, mono type).
function FoundUsSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function select(option: string) {
    onChange(option);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(Math.max(FOUND_US_OPTIONS.indexOf(value as never), 0));
      } else if (activeIndex >= 0) {
        select(FOUND_US_OPTIONS[activeIndex]);
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(Math.max(FOUND_US_OPTIONS.indexOf(value as never), 0));
        return;
      }
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => {
        const next = index + delta;
        if (next < 0) return FOUND_US_OPTIONS.length - 1;
        if (next >= FOUND_US_OPTIONS.length) return 0;
        return next;
      });
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        id="foundUs"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setOpen((current) => !current);
          setActiveIndex(Math.max(FOUND_US_OPTIONS.indexOf(value as never), 0));
        }}
        className={`flex w-full items-center justify-between gap-3 border bg-background px-4 py-3 text-left text-sm transition-colors focus:outline-none ${
          open ? "border-primary" : "border-border focus:border-primary"
        } ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span>{value || "Choose\u2026"}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </svg>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="How did you find us?"
          className="absolute left-0 right-0 top-full z-20 mt-px max-h-72 overflow-y-auto border border-primary bg-background shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)]"
        >
          {FOUND_US_OPTIONS.map((option, index) => {
            const selected = option === value;
            const active = index === activeIndex;
            return (
              <li
                key={option}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(option)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm transition-colors ${
                  active ? "bg-card text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="font-mono text-xs tracking-wide uppercase">
                  {option}
                </span>
                {selected && (
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 bg-primary"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SignupForm() {
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [foundUs, setFoundUs] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  // Accepts the same prefill params as the Google Form (entry.<id>=value),
  // so existing waitlist links keep working when pointed here. Applied
  // after mount so server and first client render match (no hydration
  // mismatch).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillInterests = params.getAll(ENTRY_INTERESTS).filter((value) => {
      return (INTERESTS as readonly string[]).includes(value);
    });
    if (prefillInterests.length > 0) {
      setInterests(new Set(prefillInterests));
    }
    const foundUsParam = params.get(ENTRY_FOUND_US) ?? "";
    if ((FOUND_US_OPTIONS as readonly string[]).includes(foundUsParam)) {
      setFoundUs(foundUsParam);
    }
  }, []);

  function toggleInterest(value: string) {
    setInterests((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (interests.size === 0 || status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const body = new URLSearchParams();
    body.set("emailAddress", String(data.get("email") ?? ""));
    body.set(ENTRY_FIRST_NAME, String(data.get("firstName") ?? ""));
    body.set(ENTRY_LAST_NAME, String(data.get("lastName") ?? ""));
    for (const interest of interests) {
      body.append(ENTRY_INTERESTS, interest);
    }
    if (foundUs) body.set(ENTRY_FOUND_US, foundUs);
    const message = String(data.get("message") ?? "");
    if (message) body.set(ENTRY_MESSAGE, message);

    setStatus("sending");
    // Google doesn't send CORS headers, so we submit a real form POST into a
    // hidden iframe — a genuine navigation the browser never aborts (fetch
    // with no-cors showed ERR_ABORTED in testing). The iframe's load event
    // fires once Google's confirmation page renders.
    await new Promise<void>((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.name = `signup-sink-${Date.now()}`;
      iframe.style.display = "none";
      const ghost = document.createElement("form");
      ghost.action = FORM_RESPONSE_URL;
      ghost.method = "POST";
      ghost.target = iframe.name;
      ghost.style.display = "none";
      for (const [key, value] of body.entries()) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        ghost.appendChild(input);
      }
      const cleanup = () => {
        window.clearTimeout(timer);
        ghost.remove();
        iframe.remove();
        resolve();
      };
      // Fallback in case load never fires (network hiccup); the POST has
      // been dispatched either way by then.
      const timer = window.setTimeout(cleanup, 8000);
      iframe.addEventListener("load", cleanup, { once: true });
      document.body.appendChild(iframe);
      document.body.appendChild(ghost);
      ghost.submit();
    });
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="border border-border bg-card p-10 text-center">
        <p className="font-serif text-2xl text-foreground mb-3">
          You&apos;re in.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Thanks for signing up — we&apos;ll be in touch with the good stuff.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="firstName" className={labelClassName}>
            First name *
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            className={inputClassName}
            placeholder="Ada"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="lastName" className={labelClassName}>
            Last name *
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            autoComplete="family-name"
            className={inputClassName}
            placeholder="Lovelace"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClassName}>
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClassName}
          placeholder="you@example.com"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClassName}>Interests *</legend>
        <div className="grid gap-px bg-border sm:grid-cols-3">
          {INTERESTS.map((interest) => {
            const checked = interests.has(interest);
            return (
              <label
                key={interest}
                className={`flex cursor-pointer items-center gap-3 p-4 text-xs transition-colors ${
                  checked
                    ? "bg-card text-foreground"
                    : "bg-background text-muted-foreground hover:bg-card"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleInterest(interest)}
                  className="size-3.5 accent-[var(--primary)]"
                />
                <span className="font-mono tracking-wide">{interest}</span>
              </label>
            );
          })}
        </div>
        {interests.size === 0 && (
          <p className="text-xs text-muted-foreground">
            Pick at least one lane.
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="foundUs" className={labelClassName}>
          How did you find us?
        </label>
        <FoundUsSelect value={foundUs} onChange={setFoundUs} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className={labelClassName}>
          Write us anything!
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={inputClassName}
          placeholder="What are you building?"
        />
      </div>

      <button
        type="submit"
        disabled={interests.size === 0 || status === "sending"}
        className="inline-flex items-center justify-center bg-primary px-8 py-3 font-mono text-xs uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "sending" ? "Sending…" : "Sign up"}
      </button>
    </form>
  );
}

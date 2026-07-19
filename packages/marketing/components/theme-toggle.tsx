"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// ─── Theme toggle ──────────────────────────────────────────────────
// Icon-only. Dark is the default; preference persists to localStorage and
// is applied before hydration by the inline script in app/layout.tsx, so
// there's no flash of the wrong theme.

export const THEME_STORAGE_KEY = "jami-theme";

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage disabled (private browsing, etc.) — theme just won't persist.
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("light") ? "light" : "dark",
    );
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground",
        className,
      )}
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun size={15} />
        ) : (
          <Moon size={15} />
        )
      ) : (
        <span className="block h-[15px] w-[15px]" aria-hidden="true" />
      )}
    </button>
  );
}

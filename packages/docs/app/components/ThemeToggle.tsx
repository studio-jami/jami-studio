import { useT } from "@agent-native/core/client";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";

// Icon-only. Dark is the default; preference persists to localStorage under
// the same `jami-theme` key the marketing site uses, and is applied before
// hydration by THEME_INIT_SCRIPT in app/root.tsx, so there's no flash of
// the wrong theme.

export const THEME_STORAGE_KEY = "jami-theme";

export function applyDocsTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage disabled (private browsing, etc.) — theme just won't persist.
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
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
    applyDocsTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      title={t("theme.toggle")}
      className={
        className ??
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--docs-border)] text-[var(--fg-secondary)] hover:border-[var(--fg-secondary)] hover:text-[var(--fg)]"
      }
    >
      {mounted ? (
        theme === "dark" ? (
          <IconSun size={16} stroke={1.5} />
        ) : (
          <IconMoon size={16} stroke={1.5} />
        )
      ) : (
        <span className="block h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

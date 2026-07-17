import { useLocale, useT } from "@agent-native/core/client";
import { Link } from "react-router";

import { sitePathForLocale } from "./docs-locale";

export default function Footer() {
  const year = new Date().getFullYear();
  const { locale } = useLocale();
  const t = useT();
  const localizedPath = (path: string) => sitePathForLocale(path, locale);

  return (
    <footer className="border-t border-[var(--docs-border)] px-6 py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 text-sm text-[var(--fg-secondary)] sm:flex-row">
        <p className="m-0">&copy; {year} Jami Studio</p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
          <Link
            to={localizedPath("/download")}
            className="text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          >
            {t("footer.download")}
          </Link>
          <Link
            to={localizedPath("/skills")}
            className="text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          >
            {t("header.skills")}
          </Link>
          {/* Brand/Privacy/Terms now live in @agent-native/marketing — use a
              hard navigation (not react-router Link) so the browser lets
              that app's own routes handle the path instead of trying to
              client-side-match it inside this app's router. */}
          <a
            href="/brand"
            className="text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          >
            {t("footer.brand")}
          </a>
          <a
            href="/privacy"
            className="text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          >
            {t("footer.privacy")}
          </a>
          <a
            href="/terms"
            className="text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          >
            {t("footer.terms")}
          </a>
          <a
            href="https://github.com/studio-jami/jami-studio"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          >
            GitHub <span className="text-[10px] opacity-50">↗</span>
          </a>
          <a
            href="https://www.npmjs.com/package/@agent-native/core"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--fg-secondary)] transition hover:text-[var(--fg)]"
          >
            npm <span className="text-[10px] opacity-50">↗</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

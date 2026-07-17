import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadDoc } from "../app/components/docs-content";
import {
  canonicalPathForPath,
  docsAlternateLinksForPath,
} from "../app/components/docs-seo";
import { NAV_SECTIONS, type NavItem } from "../app/components/docsNavItems";
import { getTemplateDocsPath } from "../app/components/template-docs";
import { featuredTemplates, templates } from "../app/components/TemplateCard";
import { meta as localizedDocsMeta } from "../app/routes/docs.$locale.$slug";
import { meta as docsSlugMeta } from "../app/routes/docs.$slug";
import { meta as docsIndexMeta } from "../app/routes/docs._index";
import {
  loader,
  meta as genericTemplateMeta,
} from "../app/routes/templates.$slug";
import { meta as designTemplateMeta } from "../app/routes/templates.design";
import { meta as slidesTemplateMeta } from "../app/routes/templates.slides";
import { buildSitemapPaths } from "../app/vite-sitemap-plugin";
import {
  docSourceFilenamesForSlug,
  docSourceSlugFromFilename,
  preferMdxDocSourceFiles,
} from "../lib/docs-source";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");

// The Builder-era dynamic social image route (/_agent-native/og-image.png)
// is retired — every page ships the static brand card.
const STATIC_BRAND_OG_IMAGE = "https://www.jami.studio/og-image.png";

function ogImage(meta: Array<Record<string, unknown>>): string {
  const image = meta.find(
    (item) => item.property === "og:image" && typeof item.content === "string",
  );
  expect(image?.content).toBeTruthy();
  return image!.content as string;
}

function docsSourceExists(docsDir: string, slug: string): boolean {
  return docSourceFilenamesForSlug(slug).some((filename) =>
    fs.existsSync(path.join(docsDir, filename)),
  );
}

function listDocSlugs(docsDir: string): string[] {
  return preferMdxDocSourceFiles(fs.readdirSync(docsDir)).map((name) =>
    docSourceSlugFromFilename(name),
  );
}

describe("template routes", () => {
  it("accepts every template catalog slug on the generic template route", () => {
    for (const template of templates) {
      expect(() =>
        loader({
          params: { slug: template.slug },
        } as unknown as Parameters<typeof loader>[0]),
      ).not.toThrow();
    }

    expect(() =>
      loader({
        params: { slug: "starter" },
      } as unknown as Parameters<typeof loader>[0]),
    ).toThrow(expect.objectContaining({ status: 404 }));
  });

  it("uses the static brand OG image for template pages", () => {
    expect(ogImage(slidesTemplateMeta())).toBe(STATIC_BRAND_OG_IMAGE);
    expect(ogImage(designTemplateMeta())).toBe(STATIC_BRAND_OG_IMAGE);
    expect(ogImage(genericTemplateMeta({ params: { slug: "assets" } }))).toBe(
      STATIC_BRAND_OG_IMAGE,
    );
  });

  it("uses the static brand OG image for docs pages", async () => {
    expect(ogImage(docsIndexMeta())).toBe(STATIC_BRAND_OG_IMAGE);

    const localizedIndexDoc = await loadDoc("getting-started", "zh-CN");
    expect(localizedIndexDoc?.title).toBe("开始使用");
    expect(ogImage(docsIndexMeta({ data: localizedIndexDoc }))).toBe(
      STATIC_BRAND_OG_IMAGE,
    );

    const docsPage = docsSlugMeta({
      params: { slug: "workspace-connections" },
    });
    expect(ogImage(docsPage)).toBe(STATIC_BRAND_OG_IMAGE);

    const localizedDoc = await loadDoc("internationalization", "zh-CN");
    expect(localizedDoc?.title).toBe("国际化");
    const localizedPage = localizedDocsMeta({
      data: localizedDoc,
      params: { locale: "zh-CN", slug: "internationalization" },
    });
    expect(ogImage(localizedPage)).toBe(STATIC_BRAND_OG_IMAGE);
  });

  it("emits docs canonical paths and hreflang alternates for localized docs", () => {
    expect(canonicalPathForPath("/docs/getting-started")).toBe("/docs");
    expect(canonicalPathForPath("/zh-CN/docs/getting-started")).toBe(
      "/zh-CN/docs",
    );

    const localized = docsAlternateLinksForPath(
      "/zh-CN/docs/internationalization",
    );
    expect(localized).toContainEqual({
      hrefLang: "en-US",
      path: "/docs/internationalization",
    });
    expect(localized).toContainEqual({
      hrefLang: "zh-CN",
      path: "/zh-CN/docs/internationalization",
    });
    expect(localized).toContainEqual({
      hrefLang: "x-default",
      path: "/docs/internationalization",
    });

    const defaultLocalized = docsAlternateLinksForPath(
      "/docs/workspace-connections",
    );
    expect(defaultLocalized).toContainEqual({
      hrefLang: "en-US",
      path: "/docs/workspace-connections",
    });
    expect(defaultLocalized).toContainEqual({
      hrefLang: "zh-CN",
      path: "/zh-CN/docs/workspace-connections",
    });
    expect(defaultLocalized).toContainEqual({
      hrefLang: "x-default",
      path: "/docs/workspace-connections",
    });
    expect(docsAlternateLinksForPath("/templates")).toEqual([]);
  });

  it("keeps docs sidebar app links aligned with the featured catalog", () => {
    const navTemplateSection = NAV_SECTIONS.find(
      (section) => section.title === "Apps",
    );
    expect(navTemplateSection).toBeDefined();

    // Flatten group children (e.g. the Plans chevron group) so paths nested
    // under a group header are collected too.
    const collectPaths = (items: NavItem[]): string[] =>
      items.flatMap((item) => [
        ...(item.to ? [item.to] : []),
        ...(item.children ? collectPaths(item.children) : []),
      ]);
    const sidebarDocPaths = collectPaths(navTemplateSection!.items);
    const catalogTemplatePaths = featuredTemplates.map(getTemplateDocsPath);

    // Every featured catalog template must be reachable from the sidebar,
    // whether linked at the top level or nested under a group (e.g. Plans).
    // Non-featured templates may still keep direct docs pages without being
    // promoted in the main navigation.
    for (const catalogPath of catalogTemplatePaths) {
      expect(sidebarDocPaths).toContain(catalogPath);
    }

    // Every sidebar link in the Apps section must resolve to a real docs
    // page (never an /apps/ marketing route). Group children may be plain
    // docs pages (e.g. pr-visual-recap), so don't require the template- prefix.
    const docsDir = path.resolve(docsRoot, "../core/docs/content");
    for (const sidebarPath of sidebarDocPaths) {
      expect(sidebarPath).toMatch(/^\/docs\/[a-z0-9-]+$/);
      expect(sidebarPath).not.toMatch(/^\/apps\//);

      const slug = sidebarPath.replace("/docs/", "");
      expect(docsSourceExists(docsDir, slug)).toBe(true);
    }
  });

  it("maps every template catalog item to a real docs page", () => {
    const docsDir = path.resolve(docsRoot, "../core/docs/content");

    for (const template of templates) {
      const docsPath = getTemplateDocsPath(template);
      expect(docsPath).toMatch(/^\/docs\/template-[a-z0-9-]+$/);
      expect(docsPath).not.toMatch(/^\/templates\//);

      const slug = docsPath.replace("/docs/template-", "");
      expect(docsSourceExists(docsDir, `template-${slug}`)).toBe(true);
    }
  });

  it("includes every public docs page and app page in the sitemap", () => {
    const paths = buildSitemapPaths(docsRoot);
    const docsDir = path.resolve(docsRoot, "../core/docs/content");
    const docPaths = listDocSlugs(docsDir).map((slug) =>
      slug === "getting-started" ? "/docs" : `/docs/${slug}`,
    );

    expect(paths).toContain("/");
    expect(paths).toContain("/apps");
    expect(paths).toContain("/download");

    for (const docPath of docPaths) {
      expect(paths).toContain(docPath);
    }

    for (const template of templates) {
      expect(paths).toContain(`/apps/${template.slug}`);
    }

    expect(paths).toContain("/zh-CN/docs/internationalization");
    expect(paths).toContain("/zh-CN/docs");
    expect(paths).not.toContain("/docs/zh-CN/internationalization");

    expect(paths).not.toContain("/docs/resources");
    expect(paths).not.toContain("/apps/starter");
  }, 60000);
});

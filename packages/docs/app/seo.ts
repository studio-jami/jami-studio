import {
  AGENT_NATIVE_SOCIAL_IMAGE_PATH,
  defaultSocialImageMeta as coreDefaultSocialImageMeta,
  withAgentNativeSocialImageCacheBuster,
  withDefaultSocialImage as coreWithDefaultSocialImage,
} from "@agent-native/core/shared";
import type { MetaDescriptor } from "react-router";

const SITE_URL = "https://www.jami.studio";
const DOCS_SOCIAL_IMAGE_ACCENT = "Jami Studio Docs";

export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.png`;

export function agentNativeSocialImageUrl(
  title: string,
  accentText?: string,
): string {
  const url = new URL(
    withAgentNativeSocialImageCacheBuster(AGENT_NATIVE_SOCIAL_IMAGE_PATH),
    SITE_URL,
  );
  url.searchParams.set("title", title);
  if (accentText) {
    url.searchParams.set("accentText", accentText);
  }
  return url.toString();
}

export function defaultSocialImageMeta(): MetaDescriptor[] {
  return coreDefaultSocialImageMeta(DEFAULT_SOCIAL_IMAGE) as MetaDescriptor[];
}

export function withDefaultSocialImage(
  meta: MetaDescriptor[],
  image = DEFAULT_SOCIAL_IMAGE,
): MetaDescriptor[] {
  return coreWithDefaultSocialImage(meta as any, image) as MetaDescriptor[];
}

export function withTemplateSocialImage(
  meta: MetaDescriptor[],
  templateName: string,
): MetaDescriptor[] {
  return withDefaultSocialImage(
    meta,
    agentNativeSocialImageUrl(`Jami Studio ${templateName}`),
  );
}

export function withDocsSocialImage(
  meta: MetaDescriptor[],
  docTitle: string,
): MetaDescriptor[] {
  return withDefaultSocialImage(
    meta,
    agentNativeSocialImageUrl(docTitle, DOCS_SOCIAL_IMAGE_ACCENT),
  );
}

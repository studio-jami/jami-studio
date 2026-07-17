import {
  defaultSocialImageMeta as coreDefaultSocialImageMeta,
  withDefaultSocialImage as coreWithDefaultSocialImage,
} from "@agent-native/core/shared";
import type { MetaDescriptor } from "react-router";

const SITE_URL = "https://www.jami.studio";

// The Builder-era dynamic social image route (/_agent-native/og-image.png)
// does not exist on this deployment — every page uses the static brand card.
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.png`;

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
  _templateName: string,
): MetaDescriptor[] {
  return withDefaultSocialImage(meta);
}

export function withDocsSocialImage(
  meta: MetaDescriptor[],
  _docTitle: string,
): MetaDescriptor[] {
  return withDefaultSocialImage(meta);
}

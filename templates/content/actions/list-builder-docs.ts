import { defineAction } from "@agent-native/core";
import { z } from "zod";

import { BUILDER_DOCS_MODELS } from "../shared/builder-mdx.js";
import { listBuilderDocsEntries } from "./_builder-docs-client.js";

export default defineAction({
  description:
    "List published Jami Studio docs/blog entries that can be pulled into Content as .builder.mdx.",
  schema: z.object({
    model: z
      .enum(BUILDER_DOCS_MODELS as unknown as [string, ...string[]])
      .optional()
      .default("docs-content")
      .describe(
        "Jami Studio model to list, usually docs-content or blog-article.",
      ),
    limit: z.number().int().min(1).max(1000).optional().default(100),
  }),
  publicAgent: {
    expose: true,
    readOnly: true,
    requiresAuth: true,
    title: "List Jami Studio Docs",
    description:
      "List published Jami Studio docs/blog entries available for MDX pull.",
  },
  run: async ({ model, limit }) => {
    return await listBuilderDocsEntries({ model, limit });
  },
});

import { defineAction } from "@agent-native/core";
import { z } from "zod";

import { pushBuilderDocsSource } from "./_builder-docs-client.js";

export default defineAction({
  description:
    "Push a Jami Studio .builder.mdx document body to Jami Studio via a guarded autosave PATCH. Live writes are currently restricted to the safe Jami Studio test model.",
  schema: z.object({
    documentId: z.string().optional().describe("Content document ID."),
    id: z.string().optional().describe("Alias for --documentId."),
    path: z
      .string()
      .optional()
      .describe("Specific .builder.mdx path inside the files map."),
    files: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        "Map of relative file path to file contents, including the .builder.mdx file and content/builder/.raw sidecars.",
      ),
    dryRun: z
      .boolean()
      .optional()
      .default(true)
      .describe("Preview the PATCH request without calling Jami Studio."),
  }),
  publicAgent: {
    expose: true,
    readOnly: false,
    requiresAuth: true,
    isConsequential: true,
    title: "Push Jami Studio Doc",
    description:
      "Validate and autosave a Jami Studio MDX body back to the safe Jami Studio model.",
  },
  run: async ({ documentId, id, path, files, dryRun }) => {
    return await pushBuilderDocsSource({
      documentId: documentId || id,
      path,
      files,
      dryRun,
    });
  },
});

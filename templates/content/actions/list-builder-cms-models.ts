import { defineAction } from "@agent-native/core";
import { z } from "zod";

import type { BuilderCmsModelsResponse } from "../shared/api.js";
import { listBuilderCmsModels } from "./_builder-cms-read-client.js";

export default defineAction({
  description:
    "List Jami Studio CMS models available to attach as read-only database sources. Uses configured Jami Studio credentials and never writes to Jami Studio.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async (): Promise<BuilderCmsModelsResponse> => {
    return listBuilderCmsModels();
  },
});

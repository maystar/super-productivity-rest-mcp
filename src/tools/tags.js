import { z } from "zod";
import { toolResult, parseResponse } from "../tool-result.js";

// Same reasoning as projects.js: only `id`/`title` are confirmed, rest is passed through.
export const TagSchema = z.object({ id: z.string(), title: z.string() }).passthrough();
export const TagListSchema = z.array(TagSchema);

/** Read-only tag listing. */
export function registerTagTools(server, { callApi }) {
  server.registerTool(
    "sp_tags_list",
    {
      title: "List tags",
      description: "Lists tags, optionally filtered by title (case-insensitive).",
      inputSchema: { query: z.string().optional() },
    },
    (args) =>
      toolResult(() => callApi("/tags", { query: args }).then((data) => parseResponse(TagListSchema, data))),
  );
}

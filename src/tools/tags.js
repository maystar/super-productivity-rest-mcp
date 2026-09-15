import { z } from "zod";
import { toolResult } from "../tool-result.js";

/** Read-only tag listing. */
export function registerTagTools(server, { callApi }) {
  server.registerTool(
    "sp_tags_list",
    {
      title: "List tags",
      description: "Lists tags, optionally filtered by title (case-insensitive).",
      inputSchema: { query: z.string().optional() },
    },
    (args) => toolResult(() => callApi("/tags", { query: args })),
  );
}

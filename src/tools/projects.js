import { z } from "zod";
import { toolResult } from "../tool-result.js";

/** Read-only project listing. */
export function registerProjectTools(server, { callApi }) {
  server.registerTool(
    "sp_projects_list",
    {
      title: "List projects",
      description: "Lists projects, optionally filtered by title (case-insensitive).",
      inputSchema: { query: z.string().optional() },
    },
    (args) => toolResult(() => callApi("/projects", { query: args })),
  );
}

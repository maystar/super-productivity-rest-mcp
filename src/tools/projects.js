import { z } from "zod";
import { toolResult, parseResponse } from "../tool-result.js";

// The API docs don't enumerate Project fields; `id`/`title` are the two we can confirm (they're
// referenced elsewhere as `projectId` and as the field `query` filters on). `.passthrough()`
// tolerates whatever else the API sends without us having to guess at it.
export const ProjectSchema = z.object({ id: z.string(), title: z.string() }).passthrough();
export const ProjectListSchema = z.array(ProjectSchema);

/** Read-only project listing. */
export function registerProjectTools(server, { callApi }) {
  server.registerTool(
    "sp_projects_list",
    {
      title: "List projects",
      description: "Lists projects, optionally filtered by title (case-insensitive).",
      inputSchema: { query: z.string().optional() },
    },
    (args) =>
      toolResult(() =>
        callApi("/projects", { query: args }).then((data) => parseResponse(ProjectListSchema, data)),
      ),
  );
}

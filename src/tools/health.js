import { z } from "zod";
import { toolResult, parseResponse } from "../tool-result.js";

export const HealthSchema = z
  .object({
    server: z.string(),
    rendererReady: z.boolean(),
  })
  .passthrough();

// /status's exact fields aren't documented beyond "current task + task count" (Local REST API
// wiki); validate only that it's an object rather than guessing field names we can't confirm.
export const StatusSchema = z.object({}).passthrough();

/** Health-check and overall status tools. */
export function registerHealthTools(server, { callApi }) {
  server.registerTool(
    "sp_health",
    {
      title: "Super Productivity: health check",
      description: "Checks whether the Super Productivity Local REST API is reachable (unauthenticated).",
      inputSchema: {},
    },
    () => toolResult(() => callApi("/health", { auth: false }).then((data) => parseResponse(HealthSchema, data))),
  );

  server.registerTool(
    "sp_status",
    {
      title: "Super Productivity: status",
      description: "Returns the current task and the total task count.",
      inputSchema: {},
    },
    () => toolResult(() => callApi("/status").then((data) => parseResponse(StatusSchema, data))),
  );
}

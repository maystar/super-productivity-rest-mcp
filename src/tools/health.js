import { toolResult } from "../tool-result.js";

/** Health-check and overall status tools. */
export function registerHealthTools(server, { callApi }) {
  server.registerTool(
    "sp_health",
    {
      title: "Super Productivity: health check",
      description: "Checks whether the Super Productivity Local REST API is reachable (unauthenticated).",
      inputSchema: {},
    },
    () => toolResult(() => callApi("/health", { auth: false })),
  );

  server.registerTool(
    "sp_status",
    {
      title: "Super Productivity: status",
      description: "Returns the current task and the total task count.",
      inputSchema: {},
    },
    () => toolResult(() => callApi("/status")),
  );
}

// Builds the MCP server and wires all tool modules to a REST client. Kept separate from the
// stdio-transport entry point (index.js) so it can be constructed and inspected (e.g.
// server.registerTool calls, or via an MCP Client over an in-memory transport) without spawning a
// process or touching stdin/stdout — this is what test/smoke.mjs relies on.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createRestClient } from "./rest-client.js";
import { registerHealthTools } from "./tools/health.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerTaskControlTools } from "./tools/task-control.js";
import { registerFocusTools } from "./tools/focus.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerTagTools } from "./tools/tags.js";

export const SERVER_NAME = "super-productivity-rest-mcp";
export const SERVER_VERSION = "0.1.0";

const TOOL_MODULES = [
  registerHealthTools,
  registerTaskTools,
  registerTaskControlTools,
  registerFocusTools,
  registerProjectTools,
  registerTagTools,
];

/**
 * @param {object} config
 * @param {string} config.baseUrl Base URL of the Super Productivity Local REST API.
 * @param {string} [config.token] Bearer token for authenticated endpoints.
 */
export function createServer({ baseUrl, token }) {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  const restClient = createRestClient({ baseUrl, token });

  for (const register of TOOL_MODULES) register(server, restClient);

  return server;
}

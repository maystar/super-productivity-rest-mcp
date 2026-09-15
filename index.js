#!/usr/bin/env node
// Entry point: reads configuration from the environment, connects the MCP server built in
// src/server.js to stdio, and exits. No sandbox/deployment-specific assumptions live here —
// SP_REST_BASE_URL defaults to a plausible sbx-sandbox value but is fully overridable, and the
// process works the same whether it's run directly with `node`, via `npx`, or inside the
// Docker image built from this repo.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./src/server.js";

const baseUrl = process.env.SP_REST_BASE_URL || "http://host.docker.internal:3876";
const token = process.env.SP_REST_TOKEN;

const server = createServer({ baseUrl, token });
const transport = new StdioServerTransport();
await server.connect(transport);

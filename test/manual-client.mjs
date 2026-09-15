// Manual verification client for use against a REAL, running Super Productivity instance.
// Not run in CI (there is no such instance there) — see test/smoke.mjs for the automated test.
//
// Usage:
//   SP_REST_TOKEN=... [SP_REST_BASE_URL=http://localhost:3876] node test/manual-client.mjs
//
// Requires SP_REST_TOKEN to be set to a real Local REST API access token (Super Productivity:
// Settings → Misc → Enable local REST API) and the API to be reachable at SP_REST_BASE_URL
// (default: http://host.docker.internal:3876, the address that resolves from inside a sandbox
// container back to the host).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["index.js"],
  cwd: new URL("..", import.meta.url).pathname,
  // Pass the full environment, not just PATH/SP_REST_TOKEN: some deployments (e.g. an sbx sandbox)
  // route host-bound traffic through an HTTP proxy, which also handles secret-placeholder
  // substitution and Host-header rewriting. Without those proxy env vars the request goes out
  // directly and the Local REST API rejects the raw hostname (403 "Invalid Host header").
  env: process.env,
});

const client = new Client({ name: "manual-client", version: "0.0.1" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`Tools registered: ${tools.length}`);
for (const t of tools) console.log(` - ${t.name}`);

console.log("\n--- sp_health ---");
console.log(JSON.stringify(await client.callTool({ name: "sp_health", arguments: {} }), null, 2));

console.log("\n--- sp_status ---");
console.log(JSON.stringify(await client.callTool({ name: "sp_status", arguments: {} }), null, 2));

console.log("\n--- sp_tasks_list ---");
const list = await client.callTool({ name: "sp_tasks_list", arguments: { query: "" } });
console.log(JSON.stringify(list, null, 2).slice(0, 1500));

console.log("\n--- sp_projects_list ---");
console.log(JSON.stringify(await client.callTool({ name: "sp_projects_list", arguments: {} }), null, 2).slice(0, 1000));

await client.close();
process.exit(0);

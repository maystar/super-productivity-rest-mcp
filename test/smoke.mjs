// Portable smoke test: exercises the server end-to-end over a real (in-memory) MCP transport,
// without requiring a reachable Super Productivity instance. Verifies that:
//   1. the server starts and registers the expected tools, and
//   2. a tool call against an unreachable backend fails gracefully (isError, not a crash/hang).
// This is deliberately the only test — it needs no network access and no host fixture, so it runs
// the same in CI, in a container, or on a laptop. Anything that needs a real Super Productivity
// instance belongs in a manual check (see README.md), not here.

import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";
import { TaskSchema, TaskListSchema } from "../src/tools/tasks.js";
import { HealthSchema, StatusSchema } from "../src/tools/health.js";
import { FocusSchema } from "../src/tools/focus.js";
import { ProjectListSchema } from "../src/tools/projects.js";
import { TagListSchema } from "../src/tools/tags.js";

const EXPECTED_TOOLS = [
  "sp_health",
  "sp_status",
  "sp_tasks_list",
  "sp_task_get",
  "sp_task_create",
  "sp_task_update",
  "sp_task_delete",
  "sp_task_start",
  "sp_task_archive",
  "sp_task_restore",
  "sp_task_control_get_current",
  "sp_task_control_set_current",
  "sp_task_control_stop",
  "sp_focus_get",
  "sp_projects_list",
  "sp_tags_list",
];

async function main() {
  const server = createServer({
    // Reserved/unroutable address (RFC 5737 TEST-NET-1): guaranteed to fail fast without
    // depending on any real network condition (DNS, firewall, a host that happens to be up).
    baseUrl: "http://192.0.2.1:3876",
    token: "smoke-test-token",
  });

  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "smoke-test", version: "0.0.1" });

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const { tools } = await client.listTools();
  const toolNames = tools.map((t) => t.name).sort();
  assert.deepEqual(toolNames, [...EXPECTED_TOOLS].sort(), "registered tool set must match expectations");
  console.log(`✓ ${tools.length} tools registered as expected`);

  const health = await client.callTool({ name: "sp_health", arguments: {} });
  assert.equal(health.isError, true, "sp_health against an unreachable host must report an error, not throw");
  console.log("✓ sp_health against an unreachable host fails gracefully");

  await client.close();
  await server.close();

  // Response-shape schemas are never exercised by the calls above (the backend is unreachable),
  // so parse a plausible sample through each one here — this only guards against a broken schema
  // definition (typo, wrong Zod call), not against the real API drifting from these shapes.
  const sampleTask = {
    id: "t1",
    title: "Sample",
    isDone: false,
    subTaskIds: [],
    tagIds: ["tag1"],
    extraFutureField: "should be tolerated",
  };
  assert.doesNotThrow(() => TaskSchema.parse(sampleTask), "TaskSchema must accept a plausible task");
  assert.doesNotThrow(() => TaskListSchema.parse([sampleTask]), "TaskListSchema must accept a list of tasks");
  assert.doesNotThrow(
    () => HealthSchema.parse({ server: "up", rendererReady: true }),
    "HealthSchema must accept the documented health shape",
  );
  assert.doesNotThrow(
    () => StatusSchema.parse({ currentTaskId: "t1", taskCount: 3 }),
    "StatusSchema must accept any object",
  );
  assert.doesNotThrow(
    () =>
      FocusSchema.parse({
        mode: "Pomodoro",
        cycle: 1,
        isSessionDone: false,
        timer: {
          purpose: "work",
          status: "running",
          isOvertime: false,
          isLongBreak: false,
          elapsedMs: 1000,
          remainingMs: 2000,
          durationMs: 3000,
        },
      }),
    "FocusSchema must accept the documented focus shape",
  );
  assert.doesNotThrow(
    () => FocusSchema.parse({ mode: "Flowtime", cycle: 0, isSessionDone: false, timer: null }),
    "FocusSchema must accept a null timer",
  );
  assert.doesNotThrow(
    () => ProjectListSchema.parse([{ id: "p1", title: "Inbox" }]),
    "ProjectListSchema must accept a plausible project list",
  );
  assert.doesNotThrow(
    () => TagListSchema.parse([{ id: "g1", title: "urgent" }]),
    "TagListSchema must accept a plausible tag list",
  );
  console.log("✓ response schemas accept plausible sample data");

  console.log("\nsmoke test passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

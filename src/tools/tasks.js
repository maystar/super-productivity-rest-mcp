import { z } from "zod";
import { toolResult } from "../tool-result.js";

// Shared field set for create/update — kept as a plain object (not a factory) since both tools
// need the same fields, just with different optionality expectations from the API's own docs.
const taskFields = {
  notes: z.string().optional(),
  isDone: z.boolean().optional(),
  timeEstimate: z.number().optional().describe("Milliseconds"),
  timeSpent: z.number().optional().describe("Milliseconds"),
  projectId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  dueDay: z.string().optional().describe("YYYY-MM-DD"),
  dueWithTime: z.number().optional().describe("Unix timestamp, ms"),
  plannedAt: z.number().optional().describe("Unix timestamp, ms"),
  deadlineDay: z.string().optional().describe("YYYY-MM-DD, mutually exclusive with deadlineWithTime"),
  deadlineWithTime: z.number().optional().describe("Unix timestamp, ms, mutually exclusive with deadlineDay"),
  deadlineRemindAt: z.number().optional(),
};

/** CRUD + lifecycle (start/archive/restore) tools for tasks. */
export function registerTaskTools(server, { callApi }) {
  server.registerTool(
    "sp_tasks_list",
    {
      title: "List tasks",
      description: "Lists tasks, optionally filtered by title, project, tag, done-state and source.",
      inputSchema: {
        query: z.string().optional().describe("Title contains (case-insensitive)"),
        projectId: z.string().optional(),
        tagId: z.string().optional(),
        includeDone: z.boolean().optional().describe("Default false"),
        source: z.enum(["active", "archived", "all"]).optional(),
      },
    },
    (args) => toolResult(() => callApi("/tasks", { query: args })),
  );

  server.registerTool(
    "sp_task_get",
    {
      title: "Get a single task",
      description: "Returns one task by id.",
      inputSchema: { id: z.string() },
    },
    ({ id }) => toolResult(() => callApi(`/tasks/${encodeURIComponent(id)}`)),
  );

  server.registerTool(
    "sp_task_create",
    {
      title: "Create a task",
      description:
        "Creates a new task. A subtask (parentId set) inherits the parent's project and cannot " +
        "have its own tags.",
      inputSchema: {
        title: z.string().min(1),
        parentId: z.string().optional(),
        ...taskFields,
      },
    },
    (args) => toolResult(() => callApi("/tasks", { method: "POST", body: args })),
  );

  server.registerTool(
    "sp_task_update",
    {
      title: "Update a task",
      description:
        "Updates individual fields of a task. parentId/subTaskIds cannot be changed (results in " +
        "400). deadlineDay/deadlineWithTime/deadlineRemindAt are mutually exclusive.",
      inputSchema: {
        id: z.string(),
        title: z.string().min(1).optional(),
        ...taskFields,
      },
    },
    ({ id, ...patch }) => toolResult(() => callApi(`/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: patch })),
  );

  server.registerTool(
    "sp_task_delete",
    {
      title: "Delete a task",
      description: "Deletes a task irreversibly.",
      inputSchema: { id: z.string() },
    },
    ({ id }) => toolResult(() => callApi(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" })),
  );

  server.registerTool(
    "sp_task_start",
    {
      title: "Start a task",
      description: "Sets the given task as the current task.",
      inputSchema: { id: z.string() },
    },
    ({ id }) => toolResult(() => callApi(`/tasks/${encodeURIComponent(id)}/start`, { method: "POST" })),
  );

  server.registerTool(
    "sp_task_archive",
    {
      title: "Archive a task",
      description: "Moves a task to the archive.",
      inputSchema: { id: z.string() },
    },
    ({ id }) => toolResult(() => callApi(`/tasks/${encodeURIComponent(id)}/archive`, { method: "POST" })),
  );

  server.registerTool(
    "sp_task_restore",
    {
      title: "Restore a task from the archive",
      description: "Restores an archived task.",
      inputSchema: { id: z.string() },
    },
    ({ id }) => toolResult(() => callApi(`/tasks/${encodeURIComponent(id)}/restore`, { method: "POST" })),
  );
}

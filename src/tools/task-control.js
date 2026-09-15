import { z } from "zod";
import { toolResult, parseResponse } from "../tool-result.js";
import { TaskSchema } from "./tasks.js";

/** Tools for reading/changing which task is currently running. */
export function registerTaskControlTools(server, { callApi }) {
  server.registerTool(
    "sp_task_control_get_current",
    {
      title: "Get the currently running task",
      description: "Returns the currently running task (task-control).",
      inputSchema: {},
    },
    () =>
      toolResult(() =>
        callApi("/task-control/current").then((data) => parseResponse(TaskSchema.nullable(), data)),
      ),
  );

  server.registerTool(
    "sp_task_control_set_current",
    {
      title: "Set the current task",
      description: "Sets the current task; omitting taskId (or passing null) clears the current task.",
      inputSchema: { taskId: z.string().nullable().optional() },
    },
    ({ taskId }) =>
      toolResult(() => callApi("/task-control/current", { method: "POST", body: { taskId: taskId ?? null } })),
  );

  server.registerTool(
    "sp_task_control_stop",
    {
      title: "Stop the current task",
      description: "Stops the currently running task without starting another one.",
      inputSchema: {},
    },
    () => toolResult(() => callApi("/task-control/stop", { method: "POST" })),
  );
}

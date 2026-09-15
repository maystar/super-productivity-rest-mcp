import { z } from "zod";
import { toolResult, parseResponse } from "../tool-result.js";

const FocusTimerSchema = z
  .object({
    purpose: z.enum(["work", "break"]),
    status: z.enum(["running", "paused", "done"]),
    isOvertime: z.boolean(),
    isLongBreak: z.boolean(),
    elapsedMs: z.number(),
    remainingMs: z.number(),
    durationMs: z.number(),
  })
  .passthrough();

export const FocusSchema = z
  .object({
    mode: z.enum(["Flowtime", "Pomodoro", "Countdown"]),
    cycle: z.number(),
    isSessionDone: z.boolean(),
    timer: FocusTimerSchema.nullable(),
  })
  .passthrough();

/** Read-only Focus Mode tool. */
export function registerFocusTools(server, { callApi }) {
  server.registerTool(
    "sp_focus_get",
    {
      title: "Get Focus Mode status",
      description: "Returns the mode (Flowtime/Pomodoro/Countdown), cycle, and running timer, if active.",
      inputSchema: {},
    },
    () => toolResult(() => callApi("/focus").then((data) => parseResponse(FocusSchema, data))),
  );
}

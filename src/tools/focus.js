import { toolResult } from "../tool-result.js";

/** Read-only Focus Mode tool. */
export function registerFocusTools(server, { callApi }) {
  server.registerTool(
    "sp_focus_get",
    {
      title: "Get Focus Mode status",
      description: "Returns the mode (Flowtime/Pomodoro/Countdown), cycle, and running timer, if active.",
      inputSchema: {},
    },
    () => toolResult(() => callApi("/focus")),
  );
}

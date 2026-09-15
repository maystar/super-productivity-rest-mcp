// Small shared helpers for turning API results/errors into MCP tool call results.

export function textResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/**
 * Runs `fn`, wrapping the result (or thrown error) as an MCP tool call result. Every tool handler
 * in this project goes through this so callers get a consistent shape instead of an unhandled
 * rejection, and errors are reported as MCP tool errors (isError: true) rather than protocol-level
 * failures.
 */
export async function toolResult(fn) {
  try {
    return textResult(await fn());
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
}

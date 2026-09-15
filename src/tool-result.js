// Small shared helpers for turning API results/errors into MCP tool call results.

export function textResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/**
 * Validates `data` against a Zod `schema`, returning the parsed value or throwing a readable
 * error. Kept separate from `toolResult` so each tool opts in with whatever schema (if any) it
 * actually has confidence in for its endpoint's response shape — see the per-resource schemas in
 * `src/tools/*.js` for which endpoints that covers and which are left unvalidated because the
 * Local REST API doesn't document their response shape.
 */
export function parseResponse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Unexpected response shape from Super Productivity API: ${issues}`);
  }
  return result.data;
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

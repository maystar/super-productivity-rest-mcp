// Thin HTTP client for the Super Productivity Local REST API
// (https://github.com/super-productivity/super-productivity/wiki/3.01-API#3-local-rest-api).
//
// Deliberately has no knowledge of MCP, sandboxes, or any particular deployment — it only knows
// how to turn a path/method/query/body into a parsed `data` payload or a descriptive error. This
// keeps the module reusable and easy to unit-test in isolation from the MCP SDK.

/**
 * Creates a REST client bound to a base URL and (optional) bearer token.
 *
 * @param {object} config
 * @param {string} config.baseUrl Base URL of the Super Productivity Local REST API,
 *   e.g. "http://localhost:3876" or "http://host.docker.internal:3876".
 * @param {string} [config.token] Bearer token for authenticated endpoints. Only required for
 *   calls made with `auth: true` (the default).
 */
export function createRestClient({ baseUrl, token }) {
  /**
   * Calls one endpoint of the Local REST API and returns its `data` payload.
   *
   * @param {string} path e.g. "/tasks" or "/tasks/abc123"
   * @param {object} [opts]
   * @param {string} [opts.method] Default "GET"
   * @param {Record<string, unknown>} [opts.query] Query parameters; undefined/null/"" values
   *   are omitted rather than sent as empty strings.
   * @param {unknown} [opts.body] Sent as a JSON body when present.
   * @param {boolean} [opts.auth] Default true; only /health works without a token.
   * @returns {Promise<unknown>} The `data` field of a successful `{ ok, data }` response.
   */
  async function callApi(path, opts = {}) {
    const { method = "GET", query, body, auth = true } = opts;

    const url = new URL(path, baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }
    }

    const headers = { Accept: "application/json" };
    if (auth) {
      if (!token) {
        throw new Error(
          "No auth token configured (SP_REST_TOKEN). See README.md for how to provide it.",
        );
      }
      headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new Error(
        `Network error reaching ${url}: ${err.message}. Is Super Productivity running with the ` +
          "Local REST API enabled (Settings → Misc → Enable local REST API), and is this host " +
          "reachable from where this server runs?",
      );
    }

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      throw new Error(`Response from ${url} was not valid JSON (HTTP ${res.status}): ${text.slice(0, 500)}`);
    }

    if (!json || typeof json.ok !== "boolean") {
      throw new Error(`Unexpected response shape from ${url} (HTTP ${res.status}): ${text.slice(0, 500)}`);
    }
    if (!json.ok) {
      const code = json.error?.code ?? "UNKNOWN";
      const message = json.error?.message ?? "(no error message)";
      throw new Error(`${code} (HTTP ${res.status}): ${message}`);
    }
    return json.data;
  }

  return { callApi };
}

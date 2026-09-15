# CLAUDE.md

Guidance for working in this repo.

## What this is

A standalone MCP server wrapping the Super Productivity Local REST API. See README.md for the
user-facing description, configuration, and tool list.

This repo was extracted from a larger workspace (`super-productivity/kits/super-productivity-rest-mcp/mcp-server/`)
where it started life as one file inside a Docker `sbx` sandbox kit. It is meant to be fully
portable and stand on its own — it must not assume it's running inside that kit, that sandbox
product, or any particular host. Don't reintroduce that coupling (e.g. hardcoding sandbox-only
paths or env vars as required rather than optional).

## Architecture

- `src/rest-client.js` — the only module that speaks HTTP to Super Productivity. Knows nothing
  about MCP. If you need to call a new REST endpoint, this is where the low-level plumbing
  (query params, auth header, error shape) already lives — don't duplicate it.
- `src/tool-result.js` — shared `toolResult()`/`textResult()`/`parseResponse()` wrapping. Every
  tool handler should go through `toolResult(fn)` so thrown errors become MCP `isError` results
  instead of unhandled rejections.
- `src/tools/*.js` — one module per resource area (health, tasks, task-control, focus, projects,
  tags), each exporting a `register*Tools(server, { callApi })` function, plus (for most) a
  response-shape Zod schema for that resource. `src/server.js` lists them and wires them to a
  `createRestClient(...)` instance.

### Validating API responses

Some tools pipe `callApi(...)`'s result through `parseResponse(SomeSchema, data)` before returning
it, so a response that doesn't match gets a clear "Unexpected response shape" error instead of
silently handing malformed data to the MCP client. This is deliberately *not* applied everywhere:

- Only endpoints whose response shape is actually confirmed (by the wiki, or by fields the API
  docs reference elsewhere, e.g. `projectId`/`tagId` implying `Project`/`Tag` have an `id`) get a
  schema with real field checks — see `TaskSchema` in `src/tools/tasks.js`, `HealthSchema`/
  `FocusSchema`. Every such schema uses `.passthrough()`, so it only rejects genuinely wrong
  shapes, not fields we simply don't know about yet.
- Endpoints whose response shape isn't documented anywhere available (mutation endpoints like
  create/update/delete/start/archive/restore, `/status`) are either left unvalidated or given a
  bare "is an object" schema (e.g. `StatusSchema`) rather than a guessed field list — a wrong
  guess would turn a working tool into one that fails on every real call.
- `TaskSchema`/`TaskListSchema` are exported from `tasks.js` so `task-control.js` can reuse them
  for `GET /task-control/current` instead of redefining the task shape.

If you get better field information for a currently-unvalidated endpoint, tighten its schema —
but don't invent fields you haven't actually confirmed.
- `index.js` — the only place that reads `process.env` and touches stdio. Keep it thin; anything
  that could be unit-tested belongs in `src/`.

## Adding a new tool

1. Find (or add) the right file under `src/tools/`.
2. `server.registerTool(name, { title, description, inputSchema }, handler)`, with the handler
   body wrapped in `toolResult(() => callApi(...))`.
3. Add the tool name to `EXPECTED_TOOLS` in `test/smoke.mjs`.
4. Add a row to the tool table in `README.md`.

Endpoint/field/error-code details for the underlying REST API generally aren't duplicated in this
repo — check the [Local REST API wiki page](https://github.com/super-productivity/super-productivity/wiki/3.01-API#3-local-rest-api)
directly when adding or changing a tool. The one deliberate exception is response-shape validation
(see "Validating API responses" above): a resource's *confirmed* response fields are encoded once,
as a Zod schema, specifically so a future API change is caught as a clear validation error instead
of failing silently — this still isn't a general license to duplicate docs elsewhere.

## Testing

`npm test` runs `test/smoke.mjs`, which must stay network-free (it points at an RFC 5737
unroutable address on purpose) so it works in CI, in a container, and offline. Anything that needs
a real, running Super Productivity instance goes in `test/manual-client.mjs` instead, which is not
run automatically.

Before committing a change to `src/` or `index.js`, run:

```bash
npm test
docker build -t super-productivity-rest-mcp:test .   # if the Dockerfile or package files changed
```

## CI/CD

- `.github/workflows/ci.yml` — runs `npm test` and a Docker build (no push) on every push/PR.
- `.github/workflows/docker-publish.yml` — builds and pushes to GHCR
  (`ghcr.io/<owner>/super-productivity-rest-mcp`) on push to `main` and on `v*.*.*` tags.

## Conventions

- Plain ESM (`"type": "module"`), no TypeScript, no bundler — keep it that way unless there's a
  concrete reason to add build tooling.
- User-facing strings (tool descriptions, error messages) are in English, since this is a
  standalone open-source-shaped project, unlike the German-language workspace it was extracted
  from.
- Don't add a runtime dependency without a clear reason; the whole point of this server is to stay
  small enough to read in one sitting.

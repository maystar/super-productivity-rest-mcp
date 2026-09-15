# Super Productivity REST MCP

An [MCP](https://modelcontextprotocol.io) server that exposes the
[Super Productivity](https://super-productivity.com/) desktop app's
[Local REST API](https://github.com/super-productivity/super-productivity/wiki/3.01-API#3-local-rest-api)
as tools an MCP client (e.g. Claude Code) can call directly — list/create/update/delete tasks,
start/stop/archive them, read status and Focus Mode state, and list projects and tags.

It talks to the REST API over plain HTTP and makes no assumption about how it's deployed: run it
locally next to Super Productivity, in a container that reaches the host over
`host.docker.internal`, or anywhere else that can reach the API's base URL.

## Prerequisites

Super Productivity ≥ 14.0.0, with **Settings → Misc → Enable local REST API** turned on. Copy the
access token shown there — you'll need it as `SP_REST_TOKEN` below.

## Configuration

| Env var | Required | Default | Description |
|---|---|---|---|
| `SP_REST_TOKEN` | for authenticated tools | — | Bearer token from Super Productivity's Local REST API settings. Only `sp_health` works without it. |
| `SP_REST_BASE_URL` | no | `http://host.docker.internal:3876` | Base URL of the Local REST API. Use `http://localhost:3876` when running next to Super Productivity on the same machine. |

## Running

### Directly with Node (≥ 20.11)

```bash
npm install
SP_REST_TOKEN=... SP_REST_BASE_URL=http://localhost:3876 node index.js
```

### As a Docker container

```bash
docker build -t super-productivity-rest-mcp .
docker run -i --rm \
  -e SP_REST_TOKEN=... \
  -e SP_REST_BASE_URL=http://host.docker.internal:3876 \
  super-productivity-rest-mcp
```

Pre-built images are published to GHCR on every push to `main` and on version tags — see
`.github/workflows/docker-publish.yml`. Once published:

```bash
docker run -i --rm -e SP_REST_TOKEN=... ghcr.io/<owner>/super-productivity-rest-mcp:latest
```

The server communicates over stdio, so `-i` (keep stdin open) is required; it does not open any
network port of its own.

### Registering with Claude Code

```bash
# Local Node process
claude mcp add super-productivity --scope user -- node /path/to/index.js

# Or via Docker
claude mcp add super-productivity --scope user -- \
  docker run -i --rm -e SP_REST_TOKEN -e SP_REST_BASE_URL ghcr.io/<owner>/super-productivity-rest-mcp:latest
```

Make sure `SP_REST_TOKEN` (and `SP_REST_BASE_URL`, if needed) is present in the environment Claude
Code's MCP client subprocess inherits.

## Tools

| Tool | Description |
|---|---|
| `sp_health` | Health check (unauthenticated) |
| `sp_status` | Current task + total task count |
| `sp_tasks_list` | List tasks, filterable by title/project/tag/done-state/source |
| `sp_task_get` | Get one task by id |
| `sp_task_create` | Create a task |
| `sp_task_update` | Update fields of a task |
| `sp_task_delete` | Delete a task |
| `sp_task_start` | Set a task as the current task |
| `sp_task_archive` | Archive a task |
| `sp_task_restore` | Restore an archived task |
| `sp_task_control_get_current` | Get the currently running task |
| `sp_task_control_set_current` | Set/clear the current task |
| `sp_task_control_stop` | Stop the current task |
| `sp_focus_get` | Focus Mode status (Flowtime/Pomodoro/Countdown) |
| `sp_projects_list` | List projects |
| `sp_tags_list` | List tags |

## Project layout

```
index.js              entry point: reads env config, connects the server to stdio
src/server.js          builds the McpServer and wires all tool modules to a REST client
src/rest-client.js      thin HTTP client for the Local REST API (no MCP knowledge)
src/tool-result.js      shared helpers for shaping tool call results/errors
src/tools/*.js          one module per resource (tasks, task-control, focus, projects, tags, health)
test/smoke.mjs          automated test: server + in-memory MCP client, no network required
test/manual-client.mjs  manual verification client against a real, running Super Productivity instance
```

## Testing

```bash
npm test
```

Runs `test/smoke.mjs`: connects an in-memory MCP client to the server, checks the expected 16
tools are registered, and confirms a call against an unreachable backend fails as a reported tool
error rather than crashing. This needs no real Super Productivity instance and is what CI runs.

To verify against a real instance, run:

```bash
SP_REST_TOKEN=... [SP_REST_BASE_URL=http://localhost:3876] node test/manual-client.mjs
```

## License

Not yet decided — pick one (e.g. MIT) before relying on this outside your own use.

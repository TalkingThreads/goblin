# API Reference

This section provides detailed API documentation for Goblin MCP Gateway.

## Table of Contents

- [HTTP Endpoints](#http-endpoints)
- [CLI Commands](#cli-commands)
- [Configuration](#configuration)
- [WebSocket Events](#websocket-events)

---

## HTTP Endpoints

### GET /health

Health check endpoint for monitoring.

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T12:00:00Z",
  "uptime": 3600,
  "version": "0.3.0-rc.1",
  "servers": {
    "total": 2,
    "online": 2,
    "offline": 0
  },
  "memory": {
    "heapUsed": 45000000,
    "heapTotal": 67000000,
    "rss": 120000000
  }
}
```

### GET /status

Detailed gateway status.

**Response**:

```json
{
  "gateway": {
    "status": "running",
    "port": 3000,
    "host": "127.0.0.1",
    "uptime": 3600
  },
  "servers": [
    {
      "name": "filesystem",
      "status": "online",
      "transport": "stdio",
      "tools": 14,
      "latencyMs": 5
    }
  ],
  "metrics": {
    "requestsTotal": 1500,
    "requestsPerSecond": 0.4,
    "averageLatencyMs": 45
  }
}
```

### GET /tools

List available tools with optional filtering.

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `server` | string | Filter by server name |
| `search` | string | Fuzzy search in name/description |
| `limit` | number | Maximum results (default: 100) |
| `offset` | number | Pagination offset |

**Response**:

```json
{
  "tools": [
    {
      "name": "filesystem_list_files",
      "description": "List files in a directory",
      "server": "filesystem",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Directory path"
          }
        },
        "required": ["path"]
      }
    }
  ],
  "total": 45,
  "offset": 0
}
```

### GET /servers

List configured servers with status.

**Response**:

```json
{
  "servers": [
    {
      "name": "filesystem",
      "description": "Filesystem access",
      "transport": "stdio",
      "status": "online",
      "enabled": true,
      "tools": 14,
      "prompts": 0,
      "resources": 3
    }
  ]
}
```

### GET /metrics

Prometheus-compatible metrics endpoint.

**Response**:

```
# HELP goblin_requests_total Total number of requests
# TYPE goblin_requests_total counter
goblin_requests_total 1500

# HELP goblin_request_duration_ms Request duration in milliseconds
# TYPE goblin_request_duration_ms histogram
goblin_request_duration_ms_bucket{le="50"} 1200
goblin_request_duration_ms_bucket{le="100"} 1450
goblin_request_duration_ms_bucket{le="200"} 1490
goblin_request_duration_ms_bucket{le="+Inf"} 1500

# HELP goblin_servers_online Number of online servers
# TYPE goblin_servers_online gauge
goblin_servers_online 2
```

### GET /sse

Server-Sent Events endpoint for streaming responses.

**Usage**:

```javascript
const eventSource = new EventSource("http://localhost:3000/sse");

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

eventSource.onerror = (error) => {
  console.error("SSE Error:", error);
};
```

**Event Types**:

| Event | Description |
|-------|-------------|
| `initialized` | Client successfully connected |
| `tool-call` | Incoming tool call request |
| `tool-result` | Tool invocation result |
| `resource-update` | Resource content changed |
| `error` | Error occurred |

### POST /messages

JSON-RPC message endpoint for requests.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "filesystem_list_files",
    "arguments": {
      "path": "/tmp"
    }
  }
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "file1.txt\nfile2.txt\nfile3.txt"
      }
    ]
  }
}
```

---

## CLI Commands

### goblin start

Start the MCP Gateway.

```bash
goblin start [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--port, -p` | Gateway port (default: 3000) |
| `--host` | Gateway host (default: 127.0.0.1) |
| `--config, -c` | Config file path |
| `--tui` | Enable TUI mode |
| `--no-tui` | Disable TUI (headless mode) |
| `--log-level` | Logging level |
| `--auth-mode` | Authentication mode |

**Examples**:

```bash
# Default start
goblin start

# Custom port
goblin start --port 8080

# With config file
goblin start --config /path/to/config.json

# With TUI
goblin start --tui

# Production mode
goblin start --port 443 --auth-mode production
```

### goblin status

Show gateway status.

```bash
goblin status [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--json` | JSON output |
| `--url` | Remote gateway URL |
| `--verbose` | Verbose output |

**Examples**:

```bash
goblin status
goblin status --json
goblin status --url http://localhost:8080 --verbose
```

### goblin tools

List available tools.

```bash
goblin tools [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--server` | Filter by server name |
| `--search` | Search query |
| `--json` | JSON output |
| `--limit` | Maximum results |

**Examples**:

```bash
goblin tools
goblin tools --server filesystem
goblin tools --search "list"
goblin tools --json --limit 10
```

### goblin servers

List configured servers.

```bash
goblin servers [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--status` | Filter by status (online/offline) |
| `--json` | JSON output |

**Examples**:

```bash
goblin servers
goblin servers --status online --json
```

### goblin config

Configuration management commands.

```bash
goblin config <subcommand> [options]
```

**Subcommands**:

| Subcommand | Description |
|------------|-------------|
| `validate` | Validate config file |
| `show` | Display current config |
| `path` | Show config file path |

**Examples**:

```bash
goblin config validate
goblin config show
goblin config show --json
```

### goblin logs

View gateway logs.

```bash
goblin logs [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--level` | Filter by level (error/warn/info/debug) |
| `--follow, -f` | Follow log output |
| `--json` | JSON output |
| `--lines` | Number of lines (default: 50) |

**Examples**:

```bash
goblin logs
goblin logs --level error
goblin logs -f --level info
goblin logs --json | jq '.'
```

### goblin health

Show health status.

```bash
goblin health [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--json` | JSON output |
| `--url` | Remote gateway URL |
| `--verbose` | Include detailed metrics |

**Examples**:

```bash
goblin health
goblin health --json --verbose
```

---

## Configuration

### Server Configuration

```typescript
interface ServerConfig {
  name: string;
  description?: string;
  transport: "stdio" | "http" | "sse";
  enabled?: boolean;

  // STDIO transport
  command?: string;
  args?: string[];
  env?: Record<string, string>;

  // HTTP transport
  url?: string;
  headers?: Record<string, string>;

  // Connection settings
  connectionTimeout?: number;
  maxRetries?: number;
}
```

### Gateway Configuration

```typescript
interface GatewayConfig {
  port: number;
  host: string;

  auth?: {
    mode: "dev" | "production";
    apiKeys?: string[];
  };

  policies?: {
    outputSizeLimit?: number;
    defaultTimeout?: number;
    maxConnections?: number;
    rateLimit?: {
      requestsPerMinute?: number;
      burstSize?: number;
    };
  };

  logging?: {
    level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    format?: "json" | "pretty";
    file?: string;
    bufferSize?: number;
  };
}
```

---

## WebSocket Events

Goblin uses Server-Sent Events (SSE) for real-time communication.

### Connection Lifecycle

```typescript
// 1. Connect to SSE endpoint
const sse = new EventSource("http://localhost:3000/sse");

// 2. Receive initialization
sse.addEventListener("initialized", (event) => {
  const data = JSON.parse(event.data);
  console.log("Client ID:", data.clientId);
});

// 3. Receive tool calls from clients
sse.addEventListener("tool-call", (event) => {
  const data = JSON.parse(event.data);
  console.log("Tool:", data.name);
  console.log("Arguments:", data.arguments);
});

// 4. Handle errors
sse.addEventListener("error", (event) => {
  const data = JSON.parse(event.data);
  console.error("Error:", data.message);
});
```

### Sending Results

Use the `/messages` endpoint to send tool results:

```typescript
const response = await fetch("http://localhost:3000/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "request-id",
    result: {
      content: [
        { type: "text", text: "Result content" }
      ]
    }
  })
});
```

---

## Error Codes

Goblin uses structured error codes for debugging:

| Code | Description |
|------|-------------|
| `CONN-001` | Connection refused |
| `CONN-002` | Connection timeout |
| `CONN-003` | Server not found |
| `TOOL-001` | Tool not found |
| `TOOL-002` | Tool invocation failed |
| `TOOL-003` | Tool timeout |
| `CFG-001` | Invalid configuration |
| `CFG-002` | Config file not found |
| `AUTH-001` | Authentication required |
| `AUTH-002` | Invalid API key |
| `TRANSPORT-001` | Transport error |
| `INTERNAL-001` | Internal error |

---

## Related Documentation

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [Configuration](../example-config.json)

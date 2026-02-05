# API Reference

This section provides detailed API documentation for Goblin MCP Gateway.

## Table of Contents

- [GET /health](#get--health)
- [GET /status](#get--status)
- [GET /tools](#get--tools)
- [GET /servers](#get--servers)
- [POST /mcp](#post--mcp)
- [GET /metrics](#get--metrics)
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

### POST /mcp

Streamable HTTP endpoint for MCP protocol communication. Supports both stateless and stateful (session-based) connections.

**Headers**:

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `mcp-session-id` | No | Session ID for stateful connections. Include to resume an existing session. |

**Request Body**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "test-client",
      "version": "1.0.0"
    }
  }
}
```

**Response** (Stateful - New Session):

```
HTTP/1.1 200 OK
Content-Type: application/json
mcp-session-id: 550e8400-e29b-41d4-a716-446655440000
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-11-05",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true, "listChanged": true },
      "prompts": { "listChanged": true }
    },
    "serverInfo": {
      "name": "goblin",
      "version": "1.0.0"
    }
  }
}
```

**Response** (Stateful - Resumed Session):

```
HTTP/1.1 200 OK
Content-Type: application/json
mcp-session-id: 550e8400-e29b-41d4-a716-446655440000
```

**Response** (Stateless - No Session Header):

For stateless requests, the server processes the request without creating a session.

**Error Responses**:

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid JSON-RPC message |
| 401 | Unauthorized - Missing or invalid API key |
| 404 | Session not found (when providing invalid mcp-session-id) |
| 429 | Too Many Requests - Max concurrent sessions exceeded |

**Error Response Example**:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Too many concurrent sessions"
  },
  "id": null
}
```

**Session Management**:

- Sessions are created automatically on first request (without `mcp-session-id` header)
- Sessions persist across multiple requests when `mcp-session-id` header is included
- Sessions time out after inactivity (default: 5 minutes, configurable)
- Maximum concurrent sessions: 1000 (configurable)

**Configuration**:

```json
{
  "gateway": {
    "transport": "streamablehttp"
  },
  "streamableHttp": {
    "sseEnabled": true,
    "sessionTimeout": 300000,
    "maxSessions": 1000
  }
}
```

**Example Usage**:

```bash
# Initial connection (creates session)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Store the session ID from response header
SESSION_ID="550e8400-e29b-41d4-a716-446655440000"

# Continue session
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
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

### GET /security

New endpoint for security information and audit logs.

**Response**:

```json
{
  "status": "healthy",
  "authentication": {
    "mode": "apikey",
    "users": 2,
    "activeTokens": 5,
    "lastAuthentication": "2026-02-03T11:59:00Z"
  },
  "authorization": {
    "roleBasedAccess": true,
    "policyEnforcement": true,
    "lastAuthorization": "2026-02-03T11:59:30Z"
  },
  "audit": {
    "events": 150,
    "lastEvent": "2026-02-03T11:59:45Z",
    "retentionDays": 30
  },
  "rateLimiting": {
    "status": "healthy",
    "requestsPerMinute": 600,
    "burstSize": 100,
    "currentRequests": 45
  },
  "tls": {
    "enabled": true,
    "version": "TLS 1.3",
    "cipherSuite": "TLS_AES_128_GCM_SHA256",
    "certificate": {
      "issuer": "Let's Encrypt",
      "validFrom": "2026-01-01",
      "validTo": "2026-04-01"
    }
  }
}
```

### POST /security/audit

Endpoint for retrieving audit logs.

**Request**:

```json
{
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-02-03T23:59:59Z",
  "user": "admin",
  "action": "tool-invocation",
  "limit": 100,
  "offset": 0
}
```

**Response**:

```json
{
  "logs": [
    {
      "timestamp": "2026-02-03T11:59:45Z",
      "user": "admin",
      "action": "tool-invocation",
      "resource": "filesystem_list_files",
      "status": "success",
      "metadata": {
        "arguments": {"path": "/tmp"},
        "durationMs": 15
      }
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### POST /security/scan

Endpoint for security scanning and vulnerability assessment.

**Request**:

```json
{
  "type": "vulnerability-scan",
  "scope": "full",
  "include": ["authentication", "authorization", "rate-limiting", "tls"]
}
```

**Response**:

```json
{
  "scanId": "scan-12345",
  "type": "vulnerability-scan",
  "status": "in-progress",
  "startedAt": "2026-02-03T12:00:00Z",
  "estimatedCompletion": "2026-02-03T12:05:00Z",
  "results": {
    "authentication": {
      "status": "healthy",
      "issues": 0,
      "recommendations": []
    },
    "authorization": {
      "status": "healthy",
      "issues": 0,
      "recommendations": []
    },
    "rateLimiting": {
      "status": "healthy",
      "issues": 0,
      "recommendations": []
    },
    "tls": {
      "status": "healthy",
      "issues": 0,
      "recommendations": []
    }
  }
}
```

### GET /v1/security/scan/{scanId}

Endpoint for checking security scan status.

**Response**:

```json
{
  "scanId": "scan-12345",
  "type": "vulnerability-scan",
  "status": "completed",
  "startedAt": "2026-02-03T12:00:00Z",
  "completedAt": "2026-02-03T12:04:30Z",
  "duration": 270,
  "results": {
    "overallStatus": "healthy",
    "criticalIssues": 0,
    "highIssues": 0,
    "mediumIssues": 0,
    "lowIssues": 0,
    "recommendations": [
      "Consider implementing IP whitelisting",
      "Enable multi-factor authentication for admin users"
    ]
  }
}
```

### POST /v1/security/audit

Endpoint for creating audit events (used by internal components).

**Request**:

```json
{
  "user": "admin",
  "action": "tool-invocation",
  "resource": "filesystem_list_files",
  "status": "success",
  "metadata": {
    "arguments": {"path": "/tmp"},
    "durationMs": 15,
    "clientIp": "192.168.1.100",
    "userAgent": "Goblin CLI/1.0.0"
  }
}
```

**Response**:

```json
{
  "eventId": "event-67890",
  "timestamp": "2026-02-03T12:05:00Z",
  "status": "accepted"
}
```

### GET /v1/users

Endpoint for user management (admin only).

**Response**:

```json
{
  "users": [
    {
      "username": "admin",
      "roles": ["admin", "developer"],
      "active": true,
      "lastLogin": "2026-02-03T10:00:00Z",
      "createdAt": "2026-01-15T08:00:00Z"
    },
    {
      "username": "developer",
      "roles": ["developer"],
      "active": true,
      "lastLogin": "2026-02-03T09:30:00Z",
      "createdAt": "2026-01-20T14:00:00Z"
    }
  ],
  "total": 2,
  "active": 2
}
```

### POST /v1/users

Endpoint for creating new users (admin only).

**Request**:

```json
{
  "username": "newuser",
  "password": "SecurePassword123!",
  "roles": ["developer"],
  "active": true
}
```

**Response**:

```json
{
  "userId": "user-12345",
  "username": "newuser",
  "apiKey": "new-api-key-xyz",
  "roles": ["developer"],
  "active": true,
  "createdAt": "2026-02-03T12:10:00Z"
}
```

### PUT /v1/users/{username}

Endpoint for updating user information (admin only).

**Request**:

```json
{
  "roles": ["developer", "auditor"],
  "active": true
}
```

**Response**:

```json
{
  "userId": "user-12345",
  "username": "newuser",
  "roles": ["developer", "auditor"],
  "active": true,
  "updatedAt": "2026-02-03T12:15:00Z"
}
```

### DELETE /v1/users/{username}

Endpoint for deleting users (admin only).

**Response**:

```json
{
  "userId": "user-12345",
  "username": "newuser",
  "deletedAt": "2026-02-03T12:20:00Z",
  "status": "deleted"
}
```

---

---

## CLI Commands

### goblin security

New security management commands.

```bash
goblin security [subcommand] [options]
```

**Subcommands**:

| Subcommand | Description |
|------------|-------------|
| `scan` | Run security scan |
| `audit` | View audit logs |
| `users` | User management |
| `policies` | Policy management |

**Examples**:

```bash
# Run security scan
goblin security scan

# View audit logs
goblin security audit --user admin --limit 50

# User management
goblin security users list
goblin security users create --username newuser --role developer
goblin security users update --username admin --role admin,auditor
goblin security users delete --username olduser

# Policy management
goblin security policies list
goblin security policies create --name tool-access --tool filesystem_list_files --roles developer,admin
goblin security policies update --name tool-access --roles admin only
goblin security policies delete --name old-policy
```

### goblin users

User management commands (admin only).

```bash
goblin users [subcommand] [options]
```

**Subcommands**:

| Subcommand | Description |
|------------|-------------|
| `list` | List all users |
| `create` | Create new user |
| `update` | Update user information |
| `delete` | Delete user |
| `reset-key` | Reset user API key |

**Examples**:

```bash
# List users
goblin users list

# Create user
goblin users create --username newuser --role developer --active

# Update user
goblin users update --username admin --role admin,auditor

# Reset API key
goblin users reset-key --username admin

# Delete user
goblin users delete --username olduser
```

---

---

## Configuration

### Server Configuration

```typescript
interface ServerConfig {
  name: string;
  description?: string;
  transport: "stdio" | "http" | "sse" | "streamablehttp";
  enabled?: boolean;

  // STDIO transport
  command?: string;
  args?: string[];
  env?: Record<string, string>;

  // HTTP/SSE/StreamableHTTP transports
  url?: string;
  headers?: Record<string, string>;

  // Reconnection settings
  reconnect?: {
    enabled?: boolean;
    delay?: number;
    maxRetries?: number;
    backoffMultiplier?: number;
  };

  // Connection settings
  connectionTimeout?: number;
  maxRetries?: number;
}
```

### Streamable HTTP Client Transport Configuration

Goblin supports connecting to MCP servers using the Streamable HTTP protocol. This transport provides stateful connections with session management, automatic reconnection, and custom headers support.

#### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `transport` | string | Yes | - | Must be `"streamablehttp"` |
| `url` | string | Yes | - | MCP server URL (e.g., `http://localhost:3000/mcp`) |
| `headers` | object | No | - | Custom HTTP headers for authentication |
| `reconnect.enabled` | boolean | No | `true` | Enable automatic reconnection |
| `reconnect.delay` | number | No | `1000` | Initial delay in ms before reconnecting |
| `reconnect.maxRetries` | number | No | `5` | Maximum reconnection attempts |
| `reconnect.backoffMultiplier` | number | No | `2` | Exponential backoff multiplier |
| `connectionTimeout` | number | No | `30000` | Connection timeout in ms |

#### Example Configuration

**Basic Streamable HTTP Server:**

```json
{
  "name": "remote-mcp-server",
  "transport": "streamablehttp",
  "url": "http://localhost:3000/mcp",
  "enabled": true
}
```

**With Authentication Headers:**

```json
{
  "name": "authenticated-server",
  "transport": "streamablehttp",
  "url": "https://api.example.com/mcp",
  "headers": {
    "Authorization": "Bearer your-token-here",
    "X-API-Key": "your-api-key"
  },
  "enabled": true
}
```

**With Custom Headers:**

```json
{
  "name": "custom-server",
  "transport": "streamablehttp",
  "url": "http://localhost:3001/mcp",
  "headers": {
    "X-Client-Version": "1.0.0",
    "X-Request-ID": "request-123",
    "X-Custom-Header": "custom-value"
  },
  "enabled": true
}
```

**With Reconnection Configuration:**

```json
{
  "name": "reliable-server",
  "transport": "streamablehttp",
  "url": "http://localhost:3002/mcp",
  "reconnect": {
    "enabled": true,
    "delay": 2000,
    "maxRetries": 10,
    "backoffMultiplier": 1.5
  },
  "connectionTimeout": 60000,
  "enabled": true
}
```

**Complete Configuration:**

```json
{
  "name": "production-server",
  "description": "Production MCP server with full configuration",
  "transport": "streamablehttp",
  "url": "https://mcp.example.com/api/v1/mcp",
  "headers": {
    "Authorization": "Bearer ${MCP_TOKEN}",
    "X-Client-Id": "goblin-gateway",
    "X-Client-Version": "1.0.0"
  },
  "reconnect": {
    "enabled": true,
    "delay": 1000,
    "maxRetries": 5,
    "backoffMultiplier": 2
  },
  "connectionTimeout": 30000,
  "enabled": true
}
```

#### Headers Types

**Bearer Token:**

```json
{
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**API Key:**

```json
{
  "headers": {
    "X-API-Key": "your-api-key-here"
  }
}
```

**Multiple Headers:**

```json
{
  "headers": {
    "Authorization": "Bearer token",
    "X-API-Key": "key",
    "X-Client-Version": "1.0.0",
    "X-Request-ID": "req-123",
    "X-Custom-Header": "value"
  }
}
```

#### Reconnection Behavior

When `reconnect.enabled` is `true`, Goblin will automatically attempt to reconnect to the server if the connection is lost:

1. **Initial Delay**: Waits `reconnect.delay` milliseconds before first reconnection attempt
2. **Exponential Backoff**: Each subsequent attempt multiplies the delay by `reconnect.backoffMultiplier`
3. **Max Retries**: Stops after `reconnect.maxRetries` failed attempts

**Example reconnection progression (default settings):**
- Attempt 1: 1000ms delay
- Attempt 2: 2000ms delay (2x)
- Attempt 3: 4000ms delay (2x)
- Attempt 4: 8000ms delay (2x)
- Attempt 5: 16000ms delay (2x)
- Final attempt: Stops and reports error

#### Session Access

When using StreamableHTTPClientTransport, you can access the session ID via the SDK's built-in `sessionId` property:

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamablehttp.js";

const transport = new StreamableHTTPClientTransport({
  url: new URL("http://localhost:3000/mcp"),
  requestInit: {
    headers: {
      Authorization: "Bearer token",
    },
  },
});

const sessionId = transport.sessionId;
```

#### Environment Variable Substitution

Headers values support environment variable substitution using `${VAR_NAME}` syntax:

```json
{
  "name": "server-with-env",
  "transport": "streamablehttp",
  "url": "http://localhost:3000/mcp",
  "headers": {
    "Authorization": "Bearer ${MCP_TOKEN}",
    "X-Client-Id": "${CLIENT_ID}"
  },
  "enabled": true
}
```

Set the environment variables before starting Goblin:

```bash
export MCP_TOKEN="your-token"
export CLIENT_ID="goblin-client"
goblin start
```

#### Error Handling

The transport reports errors with structured error codes:

| Error Code | Description |
|------------|-------------|
| `TRANSPORT-001` | Connection failed |
| `TRANSPORT-002` | Connection timeout |
| `TRANSPORT-003` | Server returned error |
| `TRANSPORT-004` | Reconnection failed after max retries |
| `TRANSPORT-005` | Invalid response from server |

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
| `AUTH-003` | User not found |
| `AUTH-004` | User disabled |
| `AUTH-005` | Invalid credentials |
| `AUTH-006` | Token expired |
| `AUTH-007` | Rate limit exceeded |
| `AUTH-008` | Permission denied |
| `AUTH-009` | Role not authorized |
| `AUTH-010` | Security scan failed |
| `AUTH-011` | Audit log not found |
| `AUTH-012` | User already exists |
| `AUTH-013` | Insufficient permissions |
| `AUTH-014` | Invalid API key format |
| `AUTH-015` | Authentication timeout |
| `POLICY-001` | Policy violation |
| `POLICY-002` | Rate limit exceeded |
| `POLICY-003` | Output size limit exceeded |
| `POLICY-004` | Timeout exceeded |
| `POLICY-005` | Invalid policy configuration |
| `SECURITY-001` | Security scan failed |
| `SECURITY-002` | Audit log not found |
| `SECURITY-003` | Invalid security configuration |
| `SECURITY-004` | Unauthorized access attempt |
| `SECURITY-005` | Suspicious activity detected |
| `SECURITY-006` | Certificate validation failed |
| `SECURITY-007` | Encryption required |
| `SECURITY-008` | Decryption failed |
| `SECURITY-009` | Key management error |
| `SECURITY-010` | Audit trail corrupted |

---

## Related Documentation

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [Configuration](../example-config.json)

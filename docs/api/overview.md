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

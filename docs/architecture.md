# Architecture Overview

This document describes the high-level architecture of Goblin MCP Gateway, including key components, data flows, and design decisions.

## System Overview

Goblin MCP Gateway is a **Model Context Protocol (MCP) aggregator** that provides a single unified endpoint for multiple backend MCP servers.

```
┌─────────────────────────────────────────────────────────────┐
│                      Goblin MCP Gateway                      │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Client  │──▶│  HTTP    │──▶│  Router  │──▶│ Registry │ │
│  │  (MCP)   │   │ Gateway  │   │          │   │          │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                      │              │        │
│                                      ▼              ▼        │
│  ┌──────────┐   ┌────────── ┌──────────┐  ┐   ┌──────────┐ │
│  │  Client  │◀──│   TUI    │◀──│ Metrics  │◀──│ Transport│ │
│  │  (MCP)   │   │ Dashboard│   │          │   │   Pool   │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ MCP Server 1 │    │ MCP Server 2 │    │ MCP Server N │
│ (Filesystem) │    │ (Git)        │    │ (Custom)     │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Core Components

### 1. HTTP Gateway

**Purpose**: Accept connections from MCP clients

**Technology**: [Hono](https://hono.dev/)

**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | Server-Sent Events for streaming responses |
| `/messages` | POST | JSON-RPC message handling |
| `/status` | GET | Gateway status and health |
| `/tools` | GET | List available tools |
| `/metrics` | GET | Prometheus-compatible metrics |

**Key Files**:
- `src/gateway/http.ts` - HTTP server implementation
- `src/gateway/sse.ts` - SSE transport handling

### 2. Transport Layer

**Purpose**: Manage connections to backend MCP servers

**Transports Supported**:

| Transport | Use Case | Protocol |
|-----------|----------|----------|
| `stdio` | Local child processes | Standard I/O |
| `http` | Remote servers | HTTP + SSE |
| `sse` | Legacy servers | Server-Sent Events |

**Key Files**:
- `src/transport/stdio.ts` - STDIO transport
- `src/transport/http.ts` - HTTP transport
- `src/transport/pool.ts` - Connection pooling

### 3. Tool Registry

**Purpose**: Aggregate and index tools from all backend servers

**Features**:
- Automatic synchronization
- Tool namespacing (`serverName_toolName`)
- Fuzzy search with MiniSearch
- Change event propagation

**Key Files**:
- `src/gateway/registry.ts` - Registry implementation
- `src/gateway/events.ts` - Event system

### 4. Router

**Purpose**: Route tool calls to correct backend servers

**Features**:
- Namespaced tool resolution
- Timeout enforcement
- Error mapping
- Request cancellation

**Key Files**:
- `src/gateway/router.ts` - Routing logic
- `src/gateway/timeout.ts` - Timeout handling

### 5. Configuration System

**Purpose**: Manage gateway configuration with hot reload

**Features**:
- JSON Schema validation
- Hot reload support
- Environment variable overrides
- OS-standard paths
- First-run auto-initialization
- Centralized ConfigManager singleton

**Key Files**:
- `src/config/manager.ts` - ConfigManager singleton (centralized config handling)
- `src/config/loader.ts` - Config loading
- `src/config/initializer.ts` - First-run detection
- `src/config/writer.ts` - Config file writing
- `src/config/defaults.ts` - Default configuration
- `src/config/paths.ts` - Cross-platform path resolution
- `src/config/schema.ts` - JSON Schema
- `src/config/watcher.ts` - Hot reload

**ConfigManager API**:
```typescript
import { initConfig, getConfigManager } from "./config/manager.js";

// Initialize with optional custom path
const config = await initConfig({ customPath: "/path/to/config.json" });

// Or use singleton pattern
const manager = getConfigManager();
await manager.initialize({ customPath: "/path/to/config.json" });
const config = manager.getConfig();
```

### 6. Observability

**Purpose**: Logging, metrics, and tracing

**Components**:

| Component | Technology | Purpose |
|-----------|------------|---------|
| Logging | Pino | Structured JSON logging |
| Metrics | Custom (zero-dep) | In-memory metrics |
| Tracing | Correlation IDs | Request tracing |

**Key Files**:
- `src/observability/logger.ts` - Logging setup
- `src/observability/metrics.ts` - Metrics registry
- `src/observability/tracing.ts` - Request correlation

### 7. Terminal UI (TUI)

**Purpose**: Interactive dashboard for monitoring

**Panels**:
- **Servers**: Real-time server status
- **Tools**: Available tools catalog
- **Prompts**: MCP prompts browser
- **Resources**: Resources viewer
- **Metrics**: Real-time performance metrics
- **Logs**: Gateway activity logs

**Key Files**:
- `src/tui/app.tsx` - Main TUI application
- `src/tui/panels/*` - Individual panels

## Data Flow

### Tool Invocation

```
1. Client sends tool call request
         │
         ▼
2. HTTP Gateway receives request
         │
         ▼
3. Router extracts server name from namespaced tool
         │
         ▼
4. Transport Pool gets or creates connection
         │
         ▼
5. Request forwarded to backend server
         │
         ▼
6. Response mapped to MCP protocol format
         │
         ▼
7. Response sent back to client
```

### Tool Discovery

```
1. Client requests tools/list
         │
         ▼
2. Registry gathers tools from all connected servers
         │
         ▼
3. Tools are namespaced and aggregated
         │
         ▼
4. MiniSearch index updated (if needed)
         │
         ▼
5. Compact tool list sent to client
```

### Configuration Hot Reload

```
1. Config file changes detected
         │
         ▼
2. ConfigWatcher reads new configuration
         │
         ▼
3. JSON Schema validation
         │
         ▼
4. Changes applied atomically
         │
         ▼
5. Registry notified of changes
         │
         ▼
6. Transport pool reconnects if needed
```

## Directory Structure

```
goblin/
├── src/
│   ├── index.ts              # Application entry point
│   ├── cli/                  # Command-line interface
│   │   ├── commands/         # CLI commands
│   │   │   ├── start.ts      # Start gateway
│   │   │   ├── status.ts     # Show status
│   │   │   ├── tools.ts      # List tools
│   │   │   └── ...
│   │   └── index.ts          # CLI entry
│   ├── config/               # Configuration system
│   │   ├── loader.ts         # Config loading
│   │   ├── schema.ts         # JSON Schema
│   │   └── watcher.ts        # Hot reload
│   ├── gateway/              # MCP gateway logic
│   │   ├── http.ts           # HTTP server
│   │   ├── router.ts         # Request routing
│   │   ├── registry.ts       # Tool registry
│   │   └── server.ts         # MCP server
│   ├── observability/        # Logging & metrics
│   │   ├── logger.ts         # Pino setup
│   │   ├── metrics.ts        # Custom metrics
│   │   └── utils.ts          # Utilities
│   ├── transport/            # Transport layer
│   │   ├── stdio.ts          # STDIO transport
│   │   ├── http.ts           # HTTP transport
│   │   └── pool.ts           # Connection pool
│   └── tui/                  # Terminal UI
│       ├── app.tsx            # Main application
│       └── panels/            # Dashboard panels
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── smoke/                # Smoke tests
│   └── performance/          # Performance tests
├── docs/                     # Documentation
│   ├── getting-started.md
│   ├── architecture.md
│   ├── cli-reference.md
│   └── troubleshooting.md
└── openspec/                 # Specifications
```

## Design Principles

### 1. Config-Driven

All behavior is configured via JSON, allowing changes without code modifications.

### 2. Event-Driven

Components communicate through events, enabling loose coupling and reactivity.

### 3. Namespaced Everything

All resources from backend servers are namespaced to prevent collisions:
- Tools: `serverName_toolName`
- Prompts: `serverName_promptName`
- Resources: `mcp://serverName/resourceUri`

### 4. Observable First

Every operation produces logs and metrics for debugging and monitoring.

### 5. Graceful Degradation

Gateway continues operating even if individual backend servers fail.

## Performance Considerations

### Latency Targets

| Operation | Target P95 |
|-----------|------------|
| Tool listing | < 50ms |
| Tool invocation | < 100ms |
| Resource read | < 200ms |

### Scalability

- **Connections**: Pooled and reused
- **Search**: O(1) via MiniSearch index
- **Memory**: Bounded by configuration

## Security Model

### Authentication

#### Current Authentication Modes

#### Development Mode (`dev`)
- Open access with no authentication required
- Suitable for local development and testing
- No API keys or credentials needed

#### API Key Authentication (`apikey`)
- Requires API key for client authentication
- API keys configured in `auth.apiKey` configuration
- Basic authentication mechanism for production use

### Authorization and Access Control

#### Server-Level Access Control
- Individual servers can be enabled/disabled via `enabled` flag
- Servers can be configured with different transport types
- Environment variable isolation for child processes

#### Policy-Based Controls
- **Output Size Limits**: Configurable maximum response size (default: 64KB)
- **Timeouts**: Configurable default timeouts (default: 30 seconds)
- **Connection Limits**: Configurable maximum concurrent connections
- **Rate Limiting**: Configurable requests per minute and burst size

### Future Security Enhancements (v1.0.0)

#### OAuth 2.0 and OIDC Integration
- Native OAuth 2.0 authentication flows
- OpenID Connect (OIDC) support
- Integration with popular identity providers
- Token-based authentication

#### Role-Based Access Control (RBAC)
- User role management
- Permission-based access control
- Group-based authorization
- Resource-level permissions

#### Tool-Level Authorization Policies
- Granular tool access control
- Policy-based tool filtering
- Dynamic policy evaluation
- Audit logging for authorization decisions

#### Advanced Security Features
- IP whitelisting and network policies
- Encryption at rest for sensitive configuration
- Multi-factor authentication support
- Compliance certifications (SOC 2, GDPR, etc.)

## Extensibility

### Custom Authentication

#### v1.0.0 Features

1. **Implement `Authenticator` interface**
2. **Register in configuration**
3. **Add middleware to HTTP gateway**

#### Custom Authenticator Interface

```typescript
interface Authenticator {
  authenticate(request: Request): Promise<AuthenticationResult>;
  authorize(user: User, resource: Resource): Promise<AuthorizationResult>;
  getUser(request: Request): Promise<User>;
}
```

### Adding a New Transport

#### v1.0.0 Enhancements

1. **Implement `Transport` interface**
2. **Register in `TransportPool`**
3. **Add CLI options for configuration**
4. **Add security configuration**

#### Transport Security Configuration

```typescript
interface TransportSecurity {
  encryption?: boolean;
  authentication?: boolean;
  authorization?: boolean;
  auditLogging?: boolean;
}
```

### Adding a New Meta Tool

#### v1.0.0 Features

1. **Create tool implementation**
2. **Register in `MetaTools` registry**
3. **Document in CLI help**
4. **Add security policies**

#### Meta Tool Security Policies

```typescript
interface MetaToolPolicy {
  accessControl?: {
    roles?: string[];
    permissions?: string[];
    conditions?: PolicyCondition[];
  };
  auditLogging?: boolean;
  rateLimiting?: {
    requestsPerMinute?: number;
    burstSize?: number;
  };
}
```

## Performance Considerations

### v1.0.0 Performance Targets

#### Enhanced Latency Targets

| Operation | Target P95 |
|-----------|------------|
| Tool listing | < 30ms |
| Tool invocation | < 50ms |
| Resource read | < 100ms |
| Authentication | < 20ms |
| Authorization | < 10ms |

#### Scalability Improvements

- **Connections**: Enhanced connection pooling with security context
- **Search**: Optimized search with security-aware indexing
- **Memory**: Bounded memory with security constraints
- **Throughput**: Enhanced throughput with security processing

## Design Principles (v1.0.0)

### 6. Security-First

All components are designed with security as a primary concern:
- Defense in depth approach
- Principle of least privilege
- Secure defaults
- Security by design

### 7. Compliance-Driven

Built to meet common compliance requirements:
- Data protection regulations
- Access control standards
- Audit requirements
- Industry certifications

### 8. Enterprise-Ready

Designed for enterprise deployment:
- Scalability and performance
- Security and compliance
- Monitoring and observability
- Integration capabilities

## Related Documentation

| Topic | Document |
|-------|----------|
| Configuration | [example-config.json](../docs/example-config.json) |
| CLI Commands | [CLI Reference](cli-reference.md) |
| API Reference | [API Overview](api/overview.md) |
| Contributing | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Security | [Security Features](security.md) |
| Testing | [Testing Approach](testing.md) |

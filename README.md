# Goblin MCP Gateway

> Developer-first MCP gateway that aggregates multiple MCP servers behind a single unified endpoint

## Badges

### Build & CI

![Build](https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/main.yml?style=for-the-badge)
![Tests](https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/tests.yml?style=for-the-badge&label=Tests)
![Smoke Tests](https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/smoke-tests.yml?style=for-the-badge&label=Smoke%20Tests)
![Performance Tests](https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/performance-tests.yml?style=for-the-badge&label=Performance%20Tests)
![Coverage](https://img.shields.io/codecov/c/github/TalkingThreads/goblin?style=flat-square&logo=codecov)

### Version & License

![Version](https://img.shields.io/npm/v/goblin?style=for-the-badge&logo=npm)
![Version](https://img.shields.io/badge/Version-0.3.0--rc.5-blue?style=for-the-badge&logo=version)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

### Roadmap

![v1](https://img.shields.io/badge/Roadmap-v1%20Production--Ready-green?style=for-the-badge&logo=roadmap)
![v2](https://img.shields.io/badge/Roadmap-v2%20Enterprise--Ready-blue?style=for-the-badge&logo=roadmap)

### Technology

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Bun](https://img.shields.io/badge/Bun-1.3-black?style=for-the-badge&logo=bun)

## About

Goblin is a **Model Context Protocol (MCP) gateway** that provides a production-ready solution for aggregating multiple MCP servers behind a single unified endpoint. It solves tool sprawl, context bloat, and brittle integrations in agentic AI systems.

Built with Bun, TypeScript, Hono, and the MCP SDK, Goblin offers blazing-fast performance with sub-50ms latency targets and a developer-first experience including real-time TUI dashboard, structured logging, and comprehensive observability.

## Key Features

- **🔌 Unified Aggregation**: Single endpoint aggregating tools, prompts, and resources from multiple MCP backends
- **🎛️ Intelligent Routing**: Namespaced tool calls with timeout enforcement and error mapping
- **🚀 Multi-Transport**: STDIO, HTTP, SSE, and Streamable HTTP transports with automatic connection pooling
- **🔧 Hot Reload**: Configuration changes applied atomically without restart (HTTP mode) or via SIGHUP (STDIO mode)
- **📊 Full Observability**: Structured logging, custom metrics, and real-time TUI dashboard
- **✅ Enterprise Ready**: 1083+ tests, smoke tests for CI, performance benchmarks

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3.8

### Installation

```bash
# Clone repository
git clone https://github.com/TalkingThreads/goblin.git
cd goblin

# Install dependencies
bun install

# Run development mode (with hot reload)
bun run dev
```

### Build for Production

```bash
# Build the project
bun run build
bun run build:cli

# Run with Bun
bun dist/index.js
```

### Start Gateway

```bash
# Default start
goblin start

# With TUI dashboard
goblin start --tui

# Custom port
goblin start --port 8080
```

That's it! Goblin is now running at `http://127.0.0.1:3000`.

See [Getting Started](docs/getting-started.md) for a detailed guide.

### STDIO Mode (Subprocess Integration)

Goblin can run in STDIO mode for integration with MCP-compatible clients like Claude CLI or Smithery:

```bash
# Run as subprocess MCP server
goblin stdio

# With custom config
goblin stdio --config /path/to/config.json

# Environment variables
GOBLIN_PORT=3000          # Override gateway port
GOBLIN_HOST=127.0.0.1    # Override gateway host
GOBLIN_AUTH_MODE=dev      # Authentication mode (dev/apikey)
GOBLIN_AUTH_APIKEY=xxx   # API key for apikey mode
```

#### Integration Examples

**Claude CLI:**

```json
{
  "mcpServers": {
    "goblin": {
      "command": "goblin",
      "args": ["stdio"]
    }
  }
}
```

**Smithery:**

```json
{
  "mcpServers": {
    "goblin": {
      "command": "npx",
      "args": ["-y", "goblin", "stdio"]
    }
  }
}
```

> **Note**: STDIO mode is single-connection. Each request spawns a new Goblin process. For persistent connections, use HTTP mode with SSE transport or Streamable HTTP.

#### Streamable HTTP Mode (Stateful MCP over HTTP)

Goblin supports Streamable HTTP for stateful MCP connections with session management:

```bash
# Streamable HTTP is enabled by default when using HTTP transport
goblin start
```

**Configuration:**

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

**Features:**

- Session-based stateful connections via `mcp-session-id` header
- Automatic session timeout and cleanup
- Stateless mode without session header
- Up to 1000 concurrent sessions (configurable)

**Example:**

```bash
# Initial connection
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Continue with session
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### Client Transport Types

Goblin supports multiple transport types for connecting to backend MCP servers:

#### STDIO Transport

Local subprocess-based transport for running MCP servers as child processes:

```json
{
  "name": "filesystem",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
  "enabled": true
}
```

#### HTTP Transport

Simple HTTP transport for connecting to HTTP-based MCP servers:

```json
{
  "name": "remote-server",
  "transport": "http",
  "url": "http://localhost:3001/mcp",
  "enabled": true
}
```

#### SSE Transport

Server-Sent Events transport for server-push notifications:

```json
{
  "name": "sse-server",
  "transport": "sse",
  "url": "http://localhost:3002/sse",
  "enabled": true
}
```

#### Streamable HTTP Transport

Stateful HTTP transport with session management, automatic reconnection, and custom headers support:

```json
{
  "name": "streamable-server",
  "transport": "streamablehttp",
  "url": "http://localhost:3003/mcp",
  "headers": {
    "Authorization": "Bearer your-token-here",
    "X-Custom-Header": "custom-value"
  },
  "reconnect": {
    "enabled": true,
    "delay": 1000,
    "maxRetries": 5,
    "backoffMultiplier": 2
  },
  "enabled": true
}
```

**Streamable HTTP Features:**

- Session-based stateful connections via `mcp-session-id` header
- Automatic reconnection with configurable delay and exponential backoff
- Custom headers for authentication (Bearer tokens, API keys)
- Configurable reconnection attempts and timing

**Headers Support:**

- Bearer tokens: `"Authorization": "Bearer token"`
- API keys: `"X-API-Key": "your-key"`
- Custom headers: `"X-Custom-Header": "value"`

**Reconnection Configuration:**

- `enabled`: Enable/disable automatic reconnection (default: true)
- `delay`: Initial delay in ms before reconnecting (default: 1000)
- `maxRetries`: Maximum reconnection attempts (default: 5)
- `backoffMultiplier`: Exponential backoff multiplier (default: 2)

See [API Reference](docs/api/overview.md) for complete Streamable HTTP documentation.

See [CLI Reference](docs/cli-reference.md) for complete STDIO mode documentation.

## Documentation

| Topic | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Step-by-step installation and configuration |
| [Architecture](docs/architecture.md) | System design and component overview |
| [API Reference](docs/api/overview.md) | HTTP endpoints and CLI commands |
| [Configuration](docs/example-config.json) | Complete configuration reference |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |

## CLI Commands

```bash
# Start the gateway
goblin start                    # Default settings
goblin start --tui             # Enable TUI mode
goblin start --port 3000       # Custom port

# STDIO mode (for CLI/subprocess integration)
goblin stdio                   # Run as subprocess MCP server
goblin stdio --config /path   # Custom config path

# Gateway status
goblin status                   # Human-readable
goblin status --json           # JSON output

# List resources
goblin tools                   # All tools
goblin tools --server server1 # Filter by server
goblin servers                 # All servers
goblin servers --status online # Filter by status

# Configuration
goblin config validate         # Validate config
goblin config show            # Display config

# Logs and health
goblin logs                   # Show logs
goblin logs -f                # Follow output
goblin health                 # Health status
```

See [API Reference](docs/api/overview.md) for complete documentation.

## Configuration

Goblin uses a JSON configuration file. Default locations:

- **Linux**: `~/.config/goblin/config.json`
- **macOS**: `~/Library/Application Support/goblin/config.json`
- **Windows**: `%APPDATA%\goblin\config.json`

### Example Configuration

```json
{
  "$schema": "./config.schema.json",
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "enabled": true
    }
  ],
  "gateway": {
    "port": 3000,
    "host": "127.0.0.1"
  },
  "auth": {
    "mode": "dev"
  },
  "policies": {
    "outputSizeLimit": 65536,
    "defaultTimeout": 30000
  }
}
```

See [docs/example-config.json](docs/example-config.json) for a full example.

## Testing

```bash
# Run all tests
bun test

# Run in watch mode
bun test --watch

# Smoke tests (fast validation for CI)
bun run smoke

# Performance tests
bun run perf
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Bun | Fast JavaScript runtime |
| MCP Core | @modelcontextprotocol/sdk | Protocol implementation |
| HTTP Server | Hono | Lightweight web framework |
| Validation | Zod | Runtime type validation |
| Logging | Pino | Structured JSON logging |
| Metrics | Custom (zero-dep) | In-memory metrics |
| CLI | Commander.js | Command-line interface |
| TUI | Ink + React | Terminal UI |

## Contributing

We welcome contributions! Please see [CONTRIBUTE.md](CONTRIBUTE.md) for guidelines.

### Development Workflow

1. Read [AGENTS.md](AGENTS.md) for spec-driven development process
2. Create a change proposal for new features
3. Write tests for your changes
4. Ensure all tests pass: `bun test`
5. Submit a pull request

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level (trace/debug/info/warn/error/fatal) | `info` |
| `GOBLIN_CONFIG_PATH` | Custom config file path | OS-specific default |
| `GOBLIN_PORT` | Gateway port override (STDIO/HTTP) | From config |
| `GOBLIN_HOST` | Gateway host override (STDIO/HTTP) | From config |
| `GOBLIN_AUTH_MODE` | Authentication mode (dev/apikey) | From config |
| `GOBLIN_AUTH_APIKEY` | API key for authentication | From config |
| `NODE_ENV` | Environment (development/production) | `development` |

## Support

- **Issues**: [GitHub Issues](https://github.com/TalkingThreads/goblin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TalkingThreads/goblin/discussions)
- **Security**: [SECURITY.md](SECURITY.md)

## License

[MIT](LICENSE) © TalkingThreads

## Related Documentation

- [CHANGELOG.md](CHANGELOG.md) - Version history
- [MAINTAINERS.md](MAINTAINERS.md) - Project maintainers
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community guidelines
- [openspec/project.md](openspec/project.md) - Project context and design

---

Built with ❤️ by the TalkingThreads team

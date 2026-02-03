# Goblin MCP Gateway

> Developer-first MCP gateway that aggregates multiple MCP servers behind a single unified endpoint

## Badges

### Build & CI

![Build](https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/main.yml?style=flat-square&logo=github)
![Tests](https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/tests.yml?style=flat-square&logo=github)
![Smoke Tests](https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/smoke-tests.yml?style=flat-square&logo=github)

### Version & License

![Version](https://img.shields.io/npm/v/goblin?style=flat-square&logo=npm)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

### Technology

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Bun](https://img.shields.io/badge/Bun-1.3-black?style=flat-square&logo=bun)

## About

Goblin is a **Model Context Protocol (MCP) gateway** that provides a production-ready solution for aggregating multiple MCP servers behind a single unified endpoint. It solves tool sprawl, context bloat, and brittle integrations in agentic AI systems.

Built with Bun, TypeScript, Hono, and the MCP SDK, Goblin offers blazing-fast performance with sub-50ms latency targets and a developer-first experience including real-time TUI dashboard, structured logging, and comprehensive observability.

## Key Features

- **🔌 Unified Aggregation**: Single endpoint aggregating tools, prompts, and resources from multiple MCP backends
- **🎛️ Intelligent Routing**: Namespaced tool calls with timeout enforcement and error mapping
- **🚀 Multi-Transport**: STDIO, HTTP, and SSE transports with automatic connection pooling
- **🔧 Hot Reload**: Configuration changes applied atomically without restart
- **📊 Full Observability**: Structured logging, custom metrics, and real-time TUI dashboard
- **✅ Enterprise Ready**: 668+ tests, smoke tests for CI, performance benchmarks

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3.8
- [Node.js](https://nodejs.org/) >= 20.0.0 (for CLI compatibility)

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

# Run with Node.js
node dist/index.js
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

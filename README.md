# Goblin MCP Gateway

> Developer-first MCP gateway that aggregates multiple MCP servers behind a single unified endpoint

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-black)](https://bun.sh/)

## Overview

Goblin is a **Model Context Protocol (MCP) gateway** that provides a production-ready solution for aggregating multiple MCP servers behind a single unified endpoint:

- 🔌 **Complete MCP aggregation** of Tools, Prompts, and Resources from multiple backends
- 🎛️ **Intelligent routing** with namespacing and timeout enforcement  
- 🚀 **Multiple transport support** including STDIO, HTTP, and Server-Sent Events
- 🔧 **Hot-reload configuration** with JSON Schema validation
- 📊 **Production observability** with structured logging and Prometheus metrics

## Features

### ✅ **Implemented**
- **Complete MCP Gateway**: Fully functional gateway aggregating multiple MCP servers
- **Extended Capabilities**: Tools, Prompts, and Resources aggregation
- **Resource Subscriptions**: Full subscription support with `resources/subscribe`, `resources/unsubscribe`, and `notifications/resources/updated`
- **Resource Namespacing**: URI namespacing (`mcp://{serverId}/{encodedUri}`) to prevent resource collisions
- **Prompt Meta Tools**: Discovery tools (`catalog_prompts`, `describe_prompt`, `search_prompts`) for prompt discovery
- **Resource Meta Tools**: Discovery tools (`catalog_resources`, `describe_resource`, `search_resources`, `catalog_resource_templates`) for resource discovery
- **Tool Catalog Search**: Fuzzy search tools by name/description with cached MiniSearch index for O(1) search performance
- **Error Handling**: Structured error hierarchy with `GoblinError` base class and type-specific error codes
- **Connection Pooling**: Smart transport pool with pending connection tracking to prevent duplicate connection attempts
- **TUI Integration**: Interactive TUI with Servers, Tools, Prompts, and Resources panels
- **HTTP Gateway**: Hono-based server with SSE (`/sse`) and messages (`/messages`) endpoints  
- **Gateway Server**: Core MCP server implementation with unified tool catalog
- **Intelligent Router**: Request routing with namespacing (`server_tool`) and timeout enforcement
- **Tool Registry**: Dynamic synchronization with event-driven updates and compact cards
- **Transport Layer**: STDIO, HTTP, and SSE transports with connection pooling
- **Configuration System**: Hot-reloadable config with JSON Schema validation
- **Production Ready**: Pino structured logging and custom in-memory metrics with JSON endpoint

### 🚧 **In Development**
- **Sampling Support**: LLM completion requests from backends to clients
- **Elicitation**: User input requests from backends
- **Parameter Completion**: Argument completion for tools and resources
- **TUI/CLI**: Interactive management interface and command-line tools
- **Self-Configuration**: Admin tools for dynamic server management
- **Advanced Features**: Skills service, RBAC, OAuth integration

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3.8
- Node.js >= 20.0.0 (for compatibility)

### Installation

```bash
# Clone repository
git clone https://github.com/TalkingThreads/goblin.git
cd goblin

# Install dependencies
bun install

# Run in development mode (with hot reload)
bun run dev
```

### Building for Production

```bash
# Build project (TypeScript compilation)
bun run build

# Run production build
bun run start
```

### Quick Test

```bash
# Run the test suite to verify installation
bun test
# Expected: 81 passing tests
```

### Building for Production

```bash
# Build the project
bun run build

# Run production build
bun run start
```

## Configuration

Goblin looks for a configuration file in the standard OS location:
- **Linux**: `~/.config/goblin/config.json`
- **macOS**: `~/Library/Application Support/goblin/config.json`
- **Windows**: `%APPDATA%\goblin\config.json`

### Example Config

```json
{
  "$schema": "./config.schema.json",
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allow"],
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

### Features
- **Hot Reload**: Changes to the config file are applied automatically (atomic updates).
- **Type Safety**: Validated against a strict schema on load.
- **Editor Support**: Generated JSON Schema provides autocomplete and validation in VS Code.

See [docs/example-config.json](docs/example-config.json) for a full example.

## Development

### Commands

```bash
# Development with hot reload
bun run dev

# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format

# Testing
bun test
bun test --watch
```

### Project Structure

```
goblin/
├── src/
│   ├── index.ts              # Application entry point
│   └── observability/        # Logging, metrics, tracing
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── docs/                     # Documentation
└── openspec/                 # Specifications and proposals
    ├── specs/                # Current specifications
    └── changes/              # Pending change proposals
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Bun | Fast JavaScript runtime |
| MCP Core | @modelcontextprotocol/sdk | Protocol implementation |
| HTTP Server | Hono | Lightweight web framework |
| Validation | Zod | Runtime type validation |
| Logging | Pino | Structured JSON logging |
| Metrics | prom-client | Prometheus metrics |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level (trace, debug, info, warn, error, fatal) | `info` |
| `GOBLIN_CONFIG_PATH` | Custom path to configuration file | OS-specific default |
| `NODE_ENV` | Environment (development/production) | `development` |

## Contributing

We welcome contributions! Please see [CONTRIBUTE.md](CONTRIBUTE.md) for guidelines.

### Development Workflow

1. Check [openspec/AGENTS.md](openspec/AGENTS.md) for spec-driven development process
2. Create a change proposal for new features (see OpenSpec workflow)
3. Write tests for your changes
4. Ensure all tests pass and build succeeds
5. Submit a pull request

## Documentation

- [AGENTS.md](AGENTS.md) - AI coding agent instructions
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [CONTRIBUTE.md](CONTRIBUTE.md) - Contribution guidelines
- [docs/GOBLIN.md](docs/GOBLIN.md) - Full specification

## License

[MIT](LICENSE) © TalkingThreads

## Maintainers

See [MAINTAINERS.md](MAINTAINERS.md) for the list of project maintainers.

## Support

- **Issues**: [GitHub Issues](https://github.com/TalkingThreads/goblin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TalkingThreads/goblin/discussions)

---

Built with ❤️ by the TalkingThreads team

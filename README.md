# Goblin MCP Gateway

> Developer-first MCP gateway that aggregates multiple MCP servers behind a single unified endpoint

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-black)](https://bun.sh/)

## Overview

Goblin is a **Model Context Protocol (MCP) gateway** that solves tool sprawl, context bloat, and brittle integrations in agentic AI systems by providing:

- 🔌 **Single unified endpoint** aggregating multiple MCP backend servers
- 🎛️ **Fine-grained control** over tool exposure and aliasing
- 🔒 **Secure tool invocation** with admin approval workflows
- 🚀 **Low-friction discovery** and provisioning of new capabilities

## Features

- **Gateway Pattern**: Acts as MCP server to clients and MCP client to backends
- **Registry-Based Discovery**: Central registry with compact capability cards
- **Transport Abstraction**: Support for STDIO, SSE, and HTTP transports
- **Config-Driven**: Hot-reloadable JSON configuration
- **Meta-Tool Oriented**: Minimal context footprint via meta-tools
- **Production Ready**: Structured logging, Prometheus metrics, observability

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3.8
- Node.js >= 20.0.0 (for compatibility)

### Installation

```bash
# Clone the repository
git clone https://github.com/TalkingThreads/goblin.git
cd goblin

# Install dependencies
bun install

# Run in development mode
bun run dev
```

### Building for Production

```bash
# Build the project
bun run build

# Run production build
bun run start
```

## Configuration

Create a configuration file to define your MCP backends:

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allow"]
    }
  ]
}
```

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

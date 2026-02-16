# <img src="docs/assets/goblin-logo.svg" alt="Goblin" height="48"> Goblin MCP Gateway

<div align="center">

**Developer-first MCP gateway that aggregates multiple MCP servers behind a single unified endpoint**

[![Build Status][build-badge]][build-url]
[![Tests][tests-badge]][tests-url]
[![Coverage][coverage-badge]][coverage-url]
[![Version][version-badge]][version-url]
[![License][license-badge]][license-url]

_Blazing-fast performance • Hot reload • Enterprise-ready_

</div>

---

## About

Goblin is a production-ready **Model Context Protocol (MCP) gateway** that solves tool sprawl, context bloat, and brittle integrations in agentic AI systems. Built with Bun, TypeScript, Hono, and the MCP SDK, Goblin provides sub-50ms latency targets and a developer-first experience including a real-time TUI dashboard, structured logging, and comprehensive observability.

### Why Goblin?

- **Unified Interface**: Single endpoint aggregating tools, prompts, and resources from multiple MCP backends
- **Hot Reload**: Configuration changes applied atomically without restart
- **Multi-Transport**: STDIO, HTTP, SSE, and Streamable HTTP with automatic connection pooling
- **Enterprise Ready**: 1000+ tests, smoke tests for CI, performance benchmarks

---

## Features

<div align="center">

| Core Gateway | Management | Security | Observability |
|:------------:|:----------:|:--------:|:-------------:|
| 🔌 Unified Aggregation | 🎛️ TUI Dashboard | ✅ Secure by Default | 📊 Structured Logging |
| 🛣️ Intelligent Routing | ⚡ Hot Reload | 🔐 API Key Auth | 📈 Custom Metrics |
| 🚀 Multi-Transport | 🔧 CLI Commands | 🛡️ RBAC Ready | 🔍 Real-time TUI |
| 📦 Virtual Tools | 🖥️ Interactive TUI | 📋 Audit Logging | 🚨 Health Checks |

</div>

### Core Capabilities

- **🔌 Unified Aggregation** — Single endpoint for tools, prompts, and resources from multiple MCP servers
- **🛣️ Intelligent Routing** — Namespaced tool calls with timeout enforcement and error mapping
- **🚀 Multi-Transport** — STDIO, HTTP, SSE, and Streamable HTTP with automatic connection pooling
- **⚡ Hot Reload** — Configuration changes applied atomically without restart (HTTP mode) or via SIGHUP (STDIO mode)
- **📊 Full Observability** — Structured logging, custom metrics, and real-time TUI dashboard
- **✅ Enterprise Ready** — 1000+ tests, smoke tests for CI, performance benchmarks

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/TalkingThreads/goblin.git
cd goblin
bun install
```

### 2. Configure

Create a `config.json` file:

```json
{
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
  }
}
```

### 3. Run

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run build
bun run start

# With TUI dashboard
goblin start --tui

# STDIO mode (for Claude CLI integration)
goblin stdio
```

That's it! Goblin is now running at `http://127.0.0.1:3000`.
- **HTTP**: `http://127.0.0.1:3000/mcp`
- **SSE**: `http://127.0.0.1:3000/sse`

---

## Installation

### From Source

```bash
git clone https://github.com/TalkingThreads/goblin.git
cd goblin
bun install
bun run build
```

### Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| [Bun](https://bun.sh/) | >= 1.3.8 | ✅ Yes |
| [Node.js](https://nodejs.org/) | >= 20.0.0 | For CLI only |

---

## Documentation

| Topic | Description |
|-------|-------------|
| 📚 [Getting Started][getting-started] | Step-by-step installation and configuration |
| 🏗️ [Architecture][architecture] | System design and component overview |
| 💻 [CLI Reference][cli-reference] | Complete CLI commands documentation |
| 🌐 [API Reference][api-overview] | HTTP endpoints and API documentation |
| ⚙️ [Configuration][example-config] | Complete configuration reference |
| 🔧 [Troubleshooting][troubleshooting] | Common issues and solutions |

---

## CLI Commands

### Gateway Management

```bash
goblin start              # Start the gateway (default: HTTP mode)
goblin start --tui       # Start with TUI dashboard
goblin start --port 8080 # Custom port
goblin restart           # Graceful restart
goblin stop              # Graceful shutdown
```

### Server Management

```bash
goblin servers                    # List all servers
goblin servers add <name> <type>  # Add a new server
goblin servers remove <name>      # Remove a server
goblin servers enable <name>      # Enable a disabled server
goblin servers disable <name>     # Disable a server
```

### Tool Operations

```bash
goblin tools list                 # List all available tools
goblin tools invoke <name> --args '{"path": "/tmp"}'
goblin tools describe <name>      # Show tool schema
```

### Configuration

```bash
goblin config validate            # Validate configuration
goblin config show                # Display current config
goblin config reload              # Hot reload config
```

### Monitoring

```bash
goblin status                     # Gateway status
goblin health                     # Health check
goblin logs                       # Show logs
goblin logs -f                    # Follow logs
goblin metrics                    # Performance metrics
```

### Shell Completion

```bash
# Bash
goblin completion bash >> ~/.bashrc

# Zsh
goblin completion zsh >> ~/.zshrc

# Fish
goblin completion fish > ~/.config/fish/completions/goblin.fish
```

See [CLI Reference][cli-reference] for complete documentation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Goblin MCP Gateway                       │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Client  │──▶│  HTTP    │──▶│  Router  │──▶│ Registry │ │
│  │  (MCP)   │   │ Gateway  │   │          │   │          │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                      │              │        │
│                                      ▼              ▼        │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Client  │◀──│   TUI    │◀──│ Metrics  │◀──│ Transport│ │
│  │  (MCP)   │   │Dashboard │   │          │   │   Pool   │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ MCP Server 1 │     │ MCP Server 2 │     │ MCP Server N │
  │ (Filesystem) │     │ (Git)        │     │ (Custom)     │
  └──────────────┘     └──────────────┘     └──────────────┘
```

See [Architecture][architecture] for detailed component documentation.

---

## Client Transport Types

### STDIO Transport

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

### HTTP Transport

Simple HTTP transport for connecting to HTTP-based MCP servers:

```json
{
  "name": "remote-server",
  "transport": "http",
  "url": "http://localhost:3001/mcp",
  "enabled": true
}
```

### SSE Transport

Server-Sent Events transport for server-push notifications:

```json
{
  "name": "sse-server",
  "transport": "sse",
  "url": "http://localhost:3002/sse",
  "enabled": true
}
```

### Streamable HTTP Transport

Stateful HTTP transport with session management, automatic reconnection, and custom headers:

```json
{
  "name": "streamable-server",
  "transport": "streamablehttp",
  "url": "http://localhost:3003/mcp",
  "headers": {
    "Authorization": "Bearer your-token-here"
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

---

## Server Lifecycle Modes

Goblin supports three connection lifecycle modes for backend MCP servers:

| Mode | Description | Use Case |
|------|-------------|----------|
| `stateful` (default) | Connections kept alive indefinitely, reused across requests | High-frequency tool calls, persistent sessions |
| `smart` | Connections kept alive, evicted after 60 seconds of idle time | Balance between responsiveness and resource efficiency |
| `stateless` | Connections created per request, evicted quickly after use | Low-frequency calls, resource-constrained environments |

### Mode Configuration

Add the `mode` property to your server configuration:

```json
{
  "name": "filesystem",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
  "mode": "smart",
  "enabled": true
}
```

- **stateful** (default): Best for servers that are called frequently
- **smart**: Recommended default - auto-cleanup after 60s idle
- **stateless**: Best for minimizing memory usage with occasional calls

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | [Bun](https://bun.sh/) | Fast JavaScript runtime |
| MCP Core | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) | Protocol implementation |
| HTTP Server | [Hono](https://hono.dev/) | Lightweight web framework |
| Validation | [Zod](https://zod.dev/) | Runtime type validation |
| Logging | [Pino](https://getpino.io/) | Structured JSON logging |
| Metrics | Custom (zero-dep) | In-memory metrics |
| CLI | [Commander.js](https://github.com/tj/commander.js) | Command-line interface |
| TUI | [Ink](https://github.com/vadimdemedes/ink) + React | Terminal UI |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md][contributing] for guidelines.

### Development Workflow

1. Read [AGENTS.md][agents] for spec-driven development process
2. Create a change proposal for new features
3. Write tests for your changes
4. Ensure all tests pass: `bun test`
5. Submit a pull request

### Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) for pre-commit hooks:

```bash
# Install hooks (runs automatically after bun install)
bun run prepare
```

**Hooks check:**
- ✅ TypeScript type checking (`bun run typecheck`)
- ✅ Biome linting (`bun run lint`)
- ✅ Unit tests (`bun test tests/unit/`)

---

## Support

- 📖️ [Documentation][readme]
- 💬 [GitHub Discussions][discussions]
- 🐛 [GitHub Issues][issues]
- 🔒 [Security Policy][security]

---

## License

[MIT](LICENSE) © [TalkingThreads][github]

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [CHANGELOG.md][changelog] | Version history and release notes |
| [MAINTAINERS.md][maintainers] | Project maintainers |
| [CODE_OF_CONDUCT.md][code-of-conduct] | Community guidelines |
| [openspec/project.md][openspec] | Project context and design |

---

<div align="center">

**Built with ❤️ by the TalkingThreads team**

</div>

<!-- Badges -->
[build-badge]: https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/main.yml?branch=main&style=flat-square
[tests-badge]: https://img.shields.io/github/actions/workflow/status/TalkingThreads/goblin/tests.yml?branch=main&style=flat-square&label=Tests
[coverage-badge]: https://img.shields.io/codecov/c/github/TalkingThreads/goblin?style=flat-square&logo=codecov
[version-badge]: https://img.shields.io/npm/v/@talkingthreads/goblin?style=flat-square&logo=npm
[license-badge]: https://img.shields.io/npm/l/@talkingthreads/goblin?style=flat-square

<!-- URLs -->
[build-url]: https://github.com/TalkingThreads/goblin/actions/workflows/main.yml
[tests-url]: https://github.com/TalkingThreads/goblin/actions/workflows/tests.yml
[coverage-url]: https://codecov.io/gh/TalkingThreads/goblin
[version-url]: https://www.npmjs.com/package/@talkingthreads/goblin

<!-- Documentation Links -->
[readme]: README.md
[getting-started]: docs/getting-started.md
[architecture]: docs/architecture.md
[cli-reference]: docs/cli-reference.md
[api-overview]: docs/api/overview.md
[example-config]: docs/example-config.json
[troubleshooting]: docs/troubleshooting.md
[contributing]: CONTRIBUTING.md
[agents]: AGENTS.md
[changelog]: CHANGELOG.md
[maintainers]: MAINTAINERS.md
[code-of-conduct]: CODE_OF_CONDUCT.md
[security]: SECURITY.md
[openspec]: openspec/project.md

<!-- External Links -->
[github]: https://github.com/TalkingThreads
[discussions]: https://github.com/TalkingThreads/goblin/discussions
[issues]: https://github.com/TalkingThreads/goblin/issues

# Getting Started with Goblin MCP Gateway

A step-by-step guide to installing, configuring, and running Goblin for the first time.

## Prerequisites

Before installing Goblin, ensure you have the following:

| Requirement | Version | Notes |
|-------------|---------|-------|
| [Bun](https://bun.sh/) | >= 1.3.8 | Primary runtime |
| [Node.js](https://nodejs.org/) | >= 20.0.0 | For CLI compatibility |
| [Git](https://git-scm.com/) | Latest | For cloning the repository |

## Installation

### Option 1: From Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/TalkingThreads/goblin.git
cd goblin

# Install dependencies
bun install

# Verify installation
bun run typecheck
bun test
```

### Option 2: Using npm/yarn (Coming Soon)

```bash
# Not yet available
npm install @talkingthreads/goblin
```

## Your First Configuration

Create a configuration file to define your MCP servers:

```json
{
  "$schema": "./config.schema.json",
  "servers": [
    {
      "name": "filesystem",
      "description": "Access local filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "enabled": true
    },
    {
      "name": "git",
      "description": "Git operations",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"],
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

Save this as `config.json` in your Goblin directory.

## Starting Goblin

### Development Mode (with hot reload)

```bash
bun run dev
```

### Production Mode

```bash
# Build the project
bun run build

# Run production build
bun run start
```

### With TUI (Terminal UI)

```bash
goblin start --tui
```

### CLI Commands

Goblin v0.4.0 introduces a comprehensive CLI for gateway management:

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
goblin logs --level info      # Filter by level
goblin health                 # Health status

# Slash commands (v0.4.0 feature)
goblin slashes list            # List all slash commands
goblin slashes show /command  # Show slash command details
goblin slashes exec /command  # Execute slash command
```

The TUI provides an interactive dashboard with:
- Server status panel
- Tools catalog
- Prompts browser
- Resources viewer
- Real-time metrics
- Slash command autocomplete (type `/` to see suggestions)

## Verifying Installation

### Check Gateway Status

```bash
goblin status
```

Expected output:

```
✅ Goblin MCP Gateway is running

Servers: 2 (2 online, 0 offline)
Tools: 45 (14 filesystem, 31 git)
Uptime: 2m 34s
Memory: 45MB
```

### List Available Tools

```bash
goblin tools
```

### Test Tool Invocation

```bash
# List files in the configured directory
goblin tools --search "list_files"
```

## Connecting MCP Clients

Once Goblin is running, connect your MCP clients to:

```
http://127.0.0.1:3000
```

### Using SSE (Server-Sent Events)

```javascript
const eventSource = new EventSource("http://127.0.0.1:3000/sse");

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};
```

### Using HTTP Messages

```javascript
const response = await fetch("http://127.0.0.1:3000/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  })
});
```

## Common Configurations

### Single Server

```json
{
  "servers": [
    {
      "name": "my-server",
      "transport": "stdio",
      "command": "python",
      "args": ["server.py"],
      "enabled": true
    }
  ],
  "gateway": {
    "port": 3000
  }
}
```

### Multiple Servers with Namespacing

```json
{
  "servers": [
    {
      "name": "prod-db",
      "transport": "http",
      "url": "https://prod-mcp.example.com",
      "enabled": true
    },
    {
      "name": "dev-db",
      "transport": "http",
      "url": "https://dev-mcp.example.com",
      "enabled": true
    }
  ]
}
```

### Production with Authentication

```json
{
  "auth": {
    "mode": "production",
    "apiKeys": ["key-1", "key-2"]
  },
  "gateway": {
    "host": "0.0.0.0",
    "port": 443
  },
  "policies": {
    "rateLimit": {
      "requestsPerMinute": 100
    }
  }
}
```

## Next Steps

| Task | Guide |
|------|-------|
| Learn CLI commands | [CLI Reference](cli-reference.md) |
| Understand architecture | [Architecture](architecture.md) |
| Configure authentication | [Security](security.md) |
| Run tests | [Testing](testing.md) |
| Troubleshooting | [Troubleshooting](troubleshooting.md) |

## Getting Help

- **Documentation**: See [README](../README.md)
- **Issues**: [GitHub Issues](https://github.com/TalkingThreads/goblin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TalkingThreads/goblin/discussions)
- **Contributing**: See [CONTRIBUTE.md](../CONTRIBUTE.md)

## v1 and v2 Roadmap

Goblin is actively developing toward production and enterprise readiness:

### v1: Production-Ready (In Development)
- OAuth 2.1 authentication and JWT validation
- Role-based access control (RBAC)
- Local Skills service for semantic discovery
- Self-provisioning with admin approval
- Enhanced observability and audit trails
- SQLite persistence option
- Circuit breaker and rate limiting

### v2: Enterprise-Ready (Future)
- Prometheus metrics export
- Kit marketplace integrations
- Advanced skill marketplace features
- Enhanced observability with Grafana dashboards
- Advanced reliability features
- Distributed deployment support
- Web UI for administration

See [.octocode/plan/goblin-v1/plan.md](../.octocode/plan/goblin-v1/plan.md) and [.octocode/plan/goblin-v2/plan.md](../.octocode/plan/goblin-v2/plan.md) for detailed roadmaps.

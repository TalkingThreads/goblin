# CLI Reference

Comprehensive documentation for Goblin MCP Gateway CLI commands.

## Table of Contents

- [Overview](#overview)
- [Core Commands](#core-commands)
- [Gateway Management](#gateway-management)
- [Resource Management](#resource-management)
- [Configuration Management](#configuration-management)
- [Hot Reload](#hot-reload)
- [Logging and Health](#logging-and-health)
- [Slash Commands](#slash-commands)
- [Advanced Usage](#advanced-usage)
- [Exit Codes](#exit-codes)
- [Environment Variables](#environment-variables)

---

## Overview

The Goblin CLI provides a comprehensive interface for managing the MCP gateway. Commands follow standard Unix conventions with support for JSON output, environment variables, and shell completion.

### Command Structure

```bash
goblin [global-options] <command> [command-options] [arguments]
```

### Global Options

Global options are available for all commands:

| Option | Description | Default |
|--------|-------------|---------|
| `-h, --help` | Show help for command | - |
| `-v, --version` | Show CLI version | - |

**Note:** Only `-h/--help` and `-v/--version` are global options. Other options like `--port`, `--host`, `--verbose`, and `--config` are command-specific. Run `goblin <command> --help` to see available options for each command.

---

## Core Commands

### `goblin start`

Start the MCP gateway. This is the main command to run the gateway server.

**Basic Usage**:
```bash
goblin start                    # Start in STDIO mode (default)
goblin start --transport http   # Start with HTTP server + REST API
goblin start --transport sse    # Start with SSE server + REST API
```

**Options**:

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --transport <type>` | Transport type: `http`, `sse`, `stdio` | `stdio` |
| `--port <number>` | Port to listen on | 3000 |
| `--host <host>` | Host to bind to | 127.0.0.1 |
| `--config <path>` | Path to config file | `~/.goblin/config.json` |
| `--verbose` | Enable verbose logging | false |
| `--tui` | Enable Terminal UI dashboard | false |

**Transport Types**:

- **`stdio`** (default): Start in STDIO mode for CLI/subprocess integration. Designed for running Goblin as an MCP server for Claude or Smithery.
- **`http`**: Start HTTP gateway with REST API. Exposes `/mcp` endpoint for Streamable HTTP transport.
- **`sse`**: Start SSE gateway with REST API. Exposes `/sse` and `/messages` endpoints for SSE transport.

**Examples**:
```bash
# Start in STDIO mode (default)
goblin start

# Start with HTTP server
goblin start --transport http

# Start with SSE server
goblin start --transport sse

# Start on custom port and host
goblin start --port 8080 --host 0.0.0.0

# Start with verbose logging
goblin start --verbose

# Start with custom config
goblin start --config /path/to/config.json

# Start with TUI
goblin start --tui
```

**Output (HTTP/SSE mode)**:
```
🟢 Goblin Gateway is running
   REST API: http://127.0.0.1:3000/
   MCP:      http://127.0.0.1:3000/mcp

Press Ctrl+C to stop
```

### `goblin version`

Show CLI version information.

**Basic Usage**:
```bash
goblin version
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |

**Examples**:
```bash
# Show version
goblin version

# JSON output
goblin version --json
```

**JSON Output**:
```json
{
  "version": "0.3.0-rc.5",
  "exitCode": 0
}
```

### `goblin help`

Show help information.

**Basic Usage**:
```bash
goblin help
goblin --help
```

---

## Gateway Management

### `goblin status`

Show gateway status with server information.

**Basic Usage**:
```bash
goblin status
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# Basic status
goblin status

# JSON output
goblin status --json

# Check remote gateway
goblin status --url http://localhost:8080
```

**JSON Structure**:
```json
{
  "servers": {
    "total": 2,
    "online": 2,
    "offline": 0
  },
  "tools": 15,
  "uptime": 120,
  "health": "healthy"
}
```

### `goblin stop`

Stop the running gateway gracefully.

**Basic Usage**:
```bash
goblin stop
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# Stop gateway
goblin stop

# Stop remote gateway
goblin stop --url http://localhost:8080
```

### `goblin health`

Check gateway health and metrics.

**Basic Usage**:
```bash
goblin health
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# Basic health
goblin health

# JSON output
goblin health --json

# Check remote gateway
goblin health --url http://localhost:8080
```

**JSON Structure**:
```json
{
  "status": "healthy",
  "servers": [
    {
      "name": "filesystem",
      "status": "online"
    }
  ],
  "metrics": {
    "requests": 100,
    "errors": 0
  }
}
```

---

## Resource Management

### `goblin tools`

List, invoke, and describe tools from registered MCP servers.

**Basic Usage**:
```bash
goblin tools list           # List all available tools
goblin tools invoke <name>  # Invoke a tool with arguments
goblin tools describe <name>  # Describe tool schema
```

#### `goblin tools list`

List all available tools from registered servers.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# List all tools
goblin tools list

# JSON output
goblin tools list --json

# Custom gateway URL
goblin tools list --url http://localhost:8080
```

**JSON Structure**:
```json
{
  "tools": [
    {
      "name": "list_files",
      "server": "filesystem",
      "description": "List files in directory"
    }
  ]
}
```

#### `goblin tools invoke`

Invoke a tool with the given name and arguments.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--args <json>` | JSON arguments for the tool | {} |
| `--server <name>` | Server to use | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# Invoke tool with arguments
goblin tools invoke list_files --args '{"path": "/tmp"}'

# Invoke tool on specific server
goblin tools invoke search --server web-server --args '{"query": "test"}'
```

#### `goblin tools describe`

Describe a tool's schema and documentation.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--server <name>` | Server to use | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# Describe a tool
goblin tools describe list_files

# Describe tool from specific server
goblin tools describe search --server web-server
```

### `goblin servers`

List configured servers with status.

**Basic Usage**:
```bash
goblin servers
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |
| `--status` | Filter by status (online/offline/all) | all |

**Examples**:
```bash
# List all servers
goblin servers

# Filter by status
goblin servers --status online

# JSON output
goblin servers --json
```

**JSON Structure**:
```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "online",
      "enabled": true,
      "tools": 14
    }
  ]
}
```

### `goblin servers add`

Add a new server to the configuration dynamically.

**Basic Usage**:
```bash
# Interactive mode
goblin servers add --interactive

# Non-interactive mode
goblin servers add <name> <transport>
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--interactive` | Run in interactive mode | - |
| `--command <cmd>` | Command to execute (stdio transport) | - |
| `--args <args...>` | Arguments for command (stdio transport) | - |
| `--url <url>` | URL for HTTP/SSE/streamablehttp transports | - |
| `--header <key:value>` | Custom headers | - |
| `--enabled` | Enable the server | true |
| `--disabled` | Disable the server | false |
| `--yes` | Skip confirmation | false |
| `--config <path>` | Path to config file | OS default |

**Examples**:
```bash
# Add STDIO server
goblin servers add filesystem stdio --command "npx" --args "-y,@modelcontextprotocol/server-filesystem,/tmp"

# Add HTTP server
goblin servers add remote-server http --url "http://localhost:3001/mcp"

# Add with confirmation
goblin servers add my-server stdio --command "npx" --args "-y,my-server" --yes
```

### `goblin servers remove`

Remove a server from the configuration.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Skip confirmation | false |
| `--config <path>` | Path to config file | OS default |

### `goblin servers enable`

Enable a disabled server.

### `goblin servers disable`

Disable an enabled server without removing it.

---

## Configuration Management

### `goblin config validate`

Validate configuration file.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--path <path>` | Path to config file | OS default |

**Examples**:
```bash
# Validate current config
goblin config validate

# JSON output
goblin config validate --json

# Validate specific file
goblin config validate --path /path/to/config.json
```

### `goblin config show`

Display current configuration.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--path <path>` | Path to config file | OS default |

**Examples**:
```bash
# Show current config
goblin config show

# JSON output
goblin config show --json
```

---

## Logging

Goblin uses session-based file logging. All logs are written to `~/.goblin/logs/` directory.

### Log Location

```
~/.goblin/logs/goblin-{ISO-timestamp}.log
```

### Log Levels

| Level | Description |
|-------|-------------|
| `trace` | Detailed debugging information |
| `debug` | Technical debugging details |
| `info` | Normal operations and state changes |
| `warn` | Recoverable issues and degraded performance |
| `error` | Failures and exceptions |

### Environment Variables for Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level (trace, debug, info, warn, error) | info |
| `LOG_FORMAT` | Log format (pretty, json) | pretty (dev), json (prod) |

### `goblin logs`

Show recent logs.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Path to log file | Latest log |
| `--level <level>` | Filter by log level | All |
| `--json` | Output JSON | - |

---

## Exit Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | SUCCESS | Command completed successfully |
| 1 | GENERAL_ERROR | Unexpected errors |
| 2 | INVALID_ARGUMENTS | Bad command-line arguments |
| 3 | CONFIG_ERROR | Configuration file issues |
| 4 | CONNECTION_ERROR | Network/gateway connection failures |
| 7 | NOT_FOUND | Resources not found |

---

## Environment Variables

### Core Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOBLIN_CONFIG_PATH` | Path to config file | `~/.goblin/config.json` |
| `GOBLIN_PORT` | Gateway port | 3000 |
| `GOBLIN_HOST` | Gateway host | 127.0.0.1 |
| `LOG_LEVEL` | Logging level | info |


| `GOBLIN_LOCK_PORT` | Control Plane/Lock server port | 12490 |

### Authentication Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOBLIN_AUTH_MODE` | Auth mode (dev/apikey) | dev |
| `GOBLIN_AUTH_APIKEY` | API key for apikey mode | - |

---

*This documentation is part of the Goblin MCP Gateway.*

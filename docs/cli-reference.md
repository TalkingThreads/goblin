# CLI Reference

Comprehensive documentation for Goblin MCP Gateway CLI commands.

## Table of Contents

- [Overview](#overview)
- [Core Commands](#core-commands)
- [Gateway Management](#gateway-management)
- [Resource Management](#resource-management)
- [Configuration Management](#configuration-management)
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

| Option | Description | Default |
|--------|-------------|---------|
| `--help` | Show help for command | - |
| `--version` | Show CLI version | - |
| `--json` | Output JSON instead of human-readable | - |
| `--verbose` | Enable verbose logging | - |
| `--config` | Path to config file | OS default |
| `--port` | Override gateway port | 3000 |
| `--host` | Override gateway host | 127.0.0.1 |

---

## Core Commands

### `goblin start`

Start the MCP gateway with optional features.

**Basic Usage**:
```bash
goblin start
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--tui` | Enable Terminal UI dashboard | false |
| `--port` | Override port | 3000 |
| `--host` | Override host | 127.0.0.1 |
| `--config` | Path to config file | OS default |
| `--no-reload` | Disable hot reload | false |

**Examples**:
```bash
# Start with TUI
goblin start --tui

# Start on custom port
goblin start --port 8080

# Start with specific config
goblin start --config /path/to/config.json
```

**JSON Output**:
```bash
goblin start --json
```

### `goblin stdio`

Start Goblin in STDIO mode for CLI/subprocess integration. This mode is designed for running Goblin as a child process (e.g., as an MCP server for Claude or Smithery).

**Basic Usage**:
```bash
goblin stdio
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--config` | Path to config file | OS default |
| `--port` | Port override (accepted but ignored for listening) | - |

**Behavior**:
- Reads JSON-RPC messages from `stdin`
- Writes JSON-RPC messages to `stdout`
- Writes logs to `stderr` (preserving `stdout` for protocol traffic)
- Exits on `SIGINT`, `SIGTERM`, or when `stdin` closes/errors

**Examples**:
```bash
# Run as Claude server
goblin stdio

# Run with custom config
goblin stdio --config /path/to/goblin.json
```

**Smithery Integration**:
Smithery is a platform for discovering and deploying MCP servers. To register Goblin with Smithery:

1. Ensure Goblin is installed and accessible
2. Create a Smithery-compatible configuration file
3. Submit your server to the Smithery registry

Example Smithery configuration (`smithery.json`):
```json
{
  "name": "goblin",
  "version": "0.3.0",
  "description": "MCP Gateway that aggregates multiple MCP servers",
  "command": "goblin",
  "args": ["stdio"],
  "configSchema": {
    "type": "object",
    "properties": {
      "gateway": {
        "type": "object",
        "properties": {
          "port": { "type": "number", "default": 3000 },
          "host": { "type": "string", "default": "127.0.0.1" }
        }
      },
      "auth": {
        "type": "object",
        "properties": {
          "mode": { "type": "string", "enum": ["dev", "apikey"], "default": "dev" },
          "apiKey": { "type": "string" }
        }
      }
    }
  }
}
```

**Authentication in STDIO Mode**:
- When running in STDIO mode, Goblin supports both `dev` (development) and `apikey` authentication modes
- In `dev` mode, no authentication is required - any client can connect
- In `apikey` mode, clients must provide a valid API key via the `Authorization` header or `X-API-Key` header
- Configure authentication using environment variables:
  ```bash
  GOBLIN_AUTH_MODE=apikey GOBLIN_AUTH_APIKEY=your-secret-key goblin stdio
  ```
- For Claude CLI integration, `dev` mode is recommended as Claude handles authentication separately

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
| `--refresh` | Auto-refresh every 5s | false |
| `--server` | Filter by server | all |
| `--tools` | Show tool details | false |

**Examples**:
```bash
# Basic status
goblin status

# JSON output
goblin status --json

# Filter by server
goblin status --server filesystem

# Show tool details
goblin status --tools
```

**JSON Structure**:
```json
{
  "gateway": {
    "version": "0.4.0",
    "uptime": "2m 34s",
    "memory": "45MB",
    "port": 3000,
    "host": "127.0.0.1"
  },
  "servers": [
    {
      "name": "filesystem",
      "status": "online",
      "tools": 14,
      "uptime": "2m 30s",
      "transport": "stdio"
    }
  ],
  "metrics": {
    "requests": 1234,
    "latency": "12ms",
    "errors": 0
  }
}
```

---

## Gateway Management

### `goblin restart`

Restart the gateway gracefully.

**Basic Usage**:
```bash
goblin restart
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--timeout` | Graceful shutdown timeout | 30s |
| `--force` | Force restart without grace | false |

**Examples**:
```bash
# Graceful restart
goblin restart

# Force restart
goblin restart --force

# With timeout
goblin restart --timeout 60
```

### `goblin stop`

Stop the gateway gracefully.

**Basic Usage**:
```bash
goblin stop
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--timeout` | Shutdown timeout | 30s |
| `--force` | Force stop | false |

**Examples**:
```bash
# Graceful stop
goblin stop

# Force stop
goblin stop --force
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
| `--detailed` | Show detailed metrics | false |
| `--server` | Filter by server | all |

**Examples**:
```bash
# Basic health
goblin health

# Detailed metrics
goblin health --detailed

# JSON output
goblin health --json
```

**JSON Structure**:
```json
{
  "status": "healthy",
  "latency": "12ms",
  "uptime": "2m 34s",
  "memory": "45MB",
  "servers": [
    {
      "name": "filesystem",
      "status": "healthy",
      "latency": "8ms",
      "tools": 14,
      "uptime": "2m 30s"
    }
  ],
  "metrics": {
    "requests": 1234,
    "errors": 0,
    "throughput": "45req/s"
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

The tools command has three subcommands:

- `list` - List all available tools
- `invoke` - Invoke a tool with JSON arguments
- `describe` - Show detailed tool schema and documentation

#### `goblin tools list`

List all available tools from registered servers.

**Basic Usage**:
```bash
goblin tools list
```

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

**Basic Usage**:
```bash
goblin tools invoke <name> --args '<json>'
```

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<name>` | Name of the tool to invoke |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--args <json>` | JSON arguments for the tool | {} |
| `--server <name>` | Server to use (required if multiple servers have the tool) | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# Invoke tool with arguments
goblin tools invoke list_files --args '{"path": "/tmp"}'

# Invoke tool on specific server
goblin tools invoke search --server web-server --args '{"query": "test"}'

# Invoke with empty arguments
goblin tools invoke get_status
```

**Error Handling**:
- If tool not found: "Error: Tool 'xxx' not found"
- If server not found: "Error: Server 'xxx' not found"
- If missing required arguments: Error from gateway
- If invalid JSON: "Error: Invalid JSON arguments"

#### `goblin tools describe`

Describe a tool's schema and documentation.

**Basic Usage**:
```bash
goblin tools describe <name>
```

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<name>` | Name of the tool to describe |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--server <name>` | Server to use (required if multiple servers have the tool) | - |
| `--url <url>` | Gateway URL | http://localhost:3000 |

**Examples**:
```bash
# Describe a tool
goblin tools describe list_files

# Describe tool from specific server
goblin tools describe search --server web-server

# JSON output
goblin tools describe list_files --url http://localhost:8080
```

**Output Format**:
```
Tool: list_files
Server: filesystem
Description: List files in directory

Parameters:
  Type: object
  Properties:
    path: string (required)
      Path to directory
    recursive: boolean
      List recursively
```

**Error Handling**:
- If tool not found: "Error: Tool 'xxx' not found"
- If ambiguous name: "Error: Tool 'xxx' found on multiple servers"

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
| `--status` | Filter by status (online/offline/all) | online |
| `--transport` | Filter by transport | all |
| `--limit` | Limit results | 50 |

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
      "id": "filesystem",
      "name": "filesystem",
      "status": "online",
      "transport": "stdio",
      "tools": 14,
      "uptime": "2m 30s",
      "endpoint": "npx -y @modelcontextprotocol/server-filesystem /tmp"
    }
  ],
  "total": 2,
  "online": 2,
  "offline": 0
}
```

### `goblin servers add`

Add a new server to the configuration dynamically.

**Basic Usage**:
```bash
goblin servers add <name> <transport>
```

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<name>` | Unique name for the server |
| `<transport>` | Transport type (stdio, http, sse, streamablehttp) |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--command <cmd>` | Command to execute (for stdio transport) | - |
| `--args <args...>` | Arguments for the command (for stdio transport) | - |
| `--url <url>` | URL for HTTP/SSE/streamablehttp transports | - |
| `--header <key:value>` | Custom headers (can be used multiple times) | - |
| `--enabled` | Enable the server (default: true) | true |
| `--disabled` | Disable the server | false |
| `--yes` | Skip confirmation prompt | false |
| `--config <path>` | Path to config file | OS default |

**Examples**:
```bash
# Add STDIO server
goblin servers add filesystem stdio --command "npx" --args "-y,@modelcontextprotocol/server-filesystem,/tmp"

# Add HTTP server
goblin servers add remote-server http --url "http://localhost:3001/mcp"

# Add HTTP server with custom headers
goblin servers add api-server http --url "http://localhost:3002/mcp" --header "Authorization:Bearer token123"

# Add SSE server
goblin servers add sse-server sse --url "http://localhost:3003/sse"

# Add Streamable HTTP server
goblin servers add streamable-server streamablehttp --url "http://localhost:3004/mcp"

# Add with confirmation
goblin servers add my-server stdio --command "npx" --args "-y,my-server" --yes
```

**Transport Requirements**:
- **stdio**: Requires `--command` option
- **http**: Requires `--url` option
- **sse**: Requires `--url` option
- **streamablehttp**: Requires `--url` option

### `goblin servers remove`

Remove a server from the configuration.

**Basic Usage**:
```bash
goblin servers remove <name>
```

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<name>` | Name of the server to remove |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Skip confirmation prompt | false |
| `--config <path>` | Path to config file | OS default |

**Examples**:
```bash
# Remove server (requires --yes confirmation)
goblin servers remove my-server

# Remove with auto-confirmation
goblin servers remove my-server --yes
```

**Behavior**:
- Shows server details before removal
- Requires `--yes` flag to confirm the removal
- Displays success message after removal
- Configuration is automatically saved

**Error Handling**:
- If server not found: "Server '<name>' not found"
- If confirmation missing: Error requesting `--yes` flag

### `goblin servers enable`

Enable a previously disabled server.

**Basic Usage**:
```bash
goblin servers enable <name>
```

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<name>` | Name of the server to enable |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Skip confirmation prompt | false |
| `--config <path>` | Path to config file | OS default |

**Examples**:
```bash
# Enable a disabled server
goblin servers enable my-server

# Enable with auto-confirmation
goblin servers enable my-server --yes

# Enable with custom config
goblin servers enable my-server --config /path/to/config.json
```

**Behavior**:
- Shows server details before enabling (name, transport, current status)
- Requires `--yes` flag to confirm the action
- Displays success message after enabling
- Configuration is automatically saved
- Server will be used during gateway startup

**Error Handling**:
- If server not found: "Server '<name>' not found"
- If already enabled: "Server '<name>' is already enabled"
- If confirmation missing: "Confirmation required. Run with --yes to confirm."

### `goblin servers disable`

Disable an enabled server without removing it.

**Basic Usage**:
```bash
goblin servers disable <name>
```

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<name>` | Name of the server to disable |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Skip confirmation prompt | false |
| `--config <path>` | Path to config file | OS default |

**Examples**:
```bash
# Disable an enabled server
goblin servers disable my-server

# Disable with auto-confirmation
goblin servers disable my-server --yes

# Disable with custom config
goblin servers disable my-server --config /path/to/config.json
```

**Behavior**:
- Shows server details before disabling (name, transport, current status)
- Requires `--yes` flag to confirm the action
- Displays success message after disabling
- Configuration is automatically saved
- Server will be skipped during gateway startup but remains in configuration

**Error Handling**:
- If server not found: "Server '<name>' not found"
- If already disabled: "Server '<name>' is already disabled"
- If confirmation missing: "Confirmation required. Run with --yes to confirm."

### `goblin resources`

List available resources with filtering.

**Basic Usage**:
```bash
goblin resources
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--server` | Filter by server | all |
| `--type` | Filter by resource type | all |
| `--search` | Search resources | - |
| `--mime` | Filter by MIME type | all |

**Examples**:
```bash
# List all resources
goblin resources

# Search resources
goblin resources --search "template"

# Filter by MIME type
goblin resources --mime "text/plain"

# JSON output
goblin resources --json
```

---

## Configuration Management

### `goblin config validate`

Validate configuration file.

**Basic Usage**:
```bash
goblin config validate
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--schema` | Show schema errors | false |
| `--json` | Output JSON | - |
| `--path` | Path to config file | OS default |

**Examples**:
```bash
# Validate current config
goblin config validate

# Show schema errors
goblin config validate --schema

# Validate specific file
goblin config validate --path /path/to/config.json
```

**JSON Structure**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### `goblin config show`

Display current configuration.

**Basic Usage**:
```bash
goblin config show
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--path` | Path to config file | OS default |
| `--watch` | Watch for changes | false |

**Examples**:
```bash
# Show current config
goblin config show

# JSON output
goblin config show --json

# Watch for changes
goblin config show --watch
```

### `goblin config set`

Set configuration value.

**Basic Usage**:
```bash
goblin config set [key] [value]
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Parse value as JSON | false |
| `--path` | Path to config file | OS default |

**Examples**:
```bash
# Set simple value
goblin config set gateway.port 8080

# Set complex value
goblin config set auth.mode "oauth" --json

# Set array value
goblin config set servers[0].enabled false
```

### `goblin config reload`

Reload configuration without restarting gateway.

**Basic Usage**:
```bash
goblin config reload
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Force reload even if unchanged | false |

**Examples**:
```bash
# Reload config
goblin config reload

# Force reload
goblin config reload --force
```

---

## Logging and Health

### `goblin logs`

Show gateway logs with filtering.

**Basic Usage**:
```bash
goblin logs
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--follow` | Follow logs in real-time | false |
| `--level` | Filter by log level | all |
| `--limit` | Number of lines | 100 |
| `--server` | Filter by server | all |
| `--json` | Output JSON | - |

**Examples**:
```bash
# Show recent logs
goblin logs

# Follow logs
goblin logs -f

# Filter by level
goblin logs --level error

# JSON output
goblin logs --json
```

**Log Levels**:
- `trace` - Detailed debugging information
- `debug` - Technical debugging details
- `info` - Normal operations and state changes
- `warn` - Recoverable issues and degraded performance
- `error` - Failures and exceptions
- `fatal` - Process-threatening errors

### `goblin metrics`

Show gateway metrics and performance data.

**Basic Usage**:
```bash
goblin metrics
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--server` | Filter by server | all |
| `--interval` | Refresh interval (seconds) | 5 |
| `--reset` | Reset metrics counters | false |

**Examples**:
```bash
# Show metrics
goblin metrics

# JSON output
goblin metrics --json

# Refresh every 10 seconds
goblin metrics --interval 10
```

**JSON Structure**:
```json
{
  "gateway": {
    "requests": {
      "total": 1234,
      "rate": "45req/s",
      "latency": {
        "p50": "12ms",
        "p95": "45ms",
        "p99": "120ms"
      }
    },
    "memory": {
      "heapUsed": "45MB",
      "rss": "120MB"
    }
  },
  "servers": [
    {
      "name": "filesystem",
      "requests": {
        "total": 567,
        "rate": "20req/s",
        "latency": {
          "p50": "8ms",
          "p95": "25ms",
          "p99": "60ms"
        }
      }
    }
  ]
}
```

---

## Slash Commands

### `goblin slashes list`

List available slash commands.

**Basic Usage**:
```bash
goblin slashes list
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--server` | Filter by server | all |
| `--search` | Search commands | - |
| `--limit` | Limit results | 50 |

**Examples**:
```bash
# List all commands
goblin slashes list

# Search commands
goblin slashes list --search "search"

# JSON output
goblin slashes list --json
```

### `goblin slashes show`

Show details for a specific slash command.

**Basic Usage**:
```bash
goblin slashes show <command>
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output JSON | - |
| `--server` | Show server-specific command | false |

**Examples**:
```bash
# Show command details
goblin slashes show /search

# Show server-specific command
goblin slashes show /search --server filesystem

# JSON output
goblin slashes show /search --json
```

### `goblin slashes exec`

Execute a slash command.

**Basic Usage**:
```bash
goblin slashes exec <command> [arguments]
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--server` | Execute on specific server | auto |
| `--json` | Output JSON | - |
| `--timeout` | Command timeout | 30s |

**Examples**:
```bash
# Execute command
goblin slashes exec /search "query"

# With server
goblin slashes exec /search "query" --server filesystem

# JSON output
goblin slashes exec /search "query" --json
```

---

## Advanced Usage

### Shell Completion

Enable shell completion for easier CLI usage.

**Bash Completion**:
```bash
# Add to ~/.bashrc
goblin completion bash > ~/.goblin-completion.bash
source ~/.goblin-completion.bash
```

**Zsh Completion**:
```bash
# Add to ~/.zshrc
goblin completion zsh > ~/.goblin-completion.zsh
source ~/.goblin-completion.zsh
```

**Fish Completion**:
```bash
# Add to ~/.config/fish/completions/
goblin completion fish > ~/.config/fish/completions/goblin.fish
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOBLIN_CONFIG_PATH` | Path to config file | OS default |
| `LOG_LEVEL` | Logging level | info |
| `GOBLIN_PORT` | Gateway port | 3000 |
| `GOBLIN_HOST` | Gateway host | 127.0.0.1 |
| `GOBLIN_TIMEOUT` | Default timeout | 30s |
| `GOBLIN_AUTH_MODE` | Auth mode (dev/apikey) | dev |
| `GOBLIN_AUTH_APIKEY` | API key for apikey mode | - |

**Examples**:
```bash
# Set environment variables
export LOG_LEVEL=debug
export GOBLIN_CONFIG_PATH=/path/to/config.json

# Use in commands
goblin start
```

### Custom Scripts

Create custom scripts using CLI commands.

**Example Script**:
```bash
#!/bin/bash
# Check gateway status and tools

echo "=== Goblin Status ==="
goblin status
echo ""

echo "=== Available Tools ==="
goblin tools --limit 10
echo ""

# Check specific server
echo "=== Filesystem Server ==="
goblin servers --server filesystem --json | jq '.'
```

### Integration with Other Tools

**With curl**:
```bash
# Get gateway status via HTTP
curl http://127.0.0.1:3000/status

# Get metrics
curl http://127.0.0.1:3000/metrics
```

**With jq**:
```bash
# Parse JSON output
goblin status --json | jq '.servers[] | select(.status == "online")'

# Count tools
goblin tools --json | jq '.tools | length'
```

**With grep**:
```bash
# Search for specific tools
goblin tools --json | grep "tool-name"

# Filter by status
goblin servers --json | grep "online"
```

---

## Exit Codes

The CLI returns standard exit codes for error handling:

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Configuration error |
| 4 | Connection error |
| 5 | Permission denied |
| 6 | Timeout |
| 7 | Not found |
| 8 | Invalid JSON |
| 9 | Schema validation failed |

**Usage in Scripts**:
```bash
# Check exit code
goblin status
if [ $? -eq 0 ]; then
  echo "Gateway is running"
else
  echo "Gateway is not running"
fi
```

---

## Environment Variables

### Core Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOBLIN_CONFIG_PATH` | Path to config file | OS default |
| `LOG_LEVEL` | Logging level | info |
| `GOBLIN_PORT` | Gateway port | 3000 |
| `GOBLIN_HOST` | Gateway host | 127.0.0.1 |
| `GOBLIN_TIMEOUT` | Default timeout | 30s |
| `GOBLIN_LOG_FORMAT` | Log format (json/plain) | plain |

### Authentication Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOBLIN_AUTH_MODE` | Auth mode (dev/apikey) | dev |
| `GOBLIN_AUTH_APIKEY` | API key for apikey mode | - |

### Development Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | false |
| `NODE_ENV` | Environment (development/production) | development |
| `BUN_ENV` | Bun environment | development |

### Authentication Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOBLIN_API_KEY` | API key for auth | - |
| `GOBLIN_OAUTH_ISSUER` | OAuth issuer URL | - |
| `GOBLIN_OAUTH_CLIENT_ID` | OAuth client ID | - |
| `GOBLIN_OAUTH_CLIENT_SECRET` | OAuth client secret | - |

### Advanced Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOBLIN_MAX_CONNECTIONS` | Max concurrent connections | 100 |
| `GOBLIN_REQUEST_TIMEOUT` | Request timeout | 30s |
| `GOBLIN_KEEPALIVE` | Keep-alive timeout | 60s |

### Usage Examples

```bash
# Set environment variables
export LOG_LEVEL=debug
export GOBLIN_CONFIG_PATH=/path/to/config.json

# Use in commands
goblin start

# Or set for single command
LOG_LEVEL=debug goblin start
```

---

## Examples

### Daily Monitoring

```bash
#!/bin/bash
# Daily Goblin monitoring script

echo "=== $(date) ==="
echo ""

echo "Gateway Status:"
goblin status

echo ""
echo "Server Status:"
goblin servers

echo ""
echo "Top Tools:"
goblin tools --limit 5

echo ""
echo "Gateway Health:"
goblin health
```

### Automated Testing

```bash
#!/bin/bash
# Test Goblin installation

# Check if CLI is available
if ! command -v goblin >/dev/null; then
  echo "Error: Goblin CLI not found"
  exit 1
fi

# Check version
goblin --version

# Validate config
goblin config validate || exit 1

# Check gateway status
goblin status || exit 1

# List tools
goblin tools || exit 1

echo "All tests passed!"
```

### Integration Script

```bash
#!/bin/bash
# Get tool details and execute

# Get tool ID from name
TOOL_ID=$(goblin tools --search "list_files" --json | jq -r '.tools[0].id')

if [ -z "$TOOL_ID" ]; then
  echo "Error: Tool not found"
  exit 1
fi

echo "Found tool: $TOOL_ID"

# Execute tool (example - actual execution would use MCP client)
# This is just for demonstration
echo "Executing $TOOL_ID..."
```

---

## Getting Help

### In-App Help

```bash
# Show general help
goblin --help

# Show command-specific help
goblin start --help
goblin tools --help
goblin config --help
```

### Documentation

- [README](../README.md) - Project overview
- [Getting Started](getting-started.md) - Installation guide
- [Configuration](config.md) - Configuration reference
- [API Reference](api.md) - HTTP API documentation

### Community Support

- [GitHub Issues](https://github.com/TalkingThreads/goblin/issues)
- [GitHub Discussions](https://github.com/TalkingThreads/goblin/discussions)
- [Discord Community](https://discord.gg/talkingthreads)

---

## Contributing

When adding new CLI commands:

1. **Follow conventions**:
   - Use kebab-case for command names
   - Provide both human-readable and JSON output
   - Include comprehensive help text

2. **Add to documentation**:
   - Update this CLI reference
   - Add examples to getting started guide
   - Update CHANGELOG.md

3. **Test thoroughly**:
   - Unit tests for command logic
   - Integration tests for command execution
   - End-to-end tests for full workflow

---

*This documentation is part of the Goblin MCP Gateway v0.4.0 release candidate.*
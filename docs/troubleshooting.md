# Troubleshooting Guide

Common issues and solutions for Goblin MCP Gateway.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Errors](#configuration-errors)
- [Connection Problems](#connection-problems)
- [Performance Issues](#performance-issues)
- [CLI Problems](#cli-problems)
- [TUI Issues](#tui-issues)
- [Getting Help](#getting-help)

---

## Installation Issues

### Bun Not Found

**Error**: `command not found: bun`

**Solution**:
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### Dependency Installation Fails

**Error**: `bun install` fails with network or package errors

**Solution**:
```bash
# Clear Bun cache
bun clean

# Retry installation
bun install

# If still failing, try with registry flag
bun install --registry https://registry.npmjs.org
```

### TypeScript Compilation Errors

**Error**: `bun run typecheck` reports type errors

**Solution**:
```bash
# Ensure TypeScript is installed
bun add typescript

# Check TypeScript version compatibility
bun run typecheck
```

---

## Configuration Errors

### Invalid JSON Format

**Error**: `Error: Invalid JSON in config file`

**Solution**:
```bash
# Validate JSON syntax
cat config.json | python3 -m json.tool

# Or use a JSON validator
bun run config validate
```

### Schema Validation Failed

**Error**: `Error: Configuration does not match schema`

**Solution**:
Check your configuration against the [JSON Schema](docs/schema/config.schema.json). Common issues:

1. **Missing required fields**:
   ```json
   // Required: servers array
   "servers": []
   ```

2. **Invalid transport type**:
   ```json
   // Valid types: "stdio", "http", "sse"
   "transport": "invalid"
   ```

3. **Missing command for stdio**:
   ```json
   // Required for stdio transport
   "command": "npx",
   "args": []
   ```

### Config File Not Found

**Error**: `Error: Config file not found`

**Solution**:
```bash
# Set config path explicitly
GOBLIN_CONFIG_PATH=/path/to/config.json goblin start

# Or use default location
# Linux: ~/.config/goblin/config.json
# macOS: ~/Library/Application Support/goblin/config.json
# Windows: %APPDATA%\goblin\config.json
```

---

## Connection Problems

### Server Connection Timeout

**Error**: `Error: Connection to server 'name' timed out`

**Causes & Solutions**:

1. **Server not running**:
   ```bash
   # Check server status
   goblin status

   # Verify server is accessible
   curl http://localhost:8080/health
   ```

2. **Incorrect URL**:
   ```json
   {
     "url": "http://localhost:8080/mcp"  // Ensure correct endpoint
   }
   ```

3. **Network firewall**:
   ```bash
   # Test connectivity
   ping localhost
   telnet localhost 8080
   ```

### STDIO Server Fails to Start

**Error**: `Error: STDIO server exited with code 1`

**Solutions**:

1. **Check command exists**:
   ```bash
   # Test command manually
   npx -y @modelcontextprotocol/server-filesystem --help
   ```

2. **Verify arguments**:
   ```json
   {
     "command": "npx",
     "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
   }
   ```

3. **Check permissions**:
   ```bash
   # Make sure scripts are executable
   chmod +x your-server-script.sh
   ```

### Duplicate Server Names

**Error**: `Error: Server 'name' is already registered`

**Solution**:
Use unique names for each server:
```json
{
  "servers": [
    { "name": "filesystem-prod", ... },
    { "name": "filesystem-dev", ... }
  ]
}
```

---

## Performance Issues

### High Memory Usage

**Symptoms**: Gateway uses excessive memory, slow responses

**Solutions**:

1. **Limit concurrent connections**:
   ```json
   {
     "policies": {
       "maxConnections": 10
     }
   }
   ```

2. **Reduce log buffer size**:
   ```json
   {
     "logging": {
       "bufferSize": 1000
     }
   }
   ```

3. **Monitor with metrics**:
   ```bash
   goblin status --json | jq '.memory'
   ```

### Slow Tool Invocation

**Symptoms**: Tool calls take > 500ms consistently

**Solutions**:

1. **Enable connection pooling**:
   ```json
   {
     "policies": {
       "connectionTimeout": 30000
     }
   }
   ```

2. **Check network latency**:
   ```bash
   # Measure round-trip time
   curl -w "%{time_total}\n" http://localhost:3000/health
   ```

3. **Optimize backend servers**: Ensure MCP servers are performant

### Gateway Not Responding

**Symptoms**: Requests timeout, connection refused

**Solutions**:

1. **Check if gateway is running**:
   ```bash
   ps aux | grep goblin
   goblin status
   ```

2. **Verify port is correct**:
   ```bash
   # Check what's listening on the port
   netstat -tulpn | grep 3000
   ```

3. **Check resource limits**:
   ```bash
   # Linux: Check ulimit
   ulimit -a
   ```

---

## CLI Problems

### Command Not Found

**Error**: `command not found: goblin`

**Solution**:
```bash
# Build CLI first
bun run build:cli

# Add to PATH
export PATH="$PATH:./dist/cli"

# Or use node directly
node dist/cli/index.js status
```

### Invalid Arguments

**Error**: `error: unknown option '--invalid'`

**Solution**:
```bash
# Show help
goblin --help
goblin start --help

# Check for typos in option names
goblin start --port 3000  # Correct
goblin start --p 3000     # Incorrect
```

### JSON Output Malformed

**Error**: `jq: parse error: Unfinished JSON term`

**Solutions**:

1. **Ensure `--json` flag is supported**:
   ```bash
   goblin status --json 2>&1 | jq '.'
   ```

2. **Check for error messages**:
   ```bash
   goblin status --json 2>&1
   ```

---

## TUI Issues

### TUI Not Starting

**Error**: `Error: Ink requires React to be installed`

**Solution**:
```bash
# Install React dependencies
bun add react react-dom

# Rebuild
bun run build
```

### Display Problems

**Symptoms**: TUI renders incorrectly, missing characters

**Solutions**:

1. **Use compatible terminal**:
   - iTerm2 (macOS)
   - Windows Terminal
   - GNOME Terminal
   - Alacritty

2. **Disable unicode**:
   ```bash
   goblin start --tui --no-unicode
   ```

3. **Check font support**:
   ```bash
   # Use monospace fonts that support unicode
   export TERM=xterm-256color
   ```

### Performance in TUI

**Symptoms**: TUI is slow or freezes

**Solutions**:

1. **Disable auto-refresh**:
   ```bash
   goblin start --tui --no-auto-refresh
   ```

2. **Reduce refresh rate**:
   ```bash
   goblin start --tui --refresh-rate 5000  # 5 seconds
   ```

3. **Switch to headless mode**:
   ```bash
   goblin start  # No TUI
   ```

---

## Getting Help

If your issue isn't listed here:

### Check Logs

```bash
# View recent logs
goblin logs --level debug

# Follow logs in real-time
goblin logs -f
```

### Enable Debug Mode

```bash
# Run with debug logging
LOG_LEVEL=debug goblin start
```

### Search Issues

- [GitHub Issues](https://github.com/TalkingThreads/goblin/issues?q=)
- [GitHub Discussions](https://github.com/TalkingThreads/goblin/discussions)

### Report a Bug

When reporting a bug, include:

1. **Goblin version**:
   ```bash
   goblin --version
   ```

2. **Operating system**:
   ```bash
   uname -a  # Linux/macOS
   systeminfo  # Windows
   ```

3. **Configuration** (sanitized):
   ```bash
   goblin config show
   ```

4. **Error messages**:
   - Full error output
   - Stack trace (if available)

5. **Steps to reproduce**:
   - Minimal reproduction steps
   - Expected behavior
   - Actual behavior

### Contact

- **Email**: support@talkingthreads.ai
- **Discord**: [Join our community](https://discord.gg/talkingthreads)

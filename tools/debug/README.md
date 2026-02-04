# Goblin Debugging Toolkit

Debugging tools and scripts for Goblin MCP Gateway.

## Quick Start

```bash
# Start Goblin with debug logging (Unix/Mac)
./tools/debug/bin/goblin-start-debug.sh

# Windows PowerShell
.\tools\debug\bin\goblin-start-debug.ps1

# Check Goblin health
./tools/debug/bin/goblin-health.sh
.\tools\debug\bin\goblin-health.ps1

# View logs
./tools/debug/bin/goblin-logs.sh --follow
.\tools\debug\bin\goblin-logs.ps1 -Follow

# Connect Inspector (in another terminal)
./tools/debug/bin/goblin-inspector-stdio.sh
.\tools\debug\bin\goblin-inspector-stdio.ps1
```

## Scripts

### Inspector Scripts

| Script | Description | Platform |
|--------|-------------|----------|
| `goblin-inspector-stdio.sh` / `.ps1` | Connect via STDIO (default) | Unix, Windows |
| `goblin-inspector-http.sh` / `.ps1` | Connect via HTTP | Unix, Windows |
| `goblin-inspector-sse.sh` / `.ps1` | Connect via SSE | Unix, Windows |

### Health & Diagnostics

| Script | Description | Platform |
|--------|-------------|----------|
| `goblin-health.sh` / `.ps1` | Comprehensive health check | Unix, Windows |
| `goblin-test-connection.sh` / `.ps1` | Test connectivity | Unix, Windows |
| `goblin-logs.sh` / `.ps1` | View and filter logs | Unix, Windows |

### Process Management

| Script | Description | Platform |
|--------|-------------|----------|
| `goblin-start-debug.sh` / `.ps1` | Start with debug logging | Unix, Windows |
| `goblin-stop.sh` / `.ps1` | Stop all Goblin processes | Unix, Windows |

## Windows Usage

PowerShell scripts are provided for Windows environments.

```powershell
# Run PowerShell as Administrator (recommended)
# Execute scripts from the tools/debug/bin directory

# Example: Start with debug logging
.\goblin-start-debug.ps1

# Health check
.\goblin-health.ps1

# View logs
.\goblin-logs.ps1 -Follow -Level error

# Test connection
.\goblin-test-connection.ps1 -Url http://localhost:3000

# Stop processes
.\goblin-stop.ps1 -Force
```

## Configuration

### Environment Variables

Copy the example file and customize:

```bash
cp tools/debug/environment/.env.example .env
cp tools/debug/environment/.env.debug .env.debug
```

**Debug variables:**
```bash
export DEBUG=1              # Enable debug mode
export LOG_LEVEL=trace      # Maximum verbosity
export LOG_FORMAT=json      # or "pretty"
export DEBUG_LOG=./logs/debug.log
```

### Inspector Configuration

Pre-configured Inspector settings in `config/`:
- `goblin-stdio.json` - STDIO transport config
- `goblin-http.json` - HTTP transport config
- `goblin-sse.json` - SSE transport config

## Debug Logging

Enable debug logging for detailed tracing:

```bash
# Option 1: Use the start-debug script
./tools/debug/bin/goblin-start-debug.sh

# Option 2: Set environment variables
export DEBUG=1
export LOG_LEVEL=trace
bun run dev
```

**What gets logged in debug mode:**
- MCP message events (type, size)
- Connection establishment/closure
- Request routing decisions
- Transport state changes

## Troubleshooting

### Goblin not responding

```bash
# Check if Goblin is running
./tools/debug/bin/goblin-health.sh

# Test connectivity
./tools/debug/bin/goblin-test-connection.sh

# View recent logs
./tools/debug/bin/goblin-logs.sh --level error
```

### Connection refused

```bash
# Check if port is in use
lsof -i :3000

# Stop any running Goblin processes
./tools/debug/bin/goblin-stop.sh --force

# Restart Goblin
./tools/debug/bin/goblin-start-debug.sh
```

### Inspector connection issues

```bash
# Verify Goblin is running
./tools/debug/bin/goblin-health.sh

# Check Goblin URL is correct
export GOBLIN_URL=http://localhost:3000

# Try connecting with Inspector
./tools/debug/bin/goblin-inspector-http.sh
```

## Requirements

- Bun >= 1.0
- Node.js >= 20
- curl (for connection tests)
- npx (for MCP Inspector)

## Architecture

```
tools/debug/
├── bin/              # Executable scripts
│   ├── goblin-inspector-*.sh
│   ├── goblin-health.sh
│   ├── goblin-*.sh
├── config/           # Inspector configurations
│   ├── goblin-*.json
├── environment/      # Environment templates
│   ├── .env.debug
│   └── .env.example
└── README.md
```

## Notes

- Debug logging has minimal performance impact when disabled
- Trace-level logs are only written when `DEBUG=1`
- Inspector uses random auth tokens by default
- All scripts support `--help` for usage information

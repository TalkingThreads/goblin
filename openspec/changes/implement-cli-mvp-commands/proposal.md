## Why

The Goblin CLI currently exists as a scaffold with Commander.js but all commands are stubs that only log messages. The CLI is a core management interface for developers to start the gateway, check status, list tools, and manage servers. Without functional CLI commands, users cannot automate workflows, script interactions, or manage the gateway without the TUI.

## What Changes

### New Capabilities
- **Complete `goblin start` command**: Actually start the gateway with proper initialization, config loading, transport setup, and HTTP server
- **Complete `goblin status` command**: Display gateway status including server count, tool count, connection status, health metrics
- **Complete `goblin tools` command**: List available tools from the registry with JSON output option
- **Add `goblin servers` command**: List configured servers with connection status
- **Add `goblin health` command**: Show detailed health status including per-server health
- **Add `goblin config validate` command**: Validate config file without starting
- **Add `goblin config show` command**: Display current configuration
- **Add `goblin logs` command**: Stream or show recent logs
- **Add global `--json` output flag**: Enable JSON output for scripting
- **Add global `--config` flag**: Override default config path

### Implementation Changes
- Implement `startGateway()` function in CLI to initialize gateway
- Connect CLI to registry, connection manager, health endpoints
- Add structured output formatting for all commands
- Add error handling and exit codes
- Update `src/cli/commands/` structure with modular command files

### Breaking Changes
- **None**: All commands are currently stubs; changes are additive

## Capabilities

### New Capabilities
- `cli-start-command`: Gateway startup with config loading, transport initialization, HTTP server binding
- `cli-status-command`: Display gateway status (servers, tools, health, uptime)
- `cli-tools-command`: List tools with optional JSON output and filtering
- `cli-servers-command`: List configured servers with connection status
- `cli-health-command`: Show detailed health status from `/health` endpoint
- `cli-config-validate-command`: Validate config file and report errors
- `cli-config-show-command`: Display current configuration
- `cli-logs-command`: Show or stream logs with filtering
- `cli-json-output`: Global `--json` flag for scriptable output
- `cli-config-override`: Global `--config` flag for config path override

### Modified Capabilities
- **None**: No existing spec-level requirements being changed

## Impact

### Affected Code
- `src/cli/index.ts`: Refactor to load commands from `commands/` directory
- `src/cli/commands/start.ts`: Start gateway command implementation
- `src/cli/commands/status.ts`: Status command implementation
- `src/cli/commands/tools.ts`: Tools list command implementation
- `src/cli/commands/servers.ts`: Servers list command implementation
- `src/cli/commands/health.ts`: Health command implementation
- `src/cli/commands/config.ts`: Config validate/show subcommands
- `src/cli/commands/logs.ts`: Logs command implementation
- `src/cli/utils/output.ts`: JSON output formatting utilities
- `src/cli/utils/errors.ts`: CLI-specific error handling

### MCP Capabilities Exposed via CLI
- Gateway startup and shutdown
- Registry access for tools/prompts/resources
- Connection manager for server status
- Health endpoints for status commands
- Config loader for validation

### User Impact
- Scriptable gateway management via CLI
- JSON output for integration with other tools
- Validation without starting gateway
- Server status visibility
- Health check commands for monitoring

### Dependencies
- Registry service for tool/server listing
- Connection manager for server status
- Health endpoints for status data
- Config loader for validation
- Logger for log output

### MVP Commands (From Plan MVP-7.1)
Based on the MVP plan, the following CLI commands should be implemented:
- `goblin start` - Start the Gateway
- `goblin status` - Show Gateway status
- `goblin tools` - List available tools
- JSON output flag for scripting

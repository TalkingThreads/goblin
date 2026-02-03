# Requirements: CLI Help Command Fix

## Functional Requirements

### REQ-1: Help Command Execution
- The `goblin help` command SHALL execute successfully
- The command SHALL return exit code 0
- The command SHALL NOT require a running gateway server

### REQ-2: Help Output Content
- Help output SHALL contain all available commands:
  - `version` - Show version information
  - `start` - Start the Gateway
  - `status` - Show Gateway status
  - `tools` - List available tools
  - `servers` - List configured servers
  - `config` - Configuration management
  - `logs` - Show recent logs
  - `health` - Show detailed health status
  - `stop` - Stop the running Gateway

### REQ-3: Help Output Format
- Help output SHALL include command descriptions
- Help output SHALL include option information for each command

## Test Requirements

### TEST-1: Help Command Execution
- Given the CLI is installed
- When running `goblin help`
- Then exit code SHALL be 0
- And stdout SHALL not be empty

### TEST-2: Help Output Contains Commands
- Given the CLI is installed
- When running `goblin help`
- Then output SHALL contain "start"
- And output SHALL contain "status"
- And output SHALL contain "tools"
- And output SHALL contain "servers"
- And output SHALL contain "config"
- And output SHALL contain "logs"
- And output SHALL contain "health"
- And output SHALL contain "stop"

## Acceptance Criteria

- [ ] `goblin help` exits with code 0
- [ ] Help output is not empty
- [ ] All commands are listed in help output
- [ ] No "No server running" errors

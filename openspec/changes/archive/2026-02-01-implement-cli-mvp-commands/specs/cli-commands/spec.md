## ADDED Requirements

### Requirement: CLI Entry Point
The CLI SHALL provide a unified entry point via Commander.js with global flags and command routing.

#### Scenario: Display CLI help
- **WHEN** user runs `goblin --help`
- **THEN** CLI displays available commands and global options
- **AND** shows command descriptions
- **AND** shows global flags (`--help`, `--version`, `--config`, `--json`, `--url`)

#### Scenario: Display command help
- **WHEN** user runs `goblin <command> --help`
- **THEN** CLI displays command-specific options and examples
- **AND** shows inherited global flags

#### Scenario: Display version
- **WHEN** user runs `goblin --version`
- **THEN** CLI displays version number

### Requirement: Global CLI Flags
The CLI SHALL support global flags applicable to all commands.

#### Scenario: Config path override
- **WHEN** user runs `goblin --config /path/to/config.json <command>`
- **THEN** CLI uses specified config path instead of default
- **AND** config path is passed to gateway initialization

#### Scenario: JSON output mode
- **WHEN** user runs `goblin --json <command>`
- **THEN** command output is formatted as JSON
- **AND** human-readable formatting is bypassed

#### Scenario: Gateway URL override
- **WHEN** user runs `goblin --url http://localhost:4000 <command>`
- **THEN** CLI uses specified URL for HTTP API calls
- **AND** default URL (http://localhost:3000) is overridden

#### Scenario: Multiple global flags
- **WHEN** user runs `goblin --json --url http://localhost:4000 status`
- **THEN** all specified flags are applied
- **AND** output is JSON format from specified URL

### Requirement: Start Gateway Command
The `goblin start` command SHALL initialize and run the gateway server.

#### Scenario: Start gateway with default config
- **WHEN** user runs `goblin start`
- **THEN** CLI loads default config from `~/.goblin/config.json`
- **AND** initializes gateway with config
- **AND** starts HTTP server on default port (3000)
- **AND** connects to configured backend servers
- **AND** displays startup messages

#### Scenario: Start gateway with custom port
- **WHEN** user runs `goblin start --port 4000`
- **THEN** CLI starts HTTP server on port 4000
- **AND** other config values use defaults

#### Scenario: Start gateway with custom config
- **WHEN** user runs `goblin start --config /path/to/config.json`
- **THEN** CLI loads config from specified path
- **AND** validates config before starting
- **AND** starts gateway with validated config

#### Scenario: Start gateway with TUI
- **WHEN** user runs `goblin start --tui`
- **THEN** CLI launches TUI after gateway starts
- **AND** TUI displays real-time status

#### Scenario: Start gateway with invalid config
- **WHEN** user runs `goblin start` with invalid config
- **THEN** CLI displays validation error
- **AND** does not start gateway
- **AND** exits with code 4

#### Scenario: Start gateway with connection failure
- **WHEN** user runs `goblin start` and backend server fails to connect
- **THEN** CLI logs connection error
- **AND** continues starting gateway (server may still be usable)
- **AND** displays warning about failed connections

#### Scenario: Graceful shutdown
- **WHEN** user presses Ctrl+C while gateway is running
- **THEN** CLI initiates graceful shutdown
- **AND** closes server connections
- **AND** exits with code 0

### Requirement: Status Command
The `goblin status` command SHALL display gateway status and summary information.

#### Scenario: Display status when gateway is running
- **WHEN** user runs `goblin status`
- **AND** gateway is running on default URL
- **THEN** CLI fetches health from `/health` endpoint
- **AND** displays gateway status (running/stopped)
- **AND** displays number of connected servers
- **AND** displays total tool count
- **AND** displays total prompt count
- **AND** displays total resource count
- **AND** displays gateway uptime

#### Scenario: Display status in JSON format
- **WHEN** user runs `goblin status --json`
- **THEN** CLI outputs status as JSON object
- **AND** includes all status fields
- **AND** exits with code 0

#### Scenario: Display status when gateway is not running
- **WHEN** user runs `goblin status`
- **AND** gateway is not running or unreachable
- **THEN** CLI displays error message
- **AND** exits with code 3

#### Scenario: Display status with custom URL
- **WHEN** user runs `goblin status --url http://localhost:4000`
- **THEN** CLI fetches health from specified URL
- **AND** displays status from that gateway

### Requirement: Tools Command
The `goblin tools` command SHALL list available tools from the registry.

#### Scenario: List all tools
- **WHEN** user runs `goblin tools`
- **AND** gateway is running
- **THEN** CLI fetches tool list from registry
- **AND** displays tools in table format
- **AND** shows: name, server, description summary
- **AND** exits with code 0

#### Scenario: List tools in JSON format
- **WHEN** user runs `goblin tools --json`
- **THEN** CLI outputs tools array as JSON
- **AND** includes compact card format
- **AND** exits with code 0

#### Scenario: Filter tools by server
- **WHEN** user runs `goblin tools --server filesystem`
- **THEN** CLI displays only tools from specified server
- **AND** other tools are filtered out

#### Scenario: Search tools by name
- **WHEN** user runs `goblin tools --search file`
- **THEN** CLI displays tools matching search term
- **AND** searches in tool name and description

#### Scenario: List tools when gateway is not running
- **WHEN** user runs `goblin tools`
- **AND** gateway is not running
- **THEN** CLI displays error message
- **AND** exits with code 3

### Requirement: Servers Command
The `goblin servers` command SHALL list configured servers with their connection status.

#### Scenario: List all servers
- **WHEN** user runs `goblin servers`
- **AND** gateway is running
- **THEN** CLI fetches server list from registry
- **AND** displays servers in table format
- **AND** shows: name, transport, status, tool count
- **AND** status indicators use colors (green=online, red=offline)

#### Scenario: List servers in JSON format
- **WHEN** user runs `goblin servers --json`
- **THEN** CLI outputs servers array as JSON
- **AND** includes status and metadata
- **AND** exits with code 0

#### Scenario: Filter servers by status
- **WHEN** user runs `goblin servers --status online`
- **THEN** CLI displays only servers with specified status
- **AND** valid statuses: online, offline, error

#### Scenario: Show server details
- **WHEN** user runs `goblin servers --verbose`
- **THEN** CLI displays additional server details
- **AND** includes: endpoint, mode, last connected time

### Requirement: Health Command
The `goblin health` command SHALL display detailed health status.

#### Scenario: Display health summary
- **WHEN** user runs `goblin health`
- **AND** gateway is running
- **THEN** CLI fetches detailed health from `/health` endpoint
- **AND** displays overall gateway health
- **AND** displays per-server health status
- **AND** displays connection metrics

#### Scenario: Display health in JSON format
- **WHEN** user runs `goblin health --json`
- **THEN** CLI outputs full health object as JSON
- **AND** includes all health metrics
- **AND** exits with code 0

#### Scenario: Display health with verbose output
- **WHEN** user runs `goblin health --verbose`
- **THEN** CLI displays additional health details
- **AND** includes: memory usage, connection pool stats, latency metrics

#### Scenario: Health check timeout
- **WHEN** user runs `goblin health`
- **AND** gateway does not respond within timeout
- **THEN** CLI displays connection timeout error
- **AND** exits with code 3

### Requirement: Config Validate Command
The `goblin config validate` command SHALL validate configuration file.

#### Scenario: Validate valid config
- **WHEN** user runs `goblin config validate`
- **THEN** CLI loads default config file
- **AND** validates against JSON Schema
- **AND** displays "Config is valid"
- **AND** exits with code 0

#### Scenario: Validate with custom path
- **WHEN** user runs `goblin config validate --config /path/to/config.json`
- **THEN** CLI loads config from specified path
- **AND** validates against JSON Schema

#### Scenario: Validate invalid config
- **WHEN** user runs `goblin config validate`
- **AND** config file is invalid
- **THEN** CLI displays validation errors
- **AND** shows line numbers and error descriptions
- **AND** exits with code 4

#### Scenario: Validate missing config
- **WHEN** user runs `goblin config validate`
- **AND** config file does not exist
- **THEN** CLI displays file not found error
- **AND** exits with code 4

### Requirement: Config Show Command
The `goblin config show` command SHALL display current configuration.

#### Scenario: Show config in human-readable format
- **WHEN** user runs `goblin config show`
- **THEN** CLI loads current config
- **AND** displays configuration in readable format
- **AND** sensitive fields are redacted

#### Scenario: Show config in JSON format
- **WHEN** user runs `goblin config show --json`
- **THEN** CLI outputs config as JSON
- **AND** sensitive fields are redacted
- **AND** exits with code 0

#### Scenario: Show config with secrets
- **WHEN** user runs `goblin config show --include-secrets`
- **THEN** CLI displays config with sensitive data
- **AND** warns about security implications

#### Scenario: Show config from file
- **WHEN** user runs `goblin config show --config /path/to/config.json`
- **THEN** CLI loads and displays specified config file
- **AND** does not require running gateway

### Requirement: Logs Command
The `goblin logs` command SHALL display gateway logs.

#### Scenario: Show recent logs
- **WHEN** user runs `goblin logs`
- **THEN** CLI displays recent log entries
- **AND** shows: timestamp, level, message
- **AND** exits with code 0

#### Scenario: Stream logs in real-time
- **WHEN** user runs `goblin logs --follow`
- **THEN** CLI displays logs in real-time
- **AND** new log entries appear as they are written
- **AND** user can exit with Ctrl+C

#### Scenario: Filter logs by level
- **WHEN** user runs `goblin logs --level error`
- **THEN** CLI displays only logs at specified level
- **AND** valid levels: trace, debug, info, warn, error, fatal

#### Scenario: Limit log count
- **WHEN** user runs `goblin logs --lines 50`
- **THEN** CLI displays only last 50 log entries

#### Scenario: Show logs in JSON format
- **WHEN** user runs `goblin logs --json`
- **THEN** CLI outputs logs as JSON array
- **AND** includes all log fields

#### Scenario: Follow logs with filter
- **WHEN** user runs `goblin logs --follow --level error`
- **THEN** CLI streams only error-level logs
- **AND** filters in real-time

### Requirement: Error Handling
The CLI SHALL handle errors consistently with appropriate exit codes.

#### Scenario: Invalid command
- **WHEN** user runs `goblin invalid-command`
- **THEN** CLI displays "Unknown command" error
- **AND** exits with code 2

#### Scenario: Missing required argument
- **WHEN** user runs `goblin start --missing-required`
- **THEN** CLI displays argument error
- **AND** exits with code 2

#### Scenario: Connection refused
- **WHEN** user runs `goblin status` and gateway is not reachable
- **THEN** CLI displays connection error
- **AND** exits with code 3

#### Scenario: Unexpected error
- **WHEN** user runs any command and unexpected error occurs
- **THEN** CLI displays error message
- **AND** logs error details (if debug enabled)
- **AND** exits with code 1

### Requirement: Output Formatting
The CLI SHALL format output consistently for human and machine readability.

#### Scenario: Human-readable table output
- **WHEN** user runs command without `--json`
- **THEN** output is formatted as tables
- **AND** columns are aligned
- **AND** status indicators use colors
- **AND** long text is truncated appropriately

#### Scenario: JSON output formatting
- **WHEN** user runs command with `--json`
- **THEN** output is valid JSON
- **AND** indentation is 2 spaces
- **AND** no trailing whitespace

#### Scenario: Compact output
- **WHEN** user runs command with `--compact`
- **THEN** output is minimal format
- **AND** only essential information is shown
- **AND** suitable for scripting

### Requirement: Exit Codes
The CLI SHALL use consistent exit codes for scripting.

#### Scenario: Successful execution
- **WHEN** command completes successfully
- **THEN** CLI exits with code 0

#### Scenario: Invalid arguments
- **WHEN** command has invalid arguments or unknown command
- **THEN** CLI exits with code 2

#### Scenario: Gateway not running
- **WHEN** command requires running gateway but gateway is unreachable
- **THEN** CLI exits with code 3

#### Scenario: Config validation error
- **WHEN** config validation fails
- **THEN** CLI exits with code 4

#### Scenario: General error
- **WHEN** unexpected error occurs
- **THEN** CLI exits with code 1

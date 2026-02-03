## ADDED Requirements

### Requirement: Stop command exists and is available
The CLI SHALL provide a `stop` command that can be invoked via `goblin stop`.

#### Scenario: Stop command is listed in help
- **WHEN** `goblin --help` is executed
- **THEN** the output SHALL contain "stop" in the Commands section

### Requirement: Stop command gracefully shuts down gateway
The stop command SHALL send a shutdown request to the gateway and exit with code 0 on success.

#### Scenario: Stop command succeeds when gateway is running
- **GIVEN** a gateway is running at http://localhost:3000
- **WHEN** `goblin stop` is executed
- **THEN** the gateway SHALL shut down gracefully
- **AND** the command SHALL exit with code 0

#### Scenario: Stop command handles missing gateway gracefully
- **GIVEN** no gateway is running at the target URL
- **WHEN** `goblin stop` is executed
- **THEN** the command SHALL exit with code 0
- **AND** the output SHALL indicate no gateway is running

### Requirement: Stop command supports custom URL
The stop command SHALL accept a `--url` option to specify a non-default gateway URL.

#### Scenario: Stop command with custom URL
- **GIVEN** a gateway is running at http://localhost:4000
- **WHEN** `goblin stop --url http://localhost:4000` is executed
- **THEN** the gateway SHALL shut down gracefully
- **AND** the command SHALL exit with code 0

### Requirement: Stop command provides help
The stop command SHALL support `--help` flag and display usage information.

#### Scenario: Stop command help
- **WHEN** `goblin stop --help` is executed
- **THEN** the output SHALL contain "stop"
- **AND** the command SHALL exit with code 0

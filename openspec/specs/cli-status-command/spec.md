# CLI Status Command Specification

## Purpose
TBD - created by archiving change fix-smoke-test-failures. Update Purpose after archive.

## Requirements

### Requirement: Status command reports gateway state
The status command SHALL query the gateway status endpoint and report the current state. When the gateway is not running, this SHALL be reported as a normal state, not an error.

#### Scenario: Status command succeeds when gateway is not running
- **GIVEN** no gateway is running at the target URL
- **WHEN** `goblin status` is executed
- **THEN** the command SHALL output a message indicating the gateway is not running
- **AND** the command SHALL exit with code 0

#### Scenario: Status command succeeds when gateway is running
- **GIVEN** a gateway is running at http://localhost:3000
- **WHEN** `goblin status` is executed
- **THEN** the command SHALL display gateway status information
- **AND** the command SHALL exit with code 0

### Requirement: Status command supports JSON output
The status command SHALL support `--json` option for machine-readable output.

#### Scenario: Status command JSON output when gateway offline
- **GIVEN** no gateway is running at the target URL
- **WHEN** `goblin status --json` is executed
- **THEN** the command SHALL output valid JSON
- **AND** the JSON SHALL contain an error field describing the offline state
- **AND** the command SHALL exit with code 0

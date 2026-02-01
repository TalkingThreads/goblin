# CLI Command Tests Specification

This document defines the behavioral specifications for Goblin CLI commands.

## Requirement: CLI help command

The CLI SHALL display help information when run with --help or -h flag.

### Scenario: Global help displayed

- **WHEN** user runs `goblin --help`
- **THEN** help information SHALL be displayed
- **AND** all available commands SHALL be listed
- **AND** command descriptions SHALL be included

### Scenario: Command-specific help displayed

- **WHEN** user runs `goblin <command> --help`
- **THEN** help for specific command SHALL be displayed
- **AND** command usage SHALL be shown
- **AND** available options SHALL be listed

### Scenario: Help output is readable

- **WHEN** help is displayed
- **THEN** output SHALL be properly formatted
- **AND** sections SHALL be clearly separated
- **AND** examples SHALL be included where appropriate

## Requirement: CLI version command

The CLI SHALL display version information when run with --version or -v flag.

### Scenario: Version displayed correctly

- **WHEN** user runs `goblin --version`
- **THEN** version number SHALL be displayed
- **AND** version SHALL match package.json
- **AND** exit code SHALL be 0

### Scenario: Version includes additional info

- **WHEN** user runs `goblin --version`
- **THEN** version output MAY include commit hash
- **AND** version output MAY include build date

## Requirement: CLI start command

The CLI SHALL start the gateway server when run with `goblin start`.

### Scenario: Gateway starts successfully

- **WHEN** user runs `goblin start`
- **THEN** gateway process SHALL start
- **AND** output SHALL indicate startup
- **AND** gateway SHALL be ready to accept connections

### Scenario: Gateway starts with config file

- **WHEN** user runs `goblin start --config <file>`
- **THEN** gateway SHALL load specified config
- **AND** gateway SHALL start with config settings
- **AND** invalid config SHALL show error

### Scenario: Gateway fails with invalid config

- **WHEN** user runs `goblin start` with invalid config
- **THEN** error message SHALL be displayed
- **AND** gateway SHALL not start
- **AND** exit code SHALL be non-zero

## Requirement: CLI stop command

The CLI SHALL stop a running gateway when run with `goblin stop`.

### Scenario: Gateway stops gracefully

- **WHEN** gateway is running and user runs `goblin stop`
- **THEN** gateway SHALL receive shutdown signal
- **AND** gateway SHALL stop gracefully
- **AND** cleanup SHALL be performed

### Scenario: Stop non-running gateway

- **WHEN** no gateway is running and user runs `goblin stop`
- **THEN** message SHALL indicate no gateway running
- **AND** exit code SHALL be 0

## Requirement: CLI status command

The CLI SHALL display gateway status when run with `goblin status`.

### Scenario: Status shows running gateway

- **WHEN** gateway is running and user runs `goblin status`
- **THEN** status SHALL indicate gateway is running
- **AND** process ID SHALL be displayed
- **AND** uptime SHALL be shown

### Scenario: Status shows stopped gateway

- **WHEN** no gateway is running and user runs `goblin status`
- **THEN** status SHALL indicate gateway is stopped
- **AND** exit code SHALL be 0

## Requirement: CLI servers command

The CLI SHALL manage connected servers with `goblin servers` command.

### Scenario: List connected servers

- **WHEN** gateway is running and user runs `goblin servers list`
- **THEN** list of connected servers SHALL be displayed
- **AND** server status SHALL be shown
- **AND** server names SHALL be correct

### Scenario: Add server

- **WHEN** user runs `goblin servers add <config>`
- **THEN** server SHALL be added to configuration
- **AND** server SHALL connect to gateway
- **AND** confirmation SHALL be displayed

### Scenario: Remove server

- **WHEN** user runs `goblin servers remove <name>`
- **THEN** server SHALL be disconnected
- **AND** server SHALL be removed from configuration
- **AND** confirmation SHALL be displayed

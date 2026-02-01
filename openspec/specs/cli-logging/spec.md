# cli-logging Specification

## Purpose
TBD - created by archiving change replace-cli-logging. Update Purpose after archive.
## Requirements
### Requirement: CLI uses structured logging

The CLI SHALL use pino structured logging instead of console.log for all output.

#### Scenario: Start command logs with structured context
- **WHEN** `goblin start` command is executed
- **THEN** logger.info is called with options as structured context
- **AND** no console.log statements are executed

#### Scenario: Status command logs with structured message
- **WHEN** `goblin status` command is executed
- **THEN** logger.info is called with appropriate message
- **AND** no console.log statements are executed

#### Scenario: Tools command logs with structured message
- **WHEN** `goblin tools` command is executed
- **THEN** logger.info is called with appropriate message
- **AND** no console.log statements are executed


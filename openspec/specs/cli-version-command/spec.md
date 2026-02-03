# CLI Version Command Specification

## Purpose
TBD - created by archiving change fix-smoke-test-failures. Update Purpose after archive.

## Requirements

### Requirement: CLI supports version flag
The CLI SHALL support both long and short form version flags to display the current version.

#### Scenario: Version with long flag
- **WHEN** `goblin --version` is executed
- **THEN** the command SHALL output the version number
- **AND** the command SHALL exit with code 0
- **AND** no errors SHALL be written to stderr

#### Scenario: Version with short flag
- **WHEN** `goblin -v` is executed
- **THEN** the command SHALL output the version number
- **AND** the command SHALL exit with code 0
- **AND** no errors SHALL be written to stderr

### Requirement: Version output format
The version output SHALL follow semantic versioning format and be parseable.

#### Scenario: Version format is parseable
- **WHEN** `goblin --version` is executed
- **THEN** the output SHALL match the pattern `v?\\d+\\.\\d+\\.\\d+`
- **AND** the version SHALL match the version in package.json

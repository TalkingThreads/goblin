## ADDED Requirements

### Requirement: version command supports --json flag
The `version` command SHALL output JSON when `--json` flag is passed.

#### Scenario: Version outputs JSON
- **WHEN** `goblin version --json` is executed
- **THEN** stdout SHALL contain valid JSON with `version` field
- **AND** exit code SHALL be 0

### Requirement: status command supports --json flag
The `status` command SHALL output JSON when `--json` flag is passed.

#### Scenario: Status outputs JSON
- **WHEN** `goblin status --json` is executed
- **THEN** stdout SHALL contain valid JSON with status information
- **AND** exit code SHALL be 0

### Requirement: logs command supports --json flag
The `logs` command SHALL output JSON when `--json` flag is passed.

#### Scenario: Logs outputs JSON
- **WHEN** `goblin logs --json` is executed
- **THEN** stdout SHALL contain valid JSON with log entries
- **AND** exit code SHALL be 0

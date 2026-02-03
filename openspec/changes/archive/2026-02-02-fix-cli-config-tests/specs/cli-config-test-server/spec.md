## ADDED Requirements

### Requirement: CLI config tests start gateway server
The CLI configuration tests SHALL start a gateway server before running config-related tests.

#### Scenario: Server starts before config tests
- **WHEN** the CLI config test describe block is entered
- **THEN** `beforeAll` hook SHALL call `startTestServer()`
- **AND** wait for server health check to pass

#### Scenario: Server stops after config tests
- **WHEN** all config tests complete
- **THEN** `afterAll` hook SHALL call `stopTestServer()`
- **AND** ensure no zombie processes remain

### Requirement: Tests skip if server unavailable
CLI config tests SHALL skip gracefully when the gateway server cannot be started.

#### Scenario: Health check fails
- **WHEN** `checkServerHealth()` returns `{ healthy: false }`
- **THEN** tests SHALL be skipped with message "Skipping: server not available"
- **AND** no test assertions SHALL fail

### Requirement: Config validate works with running server
The `config validate` command SHALL return exit code 0 when run against a running gateway with valid config.

#### Scenario: Valid config passes validation
- **WHEN** `cli.run(["config", "validate", "--config", configPath])` is called
- **AND** a gateway server is running
- **THEN** result.exitCode SHALL be 0

#### Scenario: Config show outputs JSON with running server
- **WHEN** `cli.run(["config", "show", "--config", configPath, "--json"])` is called
- **AND** a gateway server is running
- **THEN** result.exitCode SHALL be 0
- **AND** result.stdout SHALL contain valid JSON

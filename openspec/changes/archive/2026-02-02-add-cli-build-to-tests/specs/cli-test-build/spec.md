## ADDED Requirements

### Requirement: CLI binary exists before tests run
The test runner SHALL verify that `dist/cli/index.js` exists before executing CLI tests.

#### Scenario: CLI binary exists
- **WHEN** `CliTester` is instantiated
- **THEN** it SHALL check if `dist/cli/index.js` exists
- **AND** if exists, proceed with tests normally

#### Scenario: CLI binary does not exist
- **WHEN** `CliTester` is instantiated
- **THEN** it SHALL throw an error with message "CLI binary not found. Run 'bun run build:cli' first."

### Requirement: Build script runs before E2E tests
The `pretest:e2e` script SHALL build the CLI before running E2E tests.

#### Scenario: Running bun test:e2e
- **WHEN** user runs `bun test:e2e`
- **THEN** `pretest:e2e` SHALL execute `bun build:cli` first
- **AND** then run the E2E tests

#### Scenario: Build fails
- **WHEN** `bun build:cli` fails
- **THEN** the test run SHALL terminate with the build error
- **AND** no tests SHALL be executed

### Requirement: CliTester uses correct binary path
The `CliTester` SHALL use `node dist/cli/index.js` as the default binary path.

#### Scenario: Running version command
- **WHEN** `cli.version()` is called
- **THEN** it SHALL spawn `node dist/cli/index.js --version`
- **AND** return output containing "goblin"

#### Scenario: Running help command
- **WHEN** `cli.help()` is called
- **THEN** it SHALL spawn `node dist/cli/index.js --help`
- **AND** return output containing "start", "status", "tools", "servers"

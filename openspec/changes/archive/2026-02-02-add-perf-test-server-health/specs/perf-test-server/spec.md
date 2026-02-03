## ADDED Requirements

### Requirement: Test server can start
The test server module SHALL provide a function to start a gateway server for testing.

#### Scenario: Starting server
- **WHEN** `startTestServer()` is called
- **THEN** it SHALL spawn a gateway process
- **AND** wait for the `/health` endpoint to respond
- **AND** return the server URL

#### Scenario: Server fails to start
- **WHEN** `startTestServer()` is called
- **AND** the server fails to respond within timeout
- **THEN** it SHALL throw an error with message "Server failed to start"

### Requirement: Test server can stop
The test server module SHALL provide a function to stop the test server.

#### Scenario: Stopping server
- **WHEN** `stopTestServer()` is called
- **THEN** it SHALL terminate the gateway process
- **AND** wait for cleanup

#### Scenario: Stopping non-existent server
- **WHEN** `stopTestServer()` is called when no server is running
- **THEN** it SHALL do nothing and return gracefully

### Requirement: Tests skip when server unavailable
Performance tests SHALL skip gracefully when the server is not running.

#### Scenario: Health check passes
- **WHEN** `checkServerHealth()` is called
- **AND** the server responds to `/health`
- **THEN** it SHALL return `{ healthy: true }`

#### Scenario: Health check fails
- **WHEN** `checkServerHealth()` is called
- **AND** the server does not respond or responds with error
- **THEN** it SHALL return `{ healthy: false, message: "Server not available" }`

#### Scenario: Test skips when unhealthy
- **WHEN** a performance test runs
- **AND** `checkServerHealth()` returns `{ healthy: false }`
- **THEN** the test SHALL be skipped with message "Skipping: server not available"

### Requirement: Server lifecycle hooks work correctly
Performance test files SHALL use `beforeAll` and `afterAll` hooks to manage server lifecycle.

#### Scenario: BeforeAll starts server
- **WHEN** a test file with `beforeAll` calling `startTestServer()` runs
- **THEN** the server SHALL be available before any test executes

#### Scenario: AfterAll stops server
- **WHEN** all tests complete
- **THEN** `afterAll` calling `stopTestServer()` SHALL terminate the server
- **AND** no zombie processes SHALL remain

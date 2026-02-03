## ADDED Requirements

### Requirement: Cross-platform signal registration
The system SHALL register signal handlers only for signals supported on the current platform.

#### Scenario: Registering handlers on Unix-like systems
- **GIVEN** the platform is macOS or Linux (`process.platform !== "win32"`)
- **WHEN** the gateway starts up
- **THEN** it SHALL register handlers for both `SIGINT` and `SIGTERM`

#### Scenario: Registering handlers on Windows
- **GIVEN** the platform is Windows (`process.platform === "win32"`)
- **WHEN** the gateway starts up
- **THEN** it SHALL register only the `SIGINT` handler
- **AND** it SHALL NOT attempt to register `SIGTERM`

### Requirement: Graceful shutdown helper
The system SHALL provide a utility function for graceful shutdown of child processes that works across all platforms.

#### Scenario: Graceful shutdown on Unix
- **GIVEN** the platform is macOS or Linux
- **AND** a child process is running
- **WHEN** calling `gracefulShutdown(childProcess)`
- **THEN** it SHALL send `SIGTERM` to the child process
- **AND** wait for the process to exit
- **AND** if the process doesn't exit within the timeout, send `SIGKILL`

#### Scenario: Graceful shutdown on Windows
- **GIVEN** the platform is Windows
- **AND** a child process is running
- **WHEN** calling `gracefulShutdown(childProcess)`
- **THEN** it SHALL send `SIGINT` to the child process
- **AND** wait for the process to exit
- **AND** if the process doesn't exit within the timeout, send `SIGKILL`

#### Scenario: Graceful shutdown with custom timeout
- **GIVEN** a child process is running
- **WHEN** calling `gracefulShutdown(childProcess, 10000)` with a 10-second timeout
- **THEN** it SHALL use the provided timeout value
- **AND** send the platform-appropriate signal
- **AND** escalate to `SIGKILL` after the timeout expires

### Requirement: Signal handler setup utility
The system SHALL provide a utility function `setupShutdownHandlers()` that abstracts platform-specific signal handling.

#### Scenario: Setup with Unix platform
- **GIVEN** the platform is macOS or Linux
- **WHEN** calling `setupShutdownHandlers(callback)`
- **THEN** it SHALL register the callback for both `SIGINT` and `SIGTERM` events

#### Scenario: Setup with Windows platform
- **GIVEN** the platform is Windows
- **WHEN** calling `setupShutdownHandlers(callback)`
- **THEN** it SHALL register the callback only for `SIGINT`
- **AND** it SHALL NOT register for `SIGTERM`

#### Scenario: Handler invocation
- **GIVEN** shutdown handlers have been set up
- **WHEN** a registered signal is received
- **THEN** the provided callback SHALL be invoked

### Requirement: Test utilities use cross-platform shutdown
The test utilities SHALL use cross-platform shutdown strategies to ensure tests work on all platforms.

#### Scenario: CLI tester cleanup
- **GIVEN** a test has started a gateway process via `CliTester`
- **WHEN** calling `cleanup()` on the tester
- **THEN** it SHALL use the `gracefulShutdown()` helper
- **AND** send the appropriate signal for the current platform

#### Scenario: Process manager stop
- **GIVEN** a gateway process is managed by `ProcessManager`
- **WHEN** calling `stop()` on the manager
- **THEN** it SHALL use the `gracefulShutdown()` helper
- **AND** respect the configured shutdown timeout
- **AND** escalate to `SIGKILL` if necessary

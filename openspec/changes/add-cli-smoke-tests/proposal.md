## Why

Goblin needs CLI and smoke tests to ensure basic functionality works correctly after builds and deployments. These tests validate the critical path: CLI commands execute, the gateway starts and shuts down cleanly, health endpoints respond correctly, and tools are discovered from backends. Without these tests, build issues and basic regressions can go undetected, affecting developer productivity and system reliability.

## What Changes

- Write CLI command integration tests validating command execution, output format, and error handling
- Write startup/shutdown tests validating clean startup, graceful shutdown, and resource cleanup
- Write health endpoint tests validating /health, /ready, and /metrics endpoints
- Write basic tool discovery tests validating tools are discovered from backend servers correctly

All tests are fast-running smoke tests suitable for CI pipelines and pre-commit hooks.

## Capabilities

### New Capabilities

- `cli-command-tests`: CLI command integration tests for all Goblin CLI commands including start, stop, status, servers, and config commands
- `startup-shutdown-tests`: Gateway startup and shutdown tests including initialization, graceful shutdown, and resource cleanup
- `health-endpoint-tests`: Health check endpoint tests for /health, /ready, and /metrics endpoints
- `tool-discovery-tests`: Basic tool discovery tests validating tools are listed correctly from connected backends

### Modified Capabilities

- None (new test coverage only, no behavior changes)

## Impact

### Affected Code

- `tests/smoke/cli/`: New test directory for CLI command smoke tests
- `tests/smoke/startup/`: New test directory for startup/shutdown tests
- `tests/smoke/health/`: New test directory for health endpoint tests
- `tests/smoke/discovery/`: New test directory for tool discovery tests
- `tests/smoke/shared/`: Shared utilities for smoke tests (process management, output capture)
- `src/cli/`: CLI entry points for testing

### Testing Framework

- Bun test for running smoke tests
- Process spawning for CLI testing
- HTTP client for health endpoint testing
- MCP client for tool discovery testing

### Dependencies

- No new runtime dependencies required
- Uses existing test infrastructure

### Security Considerations

- Smoke tests use temporary directories and test configurations
- Tests validate error messages don't expose sensitive information
- Health endpoints tested for appropriate information disclosure

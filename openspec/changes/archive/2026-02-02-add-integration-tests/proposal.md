## Why

Goblin lacks comprehensive integration tests that validate the complete MCP protocol flow end-to-end. While unit tests cover individual components, integration tests are critical for:
- Validating full MCP handshake and capability negotiation between clients, gateway, and backends
- Ensuring multi-server aggregation works correctly with 2+ backend servers simultaneously
- Testing transport layer resilience, retry logic, and circuit breaking under failure conditions
- Verifying hot reload behavior when configuration changes during active connections
- Validating complex workflows with virtual tools executing in parallel
- Testing resource management through the gateway with real file/resource access

Current test coverage is limited to basic examples without systematic end-to-end validation of the complete system.

## What Changes

- Write integration tests for full MCP handshake validation (capability negotiation, version matching)
- Write integration tests for end-to-end server communication (request/response flow, streaming)
- Write integration tests for multi-server aggregation (load balancing, failover, tool routing)
- Write integration tests for transport failures (connection resilience, retry logic, circuit breaking)
- Write integration tests for configuration hot reload during active operations
- Write integration tests for virtual tools with parallel execution workflows
- Write integration tests for resource management (file access, caching, streaming resources)

All integration tests use Bun test with real MCP client/server connections, test fixtures for backend servers, and verify complete system behavior.

## Capabilities

### New Capabilities

- `integration-tests-mcp-handshake`: Full MCP handshake validation including capability negotiation, version compatibility, and session establishment
- `integration-tests-e2e-communication`: End-to-end server communication validation with request/response flow and streaming
- `integration-tests-multi-server`: Multi-server aggregation tests with 2+ backend servers, load balancing, and failover
- `integration-tests-transport-failures`: Transport layer failure tests including connection resilience, retry logic, and circuit breaking
- `integration-tests-hot-reload`: Configuration hot reload behavior validation during active connections
- `integration-tests-virtual-tools`: Complex virtual tool workflows with parallel execution, dependency handling, and error propagation
- `integration-tests-resource-management`: Resource management tests including file access, caching, and streaming through gateway

### Modified Capabilities

- None (new test coverage only, no behavior changes)

## Impact

### Affected Code

- `tests/integration/handshake/`: New test directory for MCP handshake tests
- `tests/integration/e2e/`: New test directory for end-to-end communication tests
- `tests/integration/multi-server/`: New test directory for multi-server aggregation tests
- `tests/integration/transport/`: New test directory for transport failure tests
- `tests/integration/hot-reload/`: New test directory for hot reload tests
- `tests/integration/virtual-tools/`: New test directory for virtual tool workflow tests
- `tests/integration/resources/`: New test directory for resource management tests
- `tests/fixtures/servers/`: Test fixtures for mock backend servers
- `tests/fixtures/configs/`: Test configurations for various scenarios
- `tests/fixtures/resources/`: Test resource files for resource management tests
- `tests/shared/`: Shared utilities for integration tests (test clients, mock servers, fixtures)

### Testing Framework

- Bun test for running integration tests
- Vitest for advanced assertions and mocking where needed
- Real MCP client/server connections (not mocked at protocol level)
- Test fixtures for backend MCP servers
- Network isolation for parallel test execution

### Dependencies

- No new runtime dependencies required
- Uses existing @modelcontextprotocol/sdk for test clients/servers
- May need additional test utilities for network simulation

### Security Considerations

- Tests validate secure handling of failed authentication attempts
- Tests verify resource access controls through gateway
- Tests confirm sensitive data is not exposed in error messages
- Tests ensure connection failures don't leak credentials

## Why

Goblin lacks comprehensive unit test coverage for its core components. While integration tests exist, unit tests are critical for:
- Ensuring correct behavior of individual components in isolation
- Enabling safe refactoring and feature development
- Providing fast feedback during development (unit tests run in milliseconds)
- Documenting expected behavior through test cases
- Preventing regressions in registry caching, router routing, and config loading

Currently, only basic examples exist in `tests/unit/` without systematic coverage of meta-tools, registry, router, config, observability, or transport layers.

## What Changes

- Write unit tests for all meta-tools (invocation, validation, catalog operations)
- Expand registry tests (registration, aliasing, caching behavior)
- Add router tests (namespacing, error handling, timeout enforcement, edge cases)
- Add Config loader tests (atomic updates, rollback, hot reload, schema validation)
- Add observability tests (logger output, metrics collection, Prometheus format)
- Add Transport tests (STDIO/HTTP adapters, connection pooling, health checks)

All tests use Bun test + Vitest patterns, follow project conventions (2-space indent, double quotes, trailing commas), and achieve minimum 80% coverage on critical paths.

## Capabilities

### New Capabilities

- `unit-tests-meta-tools`: Unit tests for meta-tools including tool invocation, parameter validation, catalog listing, and CRUD operations
- `unit-tests-registry`: Unit tests for registry including tool/resource/prompt registration, aliasing, caching, and namespace isolation
- `unit-tests-router`: Unit tests for router including request routing, namespacing, error handling, timeout enforcement, and edge cases
- `unit-tests-config`: Unit tests for configuration loader including atomic updates, rollback, hot reload, schema validation, and error recovery
- `unit-tests-observability`: Unit tests for observability including logger output format, structured logging, metrics collection, and Prometheus format
- `unit-tests-transport`: Unit tests for transport layer including STDIO/HTTP adapters, connection pooling, health checks, and reconnection logic

### Modified Capabilities

- None (new test coverage only, no behavior changes)

## Impact

### Affected Code

- `src/tools/meta-tools.ts`: New unit tests for tool invocation handler
- `src/tools/meta-tools-validation.ts`: Tests for parameter validation logic
- `src/tools/catalog.ts`: Tests for catalog listing and operations
- `src/gateway/registry.ts`: Expanded tests for registration, aliasing, caching
- `src/gateway/router.ts`: New tests for routing, namespacing, timeouts
- `src/config/loader.ts`: Tests for atomic updates, rollback, hot reload
- `src/config/schema.ts`: Tests for Zod schema validation
- `src/observability/logger.ts`: Tests for structured logging output
- `src/observability/metrics.ts`: Tests for Prometheus metrics collection
- `src/transport/stdio.ts`: Tests for STDIO transport adapter
- `src/transport/http.ts`: Tests for HTTP transport with connection pooling
- `tests/unit/meta-tools/`: New test directory structure
- `tests/unit/registry/`: New test directory structure
- `tests/unit/router/`: New test directory structure
- `tests/unit/config/`: New test directory structure
- `tests/unit/observability/`: New test directory structure
- `tests/unit/transport/`: New test directory structure

### Testing Framework

- Bun test for running tests
- Vitest for advanced assertions and mocking
- Mock functions for external dependencies (HTTP clients, file system)

### Dependencies

- No new dependencies required
- Uses existing test infrastructure

### Security Considerations

- Tests validate error handling prevents information leakage
- Tests verify config validation rejects invalid values
- Tests confirm logging redact sensitive values

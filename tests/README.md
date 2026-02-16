# Goblin Test Suite

This directory contains comprehensive tests for the Goblin MCP Gateway.

## Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| **Unit** | `tests/unit/` | Test individual components in isolation |
| **Integration** | `tests/integration/` | Test component interactions |
| **Smoke** | `tests/smoke/` | Quick validation of core functionality |
| **E2E** | `tests/e2e/` | End-to-end workflow testing |
| **Performance** | `tests/performance/` | Load, latency, and throughput testing |

## Running Tests

```bash
# Run all tests
bun test

# Run specific category
bun test tests/unit/
bun test tests/integration/
bun test tests/smoke/
bun test tests/e2e/
bun test tests/performance/

# Run single test file
bun test tests/unit/config/loader.test.ts

# Watch mode
bun test --watch
```

## Test Utilities

Shared utilities are available in:

- `tests/shared/` - Common test utilities and fixtures
- `tests/smoke/shared/` - Smoke test helpers
- `tests/e2e/shared/` - E2E test helpers

## Coverage

Run tests with coverage:

```bash
bun test --coverage
```

Coverage thresholds are configured in `coverage.config.json`.

## Adding New Tests

When adding new tests:

1. Follow the existing file naming convention: `*.test.ts`
2. Use the appropriate test category
3. Include proper setup/teardown with `beforeEach`/`afterEach`
4. Use shared fixtures from test utilities when available

## Documentation

See category-specific READMEs for detailed information:

- [Unit Tests](unit/README.md)
- [Integration Tests](integration/README.md)
- [Smoke Tests](smoke/README.md)
- [E2E Tests](e2e/README.md)
- [Performance Tests](performance/README.md)

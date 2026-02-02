# Goblin Smoke Tests

Smoke tests for validating core Goblin functionality after builds and deployments.

## Running Smoke Tests

```bash
# Run all smoke tests
bun run smoke

# Run specific category
bun run smoke:cli      # CLI command tests
bun run smoke:startup  # Startup/shutdown tests
bun run smoke:health   # Health endpoint tests
bun run smoke:discovery # Tool discovery tests
```

## Test Categories

### CLI Tests (`tests/smoke/cli/`)
- `help.test.ts` - Help command output
- `version.test.ts` - Version information
- `start.test.ts` - Start command
- `stop.test.ts` - Stop command
- `status.test.ts` - Status command
- `servers.test.ts` - Servers command

### Startup Tests (`tests/smoke/startup/`)
- `clean.test.ts` - Clean startup and configuration

### Health Tests (`tests/smoke/health/`)
- `health.test.ts` - `/health` endpoint
- `ready.test.ts` - `/ready` endpoint
- `metrics.test.ts` - `/metrics` endpoint

### Discovery Tests (`tests/smoke/discovery/`)
- `listing.test.ts` - Tool listing and discovery

## Shared Utilities (`tests/smoke/shared/`)

- `process-manager.ts` - Gateway subprocess lifecycle management
- `output-capture.ts` - CLI output capture and parsing
- `http-client.ts` - HTTP testing utilities
- `test-config.ts` - Test configuration and utilities

## Duration

Smoke tests are designed to complete in under 60 seconds.

## CI Integration

Smoke tests run automatically:
- On pre-commit hooks
- As part of the CI pipeline before full test suite
- After builds to verify deployment readiness

## Adding New Smoke Tests

1. Add test file to appropriate category directory
2. Follow existing test patterns using `bun:test`
3. Keep tests fast (< 5 seconds each)
4. Avoid external dependencies where possible
5. Ensure tests are deterministic and non-flaky

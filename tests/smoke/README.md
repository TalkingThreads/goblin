# Goblin Smoke Tests

Smoke tests for validating core Goblin functionality after builds and deployments. These tests are designed to be fast, deterministic, and cover the "happy path" of all major features.

## Running Smoke Tests

```bash
# Run all smoke tests with full reporting (JUnit and JSON)
bun run smoke

# Alternative alias for the same command
npm run test:smoke

# Run specific category with JUnit reporting
bun run test:smoke:cli       # CLI command tests
bun run test:smoke:startup   # Startup/shutdown tests
bun run test:smoke:health    # Health endpoint tests
bun run test:smoke:discovery # Tool discovery tests
```

## Test File Listing

### CLI Commands (`tests/smoke/cli/`)
- `help.test.ts`: Verifies `--help` flag across all commands.
- `version.test.ts`: Verifies `--version` flag output.
- `start.test.ts`: Validates gateway startup with various flags.
- `stop.test.ts`: Validates graceful shutdown via CLI.
- `status.test.ts`: Checks gateway status reporting.
- `servers.test.ts`: Lists configured and active servers.

### Discovery & Aggregation (`tests/smoke/discovery/`)
- `listing.test.ts`: Verifies tool/resource listing aggregation.
- `filtering.test.ts`: Tests server-based and name-based filtering.
- `schema.test.ts`: Validates tool/resource schemas against MCP spec.
- `availability.test.ts`: Checks server availability status changes.
- `connection.test.ts`: Validates transport connection stability.
- `invocation.test.ts`: Basic tool invocation end-to-end.

### Health & Monitoring (`tests/smoke/health/`)
- `health.test.ts`: Standard `/health` endpoint checks.
- `ready.test.ts`: Standard `/ready` endpoint checks.
- `metrics.test.ts`: Verifies `/metrics` JSON structure and content.
- `probes.test.ts`: Liveness/Readiness probe behavior.
- `auth.test.ts`: Validates health endpoint auth (if enabled).

### Startup & Lifecycle (`tests/smoke/startup/`)
- `clean.test.ts`: First-run configuration and environment setup.
- `graceful.test.ts`: Signal handling (SIGTERM/SIGINT) and cleanup.
- `forced.test.ts`: Behavior under unexpected termination.
- `cleanup.test.ts`: Resource cleanup and port release.
- `errors.test.ts`: Startup failure handling (e.g., port busy).
- `restart.test.ts`: Hot-reload and restart behavior.

## Execution Targets

| Metric | Target | Verification |
|--------|--------|--------------|
| Total Execution Time | < 60 seconds | `time bun run smoke` |
| Individual Test Time | < 5 seconds | Bun test output |
| Pass Rate | 100% | CI Status |
| Flakiness | 0% | 10x local run |

## Configuration

Smoke tests are configured in `tests/smoke/smoke.config.ts`.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeouts.test` | `number` | `5000` | Individual test timeout (ms). |
| `timeouts.suite` | `number` | `60000` | Total suite execution timeout (ms). |
| `parallel.enabled` | `boolean` | `true` | Enable/disable parallel execution. |
| `parallel.workers` | `number` | `undefined` | Number of workers (undefined = auto). |
| `retries.attempts` | `number` | `2` | Number of retry attempts for failed tests. |
| `reporting.reporter` | `string` | `"verbose"` | Test reporter type (verbose, dot, junit, etc.). |
| `reporting.outputDir` | `string` | `"test-results/smoke"` | Directory for test artifacts and results. |
| `reporting.junitFile` | `string` | `"junit.xml"` | JUnit XML output filename. |
| `reporting.jsonFile` | `string` | `"summary.json"` | JSON summary output filename. |

### Environment Variables

- `SMOKE_TEST_RETRIES`: Passed to tests for custom retry logic.
- `NO_COLOR`: Forced to `0` for colorized terminal output.

## Parallel Execution

Smoke tests run in parallel by default to minimize execution time. This is managed via:
- **Bun's Native Parallelism**: `bun test` runs files in parallel.
- **Configuration**: Managed in `tests/smoke/smoke.config.ts`.
- **Concurrency Control**: Adjust `parallel.workers` in the config to limit concurrent processes if hitting resource limits.

## CI Pipeline

Smoke tests are integrated into the GitHub Actions workflow:
- **Workflow**: `.github/workflows/smoke-tests.yml`
- **Trigger**: Every push to `main` and all Pull Requests.
- **Requirement**: Must pass before merging any PR.
- **Environment**: Runs in `ubuntu-latest` with Bun.

## Reporting & Artifacts

- **Console Output**: Verbose reporting by default for easy debugging in CI.
- **Test Results**: Saved to `test-results/smoke/` (configured in `smoke.config.ts`).
- **JUnit XML (`junit.xml`)**: Standard JUnit-compatible XML for CI integration.
- **JSON Summary (`summary.json`)**: A concise JSON report containing:
  - Timestamp of the run
  - Total duration (ms)
  - Test counts (total, passed, failed, skipped)
  - Overall success status

## Shared Utilities (`tests/smoke/shared/`)

- `process-manager.ts`: Gateway subprocess lifecycle management.
- `output-capture.ts`: CLI output capture and parsing.
- `http-client.ts`: HTTP testing utilities for health/metrics endpoints.
- `test-config.ts`: Shared constants and environment setup.

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   - Error: `EADDRINUSE: address already in use :::3000`
   - Fix: Ensure no other Goblin instance is running or change the port in `test-config.ts`.

2. **Zombie Processes**:
   - Issue: Tests hang or subsequent runs fail because a previous process didn't exit.
   - Fix: Run `pkill -f goblin` or `goblin stop`.

3. **Timeouts**:
   - Issue: `Test timed out after 5000ms`.
   - Fix: Check system load or increase `timeouts.test` in `smoke.config.ts`.

4. **Missing Dependencies**:
   - Issue: `Command not found: goblin`.
   - Fix: Ensure the project is built using `bun run build:cli`.

## Adding New Smoke Tests

1. Add test file to appropriate category directory.
2. Follow existing test patterns using `bun:test`.
3. Keep tests fast (< 5 seconds each).
4. Avoid external dependencies where possible.
5. Ensure tests are deterministic and non-flaky.

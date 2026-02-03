# Add Performance Test Server Health Checks

## Why

The performance tests in `tests/performance/` require a running gateway server at `http://localhost:3000`, but none of the test files start or manage a server. Tests timeout waiting for connections and fail with `ConnectionRefused` errors, causing 50+ test failures.

## What Changes

- Create a `tests/performance/shared/test-server.ts` module with server lifecycle management
- Add `beforeAll`/`afterAll` hooks to performance test files to start/stop gateway
- Add health check function to detect if server is running before tests
- Skip tests gracefully with clear message if server unavailable
- Affected test files: `latency/target.test.ts`, `load/concurrent.test.ts`, `load/rampup.test.ts`, `load/sustained.test.ts`, `throughput/capacity.test.ts`, `memory/stability.test.ts`

## Capabilities

### New Capabilities
- `perf-test-server`: Server lifecycle management for performance tests
- `perf-test-health`: Health check capability for test server availability

### Modified Capabilities
None - this is test infrastructure, not production code.

## Impact

- **Affected Files**: 6 test files + 1 new shared module
- **Affected Tests**: ~100+ performance tests
- **Risk**: Low - test infrastructure changes only
- **Test Time**: Adds ~10-15 seconds for server startup

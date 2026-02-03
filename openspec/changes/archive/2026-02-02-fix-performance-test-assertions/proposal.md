## Why

Tests use `console.assert()` instead of proper Bun test assertions. `console.assert()` logs but doesn't fail the test, meaning tests pass even when assertions fail. This masks real issues during CI runs.

## What Changes

- **Replace `console.assert()` with `expect()`**: In all latency, load, memory, throughput, and baseline tests
- **Add missing assertions**: Tests like "Memory After Idle Period" and "Load Spike Recovery" have no assertions
- **Add proper error handling**: Use `expect()` with descriptive error messages
- **Fix assertion logic**: Ensure tests fail when metrics don't meet thresholds

## Capabilities

### New Capabilities
- None (this is a test quality improvement)

### Modified Capabilities
- `performance-tests`: All tests now properly fail when assertions don't pass

## Impact

- **Tests**: All 25+ performance tests will properly fail on assertion violations
- **CI/CD**: Failures caught in CI instead of silently passing
- **Code**: ~30 files modified (latency, load, memory, throughput, baseline tests)

## Why

Performance tests currently take too long to run, making development and CI feedback loops slow. Tests like 1-hour memory stability and 8-hour sustained load are impractical for regular development. Additionally, tests use `console.assert()` which doesn't fail tests in Bun, causing failures to go unnoticed.

## What Changes

- **Add fast mode via environment variables**: `PERFORMANCE_TEST_FAST_MODE=true` reduces all test durations by 10x
- **Add configurable thresholds via env vars**: Allow override of latency, error rate, and throughput thresholds
- **Update test configuration loader**: Add helper functions to read fast mode and threshold overrides
- **Add npm scripts for quick testing**: `bun run perf:quick` for fast validation (<5 min total)

## Capabilities

### New Capabilities
- `performance-test-fast-mode`: Environment-based configuration for quick performance test runs
- `performance-test-thresholds`: Configurable performance thresholds via environment variables

### Modified Capabilities
- `performance-tests`: Now supports fast mode and configurable thresholds

## Impact

- **Code**: `tests/performance/shared/test-config.ts` - Add fast mode and threshold overrides
- **Tests**: All performance tests respect fast mode for development
- **CI/CD**: Can run quick validation in PRs, full benchmarks on main/release
- **Developer Experience**: Fast feedback during development

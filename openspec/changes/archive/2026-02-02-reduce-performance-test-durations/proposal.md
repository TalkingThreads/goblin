## Why

Long-running performance tests (1 hour, 8 hours) are impractical for regular development and slow down CI. Most issues can be caught with shorter tests. We need to reduce durations while maintaining test coverage.

## What Changes

- **Reduce 1-hour memory test to 5 minutes** (with @full annotation for 1-hour version)
- **Reduce 1-hour sustained load to 5 minutes** (with @extended annotation for long-running)
- **Reduce sample counts proportionally**: Memory samples every 30s instead of every few seconds
- **Add test annotations**: `@quick` for fast tests, `@full` for comprehensive, `@extended` for long-running
- **Add test filtering**: `bun test --filter quick` runs only fast tests

## Capabilities

### New Capabilities
- `quick-performance-tests`: Fast validation tests (<5 min total)
- `extended-performance-tests`: Long-running benchmark tests (1+ hours)

### Modified Capabilities
- `performance-tests`: Now supports test duration categories

## Impact

- **Tests**: 4 long-running tests reduced from hours to minutes
- **Developer Experience**: Quick feedback during development
- **CI/CD**: Can run quick tests on every PR
- **Code**: 4 test files modified

## Why

Performance test infrastructure has code duplication, missing cleanup handlers, and inconsistent error handling. The memory monitor has duplicate code, load generator lacks progress reporting, and tests lack proper timeout handling.

## What Changes

- **Fix memory-monitor.ts**: Eliminate duplicate `takeSnapshot()` code, improve cleanup in `stop()`
- **Improve load-generator.ts**: Add request timeout handling, better error reporting, progress indicators
- **Add progress indicators**: Long-running tests show progress
- **Add proper timeout handling**: All async operations have explicit AbortSignal
- **Add cleanup for interrupted tests**: Tests clean up resources on interruption

## Capabilities

### New Capabilities
- `performance-test-infrastructure`: Improved test utilities with better error handling

### Modified Capabilities
- `performance-tests`: More reliable test infrastructure

## Impact

- **Code**: 3 shared utility files improved
- **Tests**: More reliable execution, better error messages
- **Debugging**: Progress indicators and better error reporting
- **Reliability**: Proper cleanup on test interruption

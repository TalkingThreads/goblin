# Fix Performance Test Infrastructure

## Problem Statement

Performance tests are failing with timeout errors and infrastructure issues:
1. Tests timeout after 5000ms while waiting for load generators
2. Load generator processes are killed with "dangling process" messages
3. No server is running - tests need proper server management
4. Test infrastructure doesn't properly clean up between tests

## Root Cause Analysis

1. **Missing server startup**: Performance tests expect a running gateway but none is started
2. **Timeout too short**: 5000ms timeout is insufficient for load tests that run for 30-60 seconds
3. **Process management**: Tests spawn load generators without proper lifecycle management
4. **Test isolation**: No cleanup between tests leads to resource exhaustion

## Solution Overview

1. Start a test server before running performance tests
2. Increase test timeouts to match actual load test duration
3. Add proper process lifecycle management
4. Implement test isolation with cleanup

## Success Criteria

- [ ] Load tests complete without timeout errors
- [ ] Server is properly managed (started/cleanup)
- [ ] No dangling processes after tests
- [ ] Test infrastructure is robust and reliable

## Related Files

- `tests/performance/shared/load-generator.ts` - Load test runner
- `tests/performance/shared/test-server.ts` - Test server management
- `tests/performance/load/concurrent.test.ts` - Concurrent client tests
- `tests/performance/load/rampup.test.ts` - Ramp up tests
- `tests/performance/load/sustained.test.ts` - Sustained load tests

## References

- Load tests use `wrk` or similar benchmarking tool
- Tests run for 15-60 seconds but timeout at 5 seconds

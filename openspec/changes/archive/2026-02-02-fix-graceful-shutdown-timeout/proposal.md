# Fix Graceful Shutdown Timeout

## Problem Statement

The graceful shutdown mechanism in the Goblin gateway is not properly waiting for in-flight requests to complete, causing tests to timeout. The test "should wait for in-flight requests" in `tests/smoke/startup/graceful.test.ts` fails with a timeout after 5000ms.

## Root Cause Analysis

Current issues identified:
1. **Request tracking inconsistency**: The `activeRequests` counter is decremented before response completes
2. **Shutdown timing**: Shutdown may trigger before requests finish
3. **Race condition**: The test starts a request, waits only 10ms, then triggers shutdown - but the request may not be fully registered yet
4. **Bun.serve() behavior**: The `stop()` method without `true` waits for in-flight requests, but there may be issues with how connections are tracked

## Solution Overview

Implement proper graceful shutdown with:
1. **Better request tracking middleware** - Ensure counter increments at request start and decrements after full response
2. **Shutdown signal handling** - Wait for active requests with a promise-based mechanism
3. **Connection draining** - Give in-flight requests time to complete before forcefully closing
4. **Test improvements** - Longer delay or better synchronization for request establishment

## Success Criteria

- [ ] "should wait for in-flight requests" test passes consistently
- [ ] No test timeouts during graceful shutdown scenarios
- [ ] Active requests are properly tracked throughout their lifecycle
- [ ] Gateway waits for requests to complete before shutting down

## Related Files

- `src/gateway/http.ts` - HttpGateway with graceful shutdown logic
- `src/core/gateway.ts` - GoblinGateway stop method
- `src/cli/commands/start.tsx` - Signal handling for shutdown
- `tests/smoke/startup/graceful.test.ts` - Test case

## References

- Test file shows the issue: starts request, waits 10ms, triggers shutdown
- The request to `/status` should complete successfully before shutdown

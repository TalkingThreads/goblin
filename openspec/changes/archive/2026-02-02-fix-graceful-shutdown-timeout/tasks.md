# Implementation Tasks: Graceful Shutdown Timeout Fix

## Section 1: Request Tracking Improvements

- [ ] **Task 1.1:** Add debug logging to request tracking middleware in `src/gateway/http.ts`
  - Add log when request starts with active request count
  - Add log when request completes with active request count

- [ ] **Task 1.2:** Fix request tracking middleware timing
  - Ensure counter increments before any async operations
  - Ensure counter decrements in finally block after response is sent

- [ ] **Task 1.3:** Add shutdown promise mechanism to HttpGateway
  - Add `private shutdownResolver: (() => void) | null = null`
  - Add logic to resolve promise when activeRequests reaches 0

## Section 2: Graceful Shutdown Implementation

- [ ] **Task 2.1:** Update HttpGateway.stop() method
  - Check if there are active requests
  - If active, create promise that resolves when requests complete
  - Add 5-second timeout to prevent indefinite wait
  - Log waiting state and timeout warnings

- [ ] **Task 2.2:** Handle SSE connections during shutdown
  - Ensure SSE connections are properly closed
  - Prevent SSE connections from blocking shutdown indefinitely

- [ ] **Task 2.3:** Test graceful shutdown with various scenarios
  - Test with single active request
  - Test with multiple concurrent requests  
  - Test with SSE connections

## Section 3: Test Improvements

- [ ] **Task 3.1:** Update graceful.test.ts timing
  - Increase delay from 10ms to 100ms for request establishment
  - Add assertions to verify request completed successfully

- [ ] **Task 3.2:** Add test for shutdown timeout
  - Test that long-running requests timeout after 5 seconds
  - Verify warning is logged

- [ ] **Task 3.3:** Run all graceful shutdown tests
  - Run: `bun test tests/smoke/startup/graceful.test.ts`
  - Verify all tests pass

## Section 4: Verification

- [ ] **Task 4.1:** Run smoke test suite
  - Run: `bun test tests/smoke/`
  - Verify no regressions

- [ ] **Task 4.2:** Run lint and typecheck
  - Run: `bun run lint`
  - Run: `bun run typecheck`
  - Fix any issues

## Task Status

**Completed:** 0/13  
**In Progress:** 0  
**Remaining:** 13

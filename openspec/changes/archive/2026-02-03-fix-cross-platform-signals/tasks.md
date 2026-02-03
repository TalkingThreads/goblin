## Implementation Tasks

### Phase 1: Core Signal Handling Utilities

- [ ] **TASK-1**: Add `setupShutdownHandlers()` utility to `src/observability/utils.ts`
  - Implement function that takes a callback and registers appropriate signal handlers based on platform
  - Handle `SIGINT` on all platforms
  - Handle `SIGTERM` only on non-Windows platforms (`process.platform !== "win32"`)
  - Add JSDoc documentation

- [ ] **TASK-2**: Add `gracefulShutdown()` utility to `src/observability/utils.ts`
  - Implement function that takes a `ChildProcess` and optional timeout
  - Send `SIGTERM` on Unix, `SIGINT` on Windows as graceful signal
  - Escalate to `SIGKILL` after timeout (default 5000ms)
  - Return a Promise that resolves when process exits
  - Add JSDoc documentation

- [ ] **TASK-3**: Export new utilities from `src/observability/index.ts`
  - Add exports for `setupShutdownHandlers` and `gracefulShutdown`
  - Ensure they're properly typed for external use

### Phase 2: Update CLI Signal Handling

- [ ] **TASK-4**: Update `src/cli/commands/start.tsx`
  - Replace direct `process.on("SIGINT")` and `process.on("SIGTERM")` calls
  - Use `setupShutdownHandlers()` utility instead
  - Verify graceful shutdown still works correctly on Unix
  - Verify no errors on Windows

### Phase 3: Update Test Utilities

- [ ] **TASK-5**: Update `tests/e2e/shared/cli-tester.ts` cleanup
  - Import `gracefulShutdown` from observability utils
  - Replace direct `this.process.kill("SIGTERM")` calls
  - Use `await gracefulShutdown(this.process)` in cleanup method
  - Ensure proper error handling if process is already dead

- [ ] **TASK-6**: Update `tests/smoke/shared/process-manager.ts`
  - Import `gracefulShutdown` from observability utils
  - Replace direct `process.kill(signal)` calls with `gracefulShutdown()`
  - Update `stop()` method to use graceful shutdown with configured timeout
  - Update `kill()` method to use `SIGKILL` directly (as it's already cross-platform)
  - Update `cleanup()` method to use graceful shutdown

### Phase 4: Add Unit Tests

- [ ] **TASK-7**: Create `tests/unit/observability/utils.test.ts`
  - Test `setupShutdownHandlers()` function
    - Verify it registers `SIGINT` on all platforms (mock process.on)
    - Verify it registers `SIGTERM` only on non-Windows platforms
    - Verify it doesn't register `SIGTERM` on Windows
  - Test `gracefulShutdown()` function
    - Verify it sends `SIGTERM` on Unix platforms
    - Verify it sends `SIGINT` on Windows
    - Verify it escalates to `SIGKILL` after timeout
    - Verify it resolves when process exits
  - Use `test.skipIf()` for platform-specific tests

- [ ] **TASK-8**: Add cross-platform signal tests to existing test suites
  - Add tests in `tests/unit/cli/commands/start.test.ts` (if exists) or create it
  - Verify signal handlers are set up correctly
  - Use platform detection to skip tests appropriately

### Phase 5: Documentation and Verification

- [ ] **TASK-9**: Update code comments and documentation
  - Add inline comments explaining platform-specific behavior in signal handling code
  - Update any relevant README sections about Windows support
  - Ensure JSDoc comments are complete and accurate

- [ ] **TASK-10**: Verify cross-platform compatibility
  - Run tests on Linux/macOS to ensure no regressions
  - Run tests on Windows (manual if no CI available) to verify fixes work
  - Test graceful shutdown manually on both platforms
  - Verify `SIGINT` (Ctrl+C) works correctly on Windows

- [ ] **TASK-11**: Run full test suite
  - Execute `bun test` to run all unit tests
  - Execute `bun run test:e2e` to run E2E tests
  - Execute `bun run test:smoke` to run smoke tests
  - Ensure all tests pass

### Phase 6: Final Review

- [ ] **TASK-12**: Code review and cleanup
  - Review all changes for code style consistency
  - Check for any remaining hardcoded signal strings
  - Verify all new functions have proper error handling
  - Ensure no console.log statements left in code (use logger instead)

- [ ] **TASK-13**: Update AGENTS.md if needed
  - Verify cross-platform best practices section is accurate
  - Add any new patterns discovered during implementation
  - Ensure examples are correct and complete

## Test Plan

### Unit Tests
- `tests/unit/observability/utils.test.ts` - Signal handling utilities
  - Platform detection tests
  - Signal registration tests
  - Graceful shutdown tests
  - Timeout escalation tests

### Integration Tests
- Verify signal handling in `tests/integration/` suite
- Test graceful shutdown doesn't break existing functionality

### E2E Tests
- Run CLI tests on Windows to verify no crashes
- Verify Ctrl+C works on Windows
- Verify shutdown completes cleanly on all platforms

## Success Criteria

1. ✅ `setupShutdownHandlers()` utility works on macOS, Linux, and Windows
2. ✅ `gracefulShutdown()` utility works on all platforms with appropriate signals
3. ✅ CLI no longer crashes on Windows when starting/stopping
4. ✅ Tests pass on all target platforms
5. ✅ No regression on Unix platforms (existing behavior preserved)
6. ✅ Code follows project style guidelines (biome, typescript strict)

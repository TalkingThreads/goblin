## Implementation Tasks

### Phase 1: Refactor Memory Monitor

- [ ] **TASK-1**: Consolidate snapshot creation in `tests/performance/shared/memory-monitor.ts`
  - Create single private `createSnapshot()` method
  - Use it in `monitor()`, `takeSnapshot()`, and `getCurrentUsage()`
  - Remove code duplication

- [ ] **TASK-2**: Add abort controller to MemoryMonitor class
  - Add `private abortController: AbortController | null = null`
  - Initialize in `monitor()` method
  - Call `abortController.abort()` in `stop()` method
  - Check `abortController.signal.aborted` in collection loop

- [ ] **TASK-3**: Improve `stop()` method
  - Set `isMonitoring = false`
  - Call `abortController?.abort()`
  - Clear `intervalId`
  - Set `abortController = null`

- [ ] **TASK-4**: Remove duplicate `getCurrentUsage()` method
  - Update all callers to use `takeSnapshot()` instead
  - Remove the duplicate method entirely

### Phase 2: Improve Load Generator

- [ ] **TASK-5**: Add progress callback to `generateLoad()`
  - Add optional `onProgress?: (result: LoadResult) => void` parameter
  - Call callback after load test completes
  - Allow tests to track progress during long runs

- [ ] **TASK-6**: Improve error messages in load generator
  - Include URL in error messages
  - Include duration and client count in error context
  - Add more specific error types

- [ ] **TASK-7**: Add abort signal support to load generator
  - Add optional `abortSignal?: AbortSignal` parameter
  - Check signal.aborted before starting test
  - Handle abort during test execution

### Phase 3: Improve Test Server

- [ ] **TASK-8**: Add abort signal support to `checkServerHealth()`
  - Add optional `signal?: AbortSignal` parameter
  - Use `AbortSignal.timeout()` for timeout handling
  - Handle abort gracefully

- [ ] **TASK-9**: Improve server URL resolution
  - Add `getServerUrl()` call if serverUrl is set
  - Ensure consistent fallback behavior
  - Add better error messages for missing URL

### Phase 4: Add Progress Reporting

- [ ] **TASK-10**: Add progress logging to long-running tests
  - Log progress every 10% or every interval
  - Include current metrics in progress output
  - Use appropriate log level (debug/info)

- [ ] **TASK-11**: Add progress callback usage in tests
  - Update sustained load tests to use progress callback
  - Log progress during memory monitoring
  - Display progress during load ramp tests

### Phase 5: Verification

- [ ] **TASK-12**: Run all performance tests
  - Verify memory monitor cleanup works correctly
  - Verify load generator progress callbacks work
  - Verify test server health checks work

- [ ] **TASK-13**: Test abort scenarios
  - Test memory monitor stop() during monitoring
  - Test load generator abort during test
  - Verify resources are cleaned up properly

- [ ] **TASK-14**: Update documentation
  - Document new abort controller functionality
  - Document progress callback usage
  - Update method signatures in comments

## Test Plan

### Memory Monitor Tests
- Verify `stop()` properly cleans up resources
- Verify abort signal stops monitoring
- Verify no memory leaks from interval timers

### Load Generator Tests
- Verify progress callback is called
- Verify abort signal stops test
- Verify error messages include context

### Test Server Tests
- Verify health check with abort signal
- Verify URL resolution is consistent
- Verify timeout handling works

## Success Criteria

1. ✅ No code duplication in memory-monitor.ts
2. ✅ Memory monitor properly cleans up on stop/abort
3. ✅ Load generator provides progress callbacks
4. ✅ All tests use proper abort signal handling
5. ✅ No resource leaks in long-running tests
6. ✅ Error messages include sufficient context

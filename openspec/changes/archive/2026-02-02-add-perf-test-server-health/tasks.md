## 1. Create Test Server Module

- [x] 1.1 Create `tests/performance/shared/test-server.ts`
- [x] 1.2 Implement `startTestServer()` function with health check
- [x] 1.3 Implement `stopTestServer()` function with cleanup
- [x] 1.4 Implement `checkServerHealth()` function
- [x] 1.5 Add `getServerUrl()` and `isServerRunning()` helpers

## 2. Update Latency Tests

- [x] 2.1 Add `beforeAll` hook to `tests/performance/latency/target.test.ts`
- [x] 2.2 Add `afterAll` hook to cleanup
- [x] 2.3 Add health check skip logic
- [x] 2.4 Fix `after`/`before` → `afterAll`/`beforeAll` imports

## 3. Update Load Tests

- [x] 3.1 Add `beforeAll` hook to `tests/performance/load/concurrent.test.ts`
- [x] 3.2 Add `beforeAll` hook to `tests/performance/load/rampup.test.ts`
- [x] 3.3 Add `beforeAll` hook to `tests/performance/load/sustained.test.ts`
- [x] 3.4 Add `afterAll` hooks to all load test files
- [x] 3.5 Fix `after`/`before` → `afterAll`/`beforeAll` imports

## 4. Update Throughput Tests

- [x] 4.1 Add `beforeAll` hook to `tests/performance/throughput/capacity.test.ts`
- [x] 4.2 Add `afterAll` hook to cleanup

## 5. Update Memory Tests

- [x] 5.1 Add `beforeAll` hook to `tests/performance/memory/stability.test.ts`
- [x] 5.2 Add `afterAll` hook to cleanup

## 6. Verify Fix

- [x] 6.1 Run `bun test tests/performance/baseline` - 7/7 pass
- [ ] 6.2 Run `bun test tests/performance/latency` - skips without server
- [ ] 6.3 Run `bun test tests/performance/load` - skips without server
- [ ] 6.4 Run `bun test tests/performance/throughput` - skips without server
- [ ] 6.5 Run `bun test tests/performance/memory` - skips without server

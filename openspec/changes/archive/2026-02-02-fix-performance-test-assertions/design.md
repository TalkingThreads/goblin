## Context

Current performance tests use `console.assert()` which doesn't fail tests in Bun:

```typescript
console.assert(result.p50 <= 50, `p50 latency ${result.p50.toFixed(2)}ms should be <= 50ms`);
```

This means tests pass even when the assertion fails, masking real issues during CI runs.

Additionally, some tests have no assertions at all:

```typescript
it("should not leak memory when idle", async () => {
  const beforeIdle = memoryMonitor.takeSnapshot();
  await new Promise((resolve) => setTimeout(resolve, 30000));
  const afterIdle = memoryMonitor.takeSnapshot();
  // No assertion - just logging!
});
```

## Goals / Non-Goals

**Goals:**
- Replace all `console.assert()` with proper Bun `expect()` assertions
- Add missing assertions to tests
- Ensure tests fail when metrics don't meet thresholds
- Improve assertion error messages for debugging

**Non-Goals:**
- Change test logic or metrics being tested
- Modify test durations or thresholds
- Add new test cases

## Decisions

### 1. Replace console.assert with expect

**Decision**: Replace all `console.assert()` with Bun's `expect()` with descriptive messages

```typescript
// Before
console.assert(result.p50 <= 50, `p50 latency ${result.p50.toFixed(2)}ms should be <= 50ms`);

// After
expect(result.p50).toBeLessThanOrEqual(50, `p50 latency ${result.p50.toFixed(2)}ms should be <= 50ms`);
```

### 2. Add Missing Assertions

**Decision**: Add proper assertions to tests that only log results

```typescript
// Memory After Idle Period - add assertion
it("should not leak memory when idle", async () => {
  const beforeIdle = memoryMonitor.takeSnapshot();
  await new Promise((resolve) => setTimeout(resolve, 30000));
  const afterIdle = memoryMonitor.takeSnapshot();
  const growth = ((afterIdle.heapUsed - beforeIdle.heapUsed) / beforeIdle.heapUsed) * 100;
  
  expect(growth).toBeLessThan(5, `Idle memory growth ${growth.toFixed(2)}% should be < 5%`);
});
```

### 3. Use Descriptive Error Messages

**Decision**: Include context in assertion failure messages

```typescript
expect(result.errors).toBe(0, `Expected no errors during rapid connection, got ${result.errors} errors`);
expect(result.latency.average).toBeLessThan(100, 
  `Should stabilize to < 100ms average latency, got ${result.latency.average.toFixed(2)}ms`);
```

### 4. Assertion Patterns by Test Type

**Latency Tests**:
```typescript
expect(result.p50).toBeLessThanOrEqual(50);
expect(result.p95).toBeLessThanOrEqual(100);
expect(result.p99).toBeLessThanOrEqual(200);
```

**Load Tests**:
```typescript
const errorRate = (result.errors / result.requests) * 100;
expect(errorRate).toBeLessThan(1, `Error rate ${errorRate}% should be < 1%`);
expect(result.requests).toBeGreaterThanOrEqual(900);
```

**Memory Tests**:
```typescript
expect(result.growthPercent).toBeLessThan(10);
expect(result.averageGrowthRate).toBeLessThan(1000);
```

## Files to Modify

1. `tests/performance/latency/target.test.ts` - 5 assertions
2. `tests/performance/load/concurrent.test.ts` - 10 assertions
3. `tests/performance/load/rampup.test.ts` - 8 assertions
4. `tests/performance/load/sustained.test.ts` - 5 assertions + 1 missing
5. `tests/performance/memory/stability.test.ts` - 4 assertions
6. `tests/performance/throughput/capacity.test.ts` - 4 assertions
7. `tests/performance/baseline/comparison.test.ts` - 4 assertions
8. `tests/performance/baseline/storage.test.ts` - 3 assertions

## Risks / Trade-offs

**[Risk] Tests that were passing may now fail**
→ Some tests with `console.assert()` may have been failing silently
→ **Mitigation**: This is the intended behavior - we want to catch these failures

**[Risk] Different error message formats**
→ Using `expect()` with custom messages has different format than `console.assert()`
→ **Mitigation**: Standardize on `expect().toBeXXX()` with optional message

## Migration Plan

1. Replace `console.assert()` with `expect()` in latency tests
2. Replace `console.assert()` with `expect()` in load tests
3. Replace `console.assert()` with `expect()` in memory tests
4. Replace `console.assert()` with `expect()` in throughput tests
5. Replace `console.assert()` with `expect()` in baseline tests
6. Add missing assertions to "Memory After Idle Period" test
7. Add missing assertions to "Load Spike Recovery" test
8. Run tests to verify failures are now caught

## Open Questions

1. Should we add custom Jest-like matchers for performance metrics? (e.g., `expect(result).toMeetLatencyThreshold({p50: 50, p95: 100})`)

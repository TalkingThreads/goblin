## Context

Current performance tests have extremely long durations:

| Test | Current Duration | Practicality |
|------|-----------------|--------------|
| 1 Hour Memory Stability | 3,600,000 ms | Not practical for dev |
| 8 Hour Memory Stability | 28,800,000 ms | Never runs in CI |
| 1 Hour Sustained Load | 3,600,000 ms (60 samples × 60s) | Too long for PRs |
| 8 Hour Sustained Load | Huge | Not feasible |

This makes development slow and CI feedback loops long.

## Goals / Non-Goals

**Goals:**
- Reduce test durations to enable quick development cycles
- Maintain test coverage by keeping tests meaningful
- Add test categorization (@quick, @full, @extended)
- Enable test filtering by category

**Non-Goals:**
- Remove any test coverage
- Change test logic or metrics
- Modify test assertions or thresholds

## Decisions

### 1. Test Duration Categories

**Decision**: Categorize tests into three tiers

| Category | Duration | Use Case |
|----------|----------|----------|
| @quick | 1-5 minutes | Development, PR CI |
| @full | 5-15 minutes | Comprehensive validation |
| @extended | 1+ hours | Release benchmarks |

### 2. Duration Reductions

**1 Hour Memory Stability**:
- @quick: 5 minutes (300,000 ms)
- @full: 30 minutes (1,800,000 ms)
- @extended: 1 hour (3,600,000 ms) - original

**8 Hour Memory Stability**:
- @quick: 10 minutes (600,000 ms)
- @full: 1 hour (3,600,000 ms)
- @extended: 8 hours (28,800,000 ms) - original

**1 Hour Sustained Load**:
- @quick: 5 minutes (reduced sample count)
- @full: 30 minutes
- @extended: 1 hour - original

### 3. Test Annotation Format

**Decision**: Use Bun's describe.todo() or comment-based annotations

```typescript
// @quick - Fast validation test
describe("1 Hour Memory Stability @quick", () => {
  it("should show no memory growth over 5 minutes", async () => {
    const memConfig: MemoryConfig = {
      intervalMs: 30000,
      sampleCount: 10, // Reduced from 120
      warmupSamples: 2,
    };
    const result = await memoryMonitor.monitor(300000, memConfig);
    expect(result.growthPercent).toBeLessThan(10);
  });
});

// @full - Comprehensive test
describe("1 Hour Memory Stability @full", () => {
  it("should show no memory growth over 30 minutes", async () => {
    // Full 30-minute test with more samples
  });
});
```

### 4. Test Filtering via grep

**Decision**: Use Bun's `--filter` for test selection

```bash
# Quick tests only
bun test tests/performance --filter "@quick"

# Full tests only  
bun test tests/performance --filter "@full"

# Extended tests (for scheduled runs)
bun test tests/performance --filter "@extended"
```

### 5. Sample Count Reductions

**Memory Test Sample Reductions**:
- 1 hour @quick: 120 samples → 10 samples (every 30s)
- 8 hour @quick: 480 samples → 20 samples (every 30s)

**Load Test Sample Reductions**:
- Sustained load @quick: 60 samples → 10 samples

## Files to Modify

1. `tests/performance/memory/stability.test.ts` - Reduce durations, add annotations
2. `tests/performance/load/sustained.test.ts` - Reduce durations, add annotations

## Risks / Trade-offs

**[Risk] Reduced test sensitivity**
→ Shorter tests may not catch slow memory leaks
→ **Mitigation**: @full tests still catch issues. Memory leaks typically show within 5-10 minutes.

**[Risk] Test configuration complexity**
→ Multiple versions of each test
→ **Mitigation**: Use helper functions to reduce duplication

## Migration Plan

1. Add duration helper functions to test-config.ts
2. Create @quick version of 1 Hour Memory Stability test (5 minutes)
3. Create @quick version of 8 Hour Memory Stability test (10 minutes)
4. Create @quick version of Sustained Load test (5 minutes)
5. Add test filtering via --filter
6. Update npm scripts with quick options

## Open Questions

1. Should we create separate test files for @quick vs @full tests?
2. Should we add a --quick CLI flag to override all durations?

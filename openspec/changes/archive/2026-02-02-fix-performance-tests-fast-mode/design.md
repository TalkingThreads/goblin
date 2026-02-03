## Context

Current performance test configuration in `tests/performance/shared/test-config.ts` uses hardcoded values:

```typescript
export const defaultPerformanceConfig: PerformanceTestConfig = {
  gatewayUrl: process.env.PERFORMANCE_GATEWAY_URL || "http://localhost:3000",
  testDuration: 60000,
  warmupDuration: 10000,
  concurrentClients: 100,
  timeout: 300000,
  iterations: 3,
  thresholds: {
    latencyP50: 50,
    latencyP95: 100,
    latencyP99: 200,
    maxErrorRate: 0.01,
    maxMemoryGrowthMb: 100,
    minThroughputRps: 1000,
  },
};
```

This means:
- Tests always run at full duration (no fast mode for development)
- Thresholds cannot be adjusted per-environment
- Long test times slow down development and CI

## Goals / Non-Goals

**Goals:**
- Add fast mode via environment variable for quick test runs
- Make thresholds configurable via environment variables
- Add npm scripts for quick validation
- Maintain full compatibility with existing tests

**Non-Goals:**
- Change test logic or assertions
- Modify test file structure
- Add new dependencies

## Decisions

### 1. Fast Mode Implementation

**Decision**: Add `PERFORMANCE_TEST_FAST_MODE` environment variable that reduces all durations by 10x

```typescript
export function loadConfig(): PerformanceTestConfig {
  const isFastMode = process.env.PERFORMANCE_TEST_FAST_MODE === "true";
  const durationMultiplier = isFastMode ? 0.1 : 1;

  return {
    gatewayUrl: process.env.PERFORMANCE_GATEWAY_URL || defaultPerformanceConfig.gatewayUrl,
    testDuration: parseInt(process.env.PERFORMANCE_TEST_DURATION || String(60000 * durationMultiplier), 10),
    warmupDuration: parseInt(process.env.PERFORMANCE_WARMUP_DURATION || String(10000 * durationMultiplier), 10),
    concurrentClients: parseInt(process.env.PERFORMANCE_CONCURRENT_CLIENTS || "100", 10),
    timeout: parseInt(process.env.PERFORMANCE_TIMEOUT || "300000", 10),
    iterations: parseInt(process.env.PERFORMANCE_ITERATIONS || "3", 10),
    thresholds: {
      latencyP50: parseInt(process.env.THRESHOLD_LATENCY_P50 || "50", 10),
      latencyP95: parseInt(process.env.THRESHOLD_LATENCY_P95 || "100", 10),
      latencyP99: parseInt(process.env.THRESHOLD_LATENCY_P99 || "200", 10),
      maxErrorRate: parseFloat(process.env.THRESHOLD_MAX_ERROR_RATE || "0.01"),
      maxMemoryGrowthMb: parseInt(process.env.THRESHOLD_MAX_MEMORY_GROWTH || "100", 10),
      minThroughputRps: parseInt(process.env.THRESHOLD_MIN_THROUGHPUT || "1000", 10),
    },
    isFastMode,
  };
}
```

### 2. Threshold Environment Variables

**Decision**: Add comprehensive threshold overrides via environment variables

```bash
# Latency thresholds (ms)
THRESHOLD_LATENCY_P50=50
THRESHOLD_LATENCY_P95=100
THRESHOLD_LATENCY_P99=200

# Error rate threshold (0-1)
THRESHOLD_MAX_ERROR_RATE=0.01

# Memory thresholds (MB)
THRESHOLD_MAX_MEMORY_GROWTH=100

# Throughput threshold (RPS)
THRESHOLD_MIN_THROUGHPUT=1000
```

### 3. Fast Mode Helper Function

**Decision**: Add `isFastMode()` helper function for test files

```typescript
export function isFastMode(): boolean {
  return process.env.PERFORMANCE_TEST_FAST_MODE === "true";
}

export function getTestDuration(baseDuration: number): number {
  if (isFastMode()) {
    return Math.max(5000, Math.floor(baseDuration * 0.1)); // Min 5 seconds
  }
  return baseDuration;
}
```

### 4. npm Scripts

**Decision**: Add quick test scripts to package.json

```json
{
  "perf:quick": "PERFORMANCE_TEST_FAST_MODE=true bun test tests/performance/latency --reporter=dot",
  "perf:quick:load": "PERFORMANCE_TEST_FAST_MODE=true bun test tests/performance/load --reporter=dot",
  "perf:quick:all": "PERFORMANCE_TEST_FAST_MODE=true bun test tests/performance --reporter=dot"
}
```

## Risks / Trade-offs

**[Risk] Tests may behave differently in fast mode**
→ Fast mode uses shorter durations which may not catch all issues
→ **Mitigation**: Fast mode is for development/CI quick checks only. Full benchmarks still run on main/release branches.

**[Risk] Threshold overrides may mask real issues**
→ Relaxed thresholds could allow passing tests that should fail
→ **Mitigation**: Default thresholds remain unchanged. Env vars are opt-in for specific scenarios.

## Migration Plan

1. Update `test-config.ts` with fast mode and threshold overrides
2. Add helper functions for duration calculation
3. Add npm scripts to package.json
4. Update test files to use helper functions where needed

## Open Questions

1. Should we add a `--fast` CLI flag to `bun run perf` script? (Consider for future)
2. Should fast mode affect memory tests differently? (Memory tests may need different multipliers)

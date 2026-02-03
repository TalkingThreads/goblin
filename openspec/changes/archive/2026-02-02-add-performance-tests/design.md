## Context

Goblin needs comprehensive performance tests to ensure it can handle production workloads reliably. Current state: No systematic performance testing exists. Performance regressions can only be detected through user reports or manual testing. Constraints: Tests must be reproducible, fast enough for CI, and provide meaningful metrics. Performance tests should establish baselines and detect regressions.

## Goals / Non-Goals

**Goals:**
- Validate gateway handles 100+ concurrent tool calls
- Detect memory leaks during extended operations (1+ hour)
- Verify <50ms routing overhead latency target
- Determine maximum throughput capacity
- Establish performance baselines for regression detection

**Non-Goals:**
- Load testing beyond saturation point (stress testing)
- Performance optimization (tests measure, don't optimize)
- Real-user load simulation (synthetic workloads only)
- Performance in production environments

## Decisions

### Decision 1: Load Testing Approach

**Choice:** Synthetic concurrent load with autocannon/oha

**Rationale:**
- Reproducible synthetic workloads
- Easy to configure concurrency levels
- Built-in latency percentiles
- CI-friendly execution

**Implementation:**
```typescript
// tests/performance/shared/load-generator.ts
class LoadGenerator {
  async generateLoad(config: LoadConfig): Promise<LoadResult> {
    const results = await autocannon({
      url: config.url,
      connections: config.concurrentClients,
      duration: config.duration,
      pipelining: config.pipelining,
    });

    return {
      requestsPerSecond: results.requests,
      latency: {
        p50: results.latency.p50,
        p95: results.latency.p95,
        p99: results.latency.p99,
      },
      errors: results.errors,
      timeouts: results.timeouts,
    };
  }
}

interface LoadConfig {
  url: string;
  concurrentClients: number;
  duration: number;
  pipelining: number;
}
```

### Decision 2: Memory Leak Detection

**Choice:** Periodic heap snapshots with comparison

**Rationale:**
- Detects gradual memory growth
- Identifies leaking objects
- Comparable between runs
- Minimal overhead during test

**Implementation:**
```typescript
// tests/performance/shared/memory-monitor.ts
class MemoryMonitor {
  private snapshots: HeapSnapshot[] = [];

  async monitor(duration: number): Promise<MemoryResult> {
    const interval = setInterval(() => {
      const snapshot = this.takeSnapshot();
      this.snapshots.push(snapshot);
      this.checkForLeaks(snapshot);
    }, 10000); // Every 10 seconds

    await delay(duration);
    clearInterval(interval);

    return this.analyzeSnapshots();
  }

  private takeSnapshot(): HeapSnapshot {
    const usage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
    };
  }
}

interface MemoryResult {
  initialUsage: number;
  finalUsage: number;
  peakUsage: number;
  growthRate: number;
  leakedObjects: LeakedObject[];
}
```

### Decision 3: Latency Measurement

**Choice:** End-to-end latency with low-overhead instrumentation

**Rationale:**
- Measures real user-perceived latency
- Minimal test overhead
- Accurate percentile calculations
- Correlates with production metrics

**Implementation:**
```typescript
// tests/performance/shared/latency-measurer.ts
class LatencyMeasurer {
  async measureLatency(requests: number): Promise<LatencyResult> {
    const latencies: number[] = [];

    for (let i = 0; i < requests; i++) {
      const start = performance.now();
      await this.makeRequest();
      const latency = performance.now() - start;
      latencies.push(latency);
    }

    latencies.sort((a, b) => a - b);

    return {
      p50: this.percentile(latencies, 50),
      p95: this.percentile(latencies, 95),
      p99: this.percentile(latencies, 99),
      mean: this.mean(latencies),
      min: this.min(latencies),
      max: this.max(latencies),
      samples: requests,
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

### Decision 4: Throughput Testing

**Choice:** Ramp-up load until saturation

**Rationale:**
- Finds actual capacity limit
- Identifies saturation point
- Measures degradation
- Actionable capacity planning data

**Implementation:**
```typescript
// tests/performance/shared/throughput-tester.ts
class ThroughputTester {
  async findSaturationPoint(config: ThroughputConfig): Promise<ThroughputResult> {
    let currentRps = 0;
    let increment = config.initialIncrement;
    let lastStable = 0;

    while (currentRps < config.maxRps) {
      const test = await this.runTest({
        targetRps: currentRps + increment,
        duration: config.testDuration,
      });

      if (test.errorRate < config.maxErrorRate) {
        lastStable = test.actualRps;
        currentRps += increment;
      } else {
        // Reached saturation
        break;
      }
    }

    return {
      maxStableRps: lastStable,
      saturationPoint: currentRps,
      errorRateAtSaturation: config.maxErrorRate,
    };
  }
}
```

### Decision 5: Baseline Management

**Choice:** JSON baseline files with comparison

**Rationale:**
- Version controllable baselines
- Easy comparison between runs
- Supports multiple metrics
- CI integration for regression detection

**Implementation:**
```typescript
// tests/performance/shared/baseline-manager.ts
class BaselineManager {
  private baselines: Map<string, PerformanceBaseline> = new Map();

  async saveBaseline(name: string, metrics: PerformanceMetrics): Promise<void> {
    const baseline: PerformanceBaseline = {
      name,
      timestamp: Date.now(),
      metrics,
      environment: this.getEnvironmentInfo(),
    };

    this.baselines.set(name, baseline);
    await this.writeToFile(`benchmarks/${name}.json`, baseline);
  }

  async compareWithBaseline(name: string, current: PerformanceMetrics): Promise<ComparisonResult> {
    const baseline = this.baselines.get(name);
    if (!baseline) {
      throw new Error(`Baseline ${name} not found`);
    }

    return {
      baseline,
      current,
      regression: this.detectRegression(baseline.metrics, current),
      changes: this.calculateChanges(baseline.metrics, current),
    };
  }

  private detectRegression(baseline: PerformanceMetrics, current: PerformanceMetrics): boolean {
    // Check if any metric has degraded beyond threshold
    return (
      current.latency.p95 > baseline.latency.p95 * 1.1 ||
      current.memory.growthRate > baseline.memory.growthRate * 1.2 ||
      current.throughput.maxRps < baseline.throughput.maxRps * 0.9
    );
  }
}
```

## Risks / Trade-offs

### [Risk] Test flakiness due to system load
**→ Mitigation:** Run tests in isolated environment, use averages over multiple runs, document system requirements

### [Risk] Performance varies between runs
**→ Mitigation:** Use statistical analysis, run multiple iterations, report confidence intervals

### [Risk] Memory profiling overhead
**→ Mitigation:** Use sampling profiler, separate memory tests from other tests, minimal impact on latency tests

### [Risk] Baselines become outdated
**→ Mitigation:** Regular baseline updates, version control for baselines, clear documentation on updating

## Migration Plan

1. Create performance test directory structure (load, memory, latency, throughput, shared)
2. Create shared performance utilities (load generator, memory monitor, latency measurer, throughput tester)
3. Implement baseline manager for tracking metrics
4. Write load tests (concurrent clients, ramp-up, sustained load)
5. Write memory leak detection tests (extended operation, heap snapshots, leak detection)
6. Write latency tests (p50/p95/p99 measurements, overhead verification)
7. Write throughput tests (capacity determination, saturation point)
8. Run performance tests and establish baselines
9. Add performance tests to CI pipeline (separate job, scheduled run)
10. Set up performance dashboard for visualization

Rollback: Remove performance test directories and update package.json

## Open Questions

1. Should performance tests run on every PR? (No, too slow - run on main branch and nightly)
2. What hardware should tests run on? (Document minimum requirements, consider CI hardware)
3. How long should memory tests run? (1 hour ideal, 15 minutes minimum for detectable leaks)
4. Should we use external monitoring? (Prometheus metrics for production, internal for tests)

/**
 * Performance Test Configuration
 *
 * Shared configuration for all performance tests.
 */

export interface PerformanceTestConfig {
  gatewayUrl: string;
  testDuration: number;
  warmupDuration: number;
  concurrentClients: number;
  timeout: number;
  iterations: number;
  thresholds: PerformanceThresholds;
  isFastMode: boolean;
}

export interface PerformanceThresholds {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  maxErrorRate: number;
  maxMemoryGrowthMb: number;
  minThroughputRps: number;
}

export interface LoadTestConfig extends PerformanceTestConfig {
  rampUpEnabled: boolean;
  rampUpSteps: number;
  rampUpInterval: number;
  sustainedLoadDuration: number;
}

export interface MemoryTestConfig extends PerformanceTestConfig {
  heapSnapshotInterval: number;
  leakDetectionThreshold: number;
  maxHeapSizeMb: number;
}

export interface LatencyTestConfig extends PerformanceTestConfig {
  sampleSize: number;
  confidenceLevel: number;
  percentileTargets: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface ThroughputTestConfig extends PerformanceTestConfig {
  initialRps: number;
  maxRps: number;
  incrementRps: number;
  saturationThreshold: number;
}

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
  isFastMode: false,
};

export const defaultLoadConfig: LoadTestConfig = {
  ...defaultPerformanceConfig,
  rampUpEnabled: true,
  rampUpSteps: 5,
  rampUpInterval: 10000,
  sustainedLoadDuration: 3600000,
};

export const defaultMemoryConfig: MemoryTestConfig = {
  ...defaultPerformanceConfig,
  testDuration: 3600000,
  heapSnapshotInterval: 30000,
  leakDetectionThreshold: 0.05,
  maxHeapSizeMb: 512,
};

export const defaultLatencyConfig: LatencyTestConfig = {
  ...defaultPerformanceConfig,
  testDuration: 30000,
  sampleSize: 100,
  confidenceLevel: 0.95,
  percentileTargets: {
    p50: 50,
    p95: 100,
    p99: 200,
  },
};

export const defaultThroughputConfig: ThroughputTestConfig = {
  ...defaultPerformanceConfig,
  initialRps: 100,
  maxRps: 10000,
  incrementRps: 500,
  saturationThreshold: 0.05,
};

export function loadConfig(): PerformanceTestConfig {
  const isFastMode = process.env.PERFORMANCE_TEST_FAST_MODE === "true";
  const durationMultiplier = isFastMode ? 0.1 : 1;

  return {
    gatewayUrl: process.env.PERFORMANCE_GATEWAY_URL || defaultPerformanceConfig.gatewayUrl,
    testDuration: parseInt(
      process.env.PERFORMANCE_TEST_DURATION || String(Math.floor(60000 * durationMultiplier)),
      10,
    ),
    warmupDuration: parseInt(
      process.env.PERFORMANCE_WARMUP_DURATION || String(Math.floor(10000 * durationMultiplier)),
      10,
    ),
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

export function isFastMode(): boolean {
  return process.env.PERFORMANCE_TEST_FAST_MODE === "true";
}

export function getTestDuration(baseDurationMs: number): number {
  if (isFastMode()) {
    return Math.max(5000, Math.floor(baseDurationMs * 0.1));
  }
  return baseDurationMs;
}

export function getSampleCount(baseCount: number): number {
  if (isFastMode()) {
    return Math.max(5, Math.floor(baseCount * 0.1));
  }
  return baseCount;
}

/**
 * Performance Test Configuration
 *
 * Environment Variables:
 * - PERFORMANCE_TEST_FAST_MODE=true     : Reduce test durations by 10x for quick validation
 * - PERFORMANCE_TEST_DURATION           : Base test duration in ms (default: 60000)
 * - PERFORMANCE_WARMUP_DURATION         : Warmup duration in ms (default: 10000)
 * - PERFORMANCE_CONCURRENT_CLIENTS      : Number of concurrent clients (default: 100)
 * - PERFORMANCE_TIMEOUT                 : Test timeout in ms (default: 300000)
 * - PERFORMANCE_ITERATIONS              : Number of test iterations (default: 3)
 *
 * Threshold Overrides:
 * - THRESHOLD_LATENCY_P50               : p50 latency threshold in ms (default: 50)
 * - THRESHOLD_LATENCY_P95               : p95 latency threshold in ms (default: 100)
 * - THRESHOLD_LATENCY_P99               : p99 latency threshold in ms (default: 200)
 * - THRESHOLD_MAX_ERROR_RATE            : Max error rate 0-1 (default: 0.01)
 * - THRESHOLD_MAX_MEMORY_GROWTH         : Max memory growth in MB (default: 100)
 * - THRESHOLD_MIN_THROUGHPUT            : Min throughput in RPS (default: 1000)
 *
 * Quick Test Scripts:
 * - bun run perf:quick       : Run latency tests in fast mode
 * - bun run perf:quick:load  : Run load tests in fast mode
 * - bun run perf:quick:memory: Run memory tests in fast mode
 * - bun run perf:quick:all   : Run all performance tests in fast mode
 */

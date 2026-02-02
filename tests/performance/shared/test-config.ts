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
  return {
    gatewayUrl: process.env.PERFORMANCE_GATEWAY_URL || defaultPerformanceConfig.gatewayUrl,
    testDuration: parseInt(process.env.PERFORMANCE_TEST_DURATION || "60000", 10),
    warmupDuration: parseInt(process.env.PERFORMANCE_WARMUP_DURATION || "10000", 10),
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
  };
}

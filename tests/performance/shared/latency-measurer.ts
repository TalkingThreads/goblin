/**
 * Latency Measurer for Performance Tests
 *
 * Measures request latency with high precision timing.
 */

export interface LatencyResult {
  samples: number;
  min: number;
  max: number;
  average: number;
  median: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
  standardDeviation: number;
  histogram: HistogramBucket[];
}

export interface HistogramBucket {
  range: [number, number];
  count: number;
  percent: number;
}

export interface LatencyConfig {
  warmupRequests?: number;
  samples?: number;
  confidence?: number;
  percentileTarget?: number;
}

export class LatencyMeasurer {
  private warmupRequests: number = 10;
  private defaultSamples: number = 100;
  private histogramBuckets: number[] = [
    10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 2000, 5000,
  ];

  async measureLatency(
    requestFn: () => Promise<unknown>,
    config?: LatencyConfig,
  ): Promise<LatencyResult> {
    const samples = config?.samples || this.defaultSamples;
    const warmup = config?.warmupRequests || this.warmupRequests;

    const latencies: number[] = [];

    for (let i = 0; i < warmup; i++) {
      await requestFn();
    }

    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      await requestFn();
      const latency = performance.now() - start;
      latencies.push(latency);
    }

    return this.calculateLatencyStats(latencies);
  }

  async measureBurstLatency(
    requestFn: () => Promise<unknown>,
    burstSize: number,
    config?: LatencyConfig,
  ): Promise<LatencyResult> {
    const samples = config?.samples || this.defaultSamples;
    const warmup = config?.warmupRequests || this.warmupRequests;

    for (let i = 0; i < warmup; i++) {
      await requestFn();
    }

    const latencies: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      await Promise.all(
        Array(burstSize)
          .fill(null)
          .map(() => requestFn()),
      );
      const latency = performance.now() - start;
      latencies.push(latency);
    }

    return this.calculateLatencyStats(latencies);
  }

  async measureConcurrentLatency(
    requestFn: () => Promise<unknown>,
    concurrency: number,
    totalRequests: number,
    config?: LatencyConfig,
  ): Promise<LatencyResult> {
    const warmup = config?.warmupRequests || this.warmupRequests;

    for (let i = 0; i < warmup; i++) {
      await requestFn();
    }

    const latencies: number[] = [];
    const batchSize = Math.min(concurrency, totalRequests);

    for (let i = 0; i < totalRequests; i += batchSize) {
      const batch = Array(Math.min(batchSize, totalRequests - i))
        .fill(null)
        .map(() => requestFn());

      const start = performance.now();
      await Promise.all(batch);
      const latency = performance.now() - start;

      for (let j = 0; j < batch.length; j++) {
        latencies.push(latency / batch.length);
      }
    }

    return this.calculateLatencyStats(latencies);
  }

  private calculateLatencyStats(latencies: number[]): LatencyResult {
    if (latencies.length === 0) {
      return this.createEmptyResult();
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = latencies.reduce((a, b) => a + b, 0);
    const average = sum / latencies.length;
    const median = this.percentile(sorted, 50);
    const p50 = this.percentile(sorted, 50);
    const p75 = this.percentile(sorted, 75);
    const p90 = this.percentile(sorted, 90);
    const p95 = this.percentile(sorted, 95);
    const p99 = this.percentile(sorted, 99);
    const p999 = this.percentile(sorted, 99.9);

    const squaredDiffs = latencies.map((v) => (v - average) ** 2);
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / latencies.length;
    const standardDeviation = Math.sqrt(variance);

    const histogram = this.createHistogram(sorted);

    return {
      samples: latencies.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average,
      median,
      p50,
      p75,
      p90,
      p95,
      p99,
      p999,
      standardDeviation,
      histogram,
    };
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private createHistogram(sorted: number[]): HistogramBucket[] {
    const buckets: HistogramBucket[] = [];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    let currentMin = 0;
    const step = (max - min) / 10 || 10;

    for (let i = 0; i <= 10; i++) {
      const bucketMax = currentMin + (i === 0 ? this.histogramBuckets[0] : step);
      const count = sorted.filter((v) => v >= currentMin && v < bucketMax).length;

      buckets.push({
        range: [currentMin, bucketMax],
        count,
        percent: (count / sorted.length) * 100,
      });

      currentMin = bucketMax;
    }

    return buckets;
  }

  private createEmptyResult(): LatencyResult {
    return {
      samples: 0,
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      p999: 0,
      standardDeviation: 0,
      histogram: [],
    };
  }

  meetsTarget(
    result: LatencyResult,
    targetP50: number,
    targetP95: number,
    targetP99: number,
  ): boolean {
    return result.p50 <= targetP50 && result.p95 <= targetP95 && result.p99 <= targetP99;
  }

  compareResults(
    baseline: LatencyResult,
    current: LatencyResult,
  ): {
    p50Change: number;
    p95Change: number;
    p99Change: number;
    improved: boolean;
    regressed: boolean;
  } {
    const calcChange = (baseline: number, current: number) =>
      baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

    const p50Change = calcChange(baseline.p50, current.p50);
    const p95Change = calcChange(baseline.p95, current.p95);
    const p99Change = calcChange(baseline.p99, current.p99);

    const regressed = p50Change > 10 || p95Change > 15 || p99Change > 20;
    const improved = p50Change < -10 || p95Change < -15 || p99Change < -20;

    return {
      p50Change,
      p95Change,
      p99Change,
      improved,
      regressed,
    };
  }
}

export const latencyMeasurer = new LatencyMeasurer();

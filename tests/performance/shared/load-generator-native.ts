/**
 * Load Generator for Performance Tests - Bun Native Implementation
 *
 * Uses Bun's native fetch with parallel workers for load testing.
 * No external dependencies required.
 */

export interface LoadConfig {
  url: string;
  concurrentClients: number;
  duration: number;
  pipelining?: number;
  warmupRequests?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  onProgress?: (result: LoadResult, iteration: number) => void;
  signal?: AbortSignal;
}

export interface LoadResult {
  requests: number;
  requestsPerSecond: number;
  latency: {
    min: number;
    max: number;
    average: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: {
    bytes: number;
    bytesPerSecond: number;
  };
  errors: number;
  timeouts: number;
  non2xx: number;
  duration: number;
}

export interface RampLoadConfig extends LoadConfig {
  initialClients: number;
  finalClients: number;
  stepClients: number;
  stepDuration: number;
}

export interface RampResult {
  steps: Array<{
    clients: number;
    rps: number;
    latencyP50: number;
    latencyP95: number;
    errors: number;
  }>;
  totalDuration: number;
}

function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

export class LoadGenerator {
  async generateLoad(config: LoadConfig): Promise<LoadResult> {
    const { url, concurrentClients, duration, method = "GET", headers = {}, body, signal } = config;

    const startTime = Date.now();
    const endTime = startTime + duration;
    const requests: { latency: number; status: number; bytes: number }[] = [];
    let requestCount = 0;
    let isCancelled = false;

    const worker = async (): Promise<void> => {
      while (Date.now() < endTime && !isCancelled && !signal?.aborted) {
        const reqStart = Date.now();
        try {
          const response = await fetch(url, {
            method,
            headers: { ...headers, "Content-Type": "application/json" },
            body,
          });

          const latency = Date.now() - reqStart;
          const bytes = (await response.arrayBuffer()).byteLength;

          requests.push({
            latency,
            status: response.status,
            bytes,
          });
          requestCount++;
        } catch {
          requests.push({ latency: Date.now() - reqStart, status: 0, bytes: 0 });
        }
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrentClients; i++) {
      workers.push(worker());
    }

    try {
      await Promise.all(workers);
    } finally {
      isCancelled = true;
      await new Promise((r) => setTimeout(r, 100));
    }

    const actualDuration = Date.now() - startTime;
    const latencies = requests.map((r) => r.latency);
    const errorRequests = requests.filter((r) => r.status === 0 || r.status >= 400);

    return {
      requests: requestCount,
      requestsPerSecond: requestCount / (actualDuration / 1000),
      latency: {
        min: Math.min(...latencies) || 0,
        max: Math.max(...latencies) || 0,
        average: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
        p50: calculatePercentile(latencies, 50),
        p75: calculatePercentile(latencies, 75),
        p90: calculatePercentile(latencies, 90),
        p95: calculatePercentile(latencies, 95),
        p99: calculatePercentile(latencies, 99),
      },
      throughput: {
        bytes: requests.reduce((sum, r) => sum + r.bytes, 0),
        bytesPerSecond: requests.reduce((sum, r) => sum + r.bytes, 0) / (actualDuration / 1000),
      },
      errors: errorRequests.length,
      timeouts: 0,
      non2xx: requests.filter((r) => r.status >= 400).length,
      duration: actualDuration,
    };
  }

  async generateRampLoad(config: RampLoadConfig): Promise<RampResult> {
    const steps: RampResult["steps"] = [];
    let currentClients = config.initialClients;

    while (currentClients <= config.finalClients) {
      const result = await this.generateLoad({
        ...config,
        concurrentClients: currentClients,
        duration: config.stepDuration,
      });

      steps.push({
        clients: currentClients,
        rps: result.requestsPerSecond,
        latencyP50: result.latency.p50,
        latencyP95: result.latency.p95,
        errors: result.errors,
      });

      currentClients += config.stepClients;
      await new Promise((r) => setTimeout(r, 100));
    }

    return {
      steps,
      totalDuration: steps.length * config.stepDuration,
    };
  }

  async generateSustainedLoad(
    config: LoadConfig,
    intervalMs: number = 60000,
  ): Promise<LoadResult[]> {
    const results: LoadResult[] = [];
    const startTime = Date.now();
    const endTime = startTime + config.duration;
    let iteration = 0;
    const onProgress = config.onProgress;

    while (Date.now() < endTime) {
      if (config.signal?.aborted) {
        break;
      }

      const result = await this.generateLoad(config);
      results.push(result);
      iteration++;

      if (onProgress) {
        onProgress(result, iteration);
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, intervalMs - (elapsed % intervalMs));

      if (remaining > 0 && Date.now() + remaining < endTime) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      await new Promise((r) => setTimeout(r, 100));
    }

    return results;
  }
}

export const loadGenerator = new LoadGenerator();

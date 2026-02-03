/**
 * Load Generator for Performance Tests
 *
 * Generates synthetic load for gateway testing using autocannon programmatically.
 */

import autocannon from "autocannon";

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

export class LoadGenerator {
  private warmupRequests: number = 100;
  private defaultPipelining: number = 1;

  async generateLoad(config: LoadConfig): Promise<LoadResult> {
    const {
      url,
      concurrentClients,
      duration,
      pipelining,
      warmupRequests,
      method,
      headers,
      body,
      signal,
    } = config;

    const opts = {
      url,
      connections: concurrentClients,
      duration: Math.floor(duration / 1000),
      pipelining: pipelining || this.defaultPipelining,
      warmup: warmupRequests || this.warmupRequests,
      method: method || "GET",
      headers: headers || {},
      body: body,
      renderResultsTable: false,
      renderProgressBar: false,
      json: false,
    };

    return new Promise((resolve, reject) => {
      let resolved = false;
      const abortHandler = () => {
        if (!resolved) {
          resolved = true;
          reject(new Error("Load test aborted"));
        }
      };

      if (signal?.aborted) {
        abortHandler();
        return;
      }

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Load test timed out after ${duration}ms`));
        }
      }, duration + 30000);

      const hasSignal = !!signal;
      if (hasSignal) {
        signal.addEventListener("abort", abortHandler);
      }

      try {
        const tracker = autocannon(opts);

        tracker.on("error", (error: Error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (hasSignal && signal) {
              signal.removeEventListener("abort", abortHandler);
            }
            reject(error);
          }
        });

        tracker.on("done", (result) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          if (hasSignal && signal) {
            signal.removeEventListener("abort", abortHandler);
          }

          const loadResult = this.convertAutocannonResult(result);
          resolve(loadResult);
        });
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          if (hasSignal && signal) {
            signal.removeEventListener("abort", abortHandler);
          }
          reject(error);
        }
      }
    });
  }

  private convertAutocannonResult(result: {
    latency: Record<number, number> & { min: number; max: number; average: number };
    requests: { total: number; average: number };
    throughput: { total: number; average: number };
    errors: string[];
    timeouts: number;
    non2xx: number;
    duration: number;
  }): LoadResult {
    const latency = result.latency;
    const requests = result.requests;

    const errorsArray = result.errors;
    const totalErrors =
      errorsArray && typeof errorsArray.length === "number" ? errorsArray.length : 0;
    const timeouts = typeof result.timeouts === "number" ? result.timeouts : 0;
    const non2xx = typeof result.non2xx === "number" ? result.non2xx : 0;

    const errors =
      Number.isNaN(totalErrors) || Number.isNaN(timeouts) || Number.isNaN(non2xx)
        ? 0
        : totalErrors + timeouts + non2xx;

    return {
      requests: requests.total,
      requestsPerSecond: requests.average,
      latency: {
        min: latency.min || 0,
        max: latency.max || 0,
        average: latency.average || 0,
        p50: latency[50] || 0,
        p75: latency[75] || 0,
        p90: latency[90] || 0,
        p95: latency[95] || 0,
        p99: latency[99] || 0,
      },
      throughput: {
        bytes: result.throughput.total,
        bytesPerSecond: result.throughput.average,
      },
      errors: errors,
      timeouts,
      non2xx,
      duration: result.duration * 1000,
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
    }

    return results;
  }
}

export const loadGenerator = new LoadGenerator();

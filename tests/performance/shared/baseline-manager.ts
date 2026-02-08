/**
 * Baseline Manager for Performance Tests
 *
 * Manages performance baselines for regression detection and comparison.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface PerformanceMetrics {
  latency: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  throughput: {
    requestsPerSecond: number;
    bytesPerSecond: number;
  };
  memory: {
    averageMb: number;
    peakMb: number;
    growthRate: number;
  };
}

export interface PerformanceBaseline {
  version: string;
  createdAt: string;
  environment: EnvironmentInfo;
  metrics: PerformanceMetrics;
  configuration: TestConfiguration;
  metadata?: Record<string, unknown>;
}

export interface EnvironmentInfo {
  os: string;
  cpu: string;
  memory: string;
  nodeVersion: string;
  bunVersion?: string;
}

export interface TestConfiguration {
  testType: string;
  duration: number;
  concurrency?: number;
  url?: string;
}

export interface ComparisonResult {
  baseline: PerformanceBaseline;
  current: PerformanceMetrics;
  regression: boolean;
  changes: {
    metric: string;
    baseline: number;
    current: number;
    change: number;
    changePercent: number;
    significant: boolean;
  }[];
  severity: "none" | "warning" | "error" | "critical";
}

export interface BaselineConfig {
  storagePath: string;
  thresholds: {
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    throughput: number;
    memoryGrowth: number;
  };
}

export class BaselineManager {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private historicalData: Array<{
    timestamp: number;
    commitHash: string;
    branch: string;
    metrics: PerformanceMetrics;
    baselineId: string;
  }> = [];

  constructor(private config: BaselineConfig) {}

  async saveBaseline(
    name: string,
    metrics: PerformanceMetrics,
    configuration: TestConfiguration,
    metadata?: Record<string, unknown>,
  ): Promise<PerformanceBaseline> {
    const baseline: PerformanceBaseline = {
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      metrics,
      configuration,
      metadata,
    };

    const filePath = this.getBaselinePath(name);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(baseline, null, 2));

    this.baselines.set(name, baseline);

    return baseline;
  }

  async loadBaseline(name: string): Promise<PerformanceBaseline | null> {
    if (this.baselines.has(name)) {
      return this.baselines.get(name)!;
    }

    const filePath = this.getBaselinePath(name);
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = await readFile(filePath, "utf-8");
      const baseline = JSON.parse(content) as PerformanceBaseline;
      this.baselines.set(name, baseline);
      return baseline;
    } catch {
      return null;
    }
  }

  async compareWithBaseline(
    name: string,
    current: PerformanceMetrics,
    _commitHash?: string,
  ): Promise<ComparisonResult> {
    const baseline = await this.loadBaseline(name);

    if (!baseline) {
      return {
        baseline: {
          version: "1.0.0",
          createdAt: new Date().toISOString(),
          environment: this.getEnvironmentInfo(),
          metrics: current,
          configuration: { testType: "unknown" },
        },
        current,
        regression: false,
        changes: [],
        severity: "none",
      };
    }

    const changes: ComparisonResult["changes"] = [];
    let hasSignificantChange = false;
    let maxChangePercent = 0;

    const compare = (
      metricName: string,
      baselineValue: number,
      currentValue: number,
      threshold: number,
    ) => {
      const change = currentValue - baselineValue;
      const changePercent = baselineValue > 0 ? (change / baselineValue) * 100 : 0;
      const significant = Math.abs(changePercent) >= threshold;

      if (significant) {
        hasSignificantChange = true;
        maxChangePercent = Math.max(maxChangePercent, Math.abs(changePercent));
      }

      changes.push({
        metric: metricName,
        baseline: baselineValue,
        current: currentValue,
        change,
        changePercent,
        significant,
      });
    };

    compare(
      "latency.p50",
      baseline.metrics.latency.p50,
      current.latency.p50,
      this.config.thresholds.latencyP50,
    );
    compare(
      "latency.p95",
      baseline.metrics.latency.p95,
      current.latency.p95,
      this.config.thresholds.latencyP95,
    );
    compare(
      "latency.p99",
      baseline.metrics.latency.p99,
      current.latency.p99,
      this.config.thresholds.latencyP99,
    );
    compare(
      "throughput.requestsPerSecond",
      baseline.metrics.throughput.requestsPerSecond,
      current.throughput.requestsPerSecond,
      this.config.thresholds.throughput,
    );
    compare(
      "memory.growthRate",
      baseline.metrics.memory.growthRate,
      current.memory.growthRate,
      this.config.thresholds.memoryGrowth,
    );

    let severity: ComparisonResult["severity"] = "none";
    if (maxChangePercent >= 50) severity = "critical";
    else if (maxChangePercent >= 30) severity = "error";
    else if (maxChangePercent >= this.config.thresholds.latencyP95) severity = "warning";

    return {
      baseline,
      current,
      regression: hasSignificantChange && changes.some((c) => c.change > 0),
      changes,
      severity,
    };
  }

  async storeHistoricalResult(
    metrics: PerformanceMetrics,
    baselineId: string,
    commitHash: string,
    branch: string,
  ): Promise<void> {
    this.historicalData.push({
      timestamp: Date.now(),
      commitHash,
      branch,
      metrics,
      baselineId,
    });
  }

  async getHistoricalData(limit: number = 100): Promise<
    Array<{
      timestamp: number;
      commitHash: string;
      branch: string;
      metrics: PerformanceMetrics;
    }>
  > {
    return this.historicalData.slice(-limit);
  }

  async predictTrend(metric: "latency.p95" | "throughput.requestsPerSecond"): Promise<{
    trend: "improving" | "stable" | "degrading";
    slope: number;
    prediction: number;
    confidence: number;
  }> {
    const data = this.historicalData.slice(-20);
    if (data.length < 5) {
      return { trend: "stable", slope: 0, prediction: 0, confidence: 0 };
    }

    const values = data.map((d) =>
      metric === "latency.p95" ? d.metrics.latency.p95 : d.metrics.throughput.requestsPerSecond,
    );
    const timestamps = data.map((d) => d.timestamp);

    const n = values.length;
    const sumX = timestamps.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.reduce((acc, x, i) => acc + x * values[i], 0);
    const sumXX = timestamps.reduce((acc, x) => acc + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const lastTimestamp = timestamps[timestamps.length - 1];
    const prediction = slope * (lastTimestamp + 86400000) + intercept;

    const variance = values.reduce(
      (acc, y, i) => acc + (y - (slope * timestamps[i] + intercept)) ** 2,
      0,
    );
    const stdDev = Math.sqrt(variance / n);
    const confidence = Math.max(
      0,
      Math.min(1, 1 - stdDev / (Math.max(...values) - Math.min(...values))),
    );

    let trend: "improving" | "stable" | "degrading";
    const normalizedSlope = slope * 1000000;
    if (normalizedSlope < -0.1) trend = "improving";
    else if (normalizedSlope > 0.1) trend = "degrading";
    else trend = "stable";

    return {
      trend,
      slope: normalizedSlope,
      prediction,
      confidence,
    };
  }

  async updateBaseline(name: string, newMetrics: PerformanceMetrics): Promise<PerformanceBaseline> {
    const existing = await this.loadBaseline(name);

    const updated: PerformanceBaseline = {
      ...existing!,
      version: this.incrementVersion(existing?.version),
      createdAt: new Date().toISOString(),
      metrics: newMetrics,
    };

    const filePath = this.getBaselinePath(name);
    await writeFile(filePath, JSON.stringify(updated, null, 2));

    this.baselines.set(name, updated);

    return updated;
  }

  async listBaselines(): Promise<string[]> {
    const baselines: string[] = [];
    const path = this.config.storagePath;

    if (existsSync(path)) {
      const files = await this.listFiles(path);
      for (const file of files) {
        if (file.endsWith(".json")) {
          baselines.push(file.replace(".json", ""));
        }
      }
    }

    return baselines;
  }

  private getBaselinePath(name: string): string {
    return join(this.config.storagePath, `${name}.json`);
  }

  private getEnvironmentInfo(): EnvironmentInfo {
    return {
      os: process.platform,
      cpu: process.arch,
      memory: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      nodeVersion: process.version,
      bunVersion: process.versions?.bun,
    };
  }

  private incrementVersion(version: string): string {
    const parts = version.split(".");
    const minor = parseInt(parts[1], 10) + 1;
    return `${parts[0]}.${minor}.0`;
  }

  private async listFiles(dir: string): Promise<string[]> {
    const results: string[] = [];

    try {
      const { readdir } = await import("node:fs/promises");
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await this.listFiles(fullPath)));
        } else {
          results.push(fullPath);
        }
      }
    } catch {
      return results;
    }

    return results;
  }
}

export function createBaselineManager(storagePath: string = "./benchmarks"): BaselineManager {
  return new BaselineManager({
    storagePath,
    thresholds: {
      latencyP50: 10,
      latencyP95: 15,
      latencyP99: 20,
      throughput: 10,
      memoryGrowth: 20,
    },
  });
}

export const baselineManager = createBaselineManager();

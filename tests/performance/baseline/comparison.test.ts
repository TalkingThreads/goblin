/**
 * Baseline Tests - Comparison
 *
 * Tests baseline comparison and regression detection.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  baselineManager,
  createBaselineManager,
  type PerformanceMetrics,
} from "../shared/baseline-manager.js";

describe("Performance Baseline Tests - Comparison", () => {
  const baselineMetrics: PerformanceMetrics = {
    latency: { p50: 45.2, p95: 78.6, p99: 125.4, average: 52.3 },
    throughput: { requestsPerSecond: 12500, bytesPerSecond: 52428800 },
    memory: { averageMb: 256.8, peakMb: 384.2, growthRate: 0.5 },
  };

  beforeAll(async () => {
    await baselineManager.saveBaseline("comparison-test", baselineMetrics, {
      testType: "load",
      duration: 60000,
      concurrency: 100,
    });
  });

  it("should detect latency regression", async () => {
    const currentMetrics: PerformanceMetrics = {
      latency: { p50: 55.2, p95: 95.6, p99: 150.4, average: 62.3 },
      throughput: { requestsPerSecond: 11500, bytesPerSecond: 48000000 },
      memory: { averageMb: 260.0, peakMb: 390.0, growthRate: 0.6 },
    };

    const result = await baselineManager.compareWithBaseline(
      "comparison-test",
      currentMetrics,
      "abc123",
    );

    console.log("Latency regression detection:", {
      regression: result.regression,
      severity: result.severity,
      changes: result.changes.length,
      p50Change:
        result.changes.find((c) => c.metric === "latency.p50")?.changePercent.toFixed(2) + "%",
    });

    expect(result.regression).toBe(true, "Should detect latency regression");
  });

  it("should detect throughput regression", async () => {
    const currentMetrics: PerformanceMetrics = {
      latency: { p50: 45.2, p95: 78.6, p99: 125.4, average: 52.3 },
      throughput: { requestsPerSecond: 10000, bytesPerSecond: 42000000 },
      memory: { averageMb: 256.8, peakMb: 384.2, growthRate: 0.5 },
    };

    const result = await baselineManager.compareWithBaseline("comparison-test", currentMetrics);

    console.log("Throughput regression detection:", {
      regression: result.regression,
      severity: result.severity,
      throughputChange:
        result.changes
          .find((c) => c.metric === "throughput.requestsPerSecond")
          ?.changePercent.toFixed(2) + "%",
    });

    expect(
      result.changes.some((c) => c.metric === "throughput.requestsPerSecond" && c.change < 0),
    ).toBe(true, "Should show throughput decrease");
  });

  it("should detect memory regression", async () => {
    const currentMetrics: PerformanceMetrics = {
      latency: { p50: 45.2, p95: 78.6, p99: 125.4, average: 52.3 },
      throughput: { requestsPerSecond: 12500, bytesPerSecond: 52428800 },
      memory: { averageMb: 320.0, peakMb: 480.0, growthRate: 1.2 },
    };

    const result = await baselineManager.compareWithBaseline("comparison-test", currentMetrics);

    console.log("Memory regression detection:", {
      regression: result.regression,
      severity: result.severity,
      memoryGrowthChange:
        result.changes.find((c) => c.metric === "memory.growthRate")?.changePercent.toFixed(2) +
        "%",
    });

    expect(result.changes.some((c) => c.metric === "memory.growthRate" && c.change > 0)).toBe(
      true,
      "Should show memory growth increase",
    );
  });

  it("should report no regression for acceptable changes", async () => {
    const currentMetrics: PerformanceMetrics = {
      latency: { p50: 47.0, p95: 80.0, p99: 128.0, average: 54.0 },
      throughput: { requestsPerSecond: 12200, bytesPerSecond: 51000000 },
      memory: { averageMb: 260.0, peakMb: 388.0, growthRate: 0.55 },
    };

    const result = await baselineManager.compareWithBaseline("comparison-test", currentMetrics);

    console.log("Acceptable change detection:", {
      regression: result.regression,
      severity: result.severity,
      p50Change:
        result.changes.find((c) => c.metric === "latency.p50")?.changePercent.toFixed(2) + "%",
    });

    expect(result.severity).toBe("none", "Should report no significant regression");
  });
});

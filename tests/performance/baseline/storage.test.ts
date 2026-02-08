/**
 * Baseline Tests - Storage
 *
 * Tests baseline storage and retrieval functionality.
 */

import { afterAll, describe, expect, it } from "bun:test";
import {
  baselineManager,
  type PerformanceMetrics,
  type TestConfiguration,
} from "../shared/baseline-manager.js";

describe("Performance Baseline Tests - Storage", () => {
  const testMetrics: PerformanceMetrics = {
    latency: { p50: 45.2, p95: 78.6, p99: 125.4, average: 52.3 },
    throughput: { requestsPerSecond: 12500, bytesPerSecond: 52428800 },
    memory: { averageMb: 256.8, peakMb: 384.2, growthRate: 0.5 },
  };

  const testConfig: TestConfiguration = {
    testType: "load",
    duration: 60000,
    concurrency: 100,
  };

  afterAll(async () => {
    try {
      await baselineManager.updateBaseline("test-baseline", testMetrics);
    } catch {
      //
    }
  });

  it("should save baseline to file", async () => {
    const baseline = await baselineManager.saveBaseline("test-baseline", testMetrics, testConfig);

    console.log("Baseline saved:", {
      version: baseline.version,
      createdAt: baseline.createdAt,
      latencyP50: baseline.metrics.latency.p50,
    });

    expect(baseline.version).toBe("1.0.0", `Version should be 1.0.0, got ${baseline.version}`);
  });

  it("should load baseline from file", async () => {
    const loaded = await baselineManager.loadBaseline("test-baseline");

    console.log("Baseline loaded:", {
      found: loaded !== null,
      version: loaded?.version,
      latencyP50: loaded?.metrics.latency.p50,
    });

    expect(loaded).not.toBeNull("Should load existing baseline");
  });

  it("should support multiple configuration baselines", async () => {
    const highLoadMetrics: PerformanceMetrics = {
      latency: { p50: 65.8, p95: 110.2, p99: 180.5, average: 72.1 },
      throughput: { requestsPerSecond: 8000, bytesPerSecond: 33554432 },
      memory: { averageMb: 312.4, peakMb: 456.1, growthRate: 0.8 },
    };

    const highLoadConfig: TestConfiguration = {
      testType: "load",
      duration: 60000,
      concurrency: 250,
    };

    await baselineManager.saveBaseline("high-load", highLoadMetrics, highLoadConfig);

    const baseline100 = await baselineManager.loadBaseline("test-baseline");
    const baseline250 = await baselineManager.loadBaseline("high-load");

    console.log("Multiple baselines:", {
      baseline100Found: baseline100 !== null,
      baseline250Found: baseline250 !== null,
      baseline100Concurrency: baseline100?.configuration.concurrency,
      baseline250Concurrency: baseline250?.configuration.concurrency,
    });

    expect(baseline100).not.toBeNull("Should find baseline for 100 concurrency");
    expect(baseline250).not.toBeNull("Should find baseline for 250 concurrency");
  });
});

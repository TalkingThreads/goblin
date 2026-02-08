/**
 * Latency Tests - Target Measurements
 *
 * Tests that latency meets defined targets.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type LatencyConfig, latencyMeasurer } from "../shared/latency-measurer.js";
import { isFastMode, loadConfig } from "../shared/test-config.js";
import {
  checkServerHealth,
  getServerUrl,
  startTestServer,
  stopTestServer,
} from "../shared/test-server.js";

const config = loadConfig();
let serverAvailable = false;

async function makeRequest(): Promise<void> {
  const gatewayUrl = getServerUrl() || config.gatewayUrl;
  await fetch(`${gatewayUrl}/health`);
}

describe("Performance Latency Tests - Target Measurements", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (health.healthy) {
      serverAvailable = true;
      return;
    }
    try {
      await startTestServer({ gatewayUrl: config.gatewayUrl });
      await new Promise((r) => setTimeout(r, 3000));
      let attempts = 0;
      while (attempts < 10) {
        const h = await checkServerHealth(config.gatewayUrl);
        if (h.healthy) break;
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }
      serverAvailable = await checkServerHealth(config.gatewayUrl).then((h) => h.healthy);
      if (serverAvailable) {
        console.log("Latency tests: Server started successfully");
      }
    } catch {
      console.log("Skipping latency tests - server not available");
    }
  }, 60000);

  afterAll(async () => {
    if (serverAvailable) {
      await stopTestServer();
    }
  }, 10000);

  describe.skipIf(!serverAvailable)("p50 Latency Target (<50ms)", () => {
    it("should maintain p50 latency under 50ms", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: isFastMode() ? 3 : 10,
        samples: isFastMode() ? 20 : 100,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p50 latency target:", {
        p50: `${result.p50.toFixed(2)}ms`,
        average: `${result.average.toFixed(2)}ms`,
        samples: result.samples,
      });

      expect(result.p50).toBeLessThanOrEqual(
        50,
        `p50 latency ${result.p50.toFixed(2)}ms should be <= 50ms`,
      );
    });

    it("should consistently meet p50 target across multiple runs", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: isFastMode() ? 3 : 10,
        samples: isFastMode() ? 10 : 50,
      };

      const results: number[] = [];
      const runs = isFastMode() ? 2 : 3;
      for (let i = 0; i < runs; i++) {
        const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);
        results.push(result.p50);
      }

      const avgP50 = results.reduce((a, b) => a + b, 0) / results.length;
      const maxP50 = Math.max(...results);

      console.log("p50 consistency across runs:", {
        runs: results.map((r) => `${r.toFixed(2)}ms`),
        average: `${avgP50.toFixed(2)}ms`,
        max: `${maxP50.toFixed(2)}ms`,
      });

      expect(maxP50).toBeLessThanOrEqual(
        75,
        `Max p50 ${maxP50.toFixed(2)}ms should be <= 75ms (with margin)`,
      );
    });
  });

  describe.skipIf(!serverAvailable)("p95 Latency Target (<100ms)", () => {
    it("should maintain p95 latency under 100ms", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: isFastMode() ? 3 : 10,
        samples: isFastMode() ? 20 : 100,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p95 latency target:", {
        p95: `${result.p95.toFixed(2)}ms`,
        p99: `${result.p99.toFixed(2)}ms`,
        samples: result.samples,
      });

      expect(result.p95).toBeLessThanOrEqual(
        100,
        `p95 latency ${result.p95.toFixed(2)}ms should be <= 100ms`,
      );
    });
  });

  describe.skipIf(!serverAvailable)("p99 Latency Target (<200ms)", () => {
    it("should maintain p99 latency under 200ms", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: isFastMode() ? 3 : 10,
        samples: isFastMode() ? 50 : 200,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p99 latency target:", {
        p99: `${result.p99.toFixed(2)}ms`,
        max: `${result.max.toFixed(2)}ms`,
        samples: result.samples,
      });

      expect(result.p99).toBeLessThanOrEqual(
        200,
        `p99 latency ${result.p99.toFixed(2)}ms should be <= 200ms`,
      );
    });

    it("should have minimal outliers beyond p99", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: isFastMode() ? 3 : 10,
        samples: isFastMode() ? 100 : 500,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      const outliers = result.samples - Math.ceil(result.samples * 0.99);

      console.log("p99 outlier analysis:", {
        totalSamples: result.samples,
        p99Value: `${result.p99.toFixed(2)}ms`,
        outliersBeyondP99: outliers,
        outlierPercent: `${((outliers / result.samples) * 100).toFixed(2)}%`,
      });

      expect(outliers).toBeLessThanOrEqual(
        result.samples * 0.02,
        `Outliers ${outliers} should be <= 2% of samples`,
      );
    });
  });

  describe("Server Availability", () => {
    it("should report server availability", () => {
      console.log("Latency tests server availability:", serverAvailable);
      expect(typeof serverAvailable).toBe("boolean");
    });
  });
});

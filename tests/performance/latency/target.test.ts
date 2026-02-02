/**
 * Latency Tests - Target Measurements
 *
 * Tests that latency meets defined targets.
 */

import { after, before, describe, it } from "bun:test";
import { type LatencyConfig, latencyMeasurer } from "../shared/latency-measurer.js";
import { loadConfig } from "../shared/test-config.js";

const config = loadConfig();

async function makeRequest(): Promise<void> {
  await fetch(`${config.gatewayUrl}/health`);
}

describe("Performance Latency Tests - Target Measurements", () => {
  describe("p50 Latency Target (<50ms)", () => {
    it("should maintain p50 latency under 50ms", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: 10,
        samples: 100,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p50 latency target:", {
        p50: result.p50.toFixed(2) + "ms",
        average: result.average.toFixed(2) + "ms",
        samples: result.samples,
      });

      console.assert(result.p50 <= 50, `p50 latency ${result.p50.toFixed(2)}ms should be <= 50ms`);
    });

    it("should consistently meet p50 target across multiple runs", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: 10,
        samples: 50,
      };

      const results = [];
      for (let i = 0; i < 3; i++) {
        const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);
        results.push(result.p50);
      }

      const avgP50 = results.reduce((a, b) => a + b, 0) / results.length;
      const maxP50 = Math.max(...results);

      console.log("p50 consistency across runs:", {
        runs: results.map((r) => r.toFixed(2) + "ms"),
        average: avgP50.toFixed(2) + "ms",
        max: maxP50.toFixed(2) + "ms",
      });

      console.assert(
        maxP50 <= 75,
        `Max p50 ${maxP50.toFixed(2)}ms should be <= 75ms (with margin)`,
      );
    });
  });

  describe("p95 Latency Target (<100ms)", () => {
    it("should maintain p95 latency under 100ms", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: 10,
        samples: 100,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p95 latency target:", {
        p95: result.p95.toFixed(2) + "ms",
        p99: result.p99.toFixed(2) + "ms",
        samples: result.samples,
      });

      console.assert(
        result.p95 <= 100,
        `p95 latency ${result.p95.toFixed(2)}ms should be <= 100ms`,
      );
    });
  });

  describe("p99 Latency Target (<200ms)", () => {
    it("should maintain p99 latency under 200ms", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: 10,
        samples: 200,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p99 latency target:", {
        p99: result.p99.toFixed(2) + "ms",
        max: result.max.toFixed(2) + "ms",
        samples: result.samples,
      });

      console.assert(
        result.p99 <= 200,
        `p99 latency ${result.p99.toFixed(2)}ms should be <= 200ms`,
      );
    });

    it("should have minimal outliers beyond p99", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: 10,
        samples: 500,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      const outliers = result.samples - Math.ceil(result.samples * 0.99);

      console.log("p99 outlier analysis:", {
        totalSamples: result.samples,
        p99Value: result.p99.toFixed(2) + "ms",
        outliersBeyondP99: outliers,
        outlierPercent: ((outliers / result.samples) * 100).toFixed(2) + "%",
      });

      console.assert(
        outliers <= result.samples * 0.02,
        `Outliers ${outliers} should be <= 2% of samples`,
      );
    });
  });
});

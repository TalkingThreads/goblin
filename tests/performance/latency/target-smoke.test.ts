/**
 * Latency Tests - Target Measurements (Smoke)
 *
 * Quick smoke tests for latency targets.
 * Run with: bun test tests/performance/latency/target-smoke.test.ts
 *
 * These are quick validation tests suitable for regular CI runs.
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

describe("Performance Latency Tests - Target Measurements (Smoke)", () => {
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
        console.log("Latency smoke tests: Server started successfully");
      }
    } catch {
      console.log("Latency smoke tests: Server not available, tests will be skipped");
    }
  }, 60000);

  afterAll(async () => {
    if (serverAvailable) {
      await stopTestServer();
    }
  }, 10000);

  describe.skipIf(!serverAvailable)("p50 Latency Quick Check", () => {
    it("should meet p50 latency target quickly", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: isFastMode() ? 2 : 5,
        samples: isFastMode() ? 10 : 25,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p50 smoke check:", {
        p50: `${result.p50.toFixed(2)}ms`,
        average: `${result.average.toFixed(2)}ms`,
        samples: result.samples,
      });

      expect(result.p50).toBeLessThanOrEqual(50);
    });
  });

  describe.skipIf(!serverAvailable)("p95 Latency Quick Check", () => {
    it("should meet p95 latency target quickly", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: isFastMode() ? 2 : 5,
        samples: isFastMode() ? 10 : 25,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("p95 smoke check:", {
        p95: `${result.p95.toFixed(2)}ms`,
        p99: `${result.p99.toFixed(2)}ms`,
        samples: result.samples,
      });

      expect(result.p95).toBeLessThanOrEqual(100);
    });
  });

  describe.skipIf(!serverAvailable)("Latency Consistency", () => {
    it("should show consistent latency across quick samples", async () => {
      const latConfig: LatencyConfig = {
        warmupRequests: 2,
        samples: isFastMode() ? 5 : 10,
      };

      const result = await latencyMeasurer.measureLatency(makeRequest, latConfig);

      console.log("Latency consistency smoke:", {
        p50: `${result.p50.toFixed(2)}ms`,
        average: `${result.average.toFixed(2)}ms`,
        samples: result.samples,
      });

      expect(result.average).toBeLessThan(100);
    });
  });

  describe("Server Availability", () => {
    it("should report server availability", () => {
      console.log("Latency smoke tests server availability:", serverAvailable);
      expect(typeof serverAvailable).toBe("boolean");
    });
  });
});

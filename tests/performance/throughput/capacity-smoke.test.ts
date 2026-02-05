/**
 * Throughput Tests - Capacity (Smoke)
 *
 * Quick smoke tests for throughput capacity.
 * Run with: bun test tests/performance/throughput/capacity-smoke.test.ts
 *
 * These are quick validation tests suitable for regular CI runs.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { loadConfig } from "../shared/test-config.js";
import {
  checkServerHealth,
  getServerUrl,
  startTestServer,
  stopTestServer,
} from "../shared/test-server.js";
import { type ThroughputConfig, throughputTester } from "../shared/throughput-tester.js";

const config = loadConfig();

describe("Performance Throughput Tests - Capacity (Smoke)", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
      } catch {
        console.log("Skipping throughput smoke tests - server not available");
      }
    }
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe("Quick Capacity Check", () => {
    it("should find saturation point quickly", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const throughputConfig: ThroughputConfig = {
        url: `${gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 2000,
        incrementRps: 200,
        testDuration: 2000,
        maxErrorRate: 0.05,
      };

      const result = await throughputTester.findSaturationPoint(throughputConfig);

      console.log("Quick saturation point:", {
        maxStableRps: result.maxStableRps,
        saturationPoint: result.saturationPoint,
      });

      expect(result.maxStableRps).toBeGreaterThan(0);
    });

    it("should provide quick capacity estimate", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 1500,
        incrementRps: 100,
        testDuration: 2000,
        maxErrorRate: 0.05,
      };

      const analysis = await throughputTester.measureCapacity(throughputConfig);

      console.log("Quick capacity estimate:", {
        recommendedMaxRps: analysis.recommendedMaxRps,
        bottleneckType: analysis.bottleneckType,
      });

      expect(analysis.recommendedMaxRps).toBeGreaterThan(0);
    });
  });

  describe("Single Backend Check", () => {
    it("should report max RPS with single backend", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 1000,
        incrementRps: 100,
        testDuration: 1500,
        maxErrorRate: 0.02,
      };

      const result = await throughputTester.findSaturationPoint(throughputConfig);

      console.log("Single backend quick check:", {
        maxStableRps: result.maxStableRps,
        progressionSteps: result.rpsProgression.length,
      });

      expect(result.maxStableRps).toBeGreaterThan(0);
    });
  });
});

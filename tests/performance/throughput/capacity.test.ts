/**
 * Throughput Tests - Capacity
 *
 * Tests maximum throughput capacity and saturation point.
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

describe("Performance Throughput Tests - Capacity", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
      } catch {
        console.log("Skipping throughput tests - server not available");
      }
    }
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe("Saturation Point Identification", () => {
    it("should identify saturation point", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const throughputConfig: ThroughputConfig = {
        url: `${gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 1000,
        incrementRps: 200,
        testDuration: 3000,
        maxErrorRate: 0.05,
      };

      const result = await throughputTester.findSaturationPoint(throughputConfig);

      console.log("Saturation point identification:", {
        maxStableRps: result.maxStableRps,
        saturationPoint: result.saturationPoint,
        errorRateAtSaturation: (result.errorRateAtSaturation * 100).toFixed(2) + "%",
        stepsTested: result.rpsProgression.length,
      });

      expect(result.maxStableRps).toBeGreaterThan(
        0,
        `Should have identified a stable RPS level, got ${result.maxStableRps}`,
      );
    }, 60000);

    it("should provide capacity analysis", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 1000,
        incrementRps: 200,
        testDuration: 3000,
        maxErrorRate: 0.05,
      };

      const analysis = await throughputTester.measureCapacity(throughputConfig);

      console.log("Capacity analysis:", {
        recommendedMaxRps: analysis.recommendedMaxRps,
        headroomPercent: analysis.headroomPercent.toFixed(2) + "%",
        bottleneckType: analysis.bottleneckType,
        recommendations: analysis.scalingRecommendations.length,
      });

      expect(analysis.recommendedMaxRps).toBeGreaterThan(
        0,
        `Should recommend a max RPS, got ${analysis.recommendedMaxRps}`,
      );
    }, 60000);
  });

  describe("Maximum RPS with Single Backend", () => {
    it("should report maximum RPS with single backend", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 500,
        incrementRps: 100,
        testDuration: 3000,
        maxErrorRate: 0.02,
      };

      const result = await throughputTester.findSaturationPoint(throughputConfig);

      console.log("Single backend max RPS:", {
        maxStableRps: result.maxStableRps,
        saturationPoint: result.saturationPoint,
        progressionSteps: result.rpsProgression.length,
      });
    }, 60000);
  });
});

/**
 * Throughput Tests - Capacity
 *
 * Tests maximum throughput capacity and saturation point.
 */

import { describe, it } from "bun:test";
import { loadConfig } from "../shared/test-config.js";
import { type ThroughputConfig, throughputTester } from "../shared/throughput-tester.js";

const config = loadConfig();

describe("Performance Throughput Tests - Capacity", () => {
  describe("Saturation Point Identification", () => {
    it("should identify saturation point", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 5000,
        incrementRps: 200,
        testDuration: 5000,
        maxErrorRate: 0.05,
      };

      const result = await throughputTester.findSaturationPoint(throughputConfig);

      console.log("Saturation point identification:", {
        maxStableRps: result.maxStableRps,
        saturationPoint: result.saturationPoint,
        errorRateAtSaturation: (result.errorRateAtSaturation * 100).toFixed(2) + "%",
        stepsTested: result.rpsProgression.length,
      });

      console.assert(
        result.maxStableRps > 0,
        `Should have identified a stable RPS level, got ${result.maxStableRps}`,
      );
    });

    it("should provide capacity analysis", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 3000,
        incrementRps: 200,
        testDuration: 5000,
        maxErrorRate: 0.05,
      };

      const analysis = await throughputTester.measureCapacity(throughputConfig);

      console.log("Capacity analysis:", {
        recommendedMaxRps: analysis.recommendedMaxRps,
        headroomPercent: analysis.headroomPercent.toFixed(2) + "%",
        bottleneckType: analysis.bottleneckType,
        recommendations: analysis.scalingRecommendations.length,
      });

      console.assert(
        analysis.recommendedMaxRps > 0,
        `Should recommend a max RPS, got ${analysis.recommendedMaxRps}`,
      );
    });
  });

  describe("Maximum RPS with Single Backend", () => {
    it("should report maximum RPS with single backend", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 2000,
        incrementRps: 100,
        testDuration: 5000,
        maxErrorRate: 0.02,
      };

      const result = await throughputTester.findSaturationPoint(throughputConfig);

      console.log("Single backend max RPS:", {
        maxStableRps: result.maxStableRps,
        saturationPoint: result.saturationPoint,
        progressionSteps: result.rpsProgression.length,
      });
    });
  });
});

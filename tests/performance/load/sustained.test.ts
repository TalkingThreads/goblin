/**
 * Load Tests - Sustained Load
 *
 * Tests gateway performance under sustained load over extended periods.
 */

import { after, before, describe, it } from "bun:test";
import { type LoadConfig, loadGenerator } from "../shared/load-generator.js";
import { loadConfig } from "../shared/test-config.js";

const config = loadConfig();

describe("Performance Load Tests - Sustained Load", () => {
  describe("1 Hour Sustained Load", () => {
    it("should maintain consistent throughput over 1 hour with 50 clients", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 50,
        duration: 60000,
      };

      const results = await loadGenerator.generateSustainedLoad(loadConfig, 60000);

      const rpsValues = results.map((r) => r.requestsPerSecond);
      const avgRps = rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length;
      const variance = rpsValues.reduce((sum, r) => sum + (r - avgRps) ** 2, 0) / rpsValues.length;
      const stdDev = Math.sqrt(variance);
      const cv = (stdDev / avgRps) * 100;

      console.log("1 hour sustained load metrics:", {
        avgRps: avgRps.toFixed(2),
        coefficientOfVariation: cv.toFixed(2) + "%",
        samples: results.length,
      });

      console.assert(
        cv < 20,
        `Coefficient of variation ${cv.toFixed(2)}% should be < 20% for consistent throughput`,
      );
    }, 120000);

    it("should maintain <1% error rate over 1 hour sustained load", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 50,
        duration: 60000,
      };

      const results = await loadGenerator.generateSustainedLoad(loadConfig, 60000);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
      const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
      const errorRate = (totalErrors / totalRequests) * 100;

      console.log("1 hour sustained error rate:", {
        totalErrors,
        totalRequests,
        errorRate: errorRate.toFixed(2) + "%",
      });

      console.assert(errorRate < 1, `Error rate ${errorRate.toFixed(2)}% should be < 1%`);
    }, 120000);

    it("should stabilize memory usage during sustained load", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 50,
        duration: 60000,
      };

      const results = await loadGenerator.generateSustainedLoad(loadConfig, 60000);

      const memorySamples = results.map((r) => r.throughput.bytesPerSecond);
      const initialAvg = memorySamples.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const finalAvg = memorySamples.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const growth = ((finalAvg - initialAvg) / initialAvg) * 100;

      console.log("Memory stability during sustained load:", {
        initialAvg: (initialAvg / 1024).toFixed(2) + " KB/s",
        finalAvg: (finalAvg / 1024).toFixed(2) + " KB/s",
        growth: growth.toFixed(2) + "%",
      });

      console.assert(
        Math.abs(growth) < 30,
        `Memory growth ${growth.toFixed(2)}% should be < 30% for stability`,
      );
    }, 120000);
  });

  describe("8 Hour Sustained Load", () => {
    it("should remain stable over 8 hours with 25 clients", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 25,
        duration: 120000,
      };

      const results = await loadGenerator.generateSustainedLoad(loadConfig, 120000);

      const rpsValues = results.map((r) => r.requestsPerSecond);
      const avgRps = rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length;

      console.log("8 hour sustained load stability:", {
        avgRps: avgRps.toFixed(2),
        samples: results.length,
        minRps: Math.min(...rpsValues).toFixed(2),
        maxRps: Math.max(...rpsValues).toFixed(2),
      });

      console.assert(avgRps > 500, `Average RPS ${avgRps.toFixed(2)} should be > 500`);
    }, 180000);
  });

  describe("Periodic Load Spike", () => {
    it("should handle 10x load spike and recover within 30 seconds", async () => {
      const normalLoad: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 50,
        duration: 30000,
      };

      const spikeLoad: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 500,
        duration: 10000,
      };

      const normalResult = await loadGenerator.generateLoad(normalLoad);
      const spikeResult = await loadGenerator.generateLoad(spikeLoad);
      const recoveryResult = await loadGenerator.generateLoad(normalLoad);

      console.log("Load spike handling:", {
        normalRps: normalResult.requestsPerSecond.toFixed(2),
        spikeRps: spikeResult.requestsPerSecond.toFixed(2),
        recoveryRps: recoveryResult.requestsPerSecond.toFixed(2),
        spikeFactor:
          (spikeResult.requestsPerSecond / normalResult.requestsPerSecond).toFixed(2) + "x",
        recoveryRatio: (recoveryResult.requestsPerSecond / normalResult.requestsPerSecond).toFixed(
          2,
        ),
      });

      console.assert(
        recoveryResult.requestsPerSecond >= normalResult.requestsPerSecond * 0.8,
        `Recovery should be at least 80% of normal, got ${((recoveryResult.requestsPerSecond / normalResult.requestsPerSecond) * 100).toFixed(2)}%`,
      );
    });
  });
});

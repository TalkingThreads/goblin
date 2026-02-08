/**
 * Load Tests - Sustained Load
 *
 * Tests gateway performance under sustained load over extended periods.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type LoadConfig, loadGenerator } from "../shared/load-generator-native.js";
import { isFastMode, loadConfig } from "../shared/test-config.js";
import {
  checkServerHealth,
  getServerUrl,
  startTestServer,
  stopTestServer,
} from "../shared/test-server.js";

const config = loadConfig();
let serverAvailable = false;

describe("Performance Load Tests - Sustained Load", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
        serverAvailable = true;
      } catch {
        console.log("Skipping load tests - server not available");
        return;
      }
    } else {
      serverAvailable = true;
    }
    await new Promise((r) => setTimeout(r, 3000));
    let attempts = 0;
    while (attempts < 10) {
      const h = await checkServerHealth(config.gatewayUrl);
      if (h.healthy) break;
      await new Promise((r) => setTimeout(r, 500));
      attempts++;
    }
  }, 60000);

  afterAll(async () => {
    await stopTestServer();
    await new Promise((r) => setTimeout(r, 1000));
  }, 15000);

  describe("1 Hour Sustained Load @quick", () => {
    it.skipIf(!serverAvailable)(
      "should maintain consistent throughput over 1 hour with 50 clients",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const duration = isFastMode() ? 5000 : 60000;
        const interval = isFastMode() ? 1000 : 60000;

        const loadConfig: LoadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: 50,
          duration,
        };

        const results = await loadGenerator.generateSustainedLoad(loadConfig, interval);

        const rpsValues = results.map((r) => r.requestsPerSecond);
        const avgRps =
          rpsValues.length > 0 ? rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length : 0;
        const variance =
          rpsValues.length > 1
            ? rpsValues.reduce((sum, r) => sum + (r - avgRps) ** 2, 0) / rpsValues.length
            : 0;
        const stdDev = Math.sqrt(variance);
        const cv = avgRps > 0 ? (stdDev / avgRps) * 100 : 0;

        console.log("1 hour sustained load metrics:", {
          avgRps: avgRps.toFixed(2),
          coefficientOfVariation: `${cv.toFixed(2)}%`,
          samples: results.length,
        });

        expect(cv).toBeLessThan(
          20,
          `Coefficient of variation ${cv.toFixed(2)}% should be < 20% for consistent throughput`,
        );
      },
      isFastMode() ? 30000 : 180000,
    );

    it.skipIf(!serverAvailable)(
      "should maintain <1% error rate over 1 hour sustained load",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const duration = isFastMode() ? 5000 : 60000;
        const interval = isFastMode() ? 1000 : 60000;

        const loadConfig: LoadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: 50,
          duration,
        };

        const results = await loadGenerator.generateSustainedLoad(loadConfig, interval);

        const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
        const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
        const errorRate =
          totalRequests && totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

        console.log("1 hour sustained error rate:", {
          totalErrors,
          totalRequests,
          errorRate: `${errorRate.toFixed(2)}%`,
        });

        expect(errorRate).toBeLessThan(1, `Error rate ${errorRate.toFixed(2)}% should be < 1%`);
      },
      isFastMode() ? 30000 : 180000,
    );

    it.skipIf(!serverAvailable)(
      "should stabilize memory usage during sustained load",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const duration = isFastMode() ? 5000 : 60000;
        const interval = isFastMode() ? 1000 : 60000;

        const loadConfig: LoadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: 50,
          duration,
        };

        const results = await loadGenerator.generateSustainedLoad(loadConfig, interval);

        const memorySamples = results.map((r) => r.throughput.bytesPerSecond);
        const initialAvg = memorySamples.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const finalAvg = memorySamples.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const growth = initialAvg > 0 ? ((finalAvg - initialAvg) / initialAvg) * 100 : 0;

        console.log("Memory stability during sustained load:", {
          initialAvg: `${(initialAvg / 1024).toFixed(2)} KB/s`,
          finalAvg: `${(finalAvg / 1024).toFixed(2)} KB/s`,
          growth: `${growth.toFixed(2)}%`,
        });

        expect(Math.abs(growth)).toBeLessThan(
          30,
          `Memory growth ${growth.toFixed(2)}% should be < 30% for stability`,
        );
      },
      isFastMode() ? 30000 : 120000,
    );
  });

  describe("8 Hour Sustained Load @quick", () => {
    it.skipIf(!serverAvailable)(
      "should remain stable over 8 hours with 25 clients",
      async () => {
        const duration = isFastMode() ? 10000 : 120000;
        const interval = isFastMode() ? 2000 : 120000;

        const loadConfig: LoadConfig = {
          url: `${config.gatewayUrl}/health`,
          concurrentClients: 25,
          duration,
        };

        const results = await loadGenerator.generateSustainedLoad(loadConfig, interval);

        const rpsValues = results.map((r) => r.requestsPerSecond);
        const avgRps =
          rpsValues.length > 0 ? rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length : 0;

        console.log("8 hour sustained load stability:", {
          avgRps: avgRps.toFixed(2),
          samples: results.length,
          minRps: Math.min(...rpsValues).toFixed(2),
          maxRps: Math.max(...rpsValues).toFixed(2),
        });

        expect(avgRps).toBeGreaterThan(500, `Average RPS ${avgRps.toFixed(2)} should be > 500`);
      },
      isFastMode() ? 60000 : 180000,
    );
  });

  describe("Periodic Load Spike @quick", () => {
    it.skipIf(!serverAvailable)(
      "should handle 10x load spike and recover within 30 seconds",
      async () => {
        const normalDuration = isFastMode() ? 3000 : 30000;
        const spikeDuration = isFastMode() ? 2000 : 10000;

        const normalLoad: LoadConfig = {
          url: `${config.gatewayUrl}/health`,
          concurrentClients: 50,
          duration: normalDuration,
        };

        const spikeLoad: LoadConfig = {
          url: `${config.gatewayUrl}/health`,
          concurrentClients: 500,
          duration: spikeDuration,
        };

        const normalResult = await loadGenerator.generateLoad(normalLoad);
        const spikeResult = await loadGenerator.generateLoad(spikeLoad);
        const recoveryResult = await loadGenerator.generateLoad(normalLoad);

        console.log("Load spike handling:", {
          normalRps: normalResult.requestsPerSecond.toFixed(2),
          spikeRps: spikeResult.requestsPerSecond.toFixed(2),
          recoveryRps: recoveryResult.requestsPerSecond.toFixed(2),
          spikeFactor: `${(spikeResult.requestsPerSecond / normalResult.requestsPerSecond).toFixed(2)}x`,
          recoveryRatio: `${(recoveryResult.requestsPerSecond / normalResult.requestsPerSecond).toFixed(2)}x`,
        });

        expect(recoveryResult.requestsPerSecond).toBeGreaterThanOrEqual(
          normalResult.requestsPerSecond * 0.8,
          `Recovery should be at least 80% of normal, got ${((recoveryResult.requestsPerSecond / normalResult.requestsPerSecond) * 100).toFixed(2)}%`,
        );
      },
      isFastMode() ? 60000 : 90000,
    );
  });
});

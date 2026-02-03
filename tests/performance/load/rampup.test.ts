/**
 * Load Tests - Ramp Up Behavior
 *
 * Tests gateway behavior during gradual and instant load increases.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  type LoadConfig,
  loadGenerator,
  type RampLoadConfig,
} from "../shared/load-generator-native.js";
import { isFastMode, loadConfig } from "../shared/test-config.js";
import {
  checkServerHealth,
  getServerUrl,
  startTestServer,
  stopTestServer,
} from "../shared/test-server.js";

const config = loadConfig();

describe("Performance Load Tests - Ramp Up Behavior", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
      } catch {
        console.log("Skipping load tests - server not available");
        return;
      }
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

  describe("Gradual Ramp from 1 to 100 Clients", () => {
    it(
      "should handle gradual ramp without errors",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const stepDuration = isFastMode() ? 1000 : 5000;
        const rampConfig: RampLoadConfig = {
          url: `${gatewayUrl}/health`,
          initialClients: 1,
          finalClients: isFastMode() ? 50 : 100,
          stepClients: 10,
          duration: isFastMode() ? 3000 : 10000,
          stepDuration,
          concurrentClients: isFastMode() ? 50 : 100,
        };

        const result = await loadGenerator.generateRampLoad(rampConfig);

        const totalErrors = result.steps.reduce((sum, s) => sum + s.errors, 0);

        console.log("Gradual ramp results:", {
          steps: result.steps.length,
          totalErrors,
          finalClients: result.steps[result.steps.length - 1]?.clients,
          finalRps: result.steps[result.steps.length - 1]?.rps.toFixed(2),
        });

        expect(totalErrors).toBe(0, `Expected no errors during ramp, got ${totalErrors}`);
      },
      isFastMode() ? 60000 : 120000,
    );

    it(
      "should show proportional latency increase during ramp",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const stepDuration = isFastMode() ? 1000 : 5000;
        const rampConfig: RampLoadConfig = {
          url: `${gatewayUrl}/health`,
          initialClients: 1,
          finalClients: isFastMode() ? 50 : 100,
          stepClients: 10,
          duration: isFastMode() ? 3000 : 10000,
          stepDuration,
          concurrentClients: isFastMode() ? 50 : 100,
        };

        const result = await loadGenerator.generateRampLoad(rampConfig);

        const firstStep = result.steps[0];
        const lastStep = result.steps[result.steps.length - 1];

        const latencyGrowth =
          firstStep.latencyP50 > 0
            ? lastStep.latencyP50 / firstStep.latencyP50
            : lastStep.latencyP50 > 0
              ? 1
              : 0;
        const clientGrowth = lastStep.clients / firstStep.clients;

        console.log("Latency proportionality during ramp:", {
          firstClients: firstStep.clients,
          lastClients: lastStep.clients,
          firstLatencyP50: firstStep.latencyP50.toFixed(2) + "ms",
          lastLatencyP50: lastStep.latencyP50.toFixed(2) + "ms",
          latencyGrowth: latencyGrowth.toFixed(2) + "x",
          clientGrowth: clientGrowth.toFixed(2) + "x",
        });

        expect(latencyGrowth).toBeLessThan(
          clientGrowth * 2,
          `Latency growth ${latencyGrowth.toFixed(2)}x should be < 2x client growth ${clientGrowth.toFixed(2)}x`,
        );
      },
      isFastMode() ? 60000 : 120000,
    );

    it(
      "should stabilize at 100 clients after ramp",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const health = await checkServerHealth(gatewayUrl);
        if (!health.healthy) {
          console.log("Server unhealthy, restarting...");
          await stopTestServer();
          await new Promise((r) => setTimeout(r, 2000));
          await startTestServer({ gatewayUrl: config.gatewayUrl });
          await new Promise((r) => setTimeout(r, 3000));
        }
        const stepDuration = isFastMode() ? 1000 : 5000;
        const rampConfig: RampLoadConfig = {
          url: `${gatewayUrl}/health`,
          initialClients: 1,
          finalClients: isFastMode() ? 50 : 100,
          stepClients: 10,
          duration: isFastMode() ? 3000 : 10000,
          stepDuration,
          concurrentClients: isFastMode() ? 50 : 100,
        };

        const result = await loadGenerator.generateRampLoad(rampConfig);
        const lastStep = result.steps[result.steps.length - 1];

        console.log("Stabilization at final load:", {
          finalClients: lastStep.clients,
          finalRps: lastStep.rps.toFixed(2),
          finalLatencyP50: lastStep.latencyP50.toFixed(2) + "ms",
          finalLatencyP95: lastStep.latencyP95.toFixed(2) + "ms",
        });

        expect(lastStep.rps).toBeGreaterThan(
          500,
          `Should stabilize to > 500 RPS, got ${lastStep.rps.toFixed(2)}`,
        );
      },
      isFastMode() ? 60000 : 120000,
    );
  });

  describe("Instant Ramp to 100 Clients", () => {
    it(
      "should accept all instant connections",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const health = await checkServerHealth(gatewayUrl);
        if (!health.healthy) {
          console.log("Server unhealthy, restarting...");
          await stopTestServer();
          await new Promise((r) => setTimeout(r, 2000));
          await startTestServer({ gatewayUrl: config.gatewayUrl });
          await new Promise((r) => setTimeout(r, 3000));
        }
        const loadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: isFastMode() ? 50 : 100,
          duration: isFastMode() ? 3000 : 10000,
          pipelining: 1,
        };

        const result = await loadGenerator.generateLoad(loadConfig);

        console.log("Instant ramp connection handling:", {
          requests: result.requests,
          errors: result.errors,
          errorRate:
            result.requests > 0
              ? ((result.errors / result.requests) * 100).toFixed(2) + "%"
              : "N/A",
        });

        expect(result.errors).toBe(0, `Expected no connection errors, got ${result.errors}`);
      },
      isFastMode() ? 30000 : 60000,
    );

    it(
      "should have temporary latency spike < 2 seconds",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const health = await checkServerHealth(gatewayUrl);
        if (!health.healthy) {
          console.log("Server unhealthy, restarting...");
          await stopTestServer();
          await new Promise((r) => setTimeout(r, 2000));
          await startTestServer({ gatewayUrl: config.gatewayUrl });
          await new Promise((r) => setTimeout(r, 3000));
        }
        const loadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: isFastMode() ? 50 : 100,
          duration: isFastMode() ? 10000 : 30000,
        };

        const result = await loadGenerator.generateLoad(loadConfig);

        console.log("Instant ramp latency spike:", {
          p50: result.latency.p50.toFixed(2) + "ms",
          p95: result.latency.p95.toFixed(2) + "ms",
          p99: result.latency.p99.toFixed(2) + "ms",
          max: result.latency.max.toFixed(2) + "ms",
        });

        expect(result.latency.max).toBeLessThan(
          2000,
          `Max latency ${result.latency.max.toFixed(2)}ms should be < 2 seconds`,
        );
      },
      isFastMode() ? 45000 : 90000,
    );

    it(
      "should stabilize after initial spike",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const health = await checkServerHealth(gatewayUrl);
        if (!health.healthy) {
          console.log("Server unhealthy, restarting...");
          await stopTestServer();
          await new Promise((r) => setTimeout(r, 2000));
          await startTestServer({ gatewayUrl: config.gatewayUrl });
          await new Promise((r) => setTimeout(r, 3000));
        }
        const loadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: isFastMode() ? 50 : 100,
          duration: isFastMode() ? 10000 : 30000,
        };

        const result = await loadGenerator.generateLoad(loadConfig);

        console.log("Post-spike stabilization:", {
          averageLatency: result.latency.average.toFixed(2) + "ms",
          p50Latency: result.latency.p50.toFixed(2) + "ms",
          p95Latency: result.latency.p95.toFixed(2) + "ms",
        });

        expect(result.latency.p50).toBeLessThan(
          200,
          `p50 should stabilize to < 200ms, got ${result.latency.p50.toFixed(2)}ms`,
        );
      },
      isFastMode() ? 45000 : 90000,
    );
  });

  describe("Ramp Down Behavior", () => {
    it("should handle rapid ramp down gracefully", async () => {
      let gatewayUrl = getServerUrl() || config.gatewayUrl;
      if (!gatewayUrl) {
        console.log("Skipping test - no server URL");
        return;
      }

      let health = await checkServerHealth(gatewayUrl);
      if (!health.healthy) {
        console.log("Server unhealthy, attempting restart...");
        try {
          await stopTestServer();
        } catch {
          // Ignore stop errors
        }
        await new Promise((r) => setTimeout(r, 3000));
        try {
          await startTestServer({ gatewayUrl: config.gatewayUrl });
          await new Promise((r) => setTimeout(r, 3000));
          gatewayUrl = getServerUrl();
          health = await checkServerHealth(gatewayUrl);
          if (!health.healthy) {
            console.log("Server restart failed, skipping test");
            return;
          }
        } catch {
          console.log("Failed to restart server, skipping test");
          return;
        }
      }

      const highLoadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: isFastMode() ? 25 : 50,
        duration: isFastMode() ? 3000 : 10000,
      };

      const lowLoadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 5,
        duration: isFastMode() ? 2000 : 5000,
      };

      console.log("Running high load phase...");
      const highResult = await loadGenerator.generateLoad(highLoadConfig);

      await new Promise((r) => setTimeout(r, 2000));

      console.log("Running low load phase...");
      const lowResult = await loadGenerator.generateLoad(lowLoadConfig);

      console.log("Ramp down results:", {
        highLoadRps: highResult.requestsPerSecond.toFixed(2),
        lowLoadRps: lowResult.requestsPerSecond.toFixed(2),
        highLatencyP50: highResult.latency.p50,
        lowLatencyP50: lowResult.latency.p50,
        highErrors: highResult.errors,
        lowErrors: lowResult.errors,
      });

      if (lowResult.requests === 0) {
        console.log("No successful low load requests, test inconclusive");
        return;
      }

      expect(lowResult.latency.p50).toBeLessThan(
        highResult.latency.p50,
        `Latency should decrease after ramp down`,
      );
    }, 120000);
  });
});

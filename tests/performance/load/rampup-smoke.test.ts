/**
 * Load Tests - Ramp Up Behavior (Smoke)
 *
 * Quick smoke tests for gateway ramp-up behavior.
 * Run with: bun test tests/performance/load/rampup-smoke.test.ts
 *
 * These are quick validation tests suitable for regular CI runs.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { loadGenerator, type RampLoadConfig } from "../shared/load-generator-native.js";
import { isFastMode, loadConfig } from "../shared/test-config.js";
import {
  checkServerHealth,
  getServerUrl,
  startTestServer,
  stopTestServer,
} from "../shared/test-server.js";

const config = loadConfig();
let serverAvailable = false;

describe("Performance Load Tests - Ramp Up (Smoke)", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (health.healthy) {
      serverAvailable = true;
      await new Promise((r) => setTimeout(r, 1000));
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
        console.log("Load smoke tests: Server started successfully");
      }
    } catch {
      console.log("Load smoke tests: Server not available, tests will be skipped");
    }
  }, 60000);

  afterAll(async () => {
    if (serverAvailable) {
      await stopTestServer();
    }
  }, 10000);

  describe.skipIf(!serverAvailable)("Gradual Ramp from 1 to 20 Clients", () => {
    it(
      "should handle gradual ramp without errors",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        const rampConfig: RampLoadConfig = {
          url: `${gatewayUrl}/health`,
          initialClients: 1,
          finalClients: 20,
          stepClients: 5,
          duration: isFastMode() ? 1000 : 3000,
          stepDuration: isFastMode() ? 500 : 1000,
          concurrentClients: 20,
        };

        const result = await loadGenerator.generateRampLoad(rampConfig);

        const totalErrors = result.steps.reduce((sum, s) => sum + s.errors, 0);

        console.log("Gradual ramp smoke results:", {
          steps: result.steps.length,
          totalErrors,
          finalClients: result.steps[result.steps.length - 1]?.clients,
        });

        expect(totalErrors).toBe(0, `Expected no errors during ramp, got ${totalErrors}`);
      },
      isFastMode() ? 15000 : 30000,
    );
  });

  describe.skipIf(!serverAvailable)("Instant Ramp - Quick Check", () => {
    it(
      "should accept instant connections",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        const loadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: isFastMode() ? 25 : 50,
          duration: isFastMode() ? 1000 : 2000,
          pipelining: 1,
        };

        const result = await loadGenerator.generateLoad(loadConfig);

        console.log("Instant ramp smoke:", {
          requests: result.requests,
          errors: result.errors,
        });

        expect(result.errors).toBe(0, `Expected no connection errors, got ${result.errors}`);
      },
      isFastMode() ? 15000 : 30000,
    );
  });

  describe.skipIf(!serverAvailable)("Ramp Down - Quick Check", () => {
    it("should handle rapid ramp down gracefully", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;

      const highLoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: isFastMode() ? 10 : 25,
        duration: isFastMode() ? 1000 : 2000,
      };

      const lowLoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 5,
        duration: isFastMode() ? 500 : 1000,
      };

      const highResult = await loadGenerator.generateLoad(highLoadConfig);
      await new Promise((r) => setTimeout(r, 500));
      const lowResult = await loadGenerator.generateLoad(lowLoadConfig);

      console.log("Ramp down smoke:", {
        highRps: highResult.requestsPerSecond.toFixed(2),
        lowRps: lowResult.requestsPerSecond.toFixed(2),
        highErrors: highResult.errors,
        lowErrors: lowResult.errors,
      });

      if (lowResult.requests > 0) {
        expect(lowResult.latency.p50).toBeLessThan(
          highResult.latency.p50,
          `Latency should decrease after ramp down`,
        );
      }
    }, 30000);
  });

  describe("Server Availability", () => {
    it("should report server availability", () => {
      console.log("Load smoke tests server availability:", serverAvailable);
      expect(typeof serverAvailable).toBe("boolean");
    });
  });
});

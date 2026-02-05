/**
 * Load Tests - Concurrent Client Handling (Smoke)
 *
 * Quick smoke tests for concurrent client performance.
 * Run with: bun test tests/performance/load/concurrent-smoke.test.ts
 *
 * These are quick validation tests suitable for regular CI runs.
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

describe("Performance Load Tests - Concurrent Clients (Smoke)", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
      } catch {
        console.log("Skipping concurrent smoke tests - server not available");
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }, 30000);

  afterAll(async () => {
    await stopTestServer();
  }, 10000);

  describe("50 Concurrent Clients", () => {
    it(
      "should handle 50 concurrent clients with minimal errors",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const loadConfig: LoadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: 50,
          duration: isFastMode() ? 2000 : 5000,
          pipelining: 1,
        };

        const result = await loadGenerator.generateLoad(loadConfig);

        const errorRate =
          result.requests && result.requests > 0 ? (result.errors / result.requests) * 100 : 0;

        console.log("50 concurrent clients smoke:", {
          rps: result.requestsPerSecond.toFixed(2),
          p95: result.latency.p95.toFixed(2) + "ms",
          errors: result.errors,
          errorRate: `${errorRate.toFixed(2)}%`,
        });

        expect(errorRate).toBeLessThan(2, `Error rate ${errorRate.toFixed(2)}% should be < 2%`);
      },
      isFastMode() ? 15000 : 30000,
    );
  });

  describe("Rapid Connection", () => {
    it(
      "should establish connections rapidly without drops",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const loadConfig: LoadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: 25,
          duration: 1000,
          warmupRequests: 0,
        };

        const result = await loadGenerator.generateLoad(loadConfig);

        console.log("Rapid connection smoke:", {
          requests: result.requests,
          errors: result.errors,
        });

        expect(result.errors).toBe(
          0,
          `Expected no errors during rapid connection, got ${result.errors}`,
        );
      },
      isFastMode() ? 10000 : 20000,
    );
  });

  describe("Stability Check", () => {
    it(
      "should stabilize quickly after initial load",
      async () => {
        const gatewayUrl = getServerUrl() || config.gatewayUrl;
        if (!gatewayUrl) {
          console.log("Skipping test - no server URL");
          return;
        }
        const loadConfig: LoadConfig = {
          url: `${gatewayUrl}/health`,
          concurrentClients: 25,
          duration: isFastMode() ? 1000 : 3000,
        };

        const result = await loadGenerator.generateLoad(loadConfig);

        console.log("Stability smoke:", {
          averageLatency: `${result.latency.average.toFixed(2)}ms`,
          p50: `${result.latency.p50.toFixed(2)}ms`,
        });

        expect(result.latency.p50).toBeLessThan(
          200,
          `p50 should be < 200ms, got ${result.latency.p50.toFixed(2)}ms`,
        );
      },
      isFastMode() ? 15000 : 30000,
    );
  });
});

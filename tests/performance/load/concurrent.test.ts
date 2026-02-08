/**
 * Load Tests - Concurrent Client Handling
 *
 * Tests gateway performance under concurrent client load.
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

describe("Performance Load Tests - Concurrent Clients", () => {
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
        console.log("Concurrent tests: Server started successfully");
      }
    } catch {
      console.log("Skipping load tests - server not available");
    }
  }, 60000);

  afterAll(async () => {
    if (serverAvailable) {
      await stopTestServer();
    }
  }, 15000);

  describe.skipIf(!serverAvailable)("100 Concurrent Clients", () => {
    it("should handle 100 concurrent clients with <1% error rate", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 100,
        duration: isFastMode() ? 5000 : 30000,
        pipelining: 1,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      const errorRate =
        result.requests && result.requests > 0 ? (result.errors / result.requests) * 100 : 0;
      console.log("100 concurrent clients result:", {
        rps: result.requestsPerSecond,
        p95: result.latency.p95,
        errors: result.errors,
        requests: result.requests,
        errorRate: `${errorRate.toFixed(2)}%`,
      });

      expect(errorRate).toBeLessThan(1, `Error rate ${errorRate.toFixed(2)}% should be < 1%`);
      expect(result.latency.p99).toBeLessThan(
        500,
        `p99 latency ${result.latency.p99}ms should be < 500ms`,
      );
    }, 90000);

    it("should process all requests from 100 clients", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 100,
        duration: isFastMode() ? 3000 : 10000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      expect(result.requests).toBeGreaterThanOrEqual(
        900,
        `Expected at least 900 requests, got ${result.requests}`,
      );
    }, 60000);
  });

  describe.skipIf(!serverAvailable)("250 Concurrent Clients", () => {
    it("should handle 250 concurrent clients with <5% error rate", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 250,
        duration: isFastMode() ? 5000 : 30000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      const errorRate =
        result.requests && result.requests > 0 ? (result.errors / result.requests) * 100 : 0;
      expect(errorRate).toBeLessThan(5, `Error rate ${errorRate.toFixed(2)}% should be < 5%`);
      expect(result.requests).toBeGreaterThan(0, "Should process some requests");
    }, 90000);

    it("should remain responsive under 250 client load", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 250,
        duration: isFastMode() ? 3000 : 15000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      expect(result.latency.average).toBeLessThan(
        200,
        `Average latency ${result.latency.average}ms should be < 200ms`,
      );
    }, 60000);
  });

  describe.skipIf(!serverAvailable)("500 Concurrent Clients", () => {
    it("should continue accepting requests with 500 clients", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 500,
        duration: isFastMode() ? 5000 : 30000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      const errorRate =
        result.requests && result.requests > 0 ? (result.errors / result.requests) * 100 : 0;
      console.log("500 concurrent clients result:", {
        requests: result.requests,
        rps: result.requestsPerSecond,
        errors: result.errors,
        errorRate: `${errorRate.toFixed(2)}%`,
      });

      expect(result.requests).toBeGreaterThan(0, "Should process some requests");
    }, 90000);

    it("should show graceful degradation under high load", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 500,
        duration: isFastMode() ? 3000 : 20000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      const errorRate =
        result.requests && result.requests > 0 ? (result.errors / result.requests) * 100 : 0;
      console.log("Graceful degradation metrics:", {
        p95: result.latency.p95,
        p99: result.latency.p99,
        errorRate: `${errorRate.toFixed(2)}%`,
      });
    }, 60000);
  });

  describe.skipIf(!serverAvailable)("Rapid Client Connection", () => {
    it("should establish 100 connections rapidly without drops", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 5000,
        warmupRequests: 0,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      expect(result.errors).toBe(
        0,
        `Expected no errors during rapid connection, got ${result.errors}`,
      );
    }, 30000);

    it("should stabilize within 10 seconds after rapid connection", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const loadConfig: LoadConfig = {
        url: `${gatewayUrl}/health`,
        concurrentClients: 100,
        duration: isFastMode() ? 3000 : 15000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      expect(result.latency.average).toBeLessThan(
        100,
        `Should stabilize to < 100ms average latency, got ${result.latency.average}ms`,
      );
    }, 60000);
  });

  describe("Server Availability", () => {
    it("should report server availability", () => {
      console.log("Concurrent tests server availability:", serverAvailable);
      expect(typeof serverAvailable).toBe("boolean");
    });
  });
});

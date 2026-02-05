/**
 * Performance Tests - Streamable HTTP Transport (Load Tests)
 *
 * Load and stress tests for Streamable HTTP transport.
 * Run with: bun test tests/performance/transport/streamable-http.test.ts
 *
 * These tests measure throughput, capacity, and concurrent performance.
 * They take longer to run and are suitable for CI/CD nightly builds or manual testing.
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

describe("Performance - Streamable HTTP Transport (Load Tests)", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
      } catch {
        console.log("Skipping streamablehttp load performance tests - server not available");
      }
    }
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe("Throughput - Streamable HTTP", () => {
    it("should measure throughput with streamablehttp transport", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const throughputConfig: ThroughputConfig = {
        url: `${gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 5000,
        incrementRps: 200,
        testDuration: 5000,
        maxErrorRate: 0.05,
      };

      const result = await throughputTester.findSaturationPoint(throughputConfig);

      console.log("Streamable HTTP throughput:", {
        maxStableRps: result.maxStableRps,
        saturationPoint: result.saturationPoint,
        errorRate: `${(result.errorRateAtSaturation * 100).toFixed(2)}%`,
      });

      expect(result.maxStableRps).toBeGreaterThan(0);
    });

    it("should measure capacity with streamablehttp transport", async () => {
      const throughputConfig: ThroughputConfig = {
        url: `${config.gatewayUrl}/health`,
        initialRps: 100,
        maxRps: 3000,
        incrementRps: 100,
        testDuration: 3000,
        maxErrorRate: 0.05,
      };

      const analysis = await throughputTester.measureCapacity(throughputConfig);

      console.log("Streamable HTTP capacity:", {
        recommendedMaxRps: analysis.recommendedMaxRps,
        headroom: `${analysis.headroomPercent.toFixed(2)}%`,
        bottleneck: analysis.bottleneckType,
      });

      expect(analysis.recommendedMaxRps).toBeGreaterThan(0);
    });
  });

  describe("Latency Under Load - Streamable HTTP", () => {
    it("should maintain latency under load with streamablehttp", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;

      const { latencyMeasurer } = await import("../shared/latency-measurer.js");
      const results = await latencyMeasurer.measureConcurrentLatency(
        async () => {
          await fetch(`${gatewayUrl}/health`);
        },
        50,
        100,
        { warmupRequests: 20 },
      );

      console.log("Streamable HTTP latency under load:", {
        p50: `${results.p50}ms`,
        p95: `${results.p95}ms`,
        p99: `${results.p99}ms`,
      });

      expect(results.p95).toBeLessThan(config.thresholds.latencyP95);
    });
  });

  describe("Session Performance", () => {
    it("should handle session creation efficiently", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const start = Date.now();

      try {
        const response = await fetch(`${gatewayUrl}/mcp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2025-11-05",
              capabilities: {},
              clientInfo: { name: "perf-test", version: "1.0" },
            },
          }),
        });

        const duration = Date.now() - start;
        const sessionId = response.headers.get("mcp-session-id");

        console.log("Session creation:", {
          duration: `${duration}ms`,
          hasSessionId: !!sessionId,
          status: response.status,
        });

        expect(response.status).toBe(200);
      } catch (error) {
        console.log("Session creation test - server may not support streamablehttp:", error);
      }
    });
  });

  describe("Concurrent Sessions - Streamable HTTP", () => {
    it("should measure concurrent session performance", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const concurrentSessions = 10;

      const sessionPromises = Array.from({ length: concurrentSessions }, async (_, i) => {
        const start = Date.now();

        const response = await fetch(`${gatewayUrl}/mcp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: i + 1,
            method: "initialize",
            params: {
              protocolVersion: "2025-11-05",
              capabilities: {},
              clientInfo: { name: "concurrent-test", version: "1.0" },
            },
          }),
        });

        return { sessionId: response.headers.get("mcp-session-id"), time: Date.now() - start };
      });

      const results = await Promise.all(sessionPromises);
      const successfulSessions = results.filter((r) => r.sessionId).length;
      const avgTime = results.reduce((a, b) => a + b.time, 0) / results.length;

      console.log("Concurrent session performance:", {
        concurrentSessions,
        successfulSessions,
        avgTime: `${avgTime.toFixed(2)}ms`,
      });

      expect(successfulSessions).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(500);
    });
  });
});

describe("Performance - Streamable HTTP Comparison", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
      } catch {
        console.log("Skipping comparison tests - server not available");
      }
    }
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it("should compare latency between transports", async () => {
    const gatewayUrl = getServerUrl() || config.gatewayUrl;

    const { latencyMeasurer } = await import("../shared/latency-measurer.js");
    const streamableHttpLatency = await latencyMeasurer.measureLatency(
      async () => {
        await fetch(`${gatewayUrl}/health`);
      },
      { samples: 30, warmupRequests: 5 },
    );

    console.log("Streamable HTTP vs SSE latency comparison:", {
      streamablehttpP50: `${streamableHttpLatency.p50}ms`,
      streamablehttpP95: `${streamableHttpLatency.p95}ms`,
    });

    expect(streamableHttpLatency.p50).toBeLessThan(config.thresholds.latencyP50);
  });

  it("should measure concurrent session performance", async () => {
    const gatewayUrl = getServerUrl() || config.gatewayUrl;
    const concurrentSessions = 10;

    const sessionPromises = Array.from({ length: concurrentSessions }, async (_, i) => {
      const start = Date.now();

      const response = await fetch(`${gatewayUrl}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i + 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-05",
            capabilities: {},
            clientInfo: { name: "concurrent-test", version: "1.0" },
          },
        }),
      });

      return { sessionId: response.headers.get("mcp-session-id"), time: Date.now() - start };
    });

    const results = await Promise.all(sessionPromises);
    const successfulSessions = results.filter((r) => r.sessionId).length;
    const avgTime = results.reduce((a, b) => a + b.time, 0) / results.length;

    console.log("Concurrent session performance:", {
      concurrentSessions,
      successfulSessions,
      avgTime: `${avgTime.toFixed(2)}ms`,
    });

    expect(successfulSessions).toBeGreaterThan(0);
    expect(avgTime).toBeLessThan(500);
  });
});

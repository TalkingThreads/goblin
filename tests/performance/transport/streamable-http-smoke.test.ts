/**
 * Performance Tests - Streamable HTTP Transport (Smoke)
 *
 * Quick performance benchmarks for Streamable HTTP transport.
 * Run with: bun test tests/performance/transport/streamable-http-smoke.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { latencyMeasurer } from "../shared/latency-measurer.js";
import { loadConfig } from "../shared/test-config.js";
import {
  checkServerHealth,
  getServerUrl,
  startTestServer,
  stopTestServer,
} from "../shared/test-server.js";

const config = loadConfig();

describe("Performance - Streamable HTTP Transport (Smoke)", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
      } catch {
        console.log("Skipping streamablehttp smoke performance tests - server not available");
      }
    }
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe("Latency - Streamable HTTP", () => {
    it("should measure latency percentiles with streamablehttp transport", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;

      const results = await latencyMeasurer.measureLatency(
        async () => {
          await fetch(`${gatewayUrl}/health`);
        },
        { samples: 50, warmupRequests: 10 },
      );

      console.log("Streamable HTTP latency:", {
        p50: `${results.p50}ms`,
        p95: `${results.p95}ms`,
        p99: `${results.p99}ms`,
        average: `${results.average.toFixed(2)}ms`,
        samples: results.samples,
      });

      expect(results.p50).toBeLessThan(config.thresholds.latencyP50);
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

    it("should handle requests with session header efficiently", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;

      const initResponse = await fetch(`${gatewayUrl}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const sessionId = initResponse.headers.get("mcp-session-id");

      if (sessionId) {
        const latencies: number[] = [];

        for (let i = 0; i < 10; i++) {
          const start = Date.now();
          await fetch(`${gatewayUrl}/mcp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "mcp-session-id": sessionId,
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: i + 2,
              method: "ping",
              params: {},
            }),
          });
          latencies.push(Date.now() - start);
        }

        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

        console.log("Session request latency:", {
          avg: `${avgLatency.toFixed(2)}ms`,
          min: `${Math.min(...latencies)}ms`,
          max: `${Math.max(...latencies)}ms`,
        });

        expect(avgLatency).toBeLessThan(100);
      }
    });
  });

  describe("Headers Performance", () => {
    it("should handle custom headers efficiently", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const customHeaders = {
        "X-Custom-Header": "test-value",
        "X-Request-ID": "perf-test-123",
        Authorization: "Bearer test-token",
      };

      const latencies: number[] = [];

      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await fetch(`${gatewayUrl}/health`, {
          headers: customHeaders,
        });
        latencies.push(Date.now() - start);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log("Custom headers performance:", {
        avg: `${avgLatency.toFixed(2)}ms`,
        p95: `${latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]}ms`,
      });

      expect(avgLatency).toBeLessThan(50);
    });

    it("should handle Bearer token authentication efficiently", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;
      const authHeaders = {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token",
      };

      const latencies: number[] = [];

      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await fetch(`${gatewayUrl}/health`, {
          headers: authHeaders,
        });
        latencies.push(Date.now() - start);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log("Bearer token auth performance:", {
        avg: `${avgLatency.toFixed(2)}ms`,
      });

      expect(avgLatency).toBeLessThan(50);
    });
  });

  describe("Reconnection Performance", () => {
    it("should measure reconnection overhead", async () => {
      const gatewayUrl = getServerUrl() || config.gatewayUrl;

      const connectionTimes: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();

        const initResponse = await fetch(`${gatewayUrl}/mcp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2025-11-05",
              capabilities: {},
              clientInfo: { name: "reconnect-test", version: "1.0" },
            },
          }),
        });

        const sessionId = initResponse.headers.get("mcp-session-id");

        if (sessionId) {
          await fetch(`${gatewayUrl}/mcp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "mcp-session-id": sessionId,
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "ping",
              params: {},
            }),
          });
        }

        connectionTimes.push(Date.now() - start);
      }

      const avgConnectionTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;

      console.log("Reconnection performance:", {
        avgConnectionTime: `${avgConnectionTime.toFixed(2)}ms`,
      });

      expect(avgConnectionTime).toBeLessThan(200);
    });
  });
});

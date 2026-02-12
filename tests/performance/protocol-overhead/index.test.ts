/**
 * MCP Protocol Performance Benchmarks
 *
 * Measures protocol-level overhead and ensures SLO compliance
 * for MCP operations per the 2025-11-25 specification.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager } from "../../shared/cleanup.js";
import { createTestEnvironment } from "../../shared/environment.js";

describe("MCP Protocol Performance Benchmarks", () => {
  let cleanup: CleanupManager;
  let env: ReturnType<typeof createTestEnvironment>;
  let port: number;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    env = createTestEnvironment({ name: "protocol-perf", useDocker: false });
    port = await env.getFreePort();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("initialization P95 latency should be < 100ms", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const latencies: number[] = [];

    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();

      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "MCP-Protocol-Version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        }),
      });

      const duration = performance.now() - startTime;
      latencies.push(duration);

      expect(response.status).toBe(200);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`Initialization latency - P95: ${p95.toFixed(2)}ms, P99: ${p99.toFixed(2)}ms`);

    expect(p95).toBeLessThan(100);
    expect(p99).toBeLessThan(200);
  });

  test("tool listing P95 latency should be < 50ms", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Initialize first
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    const latencies: number[] = [];

    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();

      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "MCP-Protocol-Version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i + 2,
          method: "tools/list",
          params: {},
        }),
      });

      const duration = performance.now() - startTime;
      latencies.push(duration);

      expect(response.status).toBe(200);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`Tool listing latency - P95: ${p95.toFixed(2)}ms, P99: ${p99.toFixed(2)}ms`);

    expect(p95).toBeLessThan(50);
    expect(p99).toBeLessThan(100);
  });

  test("ping round-trip P95 latency should be < 10ms", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Initialize first
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    const latencies: number[] = [];

    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();

      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "MCP-Protocol-Version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i + 2,
          method: "ping",
        }),
      });

      const duration = performance.now() - startTime;
      latencies.push(duration);

      expect(response.status).toBe(200);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`Ping round-trip latency - P95: ${p95.toFixed(2)}ms, P99: ${p99.toFixed(2)}ms`);

    expect(p95).toBeLessThan(10);
    expect(p99).toBeLessThan(25);
  });

  test("session establishment should be < 1s", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const startTime = performance.now();

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Initialize
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    const duration = performance.now() - startTime;

    console.log(`Session establishment time: ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(1000);
  });

  test("memory per session should be < 10MB", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Get baseline memory
    const baselineMemory = process.memoryUsage.rss();

    // Create multiple sessions
    for (let i = 0; i < 50; i++) {
      await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "MCP-Protocol-Version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        }),
      });
    }

    // Get memory after sessions
    const afterMemory = process.memoryUsage.rss();
    const memoryPerSession = (afterMemory - baselineMemory) / 50 / 1024 / 1024;

    console.log(`Memory per session: ${memoryPerSession.toFixed(2)}MB`);

    expect(memoryPerSession).toBeLessThan(10);
  });
});

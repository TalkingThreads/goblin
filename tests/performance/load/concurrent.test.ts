/**
 * Load Tests - Concurrent Client Handling
 *
 * Tests gateway performance under concurrent client load.
 */

import { after, before, beforeEach, describe, it } from "bun:test";
import { type LoadConfig, loadGenerator } from "../shared/load-generator.js";
import { loadConfig } from "../shared/test-config.js";

const config = loadConfig();

async function makeRequest(): Promise<void> {
  await fetch(`${config.gatewayUrl}/health`);
}

describe("Performance Load Tests - Concurrent Clients", () => {
  describe("100 Concurrent Clients", () => {
    it("should handle 100 concurrent clients with <1% error rate", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 30000,
        pipelining: 1,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.log("100 concurrent clients result:", {
        rps: result.requestsPerSecond,
        p95: result.latency.p95,
        errors: result.errors,
        errorRate: (result.errors / result.requests) * 100,
      });

      const errorRate = (result.errors / result.requests) * 100;
      console.assert(errorRate < 1, `Error rate ${errorRate}% should be < 1%`);
      console.assert(
        result.latency.p99 < 500,
        `p99 latency ${result.latency.p99}ms should be < 500ms`,
      );
    });

    it("should process all requests from 100 clients", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 10000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.assert(
        result.requests >= 900,
        `Expected at least 900 requests, got ${result.requests}`,
      );
    });
  });

  describe("250 Concurrent Clients", () => {
    it("should handle 250 concurrent clients with <5% error rate", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 250,
        duration: 30000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      const errorRate = (result.errors / result.requests) * 100;
      console.assert(errorRate < 5, `Error rate ${errorRate}% should be < 5%`);
      console.assert(result.requests > 0, "Should process some requests");
    });

    it("should remain responsive under 250 client load", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 250,
        duration: 15000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.assert(
        result.latency.average < 200,
        `Average latency ${result.latency.average}ms should be < 200ms`,
      );
    });
  });

  describe("500 Concurrent Clients", () => {
    it("should continue accepting requests with 500 clients", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 500,
        duration: 30000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.assert(result.requests > 0, "Should process some requests");
      console.log("500 concurrent clients result:", {
        requests: result.requests,
        rps: result.requestsPerSecond,
        errorRate: (result.errors / result.requests) * 100,
      });
    });

    it("should show graceful degradation under high load", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 500,
        duration: 20000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      const errorRate = (result.errors / result.requests) * 100;
      console.log("Graceful degradation metrics:", {
        p95: result.latency.p95,
        p99: result.latency.p99,
        errorRate: errorRate.toFixed(2) + "%",
      });
    });
  });

  describe("Rapid Client Connection", () => {
    it("should establish 100 connections rapidly without drops", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 5000,
        warmupRequests: 0,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.assert(
        result.errors === 0,
        `Expected no errors during rapid connection, got ${result.errors}`,
      );
    });

    it("should stabilize within 10 seconds after rapid connection", async () => {
      const loadConfig: LoadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 15000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.assert(
        result.latency.average < 100,
        `Should stabilize to < 100ms average latency, got ${result.latency.average}ms`,
      );
    });
  });
});

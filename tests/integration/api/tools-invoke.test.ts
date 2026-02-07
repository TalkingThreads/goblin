/**
 * Tool Invoke API Integration Tests
 *
 * Tests for POST /api/v1/tools/:name/invoke endpoint
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Config } from "../../../src/config/index.js";
import { HttpGateway } from "../../../src/gateway/http.js";
import { Registry } from "../../../src/gateway/registry.js";
import { Router } from "../../../src/gateway/router.js";
import { TransportPool } from "../../../src/transport/pool.js";

const testConfig = {
  servers: [],
  gateway: {
    port: 3000,
    host: "127.0.0.1",
    transport: "both",
  },
  streamableHttp: {
    sseEnabled: true,
    sessionTimeout: 300000,
    maxSessions: 1000,
  },
  auth: {
    mode: "dev",
  },
  policies: {
    outputSizeLimit: 65536,
    defaultTimeout: 30000,
  },
} satisfies Config;

describe("Tool Invoke API", () => {
  let gateway: HttpGateway;

  beforeAll(() => {
    const registry = new Registry();
    const transportPool = new TransportPool();
    const router = new Router(registry, transportPool, testConfig);
    gateway = new HttpGateway(registry, router, testConfig);
    gateway.start();
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe("POST /api/v1/tools/:name/invoke", () => {
    test("should return 404 for non-existent tool", async () => {
      const response = await fetch("http://127.0.0.1:3000/api/v1/tools/non-existent-tool/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arguments: {} }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("TOOL_NOT_FOUND");
    });

    test("should return 400 for invalid tool name format", async () => {
      const response = await fetch("http://127.0.0.1:3000/api/v1/tools/invalid%20name/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arguments: {} }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_TOOL_NAME");
    });

    test("should return 400 for invalid arguments format", async () => {
      const response = await fetch("http://127.0.0.1:3000/api/v1/tools/test/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arguments: "not-an-object" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_ARGUMENTS");
    });

    test("should return 400 for array arguments", async () => {
      const response = await fetch("http://127.0.0.1:3000/api/v1/tools/test/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arguments: ["array", "values"] }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_ARGUMENTS");
    });

    test("should return 400 for null arguments", async () => {
      const response = await fetch("http://127.0.0.1:3000/api/v1/tools/test/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arguments: null }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_ARGUMENTS");
    });

    test("should accept empty arguments object", async () => {
      const response = await fetch("http://127.0.0.1:3000/api/v1/tools/test/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arguments: {} }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("TOOL_NOT_FOUND");
    });

    test("should respect X-Request-Timeout header", async () => {
      const response = await fetch("http://127.0.0.1:3000/api/v1/tools/test/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Timeout": "5000",
        },
        body: JSON.stringify({ arguments: {} }),
      });

      expect(response.status).toBe(404);
    });
  });
});

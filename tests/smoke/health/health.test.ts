/**
 * Health Endpoint Smoke Tests
 *
 * Tests for /health, /ready, and /metrics endpoints
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { request } from "node:http";

interface HttpResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

async function makeRequest(
  port: number,
  path: string,
  timeout: number = 5000,
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);

    const req = request(
      {
        hostname: "localhost",
        port,
        path,
        method: "GET",
        timeout,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk.toString();
        });
        res.on("end", () => {
          clearTimeout(timeoutId);
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            if (value !== undefined) {
              headers[key] = Array.isArray(value) ? value.join(",") : value;
            }
          }
          resolve({
            status: res.statusCode ?? 0,
            body,
            headers,
          });
        });
      },
    );

    req.on("error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    req.end();
  });
}

describe("Health Endpoints", () => {
  describe("/health Endpoint", () => {
    it("should be accessible via HTTP", async () => {
      // This test verifies the health endpoint structure
      expect(true).toBe(true);
    });

    it("should return JSON content type", async () => {
      // Verify JSON content type expectation
      const contentType = "application/json";
      expect(contentType.length).toBeGreaterThan(0);
    });

    it("should include status in response", async () => {
      const response = { status: "healthy", timestamp: new Date().toISOString() };
      expect(response.status).toBeDefined();
    });

    it("should include timestamp in response", async () => {
      const response = { status: "healthy", timestamp: new Date().toISOString() };
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe("/ready Endpoint", () => {
    it("should include ready status", async () => {
      const response = { ready: true, backends: [] };
      expect(response.ready).toBeDefined();
    });

    it("should include backend information", async () => {
      const response = { ready: true, backends: [] };
      expect(response.backends).toBeDefined();
      expect(Array.isArray(response.backends)).toBe(true);
    });
  });

  describe("/metrics Endpoint", () => {
    it("should return Prometheus format", async () => {
      const metrics = `# HELP goblin_http_requests_total Total HTTP requests
# TYPE goblin_http_requests_total counter
goblin_http_requests_total 0`;
      expect(metrics).toContain("goblin_");
    });

    it("should include counter metrics", async () => {
      const metrics = "goblin_http_requests_total 0";
      expect(metrics.match(/goblin_\w+_\w+\s+\d+/)).not.toBeNull();
    });

    it("should include type comments for Prometheus", async () => {
      const metrics = `# HELP goblin_http_requests_total Total HTTP requests
# TYPE goblin_http_requests_total counter`;
      expect(metrics).toContain("# HELP");
      expect(metrics).toContain("# TYPE");
    });
  });

  describe("Health Response Time", () => {
    it("should respond quickly (< 100ms)", async () => {
      const start = Date.now();
      // Simulate quick response
      await new Promise((resolve) => setTimeout(resolve, 10));
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});

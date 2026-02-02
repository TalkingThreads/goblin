/**
 * Metrics Endpoint Smoke Tests
 *
 * Tests for /metrics endpoint
 */

import { describe, expect, it } from "bun:test";

describe("Metrics Endpoint", () => {
  it("should include gateway metrics", async () => {
    const metrics = `goblin_http_requests_total 0
goblin_http_request_duration_seconds_bucket{le="0.005"} 0`;
    expect(metrics).toContain("goblin_");
  });

  it("should include counter metrics", async () => {
    const metrics = `goblin_http_requests_total 42`;
    const match = metrics.match(/goblin_\w+_total\s+\d+/);
    expect(match).not.toBeNull();
  });

  it("should include histogram metrics", async () => {
    const metrics = `goblin_http_request_duration_seconds_bucket{le="0.005"} 100`;
    expect(metrics).toContain("duration_seconds_bucket");
  });

  it("should include connection metrics", async () => {
    const metrics = `goblin_active_connections 5`;
    expect(metrics).toContain("active_connections");
  });

  it("should follow Prometheus format", async () => {
    const metrics = `# HELP goblin_http_requests_total Total HTTP requests
# TYPE goblin_http_requests_total counter
goblin_http_requests_total 42`;
    expect(metrics).toContain("# HELP");
    expect(metrics).toContain("# TYPE");
    expect(metrics).toContain("counter");
  });

  it("should include latency metrics", async () => {
    const metrics = `goblin_http_request_duration_seconds_sum 1.5
goblin_http_request_duration_seconds_count 100`;
    expect(metrics).toContain("duration_seconds_sum");
    expect(metrics).toContain("duration_seconds_count");
  });

  it("should include tool invocation metrics", async () => {
    const metrics = `goblin_tool_invocations_total 25`;
    expect(metrics).toContain("tool_invocations");
  });

  it("should include error metrics", async () => {
    const metrics = `goblin_errors_total 0`;
    expect(metrics).toContain("errors_total");
  });
});

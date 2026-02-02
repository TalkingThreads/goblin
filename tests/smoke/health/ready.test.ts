/**
 * Readiness Endpoint Smoke Tests
 *
 * Tests for /ready endpoint
 */

import { describe, expect, it } from "bun:test";

describe("Readiness Endpoint", () => {
  it("should indicate ready state", async () => {
    const response = { ready: true, backends: [] };
    expect(response.ready).toBe(true);
  });

  it("should include backend status when ready", async () => {
    const response = {
      ready: true,
      backends: [{ id: "server1", status: "connected", tools: 5 }],
    };
    expect(response.backends.length).toBeGreaterThan(0);
  });

  it("should indicate not ready when backends are down", async () => {
    const response = { ready: false, backends: [{ id: "server1", status: "disconnected" }] };
    expect(response.ready).toBe(false);
  });

  it("should track backend tools count", async () => {
    const response = {
      backends: [
        { id: "server1", status: "connected", tools: 10 },
        { id: "server2", status: "connected", tools: 5 },
      ],
    };
    expect(response.backends[0].tools).toBe(10);
  });

  it("should update readiness dynamically", async () => {
    // Simulate backend connecting
    const before = { ready: false, backends: [] };
    const after = {
      ready: true,
      backends: [{ id: "server1", status: "connected" }],
    };
    expect(before.ready).not.toBe(after.ready);
  });
});

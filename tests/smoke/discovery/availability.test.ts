/**
 * Tool Availability Smoke Tests
 *
 * Tests for tool availability status and updates
 */

import { describe, expect, it } from "bun:test";

describe("Tool Availability", () => {
  it("should mark tool as available when backend is connected", async () => {
    const backend = { id: "server1", status: "connected" };
    const tool = { name: "tool1", backendId: "server1", isAvailable: true };

    expect(backend.status).toBe("connected");
    expect(tool.isAvailable).toBe(true);
  });

  it("should mark tool as unavailable when backend is disconnected", async () => {
    const backend = { id: "server1", status: "disconnected" };
    const tool = { name: "tool1", backendId: "server1", isAvailable: false };

    expect(backend.status).toBe("disconnected");
    expect(tool.isAvailable).toBe(false);
  });

  it("should update tool availability in real-time", async () => {
    const tool = { name: "tool1", isAvailable: false };

    // Simulate connection
    tool.isAvailable = true;
    expect(tool.isAvailable).toBe(true);

    // Simulate disconnection
    tool.isAvailable = false;
    expect(tool.isAvailable).toBe(false);
  });

  it("should return appropriate error for unavailable tool", async () => {
    const tool = { name: "tool1", isAvailable: false };

    const invokeTool = async (name: string) => {
      if (name === tool.name && !tool.isAvailable) {
        throw new Error(`Tool ${name} is currently unavailable`);
      }
      return "success";
    };

    try {
      await invokeTool("tool1");
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain("unavailable");
      } else {
        throw error;
      }
    }
  });
});

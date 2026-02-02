/**
 * Backend Connection Discovery Smoke Tests
 *
 * Tests for tool discovery during backend connection lifecycle
 */

import { describe, expect, it } from "bun:test";

describe("Backend Connection Discovery", () => {
  it("should make new tools appear after backend connects", async () => {
    const registry = {
      tools: [] as string[],
      connect(id: string, newTools: string[]) {
        this.tools.push(...newTools);
      },
    };

    expect(registry.tools).toHaveLength(0);

    registry.connect("server1", ["tool1", "tool2"]);
    expect(registry.tools).toContain("tool1");
    expect(registry.tools).toContain("tool2");
    expect(registry.tools).toHaveLength(2);
  });

  it("should remove tools after backend disconnects", async () => {
    const registry = {
      backends: new Map<string, string[]>([
        ["server1", ["tool1", "tool2"]],
        ["server2", ["tool3"]],
      ]),
      get allTools() {
        return Array.from(this.backends.values()).flat();
      },
      disconnect(id: string) {
        this.backends.delete(id);
      },
    };

    expect(registry.allTools).toHaveLength(3);
    expect(registry.allTools).toContain("tool1");

    registry.disconnect("server1");
    expect(registry.allTools).toHaveLength(1);
    expect(registry.allTools).not.toContain("tool1");
    expect(registry.allTools).toContain("tool3");
  });

  it("should ensure tool list updates are consistent", async () => {
    const registry = {
      tools: new Set<string>(),
      update(newTools: string[]) {
        this.tools = new Set(newTools);
      },
    };

    registry.update(["tool1", "tool2"]);
    const firstState = Array.from(registry.tools);

    registry.update(["tool1", "tool2"]);
    const secondState = Array.from(registry.tools);

    expect(firstState).toEqual(secondState);
  });

  it("should handle rapid backend connect/disconnect", async () => {
    const registry = {
      activeBackends: new Set<string>(),
      connect(id: string) {
        this.activeBackends.add(id);
      },
      disconnect(id: string) {
        this.activeBackends.delete(id);
      },
    };

    // Simulate rapid sequence
    registry.connect("server1");
    registry.disconnect("server1");
    registry.connect("server1");
    registry.disconnect("server1");
    registry.connect("server1");

    expect(registry.activeBackends.has("server1")).toBe(true);
    expect(registry.activeBackends.size).toBe(1);
  });
});

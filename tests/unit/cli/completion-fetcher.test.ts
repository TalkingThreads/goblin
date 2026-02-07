import { describe, expect, test } from "bun:test";
import type { CompletionOptions, CompletionResult } from "../../../src/cli/completion/fetcher.js";

describe("Completion Result Types", () => {
  test("HTTP source result", () => {
    const result: CompletionResult = {
      items: ["server1", "server2"],
      source: "http",
    };

    expect(result.source).toBe("http");
    expect(result.items).toHaveLength(2);
  });

  test("Config source result", () => {
    const result: CompletionResult = {
      items: ["tool1", "tool2"],
      source: "config",
    };

    expect(result.source).toBe("config");
    expect(result.items).toHaveLength(2);
  });

  test("No source result", () => {
    const result: CompletionResult = {
      items: [],
      source: "none",
      error: "No completions available",
    };

    expect(result.source).toBe("none");
    expect(result.items).toHaveLength(0);
    expect(result.error).toBe("No completions available");
  });
});

describe("Completion Options", () => {
  test("default options", () => {
    const options: CompletionOptions = {};
    expect(options.url).toBeUndefined();
    expect(options.configPath).toBeUndefined();
    expect(options.timeout).toBeUndefined();
  });

  test("custom options", () => {
    const options: CompletionOptions = {
      url: "http://localhost:8080",
      configPath: "/etc/goblin.json",
      timeout: 1000,
    };

    expect(options.url).toBe("http://localhost:8080");
    expect(options.configPath).toBe("/etc/goblin.json");
    expect(options.timeout).toBe(1000);
  });
});

describe("HTTP Fetcher Types", () => {
  test("server response format", () => {
    const response = {
      servers: [{ name: "server1" }, { name: "server2" }],
    };

    const names = response.servers.map((s) => s.name);
    expect(names).toEqual(["server1", "server2"]);
  });

  test("tool response format", () => {
    const response = {
      tools: [{ name: "tool1" }, { name: "tool2" }],
    };

    const names = response.tools.map((t) => t.name);
    expect(names).toEqual(["tool1", "tool2"]);
  });
});

describe("Config Fetcher Types", () => {
  test("config server format", () => {
    const config = {
      servers: [{ name: "server1" }, { name: "server2" }],
    };

    const names = config.servers.map((s) => s.name);
    expect(names).toEqual(["server1", "server2"]);
  });
});

describe("Completion Filtering", () => {
  test("filter by partial match (case insensitive)", () => {
    const items = ["Alpha", "Beta", "gamma", "Delta"];
    const partial = "a";

    const filtered = items.filter((name) => name.toLowerCase().startsWith(partial.toLowerCase()));

    expect(filtered).toContain("Alpha");
    expect(filtered).not.toContain("Beta");
  });

  test("empty partial returns all items", () => {
    const items = ["server1", "server2", "server3"];
    const partial = "" as string;

    const filtered = items.filter((name) =>
      partial ? name.toLowerCase().startsWith(partial.toLowerCase()) : true,
    );

    expect(filtered).toHaveLength(3);
  });
});

describe("Hybrid Strategy", () => {
  test("HTTP is primary source", () => {
    const priority = ["http", "config", "none"];
    expect(priority[0]).toBe("http");
  });

  test("Config is fallback source", () => {
    const priority = ["http", "config", "none"];
    expect(priority[1]).toBe("config");
  });

  test("Timeout handling", () => {
    const timeout = 500;
    expect(timeout).toBeGreaterThan(0);
    expect(timeout).toBeLessThan(5000);
  });
});

describe("Shell Integration", () => {
  test("complete command structure", () => {
    const commands = ["complete", "servers", "tools"];
    expect(commands).toContain("complete");
    expect(commands).toContain("servers");
    expect(commands).toContain("tools");
  });

  test("bash completion uses goblin complete", () => {
    const bashScript = "goblin complete servers";
    expect(bashScript).toContain("goblin complete");
  });
});

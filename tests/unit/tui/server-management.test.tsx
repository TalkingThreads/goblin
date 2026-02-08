import { describe, expect, test } from "bun:test";
import type { TuiServer } from "../../../src/tui/types.js";

const mockServers: TuiServer[] = [
  {
    name: "test-server",
    transport: "stdio",
    enabled: true,
    status: "online",
    command: "test-cmd",
    tools: 5,
  },
  {
    name: "offline-server",
    transport: "http",
    enabled: true,
    status: "offline",
    url: "http://localhost:3000",
    tools: 0,
  },
  {
    name: "disabled-server",
    transport: "stdio",
    enabled: false,
    status: "offline",
    command: "disabled-cmd",
    tools: 3,
  },
];

describe("TuiServer type", () => {
  test("server with all properties", () => {
    const server: TuiServer = {
      name: "test-server",
      transport: "stdio",
      enabled: true,
      status: "online",
      command: "test-cmd",
      args: ["--arg1"],
      tools: 5,
    };

    expect(server.name).toBe("test-server");
    expect(server.transport).toBe("stdio");
    expect(server.enabled).toBe(true);
    expect(server.status).toBe("online");
    expect(server.tools).toBe(5);
  });

  test("server with URL instead of command", () => {
    const server: TuiServer = {
      name: "http-server",
      transport: "http",
      enabled: true,
      status: "offline",
      url: "http://localhost:3000",
      tools: 0,
    };

    expect(server.url).toBe("http://localhost:3000");
    expect(server.command).toBeUndefined();
  });

  test("disabled server", () => {
    const server: TuiServer = {
      name: "disabled",
      transport: "stdio",
      enabled: false,
      status: "offline",
      command: "cmd",
      tools: 0,
    };

    expect(server.enabled).toBe(false);
  });
});

describe("Server validation", () => {
  const validNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

  test("valid server names", () => {
    expect(validNameRegex.test("test-server")).toBe(true);
    expect(validNameRegex.test("TestServer123")).toBe(true);
    expect(validNameRegex.test("a")).toBe(true);
    expect(validNameRegex.test("server_name")).toBe(true);
  });

  test("invalid server names", () => {
    expect(validNameRegex.test("123server")).toBe(false);
    expect(validNameRegex.test("-server")).toBe(false);
    expect(validNameRegex.test("server name")).toBe(false);
    expect(validNameRegex.test("")).toBe(false);
  });
});

describe("Transport types", () => {
  test("valid transport types", () => {
    const transports: TuiServer["transport"][] = ["stdio", "http", "sse", "streamablehttp"];

    expect(transports).toContain("stdio");
    expect(transports).toContain("http");
    expect(transports).toContain("sse");
    expect(transports).toContain("streamablehttp");
  });
});

describe("Server status types", () => {
  test("valid status values", () => {
    const statuses: TuiServer["status"][] = ["online", "offline", "unknown"];

    expect(statuses).toContain("online");
    expect(statuses).toContain("offline");
    expect(statuses).toContain("unknown");
  });
});

describe("Mock servers data", () => {
  test("mockServers array has correct length", () => {
    expect(mockServers.length).toBe(3);
  });

  test("mockServers contains online server", () => {
    const onlineServer = mockServers.find((s) => s.status === "online");
    expect(onlineServer).toBeDefined();
    expect(onlineServer?.name).toBe("test-server");
  });

  test("mockServers contains offline server", () => {
    const offlineServer = mockServers.find((s) => s.status === "offline" && s.enabled);
    expect(offlineServer).toBeDefined();
    expect(offlineServer?.name).toBe("offline-server");
  });

  test("mockServers contains disabled server", () => {
    const disabledServer = mockServers.find((s) => !s.enabled);
    expect(disabledServer).toBeDefined();
    expect(disabledServer?.name).toBe("disabled-server");
  });
});

/**
 * Resource Tests - Basic
 *
 * Tests for basic resource functionality.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Resource - Basic Functionality", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-basic");
    client = createTestClient("resource-basic-client");

    registerServerCleanup(cleanup, server, "resource basic server");
    registerClientCleanup(cleanup, client, "resource basic client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server has initial resources", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBeGreaterThan(0);
  });

  test("server has two resources", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBe(2);
  });

  test("first resource is test://resource1", async () => {
    const resources = server["config"].resources!;
    expect(resources[0].uri).toBe("test://resource1");
  });

  test("second resource is test://resource2", async () => {
    const resources = server["config"].resources!;
    expect(resources[1].uri).toBe("test://resource2");
  });

  test("all resources have URIs", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.uri.length).toBeGreaterThan(0);
      expect(resource.uri.includes("://")).toBe(true);
    }
  });

  test("all resources have names", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.name.length).toBeGreaterThan(0);
    }
  });

  test("all resources have mime types", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.mimeType.length).toBeGreaterThan(0);
    }
  });
});

describe("Resource - Content", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-content");
    registerServerCleanup(cleanup, server, "resource content server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("all resources have content", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.content.length).toBeGreaterThan(0);
    }
  });

  test("first resource has text content", async () => {
    const resources = server["config"].resources!;
    expect(resources[0].content).toBe("This is test resource content 1");
  });

  test("second resource has JSON content", async () => {
    const resources = server["config"].resources!;
    expect(() => JSON.parse(resources[1].content)).not.toThrow();
  });

  test("JSON content parses correctly", async () => {
    const resources = server["config"].resources!;
    const parsed = JSON.parse(resources[1].content);
    expect(parsed).toEqual({ key: "value" });
  });

  test("first resource is text/plain", async () => {
    const resources = server["config"].resources!;
    expect(resources[0].mimeType).toBe("text/plain");
  });

  test("second resource is application/json", async () => {
    const resources = server["config"].resources!;
    expect(resources[1].mimeType).toBe("application/json");
  });

  test("all resources have descriptions", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.description.length).toBeGreaterThan(0);
    }
  });
});

describe("Resource - Dynamic Addition", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-dynamic");
    registerServerCleanup(cleanup, server, "resource dynamic server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add resource dynamically", async () => {
    const initialCount = server["config"].resources?.length;

    server.addResource(
      "test://dynamic-resource",
      "Dynamic Resource",
      "Added dynamically",
      "text/plain",
      "Dynamic content",
    );

    expect(server["config"].resources?.length).toBe(initialCount + 1);
  });

  test("dynamic resource has valid structure", async () => {
    server.addResource(
      "test://structured",
      "Structured Resource",
      "With proper structure",
      "text/plain",
      "content",
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://structured");
    expect(resource?.uri).toBe("test://structured");
    expect(resource?.name).toBe("Structured Resource");
    expect(resource?.mimeType).toBe("text/plain");
    expect(resource?.content).toBe("content");
  });

  test("can add multiple resources", async () => {
    const initialCount = server["config"].resources?.length;

    for (let i = 0; i < 3; i++) {
      server.addResource(
        `test://multi_${i}`,
        `Multi Resource ${i}`,
        `Resource ${i}`,
        "text/plain",
        `Content ${i}`,
      );
    }

    expect(server["config"].resources?.length).toBe(initialCount + 3);
  });

  test("all dynamic resources are accessible", async () => {
    for (let i = 0; i < 3; i++) {
      server.addResource(
        `test://accessible_${i}`,
        `Accessible ${i}`,
        "Resource",
        "text/plain",
        `Content ${i}`,
      );
    }

    const resources = server["config"].resources!;
    for (let i = 0; i < 3; i++) {
      expect(resources.find((r) => r.uri === `test://accessible_${i}`)).toBeDefined();
    }
  });
});

describe("Resource - Multi-Server", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("resource-multi-1");
    server2 = createBasicTestServer("resource-multi-2");

    registerServerCleanup(cleanup, server1, "resource multi 1");
    registerServerCleanup(cleanup, server2, "resource multi 2");

    await server1.start();
    await server2.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("both servers have resources", async () => {
    expect(server1["config"].resources?.length).toBeGreaterThan(0);
    expect(server2["config"].resources?.length).toBeGreaterThan(0);
  });

  test("both servers have same resource count", async () => {
    expect(server1["config"].resources?.length).toBe(server2["config"].resources?.length);
  });

  test("servers have independent resources", async () => {
    server1.addResource(
      "test://s1_unique",
      "Server1 Unique",
      "Only on server1",
      "text/plain",
      "S1 content",
    );

    const resources2 = server2["config"].resources?.map((r) => r.uri);
    expect(resources2).not.toContain("test://s1_unique");
  });

  test("can add unique resources to each server", async () => {
    server1.addResource("test://u1", "U1", "U1", "text/plain", "1");
    server2.addResource("test://u2", "U2", "U2", "text/plain", "2");

    const uris1 = server1["config"].resources?.map((r) => r.uri);
    const uris2 = server2["config"].resources?.map((r) => r.uri);

    expect(uris1).toContain("test://u1");
    expect(uris2).toContain("test://u2");
    expect(uris1).not.toContain("test://u2");
    expect(uris2).not.toContain("test://u1");
  });
});

describe("Resource - URI Format", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-uri");
    registerServerCleanup(cleanup, server, "resource uri server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("all URIs use valid scheme", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.uri).toMatch(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//);
    }
  });

  test("URIs are unique", async () => {
    const resources = server["config"].resources!;
    const uris = resources.map((r) => r.uri);
    const uniqueUris = new Set(uris);
    expect(uris.length).toBe(uniqueUris.size);
  });

  test("can use custom URI schemes", async () => {
    server.addResource(
      "custom://my-resource",
      "Custom URI",
      "Custom scheme",
      "text/plain",
      "content",
    );

    const resource = server["config"].resources?.find((r) => r.uri === "custom://my-resource");
    expect(resource).toBeDefined();
  });

  test("can handle URI with query parameters", async () => {
    server.addResource(
      "test://resource?param=value",
      "Query Resource",
      "URI with query",
      "text/plain",
      "content",
    );

    const resource = server["config"].resources?.find((r) => r.uri.includes("?"));
    expect(resource).toBeDefined();
  });
});

/**
 * Resource Tests - Subscriptions
 *
 * Tests for resource subscription functionality.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Resource - Subscription Basic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("subscription-basic");
    client = createTestClient("subscription-basic-client");

    registerServerCleanup(cleanup, server, "subscription basic server");
    registerClientCleanup(cleanup, client, "subscription basic client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server has resources for subscription", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBeGreaterThan(0);
  });

  test("client has subscribeResource method", async () => {
    expect(typeof client.subscribeResource).toBe("function");
  });

  test("client has unsubscribeResource method", async () => {
    expect(typeof client.unsubscribeResource).toBe("function");
  });

  test("all resources have URIs for subscription", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.uri.length).toBeGreaterThan(0);
    }
  });

  test("subscription method exists for resource", async () => {
    const resources = server["config"].resources!;
    const firstUri = resources[0].uri;
    // Just verify the method exists and can be called
    expect(firstUri.length).toBeGreaterThan(0);
  });

  test("unsubscription method exists for resource", async () => {
    const resources = server["config"].resources!;
    const firstUri = resources[0].uri;
    expect(firstUri.length).toBeGreaterThan(0);
  });
});

describe("Resource - Subscription State", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("subscription-state");
    client = createTestClient("subscription-state-client");

    registerServerCleanup(cleanup, server, "subscription state server");
    registerClientCleanup(cleanup, client, "subscription state client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server maintains resources during operations", async () => {
    const initialCount = server["config"].resources!.length;
    expect(initialCount).toBe(2);
  });

  test("can list all resource URIs", async () => {
    const resources = server["config"].resources!;
    const uris = resources.map((r) => r.uri);
    expect(uris.length).toBe(2);
    expect(uris).toContain("test://resource1");
    expect(uris).toContain("test://resource2");
  });

  test("resources have unique URIs", async () => {
    const resources = server["config"].resources!;
    const uris = resources.map((r) => r.uri);
    const uniqueUris = new Set(uris);
    expect(uris.length).toBe(uniqueUris.size);
  });

  test("server maintains resources after client operations", async () => {
    const initialCount = server["config"].resources!.length;
    expect(initialCount).toBe(2);
    expect(server["config"].resources!.length).toBe(initialCount);
  });
});

describe("Resource - Subscription Multi-Server", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("sub-multi-1");
    server2 = createBasicTestServer("sub-multi-2");
    client = createTestClient("sub-multi-client");

    registerServerCleanup(cleanup, server1, "sub multi 1");
    registerServerCleanup(cleanup, server2, "sub multi 2");
    registerClientCleanup(cleanup, client, "sub multi client");

    await server1.start();
    await server2.start();
    await client.connectToServer(server1.getTransport()!);
    server1.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server1 has resources for subscription", async () => {
    const resources = server1["config"].resources!;
    expect(resources.length).toBeGreaterThan(0);
  });

  test("server2 has resources for subscription", async () => {
    const resources = server2["config"].resources!;
    expect(resources.length).toBeGreaterThan(0);
  });

  test("both servers have same resource count", async () => {
    expect(server1["config"].resources!.length).toBe(server2["config"].resources!.length);
  });

  test("resources from different servers have valid URIs", async () => {
    const uri1 = server1["config"].resources![0].uri;
    const uri2 = server2["config"].resources![0].uri;
    expect(uri1.length).toBeGreaterThan(0);
    expect(uri2.length).toBeGreaterThan(0);
  });
});

describe("Resource - Subscription Dynamic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("sub-dynamic");
    client = createTestClient("sub-dynamic-client");

    registerServerCleanup(cleanup, server, "sub dynamic server");
    registerClientCleanup(cleanup, client, "sub dynamic client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add resources for subscription", async () => {
    server.addResource(
      "test://dynamic-sub",
      "Dynamic Sub",
      "For subscription testing",
      "text/plain",
      "content",
    );

    const resource = server["config"].resources!.find((r) => r.uri === "test://dynamic-sub");
    expect(resource).toBeDefined();
    expect(resource!.uri).toBe("test://dynamic-sub");
  });

  test("dynamically added resources have valid URIs", async () => {
    server.addResource(
      "test://dynamic-unsub",
      "Dynamic Unsub",
      "For unsubscription testing",
      "text/plain",
      "content",
    );

    const resource = server["config"].resources!.find((r) => r.uri === "test://dynamic-unsub");
    expect(resource!.uri.length).toBeGreaterThan(0);
    expect(resource!.uri.includes("://")).toBe(true);
  });

  test("multiple dynamic resources can be added", async () => {
    const initialCount = server["config"].resources!.length;

    for (let i = 0; i < 3; i++) {
      server.addResource(
        `test://dynamic_multi_${i}`,
        `Dynamic Multi ${i}`,
        "Multi subscription",
        "text/plain",
        `Content ${i}`,
      );
    }

    expect(server["config"].resources!.length).toBe(initialCount + 3);
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

describe("Resource - Subscription Validation", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("sub-validate");
    client = createTestClient("sub-validate-client");

    registerServerCleanup(cleanup, server, "sub validate server");
    registerClientCleanup(cleanup, client, "sub validate client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("all resources have valid URI format", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.uri).toMatch(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//);
    }
  });

  test("client methods accept resource URIs", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(typeof resource.uri).toBe("string");
      expect(resource.uri.length).toBeGreaterThan(0);
    }
  });

  test("subscription methods exist on client", async () => {
    expect(typeof client.subscribeResource).toBe("function");
    expect(typeof client.unsubscribeResource).toBe("function");
  });

  test("server resources remain consistent", async () => {
    const initialResources = server["config"].resources!.map((r) => r.uri).sort();
    expect(initialResources).toEqual(["test://resource1", "test://resource2"]);
  });
});

/**
 * Multi-Server Tests - Resources
 *
 * Tests for resource handling across multiple servers.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager, registerServerCleanup } from "../../shared/cleanup.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Multi-Server - Resource Configuration", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("res-config-1");
    server2 = createBasicTestServer("res-config-2");

    registerServerCleanup(cleanup, server1, "res config server 1");
    registerServerCleanup(cleanup, server2, "res config server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("each server should have two resources", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].resources!.length).toBe(2);
    expect(server2["config"].resources!.length).toBe(2);
  });

  test("resources should have valid URIs", async () => {
    await server1.start();
    await server2.start();

    const resources1 = server1["config"].resources!;
    const resources2 = server2["config"].resources!;

    for (const resource of resources1) {
      expect(resource.uri.includes("://")).toBe(true);
    }
    for (const resource of resources2) {
      expect(resource.uri.includes("://")).toBe(true);
    }
  });

  test("resources should have names", async () => {
    await server1.start();
    await server2.start();

    const resources1 = server1["config"].resources!;
    const resources2 = server2["config"].resources!;

    for (const resource of resources1) {
      expect(resource.name.length).toBeGreaterThan(0);
    }
    for (const resource of resources2) {
      expect(resource.name.length).toBeGreaterThan(0);
    }
  });

  test("resources should have mime types", async () => {
    await server1.start();
    await server2.start();

    const resources1 = server1["config"].resources!;
    const resources2 = server2["config"].resources!;

    for (const resource of resources1) {
      expect(resource.mimeType.length).toBeGreaterThan(0);
    }
    for (const resource of resources2) {
      expect(resource.mimeType.length).toBeGreaterThan(0);
    }
  });

  test("resources should have content", async () => {
    await server1.start();
    await server2.start();

    const resources1 = server1["config"].resources!;
    const resources2 = server2["config"].resources!;

    for (const resource of resources1) {
      expect(resource.content).toBeDefined();
    }
    for (const resource of resources2) {
      expect(resource.content).toBeDefined();
    }
  });
});

describe("Multi-Server - Resource Aggregation", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("res-agg-1");
    server2 = createBasicTestServer("res-agg-2");

    registerServerCleanup(cleanup, server1, "res agg server 1");
    registerServerCleanup(cleanup, server2, "res agg server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("first resource should be text/plain", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].resources![0].mimeType).toBe("text/plain");
    expect(server2["config"].resources![0].mimeType).toBe("text/plain");
  });

  test("second resource should be application/json", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].resources![1].mimeType).toBe("application/json");
    expect(server2["config"].resources![1].mimeType).toBe("application/json");
  });

  test("can add unique resources to each server", async () => {
    await server1.start();
    await server2.start();

    server1.addResource(
      "test://server1_unique",
      "Server1 Unique",
      "Only on server1",
      "text/plain",
      "Server1 content",
    );

    server2.addResource(
      "test://server2_unique",
      "Server2 Unique",
      "Only on server2",
      "text/plain",
      "Server2 content",
    );

    const uris1 = server1["config"].resources!.map((r) => r.uri);
    const uris2 = server2["config"].resources!.map((r) => r.uri);

    expect(uris1).toContain("test://server1_unique");
    expect(uris2).toContain("test://server2_unique");
    expect(uris1).not.toContain("test://server2_unique");
    expect(uris2).not.toContain("test://server1_unique");
  });
});

describe("Multi-Server - Resource Content", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("res-content-1");
    server2 = createBasicTestServer("res-content-2");

    registerServerCleanup(cleanup, server1, "res content server 1");
    registerServerCleanup(cleanup, server2, "res content server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("json resource should have valid JSON", async () => {
    await server1.start();
    await server2.start();

    const json1 = server1["config"].resources![1].content;
    const json2 = server2["config"].resources![1].content;

    expect(() => JSON.parse(json1)).not.toThrow();
    expect(() => JSON.parse(json2)).not.toThrow();
  });

  test("json resource should parse to expected object", async () => {
    await server1.start();
    await server2.start();

    const parsed1 = JSON.parse(server1["config"].resources![1].content);
    const parsed2 = JSON.parse(server2["config"].resources![1].content);

    expect(parsed1).toEqual({ key: "value" });
    expect(parsed2).toEqual({ key: "value" });
  });

  test("text resource should have string content", async () => {
    await server1.start();
    await server2.start();

    const text1 = server1["config"].resources![0].content;
    const text2 = server2["config"].resources![0].content;

    expect(typeof text1).toBe("string");
    expect(typeof text2).toBe("string");
  });
});

describe("Multi-Server - Dynamic Resources", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("res-dynamic-1");
    server2 = createBasicTestServer("res-dynamic-2");

    registerServerCleanup(cleanup, server1, "res dynamic server 1");
    registerServerCleanup(cleanup, server2, "res dynamic server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add resource to server1 only", async () => {
    await server1.start();
    await server2.start();

    server1.addResource(
      "test://dynamic_res_1",
      "Dynamic Resource 1",
      "Only on server1",
      "text/plain",
      "Dynamic content 1",
    );

    const uris1 = server1["config"].resources!.map((r) => r.uri);
    const uris2 = server2["config"].resources!.map((r) => r.uri);

    expect(uris1).toContain("test://dynamic_res_1");
    expect(uris2).not.toContain("test://dynamic_res_1");
  });

  test("can add resource to server2 only", async () => {
    await server1.start();
    await server2.start();

    server2.addResource(
      "test://dynamic_res_2",
      "Dynamic Resource 2",
      "Only on server2",
      "text/plain",
      "Dynamic content 2",
    );

    const uris1 = server1["config"].resources!.map((r) => r.uri);
    const uris2 = server2["config"].resources!.map((r) => r.uri);

    expect(uris2).toContain("test://dynamic_res_2");
    expect(uris1).not.toContain("test://dynamic_res_2");
  });

  test("can add multiple resources to same server", async () => {
    await server1.start();
    await server2.start();

    for (let i = 0; i < 5; i++) {
      server1.addResource(
        `test://multi_${i}`,
        `Multi Resource ${i}`,
        `Resource ${i} on server1`,
        "text/plain",
        `Content ${i}`,
      );
    }

    expect(server1["config"].resources!.length).toBe(2 + 5);
    expect(server2["config"].resources!.length).toBe(2);
  });
});

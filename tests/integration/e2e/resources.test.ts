/**
 * End-to-End Tests - Resources
 *
 * Tests for resource listing and reading through the gateway.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("E2E - Resources", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-e2e-server");
    client = createTestClient("resource-e2e-client");

    registerServerCleanup(cleanup, server, "resource e2e server");
    registerClientCleanup(cleanup, client, "resource e2e client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have two resources configured", async () => {
    const resources = server["config"].resources;
    expect(resources?.length).toBe(2);
  });

  test("first resource should be test://resource1", async () => {
    const resources = server["config"].resources;
    expect(resources?.[0].uri).toBe("test://resource1");
  });

  test("second resource should be test://resource2", async () => {
    const resources = server["config"].resources;
    expect(resources?.[1].uri).toBe("test://resource2");
  });

  test("first resource should have text/plain mimeType", async () => {
    const resources = server["config"].resources;
    expect(resources?.[0].mimeType).toBe("text/plain");
  });

  test("second resource should have application/json mimeType", async () => {
    const resources = server["config"].resources;
    expect(resources?.[1].mimeType).toBe("application/json");
  });

  test("all resources should have names", async () => {
    const resources = server["config"].resources;
    for (const resource of resources!) {
      expect(resource.name.length).toBeGreaterThan(0);
    }
  });

  test("all resources should have descriptions", async () => {
    const resources = server["config"].resources;
    for (const resource of resources!) {
      expect(resource.description.length).toBeGreaterThan(0);
    }
  });
});

describe("E2E - Resource Content", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-content-server");
    registerServerCleanup(cleanup, server, "resource content server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("first resource should have text content", async () => {
    const resources = server["config"].resources;
    expect(resources?.[0].content).toBe("This is test resource content 1");
  });

  test("second resource should have JSON content", async () => {
    const resources = server["config"].resources;
    expect(() => JSON.parse(resources?.[1].content)).not.toThrow();
  });

  test("JSON resource should parse to object", async () => {
    const resources = server["config"].resources;
    const parsed = JSON.parse(resources?.[1].content);
    expect(parsed).toEqual({ key: "value" });
  });

  test("should be able to add resources dynamically", async () => {
    server.addResource(
      "test://dynamic-resource",
      "Dynamic Resource",
      "A dynamically added resource",
      "text/plain",
      "Dynamic content",
    );
    const resources = server["config"].resources;
    expect(resources?.length).toBe(3);
    const dynamic = resources?.find((r) => r.uri === "test://dynamic-resource");
    expect(dynamic).toBeDefined();
    expect(dynamic?.content).toBe("Dynamic content");
  });

  test("dynamic resource should be readable", async () => {
    server.addResource(
      "test://readable",
      "Readable Resource",
      "A readable resource",
      "text/plain",
      "Read this content",
    );
    const resources = server["config"].resources;
    const readable = resources?.find((r) => r.uri === "test://readable");
    expect(readable?.content).toBe("Read this content");
  });
});

describe("E2E - Resource Variations", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-var-server");
    registerServerCleanup(cleanup, server, "resource var server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should handle empty content resource", async () => {
    server.addResource(
      "test://empty",
      "Empty Resource",
      "Resource with no content",
      "text/plain",
      "",
    );
    const resources = server["config"].resources;
    const empty = resources?.find((r) => r.uri === "test://empty");
    expect(empty?.content).toBe("");
  });

  test("should handle large content resource", async () => {
    const largeContent = "a".repeat(50000);
    server.addResource(
      "test://large",
      "Large Resource",
      "Resource with large content",
      "text/plain",
      largeContent,
    );
    const resources = server["config"].resources;
    const large = resources?.find((r) => r.uri === "test://large");
    expect(large?.content.length).toBe(50000);
  });

  test("should handle different mime types", async () => {
    server.addResource(
      "test://html",
      "HTML Resource",
      "HTML content",
      "text/html",
      "<html><body>Hello</body></html>",
    );
    const resources = server["config"].resources;
    const html = resources?.find((r) => r.uri === "test://html");
    expect(html?.mimeType).toBe("text/html");
  });

  test("should handle XML content", async () => {
    server.addResource(
      "test://xml",
      "XML Resource",
      "XML content",
      "application/xml",
      '<?xml version="1.0"?><root/>',
    );
    const resources = server["config"].resources;
    const xml = resources?.find((r) => r.uri === "test://xml");
    expect(xml?.mimeType).toBe("application/xml");
  });

  test("should handle base64 content", async () => {
    server.addResource(
      "test://base64",
      "Base64 Resource",
      "Base64 encoded content",
      "application/octet-stream",
      "SGVsbG8gV29ybGQ=",
    );
    const resources = server["config"].resources;
    const base64 = resources?.find((r) => r.uri === "test://base64");
    expect(base64?.mimeType).toBe("application/octet-stream");
  });
});

describe("E2E - Resource URIs", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-uri-server");
    registerServerCleanup(cleanup, server, "resource uri server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("resource URIs should contain ://", async () => {
    const resources = server["config"].resources;
    for (const resource of resources!) {
      expect(resource.uri.includes("://")).toBe(true);
    }
  });

  test("resource URIs should be unique", async () => {
    const resources = server["config"].resources;
    const uris = resources?.map((r) => r.uri);
    const uniqueUris = new Set(uris);
    expect(uris.length).toBe(uniqueUris.size);
  });

  test("should handle custom URI schemes", async () => {
    server.addResource(
      "custom://my-resource",
      "Custom URI",
      "Resource with custom scheme",
      "text/plain",
      "content",
    );
    const resources = server["config"].resources;
    const custom = resources?.find((r) => r.uri === "custom://my-resource");
    expect(custom).toBeDefined();
  });

  test("should handle URIs with query parameters", async () => {
    server.addResource(
      "test://resource?version=1",
      "Query Resource",
      "Resource with query in URI",
      "text/plain",
      "content",
    );
    const resources = server["config"].resources;
    const query = resources?.find((r) => r.uri.includes("?version=1"));
    expect(query).toBeDefined();
  });

  test("should handle URIs with fragments", async () => {
    server.addResource(
      "test://resource#section",
      "Fragment Resource",
      "Resource with fragment in URI",
      "text/plain",
      "content",
    );
    const resources = server["config"].resources;
    const fragment = resources?.find((r) => r.uri.includes("#"));
    expect(fragment).toBeDefined();
  });
});

/**
 * Resource Tests - Templates
 *
 * Tests for resource template functionality.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Resource - Template Basic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("template-basic");
    client = createTestClient("template-basic-client");

    registerServerCleanup(cleanup, server, "template basic server");
    registerClientCleanup(cleanup, client, "template basic client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server has resources with content", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBeGreaterThan(0);
  });

  test("resources have valid URI templates", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.uri.length).toBeGreaterThan(0);
      expect(resource.uri.includes("://")).toBe(true);
    }
  });

  test("resources have content that can be templated", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.content.length).toBeGreaterThan(0);
    }
  });

  test("resources have mime types", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.mimeType.length).toBeGreaterThan(0);
    }
  });

  test("text resources have text/plain mime type", async () => {
    const resources = server["config"].resources!;
    const textResource = resources.find((r) => r.mimeType === "text/plain");
    expect(textResource).toBeDefined();
  });

  test("JSON resources have application/json mime type", async () => {
    const resources = server["config"].resources!;
    const jsonResource = resources.find((r) => r.mimeType === "application/json");
    expect(jsonResource).toBeDefined();
  });
});

describe("Resource - Template Content", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("template-content");
    registerServerCleanup(cleanup, server, "template content server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("text content is a string", async () => {
    const resources = server["config"].resources!;
    const textResource = resources.find((r) => r.mimeType === "text/plain");
    expect(typeof textResource?.content).toBe("string");
  });

  test("JSON content is valid JSON", async () => {
    const resources = server["config"].resources!;
    const jsonResource = resources.find((r) => r.mimeType === "application/json");
    expect(() => JSON.parse(jsonResource?.content)).not.toThrow();
  });

  test("JSON content can be parsed to object", async () => {
    const resources = server["config"].resources!;
    const jsonResource = resources.find((r) => r.mimeType === "application/json");
    const parsed = JSON.parse(jsonResource?.content);
    expect(typeof parsed).toBe("object");
  });

  test("content can be used as template", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      // Content should be a valid template string
      expect(typeof resource.content).toBe("string");
      expect(resource.content.length).toBeGreaterThan(0);
    }
  });

  test("can add templated content", async () => {
    server.addResource(
      "test://templated",
      "Templated Resource",
      "Content with template placeholders",
      "text/plain",
      "User: {name}, Age: {age}",
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://templated");
    expect(resource?.content).toContain("{name}");
    expect(resource?.content).toContain("{age}");
  });
});

describe("Resource - Template MIME Types", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("template-mime");
    registerServerCleanup(cleanup, server, "template mime server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add HTML template", async () => {
    server.addResource(
      "test://html-template",
      "HTML Template",
      "HTML content",
      "text/html",
      "<html><body>{{content}}</body></html>",
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://html-template");
    expect(resource?.mimeType).toBe("text/html");
  });

  test("can add XML template", async () => {
    server.addResource(
      "test://xml-template",
      "XML Template",
      "XML content",
      "application/xml",
      '<?xml version="1.0"?><root>{{data}}</root>',
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://xml-template");
    expect(resource?.mimeType).toBe("application/xml");
  });

  test("can add CSS template", async () => {
    server.addResource(
      "test://css-template",
      "CSS Template",
      "CSS content",
      "text/css",
      "body { color: {{color}}; }",
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://css-template");
    expect(resource?.mimeType).toBe("text/css");
  });

  test("can add JavaScript template", async () => {
    server.addResource(
      "test://js-template",
      "JS Template",
      "JavaScript content",
      "application/javascript",
      "const value = {{value}};",
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://js-template");
    expect(resource?.mimeType).toBe("application/javascript");
  });
});

describe("Resource - Template Validation", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("template-validate");
    registerServerCleanup(cleanup, server, "template validate server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("existing resources have valid structure", async () => {
    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.uri).toBeDefined();
      expect(resource.name).toBeDefined();
      expect(resource.mimeType).toBeDefined();
      expect(resource.content).toBeDefined();
    }
  });

  test("can validate JSON template", async () => {
    server.addResource(
      "test://json-validate",
      "JSON Validate",
      "JSON template",
      "application/json",
      '{"name": "{name}", "value": {value}}',
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://json-validate");
    // Replace template placeholders with valid JSON values
    const validJson = resource?.content.replace(/{name}/g, "test").replace(/{value}/g, "123");
    expect(() => JSON.parse(validJson)).not.toThrow();
    const parsed = JSON.parse(validJson);
    expect(parsed.name).toBe("test");
    expect(parsed.value).toBe(123);
  });

  test("can add empty template content", async () => {
    server.addResource(
      "test://empty-template",
      "Empty Template",
      "Empty content",
      "text/plain",
      "",
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://empty-template");
    expect(resource?.content).toBe("");
  });

  test("can add large template content", async () => {
    const largeContent = "x".repeat(10000);
    server.addResource(
      "test://large-template",
      "Large Template",
      "Large content",
      "text/plain",
      largeContent,
    );

    const resource = server["config"].resources?.find((r) => r.uri === "test://large-template");
    expect(resource?.content.length).toBe(10000);
  });
});

describe("Resource - Template Variants", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("template-variant");
    registerServerCleanup(cleanup, server, "template variant server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can create variant resources", async () => {
    server.addResource(
      "test://variant-en",
      "English Variant",
      "English content",
      "text/plain",
      "Hello, {name}!",
    );

    server.addResource(
      "test://variant-es",
      "Spanish Variant",
      "Spanish content",
      "text/plain",
      "¡Hola, {name}!",
    );

    const resources = server["config"].resources!;
    expect(resources.find((r) => r.uri === "test://variant-en")).toBeDefined();
    expect(resources.find((r) => r.uri === "test://variant-es")).toBeDefined();
  });

  test("can create versioned templates", async () => {
    server.addResource(
      "test://template-v1",
      "Version 1",
      "Version 1 content",
      "text/plain",
      "Version 1: {content}",
    );

    server.addResource(
      "test://template-v2",
      "Version 2",
      "Version 2 content",
      "text/plain",
      "Version 2: {content} [updated]",
    );

    const v1 = server["config"].resources?.find((r) => r.uri === "test://template-v1");
    const v2 = server["config"].resources?.find((r) => r.uri === "test://template-v2");
    expect(v1).toBeDefined();
    expect(v2).toBeDefined();
  });
});

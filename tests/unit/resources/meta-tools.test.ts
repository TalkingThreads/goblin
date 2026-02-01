import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Config } from "../../../src/config/index.js";
import type { Registry } from "../../../src/gateway/registry.js";
import type { Router } from "../../../src/gateway/router.js";
import {
  catalogResources,
  catalogResourceTemplates,
  describeResource,
  searchResources,
} from "../../../src/tools/meta/resources.js";

interface ResourceResult {
  resources: Array<{
    uri: string;
    description: string;
    mimeType: string;
    serverId: string;
    score?: number;
  }>;
}

interface TemplateResult {
  templates: Array<{
    uriTemplate: string;
    description: string;
    serverId: string;
  }>;
}

describe("Resource Meta Tools", () => {
  let mockRegistry: Registry;
  let mockConfig: Config;
  let mockRouter: Router;

  beforeEach(() => {
    mockRegistry = {
      listResources: mock(() => [
        {
          def: {
            uri: "file:///home/user/docs/readme.md",
            name: "README.md",
            description: "Project README documentation",
            mimeType: "text/markdown",
          },
          serverId: "filesystem",
        },
        {
          def: {
            uri: "file:///home/user/config/settings.json",
            name: "settings.json",
            description: "User configuration file",
            mimeType: "application/json",
          },
          serverId: "filesystem",
        },
        {
          def: {
            uri: "https://api.example.com/data",
            name: "API Data",
            description: "REST API endpoint data",
            mimeType: "application/json",
          },
          serverId: "http-api",
        },
      ]),
      listResourceTemplates: mock(() => [
        {
          def: {
            uriTemplate: "file:///{path}",
            name: "File Template",
            description: "Template for file resources",
          },
          serverId: "filesystem",
        },
        {
          def: {
            uriTemplate: "s3://{bucket}/{key}",
            name: "S3 Template",
            description: "Template for S3 resources",
          },
          serverId: "s3-storage",
        },
      ]),
      getResource: mock((uri: string) => {
        const resources = mockRegistry.listResources();
        return resources.find((r) => r.def.uri === uri);
      }),
    } as unknown as Registry;

    mockConfig = {} as Config;
    mockRouter = {} as Router;
  });

  describe("catalogResources", () => {
    test("should list all resources when no filters", async () => {
      const result = (await catalogResources.execute(
        {},
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources).toHaveLength(3);
      expect(result.resources[0].uri).toBe("file:///home/user/docs/readme.md");
      expect(result.resources[0].serverId).toBe("filesystem");
    });

    test("should filter resources by serverId", async () => {
      const result = (await catalogResources.execute(
        { serverId: "filesystem" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources).toHaveLength(2);
      expect(result.resources.every((r) => r.serverId === "filesystem")).toBe(true);
    });

    test("should filter resources by mimeType", async () => {
      const result = (await catalogResources.execute(
        { mimeType: "application/json" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources).toHaveLength(2);
      expect(result.resources.every((r) => r.mimeType === "application/json")).toBe(true);
    });

    test("should return empty for non-existent server", async () => {
      const result = (await catalogResources.execute(
        { serverId: "nonexistent" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources).toHaveLength(0);
    });
  });

  describe("describeResource", () => {
    test("should return detailed info for existing resource", async () => {
      const result = await describeResource.execute(
        { uri: "file:///home/user/docs/readme.md" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      );

      expect(result.uri).toBe("file:///home/user/docs/readme.md");
      expect(result.description).toBe("Project README documentation");
      expect(result.mimeType).toBe("text/markdown");
      expect(result.serverId).toBe("filesystem");
    });

    test("should throw error for non-existent resource", async () => {
      await expect(
        describeResource.execute(
          { uri: "nonexistent://resource" },
          { registry: mockRegistry, config: mockConfig, router: mockRouter },
        ),
      ).rejects.toThrow("Resource not found: nonexistent://resource");
    });
  });

  describe("searchResources", () => {
    test("should search resources by URI", async () => {
      const result = (await searchResources.execute(
        { query: "readme" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources.length).toBeGreaterThanOrEqual(1);
      expect(result.resources.some((r) => r.uri.includes("readme"))).toBe(true);
    });

    test("should search resources by description", async () => {
      const result = (await searchResources.execute(
        { query: "configuration" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources.length).toBeGreaterThanOrEqual(1);
      expect(result.resources.some((r) => r.description.toLowerCase().includes("config"))).toBe(
        true,
      );
    });

    test("should return empty for no matches", async () => {
      const result = (await searchResources.execute(
        { query: "nonexistent12345" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources).toHaveLength(0);
    });

    test("should return scores for results", async () => {
      const result = (await searchResources.execute(
        { query: "file" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as ResourceResult;

      expect(result.resources.length).toBeGreaterThan(0);
      result.resources.forEach((resource) => {
        expect(resource.score).toBeDefined();
        expect(typeof resource.score).toBe("number");
      });
    });
  });

  describe("catalogResourceTemplates", () => {
    test("should list all templates when no serverId filter", async () => {
      const result = (await catalogResourceTemplates.execute(
        {},
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as TemplateResult;

      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].uriTemplate).toBe("file:///{path}");
    });

    test("should filter templates by serverId", async () => {
      const result = (await catalogResourceTemplates.execute(
        { serverId: "s3-storage" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as TemplateResult;

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].serverId).toBe("s3-storage");
    });
  });
});

import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Config } from "../../../src/config/index.js";
import type { Registry } from "../../../src/gateway/registry.js";
import type { Router } from "../../../src/gateway/router.js";
import { catalogPrompts, describePrompt, searchPrompts } from "../../../src/tools/meta/prompts.js";

interface PromptResult {
  prompts: Array<{
    name: string;
    description: string;
    arguments: string[];
    serverId: string;
    score?: number;
  }>;
}

interface DescribeResult {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
  serverId: string;
}

describe("Prompt Meta Tools", () => {
  let mockRegistry: Registry;
  let mockConfig: Config;
  let mockRouter: Router;

  beforeEach(() => {
    mockRegistry = {
      getAllPrompts: mock(() => [
        {
          id: "server1_prompt1",
          def: {
            name: "prompt1",
            description: "Test prompt 1 description",
            arguments: [
              { name: "arg1", description: "First argument", required: true },
              { name: "arg2", description: "Second argument", required: false },
            ],
          },
          serverId: "server1",
        },
        {
          id: "server2_codeReview",
          def: {
            name: "codeReview",
            description: "Review code for best practices",
            arguments: [{ name: "code", description: "Code to review", required: true }],
          },
          serverId: "server2",
        },
        {
          id: "server1_summary",
          def: {
            name: "summary",
            description:
              "Generate a summary of the provided text. This is a longer description to test truncation.",
            arguments: [],
          },
          serverId: "server1",
        },
      ]),
      getPrompt: mock((name: string) => {
        const prompts = mockRegistry.getAllPrompts();
        return prompts.find((p) => p.id === name);
      }),
    } as unknown as Registry;

    mockConfig = {} as Config;
    mockRouter = {} as Router;
  });

  describe("catalogPrompts", () => {
    test("should list all prompts when no serverId filter", async () => {
      const result = (await catalogPrompts.execute(
        { serverId: undefined },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      expect(result.prompts).toHaveLength(3);
      expect(result.prompts[0].name).toBe("server1_prompt1");
      expect(result.prompts[0].serverId).toBe("server1");
      expect(result.prompts[0].arguments).toEqual(["arg1", "arg2"]);
    });

    test("should filter prompts by serverId", async () => {
      const result = (await catalogPrompts.execute(
        { serverId: "server1" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      expect(result.prompts).toHaveLength(2);
      expect(result.prompts.every((p) => p.serverId === "server1")).toBe(true);
    });

    test("should return empty array for non-existent server", async () => {
      const result = (await catalogPrompts.execute(
        { serverId: "nonexistent" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      expect(result.prompts).toHaveLength(0);
    });

    test("should handle prompts with no arguments", async () => {
      const result = (await catalogPrompts.execute(
        {},
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      const summaryPrompt = result.prompts.find((p) => p.name === "server1_summary");
      expect(summaryPrompt?.arguments).toEqual([]);
    });
  });

  describe("describePrompt", () => {
    test("should return detailed info for existing prompt", async () => {
      const result = (await describePrompt.execute(
        { name: "server1_prompt1" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as DescribeResult;

      expect(result.name).toBe("server1_prompt1");
      expect(result.description).toBe("Test prompt 1 description");
      expect(result.serverId).toBe("server1");
      expect(result.arguments).toHaveLength(2);
      expect(result.arguments[0]?.name).toBe("arg1");
    });

    test("should throw error for non-existent prompt", async () => {
      await expect(
        describePrompt.execute(
          { name: "nonexistent_prompt" },
          { registry: mockRegistry, config: mockConfig, router: mockRouter },
        ),
      ).rejects.toThrow("Prompt not found: nonexistent_prompt");
    });
  });

  describe("searchPrompts", () => {
    test("should search prompts by name", async () => {
      const result = (await searchPrompts.execute(
        { query: "codeReview" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].name).toBe("server2_codeReview");
    });

    test("should search prompts by description", async () => {
      const result = (await searchPrompts.execute(
        { query: "review" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      expect(result.prompts.length).toBeGreaterThanOrEqual(1);
      expect(result.prompts.some((p) => p.description.toLowerCase().includes("review"))).toBe(true);
    });

    test("should return empty for no matches", async () => {
      const result = (await searchPrompts.execute(
        { query: "nonexistent12345" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      expect(result.prompts).toHaveLength(0);
    });

    test("should return scores for results", async () => {
      const result = (await searchPrompts.execute(
        { query: "prompt" },
        { registry: mockRegistry, config: mockConfig, router: mockRouter },
      )) as PromptResult;

      expect(result.prompts.length).toBeGreaterThan(0);
      result.prompts.forEach((prompt) => {
        expect(prompt.score).toBeDefined();
        expect(typeof prompt.score).toBe("number");
      });
    });
  });
});

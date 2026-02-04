import { describe, expect, test } from "bun:test";
import type { Registry } from "../../../src/gateway/registry.js";
import type { Router } from "../../../src/gateway/router.js";
import { SlashCommandConflictError, SlashCommandRouter } from "../../../src/slashes/router.js";

interface MockPrompt {
  id: string;
  def: {
    name: string;
    description: string;
    arguments: Array<{ name: string; required?: boolean; description?: string }>;
  };
  serverId: string;
}

describe("SlashCommandRouter", () => {
  const mockPrompts: MockPrompt[] = [
    {
      id: "filesystem_init",
      def: { name: "init", description: "Initialize a project", arguments: [] },
      serverId: "filesystem",
    },
    {
      id: "github_init",
      def: { name: "init", description: "Initialize GitHub repo", arguments: [] },
      serverId: "github",
    },
    {
      id: "filesystem_list",
      def: { name: "list", description: "List files", arguments: [] },
      serverId: "filesystem",
    },
  ];

  const mockRegistry = {
    getAllPrompts: () => mockPrompts as any,
    getPrompt: (id: string) => mockPrompts.find((p) => p.id === id) as any,
  } as unknown as Registry;

  const mockRouter = {
    getPrompt: async () =>
      ({ content: [{ type: "text", text: "result" }] }) as {
        content: Array<{ type: string; text: string }>;
      },
  } as unknown as Router;

  const slashRouter = new SlashCommandRouter(mockRegistry, mockRouter);

  describe("resolveCommand", () => {
    test("should resolve namespaced command", () => {
      const result = slashRouter.resolveCommand("init", "filesystem");
      expect(result).toEqual({ name: "init", serverId: "filesystem" });
    });

    test("should resolve unnamespaced command", () => {
      const result = slashRouter.resolveCommand("list");
      expect(result).toEqual({ name: "list", serverId: "filesystem" });
    });

    test("should return null for unknown command", () => {
      const result = slashRouter.resolveCommand("unknown");
      expect(result).toBeNull();
    });

    test("should return null for unknown server", () => {
      const result = slashRouter.resolveCommand("init", "unknown");
      expect(result).toBeNull();
    });
  });

  describe("detectConflicts", () => {
    test("should detect conflict for ambiguous command", () => {
      const conflict = slashRouter.detectConflicts("init");
      expect(conflict).not.toBeNull();
      expect(conflict?.command).toBe("init");
      expect(conflict?.servers).toEqual(["filesystem", "github"]);
      expect(conflict?.suggestions).toEqual(["/filesystem_init", "/github_init"]);
    });

    test("should return null for unique command", () => {
      const conflict = slashRouter.detectConflicts("list");
      expect(conflict).toBeNull();
    });
  });

  describe("listCommands", () => {
    test("should list all commands", () => {
      const commands = slashRouter.listCommands();
      expect(commands).toHaveLength(3);
      expect(commands.map((c) => c.id)).toEqual([
        "filesystem_init",
        "github_init",
        "filesystem_list",
      ]);
    });
  });

  describe("listConflicts", () => {
    test("should list all conflicts", () => {
      const conflicts = slashRouter.listConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].command).toBe("init");
    });
  });

  describe("executeCommand", () => {
    test("should execute command successfully", async () => {
      const result = await slashRouter.executeCommand("list");
      expect(result.content).toEqual([{ type: "text", text: "result" }]);
    });

    test("should throw for unknown command", async () => {
      try {
        await slashRouter.executeCommand("unknown");
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect(error.message).toContain("unknown");
      }
    });

    test("should throw conflict for ambiguous command", async () => {
      await expect(slashRouter.executeCommand("init")).rejects.toThrow(SlashCommandConflictError);
    });

    test("should resolve with server qualification", async () => {
      const result = await slashRouter.executeCommand("init", "filesystem");
      expect(result.content).toEqual([{ type: "text", text: "result" }]);
    });
  });
});

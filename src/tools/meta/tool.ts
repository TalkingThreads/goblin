import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Get detailed description for a tool
 */
export const describeTool = defineMetaTool({
  name: "describe_tool",
  description: "Get detailed description for a tool and its schema.",
  parameters: z.object({
    name: z.string().describe("Name of the tool"),
  }),
  execute: async ({ name }, { registry }) => {
    const tool = registry.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return { tool: tool.def };
  },
});

/**
 * Call a downstream tool with argument validation
 */
export const invokeTool = defineMetaTool({
  name: "invoke_tool",
  description: "Call a downstream tool with argument validation.",
  parameters: z.object({
    name: z.string().describe("Name of the tool to invoke"),
    args: z.record(z.string(), z.unknown()).describe("Arguments for the tool"),
  }),
  execute: async ({ name, args }, { router }) => {
    // We delegate to the router to handle routing, caching, and execution
    return await router.callTool(name, args as Record<string, unknown>);
  },
});

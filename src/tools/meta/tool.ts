import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Get detailed description for a tool
 */
export const describeTool = defineMetaTool({
  name: "describe_tool",
  description:
    "GET TOOL DOCUMENTATION. Returns the full definition including description, parameters, and schema. USE THIS before invoking a tool to understand: what arguments it needs, what it returns, and when to use it. Always check the schema before calling unfamiliar tools.",
  parameters: z.object({
    name: z
      .string()
      .describe(
        "The tool name. Can include server prefix (server_toolname) or just the tool name if unambiguous.",
      ),
  }),
  execute: async ({ name }, { registry }) => {
    if (!name || name.trim() === "") {
      throw new Error("Missing required parameter: 'name' - the tool name to describe");
    }

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
  description:
    "EXECUTE A TOOL. Call any tool exposed by connected MCP servers with validated arguments. USE THIS to perform operations like file I/O, git commands, or API calls. The gateway handles routing to the correct backend. Argument schema is validated - use describe_tool first if unsure.",
  parameters: z.object({
    name: z
      .string()
      .describe(
        "Which tool to run. Include server prefix if needed (e.g., 'filesystem_list_files').",
      ),
    args: z
      .record(z.string(), z.unknown())
      .describe(
        "Input parameters matching the tool's schema. Omit optional parameters. Use describe_tool to verify the required schema.",
      ),
  }),
  execute: async ({ name, args }, { router }) => {
    // We delegate to the router to handle routing, caching, and execution
    return await router.callTool(name, args as Record<string, unknown>);
  },
});

import { z } from "zod";
import type { MetaToolDefinition } from "../meta/types.js";
import { defineMetaTool } from "../meta/types.js";
import { VirtualToolEngine } from "./engine.js";

/**
 * Helper to register virtual tools in the registry
 * Since virtual tools are dynamic, we don't define them statically.
 * Instead, we create a factory that generates MetaToolDefinitions.
 */
export function createVirtualToolDefinition(
  virtualToolId: string,
  description: string | undefined,
  inputSchema: z.ZodType = z.record(z.string(), z.unknown()), // Default schema matching engine expectations
): MetaToolDefinition {
  return defineMetaTool({
    name: virtualToolId,
    description: description || `Virtual tool: ${virtualToolId}`,
    parameters: inputSchema,
    execute: async (args, { router, config }) => {
      const engine = new VirtualToolEngine(router, config);
      return await engine.execute(virtualToolId, args as Record<string, unknown>);
    },
  });
}

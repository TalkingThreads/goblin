import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Config } from "../../config/index.js";
import type { Registry } from "../../gateway/registry.js";
import type { Router } from "../../gateway/router.js";

/**
 * Context passed to meta tool execution
 */
export interface MetaToolContext {
  registry: Registry;
  config: Config;
  router: Router;
}

/**
 * Type-safe definition of a meta tool
 */
export interface MetaToolDefinition<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  parameters: T;
  execute: (args: z.infer<T>, ctx: MetaToolContext) => Promise<unknown>;
}

/**
 * Helper to define a meta tool with type inference
 */
export function defineMetaTool<T extends z.ZodType>(
  def: MetaToolDefinition<T>,
): MetaToolDefinition<T> {
  return def;
}

/**
 * Convert MetaToolDefinition to MCP Tool schema
 */
export function toTool(def: MetaToolDefinition): Tool {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = zodToJsonSchema(def.parameters as any) as any;

  return {
    name: def.name,
    description: def.description,
    inputSchema: {
      type: "object",
      properties: schema.properties,
      required: schema.required,
    },
  };
}

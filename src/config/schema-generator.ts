/**
 * JSON Schema generation from Zod schemas
 */

import { writeFile } from "node:fs/promises";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createLogger } from "../observability/logger.js";
import { ensureConfigDir, getSchemaPath } from "./paths.js";
import { ConfigSchema } from "./schema.js";

const logger = createLogger("config-schema");

/**
 * Generate JSON Schema from Zod schema and write to file
 */
export async function generateSchema(): Promise<void> {
  await ensureConfigDir();

  const schemaPath = getSchemaPath();

  logger.info({ schemaPath }, "Generating JSON Schema");

  // Generate JSON Schema from Zod
  // biome-ignore lint/suspicious/noExplicitAny: Required for zodToJsonSchema type compatibility
  const jsonSchema = zodToJsonSchema(ConfigSchema as any, {
    name: "GoblinConfig",
    $refStrategy: "none",
  });

  // Add $schema and description
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...jsonSchema,
    description: "Goblin MCP Gateway Configuration",
  };

  // Write to file
  await writeFile(schemaPath, JSON.stringify(schema, null, 2), "utf-8");

  logger.info({ schemaPath }, "JSON Schema generated successfully");
}

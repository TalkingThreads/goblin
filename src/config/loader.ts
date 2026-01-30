/**
 * Configuration loader with atomic validation
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createLogger } from "../observability/logger.js";
import { getConfigPath } from "./paths.js";
import type { Config } from "./schema.js";
import { ConfigSchema } from "./schema.js";

const logger = createLogger("config-loader");

/**
 * Default configuration when no config file exists
 */
const DEFAULT_CONFIG: Config = {
  servers: [],
  gateway: {
    port: 3000,
    host: "127.0.0.1",
  },
  auth: {
    mode: "dev",
  },
  policies: {
    outputSizeLimit: 65536,
    defaultTimeout: 30000,
  },
};

/**
 * Load and validate configuration from file
 *
 * @returns Validated configuration or default config on error
 */
export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();

  // Use default config if file doesn't exist
  if (!existsSync(configPath)) {
    logger.info({ configPath }, "Config file not found, using defaults");
    return DEFAULT_CONFIG;
  }

  try {
    // Read and parse JSON
    const content = await readFile(configPath, "utf-8");
    const raw = JSON.parse(content);

    // Atomic validation with Zod
    const result = ConfigSchema.safeParse(raw);

    if (result.success) {
      logger.info({ configPath }, "Config loaded successfully");
      return result.data;
    }

    // Validation failed - log errors and use defaults
    logger.error(
      {
        configPath,
        errors: result.error.format(),
      },
      "Config validation failed, using defaults",
    );
    return DEFAULT_CONFIG;
  } catch (error: unknown) {
    // File read or JSON parse error
    if (error instanceof SyntaxError) {
      logger.error(
        { configPath, error: error.message },
        "Config file contains invalid JSON, using defaults",
      );
    } else {
      logger.error({ configPath, error }, "Failed to read config file, using defaults");
    }
    return DEFAULT_CONFIG;
  }
}

/**
 * Validate a raw config object without loading from file
 *
 * @param raw - Raw config object to validate
 * @returns Validated config if successful, null if validation fails
 */
export function validateConfig(raw: unknown): Config | null {
  const result = ConfigSchema.safeParse(raw);

  if (result.success) {
    return result.data;
  }

  logger.error({ errors: result.error.format() }, "Config validation failed");
  return null;
}

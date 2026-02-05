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
    transport: "both",
  },
  streamableHttp: {
    sseEnabled: true,
    sessionTimeout: 300000,
    maxSessions: 1000,
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
 * @param customPath - Optional custom path to config file
 * @returns Validated configuration or default config on error
 */
export async function loadConfig(customPath?: string): Promise<Config> {
  const configPath = customPath ?? getConfigPath();

  // Use default config if file doesn't exist
  if (!existsSync(configPath)) {
    if (customPath) {
      // If a custom path was requested but doesn't exist, this is an error
      throw new Error(`Configuration file not found at: ${configPath}`);
    }
    logger.info({ configPath }, "Configuration file not found");
    return DEFAULT_CONFIG;
  }

  try {
    // Read and parse JSON
    const content = await readFile(configPath, "utf-8");
    const raw = JSON.parse(content);

    // Atomic validation with Zod
    const result = ConfigSchema.safeParse(raw);

    if (result.success) {
      logger.info({ configPath }, "Configuration loaded");
      return result.data;
    }

    // Validation failed - log errors and use defaults
    logger.error(
      {
        configPath,
        errors: result.error.format(),
      },
      "Configuration validation failed",
    );

    if (customPath) {
      throw new Error(`Configuration validation failed for: ${configPath}`);
    }

    return DEFAULT_CONFIG;
  } catch (error: unknown) {
    // File read or JSON parse error
    if (error instanceof SyntaxError) {
      logger.error({ configPath, error: error.message }, "Configuration parsing failed");
    } else {
      logger.error({ configPath, error }, "Configuration read failed");
    }

    if (customPath) {
      throw error;
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

  logger.error({ errors: result.error.format() }, "Configuration validation failed");
  return null;
}

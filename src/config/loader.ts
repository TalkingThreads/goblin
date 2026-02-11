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
 * Display a user-facing warning for invalid configuration
 */
function displayConfigValidationWarning(
  configPath: string,
  error: { issues: Array<{ path: Array<string | number>; message: string }> },
): void {
  const formattedErrors = error.issues
    .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
    .join("\n");

  console.warn(
    `\n⚠️  Warning: Configuration file is invalid.\n` +
      `   Path: ${configPath}\n` +
      `   Errors:\n${formattedErrors}\n` +
      `   Using default configuration instead.\n` +
      `   Run 'goblin config validate --path "${configPath}"' for details.\n`,
  );
}

/**
 * Display a user-facing warning for JSON parse errors
 */
function displayJsonParseWarning(configPath: string, errorMessage: string): void {
  console.warn(
    `\n⚠️  Warning: Configuration file contains invalid JSON.\n` +
      `   Path: ${configPath}\n` +
      `   Error: ${errorMessage}\n` +
      `   Using default configuration instead.\n` +
      `   Run 'goblin config validate --path "${configPath}"' for details.\n`,
  );
}

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

    // Display user-facing warning for invalid default config
    const errorIssues = result.error.issues.map((e) => ({
      path: e.path as Array<string | number>,
      message: e.message,
    }));
    displayConfigValidationWarning(configPath, { issues: errorIssues });

    return DEFAULT_CONFIG;
  } catch (error: unknown) {
    // File read or JSON parse error
    if (error instanceof SyntaxError) {
      logger.error({ configPath, error: error.message }, "Configuration parsing failed");

      if (customPath) {
        throw error;
      }

      // Display user-facing warning for JSON parse errors
      displayJsonParseWarning(configPath, error.message);
    } else {
      logger.error({ configPath, error }, "Configuration read failed");

      if (customPath) {
        throw error;
      }
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

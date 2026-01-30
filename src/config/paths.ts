/**
 * Configuration file path resolution
 */

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import envPaths from "env-paths";

const paths = envPaths("goblin");

/**
 * Get the configuration directory path
 */
export function getConfigDir(): string {
  return paths.config;
}

/**
 * Get the configuration file path
 */
export function getConfigPath(): string {
  return join(paths.config, "config.json");
}

/**
 * Get the JSON Schema file path
 */
export function getSchemaPath(): string {
  return join(paths.config, "config.schema.json");
}

/**
 * Ensure the configuration directory exists
 */
export async function ensureConfigDir(): Promise<void> {
  const configDir = getConfigDir();

  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
}

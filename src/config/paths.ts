/**
 * Configuration file path resolution
 *
 * Uses user-visible locations for cross-platform consistency:
 * - Windows: %USERPROFILE%\.goblin\
 * - Linux: ~/.goblin\
 * - macOS: ~/.goblin\
 *
 * This ensures the config folder is easily accessible to users
 * without needing to navigate to hidden system directories.
 */

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Get the Goblin config directory path
 * Uses user home directory with .goblin folder for cross-platform consistency
 */
function getGoblinDir(): string {
  const home = homedir();
  return join(home, ".goblin");
}

/**
 * Get the configuration directory path
 */
export function getConfigDir(): string {
  return getGoblinDir();
}

/**
 * Get the configuration file path
 */
export function getConfigPath(): string {
  return join(getGoblinDir(), "config.json");
}

/**
 * Get the JSON Schema file path
 */
export function getSchemaPath(): string {
  return join(getGoblinDir(), "config.schema.json");
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

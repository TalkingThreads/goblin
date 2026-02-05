/**
 * Configuration initializer
 *
 * Handles first-run detection and automatic configuration setup.
 * Ensures the config directory and default config file exist.
 */

import { existsSync } from "node:fs";
import { getConfigPath } from "./paths.js";
import { ensureConfigDir, writeDefaultConfig } from "./writer.js";

export interface InitializationResult {
  /**
   * Path to the configuration file
   */
  configPath: string;
  /**
   * Whether this was the first run (config didn't exist before)
   */
  isFirstRun: boolean;
  /**
   * Whether the config was created (either first run or explicit reset)
   */
  wasCreated: boolean;
}

/**
 * Initialize the configuration system
 *
 * This function:
 * 1. Checks if the config directory exists, creates it if not
 * 2. Checks if the config file exists, creates default if not
 * 3. Returns information about the initialization
 *
 * @returns Initialization result with path and first-run status
 */
export async function initializeConfig(): Promise<InitializationResult> {
  const configPath = getConfigPath();
  const configExisted = existsSync(configPath);

  await ensureConfigDir();

  if (!configExisted) {
    await writeDefaultConfig();
    return {
      configPath,
      isFirstRun: true,
      wasCreated: true,
    };
  }

  return {
    configPath,
    isFirstRun: false,
    wasCreated: false,
  };
}

/**
 * Check if this is the first run (no config file exists)
 */
export function isFirstRun(): boolean {
  return !existsSync(getConfigPath());
}

/**
 * Force reinitialize config (create fresh default config)
 *
 * @returns Initialization result
 */
export async function resetConfig(): Promise<InitializationResult> {
  const configPath = getConfigPath();

  await ensureConfigDir();
  await writeDefaultConfig();

  return {
    configPath,
    isFirstRun: false,
    wasCreated: true,
  };
}

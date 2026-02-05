/**
 * Configuration file writer
 *
 * Handles writing configuration files to disk with proper
 * directory creation and error handling.
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DEFAULT_CONFIG_COMMENT } from "./defaults.js";
import { getConfigDir, getConfigPath } from "./paths.js";
import type { Config } from "./schema.js";

export interface WriteConfigOptions {
  /**
   * Custom path to write config to (optional)
   */
  customPath?: string;
  /**
   * Whether to include helpful comments in the config file
   */
  includeComments?: boolean;
}

/**
 * Write default configuration to disk
 *
 * @param options - Writing options
 * @returns The path to the written config file
 */
export async function writeDefaultConfig(options: WriteConfigOptions = {}): Promise<string> {
  const configPath = options.customPath ?? getConfigPath();
  const configDir = options.customPath ? join(options.customPath, "..") : getConfigDir();

  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }

  const content =
    options.includeComments !== false
      ? DEFAULT_CONFIG_COMMENT
      : JSON.stringify(DEFAULT_CONFIG_COMMENT, null, 2);

  await writeFile(configPath, content, "utf-8");
  return configPath;
}

/**
 * Write a custom configuration to disk
 *
 * @param config - The configuration object to write
 * @param options - Writing options
 * @returns The path to the written config file
 */
export async function writeConfig(
  config: Config,
  options: WriteConfigOptions = {},
): Promise<string> {
  const configPath = options.customPath ?? getConfigPath();
  const configDir = options.customPath ? join(options.customPath, "..") : getConfigDir();

  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }

  const content =
    options.includeComments !== false
      ? DEFAULT_CONFIG_COMMENT.replace(
          DEFAULT_CONFIG_COMMENT.substring(
            DEFAULT_CONFIG_COMMENT.indexOf("{"),
            DEFAULT_CONFIG_COMMENT.lastIndexOf("}") + 1,
          ),
          JSON.stringify(config, null, 2),
        )
      : JSON.stringify(config, null, 2);

  await writeFile(configPath, content, "utf-8");
  return configPath;
}

/**
 * Create the configuration directory if it doesn't exist
 *
 * @returns The path to the config directory
 */
export async function ensureConfigDir(): Promise<string> {
  const configDir = getConfigDir();

  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }

  return configDir;
}

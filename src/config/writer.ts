/**
 * Configuration file writer
 *
 * Handles writing configuration files to disk with atomic writes,
 * backup creation, and proper error handling.
 */

import { existsSync } from "node:fs";
import { copyFile, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "../observability/logger.js";
import { DEFAULT_CONFIG_COMMENT } from "./defaults.js";
import { getConfigDir, getConfigPath } from "./paths.js";
import { type Config, ConfigSchema } from "./schema.js";

const logger = createLogger("config-writer");

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
 * Error thrown when configuration writing fails
 */
export class ConfigWriteError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly path?: string,
  ) {
    super(message);
    this.name = "ConfigWriteError";
  }
}

/**
 * Configuration writer with atomic writes and backup support
 */
export class ConfigWriter {
  private configPath: string;
  private includeComments: boolean;

  constructor(options: { configPath?: string; includeComments?: boolean } = {}) {
    this.configPath = options.configPath ?? getConfigPath();
    this.includeComments = options.includeComments ?? false;
  }

  /**
   * Write configuration to disk with atomic write pattern
   *
   * @param config - The configuration object to write
   * @returns The path to the written config file
   * @throws ConfigWriteError if writing fails
   */
  async write(config: Config): Promise<string> {
    // Validate config before any file operations
    this.validateConfig(config);

    const configDir = join(this.configPath, "..");

    try {
      // Ensure directory exists
      if (!existsSync(configDir)) {
        await mkdir(configDir, { recursive: true });
      }

      // Create backup if config exists
      if (existsSync(this.configPath)) {
        await this.createBackup();
      }

      // Write to temp file
      const tempPath = await this.writeToTempFile(config);

      // Atomically rename temp file to target
      await rename(tempPath, this.configPath);

      logger.info({ path: this.configPath }, "Configuration written successfully");

      return this.configPath;
    } catch (error) {
      logger.error({ error, path: this.configPath }, "Failed to write configuration");

      // Provide actionable error message based on error type
      let detailedMessage = `Failed to write configuration to ${this.configPath}`;

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes("permission") || errorMessage.includes("access")) {
          detailedMessage +=
            `\n\nPossible solutions:\n` +
            `  1. Check file permissions: chmod 644 ${this.configPath}\n` +
            `  2. Ensure you have write access to the directory\n` +
            `  3. Check if the file is open in another application`;
        } else if (errorMessage.includes("enoent") || errorMessage.includes("no such file")) {
          detailedMessage +=
            `\n\nPossible solutions:\n` +
            `  1. Ensure the parent directory exists: ${join(this.configPath, "..")}\n` +
            `  2. Create the directory if needed`;
        } else if (errorMessage.includes("eacces")) {
          detailedMessage +=
            `\n\nPossible solutions:\n` +
            `  1. Check file permissions\n` +
            `  2. Run the application with appropriate privileges`;
        } else if (errorMessage.includes("ebusy") || errorMessage.includes("locked")) {
          detailedMessage +=
            `\n\nPossible solutions:\n` +
            `  1. The file may be open in another application\n` +
            `  2. Close the application that is using the file`;
        }
      }

      throw new ConfigWriteError(
        detailedMessage,
        error instanceof Error ? error : undefined,
        this.configPath,
      );
    }
  }

  /**
   * Validate configuration against schema
   *
   * @param config - The configuration to validate
   * @throws ConfigWriteError if validation fails
   */
  private validateConfig(config: Config): void {
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      const errors = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new ConfigWriteError(
        `Configuration validation failed: ${errors}\n\n` +
          `Run 'goblin config validate' for detailed error information.`,
      );
    }
  }

  /**
   * Create backup of existing config
   */
  private async createBackup(): Promise<void> {
    const backupPath = `${this.configPath}.backup`;
    try {
      await copyFile(this.configPath, backupPath);
      logger.debug({ path: this.configPath, backupPath }, "Backup created");
    } catch (error) {
      logger.warn({ error, path: this.configPath }, "Failed to create backup");
      // Continue even if backup fails - main write is more important
    }
  }

  /**
   * Write configuration to temporary file
   *
   * @param config - The configuration to write
   * @returns Path to the temporary file
   */
  private async writeToTempFile(config: Config): Promise<string> {
    const tempPath = `${this.configPath}.tmp.${Date.now()}`;
    const content = this.formatJson(config);

    try {
      await writeFile(tempPath, content, "utf-8");
      return tempPath;
    } catch (error) {
      // Clean up temp file on error
      try {
        if (existsSync(tempPath)) {
          await unlink(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Format configuration as JSON string
   *
   * @param config - The configuration to format
   * @returns Formatted JSON string
   */
  private formatJson(config: Config): string {
    const jsonContent = JSON.stringify(config, null, 2);

    if (this.includeComments) {
      // Replace the JSON content in the default comment template
      return DEFAULT_CONFIG_COMMENT.replace(
        DEFAULT_CONFIG_COMMENT.substring(
          DEFAULT_CONFIG_COMMENT.indexOf("{"),
          DEFAULT_CONFIG_COMMENT.lastIndexOf("}") + 1,
        ),
        jsonContent,
      );
    }

    return `${jsonContent}\n`;
  }
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
 * Write a custom configuration to disk using ConfigWriter
 *
 * @param config - The configuration object to write
 * @param options - Writing options
 * @returns The path to the written config file
 */
export async function writeConfig(
  config: Config,
  options: WriteConfigOptions = {},
): Promise<string> {
  const writer = new ConfigWriter({
    configPath: options.customPath,
    includeComments: options.includeComments,
  });

  return writer.write(config);
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

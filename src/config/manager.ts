/**
 * Configuration Manager
 *
 * Centralized singleton for managing Goblin configuration.
 * Handles:
 * - First-run initialization
 * - Config loading and caching
 * - Config path resolution
 * - Hot reload support
 *
 * Usage:
 * ```typescript
 * const config = await ConfigManager.initialize();
 * const port = config.gateway.port;
 * ```
 */

import { existsSync } from "node:fs";
import { createLogger } from "../observability/logger.js";
import { type InitializationResult, initializeConfig, resetConfig } from "./initializer.js";
import { loadConfig } from "./loader.js";
import { getConfigDir, getConfigPath, getSchemaPath } from "./paths.js";
import type { Config } from "./schema.js";
import { ensureConfigDir, writeConfig, writeDefaultConfig } from "./writer.js";

const logger = createLogger("config-manager");

export interface ConfigManagerOptions {
  /**
   * Enable logging for initialization events
   */
  enableLogging?: boolean;
  /**
   * Custom config path (overrides default location)
   */
  customPath?: string;
}

export interface ConfigInfo {
  /**
   * Path to the config file
   */
  path: string;
  /**
   * Path to the config schema
   */
  schemaPath: string;
  /**
   * Path to the config directory
   */
  directory: string;
  /**
   * Whether this is the first run
   */
  isFirstRun: boolean;
  /**
   * Whether the config was created on this initialization
   */
  wasCreated: boolean;
}

/**
 * Centralized configuration management for Goblin MCP Gateway
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: Config | null = null;
  private initialized = false;
  private initializing = false;
  private customPath: string | null = null;
  private info: ConfigInfo | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): ConfigManager {
    if (ConfigManager.instance === null) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize the configuration system
   *
   * This must be called before using getConfig()
   *
   * @param options - Configuration options
   * @returns ConfigInfo with path and initialization details
   */
  async initialize(options: ConfigManagerOptions = {}): Promise<ConfigInfo> {
    if (this.initialized && !options.customPath && this.info !== null) {
      return this.info;
    }

    if (this.initializing) {
      throw new Error("ConfigManager is already initializing");
    }

    this.initializing = true;
    this.customPath = options.customPath ?? null;

    try {
      let initResult: InitializationResult;

      if (options.customPath) {
        await ensureConfigDir();
        const existedBefore = existsSync(options.customPath);
        if (!existedBefore) {
          await writeDefaultConfig({ customPath: options.customPath });
        }
        initResult = {
          configPath: options.customPath,
          isFirstRun: !existedBefore,
          wasCreated: !existedBefore,
        };
      } else {
        initResult = await initializeConfig();
      }

      this.config = await loadConfig(this.customPath ?? undefined);
      this.initialized = true;
      this.initializing = false;

      this.info = {
        path: initResult.configPath,
        schemaPath: getSchemaPath(),
        directory: getConfigDir(),
        isFirstRun: initResult.isFirstRun,
        wasCreated: initResult.wasCreated,
      };

      if (options.enableLogging !== false && initResult.isFirstRun) {
        logger.info({ configPath: initResult.configPath }, "First run: created default config");
      }

      return this.info;
    } catch (error) {
      this.initializing = false;
      throw error;
    }
  }

  /**
   * Get the current configuration
   *
   * @throws Error if ConfigManager is not initialized
   * @returns The current configuration
   */
  getConfig(): Config {
    this.assertInitialized();
    if (this.config === null) {
      throw new Error("Config is null after initialization check");
    }
    return this.config;
  }

  /**
   * Get a specific config value by path
   *
   * @param path - Dot-notation path (e.g., "gateway.port")
   * @returns The value at the path, or undefined if not found
   */
  get<T = unknown>(path: string): T | undefined {
    this.assertInitialized();

    const keys = path.split(".");
    let value: unknown = this.config;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }

      if (typeof value === "object" && value !== null) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return value as T;
  }

  /**
   * Get configuration info (paths and initialization status)
   */
  getInfo(): ConfigInfo {
    this.assertInitialized();
    if (this.info === null) {
      throw new Error("ConfigInfo is null after initialization check");
    }
    return this.info;
  }

  /**
   * Get the config file path
   */
  getConfigPath(): string {
    return this.customPath ?? getConfigPath();
  }

  /**
   * Check if this is the first run
   */
  isFirstRun(): boolean {
    this.assertInitialized();
    return this.info?.isFirstRun ?? false;
  }

  /**
   * Check if ConfigManager has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reload configuration from disk
   *
   * Useful for hot-reload scenarios
   *
   * @returns The reloaded configuration
   */
  async reload(): Promise<Config> {
    this.assertInitialized();
    this.config = await loadConfig(this.customPath ?? undefined);

    logger.info({ configPath: this.getConfigPath() }, "Configuration reloaded");
    return this.config;
  }

  /**
   * Reset configuration to defaults
   *
   * @returns The new default configuration
   */
  async resetToDefaults(): Promise<Config> {
    this.customPath = null;
    const resetResult = await resetConfig();
    this.info = {
      path: resetResult.configPath,
      schemaPath: getSchemaPath(),
      directory: getConfigDir(),
      isFirstRun: false,
      wasCreated: true,
    };
    this.config = await loadConfig();

    logger.info({ configPath: resetResult.configPath }, "Configuration reset to defaults");
    return this.config;
  }

  /**
   * Save current configuration to disk
   *
   * @param customConfig - Optional custom config to save (uses current if not provided)
   */
  async save(customConfig?: Config): Promise<string> {
    this.assertInitialized();
    const configToSave = customConfig ?? this.config;
    if (configToSave === null) {
      throw new Error("No config available to save");
    }

    if (this.customPath) {
      await writeConfig(configToSave, { customPath: this.customPath });
      return this.customPath;
    }

    await ensureConfigDir();
    await writeConfig(configToSave);
    return getConfigPath();
  }

  /**
   * Assert that ConfigManager is initialized
   *
   * @throws Error if not initialized
   */
  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        "ConfigManager is not initialized. Call initialize() before using getConfig().",
      );
    }
  }
}

/**
 * Convenience function to initialize and get config in one call
 */
export async function initConfig(options?: ConfigManagerOptions): Promise<Config> {
  const manager = ConfigManager.getInstance();
  await manager.initialize(options);
  return manager.getConfig();
}

/**
 * Get the ConfigManager singleton
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}

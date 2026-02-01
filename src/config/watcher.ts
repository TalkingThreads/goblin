/**
 * Configuration file watcher with hot reload
 */

import { EventEmitter } from "node:events";
import type { FSWatcher } from "node:fs";
import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { createLogger } from "../observability/logger.js";
import { validateConfig } from "./loader.js";
import { getConfigPath } from "./paths.js";
import type { Config } from "./schema.js";

const logger = createLogger("config-watcher");

export interface ConfigWatcherEvents {
  updated: (config: Config) => void;
  error: (error: Error) => void;
}

/**
 * Configuration file watcher with atomic updates and rollback
 */
export class ConfigWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private debounceTimer: Timer | null = null;
  private currentConfig: Config;

  constructor(initialConfig: Config) {
    super();
    this.currentConfig = initialConfig;
  }

  /**
   * Start watching the config file
   */
  start(): void {
    const configPath = getConfigPath();

    logger.info({ configPath }, "Configuration watcher started");

    this.watcher = watch(configPath, (event) => {
      if (event === "change") {
        this.handleChange();
      }
    });

    this.watcher.on("error", (error: Error) => {
      logger.error({ error }, "Configuration watcher failed");
      this.emit("error", error);
    });
  }

  /**
   * Stop watching the config file
   */
  stop(): void {
    if (this.watcher !== null) {
      logger.info({ configPath: getConfigPath() }, "Configuration watcher stopped");
      this.watcher.close();
      this.watcher = null;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Get the current config
   */
  getConfig(): Config {
    return this.currentConfig;
  }

  /**
   * Handle file change with debouncing
   */
  private handleChange(): void {
    // Clear existing timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce for 100ms to handle rapid saves
    this.debounceTimer = setTimeout(() => {
      this.reloadConfig();
    }, 100);
  }

  /**
   * Reload and validate config with atomic swap
   */
  private async reloadConfig(): Promise<void> {
    const configPath = getConfigPath();

    try {
      logger.debug({ configPath }, "Configuration reload started");

      // Read and parse JSON
      const content = await readFile(configPath, "utf-8");
      const raw = JSON.parse(content);

      // Atomic validation
      const validatedConfig = validateConfig(raw);

      if (validatedConfig !== null) {
        // Atomic swap - only update if validation succeeded
        this.currentConfig = validatedConfig;

        logger.info({ configPath }, "Configuration reloaded");
        this.emit("updated", this.currentConfig);
      } else {
        // Validation failed - rollback (keep current config)
        logger.warn({ configPath }, "Configuration validation failed");
      }
    } catch (error: unknown) {
      // File read or JSON parse error - rollback
      if (error instanceof SyntaxError) {
        logger.error({ configPath, error: error.message }, "Configuration parsing failed");
      } else {
        logger.error({ configPath, error }, "Configuration reload failed");
      }
    }
  }
}

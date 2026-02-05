/**
 * Configuration system barrel export
 *
 * Centralized exports for the Goblin configuration system.
 *
 * @example
 * ```typescript
 * import { ConfigManager, initConfig } from "./config/index.js";
 *
 * // Simple initialization with auto-creation of default config
 * const config = await initConfig();
 *
 * // Or use the manager directly
 * const manager = ConfigManager.getInstance();
 * await manager.initialize();
 * const config = manager.getConfig();
 * ```
 */

export { DEFAULT_CONFIG, DEFAULT_CONFIG_CONTENT } from "./defaults.js";
export {
  type InitializationResult,
  initializeConfig,
  isFirstRun,
  resetConfig,
} from "./initializer.js";
export { loadConfig, validateConfig } from "./loader.js";
export {
  type ConfigInfo,
  ConfigManager,
  type ConfigManagerOptions,
  getConfigManager,
  initConfig,
} from "./manager.js";
export {
  ensureConfigDir,
  getConfigDir,
  getConfigPath,
  getSchemaPath,
} from "./paths.js";
export type {
  AuthConfig,
  Config,
  GatewayConfig,
  PoliciesConfig,
  ServerConfig,
  StreamableHttpConfig,
  TransportType,
  VirtualTool,
  VirtualToolOp,
} from "./schema.js";
export { ConfigSchema } from "./schema.js";
export { generateSchema } from "./schema-generator.js";
export type { ConfigWatcherEvents } from "./watcher.js";
export { ConfigWatcher } from "./watcher.js";
export {
  type WriteConfigOptions,
  writeConfig,
  writeDefaultConfig,
} from "./writer.js";

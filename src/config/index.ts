/**
 * Configuration system barrel export
 */

export { loadConfig, validateConfig } from "./loader.js";
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

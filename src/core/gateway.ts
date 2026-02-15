import { type Config, ConfigWatcher, generateSchema } from "../config/index.js";
import { getConfigManager } from "../config/manager.js";
import { HttpGateway, Registry, Router } from "../gateway/index.js";
import { createLogger, flushAndCloseLogs } from "../observability/logger.js";
import { catalogList, catalogSearch } from "../tools/meta/catalog.js";
import { health } from "../tools/meta/health.js";
import { catalogPrompts, describePrompt, searchPrompts } from "../tools/meta/prompts.js";
import {
  catalogResources,
  catalogResourceTemplates,
  describeResource,
  searchResources,
} from "../tools/meta/resources.js";
import { describeServer, searchServers } from "../tools/meta/server.js";
import { describeTool, invokeTool } from "../tools/meta/tool.js";
import { createVirtualToolDefinition } from "../tools/virtual/registry-adapter.js";
import { TransportPool } from "../transport/index.js";

const logger = createLogger("core");

/**
 * Goblin Gateway Core
 * Encapsulates the runtime state and lifecycle
 */
export class GoblinGateway {
  public registry: Registry;
  public router: Router | null;
  public transportPool: TransportPool;
  public httpGateway: HttpGateway | null = null;
  public configWatcher: ConfigWatcher | null = null;

  constructor() {
    this.registry = new Registry();
    this.transportPool = new TransportPool();
    // Router requires config, so it's initialized in start()
    this.router = null;
  }

  /**
   * Initialize the gateway core components (Registry, Router, Backends)
   * without starting the HTTP listener.
   */
  async initialize(customConfig?: Config, configPath?: string): Promise<Config> {
    logger.info("Initializing Goblin Gateway Core...");

    // Generate Schema
    try {
      await generateSchema();
    } catch (error) {
      logger.warn({ error }, "Failed to generate config schema");
    }

    // Load Config if not provided - use ConfigManager
    let config: Config;
    if (customConfig) {
      config = customConfig;
    } else {
      const manager = getConfigManager();
      await manager.initialize(configPath ? { customPath: configPath } : undefined);
      config = manager.getConfig();
    }
    this.router = new Router(this.registry, this.transportPool, config);

    // Register Meta Tools
    this.registerMetaTools();

    // Register Virtual Tools
    if (config.virtualTools) {
      logger.info({ count: config.virtualTools.length }, "Registering virtual tools");
      for (const vt of config.virtualTools) {
        const def = createVirtualToolDefinition(vt.id, vt.description);
        this.registry.registerLocalTool(def);
      }
    }

    // Connect Servers
    for (const server of config.servers) {
      if (server.enabled) {
        try {
          const transport = await this.transportPool.getTransport(server);
          await this.registry.addServer(server.name, transport.getClient());
          // Set up aliases for this server
          this.registry.setServerAliases(server.name, server.aliases);
        } catch (error) {
          logger.error({ server: server.name, error }, "Failed to connect to server");
        }
      }
    }

    // Watch Config
    this.configWatcher = new ConfigWatcher(config, configPath);
    this.configWatcher.on("updated", async (newConfig: Config) => {
      logger.info({ serverCount: newConfig.servers.length }, "Configuration updated via watcher");
      await this.reloadConfig(newConfig);
    });
    this.configWatcher.start();

    logger.info("Goblin Gateway Core initialized");
    return config;
  }

  /**
   * Reload configuration (used for SIGHUP in STDIO mode)
   * Updates the router config and manages server additions/removals
   */
  async reloadConfig(newConfig: Config): Promise<void> {
    logger.info("Reloading Goblin Gateway configuration...");

    if (!this.router) {
      logger.warn("Router not initialized, cannot reload config");
      return;
    }

    this.router.updateConfig(newConfig);

    const currentServers = new Set(this.registry.getServerNames());
    const newServerNames = new Set(newConfig.servers.map((s) => s.name));

    for (const server of newConfig.servers) {
      if (!currentServers.has(server.name) && server.enabled) {
        try {
          const transport = await this.transportPool.getTransport(server);
          await this.registry.addServer(server.name, transport.getClient());
          this.registry.setServerAliases(server.name, server.aliases);
          logger.info({ server: server.name }, "Added new server via config reload");
        } catch (error) {
          logger.error({ server: server.name, error }, "Failed to add server during config reload");
        }
      }
      // Update aliases for existing servers
      if (currentServers.has(server.name)) {
        this.registry.setServerAliases(server.name, server.aliases);
      }
    }

    for (const serverName of currentServers) {
      if (!newServerNames.has(serverName)) {
        // Gracefully drain the server before removing
        logger.info({ server: serverName }, "Starting graceful drain of server");
        await this.transportPool.drainServer(serverName);
        await this.registry.removeServer(serverName);
        logger.info({ server: serverName }, "Removed server via config reload");
      }
    }

    this.registry.clearLocalTools();
    this.registerMetaTools();

    if (newConfig.virtualTools) {
      logger.info({ count: newConfig.virtualTools.length }, "Registering virtual tools");
      for (const vt of newConfig.virtualTools) {
        const def = createVirtualToolDefinition(vt.id, vt.description);
        this.registry.registerLocalTool(def);
      }
    }

    logger.info("Goblin Gateway configuration reloaded");
  }

  /**
   * Initialize and start the gateway
   *
   * @param customConfig - Optional pre-loaded configuration
   * @param configPath - Optional path to the configuration file
   * @param transportMode - Transport mode: "http" or "sse"
   */
  async start(
    customConfig?: Config,
    configPath?: string,
    transportMode: "http" | "sse" = "http",
  ): Promise<void> {
    const config = await this.initialize(customConfig, configPath);

    // Start HTTP
    // biome-ignore lint/style/noNonNullAssertion: Router initialized in initialize()
    this.httpGateway = new HttpGateway(this.registry, this.router!, config, transportMode);

    // Set up shutdown callback for graceful stop via API
    this.httpGateway.setShutdownCallback(() => {
      this.stop().catch((error) => {
        logger.error({ error }, "Error during shutdown");
        process.exit(1);
      });
    });

    this.httpGateway.start();
  }

  /**
   * Stop the gateway
   */
  async stop(): Promise<void> {
    logger.info("Stopping Goblin Gateway...");

    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, "Shutdown signal received");
      await this.stop();
      await flushAndCloseLogs();
      setTimeout(() => {
        logger.info("Logs flushed, exiting");
        process.exit(0);
      }, 1000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    if (this.configWatcher) {
      this.configWatcher.stop();
    }

    // Stop HTTP server gracefully (waits for in-flight requests)
    if (this.httpGateway) {
      await this.httpGateway.stop();
    }

    await this.transportPool.closeAll();
  }

  private registerMetaTools(): void {
    this.registry.registerLocalTool(catalogList);
    this.registry.registerLocalTool(catalogSearch);
    this.registry.registerLocalTool(health);
    this.registry.registerLocalTool(describeServer);
    this.registry.registerLocalTool(searchServers);
    this.registry.registerLocalTool(describeTool);
    this.registry.registerLocalTool(invokeTool);
    this.registry.registerLocalTool(catalogPrompts);
    this.registry.registerLocalTool(describePrompt);
    this.registry.registerLocalTool(searchPrompts);
    this.registry.registerLocalTool(catalogResources);
    this.registry.registerLocalTool(describeResource);
    this.registry.registerLocalTool(searchResources);
    this.registry.registerLocalTool(catalogResourceTemplates);
  }
}

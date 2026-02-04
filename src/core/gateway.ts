import { type Config, ConfigWatcher, generateSchema, loadConfig } from "../config/index.js";
import { HttpGateway, Registry, Router } from "../gateway/index.js";
import { createLogger, flushLogs } from "../observability/logger.js";
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
   * Initialize and start the gateway
   *
   * @param customConfig - Optional pre-loaded configuration
   * @param configPath - Optional path to the configuration file
   */
  async start(customConfig?: Config, configPath?: string): Promise<void> {
    logger.info("Starting Goblin Gateway Core...");

    // Generate Schema
    try {
      await generateSchema();
    } catch (error) {
      logger.warn({ error }, "Failed to generate config schema");
    }

    // Load Config if not provided
    const config = customConfig ?? (await loadConfig(configPath));
    this.router = new Router(this.registry, this.transportPool, config);

    // Register Meta Tools
    this.registerMetaTools();

    // Register Virtual Tools
    if (config.virtualTools) {
      logger.info({ count: config.virtualTools.length }, "Registering virtual tools");
      for (const vt of config.virtualTools) {
        // For MVP, we use a generic input schema as inference is complex
        // Ideally, we'd infer it from the first operation's input requirements
        const def = createVirtualToolDefinition(vt.id, vt.description);
        this.registry.registerLocalTool(def);
      }
    }

    // Start HTTP
    // biome-ignore lint/style/noNonNullAssertion: Router initialized just above on line 56
    this.httpGateway = new HttpGateway(this.registry, this.router!, config);

    // Set up shutdown callback for graceful stop via API
    this.httpGateway.setShutdownCallback(() => {
      this.stop().catch((error) => {
        logger.error({ error }, "Error during shutdown");
        process.exit(1);
      });
    });

    this.httpGateway.start();

    // Connect Servers
    for (const server of config.servers) {
      if (server.enabled) {
        try {
          const transport = await this.transportPool.getTransport(server);
          await this.registry.addServer(server.name, transport.getClient());
        } catch (error) {
          logger.error({ server: server.name, error }, "Failed to connect to server");
        }
      }
    }

    // Watch Config
    this.configWatcher = new ConfigWatcher(config, configPath);
    this.configWatcher.on("updated", (newConfig: Config) => {
      logger.info({ serverCount: newConfig.servers.length }, "Configuration updated");
      // TODO: Implement hot reload logic
    });
    this.configWatcher.start();

    logger.info("Goblin Gateway Core ready");
  }

  /**
   * Stop the gateway
   */
  async stop(): Promise<void> {
    logger.info("Stopping Goblin Gateway...");

    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, "Shutdown signal received");
      await this.stop();
      await flushLogs();
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

/**
 * Transport connection pool
 */

import type { ServerConfig } from "../config/schema.js";
import { createLogger } from "../observability/logger.js";
import { mcpActiveConnections } from "../observability/metrics.js";
import { HttpTransport } from "./http.js";
import type { Transport } from "./interface.js";
import { StdioTransport } from "./stdio.js";

const logger = createLogger("transport-pool");

interface TransportEntry {
  transport: Transport;
  config: ServerConfig;
  lastUsed: number;
}

export class TransportPool {
  private transports = new Map<string, TransportEntry>();
  private pendingConnections = new Map<string, Promise<Transport>>();
  private evictionInterval: Timer | null = null;
  private readonly IDLE_TIMEOUT_MS = 60 * 1000; // 1 minute default for Smart mode

  constructor() {
    // Start eviction loop
    this.evictionInterval = setInterval(() => this.runEviction(), 30000);
  }

  /**
   * Get server health status
   */
  getHealth(): Array<{ id: string; status: string; mode: string }> {
    return Array.from(this.transports.values()).map((entry) => ({
      id: entry.config.name,
      status: entry.transport.isConnected() ? "connected" : "disconnected",
      mode: entry.config.mode || "stateful",
    }));
  }

  /**
   * Get an existing transport or create a new one
   */
  async getTransport(serverConfig: ServerConfig): Promise<Transport> {
    const serverName = serverConfig.name;

    // Check if transport already exists in cache
    const existingEntry = this.transports.get(serverName);
    if (existingEntry) {
      existingEntry.lastUsed = Date.now();
      if (!existingEntry.transport.isConnected()) {
        logger.info({ server: serverName }, "Reconnecting existing transport");
        try {
          await existingEntry.transport.connect();
          mcpActiveConnections.set(1, { server: serverName, transport: serverConfig.transport });
        } catch (error) {
          throw error;
        }
      }
      return existingEntry.transport;
    }

    // Check if a connection is already in progress
    const pendingConnection = this.pendingConnections.get(serverName);
    if (pendingConnection) {
      logger.debug({ server: serverName }, "Returning existing pending connection");
      return pendingConnection;
    }

    logger.info({ server: serverName }, "Creating new transport");
    const transport = this.createTransport(serverConfig);

    // Store the connection promise before initiating
    const connectionPromise = (async () => {
      try {
        await transport.connect();
        mcpActiveConnections.set(1, { server: serverName, transport: serverConfig.transport });

        this.transports.set(serverName, {
          transport,
          config: serverConfig,
          lastUsed: Date.now(),
        });

        return transport;
      } finally {
        // Always remove from pending connections, regardless of success/failure
        this.pendingConnections.delete(serverName);
      }
    })();

    // Store the promise in pendingConnections before awaiting
    this.pendingConnections.set(serverName, connectionPromise);

    return connectionPromise;
  }

  /**
   * Release a transport (disconnect and remove)
   */
  async releaseTransport(serverName: string): Promise<void> {
    const entry = this.transports.get(serverName);
    if (entry) {
      await entry.transport.disconnect();
      mcpActiveConnections.set(0, { server: serverName, transport: entry.config.transport });
      this.transports.delete(serverName);
    }
  }

  /**
   * Release all transports
   */
  async closeAll(): Promise<void> {
    if (this.evictionInterval) {
      clearInterval(this.evictionInterval);
      this.evictionInterval = null;
    }

    const promises = Array.from(this.transports.values()).map(async (entry) => {
      await entry.transport.disconnect();
      mcpActiveConnections.set(0, { server: entry.config.name, transport: entry.config.transport });
    });

    await Promise.all(promises);
    this.transports.clear();
  }

  private runEviction(): void {
    const now = Date.now();
    for (const [name, entry] of this.transports.entries()) {
      // Smart mode: evict if idle
      if (entry.config.mode === "smart") {
        if (now - entry.lastUsed > this.IDLE_TIMEOUT_MS) {
          logger.info({ server: name }, "Evicting idle transport (smart mode)");
          this.releaseTransport(name).catch((err) =>
            logger.error({ server: name, error: err }, "Failed to evict transport"),
          );
        }
      }

      // Stateless mode: evict immediately (or next tick) - simplified to same eviction loop for MVP
      // Ideally stateless should be released immediately after use, but we don't have explicit "release" signal from Router yet.
      // So we treat stateless as "short timeout" (e.g. ensure it doesn't stay long).
      // For now, Smart handles idle.
    }
  }

  private createTransport(config: ServerConfig): Transport {
    switch (config.transport) {
      case "stdio":
        if (!config.command) {
          throw new Error(`Server ${config.name} configured for stdio but missing command`);
        }
        return new StdioTransport({
          name: config.name,
          command: config.command,
          args: config.args,
          env: config.env,
        });

      case "sse": // Map "sse" to HttpTransport (SSE based)
      case "http": // "http" is also mapped to HttpTransport
        if (!config.url) {
          throw new Error(`Server ${config.name} configured for http/sse but missing url`);
        }
        return new HttpTransport({
          name: config.name,
          url: config.url,
        });

      default:
        throw new Error(`Unsupported transport type: ${config.transport}`);
    }
  }
}

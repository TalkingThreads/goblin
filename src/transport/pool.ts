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
    const entry = this.transports.get(serverConfig.name);

    if (entry) {
      entry.lastUsed = Date.now();
      if (!entry.transport.isConnected()) {
        logger.info({ server: serverConfig.name }, "Reconnecting existing transport");
        try {
          await entry.transport.connect();
          mcpActiveConnections.set(
            { server: serverConfig.name, transport: serverConfig.transport },
            1,
          );
        } catch (error) {
          throw error;
        }
      }
      return entry.transport;
    }

    logger.info({ server: serverConfig.name }, "Creating new transport");
    const transport = this.createTransport(serverConfig);

    // Store entry before connecting to handle race conditions if needed,
    // but better to connect first to ensure validity.
    // However, for pooling, we want to reserve the slot?
    // Let's connect first.

    try {
      await transport.connect();
      mcpActiveConnections.set({ server: serverConfig.name, transport: serverConfig.transport }, 1);

      this.transports.set(serverConfig.name, {
        transport,
        config: serverConfig,
        lastUsed: Date.now(),
      });

      return transport;
    } catch (error) {
      // Ensure we don't leave a half-state? (We didn't set it yet)
      throw error;
    }
  }

  /**
   * Release a transport (disconnect and remove)
   */
  async releaseTransport(serverName: string): Promise<void> {
    const entry = this.transports.get(serverName);
    if (entry) {
      await entry.transport.disconnect();
      mcpActiveConnections.set({ server: serverName, transport: entry.config.transport }, 0);
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
      mcpActiveConnections.set({ server: entry.config.name, transport: entry.config.transport }, 0);
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

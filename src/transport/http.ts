/**
 * HTTP/SSE Transport implementation
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { createLogger } from "../observability/logger.js";
import { type Transport, TransportState } from "./interface.js";

const logger = createLogger("transport-http");

export interface HttpTransportConfig {
  url: string;
  name: string; // Server name
}

export class HttpTransport implements Transport {
  readonly type = "sse"; // Using SSE transport as underlying mechanism
  private _state: TransportState = TransportState.Disconnected;
  private transport: SSEClientTransport | null = null;
  private client: Client | null = null;

  constructor(private config: HttpTransportConfig) {}

  get state(): TransportState {
    return this._state;
  }

  isConnected(): boolean {
    return this._state === TransportState.Connected;
  }

  getClient(): Client {
    if (!this.client || this._state !== TransportState.Connected) {
      throw new Error("Transport not connected");
    }
    return this.client;
  }

  async connect(): Promise<void> {
    if (this._state === TransportState.Connected || this._state === TransportState.Connecting) {
      return;
    }

    this._state = TransportState.Connecting;
    logger.info(
      { server: this.config.name, url: this.config.url },
      "Connecting to HTTP/SSE server",
    );

    try {
      this.transport = new SSEClientTransport(new URL(this.config.url));

      this.client = new Client(
        {
          name: "goblin-gateway",
          version: "0.1.0",
        },
        {
          capabilities: {},
        },
      );

      this.transport.onerror = (error) => {
        logger.error({ server: this.config.name, error }, "Transport error");
        this._state = TransportState.Error;
      };

      this.transport.onclose = () => {
        logger.info({ server: this.config.name }, "Transport closed");
        this._state = TransportState.Disconnected;
        this.client = null;
        this.transport = null;
      };

      await this.client.connect(this.transport);
      this._state = TransportState.Connected;

      logger.info({ server: this.config.name }, "Connected to HTTP/SSE server");
    } catch (error) {
      logger.error({ server: this.config.name, error }, "Failed to connect to HTTP/SSE server");
      this._state = TransportState.Error;
      this.cleanup();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this._state === TransportState.Disconnected) {
      return;
    }

    logger.info({ server: this.config.name }, "Disconnecting from HTTP/SSE server");

    try {
      if (this.client) {
        await this.client.close();
      } else if (this.transport) {
        await this.transport.close();
      }
    } catch (error) {
      logger.error({ server: this.config.name, error }, "Error disconnecting transport");
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    this._state = TransportState.Disconnected;
    this.client = null;
    this.transport = null;
  }
}

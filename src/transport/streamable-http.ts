/**
 * Streamable HTTP Transport implementation
 *
 * Client transport for connecting to MCP servers via Streamable HTTP protocol.
 * Supports session management, SSE notifications, and authentication.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport,
  type StreamableHTTPClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SERVER_NAME, SERVER_VERSION } from "../meta.js";
import { createLogger, isDebugEnabled } from "../observability/logger.js";
import type { Transport } from "./interface.js";
import { TransportState } from "./interface.js";

const logger = createLogger("transport-streamable-http");

export interface StreamableHttpTransportConfig {
  url: string;
  name: string;
  headers?: Record<string, string> | Headers;
  timeout?: number;
  reconnectionOptions?: {
    initialReconnectionDelay?: number;
    maxReconnectionDelay?: number;
    reconnectionDelayGrowFactor?: number;
    maxRetries?: number;
  };
}

export class StreamableHttpTransport implements Transport {
  readonly type = "streamablehttp";
  private _state: TransportState = TransportState.Disconnected;
  private transport: StreamableHTTPClientTransport | null = null;
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;

  constructor(private config: StreamableHttpTransportConfig) {
    this.maxReconnectAttempts = config.reconnectionOptions?.maxRetries ?? 5;
  }

  get state(): TransportState {
    return this._state;
  }

  getSessionId(): string | null {
    return this.transport?.sessionId ?? null;
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

    const debugMode = isDebugEnabled();
    this._state = TransportState.Connecting;

    if (debugMode) {
      logger.trace(
        { server: this.config.name, url: this.config.url, attempt: this.reconnectAttempts + 1 },
        "Connecting to Streamable HTTP server",
      );
    } else {
      logger.info(
        { server: this.config.name, url: this.config.url, attempt: this.reconnectAttempts + 1 },
        "Connecting to Streamable HTTP server",
      );
    }

    try {
      const url = new URL(this.config.url);
      const headers =
        this.config.headers instanceof Headers
          ? this.config.headers
          : new Headers(this.config.headers);

      const options: StreamableHTTPClientTransportOptions = {
        requestInit: {
          headers,
        },
      };

      if (this.config.reconnectionOptions) {
        options.reconnectionOptions = {
          initialReconnectionDelay:
            this.config.reconnectionOptions.initialReconnectionDelay ?? 1000,
          maxReconnectionDelay: this.config.reconnectionOptions.maxReconnectionDelay ?? 30000,
          reconnectionDelayGrowFactor:
            this.config.reconnectionOptions.reconnectionDelayGrowFactor ?? 1.5,
          maxRetries: this.config.reconnectionOptions.maxRetries ?? 5,
        };
      }

      this.transport = new StreamableHTTPClientTransport(url, options);

      this.client = new Client(
        {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
        {
          capabilities: {},
        },
      );

      this.transport.onerror = (error: Error) => {
        logger.error({ server: this.config.name, error }, "Transport error");
        this._state = TransportState.Error;
        this.handleError(error);
      };

      this.transport.onclose = () => {
        logger.info({ server: this.config.name }, "Transport closed");
        this._state = TransportState.Disconnected;
        this.client = null;
        this.transport = null;
      };

      await this.client.connect(this.transport);
      this._state = TransportState.Connected;
      this.reconnectAttempts = 0;

      if (debugMode) {
        logger.trace(
          { server: this.config.name, sessionId: this.transport.sessionId },
          "Connected to Streamable HTTP server",
        );
      } else {
        logger.info(
          { server: this.config.name, sessionId: this.transport.sessionId },
          "Connected to Streamable HTTP server",
        );
      }
    } catch (error) {
      logger.error(
        { server: this.config.name, error },
        "Failed to connect to Streamable HTTP server",
      );
      this._state = TransportState.Error;
      this.cleanup();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this._state === TransportState.Disconnected) {
      return;
    }

    const debugMode = isDebugEnabled();
    if (debugMode) {
      logger.trace({ server: this.config.name }, "Disconnecting from Streamable HTTP server");
    } else {
      logger.info({ server: this.config.name }, "Disconnecting from Streamable HTTP server");
    }

    try {
      if (this.transport) {
        await this.transport.close();
      } else if (this.client) {
        await this.client.close();
      }
    } catch (error) {
      logger.error({ server: this.config.name, error }, "Error disconnecting transport");
    } finally {
      this.cleanup();
    }
  }

  private handleError(error: Error): void {
    if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      logger.warn({ server: this.config.name, error }, "Authentication failed - not retrying");
      this.reconnectAttempts = this.maxReconnectAttempts;
    } else if (error.message?.includes("Session expired") || error.message?.includes("session")) {
      logger.info({ server: this.config.name, error }, "Session expired - will reinitialize");
    }
  }

  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn(
        { server: this.config.name, attempts: this.reconnectAttempts },
        "Max reconnection attempts reached",
      );
      throw new Error("Max reconnection attempts exceeded");
    }

    this.reconnectAttempts++;
    await this.disconnect();
    await this.connect();
  }

  private cleanup(): void {
    this._state = TransportState.Disconnected;
    this.client = null;
    this.transport = null;
  }
}

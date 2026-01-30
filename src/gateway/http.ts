/**
 * HTTP Gateway implementation using Hono
 */

import type { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { streamSSE } from "hono/streaming";
import type { Config } from "../config/index.js";
import { createLogger } from "../observability/logger.js";
import { createHonoSseTransport } from "../transport/hono-adapter.js";
import type { Registry } from "./registry.js";
import type { Router } from "./router.js";
import { GatewayServer } from "./server.js";

const logger = createLogger("http-gateway");

export class HttpGateway {
  public app: Hono;
  private sessions = new Map<string, { transport: SSEServerTransport; server: GatewayServer }>();

  constructor(
    private registry: Registry,
    private router: Router,
    private config: Config,
  ) {
    this.app = new Hono();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use("*", honoLogger());
    this.app.use("*", cors()); // TODO: Configure CORS from config
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (c) => c.json({ status: "ok" }));

    // SSE Endpoint
    this.app.get("/sse", async (c) => {
      const sessionId = crypto.randomUUID();

      return streamSSE(c, async (stream) => {
        logger.info({ sessionId }, "New SSE connection");

        // Create transport
        const transport = createHonoSseTransport("/messages", c, stream);
        this.sessions.set(sessionId, { transport, server: null as any }); // Placeholder

        // Send endpoint event
        await stream.writeSSE({
          event: "endpoint",
          data: `/messages?sessionId=${sessionId}`,
        });

        // Create GatewayServer for this session
        const server = new GatewayServer(this.registry, this.router, this.config);
        this.sessions.get(sessionId)!.server = server;

        // Connect server to transport
        await server.connect(transport);

        // Cleanup on disconnect
        stream.onAbort(async () => {
          logger.info({ sessionId }, "SSE connection closed");
          const session = this.sessions.get(sessionId);
          if (session) {
            await session.server.close();
            this.sessions.delete(sessionId);
          }
        });

        // Keep alive
        while (true) {
          await stream.sleep(30000);
          // Just waiting, Hono handles keep-alive if configured?
          // Or we can send comments.
        }
      });
    });

    // Messages Endpoint
    this.app.post("/messages", async (c) => {
      const sessionId = c.req.query("sessionId");

      if (!sessionId || !this.sessions.has(sessionId)) {
        return c.json({ error: "Session not found" }, 404);
      }

      const { transport } = this.sessions.get(sessionId)!;

      try {
        const body = await c.req.json();
        await transport.handleMessage(body);
      } catch (error) {
        logger.error({ sessionId, error }, "Failed to handle message");
        return c.json({ error: "Internal error" }, 500);
      }

      return c.json({ success: true }); // Acknowledge
    });
  }

  /**
   * Start the HTTP server
   */
  start(): void {
    const port = this.config.gateway.port;
    const hostname = this.config.gateway.host;

    logger.info({ port, hostname }, "Starting HTTP server");

    Bun.serve({
      fetch: this.app.fetch,
      port,
      hostname,
    });
  }
}

/**
 * HTTP Gateway implementation using Hono
 */

import type { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { streamSSE } from "hono/streaming";
import type { Config } from "../config/index.js";
import { getOrCreateRequestId, getRequestId } from "../observability/correlation.js";
import { createLogger } from "../observability/logger.js";
import {
  httpRequestDuration,
  httpRequestsTotal,
  metricsRegistry,
} from "../observability/metrics.js";
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
    this.app.use("*", cors());

    // Request ID middleware
    this.app.use("*", async (c, next) => {
      getOrCreateRequestId(c.req.header());
      await next();
    });

    // Metrics middleware
    this.app.use("*", async (c, next) => {
      const start = performance.now();
      const method = c.req.method;
      const route = c.req.path;

      try {
        await next();
      } finally {
        const duration = (performance.now() - start) / 1000;
        const status = c.res.status;
        const requestId = getRequestId();

        httpRequestsTotal.inc({ method, route, status: status.toString() });
        httpRequestDuration.observe(duration, { method, route, status: status.toString() });

        logger.info({ requestId, method, path: route, status, duration }, "Request completed");
      }
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (c) => c.json({ status: "ok" }));

    // Metrics endpoint
    this.app.get("/metrics", async (c) => {
      return c.json(metricsRegistry.toJSON());
    });

    // SSE Endpoint
    this.app.get("/sse", async (c) => {
      const sessionId = crypto.randomUUID();

      return streamSSE(c, async (stream) => {
        const requestId = getRequestId();
        logger.info({ sessionId, requestId }, "SSE connection established");

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
          const requestId = getRequestId();
          logger.info({ sessionId, requestId }, "SSE connection closed");
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
        const requestId = getRequestId();
        logger.error({ sessionId, error, requestId }, "Message handling failed");
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

    logger.info({ port, hostname }, "HTTP server startup initiated");

    Bun.serve({
      fetch: this.app.fetch,
      port,
      hostname,
    });
  }
}

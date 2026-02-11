/**
 * HTTP Gateway implementation using Hono
 */

import type { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { streamSSE } from "hono/streaming";
import { timeout } from "hono/timeout";
import type { Config } from "../config/index.js";
import { getOrCreateRequestId, getRequestId } from "../observability/correlation.js";
import { createLogger } from "../observability/logger.js";
import {
  getMetricsSummary,
  httpRequestDuration,
  httpRequestsTotal,
  metricsRegistry,
} from "../observability/metrics.js";
import {
  SlashCommandConflictError,
  SlashCommandNotFoundError,
  SlashCommandRouter,
} from "../slashes/router.js";
import { createHonoSseTransport } from "../transport/hono-adapter.js";
import { StreamableHttpServerTransport } from "../transport/http-server.js";
import type { Registry } from "./registry.js";
import type { Router } from "./router.js";
import { GatewayServer } from "./server.js";

const logger = createLogger("http-gateway");

const TIMEOUT_MS = 30000;
const MCP_TIMEOUT_MS = 60000;

export type TransportMode = "http" | "sse";

export class HttpGateway {
  public app: Hono;
  private sessions = new Map<
    string,
    { transport: SSEServerTransport; server: GatewayServer | null }
  >();
  private streamableHttpSessions = new Map<
    string,
    { transport: StreamableHttpServerTransport; server: GatewayServer; lastActivity: number }
  >();
  private sessionTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private server: ReturnType<typeof Bun.serve> | null = null;
  private onShutdown: (() => void) | null = null;
  private activeRequests = 0;
  private shutdownPromise: Promise<void> | null = null;
  private slashCommandRouter: SlashCommandRouter;
  private readonly sessionTimeoutMs: number;
  private readonly maxSessions: number;

  constructor(
    private registry: Registry,
    private router: Router,
    private config: Config,
    private transportMode: TransportMode = "http",
  ) {
    this.slashCommandRouter = new SlashCommandRouter(this.registry, this.router);
    this.sessionTimeoutMs = config.streamableHttp?.sessionTimeout ?? 300000;
    this.maxSessions = config.streamableHttp?.maxSessions ?? 1000;
    this.app = new Hono();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private getSessionTimeout(): number {
    return this.sessionTimeoutMs;
  }

  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  private setSessionTimeout(sessionId: string): void {
    this.clearSessionTimeout(sessionId);

    const timeout = setTimeout(() => {
      logger.info({ sessionId }, "Session timed out");
      this.closeSession(sessionId);
    }, this.getSessionTimeout());

    this.sessionTimeouts.set(sessionId, timeout);
  }

  private closeSession(sessionId: string): void {
    this.clearSessionTimeout(sessionId);

    const session = this.streamableHttpSessions.get(sessionId);
    if (session) {
      session.server.close().catch((error) => {
        logger.error({ error, sessionId }, "Error closing server during session cleanup");
      });
      this.streamableHttpSessions.delete(sessionId);
      logger.info({ sessionId }, "Session closed and cleaned up");
    }
  }

  /**
   * Set shutdown callback
   */
  setShutdownCallback(callback: () => void): void {
    this.onShutdown = callback;
  }

  private setupMiddleware(): void {
    this.app.use("*", honoLogger());
    this.app.use("*", cors());

    this.app.use("/api/*", timeout(TIMEOUT_MS));
    this.app.use("/api/mcp/*", timeout(MCP_TIMEOUT_MS));

    // Request ID middleware
    this.app.use("*", async (c, next) => {
      getOrCreateRequestId(c.req.header());
      await next();
    });

    // Authentication middleware
    this.app.use("*", async (c, next) => {
      const path = c.req.path;
      // Skip auth for health endpoint
      if (path === "/health") {
        return await next();
      }

      if (this.config.auth.mode === "apikey") {
        const apiKey =
          c.req.header("X-API-Key") || c.req.header("Authorization")?.replace("Bearer ", "");

        if (!apiKey || apiKey !== this.config.auth.apiKey) {
          logger.warn({ path, requestId: getRequestId() }, "Unauthorized access attempt");
          return c.json({ error: "Unauthorized" }, 401);
        }
      }

      return await next();
    });

    // Request tracking middleware for graceful shutdown
    this.app.use("*", async (_c, next) => {
      this.activeRequests++;
      try {
        await next();
      } finally {
        this.activeRequests--;
        // Resolve shutdown promise if no more active requests
        if (this.activeRequests === 0 && this.shutdownPromise) {
          this.shutdownPromise = null;
        }
      }
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

    // Shutdown endpoint for graceful stop
    this.app.post("/shutdown", async (c) => {
      logger.info("Shutdown requested via API");

      // Trigger graceful shutdown
      setTimeout(() => {
        if (this.onShutdown) {
          this.onShutdown();
        }
      }, 100);

      return c.json({ message: "Shutting down" });
    });

    // Status endpoint for CLI
    this.app.get("/status", async (c) => {
      const tools = this.registry.listTools();
      const configuredServers = this.config.servers;

      const serverStatus = configuredServers.map((s) => {
        const hasTools = tools.some((t) => t.serverId === s.name);
        return {
          id: s.name,
          online: hasTools,
        };
      });

      const onlineCount = serverStatus.filter((s) => s.online).length;
      const offlineCount = serverStatus.length - onlineCount;

      // Overall health logic
      let health = "healthy";
      if (serverStatus.length === 0 || (configuredServers.length > 0 && onlineCount === 0)) {
        health = "unhealthy";
      } else if (onlineCount < serverStatus.length) {
        health = "degraded";
      }

      return c.json({
        servers: {
          total: serverStatus.length,
          online: onlineCount,
          offline: offlineCount,
        },
        tools: tools.length,
        uptime: Math.floor(process.uptime()),
        health: health,
        metrics: getMetricsSummary(),
      });
    });

    // List tools endpoint
    this.app.get("/tools", async (c) => {
      const search = c.req.query("search");
      const server = c.req.query("server");

      let tools = this.registry.getAllTools();

      if (server) {
        tools = tools.filter((t) => t.serverId === server);
      }

      if (search) {
        // Use registry search if available, but registry search returns different format
        // For simplicity and consistency in the API, we can filter here or return search results
        // Let's use the registry's fuzzy search if it's just a search query
        const results = this.registry.searchTools(search);
        // Map back to ToolEntry-like objects or just return results
        // If we want schema summary, we need the full ToolEntry
        const resultIds = new Set(results.map((r) => r.id));
        tools = tools.filter((t) => resultIds.has(t.id));
      }

      return c.json({
        tools: tools.map((t) => ({
          name: t.id,
          description: t.def.description,
          serverId: t.serverId,
          inputSchema: t.def.inputSchema,
        })),
      });
    });

    // List servers endpoint
    this.app.get("/servers", async (c) => {
      const statusFilter = c.req.query("status");
      const tools = this.registry.getAllTools();
      const configuredServers = this.config.servers;

      const servers = configuredServers.map((s) => {
        const serverTools = tools.filter((t) => t.serverId === s.name);
        const isOnline = serverTools.length > 0;
        return {
          name: s.name,
          transport: s.transport,
          status: isOnline ? "online" : "offline",
          enabled: s.enabled,
          tools: serverTools.length,
        };
      });

      let filteredServers = servers;
      if (statusFilter === "online") {
        filteredServers = servers.filter((s) => s.status === "online");
      } else if (statusFilter === "offline") {
        filteredServers = servers.filter((s) => s.status === "offline");
      }

      return c.json({ servers: filteredServers });
    });

    // Metrics endpoint
    this.app.get("/metrics", async (c) => {
      return c.json(metricsRegistry.toJSON());
    });

    if (this.transportMode === "sse") {
      // SSE Endpoint
      this.app.get("/sse", async (c) => {
        const sessionId = crypto.randomUUID();

        return streamSSE(c, async (stream) => {
          const requestId = getRequestId();
          logger.info({ sessionId, requestId }, "SSE connection established");

          // Create transport
          const transport = createHonoSseTransport("/messages", c, stream);
          this.sessions.set(sessionId, { transport, server: null }); // Placeholder

          // Send endpoint event
          await stream.writeSSE({
            event: "endpoint",
            data: `/messages?sessionId=${sessionId}`,
          });

          // Create GatewayServer for this session
          const server = new GatewayServer(this.registry, this.router, this.config);
          // biome-ignore lint/style/noNonNullAssertion: Session was just created above, guaranteed to exist
          this.sessions.get(sessionId)!.server = server;

          // Connect server to transport
          await server.connect(transport);

          // Cleanup on disconnect
          stream.onAbort(async () => {
            const requestId = getRequestId();
            logger.info({ sessionId, requestId }, "SSE connection closed");
            const session = this.sessions.get(sessionId);
            if (session?.server) {
              await session.server.close();
              this.sessions.delete(sessionId);
            }
          });

          // Keep alive
          while (true) {
            await stream.sleep(30000);
          }
        });
      });

      // Messages Endpoint
      this.app.post("/messages", async (c) => {
        const sessionId = c.req.query("sessionId");

        if (!sessionId || !this.sessions.has(sessionId)) {
          return c.json({ error: "Session not found" }, 404);
        }

        // biome-ignore lint/style/noNonNullAssertion: Session existence checked above
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
    } else {
      // Streamable HTTP Endpoint (for http mode)
      this.app.all("/mcp", async (c) => {
        const requestId = getRequestId();

        try {
          const response = await this.handleStreamableHttpRequest(c.req.raw);
          return response;
        } catch (error) {
          logger.error({ error, requestId }, "Streamable HTTP request failed");
          return c.json({ error: "Internal server error" }, 500);
        }
      });
    }

    // Slash Commands Endpoints
    this.app.get("/api/v1/slashes", async (c) => {
      const commands = this.slashCommandRouter.listCommands();
      const conflicts = this.slashCommandRouter.listConflicts();
      return c.json({ commands, conflicts });
    });

    this.app.post("/api/v1/slashes/:command", async (c) => {
      const command = c.req.param("command");
      try {
        const args = await c.req.json().catch(() => ({}));
        const result = await this.slashCommandRouter.executeCommand(command, undefined, args);
        return c.json(result);
      } catch (error) {
        if (error instanceof SlashCommandNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof SlashCommandConflictError) {
          return c.json({ error: error.message, conflict: error.conflict }, 409);
        }
        logger.error({ command, error }, "Slash command execution failed");
        return c.json({ error: "Internal server error" }, 500);
      }
    });

    this.app.post("/api/v1/slashes/:serverId/:command", async (c) => {
      const serverId = c.req.param("serverId");
      const command = c.req.param("command");
      try {
        const args = await c.req.json().catch(() => ({}));
        const result = this.slashCommandRouter.executeCommand(command, serverId, args);
        return c.json(result);
      } catch (error) {
        if (error instanceof SlashCommandNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        logger.error({ command, serverId, error }, "Slash command execution failed");
        return c.json({ error: "Internal server error" }, 500);
      }
    });

    // Tool Invoke API Endpoint
    this.app.post("/api/v1/tools/:name/invoke", async (c) => {
      const requestId = getRequestId();
      const toolName = c.req.param("name");
      const requestTimeoutHeader = c.req.header("X-Request-Timeout");

      const timeoutMs = requestTimeoutHeader
        ? parseInt(requestTimeoutHeader, 10)
        : this.config.policies.defaultTimeout;

      if (!toolName || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(toolName)) {
        logger.warn({ toolName, requestId }, "Invalid tool name format");
        return c.json(
          {
            success: false,
            error: "Invalid tool name format",
            code: "INVALID_TOOL_NAME",
          },
          400,
        );
      }

      const body = await c.req.json().catch(() => ({}));
      const { arguments: args } = body;

      if (
        args !== undefined &&
        (typeof args !== "object" || args === null || Array.isArray(args))
      ) {
        logger.warn({ toolName, requestId }, "Invalid arguments format");
        return c.json(
          {
            success: false,
            error: "Arguments must be an object",
            code: "INVALID_ARGUMENTS",
          },
          400,
        );
      }

      const tool = this.registry.getTool(toolName);
      if (!tool) {
        logger.warn({ toolName, requestId }, "Tool not found");
        return c.json(
          {
            success: false,
            error: `Tool not found: ${toolName}`,
            code: "TOOL_NOT_FOUND",
          },
          404,
        );
      }

      try {
        const startTime = performance.now();
        const result = await this.router.callTool(
          toolName,
          (args as Record<string, unknown>) || {},
        );
        const durationMs = performance.now() - startTime;

        logger.info(
          { toolName, serverId: tool.serverId, durationMs, requestId },
          "Tool invoked successfully",
        );

        return c.json({
          success: true,
          result,
          server: tool.serverId,
          durationMs,
        });
      } catch (error) {
        logger.error({ toolName, error, requestId }, "Tool invocation failed");

        if (error instanceof DOMException && error.name === "AbortError") {
          return c.json(
            {
              success: false,
              error: `Request timed out after ${timeoutMs}ms`,
              code: "REQUEST_TIMEOUT",
            },
            504,
          );
        }

        return c.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            code: "TOOL_EXECUTION_FAILED",
          },
          500,
        );
      }
    });
  }

  /**
   * Handle Streamable HTTP requests
   */
  private async handleStreamableHttpRequest(request: Request): Promise<Response> {
    const requestId = getRequestId();
    const sessionId = request.headers.get("mcp-session-id") || undefined;

    logger.info({ requestId, sessionId }, "Streamable HTTP request received");

    if (this.streamableHttpSessions.size >= this.maxSessions) {
      logger.warn(
        { sessionId, sessionCount: this.streamableHttpSessions.size },
        "Max sessions reached",
      );
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Too many concurrent sessions" },
          id: null,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    let transport: StreamableHttpServerTransport;
    let server: GatewayServer;
    const now = Date.now();

    if (sessionId && this.streamableHttpSessions.has(sessionId)) {
      const existing = this.streamableHttpSessions.get(sessionId);
      if (existing) {
        transport = existing.transport;
        server = existing.server;
        existing.lastActivity = now;
        this.setSessionTimeout(sessionId);
      } else {
        transport = new StreamableHttpServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        });
        server = new GatewayServer(this.registry, this.router, this.config);
        server.connect(transport);

        const newSessionId = crypto.randomUUID();
        this.streamableHttpSessions.set(newSessionId, { transport, server, lastActivity: now });
        this.setSessionTimeout(newSessionId);

        logger.info(
          { requestId, sessionId: newSessionId },
          "Session recreated (original was missing)",
        );
      }
    } else {
      transport = new StreamableHttpServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
      });
      server = new GatewayServer(this.registry, this.router, this.config);
      server.connect(transport);

      const newSessionId = sessionId || crypto.randomUUID();
      this.streamableHttpSessions.set(newSessionId, { transport, server, lastActivity: now });
      this.setSessionTimeout(newSessionId);

      if (sessionId !== newSessionId) {
        logger.info(
          { requestId, oldSessionId: sessionId, newSessionId },
          "New session created (original session ID was invalid or missing)",
        );
      } else {
        logger.info({ requestId, sessionId: newSessionId }, "New session created");
      }
    }

    return transport.handleRequest(request);
  }

  /**
   * Start the HTTP server
   */
  start(): void {
    const port = this.config.gateway.port;
    const hostname = this.config.gateway.host;

    logger.info({ port, hostname }, "HTTP server startup initiated");

    this.server = Bun.serve({
      fetch: this.app.fetch,
      port,
      hostname,
    });
  }

  /**
   * Stop the HTTP server gracefully
   */
  async stop(): Promise<void> {
    if (this.server) {
      logger.info("Stopping HTTP server");
      await this.server.stop(); // No argument = graceful, waits for in-flight requests
      this.server = null;
    }
  }
}

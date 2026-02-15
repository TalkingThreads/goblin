import type { GoblinGateway } from "../core/gateway.js";
import { createLogger } from "../observability/logger.js";

export const DEFAULT_LOCK_PORT = 12490;

export class LockServer {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private logger = createLogger("lock-server");
  private gateway: GoblinGateway;
  private startTime: number;
  private mode: "stdio" | "http" | "sse";
  private port: number;

  constructor(gateway: GoblinGateway, mode: "stdio" | "http" | "sse", port?: number) {
    this.gateway = gateway;
    this.mode = mode;
    this.startTime = Date.now();
    this.port = port || DEFAULT_LOCK_PORT;
  }

  async start(): Promise<void> {
    try {
      this.server = Bun.serve({
        port: this.port,
        hostname: "127.0.0.1",
        fetch: this.handleRequest.bind(this),
      });
      this.logger.info({ port: this.port }, "Lock server started");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "EADDRINUSE"
      ) {
        throw new Error(`Goblin is already running (Port ${this.port} is busy)`);
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.logger.info("Lock server stopped");
    }
  }

  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/status") {
      return Response.json({
        status: "ok",
        mode: this.mode,
        pid: process.pid,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        servers: {
          total: this.gateway.registry.getServerNames().length,
          online: this.gateway.registry.getServerNames().length, // Approximation
          offline: 0,
        },
        tools: this.gateway.registry.getAllTools().length,
      });
    }

    if (req.method === "POST" && url.pathname === "/stop") {
      this.logger.info("Received stop command via Lock Server");
      // Schedule shutdown
      setTimeout(() => {
        this.gateway.stop().then(() => {
          this.stop();
          process.exit(0);
        });
      }, 100);
      return Response.json({ status: "ok" });
    }

    if (req.method === "GET" && url.pathname === "/ping") {
      return Response.json({ pong: true });
    }

    // Proxy for tools list
    if (req.method === "GET" && url.pathname === "/tools") {
      const serverName = url.searchParams.get("server");
      const tools = this.gateway.registry.getAllTools();
      const filteredTools = serverName ? tools.filter((t) => t.serverId === serverName) : tools;

      // Map ToolEntry to expected format
      const mappedTools = filteredTools.map((t) => ({
        name: t.id,
        serverId: t.serverId,
        description: t.def.description || "",
      }));

      return Response.json({ tools: mappedTools });
    }
    // Proxy for servers list
    if (req.method === "GET" && url.pathname === "/servers") {
      const serverNames = this.gateway.registry.getServerNames();
      const servers = serverNames.map((name) => ({
        name,
        status: "online", // Since they are in registry, they are connected
        transport: "unknown", // Need to expose transport info in registry to be accurate
        tools: this.gateway.registry.getToolsForServer(name).length,
      }));
      return Response.json({ servers });
    }

    // Proxy for health
    if (req.method === "GET" && url.pathname === "/health") {
      // Simple health check for now
      return Response.json({
        status: "healthy",
        servers: this.gateway.registry
          .getServerNames()
          .map((name) => ({ name, status: "healthy" })),
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}

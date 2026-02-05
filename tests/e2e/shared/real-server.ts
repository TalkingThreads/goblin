/**
 * Real Server Manager for E2E Testing
 *
 * Manages lifecycle of real MCP servers for testing against
 * actual backend implementations.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { kill } from "node:process";

export interface ServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  workingDir?: string;
  startupTimeout: number;
  port?: number;
}

export interface ServerHealth {
  healthy: boolean;
  latency: number;
  error?: string;
}

export type ServerStatus = "stopped" | "starting" | "running" | "error" | "stopping";

/**
 * Manages a real MCP server process for testing
 */
export class RealMcpServer {
  private process: ChildProcess | null = null;
  private status: ServerStatus = "stopped";
  private startTime: number = 0;
  private tempDir: string;

  constructor(private config: ServerConfig) {
    this.tempDir = mkdtempSync(join(tmpdir(), `goblin-e2e-${config.name}-`));
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.status === "running") {
      return;
    }

    this.status = "starting";

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.status = "error";
        reject(
          new Error(
            `Server ${this.config.name} failed to start within ${this.config.startupTimeout}ms`,
          ),
        );
      }, this.config.startupTimeout);

      try {
        this.process = spawn(this.config.command, this.config.args, {
          cwd: this.config.workingDir || this.tempDir,
          env: {
            ...process.env,
            ...this.config.env,
          },
          stdio: ["pipe", "pipe", "pipe"],
        });

        this.process.stdout?.on("data", (data) => {
          if (this.status === "starting" && this.isReady(data.toString())) {
            clearTimeout(timeout);
            this.status = "running";
            this.startTime = Date.now();
            resolve();
          }
        });

        this.process.stderr?.on("data", (data) => {
          console.error(`[${this.config.name}] stderr: ${data}`);
        });

        this.process.on("error", (error) => {
          clearTimeout(timeout);
          this.status = "error";
          reject(error);
        });

        this.process.on("exit", () => {
          if (this.status === "running") {
            this.status = "stopped";
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        this.status = "error";
        reject(error);
      }
    });
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (this.status !== "running" || !this.process) {
      return;
    }

    this.status = "stopping";

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (this.process?.pid) {
          kill(this.process.pid);
        }
        resolve();
      }, 5000);

      const process = this.process;
      process?.on("exit", () => {
        clearTimeout(timeout);
        this.status = "stopped";
        this.process = null;
        resolve();
      });

      if (this.process?.pid) {
        kill(this.process.pid);
      }
    });
  }

  /**
   * Check server health
   */
  async healthCheck(): Promise<ServerHealth> {
    const start = Date.now();
    // Simulated health check - in real implementation, ping the server
    const latency = Date.now() - start;

    return {
      healthy: this.status === "running",
      latency,
    };
  }

  /**
   * Check if server output indicates readiness
   */
  private isReady(output: string): boolean {
    // Check for common readiness indicators
    const readyPatterns = [/server running/i, /listening/i, /ready/i, /connected/i, /initialized/i];

    return readyPatterns.some((pattern) => pattern.test(output));
  }

  /**
   * Get server endpoint for HTTP transports
   */
  getEndpoint(): string {
    return `http://localhost:${this.config.port || 3001}`;
  }

  /**
   * Get server status
   */
  getStatus(): ServerStatus {
    return this.status;
  }

  /**
   * Get server uptime in milliseconds
   */
  getUptime(): number {
    if (this.startTime === 0) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Clean up temporary files
   */
  cleanup(): void {
    try {
      rmSync(this.tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Server pool for managing multiple real servers
 */
export class ServerPool {
  private servers: Map<string, RealMcpServer> = new Map();

  /**
   * Register a server configuration
   */
  register(config: ServerConfig): void {
    if (this.servers.has(config.name)) {
      throw new Error(`Server ${config.name} already registered`);
    }
    this.servers.set(config.name, new RealMcpServer(config));
  }

  /**
   * Get a server by name
   */
  get(name: string): RealMcpServer | undefined {
    return this.servers.get(name);
  }

  /**
   * Start all registered servers
   */
  async startAll(): Promise<void> {
    await Promise.all(Array.from(this.servers.values()).map((server) => server.start()));
  }

  /**
   * Stop all registered servers
   */
  async stopAll(): Promise<void> {
    await Promise.all(Array.from(this.servers.values()).map((server) => server.stop()));
  }

  /**
   * Health check all servers
   */
  async healthCheckAll(): Promise<Map<string, ServerHealth>> {
    const results = new Map<string, ServerHealth>();

    await Promise.all(
      Array.from(this.servers.entries()).map(async ([name, server]) => {
        results.set(name, await server.healthCheck());
      }),
    );

    return results;
  }

  /**
   * Clean up all servers
   */
  async cleanup(): Promise<void> {
    await this.stopAll();
    for (const server of this.servers.values()) {
      server.cleanup();
    }
    this.servers.clear();
  }

  /**
   * Get list of server names
   */
  listNames(): string[] {
    return Array.from(this.servers.keys());
  }
}

/**
 * Predefined server configurations for testing
 */
export const TestServerConfigs = {
  filesystem: (): ServerConfig => ({
    name: "filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp/goblin-test-files"],
    startupTimeout: 30000,
  }),

  github: (): ServerConfig => ({
    name: "github",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    startupTimeout: 30000,
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || "test-token",
    },
  }),

  postgres: (): ServerConfig => ({
    name: "postgres",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/test"],
    startupTimeout: 30000,
  }),

  google: (): ServerConfig => ({
    name: "google",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-google"],
    startupTimeout: 30000,
  }),
};

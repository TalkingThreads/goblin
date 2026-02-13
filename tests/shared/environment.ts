/**
 * Test Environment Utilities
 *
 * Utilities for starting Goblin gateway and connecting real MCP clients
 * for integration testing.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import { join } from "node:path";

import { getTestFileManager } from "./test-file-manager.js";

export interface GatewayConfig {
  $schema?: string;
  servers?: Array<{
    name: string;
    transport: string;
    command?: string;
    args?: string[];
    url?: string;
    enabled?: boolean;
  }>;
  gateway: {
    port?: number;
    host: string;
  };
  auth?: {
    mode: string;
  };
  policies?: {
    defaultTimeout?: number;
  };
}

export interface TestEnvironment {
  name: string;
  cleanup: () => Promise<void>;
  createGatewayConfig: (
    servers?: Array<{
      name: string;
      transport: string;
      command?: string;
      args?: string[];
      url?: string;
      enabled?: boolean;
    }>,
  ) => GatewayConfig;
  getFreePort: () => Promise<number>;
  startGoblinGateway: (config: GatewayConfig) => Promise<ChildProcess>;
  waitForGatewayReady: (port: number, timeout?: number) => Promise<number>;
}

/**
 * Get a free port on the system
 */
export async function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

/**
 * Create a test environment for integration testing
 */
export function createTestEnvironment(options: {
  name: string;
  useDocker?: boolean;
}): TestEnvironment {
  const processes: ChildProcess[] = [];

  const cleanup = async () => {
    for (const proc of processes) {
      try {
        proc.kill("SIGTERM");
      } catch {
        // Ignore cleanup errors
      }
    }
    const fileManager = getTestFileManager();
    await fileManager.cleanup();
  };

  const createGatewayConfig = (
    servers?: Array<{
      name: string;
      transport: string;
      command?: string;
      args?: string[];
      url?: string;
      enabled?: boolean;
    }>,
  ): GatewayConfig => {
    return {
      $schema: "./config.schema.json",
      servers: servers || [],
      gateway: {
        host: "127.0.0.1",
      },
      auth: {
        mode: "dev",
      },
      policies: {
        defaultTimeout: 30000,
      },
    };
  };

  const startGoblinGateway = async (config: GatewayConfig): Promise<ChildProcess> => {
    const fileManager = getTestFileManager();
    const configHandle = await fileManager.createConfigFile(config, { prefix: "goblin" });
    const configPath = configHandle.path;

    const goblinBinary = join(process.cwd(), "dist", "index.js");

    const bunPath = process.env.BUN_PATH || join(process.cwd(), "node_modules", ".bin", "bun");
    const executablePath = existsSync(bunPath) ? bunPath : process.execPath;

    // Use a unique lock port for tests to avoid conflicts
    const testLockPort = 12490 + Math.floor(Math.random() * 1000);

    const childProcess = spawn(
      executablePath,
      [goblinBinary, "start", "--config", configPath, "--transport", "http"],
      {
        stdio: ["ignore", "pipe", "pipe"] as ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          LOG_LEVEL: "warn",
          GOBLIN_LOCK_PORT: String(testLockPort),
        },
      },
    );

    let actualPort: number | null = null;

    childProcess.stdout?.on("data", (data) => {
      const text = data.toString();
      process.stdout.write(`[GATEWAY] ${text}`);

      // Extract port from startup message
      const portMatch = text.match(/MCP:\s*http:\/\/[^:]+:(\d+)\//);
      if (portMatch && !actualPort) {
        actualPort = parseInt(portMatch[1], 10);
        // Update config with actual port for tests to use
        config.gateway.port = actualPort;
      }
    });

    childProcess.stderr?.on("data", (data) => {
      process.stderr.write(`[GATEWAY ERROR] ${data.toString()}`);
    });

    childProcess.on("error", (err) => {
      console.error(`[TEST] Failed to spawn gateway: ${err.message}`);
    });

    childProcess.on("exit", (code) => {
      console.log(`[TEST] Gateway exited with code ${code}`);
    });

    processes.push(childProcess);

    return childProcess;
  };

  const waitForGatewayReady = async (port: number, timeout = 10000): Promise<number> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        await new Promise<void>((resolve, reject) => {
          const req = http.request(
            {
              hostname: "127.0.0.1",
              port,
              path: "/health",
              method: "GET",
              timeout: 1000,
            },
            (res) => {
              if (res.statusCode === 200) {
                resolve();
              } else {
                reject(new Error(`Health check returned ${res.statusCode}`));
              }
            },
          );
          req.on("error", reject);
          req.on("timeout", () => {
            req.destroy();
            reject(new Error("Health check timeout"));
          });
          req.end();
        });
        return port;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    throw new Error(`Gateway did not become ready within ${timeout}ms`);
  };

  return {
    name: options.name,
    cleanup,
    createGatewayConfig,
    getFreePort,
    startGoblinGateway,
    waitForGatewayReady,
  };
}

/**
 * Simple mock server config for testing
 */
export function createMockServerConfig(
  name: string,
  transport: "stdio" | "http" | "sse",
): {
  name: string;
  transport: string;
  command?: string;
  args?: string[];
  url?: string;
  enabled: boolean;
} {
  if (transport === "stdio") {
    return {
      name,
      transport: "stdio",
      command: "echo",
      args: ["test"],
      enabled: true,
    };
  } else if (transport === "http") {
    return {
      name,
      transport: "http",
      url: "http://localhost:3001",
      enabled: true,
    };
  } else {
    return {
      name,
      transport: "sse",
      url: "http://localhost:3002/sse",
      enabled: true,
    };
  }
}

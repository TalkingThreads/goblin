/**
 * Test Server Manager for Performance Tests
 *
 * Provides server lifecycle management for performance tests.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface TestServerConfig {
  gatewayUrl?: string;
  port?: number;
  host?: string;
  configPath?: string;
  startupTimeout?: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
  latency?: number;
}

let serverProcess: ChildProcess | null = null;
let serverUrl: string = "";
const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_STARTUP_TIMEOUT = 30000;

/**
 * Start the gateway server for testing
 */
export async function startTestServer(config: TestServerConfig = {}): Promise<string> {
  const port = config.port || DEFAULT_PORT;
  const host = config.host || DEFAULT_HOST;
  serverUrl = `http://${host}:${port}`;

  if (serverProcess) {
    console.log("Server already running at", serverUrl);
    return serverUrl;
  }

  const binaryExists = existsSync(join(process.cwd(), "dist/cli/index.js"));

  if (!binaryExists) {
    throw new Error(
      "Gateway binary not found at dist/cli/index.js. Run 'bun run build:cli' first.",
    );
  }

  const command = "bun";
  const scriptArgs = ["dist/cli/index.js"];
  const serverArgs = ["start", "--port", port.toString()];
  if (config.configPath) {
    serverArgs.push("--config", config.configPath);
  }

  console.log("Starting test server at", serverUrl);

  let attempts = 0;
  const maxAttempts = 10;

  const attemptStart = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = config.startupTimeout || DEFAULT_STARTUP_TIMEOUT;
      const startupTimer = setTimeout(() => {
        if (serverProcess) {
          serverProcess.kill("SIGTERM");
          serverProcess = null;
        }
        reject(new Error(`Server failed to start within ${timeout}ms`));
      }, timeout);

      serverProcess = spawn(command, [...scriptArgs, ...serverArgs], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NO_COLOR: "1",
          LOG_LEVEL: "info",
        },
      });

      serverProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        if (
          output.includes("Goblin Gateway started successfully") ||
          output.includes("Goblin Gateway is running")
        ) {
          clearTimeout(startupTimer);
          console.log("Test server started successfully");
          resolve(serverUrl);
        }
      });

      serverProcess.stderr?.on("data", (data) => {
        const output = data.toString();
        if (
          output.includes("Goblin Gateway started successfully") ||
          output.includes("Goblin Gateway is running")
        ) {
          clearTimeout(startupTimer);
          console.log("Test server started successfully");
          resolve(serverUrl);
        }
      });

      serverProcess.on("error", (error) => {
        clearTimeout(startupTimer);
        serverProcess = null;
        reject(error);
      });

      serverProcess.on("exit", (code) => {
        if (serverProcess && code !== 0 && code !== null) {
          clearTimeout(startupTimer);
          serverProcess = null;
          reject(new Error(`Server exited with code ${code}`));
        }
      });
    });
  };

  while (attempts < maxAttempts) {
    try {
      return await attemptStart();
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      console.log(`Server start attempt ${attempts} failed, retrying in 1s...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error("Failed to start server after maximum attempts");
}

/**
 * Stop the test server
 */
export async function stopTestServer(): Promise<void> {
  if (!serverProcess) {
    console.log("No server running");
    return;
  }

  console.log("Stopping test server...");

  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      serverProcess = null;
      console.log("Test server stopped");
    };

    serverProcess!.on("exit", cleanup);
    serverProcess!.on("error", cleanup);

    serverProcess!.kill("SIGTERM");

    setTimeout(() => {
      if (serverProcess) {
        serverProcess!.kill("SIGKILL");
        cleanup();
      }
      resolve();
    }, 3000);
  });
}

/**
 * Check if the server is healthy
 */
export async function checkServerHealth(gatewayUrl?: string): Promise<HealthCheckResult> {
  const url = gatewayUrl || serverUrl || `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
  const start = Date.now();

  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return {
        healthy: true,
        message: "Server is healthy",
        latency,
      };
    }

    return {
      healthy: false,
      message: `Server returned status ${response.status}`,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Get the current server URL
 */
export function getServerUrl(): string {
  return serverUrl;
}

/**
 * Check if server is currently running
 */
export function isServerRunning(): boolean {
  return serverProcess !== null;
}

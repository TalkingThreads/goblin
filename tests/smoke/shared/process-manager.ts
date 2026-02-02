/**
 * Process Manager for Smoke Tests
 *
 * Manages gateway subprocess lifecycle for testing.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export interface ProcessManagerConfig {
  binaryPath?: string;
  workingDir?: string;
  env?: Record<string, string>;
  startupTimeout?: number;
  shutdownTimeout?: number;
}

export interface ManagedProcess {
  process: ChildProcess;
  pid: number;
  port: number;
  baseUrl: string;
}

export interface ProcessMetrics {
  exitCode: number | null;
  signal: string | null;
  duration: number;
  memoryUsage: number;
}

/**
 * Manages gateway subprocess lifecycle for testing
 */
export class ProcessManager {
  private process: ChildProcess | null = null;
  private tempDir: string;
  private config: ProcessManagerConfig;
  private startTime: number = 0;

  constructor(config: ProcessManagerConfig = {}) {
    this.config = {
      binaryPath: `bun ${resolve("dist/cli/index.js")}`,
      startupTimeout: 10000,
      shutdownTimeout: 5000,
      ...config,
    };
    this.tempDir = mkdtempSync(join(tmpdir(), "goblin-smoke-"));
  }

  /**
   * Start the gateway process
   */
  async start(args: string[] = []): Promise<ManagedProcess> {
    const port = await this.findAvailablePort();
    const baseUrl = `http://localhost:${port}`;

    this.startTime = Date.now();

    const fullArgs = ["start", "--port", port.toString(), ...args];
    const [cmd, ...cmdArgs] = (this.config.binaryPath || "bun").split(" ");
    const finalArgs = [...cmdArgs, ...fullArgs];

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Gateway startup timed out after ${this.config.startupTimeout}ms`));
      }, this.config.startupTimeout);

      this.process = spawn(cmd!, finalArgs, {
        cwd: this.tempDir,
        env: {
          ...process.env,
          ...this.config.env,
          NO_COLOR: "1",
          GOBLIN_LOG_LEVEL: "error",
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let combinedOutput = "";
      let started = false;

      const handleOutput = (data: string | Buffer) => {
        const output = data.toString();
        combinedOutput += output;

        if (
          combinedOutput.includes("started") ||
          combinedOutput.includes("listening") ||
          combinedOutput.includes("ready") ||
          combinedOutput.includes("running")
        ) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            resolve({
              process: this.process!,
              pid: this.process!.pid!,
              port,
              baseUrl,
            });
          }
        }
      };

      this.process.stdout?.on("data", handleOutput);
      this.process.stderr?.on("data", handleOutput);

      this.process.on("error", (error) => {
        if (!started) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      this.process.on("exit", (code) => {
        if (!started) {
          clearTimeout(timeout);
          const finalError =
            combinedOutput.trim() || `Gateway exited unexpectedly with code ${code}`;
          reject(new Error(`Gateway failed to start: ${finalError}`));
        }
      });
    });
  }

  /**
   * Start gateway and wait for health endpoint
   */
  async startWithHealthCheck(httpClient: {
    get: (url: string) => Promise<{ status: number; json: () => Promise<unknown> }>;
  }): Promise<ManagedProcess> {
    const managed = await this.start();

    // Wait for health endpoint
    const maxAttempts = 20;
    const interval = 500;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await httpClient.get(`${managed.baseUrl}/health`);
        if (response.status === 200) {
          return managed;
        }
      } catch {
        // Ignore, try again
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    throw new Error("Health endpoint not responding after startup");
  }

  /**
   * Stop the gateway process gracefully
   */
  async stop(signal: "SIGTERM" | "SIGINT" = "SIGTERM"): Promise<ProcessMetrics> {
    if (!this.process) {
      return {
        exitCode: 0,
        signal: null,
        duration: 0,
        memoryUsage: 0,
      };
    }

    const duration = Date.now() - this.startTime;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Force kill if graceful shutdown fails
        if (this.process) {
          this.process.kill("SIGKILL");
        }
      }, this.config.shutdownTimeout);

      if (this.process) {
        this.process.on("exit", (code, signal) => {
          clearTimeout(timeout);
          resolve({
            exitCode: code,
            signal,
            duration,
            memoryUsage: 0,
          });
        });

        this.process.kill(signal);
        this.process = null;
      }
    });
  }

  /**
   * Force kill the process
   */
  kill(): void {
    if (this.process) {
      this.process.kill("SIGKILL");
      this.process = null;
    }
  }

  /**
   * Check if process is running
   */
  isRunning(): boolean {
    return this.process !== null && this.process.exitCode === null;
  }

  /**
   * Get process ID
   */
  getPid(): number | null {
    return this.process?.pid ?? null;
  }

  /**
   * Clean up temporary directory
   */
  cleanup(): void {
    if (this.process) {
      try {
        this.process.kill("SIGTERM");
      } catch {
        // Ignore
      }
      this.process = null;
    }

    try {
      rmSync(this.tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Get temp directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }

  /**
   * Find an available port
   */
  private async findAvailablePort(): Promise<number> {
    const net = await import("node:net");
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(0, () => {
        const port = (server.address() as { port: number }).port;
        server.close(() => resolve(port));
      });
    });
  }
}

/**
 * Pool of process managers for parallel test execution
 */
export class ProcessPool {
  private pool: ProcessManager[] = [];
  private maxSize: number;

  constructor(maxSize: number = 4) {
    this.maxSize = maxSize;
  }

  /**
   * Acquire a process manager from the pool
   */
  async acquire(config?: ProcessManagerConfig): Promise<ProcessManager> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return new ProcessManager(config);
  }

  /**
   * Release a process manager back to the pool
   */
  release(manager: ProcessManager): void {
    if (this.pool.length < this.maxSize) {
      manager.cleanup();
      this.pool.push(manager);
    }
  }

  /**
   * Clean up all processes in the pool
   */
  async cleanupAll(): Promise<void> {
    for (const manager of this.pool) {
      manager.cleanup();
    }
    this.pool = [];
  }

  /**
   * Get pool size
   */
  size(): number {
    return this.pool.length;
  }
}

/**
 * Test Environment for E2E Testing
 *
 * Provides isolated test environments with proper cleanup.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface TestEnvironmentConfig {
  name: string;
  useDocker: boolean;
  dockerImage?: string;
}

export interface EnvironmentCleanup {
  directories: string[];
  files: string[];
  dockerContainers: string[];
}

/**
 * Provides isolated test environments
 */
export class TestEnvironment {
  private tempDirs: string[] = [];
  private cleanupState: EnvironmentCleanup = {
    directories: [],
    files: [],
    dockerContainers: [],
  };

  /**
   * Create a temporary directory for the test
   */
  async createTempDirectory(prefix: string = "goblin-e2e-"): Promise<string> {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    this.tempDirs.push(dir);
    this.cleanupState.directories.push(dir);
    return dir;
  }

  /**
   * Create a temporary file
   */
  async createTempFile(name: string, content: string): Promise<string> {
    const dir = await this.createTempDirectory();
    const filePath = join(dir, name);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(filePath, content);
    this.cleanupState.files.push(filePath);
    return filePath;
  }

  /**
   * Get the test data directory
   */
  getTestDataDir(): string {
    return join(process.cwd(), "tests", "e2e", "test-data");
  }

  /**
   * Get a sample project directory
   */
  getSampleProjectDir(): string {
    return join(this.getTestDataDir(), "projects");
  }

  /**
   * Get a sample configs directory
   */
  getSampleConfigsDir(): string {
    return join(this.getTestDataDir(), "configs");
  }

  /**
   * Create a mock MCP server config for testing
   */
  createMockServerConfig(
    name: string,
    transport: "stdio" | "http" | "sse" | "streamablehttp",
  ): object {
    return {
      name,
      transport,
      enabled: true,
      ...(transport === "stdio" && {
        command: "echo",
        args: ["test"],
      }),
      ...(transport === "http" && {
        url: "http://localhost:3001",
      }),
      ...(transport === "sse" && {
        url: "http://localhost:3002/sse",
      }),
      ...(transport === "streamablehttp" && {
        url: "http://localhost:3003/mcp",
      }),
    };
  }

  /**
   * Create a gateway config for testing
   */
  createGatewayConfig(servers: object[]): object {
    return {
      $schema: "./config.schema.json",
      servers,
      gateway: {
        port: 0,
        host: "127.0.0.1",
      },
      auth: {
        mode: "dev",
      },
      policies: {
        outputSizeLimit: 65536,
        defaultTimeout: 30000,
      },
    };
  }

  /**
   * Register a cleanup handler
   */
  onCleanup(_callback: () => Promise<void> | void): void {
    // Placeholder for cleanup registration
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    // Clean up temporary directories
    for (const dir of this.tempDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    this.tempDirs = [];

    // Clean up registered files
    for (const file of this.cleanupState.files) {
      try {
        rmSync(file, { force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    this.cleanupState.files = [];

    // Clean up registered directories
    for (const dir of this.cleanupState.directories) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    this.cleanupState.directories = [];
  }

  /**
   * Get environment info for debugging
   */
  getEnvironmentInfo(): Record<string, unknown> {
    return {
      tempDirCount: this.tempDirs.length,
      cleanupPending: {
        files: this.cleanupState.files.length,
        directories: this.cleanupState.directories.length,
        containers: this.cleanupState.dockerContainers.length,
      },
      os: {
        platform: process.platform,
        tmpdir: tmpdir(),
      },
    };
  }
}

/**
 * Global test environment singleton
 */
let globalEnvironment: TestEnvironment | null = null;

/**
 * Get or create the global test environment
 */
export function getTestEnvironment(): TestEnvironment {
  if (!globalEnvironment) {
    globalEnvironment = new TestEnvironment({ name: "global", useDocker: false });
  }
  return globalEnvironment;
}

/**
 * Initialize the global test environment
 */
export async function initTestEnvironment(): Promise<TestEnvironment> {
  globalEnvironment = new TestEnvironment({ name: "global", useDocker: false });
  return globalEnvironment;
}

/**
 * Clean up the global test environment
 */
export async function cleanupTestEnvironment(): Promise<void> {
  if (globalEnvironment) {
    await globalEnvironment.cleanup();
    globalEnvironment = null;
  }
}

/**
 * Test File Manager
 *
 * A centralized utility for managing temporary test files and directories.
 * Ensures all test artifacts are stored in a consistent location and cleaned up properly.
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TEST_OUTPUT_FOLDER = "test-output";

export interface TestFileOptions {
  /**
   * Prefix for the file name (before the timestamp)
   */
  prefix?: string;
  /**
   * Suffix for the file name (after the extension)
   */
  suffix?: string;
  /**
   * File extension (without the dot)
   */
  extension?: string;
  /**
   * Custom directory within the test-output folder
   */
  subDir?: string;
}

export interface TestFileHandle {
  /**
   * Full path to the created file
   */
  path: string;
  /**
   * Just the file name
   */
  name: string;
  /**
   * Remove this specific file
   */
  remove: () => Promise<void>;
}

/**
 * Manages temporary test files and directories in a centralized location.
 * All files are stored under a `test-output` folder in the current working directory.
 */
export class TestFileManager {
  private static instance: TestFileManager;
  private baseDir: string;
  private managedPaths: Set<string> = new Set();

  private constructor() {
    this.baseDir = join(process.cwd(), TEST_OUTPUT_FOLDER);
  }

  /**
   * Get the singleton instance of TestFileManager
   */
  static getInstance(): TestFileManager {
    if (!TestFileManager.instance) {
      TestFileManager.instance = new TestFileManager();
    }
    return TestFileManager.instance;
  }

  /**
   * Get the base directory for test output files
   */
  getBaseDir(): string {
    return this.baseDir;
  }

  /**
   * Ensure the test-output directory exists
   */
  async ensureBaseDir(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
  }

  /**
   * Generate a unique file name with optional prefix/suffix
   */
  private generateFileName(options: TestFileOptions = {}): string {
    const { prefix = "file", suffix = "", extension = "tmp" } = options;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const name = `${prefix}-${timestamp}-${random}${suffix ? `-${suffix}` : ""}.${extension}`;
    return name;
  }

  /**
   * Create a temporary file with the given content
   */
  async createFile(
    content: string | Buffer,
    options: TestFileOptions = {},
  ): Promise<TestFileHandle> {
    await this.ensureBaseDir();

    const subDir = options.subDir ? join(this.baseDir, options.subDir) : this.baseDir;
    await mkdir(subDir, { recursive: true });

    const fileName = this.generateFileName(options);
    const filePath = join(subDir, fileName);

    await writeFile(filePath, content);

    this.managedPaths.add(filePath);

    return {
      path: filePath,
      name: fileName,
      remove: async () => {
        this.managedPaths.delete(filePath);
        await this.safeRemove(filePath);
      },
    };
  }

  /**
   * Create a temporary JSON file with the given content
   */
  async createJsonFile(content: unknown, options: TestFileOptions = {}): Promise<TestFileHandle> {
    return this.createFile(JSON.stringify(content, null, 2), {
      ...options,
      extension: options.extension || "json",
    });
  }

  /**
   * Create a temporary config file with the given content
   */
  async createConfigFile(content: unknown, options: TestFileOptions = {}): Promise<TestFileHandle> {
    return this.createJsonFile(content, {
      prefix: options.prefix || "config",
      subDir: options.subDir || "configs",
      ...options,
    });
  }

  /**
   * Create a temporary directory for test purposes
   */
  async createDir(options: { prefix?: string; subDir?: string } = {}): Promise<string> {
    await this.ensureBaseDir();

    const { prefix = "dir", subDir } = options;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const dirName = `${prefix}-${timestamp}-${random}`;

    const dirPath = subDir ? join(this.baseDir, subDir, dirName) : join(this.baseDir, dirName);
    await mkdir(dirPath, { recursive: true });

    this.managedPaths.add(dirPath);
    return dirPath;
  }

  /**
   * Remove a specific file or directory safely
   */
  private async safeRemove(path: string): Promise<void> {
    try {
      await rm(path, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Remove a specific managed path
   */
  async remove(path: string): Promise<void> {
    this.managedPaths.delete(path);
    await this.safeRemove(path);
  }

  /**
   * Clean up all managed files and directories
   */
  async cleanup(): Promise<void> {
    for (const path of this.managedPaths) {
      await this.safeRemove(path);
    }
    this.managedPaths.clear();

    await this.safeRemove(this.baseDir);
  }

  /**
   * Get list of all currently managed paths
   */
  getManagedPaths(): string[] {
    return Array.from(this.managedPaths);
  }

  /**
   * Get the number of currently managed paths
   */
  getManagedCount(): number {
    return this.managedPaths.size;
  }
}

/**
 * Convenience function to get the TestFileManager instance
 */
export function getTestFileManager(): TestFileManager {
  return TestFileManager.getInstance();
}

/**
 * Helper to create a test config file with proper structure
 */
export async function createTestConfigFile(
  config: Record<string, unknown>,
  prefix?: string,
): Promise<TestFileHandle> {
  const manager = getTestFileManager();
  return manager.createConfigFile(config, { prefix });
}

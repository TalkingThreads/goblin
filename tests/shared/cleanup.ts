/**
 * Cleanup Manager
 *
 * Manages cleanup of test resources to ensure proper isolation.
 */

export interface CleanupTask {
  id: string;
  description: string;
  callback: () => Promise<void> | void;
  priority?: number;
}

export class CleanupManager {
  private tasks: CleanupTask[] = [];
  private running = false;
  private completed = false;

  /**
   * Add a cleanup task
   */
  add(description: string, callback: () => Promise<void> | void, priority: number = 0): string {
    const id = `cleanup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.tasks.push({
      id,
      description,
      callback,
      priority,
    });
    // Sort by priority (higher priority runs first)
    this.tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return id;
  }

  /**
   * Add an async cleanup task
   */
  async addAsync(
    description: string,
    callback: () => Promise<void>,
    priority?: number,
  ): Promise<string> {
    return this.add(description, callback, priority);
  }

  /**
   * Remove a cleanup task by ID
   */
  remove(id: string): boolean {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index >= 0) {
      this.tasks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Run all cleanup tasks
   */
  async run(): Promise<void> {
    if (this.running) {
      console.warn("Cleanup already running, skipping");
      return;
    }

    if (this.completed) {
      console.warn("Cleanup already completed, skipping");
      return;
    }

    this.running = true;
    const errors: Array<{ task: CleanupTask; error: Error }> = [];

    // Run cleanup tasks in reverse order (lower priority first)
    for (const task of [...this.tasks].reverse()) {
      try {
        const result = task.callback();
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        errors.push({ task, error: error as Error });
      }
    }

    this.tasks = [];
    this.completed = true;
    this.running = false;

    if (errors.length > 0) {
      console.error(`Cleanup completed with ${errors.length} errors:`);
      for (const { task, error } of errors) {
        console.error(`  - ${task.description}: ${error.message}`);
      }
    }
  }

  /**
   * Get the number of pending cleanup tasks
   */
  getPendingCount(): number {
    return this.tasks.length;
  }

  /**
   * Check if cleanup is already completed
   */
  isCompleted(): boolean {
    return this.completed;
  }

  /**
   * Check if cleanup is currently running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get a summary of cleanup tasks
   */
  getSummary(): Array<{ id: string; description: string; priority: number }> {
    return this.tasks.map((t) => ({
      id: t.id,
      description: t.description,
      priority: t.priority || 0,
    }));
  }

  /**
   * Clear all cleanup tasks without running them
   */
  clear(): void {
    this.tasks = [];
  }
}

/**
 * Create a cleanup manager for a test
 */
export function createCleanupManager(): CleanupManager {
  return new CleanupManager();
}

/**
 * Register cleanup for a server
 */
export function registerServerCleanup(
  cleanup: CleanupManager,
  server: { stop: () => Promise<void> },
  name: string = "server",
): void {
  cleanup.add(
    `Stop ${name}`,
    async () => {
      if (server.stop) {
        await server.stop();
      }
    },
    100,
  );
}

/**
 * Register cleanup for a client
 */
export function registerClientCleanup(
  cleanup: CleanupManager,
  client: { disconnect: () => Promise<void> },
  name: string = "client",
): void {
  cleanup.add(
    `Disconnect ${name}`,
    async () => {
      if (client.disconnect) {
        await client.disconnect();
      }
    },
    90,
  );
}

/**
 * Register cleanup for a gateway
 */
export function registerGatewayCleanup(
  cleanup: CleanupManager,
  gateway: { stop: () => Promise<void> },
  name: string = "gateway",
): void {
  cleanup.add(
    `Stop ${name}`,
    async () => {
      if (gateway.stop) {
        await gateway.stop();
      }
    },
    100,
  );
}

/**
 * Register cleanup for a file
 */
export function registerFileCleanup(cleanup: CleanupManager, path: string): void {
  cleanup.add(
    `Delete file: ${path}`,
    async () => {
      try {
        const { unlink } = await import("node:fs/promises");
        await unlink(path);
      } catch (error) {
        // Ignore if file doesn't exist
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    },
    50,
  );
}

/**
 * Register cleanup for a directory
 */
export function registerDirectoryCleanup(cleanup: CleanupManager, path: string): void {
  cleanup.add(
    `Delete directory: ${path}`,
    async () => {
      try {
        const { rm } = await import("node:fs/promises");
        await rm(path, { recursive: true, force: true });
      } catch (error) {
        // Ignore if directory doesn't exist
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    },
    50,
  );
}

/**
 * Register cleanup for a timer/interval
 */
export function registerTimerCleanup(
  cleanup: CleanupManager,
  timer: NodeJS.Timeout,
  description: string = "timer",
): void {
  cleanup.add(
    `Clear ${description}`,
    () => {
      clearInterval(timer);
    },
    50,
  );
}

/**
 * Create a test context with automatic cleanup
 */
export interface TestContext {
  cleanup: CleanupManager;
  addCleanup: (description: string, callback: () => Promise<void> | void) => void;
}

export function createTestContext(): TestContext {
  const cleanup = createCleanupManager();

  return {
    cleanup,
    addCleanup: (description, callback) => {
      cleanup.add(description, callback);
    },
  };
}

/**
 * Run cleanup with error handling
 */
export async function runCleanup(cleanup: CleanupManager): Promise<void> {
  try {
    await cleanup.run();
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

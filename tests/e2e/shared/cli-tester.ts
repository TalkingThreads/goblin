/**
 * CLI Tester for E2E Testing
 *
 * Tests CLI commands by spawning processes and capturing output.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface CliTesterConfig {
  binaryPath?: string;
  workingDir?: string;
  env?: Record<string, string>;
  timeout: number;
}

export interface CommandResult {
  command: string;
  args: string[];
  result: CliResult;
}

/**
 * Tests CLI commands by spawning the goblin process
 */
export class CliTester {
  private process: ChildProcess | null = null;
  private stdout: string = "";
  private stderr: string = "";
  private tempDir: string;

  constructor(
    private config: CliTesterConfig = {
      binaryPath: "node dist/cli/index.js",
      timeout: 30000,
    },
  ) {
    this.tempDir = mkdtempSync(join(tmpdir(), "goblin-cli-test-"));
  }

  /**
   * Run a CLI command
   */
  async run(args: string[]): Promise<CliResult> {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.process) {
          this.process.kill("SIGTERM");
        }
        reject(new Error(`Command timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.stdout = "";
      this.stderr = "";

      const fullArgs = args;
      const command = this.config.binaryPath || "bun";

      this.process = spawn(command, fullArgs, {
        cwd: this.config.workingDir || this.tempDir,
        env: {
          ...process.env,
          ...this.config.env,
          NO_COLOR: "1",
        },
        timeout: this.config.timeout,
      });

      this.process.stdout?.on("data", (data) => {
        this.stdout += data.toString();
      });

      this.process.stderr?.on("data", (data) => {
        this.stderr += data.toString();
      });

      this.process.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.process.on("exit", (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - start;

        resolve({
          exitCode: code || 0,
          stdout: this.stdout,
          stderr: this.stderr,
          duration,
        });
      });
    });
  }

  /**
   * Run a command and parse JSON output
   */
  async runJson<T>(args: string[]): Promise<T & CliResult> {
    const result = await this.run([...args, "--json"]);
    const parsed = JSON.parse(result.stdout);

    return {
      ...parsed,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: result.duration,
    };
  }

  /**
   * Run help command
   */
  async help(): Promise<CliResult> {
    return this.run(["--help"]);
  }

  /**
   * Run version command
   */
  async version(): Promise<CliResult> {
    return this.run(["--version"]);
  }

  /**
   * Start gateway in background
   */
  async startGateway(args: string[] = []): Promise<ChildProcess> {
    const startArgs = ["start", ...args];

    this.process = spawn(this.config.binaryPath || "bun", startArgs, {
      cwd: this.tempDir,
      env: {
        ...process.env,
        ...this.config.env,
        NO_COLOR: "1",
      },
    });

    return this.process;
  }

  /**
   * Type command into running process
   */
  async typeCommand(command: string): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error("No running process");
    }

    return new Promise((resolve, reject) => {
      this.process!.stdin!.write(command + "\n", (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * Press key in running process
   */
  async pressKey(key: string): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error("No running process");
    }

    return new Promise((resolve, reject) => {
      this.process!.stdin!.write(key, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * Assert stdout contains text
   */
  assertOutputContains(result: CliResult, text: string): void {
    if (!result.stdout.includes(text)) {
      throw new Error(`Expected output to contain "${text}" but got:\n${result.stdout}`);
    }
  }

  /**
   * Assert exit code
   */
  assertExitCode(result: CliResult, code: number): void {
    if (result.exitCode !== code) {
      throw new Error(`Expected exit code ${code} but got ${result.exitCode}`);
    }
  }

  /**
   * Assert stderr is empty (or has no errors)
   */
  assertNoErrors(result: CliResult): void {
    if (result.stderr.length > 0 && result.exitCode !== 0) {
      console.warn(`Warning: stderr contains output:\n${result.stderr}`);
    }
  }

  /**
   * Create temporary config file
   */
  async createConfig(content: string): Promise<string> {
    const configPath = join(this.tempDir, "config.json");
    await writeFile(configPath, content);
    return configPath;
  }

  /**
   * Create temporary file
   */
  async createFile(name: string, content: string): Promise<string> {
    const filePath = join(this.tempDir, name);
    await writeFile(filePath, content);
    return filePath;
  }

  /**
   * Read file
   */
  async readFile(name: string): Promise<string> {
    const filePath = join(this.tempDir, name);
    return readFile(filePath, "utf-8");
  }

  /**
   * Clean up temporary directory
   */
  async cleanup(): Promise<void> {
    if (this.process) {
      try {
        this.process.kill("SIGTERM");
      } catch {
        // Ignore errors during cleanup
      }
      this.process = null;
    }

    try {
      rm(this.tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Interactive session for TUI testing
 */
export class InteractiveSession {
  private process: ChildProcess | null = null;
  private output: string = "";

  constructor(private binaryPath: string = "node dist/cli/index.js") {}

  /**
   * Start interactive session
   */
  async start(args: string[] = ["start", "--tui"]): Promise<void> {
    this.output = "";

    this.process = spawn(this.binaryPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        NO_COLOR: "1",
        TERM: "xterm",
      },
    });

    this.process.stdout?.on("data", (data) => {
      this.output += data.toString();
    });

    this.process.stderr?.on("data", (data) => {
      this.output += data.toString();
    });

    this.process.on("error", (error) => {
      throw error;
    });

    // Give TUI time to initialize
    await new Promise((r) => setTimeout(r, 1000));
  }

  /**
   * Send keystrokes
   */
  async sendKeys(keys: string[]): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error("No running process");
    }

    for (const key of keys) {
      await new Promise<void>((resolve) => {
        this.process!.stdin!.write(key, () => resolve());
      });
      await new Promise<void>((r) => setTimeout(r, 50));
    }
  }

  /**
   * Send text input
   */
  async sendText(text: string): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error("No running process");
    }

    await new Promise<void>((resolve, reject) => {
      this.process!.stdin!.write(text + "\n", (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * Get current output
   */
  getOutput(): string {
    return this.output;
  }

  /**
   * Check if output contains text
   */
  contains(text: string): boolean {
    return this.output.includes(text);
  }

  /**
   * Terminate session
   */
  async terminate(): Promise<void> {
    if (this.process) {
      this.process.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 500));
      this.process = null;
    }
  }
}

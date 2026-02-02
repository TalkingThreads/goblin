/**
 * Output Capture Utilities for Smoke Tests
 *
 * Utilities for capturing and parsing CLI/process output.
 */

export interface CapturedOutput {
  stdout: string;
  stderr: string;
  combined: string;
  exitCode: number | null;
  duration: number;
}

export interface ParseResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

/**
 * Parse output into lines
 */
export function parseLines(output: string): string[] {
  return output.split("\n").filter((line) => line.length > 0);
}

/**
 * Normalize output for comparison
 */
export function normalizeOutput(output: string): string {
  // Remove ANSI escape sequences for colors
  const ansiPattern = String.raw`\x1b\[[0-9;]*m`;
  const ansiRegex = new RegExp(ansiPattern, "g");
  return output.replace(ansiRegex, "").replace(/\s+/g, " ").trim();
}

/**
 * Check if output contains text
 */
export function contains(output: string, text: string): boolean {
  return output.includes(text);
}

/**
 * Check if output matches regex
 */
export function matches(output: string, regex: RegExp): boolean {
  return regex.test(output);
}

/**
 * Extract value from output using regex
 */
export function extract(output: string, regex: RegExp): string[] {
  const match = output.match(regex);
  return match ? match : [];
}

/**
 * Parse JSON from output
 */
export function parseJson(output: string): ParseResult {
  try {
    const trimmed = output.trim();
    // Try to extract JSON from output (handle prefix/suffix text)
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const value = JSON.parse(jsonMatch[0]);
      return { success: true, value };
    }
    return { success: false, error: "No JSON found in output" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Parse table from output
 */
export function parseTable(output: string): string[][] {
  const lines = parseLines(output);
  return lines.map((line) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0),
  );
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  return `${seconds}s ${milliseconds}ms`;
}

/**
 * Compare outputs (ignoring whitespace and case)
 */
export function compareOutputs(actual: string, expected: string): boolean {
  return normalizeOutput(actual.toLowerCase()) === normalizeOutput(expected.toLowerCase());
}

/**
 * Assert output contains expected text
 */
export function assertContains(actual: string, expected: string, message?: string): void {
  if (!contains(actual, expected)) {
    throw new Error(message ?? `Expected output to contain "${expected}" but got:\n${actual}`);
  }
}

/**
 * Assert exit code is successful
 */
export function assertExitCode(exitCode: number | null, message?: string): void {
  if (exitCode !== 0) {
    throw new Error(message ?? `Expected exit code 0 but got ${exitCode}`);
  }
}

/**
 * Assert exit code indicates failure
 */
export function assertFailure(exitCode: number | null, message?: string): void {
  if (exitCode === 0) {
    throw new Error(message ?? `Expected non-zero exit code but got 0`);
  }
}

/**
 * Assert output matches regex
 */
export function assertMatches(actual: string, regex: RegExp, message?: string): void {
  if (!matches(actual, regex)) {
    throw new Error(message ?? `Expected output to match ${regex} but got:\n${actual}`);
  }
}

/**
 * Assert output is empty
 */
export function assertEmpty(actual: string, message?: string): void {
  if (actual.trim().length > 0) {
    throw new Error(message ?? `Expected empty output but got:\n${actual}`);
  }
}

/**
 * Capture output chunks from a stream
 */
export class OutputCapture {
  private chunks: string[] = [];

  /**
   * Add a chunk of output
   */
  addChunk(data: string | Buffer): void {
    this.chunks.push(data.toString());
  }

  /**
   * Get combined output
   */
  getOutput(): string {
    return this.chunks.join("");
  }

  /**
   * Get stdout only
   */
  getStdout(): string {
    return this.chunks.filter((_, i) => i % 2 === 0).join("");
  }

  /**
   * Get stderr only
   */
  getStderr(): string {
    return this.chunks.filter((_, i) => i % 2 === 1).join("");
  }

  /**
   * Clear captured output
   */
  clear(): void {
    this.chunks = [];
  }

  /**
   * Get as CapturedOutput
   */
  toCapturedOutput(exitCode: number | null, duration: number): CapturedOutput {
    const output = this.getOutput();
    return {
      stdout: this.getStdout(),
      stderr: extractStderr(output),
      combined: output,
      exitCode,
      duration,
    };
  }
}

/**
 * Extract stderr from combined output
 */
function extractStderr(combined: string): string {
  // Simple heuristic: stderr usually comes after stdout
  // This is a best-effort extraction
  const lines = combined.split("\n");
  const stderrLines: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("warning")) {
      stderrLines.push(line);
    }
  }

  return stderrLines.join("\n");
}

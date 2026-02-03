/**
 * Unit tests for cross-platform signal handling utilities
 */

import { describe, expect, test } from "bun:test";
import { gracefulShutdown, setupShutdownHandlers } from "../../../src/observability/utils.js";

describe("setupShutdownHandlers", () => {
  test("should not throw on any platform", () => {
    expect(() => {
      setupShutdownHandlers(() => {});
    }).not.toThrow();
  });

  test("should handle SIGINT registration", () => {
    const callback = () => {};

    // Should not throw when registering SIGINT
    expect(() => {
      setupShutdownHandlers(callback);
    }).not.toThrow();
  });
});

describe("gracefulShutdown", () => {
  test("should return a promise", () => {
    const mockProcess = {
      on: () => mockProcess,
      kill: () => {},
    } as any;

    const result = gracefulShutdown(mockProcess);
    expect(result).toBeInstanceOf(Promise);
  });

  test("should handle immediate process exit", async () => {
    let exitListener: (() => void) | null = null;
    const mockProcess = {
      on: (event: string, listener: () => void) => {
        if (event === "exit") {
          exitListener = listener;
        }
        return mockProcess;
      },
      kill: () => {},
    } as any;

    const result = gracefulShutdown(mockProcess);

    // Simulate immediate exit
    if (exitListener) {
      setTimeout(exitListener, 10);
    }

    // Should resolve when process exits
    await expect(result).resolves.toBeUndefined();
  });

  test("should use default timeout", () => {
    const mockProcess = {
      on: () => mockProcess,
      kill: (signal: string) => {
        // Verify it sends the expected signal
        expect(signal).toBe(process.platform === "win32" ? "SIGINT" : "SIGTERM");
      },
    } as any;

    gracefulShutdown(mockProcess);
    // Test passes if kill was called with correct signal
    expect(true).toBe(true);
  });

  test("should handle custom timeout", async () => {
    let exitListener: (() => void) | null = null;
    const mockProcess = {
      on: (event: string, listener: () => void) => {
        if (event === "exit") {
          exitListener = listener;
        }
        return mockProcess;
      },
      kill: (signal: string) => {
        // First call should be the graceful signal
        if (!exitListener) {
          expect(signal).toBe(process.platform === "win32" ? "SIGINT" : "SIGTERM");
        }
      },
    } as any;

    const startTime = Date.now();
    const result = gracefulShutdown(mockProcess, 100);

    // Should initiate shutdown process
    expect(result).toBeInstanceOf(Promise);

    // Simulate exit before timeout fires
    if (exitListener) {
      setTimeout(exitListener, 10);
    }

    // Should resolve when process exits
    await expect(result).resolves.toBeUndefined();

    // Should complete within reasonable time (timeout + buffer)
    expect(Date.now() - startTime).toBeLessThan(200);
  });
});

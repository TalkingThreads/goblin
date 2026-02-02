/**
 * Error Scenarios E2E Tests
 *
 * Tests for error handling including invalid requests,
 * timeouts, malformed data, and recovery scenarios.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CliTester } from "../shared/cli-tester.js";
import { ErrorInjector, ErrorScenarios } from "../shared/error-injector.js";

describe("Error Scenarios - Invalid Requests", () => {
  let errorInjector: ErrorInjector;

  beforeEach(() => {
    errorInjector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    errorInjector.reset();
  });

  test("tool not found error is generated", () => {
    const rule = ErrorScenarios.toolNotFound("nonexistent-tool");

    expect(rule.name).toBe("tool-not-found-nonexistent-tool");
    expect(rule.error.message).toContain("nonexistent-tool");
    expect(rule.probability).toBe(1);
  });

  test("validation error is generated", () => {
    const rule = ErrorScenarios.validationError("toolName", "is required");

    expect(rule.name).toBe("validation-error-toolName");
    expect(rule.error.message).toContain("Validation failed");
    expect(rule.error.message).toContain("toolName");
  });

  test("error injector triggers error", async () => {
    errorInjector.addRule(ErrorScenarios.validationError("test", "test error"));

    await expect(async () => {
      await errorInjector.inject(async () => {
        throw new Error("Should not reach here");
      });
    }).rejects.toThrow("test error");
  });

  test("error count increments", async () => {
    errorInjector.addRule(ErrorScenarios.timeout("test"));

    try {
      await errorInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    expect(errorInjector.getErrorCount()).toBe(1);
  });

  test("once-only rules are removed after triggering", async () => {
    errorInjector.addRule(ErrorScenarios.toolNotFound("test-tool"));

    try {
      await errorInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    // Should be able to run without error now
    const result = await errorInjector.inject(async () => "success");
    expect(result).toBe("success");
  });
});

describe("Error Scenarios - Timeout Handling", () => {
  let errorInjector: ErrorInjector;

  beforeEach(() => {
    errorInjector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    errorInjector.reset();
  });

  test("timeout error is generated", () => {
    const rule = ErrorScenarios.timeout("test operation", 5000);

    expect(rule.name).toBe("timeout-test operation");
    expect(rule.error.message).toContain("timed out");
    expect(rule.error.message).toContain("5000ms");
  });

  test("timeout with default duration", () => {
    const rule = ErrorScenarios.timeout("operation");

    expect(rule.error.message).toContain("5000ms");
  });

  test("operation completes when no rule triggers", async () => {
    // No rules added
    const result = await errorInjector.inject(async () => "completed");
    expect(result).toBe("completed");
  });

  test("disabled injector allows all operations", async () => {
    const disabledInjector = new ErrorInjector({ maxErrors: 100, enabled: false });
    disabledInjector.addRule(ErrorScenarios.timeout("test"));

    const result = await disabledInjector.inject(async () => "success");
    expect(result).toBe("success");
  });
});

describe("Error Scenarios - Connection Errors", () => {
  let errorInjector: ErrorInjector;

  beforeEach(() => {
    errorInjector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    errorInjector.reset();
  });

  test("connection lost error is generated", () => {
    const rule = ErrorScenarios.connectionLost("test-server");

    expect(rule.name).toBe("connection-lost-test-server");
    expect(rule.error.message).toContain("Connection to test-server lost");
  });

  test("permission denied error is generated", () => {
    const rule = ErrorScenarios.permissionDenied("/protected/resource");

    expect(rule.name).toBe("permission-denied-/protected/resource");
    expect(rule.error.message).toContain("Permission denied");
  });

  test("rate limit error is generated", () => {
    const rule = ErrorScenarios.rateLimited("/api/endpoint");

    expect(rule.name).toBe("rate-limited-/api/endpoint");
    expect(rule.error.message).toContain("Rate limit exceeded");
  });

  test("server error is generated", () => {
    const rule = ErrorScenarios.serverError(500, "Internal Server Error");

    expect(rule.name).toBe("server-error-500");
    expect(rule.error.message).toContain("500");
    expect(rule.error.message).toContain("Internal Server Error");
  });
});

describe("Error Scenarios - Malformed Data", () => {
  let errorInjector: ErrorInjector;

  beforeEach(() => {
    errorInjector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    errorInjector.reset();
  });

  test("malformed data error is generated", () => {
    const rule = ErrorScenarios.malformedData("JSON");

    expect(rule.name).toBe("malformed-data-JSON");
    expect(rule.error.message).toContain("Malformed JSON data received");
  });

  test("error scenarios can be chained", async () => {
    errorInjector.addRule(ErrorScenarios.validationError("field", "invalid"));
    errorInjector.addRule(ErrorScenarios.timeout("operation"));

    // First error should trigger
    try {
      await errorInjector.inject(async () => {
        throw new Error("Should not reach");
      });
    } catch (e) {
      expect((e as Error).message).toContain("invalid");
    }

    // Reset and try second error
    errorInjector.reset();
    errorInjector.addRule(ErrorScenarios.timeout("test"));

    try {
      await errorInjector.inject(async () => {
        throw new Error("Should not reach");
      });
    } catch (e) {
      expect((e as Error).message).toContain("timed out");
    }
  });
});

describe("Error Scenarios - CLI Error Handling", () => {
  let cli: CliTester;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
  });

  afterEach(async () => {
    await cli.cleanup();
  });

  test("invalid option shows error", async () => {
    const result = await cli.run(["--invalid-option"]);

    expect(result.exitCode).toBeGreaterThan(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  test("missing required argument shows error", async () => {
    // Commands that require arguments should show appropriate errors
    const result = await cli.run(["start", "--port", "invalid"]);

    // Should show port validation error or help
    expect(result.exitCode).toBeGreaterThan(0);
  });

  test("unknown subcommand shows error", async () => {
    const result = await cli.run(["unknown-subcommand"]);

    expect(result.exitCode).toBeGreaterThan(0);
  });

  test("file not found error", async () => {
    const result = await cli.run(["--config", "/nonexistent/path/config.json"]);

    expect(result.exitCode).toBeGreaterThan(0);
  });
});

describe("Error Scenarios - Recovery", () => {
  let errorInjector: ErrorInjector;

  beforeEach(() => {
    errorInjector = new ErrorInjector({ maxErrors: 10, enabled: true });
  });

  afterEach(() => {
    errorInjector.reset();
  });

  test("reset clears error count", async () => {
    errorInjector.addRule(ErrorScenarios.timeout("test"));

    try {
      await errorInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    expect(errorInjector.getErrorCount()).toBe(1);

    errorInjector.reset();

    expect(errorInjector.getErrorCount()).toBe(0);
  });

  test("clearRules removes all rules", async () => {
    errorInjector.addRule(ErrorScenarios.timeout("test1"));
    errorInjector.addRule(ErrorScenarios.toolNotFound("test2"));

    errorInjector.clearRules();

    const result = await errorInjector.inject(async () => "success");
    expect(result).toBe("success");
  });

  test("getTriggeredRules returns list of triggered rules", async () => {
    errorInjector.addRule(ErrorScenarios.timeout("op1"));
    errorInjector.addRule(ErrorScenarios.toolNotFound("op2"));

    try {
      await errorInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    errorInjector.reset();
    errorInjector.addRule(ErrorScenarios.toolNotFound("op2"));

    try {
      await errorInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    const triggered = errorInjector.getTriggeredRules();
    expect(triggered).toContain("timeout-op1");
    expect(triggered).toContain("tool-not-found-op2");
  });

  test("maxErrors prevents infinite error injection", async () => {
    const strictInjector = new ErrorInjector({ maxErrors: 2, enabled: true });
    strictInjector.addRule(ErrorScenarios.timeout("test"));

    // First error
    try {
      await strictInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    // Second error
    try {
      await strictInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    // Should not throw due to maxErrors limit
    const result = await strictInjector.inject(async () => "success");
    expect(result).toBe("success");
  });
});

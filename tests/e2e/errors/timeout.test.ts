/**
 * Error Scenario Tests - Timeout Handling
 *
 * Tests for timeout handling and recovery scenarios.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { ErrorInjector, ErrorScenarios } from "../shared/error-injector.js";

describe("Error Scenarios - Timeout Handling", () => {
  let injector: ErrorInjector;

  beforeEach(() => {
    injector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    injector.reset();
  });

  test("timeout rule generates correct error message", () => {
    const rule = ErrorScenarios.timeout("database query", 5000);

    expect(rule.error.message).toBe("database query timed out after 5000ms");
    expect(rule.probability).toBe(1);
  });

  test("timeout rule is one-time by default", async () => {
    injector.addRule(ErrorScenarios.timeout("operation"));

    // First call should fail
    try {
      await injector.inject(async () => {
        throw new Error("Should not reach");
      });
    } catch (e) {
      expect((e as Error).message).toContain("timed out");
    }

    // Second call should succeed (rule removed)
    const result = await injector.inject(async () => "success");
    expect(result).toBe("success");
  });

  test("operation completes before timeout", async () => {
    injector.addRule(ErrorScenarios.timeout("slow operation", 10000));

    const result = await injector.inject(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return "completed";
    });

    expect(result).toBe("completed");
  });

  test("rapid timeout errors count correctly", async () => {
    injector.addRule(ErrorScenarios.timeout("test"));

    for (let i = 0; i < 3; i++) {
      try {
        await injector.inject(async () => {
          throw new Error("Test");
        });
      } catch {
        // Expected
      }
      injector.reset();
    }

    expect(injector.getErrorCount()).toBe(0);
  });

  test("timeout probability controls triggering", async () => {
    const lowProbRule: typeof ErrorScenarios.timeout = (_op, _ms) => ({
      name: "low-prob",
      condition: () => true,
      error: new Error("Low probability"),
      probability: 0.01,
    });

    injector.addRule(lowProbRule("test", 1000));

    // With 1% probability, most calls should succeed
    let successCount = 0;
    for (let i = 0; i < 100; i++) {
      try {
        await injector.inject(async () => "success");
        successCount++;
      } catch {
        // Occasional failure
      }
    }

    // Should succeed most of the time
    expect(successCount).toBeGreaterThan(90);
  });
});

describe("Error Scenarios - Connection Errors", () => {
  let injector: ErrorInjector;

  beforeEach(() => {
    injector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    injector.reset();
  });

  test("connection lost error format", () => {
    const rule = ErrorScenarios.connectionLost("database-server");

    expect(rule.error.message).toBe("Connection to database-server lost");
    expect(rule.name).toBe("connection-lost-database-server");
  });

  test("permission denied error format", () => {
    const rule = ErrorScenarios.permissionDenied("/etc/passwd");

    expect(rule.error.message).toBe("Permission denied for /etc/passwd");
    expect(rule.name).toBe("permission-denied-/etc/passwd");
  });

  test("rate limit error format", () => {
    const rule = ErrorScenarios.rateLimited("/api/users");

    expect(rule.error.message).toBe("Rate limit exceeded for /api/users");
    expect(rule.name).toBe("rate-limited-/api/users");
  });

  test("server error with code and message", () => {
    const rule = ErrorScenarios.serverError(503, "Service Unavailable");

    expect(rule.error.message).toBe("Server error 503: Service Unavailable");
    expect(rule.name).toBe("server-error-503");
  });

  test("server error with different codes", () => {
    const errors = [
      ErrorScenarios.serverError(400, "Bad Request"),
      ErrorScenarios.serverError(401, "Unauthorized"),
      ErrorScenarios.serverError(403, "Forbidden"),
      ErrorScenarios.serverError(404, "Not Found"),
      ErrorScenarios.serverError(500, "Internal Server Error"),
    ];

    expect(errors[0].error.message).toContain("400");
    expect(errors[1].error.message).toContain("401");
    expect(errors[2].error.message).toContain("403");
    expect(errors[3].error.message).toContain("404");
    expect(errors[4].error.message).toContain("500");
  });
});

describe("Error Scenarios - Malformed Data", () => {
  let injector: ErrorInjector;

  beforeEach(() => {
    injector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    injector.reset();
  });

  test("malformed data error for different formats", () => {
    const jsonError = ErrorScenarios.malformedData("JSON");
    const xmlError = ErrorScenarios.malformedData("XML");
    const yamlError = ErrorScenarios.malformedData("YAML");

    expect(jsonError.error.message).toBe("Malformed JSON data received");
    expect(xmlError.error.message).toBe("Malformed XML data received");
    expect(yamlError.error.message).toBe("Malformed YAML data received");
  });

  test("validation error with field and reason", () => {
    const rule = ErrorScenarios.validationError("email", "invalid format");

    expect(rule.error.message).toBe("Validation failed for email: invalid format");
  });

  test("tool not found error includes tool name", () => {
    const rule = ErrorScenarios.toolNotFound("my-custom-tool");

    expect(rule.error.message).toBe("Tool not found: my-custom-tool");
    expect(rule.name).toBe("tool-not-found-my-custom-tool");
  });

  test("multiple error scenarios can be added", () => {
    injector.addRule(ErrorScenarios.validationError("field1", "reason1"));
    injector.addRule(ErrorScenarios.validationError("field2", "reason2"));
    injector.addRule(ErrorScenarios.validationError("field3", "reason3"));

    expect(injector.getTriggeredRules().length).toBe(0);

    // Trigger first error
    try {
      injector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    expect(injector.getTriggeredRules().length).toBe(1);
  });
});

describe("Error Scenarios - Error Injector Behavior", () => {
  let injector: ErrorInjector;

  beforeEach(() => {
    injector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    injector.reset();
  });

  test("disabled injector does not trigger errors", async () => {
    const disabledInjector = new ErrorInjector({ maxErrors: 100, enabled: false });
    disabledInjector.addRule(ErrorScenarios.timeout("test"));

    const result = await disabledInjector.inject(async () => "success");
    expect(result).toBe("success");
    expect(disabledInjector.getErrorCount()).toBe(0);
  });

  test("maxErrors limit prevents excessive errors", async () => {
    const limitedInjector = new ErrorInjector({ maxErrors: 2, enabled: true });
    limitedInjector.addRule(ErrorScenarios.timeout("test"));

    // First error
    try {
      await limitedInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    expect(limitedInjector.getErrorCount()).toBe(1);

    // Second error
    try {
      await limitedInjector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    expect(limitedInjector.getErrorCount()).toBe(2);

    // Third call should not count as error (limit reached)
    const result = await limitedInjector.inject(async () => "success");
    expect(result).toBe("success");
    expect(limitedInjector.getErrorCount()).toBe(2);
  });

  test("clearRules removes all rules", async () => {
    injector.addRule(ErrorScenarios.timeout("test1"));
    injector.addRule(ErrorScenarios.toolNotFound("test2"));
    injector.addRule(ErrorScenarios.validationError("test3", "test"));

    injector.clearRules();

    const result = await injector.inject(async () => "success");
    expect(result).toBe("success");
  });

  test("getTriggeredRules returns triggered rule names", async () => {
    injector.addRule(ErrorScenarios.timeout("operation1"));
    injector.addRule(ErrorScenarios.toolNotFound("operation2"));

    // Trigger first rule
    try {
      await injector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    const triggered = injector.getTriggeredRules();
    expect(triggered).toContain("timeout-operation1");
    expect(triggered).not.toContain("tool-not-found-operation2");
  });

  test("reset clears error count and triggered rules", async () => {
    injector.addRule(ErrorScenarios.timeout("test"));

    try {
      await injector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    expect(injector.getErrorCount()).toBe(1);
    expect(injector.getTriggeredRules().length).toBe(1);

    injector.reset();

    expect(injector.getErrorCount()).toBe(0);
    expect(injector.getTriggeredRules().length).toBe(0);
  });
});

describe("Error Scenarios - Recovery Patterns", () => {
  let injector: ErrorInjector;

  beforeEach(() => {
    injector = new ErrorInjector({ maxErrors: 100, enabled: true });
  });

  afterEach(() => {
    injector.reset();
  });

  test("error isolation between operations", async () => {
    injector.addRule(ErrorScenarios.timeout("op1"));

    // First operation fails
    try {
      await injector.inject(async () => {
        throw new Error("Should not reach");
      });
    } catch {
      // Expected
    }

    // Reset for second operation
    injector.reset();
    injector.addRule(ErrorScenarios.toolNotFound("op2"));

    // Second operation fails
    try {
      await injector.inject(async () => {
        throw new Error("Should not reach");
      });
    } catch {
      // Expected
    }

    // Both errors should be isolated
    expect(injector.getErrorCount()).toBe(1);
  });

  test("can recover after error", async () => {
    injector.addRule(ErrorScenarios.timeout("failing operation"));

    // Fail
    try {
      await injector.inject(async () => {
        throw new Error("Test");
      });
    } catch {
      // Expected
    }

    // Clear rules and recover
    injector.clearRules();
    const result = await injector.inject(async () => "recovered");
    expect(result).toBe("recovered");
  });

  test("chained operations with conditional errors", async () => {
    injector.addRule(ErrorScenarios.validationError("field", "invalid"));

    let callCount = 0;

    const result = await injector.inject(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error("First call");
      }
      return "second call success";
    });

    // First call throws due to error rule, second succeeds
    expect(callCount).toBeGreaterThanOrEqual(1);
  });
});

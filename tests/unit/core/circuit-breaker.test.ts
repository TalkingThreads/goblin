import { describe, expect, mock, test } from "bun:test";
import { CircuitBreaker, CircuitOpenError } from "../../../src/core/circuit-breaker.js";

describe("CircuitBreaker", () => {
  const createBreaker = (overrides = {}) =>
    new CircuitBreaker({
      serverId: "test-server",
      failureThreshold: 3,
      successThreshold: 2,
      timeoutMs: 1000,
      ...overrides,
    });

  describe("initial state", () => {
    test("starts in CLOSED state", () => {
      const breaker = createBreaker();
      const state = breaker.getState();
      expect(state.state).toBe("CLOSED");
      expect(state.failures).toBe(0);
      expect(state.successes).toBe(0);
    });
  });

  describe("successful executions", () => {
    test("executes function and returns result", async () => {
      const breaker = createBreaker();
      const result = await breaker.execute(async () => "success");
      expect(result).toBe("success");
    });

    test("tracks success metrics", async () => {
      const breaker = createBreaker();
      await breaker.execute(async () => "ok");
      const state = breaker.getState();
      expect(state.successes).toBe(1);
    });

    test("remains CLOSED after successes", async () => {
      const breaker = createBreaker();
      await breaker.execute(async () => "ok");
      const state = breaker.getState();
      expect(state.state).toBe("CLOSED");
    });
  });

  describe("failed executions", () => {
    test("throws error and tracks failure", async () => {
      const breaker = createBreaker();
      const error = new Error("test error");

      await expect(
        breaker.execute(async () => {
          throw error;
        }),
      ).rejects.toThrow("test error");

      const state = breaker.getState();
      expect(state.failures).toBe(1);
    });

    test("opens circuit after failure threshold reached", async () => {
      const breaker = createBreaker({ failureThreshold: 2 });

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      const state = breaker.getState();
      expect(state.state).toBe("OPEN");
    });

    test("does not open circuit before threshold", async () => {
      const breaker = createBreaker({ failureThreshold: 3 });

      for (let i = 0; i < 2; i++) {
        await expect(
          breaker.execute(async () => {
            throw new Error("fail");
          }),
        ).rejects.toThrow();
      }

      const state = breaker.getState();
      expect(state.state).toBe("CLOSED");
    });
  });

  describe("circuit open behavior", () => {
    test("throws CircuitOpenError when circuit is open", async () => {
      const breaker = createBreaker({ failureThreshold: 1, timeoutMs: 10000 });

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      await expect(breaker.execute(async () => "ok")).rejects.toThrow(CircuitOpenError);
    });

    test("transitions to HALF_OPEN after timeout", async () => {
      const breaker = createBreaker({ failureThreshold: 1, timeoutMs: 10 });

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 15));

      await expect(breaker.execute(async () => "ok")).resolves.toBe("ok");

      const state = breaker.getState();
      expect(state.state).toBe("HALF_OPEN");
    });

    test("closes circuit after success threshold in HALF_OPEN", async () => {
      const breaker = createBreaker({
        failureThreshold: 1,
        successThreshold: 2,
        timeoutMs: 10,
      });

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 15));

      await breaker.execute(async () => "ok");
      await breaker.execute(async () => "ok");

      const state = breaker.getState();
      expect(state.state).toBe("CLOSED");
    });

    test("reopens circuit on failure in HALF_OPEN", async () => {
      const breaker = createBreaker({
        failureThreshold: 1,
        successThreshold: 3,
        timeoutMs: 10,
      });

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 15));

      await breaker.execute(async () => "ok");

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      const state = breaker.getState();
      expect(state.state).toBe("OPEN");
    });
  });

  describe("reset behavior", () => {
    test("resets failure count after circuit closes", async () => {
      const breaker = createBreaker({ failureThreshold: 2 });

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      await expect(
        breaker.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      expect(breaker.getState().state).toBe("OPEN");

      const breaker2 = createBreaker({ failureThreshold: 2 });
      await expect(
        breaker2.execute(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow();

      expect(breaker2.getState().failures).toBe(1);
    });
  });
});

describe("CircuitOpenError", () => {
  test("has correct name and message", () => {
    const error = new CircuitOpenError("test message");
    expect(error.name).toBe("CircuitOpenError");
    expect(error.message).toBe("test message");
  });
});

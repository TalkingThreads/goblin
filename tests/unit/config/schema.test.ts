import { describe, expect, test } from "bun:test";
import { ConfigSchema } from "../../../src/config/schema.js";

describe("ConfigSchema", () => {
  test("should validate default config", () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servers).toEqual([]);
      expect(result.data.gateway.port).toBe(3000);
      expect(result.data.auth.mode).toBe("dev");
    }
  });

  test("should validate valid server config", () => {
    const config = {
      servers: [
        {
          name: "test-server",
          transport: "stdio",
          command: "echo",
          args: ["hello"],
          enabled: true,
        },
      ],
    };

    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servers[0].name).toBe("test-server");
    }
  });

  test("should reject invalid transport", () => {
    const config = {
      servers: [
        {
          name: "test-server",
          transport: "invalid-transport",
        },
      ],
    };

    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  test("should validate environment variables", () => {
    const config = {
      servers: [
        {
          name: "env-server",
          transport: "stdio",
          env: {
            API_KEY: "secret",
          },
        },
      ],
    };

    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});

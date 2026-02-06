import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Config } from "../../../src/config/schema.js";
import { ConfigWriteError, ConfigWriter, writeConfig } from "../../../src/config/writer.js";

// Mock env-paths to point to a temp directory
const tempDir = join(tmpdir(), `goblin-test-writer-${Math.random().toString(36).slice(2)}`);
const tempConfigPath = join(tempDir, "config.json");

mock.module("../../../src/config/paths.js", () => ({
  getConfigPath: () => tempConfigPath,
  getConfigDir: () => tempDir,
  getSchemaPath: () => join(tempDir, "config.schema.json"),
  ensureConfigDir: async () => {
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
  },
}));

describe("ConfigWriter", () => {
  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("constructor", () => {
    test("should create writer with default options", () => {
      const writer = new ConfigWriter();
      expect(writer).toBeDefined();
    });

    test("should create writer with custom path", () => {
      const customPath = join(tempDir, "custom.json");
      const writer = new ConfigWriter({ configPath: customPath });
      expect(writer).toBeDefined();
    });
  });

  describe("write", () => {
    test("should write config atomically", async () => {
      const writer = new ConfigWriter({ configPath: tempConfigPath });
      const config: Config = {
        servers: [],
        gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
        streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
        auth: { mode: "dev" },
        policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
      };

      const result = await writer.write(config);
      expect(result).toBe(tempConfigPath);
      expect(existsSync(tempConfigPath)).toBe(true);

      const content = await readFile(tempConfigPath, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.gateway.port).toBe(3000);
    });

    test("should create backup on write", async () => {
      // First write to create initial config
      const writer = new ConfigWriter({ configPath: tempConfigPath });
      const initialConfig: Config = {
        servers: [],
        gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
        streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
        auth: { mode: "dev" },
        policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
      };
      await writer.write(initialConfig);

      // Second write should create backup
      const updatedConfig: Config = {
        ...initialConfig,
        gateway: { ...initialConfig.gateway, port: 8080 },
      };
      await writer.write(updatedConfig);

      const backupPath = `${tempConfigPath}.backup`;
      expect(existsSync(backupPath)).toBe(true);

      const backupContent = await readFile(backupPath, "utf-8");
      const backup = JSON.parse(backupContent);
      expect(backup.gateway.port).toBe(3000);
    });

    test("should not create backup on first write", async () => {
      const writer = new ConfigWriter({ configPath: tempConfigPath });
      const config: Config = {
        servers: [],
        gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
        streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
        auth: { mode: "dev" },
        policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
      };

      await writer.write(config);

      const backupPath = `${tempConfigPath}.backup`;
      expect(existsSync(backupPath)).toBe(false);
    });

    test("should format JSON with 2-space indentation", async () => {
      const writer = new ConfigWriter({ configPath: tempConfigPath });
      const config: Config = {
        servers: [],
        gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
        streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
        auth: { mode: "dev" },
        policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
      };

      await writer.write(config);

      const content = await readFile(tempConfigPath, "utf-8");
      const lines = content.split("\n");
      expect(lines[1]).toMatch(/^ {2}"/); // 2-space indentation
    });

    test("should add trailing newline", async () => {
      const writer = new ConfigWriter({ configPath: tempConfigPath });
      const config: Config = {
        servers: [],
        gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
        streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
        auth: { mode: "dev" },
        policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
      };

      await writer.write(config);

      const content = await readFile(tempConfigPath, "utf-8");
      expect(content.endsWith("\n")).toBe(true);
    });
  });

  describe("validation", () => {
    test("should throw on invalid config", async () => {
      const writer = new ConfigWriter({ configPath: tempConfigPath });
      const invalidConfig = {
        servers: [{ name: "", transport: "invalid" }],
        gateway: { port: -1 },
      } as unknown as Config;

      let errorThrown = false;
      try {
        await writer.write(invalidConfig);
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(ConfigWriteError);
        expect((error as ConfigWriteError).message).toContain("validation failed");
      }
      expect(errorThrown).toBe(true);
    });

    test("should validate before any file operations", async () => {
      const writer = new ConfigWriter({ configPath: tempConfigPath });
      const invalidConfig = {
        servers: [],
        gateway: { port: "not-a-number" },
      } as unknown as Config;

      try {
        await writer.write(invalidConfig);
      } catch (_error) {
        // Config should not exist since validation failed before write
        expect(existsSync(tempConfigPath)).toBe(false);
      }
    });
  });

  describe("ConfigWriteError", () => {
    test("should include error details", () => {
      const cause = new Error("Original error");
      const error = new ConfigWriteError("Write failed", cause, "/path/to/config");

      expect(error.message).toBe("Write failed");
      expect(error.cause).toBe(cause);
      expect(error.path).toBe("/path/to/config");
      expect(error.name).toBe("ConfigWriteError");
    });
  });
});

describe("writeConfig", () => {
  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should maintain backward compatibility", async () => {
    const config: Config = {
      servers: [],
      gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
      streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
      auth: { mode: "dev" },
      policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
    };

    const result = await writeConfig(config);
    expect(result).toBe(tempConfigPath);
    expect(existsSync(tempConfigPath)).toBe(true);
  });

  test("should support customPath option", async () => {
    const customPath = join(tempDir, "custom.json");
    const config: Config = {
      servers: [],
      gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
      streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
      auth: { mode: "dev" },
      policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
    };

    const result = await writeConfig(config, { customPath });
    expect(result).toBe(customPath);
    expect(existsSync(customPath)).toBe(true);
  });

  test("should support includeComments option", async () => {
    const config: Config = {
      servers: [],
      gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
      streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
      auth: { mode: "dev" },
      policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
    };

    const customPath = join(tempDir, "with-comments.json");
    await writeConfig(config, { customPath, includeComments: true });

    const content = await readFile(customPath, "utf-8");
    expect(content).toContain("//");
  });
});

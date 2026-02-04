import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../../../src/config/loader.js";
import { ConfigWatcher } from "../../../src/config/watcher.js";

// Mock env-paths to point to a temp directory
const tempDir = join(tmpdir(), `goblin-test-config-${Math.random().toString(36).slice(2)}`);
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

describe("Config Loader", () => {
  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should load default config when file missing", async () => {
    const config = await loadConfig();
    expect(config.gateway.port).toBe(3000);
    expect(config.servers).toEqual([]);
  });

  test("should load valid config file", async () => {
    const validConfig = {
      servers: [],
      gateway: { port: 8080 },
    };
    await writeFile(tempConfigPath, JSON.stringify(validConfig));

    const config = await loadConfig();
    expect(config.gateway.port).toBe(8080);
  });

  test("should return default config on invalid JSON", async () => {
    await writeFile(tempConfigPath, "{ invalid json");

    const config = await loadConfig();
    expect(config.gateway.port).toBe(3000); // Default
  });

  test("should return default config on validation failure", async () => {
    const invalidConfig = {
      gateway: { port: "not-a-number" },
    };
    await writeFile(tempConfigPath, JSON.stringify(invalidConfig));

    const config = await loadConfig();
    expect(config.gateway.port).toBe(3000); // Default
  });
});

describe("Config Watcher", () => {
  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should detect config changes", async () => {
    const initialConfig = {
      servers: [],
      gateway: { port: 3000, host: "127.0.0.1" },
      auth: { mode: "dev" as const },
      policies: { outputSizeLimit: 1024, defaultTimeout: 1000 },
    };

    await writeFile(tempConfigPath, JSON.stringify(initialConfig));

    const watcher = new ConfigWatcher(initialConfig);
    watcher.start();

    // Use a promise to wait for the update event
    const updatePromise = new Promise((resolve) => {
      watcher.on("updated", resolve);
    });

    // Write new config
    const newConfig = { ...initialConfig, gateway: { ...initialConfig.gateway, port: 4000 } };
    await writeFile(tempConfigPath, JSON.stringify(newConfig));

    // Wait for update
    const updatedConfig = (await updatePromise) as import("../../../src/config/schema.js").Config;

    expect(updatedConfig.gateway.port).toBe(4000);
    watcher.stop();
  });
});

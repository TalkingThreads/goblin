/**
 * Default configuration values for Goblin MCP Gateway
 *
 * These defaults are used when:
 * 1. No config file exists (first-run scenario)
 * 2. Config validation fails (graceful degradation)
 * 3. New fields are added in schema updates
 */

import type { Config } from "./schema.js";

export const DEFAULT_CONFIG: Config = {
  servers: [],
  virtualTools: [],
  gateway: {
    port: 3000,
    host: "127.0.0.1",
    transport: "both",
  },
  streamableHttp: {
    sseEnabled: true,
    sessionTimeout: 300000,
    maxSessions: 1000,
  },
  daemon: {
    lockPort: 12490,
  },
  auth: {
    mode: "dev",
  },
  policies: {
    outputSizeLimit: 65536,
    defaultTimeout: 30000,
  },
};

export const DEFAULT_CONFIG_CONTENT = JSON.stringify(DEFAULT_CONFIG, null, 2);

export const DEFAULT_CONFIG_COMMENT = `# Goblin MCP Gateway Configuration
# Generated on first run
# Edit this file to customize your gateway settings
# See: https://github.com/TalkingThreads/goblin/blob/main/docs/example-config.json

${DEFAULT_CONFIG_CONTENT}`;

/**
 * Configuration schema definitions using Zod
 */

import { z } from "zod";

/**
 * Transport type for backend MCP servers
 */
export const TransportTypeSchema = z.enum(["stdio", "http", "sse"]);

/**
 * Configuration for a single backend MCP server
 */
export const ServerConfigSchema = z.object({
  /**
   * Unique identifier for the server
   */
  name: z.string().min(1),

  /**
   * Human-readable description
   */
  description: z.string().optional(),

  /**
   * Transport type
   */
  transport: TransportTypeSchema,

  /**
   * Command to execute (for stdio transport)
   */
  command: z.string().optional(),

  /**
   * Arguments for the command (for stdio transport)
   */
  args: z.array(z.string()).optional(),

  /**
   * URL for HTTP/SSE transports
   */
  url: z.string().url().optional(),

  /**
   * Environment variables to pass to the process
   */
  env: z.record(z.string(), z.string()).optional(),

  /**
   * Lifecycle mode for the server
   */
  mode: z.enum(["stateless", "stateful", "smart"]).default("stateful"),

  /**
   * Whether the server is enabled
   */
  enabled: z.boolean().default(true),
});

/**
 * Gateway server configuration
 */
export const GatewayConfigSchema = z.object({
  /**
   * HTTP server port
   */
  port: z.number().int().min(1).max(65535).default(3000),

  /**
   * HTTP server host
   */
  host: z.string().default("127.0.0.1"),
});

/**
 * Authentication configuration
 */
export const AuthConfigSchema = z.object({
  /**
   * Authentication mode
   */
  mode: z.enum(["dev", "apikey"]).default("dev"),

  /**
   * API key for apikey mode
   */
  apiKey: z.string().optional(),
});

/**
 * Runtime policies configuration
 */
export const PoliciesConfigSchema = z.object({
  /**
   * Maximum output size in bytes
   */
  outputSizeLimit: z.number().int().positive().default(65536),

  /**
   * Default timeout in milliseconds
   */
  defaultTimeout: z.number().int().positive().default(30000),
});

/**
 * Virtual tool operation
 */
export const VirtualToolOpSchema = z.object({
  /**
   * Tool to invoke
   */
  tool: z.string(),

  /**
   * Arguments to pass (supports template variables)
   */
  args: z.record(z.string(), z.unknown()),
});

/**
 * Virtual tool definition
 */
export const VirtualToolSchema = z.object({
  /**
   * Unique identifier for the virtual tool
   */
  id: z.string().min(1),

  /**
   * Human-readable description
   */
  description: z.string().optional(),

  /**
   * Operations to execute sequentially
   */
  ops: z.array(VirtualToolOpSchema).min(1),

  /**
   * Timeout in milliseconds
   */
  timeoutMs: z.number().int().positive().default(60000),

  /**
   * Stop execution on first error
   */
  stopOnError: z.boolean().default(true),
});

/**
 * Root configuration schema
 */
export const ConfigSchema = z.object({
  /**
   * Backend MCP servers
   */
  servers: z.array(ServerConfigSchema).default([]),

  /**
   * Virtual tool definitions
   */
  virtualTools: z.array(VirtualToolSchema).optional(),

  /**
   * Gateway server settings
   */
  gateway: GatewayConfigSchema.default({
    port: 3000,
    host: "127.0.0.1",
  }),

  /**
   * Authentication settings
   */
  auth: AuthConfigSchema.default({
    mode: "dev",
  }),

  /**
   * Runtime policies
   */
  policies: PoliciesConfigSchema.default({
    outputSizeLimit: 65536,
    defaultTimeout: 30000,
  }),
});

/**
 * Inferred TypeScript types
 */
export type TransportType = z.infer<typeof TransportTypeSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type PoliciesConfig = z.infer<typeof PoliciesConfigSchema>;
export type VirtualToolOp = z.infer<typeof VirtualToolOpSchema>;
export type VirtualTool = z.infer<typeof VirtualToolSchema>;
export type Config = z.infer<typeof ConfigSchema>;

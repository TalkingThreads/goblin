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
 * Log destination type
 */
export const LogDestinationTypeSchema = z.enum(["stdout", "file", "both"]);

/**
 * Log format type
 */
export const LogFormatSchema = z.enum(["pretty", "json"]);

/**
 * Log level type
 */
export const LogLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);

/**
 * File destination configuration
 */
export const LogFileConfigSchema = z.object({
  /**
   * Path to log file (supports ~, environment variables)
   */
  path: z.string().default("~/.goblin/logs/app.log"),

  /**
   * Maximum file size before rotation (e.g., "10M", "1G")
   */
  maxSize: z.string().default("10M"),

  /**
   * Maximum number of log files to keep
   */
  maxFiles: z.number().int().positive().default(5),
});

/**
 * Redaction configuration
 */
export const LogRedactConfigSchema = z.object({
  /**
   * Enable sensitive data redaction
   */
  enabled: z.boolean().default(true),

  /**
   * Additional paths to redact (JSON paths)
   */
  paths: z
    .array(z.string())
    .default([
      "password",
      "token",
      "apiKey",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
    ]),

  /**
   * Whether to remove redacted fields entirely
   */
  remove: z.boolean().default(false),
});

/**
 * Log sampling configuration
 */
export const LogSamplingConfigSchema = z.object({
  /**
   * Enable log sampling
   */
  enabled: z.boolean().default(false),

  /**
   * Sampling rate (0.0 to 1.0)
   */
  rate: z.number().min(0).max(1).default(0.1),
});

/**
 * Request logging configuration
 */
export const RequestLoggingConfigSchema = z.object({
  /**
   * Enable request/response logging
   */
  enabled: z.boolean().default(true),

  /**
   * Include request body in logs
   */
  includeBody: z.boolean().default(false),

  /**
   * Include response body in logs
   */
  includeResponseBody: z.boolean().default(false),

  /**
   * Paths to exclude from logging (e.g., health, metrics)
   */
  excludePaths: z.array(z.string()).default(["/health", "/metrics"]),
});

/**
 * Logging configuration
 */
export const LoggingConfigSchema = z.object({
  /**
   * Log level (env var LOG_LEVEL overrides this)
   */
  level: LogLevelSchema.default("info"),

  /**
   * Log format
   */
  format: LogFormatSchema.default("json"),

  /**
   * Log destinations
   */
  destinations: LogDestinationTypeSchema.default("stdout"),

  /**
   * File destination configuration
   */
  file: LogFileConfigSchema.optional(),

  /**
   * Sensitive data redaction
   */
  redact: LogRedactConfigSchema.optional(),

  /**
   * Log sampling for high-volume operations
   */
  sampling: LogSamplingConfigSchema.optional(),

  /**
   * Request/response logging configuration
   */
  requestLogging: RequestLoggingConfigSchema.optional(),
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

  /**
   * Logging configuration
   */
  logging: LoggingConfigSchema.optional(),
});

/**
 * Inferred TypeScript types
 */
export type TransportType = z.infer<typeof TransportTypeSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type PoliciesConfig = z.infer<typeof PoliciesConfigSchema>;
export type LogDestinationType = z.infer<typeof LogDestinationTypeSchema>;
export type LogFormat = z.infer<typeof LogFormatSchema>;
export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LogFileConfig = z.infer<typeof LogFileConfigSchema>;
export type LogRedactConfig = z.infer<typeof LogRedactConfigSchema>;
export type LogSamplingConfig = z.infer<typeof LogSamplingConfigSchema>;
export type RequestLoggingConfig = z.infer<typeof RequestLoggingConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type VirtualToolOp = z.infer<typeof VirtualToolOpSchema>;
export type VirtualTool = z.infer<typeof VirtualToolSchema>;
export type Config = z.infer<typeof ConfigSchema>;

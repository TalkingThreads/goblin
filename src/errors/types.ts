/**
 * Custom error classes for Goblin MCP Gateway
 * Provides type-safe error handling with structured metadata
 */

/**
 * Base error class for all Goblin errors
 */
export class GoblinError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "GoblinError";
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    Error.captureStackTrace(this, GoblinError);
  }

  /**
   * Convert error to structured JSON for logging/API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Convert to MCP error format
   */
  toMcpError(): { code: number; message: string; data?: Record<string, unknown> } {
    return {
      code: this.statusCode,
      message: this.message,
      data: this.context,
    };
  }
}

/**
 * Error thrown when a tool is not found
 */
export class ToolNotFoundError extends GoblinError {
  constructor(toolName: string, serverId?: string) {
    super(`Tool not found: ${toolName}`, "TOOL_NOT_FOUND", 404, { toolName, serverId });
    this.name = "ToolNotFoundError";
  }
}

/**
 * Error thrown when a server is not found or not configured
 */
export class ServerNotFoundError extends GoblinError {
  constructor(serverId: string) {
    super(`Server not found: ${serverId}`, "SERVER_NOT_FOUND", 404, { serverId });
    this.name = "ServerNotFoundError";
  }
}

/**
 * Error thrown when a resource is not found
 */
export class ResourceNotFoundError extends GoblinError {
  constructor(uri: string, serverId?: string) {
    super(`Resource not found: ${uri}`, "RESOURCE_NOT_FOUND", 404, { uri, serverId });
    this.name = "ResourceNotFoundError";
  }
}

/**
 * Error thrown when a prompt is not found
 */
export class PromptNotFoundError extends GoblinError {
  constructor(promptName: string, serverId?: string) {
    super(`Prompt not found: ${promptName}`, "PROMPT_NOT_FOUND", 404, { promptName, serverId });
    this.name = "PromptNotFoundError";
  }
}

/**
 * Error thrown when a connection fails
 */
export class ConnectionError extends GoblinError {
  constructor(serverId: string, reason: string) {
    super(`Connection error for server ${serverId}: ${reason}`, "CONNECTION_ERROR", 503, {
      serverId,
      reason,
    });
    this.name = "ConnectionError";
  }
}

/**
 * Error thrown when a request times out
 */
export class RequestTimeoutError extends GoblinError {
  constructor(timeoutMs: number, operation: string) {
    super(`Request timed out after ${timeoutMs}ms: ${operation}`, "REQUEST_TIMEOUT", 408, {
      timeoutMs,
      operation,
    });
    this.name = "RequestTimeoutError";
  }
}

/**
 * Error thrown when a tool execution fails
 */
export class ToolExecutionError extends GoblinError {
  constructor(toolName: string, errorMessage: string, serverId?: string) {
    super(`Tool execution failed: ${toolName} - ${errorMessage}`, "TOOL_EXECUTION_ERROR", 500, {
      toolName,
      errorMessage,
      serverId,
    });
    this.name = "ToolExecutionError";
  }
}

/**
 * Error thrown when there's a configuration issue
 */
export class ConfigurationError extends GoblinError {
  constructor(message: string, configKey?: string) {
    super(`Configuration error: ${message}`, "CONFIGURATION_ERROR", 500, { message, configKey });
    this.name = "ConfigurationError";
  }
}

/**
 * Type guard to check if an error is a GoblinError
 */
export function isGoblinError(error: unknown): error is GoblinError {
  return error instanceof GoblinError;
}

/**
 * Type guard to check if an error is a not-found type error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof GoblinError) {
    return error.statusCode === 404;
  }
  if (error instanceof Error) {
    return error.message.includes("not found");
  }
  return false;
}

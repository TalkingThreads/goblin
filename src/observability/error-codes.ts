/**
 * Error codes for Goblin MCP Gateway
 *
 * Format: {CATEGORY}-{NUMBER}
 * - CONN: Connection errors
 * - TOOL: Tool invocation errors
 * - CFG: Configuration errors
 * - TRANSPORT: Transport layer errors
 * - INTERNAL: Internal server errors
 * - ROUTER: Routing errors
 * - REGISTRY: Registry errors
 * - SUBSCRIPTION: Subscription errors
 */

export const ERROR_CODES = {
  // Connection errors (CONN-0xx)
  CONNECTION_FAILED: "CONN-001",
  CONNECTION_TIMEOUT: "CONN-002",
  CONNECTION_REFUSED: "CONN-003",
  CONNECTION_LOST: "CONN-004",

  // Tool errors (TOOL-0xx)
  TOOL_NOT_FOUND: "TOOL-001",
  TOOL_INVOCATION_FAILED: "TOOL-002",
  TOOL_TIMEOUT: "TOOL-003",
  TOOL_SCHEMA_VALIDATION_FAILED: "TOOL-004",
  TOOL_NOT_ENABLED: "TOOL-005",

  // Configuration errors (CFG-0xx)
  CONFIG_INVALID: "CFG-001",
  CONFIG_NOT_FOUND: "CFG-002",
  CONFIG_RELOAD_FAILED: "CFG-003",
  CONFIG_VALIDATION_FAILED: "CFG-004",
  CONFIG_SCHEMA_INVALID: "CFG-005",

  // Transport errors (TRANSPORT-0xx)
  TRANSPORT_CREATE_FAILED: "TRANSPORT-001",
  TRANSPORT_CONNECT_FAILED: "TRANSPORT-002",
  TRANSPORT_DISCONNECT_FAILED: "TRANSPORT-003",
  TRANSPORT_SEND_FAILED: "TRANSPORT-004",
  TRANSPORT_RECEIVE_FAILED: "TRANSPORT-005",

  // Internal errors (INTERNAL-0xx)
  INTERNAL_ERROR: "INTERNAL-001",
  UNEXPECTED_ERROR: "INTERNAL-002",
  STATE_ERROR: "INTERNAL-003",
  ASSERTION_FAILED: "INTERNAL-004",

  // Router errors (ROUTER-0xx)
  ROUTE_NOT_FOUND: "ROUTER-001",
  ROUTING_FAILED: "ROUTER-002",
  ROUTE_CONFLICT: "ROUTER-003",

  // Registry errors (REGISTRY-0xx)
  REGISTRY_ADD_FAILED: "REGISTRY-001",
  REGISTRY_REMOVE_FAILED: "REGISTRY-002",
  REGISTRY_SYNC_FAILED: "REGISTRY-003",
  REGISTRY_LOOKUP_FAILED: "REGISTRY-004",

  // Subscription errors (SUBSCRIPTION-0xx)
  SUBSCRIPTION_LIMIT_EXCEEDED: "SUBSCRIPTION-001",
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION-002",
  SUBSCRIPTION_CREATE_FAILED: "SUBSCRIPTION-003",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Get human-readable description for an error code
 */
export function getErrorDescription(code: ErrorCode): string {
  const descriptions: Record<ErrorCode, string> = {
    // Connection errors
    "CONN-001": "Failed to establish connection to server",
    "CONN-002": "Connection attempt timed out",
    "CONN-003": "Connection was refused by server",
    "CONN-004": "Connection was lost during communication",

    // Tool errors
    "TOOL-001": "Requested tool was not found",
    "TOOL-002": "Tool invocation failed",
    "TOOL-003": "Tool execution timed out",
    "TOOL-004": "Tool input schema validation failed",
    "TOOL-005": "Tool is not enabled",

    // Configuration errors
    "CFG-001": "Configuration is invalid",
    "CFG-002": "Configuration file not found",
    "CFG-003": "Failed to reload configuration",
    "CFG-004": "Configuration validation failed",
    "CFG-005": "Configuration schema is invalid",

    // Transport errors
    "TRANSPORT-001": "Failed to create transport",
    "TRANSPORT-002": "Failed to connect transport",
    "TRANSPORT-003": "Failed to disconnect transport",
    "TRANSPORT-004": "Failed to send message via transport",
    "TRANSPORT-005": "Failed to receive message via transport",

    // Internal errors
    "INTERNAL-001": "An internal error occurred",
    "INTERNAL-002": "An unexpected error occurred",
    "INTERNAL-003": "Invalid state detected",
    "INTERNAL-004": "Assertion failed",

    // Router errors
    "ROUTER-001": "No route found for request",
    "ROUTER-002": "Routing failed",
    "ROUTER-003": "Conflicting routes detected",

    // Registry errors
    "REGISTRY-001": "Failed to add item to registry",
    "REGISTRY-002": "Failed to remove item from registry",
    "REGISTRY-003": "Registry synchronization failed",
    "REGISTRY-004": "Registry lookup failed",

    // Subscription errors
    "SUBSCRIPTION-001": "Subscription limit exceeded",
    "SUBSCRIPTION-002": "Subscription not found",
    "SUBSCRIPTION-003": "Failed to create subscription",
  };

  return descriptions[code] ?? "Unknown error";
}

/**
 * Log an error with structured context
 */
export interface ErrorContext {
  errorCode?: ErrorCode;
  error?: unknown;
  serverId?: string;
  toolName?: string;
  requestId?: string;
  transport?: string;
  path?: string;
  [key: string]: unknown;
}

/**
 * Create a structured error log entry
 */
export interface ErrorLogEntry {
  errorCode: string;
  error: string;
  description: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
}

/**
 * Format error for logging
 */
export function formatErrorForLog(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

/**
 * Create an error log entry
 */
export function createErrorLogEntry(
  code: ErrorCode,
  error: unknown,
  context: ErrorContext = {},
): ErrorLogEntry {
  const { message, stack } = formatErrorForLog(error);

  return {
    errorCode: code,
    error: message,
    description: getErrorDescription(code),
    stack,
    context: {
      ...context,
      errorCode: code,
    },
    timestamp: new Date().toISOString(),
  };
}

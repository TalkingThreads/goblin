/**
 * Request correlation utilities for distributed tracing
 */

import type { Logger } from "./logger.js";

/**
 * Request context storage
 */
class RequestContext {
  private requestId: string | null = null;
  private parentId: string | null = null;
  private metadata = new Map<string, unknown>();

  /**
   * Get current request ID
   */
  getRequestId(): string | null {
    return this.requestId;
  }

  /**
   * Set request ID
   */
  setRequestId(id: string): void {
    this.requestId = id;
  }

  /**
   * Get parent request ID (for nested calls)
   */
  getParentId(): string | null {
    return this.parentId;
  }

  /**
   * Set parent request ID
   */
  setParentId(id: string): void {
    this.parentId = id;
  }

  /**
   * Get metadata value
   */
  get(key: string): unknown {
    return this.metadata.get(key);
  }

  /**
   * Set metadata value
   */
  set(key: string, value: unknown): void {
    this.metadata.set(key, value);
  }

  /**
   * Clear context
   */
  clear(): void {
    this.requestId = null;
    this.parentId = null;
    this.metadata.clear();
  }
}

// Global request context
const globalContext = new RequestContext();

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Get current request ID from context
 */
export function getRequestId(): string | null {
  return globalContext.getRequestId();
}

/**
 * Set current request ID
 */
export function setRequestId(id: string): void {
  globalContext.setRequestId(id);
}

/**
 * Get parent request ID
 */
export function getParentId(): string | null {
  return globalContext.getParentId();
}

/**
 * Set parent request ID
 */
export function setParentId(id: string): void {
  globalContext.setParentId(id);
}

/**
 * Get request metadata
 */
export function getRequestMetadata(key: string): unknown {
  return globalContext.get(key);
}

/**
 * Set request metadata
 */
export function setRequestMetadata(key: string, value: unknown): void {
  globalContext.set(key, value);
}

/**
 * Create context object for logging
 */
export interface RequestContextLog {
  requestId: string | null;
  parentId: string | null;
  [key: string]: unknown;
}

/**
 * Get context object for logging
 */
export function getContextForLog(): RequestContextLog {
  return {
    requestId: globalContext.getRequestId(),
    parentId: globalContext.getParentId(),
  };
}

/**
 * Create a child logger with request context
 */
export function createRequestLogger(logger: Logger): Logger {
  const context = getContextForLog();

  if (!context.requestId) {
    return logger;
  }

  return logger.child({
    requestId: context.requestId,
    parentId: context.parentId,
  });
}

/**
 * Run a function with a temporary request context
 */
export async function withRequestContext<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  const previousRequestId = getRequestId();
  setRequestId(requestId);

  try {
    return await fn();
  } finally {
    if (previousRequestId) {
      setRequestId(previousRequestId);
    } else {
      globalContext.clear();
    }
  }
}

/**
 * Wrap a function to automatically include request context
 */
export function withContext<T extends (...args: unknown[]) => unknown>(
  fn: T,
  requestId: string,
): T {
  return ((...args: Parameters<T>) => {
    const previousRequestId = getRequestId();
    setRequestId(requestId);

    try {
      return fn(...args);
    } finally {
      if (previousRequestId) {
        setRequestId(previousRequestId);
      } else {
        globalContext.clear();
      }
    }
  }) as T;
}

/**
 * Get or create request ID from context or headers
 */
export function getOrCreateRequestId(headers?: Record<string, string>): string {
  // Check for existing request ID in headers
  if (headers) {
    const requestId = headers["x-request-id"] || headers["request-id"];
    if (requestId) {
      return requestId;
    }
  }

  // Check context
  const existingId = getRequestId();
  if (existingId) {
    return existingId;
  }

  // Generate new ID
  const newId = generateCorrelationId();
  setRequestId(newId);
  return newId;
}

/**
 * Extract request ID from headers
 */
export function extractRequestId(headers: Record<string, string>): string | null {
  return (
    headers["x-request-id"] ||
    headers["x-correlation-id"] ||
    headers["request-id"] ||
    headers["correlation-id"] ||
    null
  );
}

/**
 * Add request ID to headers for propagation
 */
export function propagateRequestId(headers: Record<string, string>): Record<string, string> {
  const requestId = getRequestId();
  if (!requestId) {
    return headers;
  }

  return {
    ...headers,
    "x-request-id": requestId,
  };
}

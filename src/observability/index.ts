/**
 * Observability module exports
 *
 * Centralized exports for logging, metrics, correlation, and utilities.
 */

// Correlation
export {
  createRequestLogger,
  getContextForLog,
  getOrCreateRequestId,
  getRequestId,
  setRequestId,
} from "./correlation.js";
export type { ErrorCode, ErrorContext, ErrorLogEntry } from "./error-codes.js";
// Error codes
export { createErrorLogEntry, ERROR_CODES } from "./error-codes.js";
// File destinations
export {
  createLogFileStream,
  getDefaultLogDir,
  parseLogSize,
  resolveLogPath,
} from "./file-destinations.js";
// HTTP logging
export { createRequestLoggingMiddleware, requestIdMiddleware } from "./http-logging.js";
// Logger
export type { Logger } from "./logger.js";
export {
  clearLogs,
  createLogger,
  flushAndCloseLogs,
  getCurrentLogPath,
  getLogsDir,
  getTuiLogs,
  initSessionLogging,
  isDebugEnabled,
  redirectLogsToStderr,
  userOutput,
} from "./logger.js";
export type { Counter, Gauge, Histogram, Labels, MetricsRegistry } from "./metrics.js";
// Metrics
export {
  getMetricsJSON,
  getMetricsSummary,
  httpRequestDuration,
  httpRequestsTotal,
  MetricsRegistryImpl,
  mcpActiveConnections,
  mcpToolCallsTotal,
  mcpToolDuration,
  metricsRegistry,
} from "./metrics.js";
export type { ConfigContext, ConnectionContext, HttpContext, OperationContext } from "./utils.js";
// Utilities - logging helpers
// Cross-platform signal handling utilities
export {
  getComponentName,
  gracefulShutdown,
  LOG_LEVEL_GUIDELINES,
  logConfigChange,
  logConnection,
  logError,
  logHttpRequest,
  logHttpResponse,
  logPerformance,
  logRetry,
  logSecurityEvent,
  logStateChange,
  logSuccess,
  logTimeout,
  setupShutdownHandlers,
} from "./utils.js";

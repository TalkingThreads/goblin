## Context

While pino is integrated, there's no consistency in how it's used across the codebase:
- Some logs have structured context, others don't
- Error logging varies between components
- No standard for message patterns
- No correlation across request boundaries
- Component naming is inconsistent

This leads to:
- Inconsistent log quality
- Difficult debugging across components
- Missing context in error scenarios
- No request tracing capability

## Goals / Non-Goals

**Goals:**
- Define standardized log message conventions
- Establish structured context patterns for different scenarios
- Create error handling and logging patterns with codes
- Implement request correlation ID propagation
- Define log level discipline guidelines
- Add utility functions for common logging patterns
- Document examples for all patterns

**Non-Goals:**
- Modify pino configuration (deferred to enhance-pino-configuration)
- Implement distributed tracing (defer to v2)
- Add log analysis or querying (defer to external tools)
- Change existing log API (maintain backwards compatibility)

## Decisions

### Decision 1: Log Message Convention - Action-Oriented Past Tense

**Choice:** All log messages use action-oriented past tense patterns.

**Rationale:**
- Past tense indicates completed action (e.g., "Server started" not "Starting server")
- Action-oriented helps understanding (e.g., "Connection failed" vs "Error occurred")
- Consistent pattern improves scan-ability

**Examples:**
```typescript
// ✅ Correct
logger.info({ serverId }, "Server connected");
logger.error({ error, serverId }, "Connection failed");
logger.debug({ duration }, "Request completed");

// ❌ Avoid
logger.info("Starting server");
logger.error("Error occurred");
logger.debug("Processing request");
```

### Decision 2: Structured Context Standards

**Choice:** Define standard context fields for different scenarios.

**Rationale:**
- Consistent fields across components
- Easy to filter and search logs
- Predictable structure for log aggregation

**Context Patterns:**
```typescript
// Success operations
logger.info({ serverId, toolName }, "Tool invoked");

// Error operations
logger.error({ error, serverId, toolName, requestId }, "Tool invocation failed");

// HTTP operations
logger.info({ requestId, method, path, status, duration }, "Request completed");

// Retry operations
logger.warn({ attempt, maxRetries, error }, "Retry attempt failed");

// Configuration operations
logger.info({ configPath }, "Configuration reloaded");
```

### Decision 3: Component Naming Convention

**Choice:** Use kebab-case component names that reflect directory structure.

**Rationale:**
- Consistent with file naming conventions
- Clear attribution in logs
- Easy to filter by component

**Examples:**
```typescript
const logger = createLogger("gateway-server");  // src/gateway/server.ts
const logger = createLogger("http-gateway");    // src/gateway/http.ts
const logger = createLogger("cli-commands");    // src/cli/commands/*.ts
const logger = createLogger("config-loader");   // src/config/loader.ts
```

### Decision 4: Error Logging Pattern with Error Codes

**Choice:** Implement structured error logging with error codes.

**Rationale:**
- Easy error identification
- Searchable error patterns
- Actionable error messages

**Implementation:**
```typescript
// Define error codes
const ERROR_CODES = {
  CONNECTION_FAILED: "E001",
  TOOL_INVOCATION_FAILED: "E002",
  CONFIG_VALIDATION_FAILED: "E003",
  TIMEOUT: "E004",
} as const;

function logError(code: string, error: unknown, context: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error({
    errorCode: code,
    error: errorMessage,
    stack: errorStack,
    ...context,
  }, `Error ${code}: ${errorMessage}`);
}
```

### Decision 5: Request Correlation ID

**Choice:** Propagate correlation ID through all components via context.

**Rationale:**
- Trace requests across component boundaries
- Easy to filter all logs for a single request
- Critical for debugging distributed operations

**Implementation:**
```typescript
// In HTTP middleware
const requestId = crypto.randomUUID();
c.set("requestId", requestId);

// Create child logger with request context
const requestLogger = logger.child({
  requestId,
  component: "http-gateway",
});

// Pass requestLogger to other components
await next();

// All logs from this request include requestId
requestLogger.info({ path: c.req.path }, "Request received");
```

### Decision 6: Log Level Guidelines

**Choice:** Define clear guidelines for when to use each log level.

**Rationale:**
- Consistent level usage
- Easy to filter by importance
- Better signal-to-noise ratio

**Guidelines:**
- **trace**: Detailed debugging, entering/exiting functions, all variable values
- **debug**: Technical debugging, request/response details, internal state
- **info**: Normal operations, successful actions, state changes
- **warn**: Recoverable issues, degraded performance, invalid inputs handled
- **error**: Failures, exceptions, timeouts, broken invariants
- **fatal**: Process-threatening errors, shutdown scenarios

## Risks / Trade-offs

### [Risk] Developer Adoption
**→ Mitigation:** Add examples to AGENTS.md, create cheatsheet, add linter rules

### [Risk] Breaking Existing Code
**→ Mitigation:** All patterns are additive, existing logs work as-is

### [Risk] Inconsistent Application
**→ Mitigation:** Code review guidelines, automated tests for log patterns

### [Risk] Context Overload
**→ Mitigation:** Define minimum required context, optional additional fields

## Open Questions

1. **Error code namespace?** Should error codes be categorized by component (E-GW-001, E-CF-001)?
2. **Log sampling?** Should we add sampling decorators for high-volume operations?
3. **Log level configuration per component?** Allow different levels for different components?

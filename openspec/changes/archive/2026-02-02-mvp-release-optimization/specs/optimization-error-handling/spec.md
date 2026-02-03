# Optimization: Error Handling Improvements

**Spec ID:** optimization-error-handling
**Change:** mvp-release-optimization
**Status:** Draft
**Version:** 1.0.0

---

## Summary

Replace fragile string-based error matching with type-safe custom error classes and consolidate logging patterns for better maintainability and performance.

## Context

Current error handling relies on string matching to identify error types, which is fragile and breaks when error messages change. Error logging patterns are inconsistent across different error paths, making debugging difficult and adding unnecessary overhead.

## Design

### Current Behavior

```typescript
// Current: Fragile string matching
try {
  await operation();
} catch (error: unknown) {
  if (error.message?.includes("Tool not found")) {
    handleToolNotFound(error);
  } else if (error.message?.includes("Connection failed")) {
    handleConnectionError(error);
  }
  // String matching is fragile and error-prone
}
```

### Proposed Behavior

```typescript
// Optimized: Type-safe error classes
try {
  await operation();
} catch (error: unknown) {
  if (error instanceof ToolNotFoundError) {
    handleToolNotFound(error);
  } else if (error instanceof ConnectionError) {
    handleConnectionError(error);
  }
  // Type-safe and maintainable
}
```

### Implementation Details

- Base `GoblinError` class with code, statusCode, and context properties
- Specific error subclasses for common error types
- Consistent structured logging across all error paths
- Error codes remain stable even if messages change
- Backward compatible error messages preserved

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Custom error classes must extend Error class | MUST |
| FR2 | Error classes must have unique error codes | MUST |
| FR3 | Error codes must be stable across message changes | MUST |
| FR4 | Error messages must remain backward compatible | MUST |
| FR5 | All error handling must use type-safe patterns | SHOULD |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR1 | No performance regression in error handling path | MUST |
| NFR2 | Error logging must be structured consistently | MUST |
| NFR3 | Error context must be available for debugging | MUST |
| NFR4 | All existing error scenarios must be handled | MUST |

## When/Then Scenarios

### Scenario 1: Tool Not Found Error

```gherkin
WHEN a tool is requested that does not exist
THEN a ToolNotFoundError must be thrown
AND the error must have code "TOOL_NOT_FOUND"
AND the error must have status code 404
AND the error message must contain the tool name
```

### Scenario 2: Server Not Found Error

```gherkin
WHEN a request is made for an unknown server
THEN a ServerNotFoundError must be thrown
AND the error must have code "SERVER_NOT_FOUND"
AND the error must have status code 404
AND the error message must contain the server ID
```

### Scenario 3: Connection Error

```gherkin
WHEN a connection to a server fails
THEN a ConnectionError must be thrown
AND the error must have code "CONNECTION_ERROR"
AND the error must have status code 503
AND the error must contain the server ID and reason
```

### Scenario 4: Error Logging

```gherkin
WHEN any error occurs during request processing
THEN the error must be logged with structured context
AND the log must include request ID, method, path
AND the log must include error code and status code
AND the log must include relevant error context
```

### Scenario 5: Unknown Error Type

```gherkin
WHEN an unexpected error type occurs
THEN the error must be logged with available information
AND the error must be wrapped or re-thrown appropriately
AND no sensitive information must be leaked in logs
```

## API Surface

### Error Classes

```typescript
/**
 * Base error class for all Goblin-specific errors.
 */
class GoblinError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GoblinError";
  }
}

/**
 * Error thrown when a requested tool is not found.
 */
class ToolNotFoundError extends GoblinError {
  constructor(toolName: string, serverId?: string) {
    super(
      `Tool not found: ${toolName}`,
      "TOOL_NOT_FOUND",
      404,
      { toolName, serverId }
    );
  }
}

/**
 * Error thrown when a server is not registered.
 */
class ServerNotFoundError extends GoblinError {
  constructor(serverId: string) {
    super(
      `Server not found: ${serverId}`,
      "SERVER_NOT_FOUND",
      404,
      { serverId }
    );
  }
}

/**
 * Error thrown when connection to a server fails.
 */
class ConnectionError extends GoblinError {
  constructor(serverId: string, reason: string) {
    super(
      `Connection failed to server: ${serverId}`,
      "CONNECTION_ERROR",
      503,
      { serverId, reason }
    );
  }
}
```

### Logging Pattern

```typescript
// Consistent structured logging
logger.error({
  requestId,
  method: request.method,
  path: request.path,
  errorCode: error.code,
  statusCode: error.statusCode,
  durationMs: Date.now() - start,
  context: error.context
}, error.message);
```

### Files to Modify

- `src/errors/types.ts` - Create custom error class definitions
- `src/gateway/server.ts` - Refactor error handling
- `src/gateway/router.ts` - Refactor error handling
- `src/middleware/error-handler.ts` - Implement consolidated error logging
- Any other locations with error handling logic

## Testing Strategy

### Unit Tests

- `ToolNotFoundError has correct code and status`
- `ServerNotFoundError has correct code and status`
- `ConnectionError has correct code and status`
- `Error context is preserved correctly`
- `Instanceof checks work correctly`

### Integration Tests

- All existing error scenarios produce same output
- Error responses are byte-for-byte identical to current behavior
- Logging output is structured consistently
- Error codes are stable across refactoring

### Validation Tests

- No string matching patterns remain in codebase
- All error paths use type-safe checks
- Error output comparison (before/after)

## Metrics and Validation

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| String matching patterns remaining | 0 | Code search |
| Error type coverage | 100% of error scenarios | Code review |
| Structured logging consistency | 100% of error logs | Log review |
| API response consistency | 100% identical to current | Response comparison |

## Rollback Plan

1. Remove custom error classes
2. Restore previous string matching patterns
3. Run test suite to verify restoration
4. Verify error outputs match previous behavior

## Dependencies

- None (this optimization is self-contained)

## Open Questions

### Question 1: Should we keep legacy error strings for compatibility?

**From Design Document:** Yes, maintain legacy error strings in API responses for backward compatibility.

**Implementation Note:** Error class constructors include the legacy message string to ensure API responses remain byte-for-byte identical.

---

**Spec Created:** 2026-01-31
**Last Updated:** 2026-01-31

## error-logging-patterns Specification

### Purpose
Define standardized patterns for logging errors with context, codes, and structured information.

### Requirements

#### Scenario: Error with code and context
- **WHEN** logging an error
- **THEN** include an error code
- **AND** include relevant context (identifiers, state)
- **AND** include the error message and stack trace

#### Scenario: Error code format
- **WHEN** defining error codes
- **THEN** use format: [Category]-[Number]
- **AND** categories reflect the component or error type

#### Scenario: Error code categories
- **WHEN** categorizing errors
- **THEN** use:
  - `CONN`: Connection errors
  - `TOOL`: Tool invocation errors
  - `CFG`: Configuration errors
  - `AUTH`: Authentication/authorization errors
  - `TRANSPORT`: Transport layer errors
  - `INTERNAL`: Internal system errors

#### Scenario: Error context fields
- **WHEN** logging an error
- **THEN** include:
  - `errorCode`: The error identifier
  - `error`: Error message
  - `stack`: Stack trace (if available)
  - `component`: Component where error occurred
  - `relevantIds`: Server ID, tool name, request ID, etc.

#### Scenario: Handled errors (recoverable)
- **WHEN** logging a handled error (caught exception)
- **THEN** use warn level
- **AND** include recovery information if applicable

#### Scenario: Unhandled errors
- **WHEN** logging an unhandled error
- **THEN** use error level
- **AND** include full stack trace
- **AND** include component and request context

#### Scenario: Error with retry
- **WHEN** logging a failed retry attempt
- **THEN** include attempt number and max retries
- **AND** include the underlying error
- **AND** use warn level for non-final attempts

### Error Code Registry

```typescript
const ERROR_CODES = {
  // Connection errors (CONN-*)
  CONN_FAILED: "CONN-001",
  CONN_TIMEOUT: "CONN-002",
  CONN_REFUSED: "CONN-003",
  CONN_LOST: "CONN-004",

  // Tool errors (TOOL-*)
  TOOL_NOT_FOUND: "TOOL-001",
  TOOL_INVOCATION_FAILED: "TOOL-002",
  TOOL_TIMEOUT: "TOOL-003",
  TOOL_INVALID_ARGS: "TOOL-004",

  // Configuration errors (CFG-*)
  CFG_INVALID: "CFG-001",
  CFG_MISSING: "CFG-002",
  CFG_RELOAD_FAILED: "CFG-003",

  // Transport errors (TRANSPORT-*)
  TRANSPORT_ERROR: "TRANSPORT-001",
  TRANSPORT_DISCONNECTED: "TRANSPORT-002",
} as const;
```

### Error Logging Utility

```typescript
interface LogErrorOptions {
  code: string;
  error: unknown;
  component: string;
  context: Record<string, unknown>;
  level?: "error" | "warn";
}

function logError(options: LogErrorOptions) {
  const { code, error, component, context, level = "error" } = options;
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger[level]({
    errorCode: code,
    error: message,
    stack,
    component,
    ...context,
  }, `Error ${code}: ${message}`);
}
```

### Examples

```typescript
// Connection failed
logError({
  code: "CONN-001",
  error: connectionError,
  component: "gateway-server",
  context: { serverId, endpoint },
});

// Tool invocation failed
logError({
  code: "TOOL-002",
  error: toolError,
  component: "tool-registry",
  context: { toolName, requestId },
});

// Configuration error
logError({
  code: "CFG-001",
  error: validationError,
  component: "config-loader",
  context: { configPath, field },
});
```

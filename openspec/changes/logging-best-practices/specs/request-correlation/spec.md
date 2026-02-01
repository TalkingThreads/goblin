## request-correlation Specification

### Purpose
Define patterns for propagating request context across components with correlation IDs for debugging and tracing.

### Requirements

#### Scenario: Generate request ID
- **WHEN** an HTTP request is received
- **THEN** generate a unique request ID
- **AND** use UUID v4 format
- **AND** prioritize `X-Request-ID` header if present

#### Scenario: Propagate request context
- **WHEN** a request ID is generated
- **THEN** attach it to the request context
- **AND** propagate to all child loggers
- **AND** include in all downstream logs

#### Scenario: Child logger with request context
- **WHEN** creating a child logger for a component handling a request
- **THEN** inherit request context from parent
- **AND** include request ID in all logs
- **AND** include component name

#### Scenario: Request lifecycle logging
- **WHEN** logging at different stages of request lifecycle
- **THEN** include request ID in all log entries
- **AND** include consistent fields:
  - `requestId`: The correlation ID
  - `component`: The component logging
  - `timestamp`: Log timestamp

#### Scenario: HTTP header propagation
- **WHEN** forwarding requests to backend servers
- **THEN** include `X-Request-ID` header
- **AND** use the same request ID from parent

#### Scenario: TUI request tracking
- **WHEN** viewing logs in TUI
- **THEN** filter by request ID
- **AND** show logs in chronological order
- **AND** highlight errors in the request chain

### Request Context Structure

```typescript
interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  timestamp: Date;
  component: string;
  parentRequestId?: string;
}

interface ChildLoggerOptions {
  component: string;
  requestContext: RequestContext;
}
```

### Correlation ID Flow

```
Client Request
     │
     ▼
┌─────────────────┐
│ HTTP Gateway    │──► Generate Request ID
└────────┬────────┘
         │
         ├──► Log: "Request received" (requestId: abc123)
         │
         ▼
┌─────────────────┐
│ Tool Registry   │──► Child logger with requestId
└────────┬────────┘
         │
         ├──► Log: "Tool invoked" (requestId: abc123)
         │
         ▼
┌─────────────────┐
│ Backend Server  │──► Forward with X-Request-ID header
└────────┬────────┘
         │
         ├──► Log: "Tool executed" (requestId: abc123)
         │
         ▼
┌─────────────────┐
│ HTTP Gateway    │──► Log: "Request completed" (requestId: abc123)
└─────────────────┘
```

### Implementation Examples

```typescript
// HTTP Middleware
function requestContextMiddleware() {
  return async (c, next) => {
    const requestId = c.req.header("X-Request-ID") || crypto.randomUUID();
    c.set("requestId", requestId);

    const requestLogger = logger.child({
      requestId,
      component: "http-gateway",
    });
    c.set("logger", requestLogger);

    await next();
  };
}

// Component usage
async function handleRequest(c) {
  const requestLogger = c.get("logger");
  const requestId = c.get("requestId");

  requestLogger.info({ path: c.req.path }, "Request received");

  // Call downstream with request ID
  const result = await callBackend({
    headers: { "X-Request-ID": requestId },
  });

  requestLogger.info({ status: result.status }, "Request completed");
}
```

### TUI Integration

```typescript
// Filter logs by request ID in TUI
function filterLogsByRequestId(requestId: string) {
  return logBuffer.filter(log =>
    log.requestId === requestId ||
    log.data?.requestId === requestId
  );
}

// Show request chain in TUI
function showRequestChain(requestId: string) {
  const logs = filterLogsByRequestId(requestId);
  const chain = logs.map(log => ({
    timestamp: log.timestamp,
    component: log.component,
    level: log.level,
    message: log.message,
  }));

  return chain;
}
```

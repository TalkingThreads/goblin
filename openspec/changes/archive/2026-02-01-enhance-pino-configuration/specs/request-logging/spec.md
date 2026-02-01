## request-logging Specification

### Purpose
Define how HTTP requests and responses are logged for debugging and observability.

### Requirements

#### Scenario: Request incoming logging
- **WHEN** an HTTP request is received
- **THEN** log the request with method, path, and requestId
- **AND** include timestamp and correlation data

#### Scenario: Response completion logging
- **WHEN** an HTTP response is sent
- **THEN** log the response with status, duration, and requestId
- **AND** include success/error indication

#### Scenario: Request correlation ID
- **WHEN** a request comes with `X-Request-ID` header
- **THEN** use that ID for correlation
- **AND** propagate the ID to all downstream logs
- **AND** generate a new ID if none provided

#### Scenario: Request body logging
- **WHEN** request body logging is enabled
- **THEN** log the request body (if present)
- **AND** apply redaction rules to the body
- **AND** truncate very large bodies

#### Scenario: Response body logging
- **WHEN** response body logging is enabled
- **THEN** log the response body (if present)
- **AND** apply redaction rules to the body
- **AND** truncate very large bodies

#### Scenario: Exclude paths from logging
- **WHEN** paths are configured for exclusion
- **THEN** do not log requests to those paths
- **AND** examples: `/health`, `/metrics`, `/favicon.ico`

#### Scenario: Sensitive field redaction in bodies
- **WHEN** logging request/response bodies
- **THEN** apply the configured redaction rules
- **AND** redact sensitive fields before logging

#### Scenario: Request duration tracking
- **WHEN** a request completes
- **THEN** log the total duration in seconds
- **AND** include duration in structured log context

#### Scenario: Log level by status code
- **WHEN** response status code is 5xx
- **THEN** log at error level
- **AND** include error details in the log
- **WHEN** response status code is 4xx
- **THEN** log at warn level
- **WHEN** response status code is 2xx/3xx
- **THEN** log at info level (or debug for verbose)

### Configuration Schema

```typescript
const RequestLoggingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  excludePaths: z.array(z.string()).default(["/health", "/metrics"]),
  logRequestBody: z.boolean().default(false),
  logResponseBody: z.boolean().default(false),
  maxBodySize: z.string().default("1KB"),
  levelByStatus: z.object({
    2xx: z.enum(["debug", "info"]).default("debug"),
    3xx: z.enum(["debug", "info"]).default("debug"),
    4xx: z.enum(["warn", "info"]).default("warn"),
    5xx: z.enum(["error", "warn"]).default("error"),
  }).default({}),
});
```

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "requestId": "req-abc123",
  "method": "POST",
  "path": "/api/tools/call",
  "status": 200,
  "duration": 0.045,
  "component": "http-gateway",
  "msg": "POST /api/tools/call 200 45ms"
}
```

### Implementation Notes
- Use Hono middleware for integration
- Implement request ID generation and propagation
- Use pino's child logger with request context
- Apply redaction to bodies before logging
- Implement path exclusion matching
- Support body truncation for large payloads

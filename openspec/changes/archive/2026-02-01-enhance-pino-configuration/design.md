## Context

The current pino implementation at `src/observability/logger.ts` is minimal:
- Basic pino configuration with name and log level
- Child logger factory function
- No configurable destinations (stdout only)
- No formatting options (always JSON)
- No redaction capabilities
- No request/response logging
- No TUI integration

This limits developer experience during local development and operational visibility in production. The logging system needs enhancement to support:
- **Development workflow**: Pretty-printed, colorized logs for debugging
- **Production operations**: JSON logs for log aggregation systems
- **Security**: Automatic redaction of sensitive data
- **Debugging**: Request correlation and tracing
- **Operations**: Log rotation and file-based logging

## Goals / Non-Goals

**Goals:**
- Add configurable log destinations (stdout, file, both)
- Implement pretty-print mode for development (human-readable, colorized)
- Support JSON format for production (log aggregation compatibility)
- Add sensitive data redaction (passwords, tokens, API keys)
- Add log level configuration via config file (with env var override)
- Implement request/response logging middleware for HTTP gateway
- Integrate structured logging with TUI log viewer
- Add log rotation for file-based logging
- Support log sampling for high-volume operations

**Non-Goals:**
- Log analysis or querying (defer to external tools)
- Log-based alerting (defer to v2)
- Complex log aggregation pipelines (use external systems)
- Distributed tracing beyond correlation IDs (defer to v2)

## Decisions

### Decision 1: Dual Format Support (Pretty + JSON)

**Choice:** Implement dual format support with "pretty" for development and "json" for production.

**Rationale:**
- Pretty format: Human-readable, colorized, easy debugging
- JSON format: Structured, machine-parseable, log aggregation compatible
- Matches industry best practices (e.g., npm, Docker, Kubernetes)

**Implementation:**
```typescript
type LogFormat = "pretty" | "json";

interface LoggingConfig {
  format: LogFormat;
  level: string;
  destinations: LogDestination[];
  // ...
}

const isPretty = config.format === "pretty" && process.env.NODE_ENV !== "production";
const logger = pino({
  ...(isPretty ? { transport: { target: "pino-pretty" } } : {}),
  level: config.level,
});
```

### Decision 2: Config-Driven Log Level

**Choice:** Log level configured via JSON config file with environment variable override.

**Rationale:**
- Config-driven: Supports different levels per environment
- Environment override: Quick changes without config file editing
- Hot reload: Level changes apply without restart (if using config watcher)

**Implementation:**
```typescript
// Config schema
const LoggingConfigSchema = z.object({
  level: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  // ...
});

// Override priority: LOG_LEVEL env var > config file > default
const logLevel = process.env["LOG_LEVEL"] ?? config.logging.level;
```

### Decision 3: Sensitive Data Redaction

**Choice:** Path-based redaction with configurable patterns.

**Rationale:**
- Path-based: Redact specific JSON paths (e.g., `password`, `token`, `headers.authorization`)
- Configurable: Users can add custom paths
- Default safe defaults: Common sensitive fields redacted by default

**Implementation:**
```typescript
const defaultRedactPaths = [
  "password",
  "token",
  "apiKey",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
];

const logger = pino({
  redact: {
    paths: defaultRedactPaths.concat(config.redact?.paths ?? []),
    remove: config.redact?.remove ?? false,
  },
});
```

### Decision 4: Log Destinations

**Choice:** Multiple destinations with stream abstraction.

**Rationale:**
- Multiple destinations: Support stdout, file, or both
- Stream abstraction: Easy to add custom destinations (e.g., network, buffer)
- File rotation: Built-in or via pino-rolling

**Implementation:**
```typescript
type LogDestination = {
  type: "stdout" | "file" | "custom";
  path?: string; // for file
  stream?: NodeJS.WritableStream; // for custom
};

const destinations = config.logging.destinations.map(dest => {
  if (dest.type === "stdout") return process.stdout;
  if (dest.type === "file") return createWriteStream(dest.path);
  return dest.stream;
});

const logger = pino({ destination: destinations.length === 1 ? destinations[0] : destinations });
```

### Decision 5: Request/Response Logging Middleware

**Choice:** Hono middleware for structured request/response logging.

**Rationale:**
- Hono middleware: Natural integration point for HTTP gateway
- Structured: Includes method, path, status, duration, requestId
- Configurable: Can enable/disable, sample rate

**Implementation:**
```typescript
function requestLoggingMiddleware(logger: Logger) {
  return async (c, next) => {
    const requestId = c.get("requestId") || generateId();
    const start = performance.now();

    await next();

    const duration = performance.now() - start;
    logger.info({
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration: duration / 1000,
    }, `${c.req.method} ${c.req.path} ${c.res.status} ${(duration).toFixed(2)}ms`);
  };
}
```

### Decision 6: TUI Log Viewer Integration

**Choice:** Capture pino logs to in-memory buffer for TUI display.

**Rationale:**
- TUI needs access to logs for display
- In-memory buffer: Circular buffer to prevent memory leaks
- Log levels: Filter by level in TUI

**Implementation:**
```typescript
// Logger factory with TUI integration
export function createLogger(component: string, options?: LoggerOptions): Logger {
  const baseLogger = pino({
    level: config.logging.level,
    // ... transport and destinations
  });

  // Add TUI log capture
  const childLogger = baseLogger.child({ component });

  // Wrap to capture logs
  return new Proxy(childLogger, {
    get(target, prop) {
      if (prop === "info" || prop === "error" || prop === "warn" || prop === "debug") {
        return (obj: any, msg: string) => {
          // Capture to TUI buffer
          tuiLogBuffer.push({ level: prop, component, data: obj, message: msg, timestamp: new Date() });
          // Call original
          return target[prop](obj, msg);
        };
      }
      return target[prop];
    },
  });
}
```

## Risks / Trade-offs

### [Risk] Log Volume in Production
**→ Mitigation:** Implement log sampling for high-volume routes. Allow configurable sampling rate in config.

### [Risk] Pretty Print Dependency
**→ Mitigation:** Use `pino-pretty` only in development mode. Production uses native JSON output (no extra dependency).

### [Risk] Memory Usage with TUI Buffer
**→ Mitigation:** Implement circular buffer with max size (e.g., last 1000 logs). Auto-cleanup old logs.

### [Risk] Breaking Existing Log Calls
**→ Mitigation:** All changes are additive. Existing `logger.info()`, `logger.error()` calls continue to work unchanged.

### [Risk] File Descriptor Leaks
**→ Mitigation:** Proper cleanup on shutdown. Use file rotation to prevent unbounded file growth.

## Open Questions

1. **Log Rotation Library?** Should we use `pino-rolling`, `pino-roll`, or implement custom rotation?
2. **Pretty Print Transport?** Use `pino-pretty` or `pino-colada` for development?
3. **TUI Buffer Size?** What's a reasonable max log buffer size (100, 500, 1000 entries)?

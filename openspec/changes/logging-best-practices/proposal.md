## Why

While pino is now integrated, there's no consistency guidance on how to structure log messages, use contextual data, handle errors, or maintain observability standards. Without best practices, logs become noisy, inconsistent, and hard to parse.

Developer-first observability requires:
- **Consistent message patterns** - Predictable log formats help debugging
- **Proper context usage** - Structured data vs plain messages
- **Error handling standards** - Structured error logging with proper context
- **Component-based organization** - Child loggers for clear attribution
- **Log level discipline** - When to use trace, debug, info, warn, error
- **Request tracing** - Correlation IDs across component boundaries

These patterns reduce cognitive load and make logs actionable for developers and operators.

## What Changes

- Define log message conventions (action-oriented, past tense, etc.)
- Establish structured context standards (what data to include)
- Implement error handling patterns with context and stack traces
- Create component naming conventions for child loggers
- Define log level usage guidelines (trace, debug, info, warn, error, fatal)
- Add request correlation ID propagation through the gateway
- Implement structured error logging with error codes
- Add log sampling guidelines for high-volume operations
- Document examples for common scenarios (success, error, timeout, etc.)

**Breaking Changes:**
- None - all changes are conventions and patterns, no API changes

## Capabilities

### New Capabilities
- `log-message-conventions`: Standardized message patterns and conventions
- `error-logging-patterns`: Structured error logging with codes and context
- `request-correlation`: Cross-component request tracing with correlation IDs

### Modified Capabilities
- `cli-logging`: Extend with message conventions and context standards

## Impact

**Code Impact:**
- `src/observability/logger.ts`: Add utility functions for common patterns
- Add logging utility module with helper functions
- Update all log calls to follow new conventions
- Add correlation ID middleware for HTTP gateway

**Pattern Examples:**
```typescript
// Message conventions
logger.info({ serverId, toolName }, "Tool invoked");
// NOT: logger.info("Tool was invoked")

// Error handling
logger.error({ error, serverId, toolName, requestId }, "Tool invocation failed");

// Context standards
logger.debug({ duration, attempt, maxRetries }, "Retrying connection");
```

**No Breaking Changes** - Existing logs continue to work, new patterns are additive

**Documentation:**
- Add logging conventions to AGENTS.md
- Create examples in docs/logging.md
- Update README with log format examples

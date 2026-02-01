## Why

The current pino implementation is minimal, using only basic configuration with log level from environment variables. For a developer-first gateway that values observability, we need enhanced logging capabilities including:

- **Pretty printing for development** - Human-readable logs during local development
- **Configurable log destinations** - File logging, stdout, custom outputs
- **Log level control via config** - Not just environment variables
- **Sensitive data redaction** - Prevent accidental logging of secrets
- **Structured formatting** - Consistent log format across components
- **Development vs production modes** - Pretty logs in dev, JSON in prod

These enhancements will improve developer experience and provide operational visibility without requiring external tools.

## What Changes

- Add configurable log destinations (file, stdout, custom stream)
- Implement pretty-print mode for development with colorized output
- Add log level configuration in JSON config file (with env var override)
- Implement sensitive data redaction (API keys, tokens, passwords)
- Add custom log formatters with consistent field structure
- Support log sampling for high-volume request logs
- Add request/response logging middleware for HTTP gateway
- Integrate structured logging with TUI log viewer
- Add log rotation for file destinations

**Breaking Changes:**
- None - all changes are additive and backwards compatible

## Capabilities

### New Capabilities
- `log-destinations`: Configurable output destinations (file, stdout, custom)
- `log-formatting`: Pretty-print and JSON formatting modes with redaction
- `log-level-config`: Log level configuration via config file with environment override
- `request-logging`: Structured request/response logging middleware

### Modified Capabilities
- `cli-logging`: Existing spec extended with formatting and redaction requirements

## Impact

**Code Impact:**
- `src/observability/logger.ts`: Complete rewrite with enhanced configuration
- `src/config/schema.ts`: Add logging configuration section
- `src/gateway/http.ts`: Add request/response logging middleware
- `src/tui/`: Integrate structured logs into TUI log viewer

**Config Schema Impact:**
```json
{
  "logging": {
    "level": "info",
    "format": "pretty" | "json",
    "destination": "stdout" | "file" | "both",
    "file": {
      "path": "~/.goblin/logs/app.log",
      "maxSize": "10M",
      "maxFiles": 5
    },
    "redact": {
      "enabled": true,
      "paths": ["password", "token", "apiKey"]
    },
    "sampling": {
      "enabled": false,
      "rate": 0.1
    }
  }
}
```

**Dependencies:**
- Add `pino-pretty` as dev dependency for pretty printing
- Add `pino-rolling` or custom for log rotation

**No Breaking Changes** - All current log calls continue to work identically

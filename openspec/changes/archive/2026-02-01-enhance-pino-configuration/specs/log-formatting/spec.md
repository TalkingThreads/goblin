## log-formatting Specification

### Purpose
Define how log messages are formatted and how sensitive data is redacted.

### Requirements

#### Scenario: Pretty format in development
- **WHEN** `format: "pretty"` and `NODE_ENV !== "production"`
- **THEN** logs are output in human-readable format
- **AND** colors are used for log levels
- **AND** timestamps are formatted for readability

#### Scenario: JSON format in production
- **WHEN** `format: "json"` or `NODE_ENV === "production"`
- **THEN** logs are output as JSON objects
- **AND** one JSON object per line
- **AND** no colors or formatting applied

#### Scenario: Default format selection
- **WHEN** no format is specified
- **THEN** use "pretty" if `NODE_ENV !== "production"`
- **AND** use "json" if `NODE_ENV === "production"`

#### Scenario: Sensitive data redaction
- **WHEN** a log object contains redaction paths
- **THEN** the sensitive fields are replaced with `[REDACTED]`
- **AND** nested paths are supported (e.g., `headers.authorization`)
- **AND** the redaction happens before formatting

#### Scenario: Default redaction paths
- **WHEN** redaction is enabled without custom paths
- **THEN** default sensitive paths are redacted:
  - `password`
  - `token`
  - `apiKey`
  - `accessToken`
  - `refreshToken`
  - `authorization`
  - `cookie`
  - `secret`

#### Scenario: Custom redaction paths
- **WHEN** custom redaction paths are configured
- **THEN** both default and custom paths are redacted
- **AND** custom paths can override default behavior

#### Scenario: Log level configuration
- **WHEN** log level is configured
- **THEN** only logs at that level and above are output
- **AND** levels in order: trace < debug < info < warn < error < fatal
- **AND** level can be changed at runtime via config hot reload

#### Scenario: Log sampling
- **WHEN** sampling is configured with a rate
- **THEN** only the configured percentage of logs are output
- **AND** sampling applies to debug and trace levels only
- **AND** sampling is random but deterministic per request

### Configuration Schema

```typescript
const LogFormattingConfigSchema = z.object({
  format: z.enum(["pretty", "json"]).default("pretty"),
  level: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  redact: z.object({
    enabled: z.boolean().default(true),
    paths: z.array(z.string()).default([
      "password",
      "token",
      "apiKey",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
      "secret",
    ]),
    remove: z.boolean().default(false),
  }).optional(),
  sampling: z.object({
    enabled: z.boolean().default(false),
    rate: z.number().min(0).max(1).default(0.1),
  }).optional(),
});
```

### Implementation Notes
- Use `pino-pretty` for pretty formatting (dev only)
- Use native JSON formatting for production
- Use pino's built-in `redact` option
- Implement sampling via custom stream or pino options
- Support level changes via config hot reload

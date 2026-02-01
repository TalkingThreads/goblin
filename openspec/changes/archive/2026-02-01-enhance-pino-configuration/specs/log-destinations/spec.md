## log-destinations Specification

### Purpose
Define how log output destinations are configured and managed.

### Requirements

#### Scenario: Configure stdout destination
- **WHEN** logging configuration has `destination: "stdout"`
- **THEN** logs are written to standard output (process.stdout)
- **AND** no log files are created

#### Scenario: Configure file destination
- **WHEN** logging configuration has `destination: "file"` with `path`
- **THEN** logs are written to the specified file path
- **AND** the directory is created if it doesn't exist
- **AND** logs are appended to existing files

#### Scenario: Configure both destinations
- **WHEN** logging configuration has `destination: "both"`
- **THEN** logs are written to both stdout and file
- **AND** same log format is used for both destinations

#### Scenario: Custom destination
- **WHEN** a custom stream is provided via API
- **THEN** logs are written to the custom stream
- **AND** the stream receives all log levels

#### Scenario: File rotation
- **WHEN** file logging is enabled with rotation settings
- **THEN** log files are rotated when they reach max size
- **AND** old log files are archived with timestamp
- **AND** only keep configured number of rotated files

#### Scenario: File path resolution
- **WHEN** file path contains `~` or environment variables
- **THEN** resolve path relative to user home or environment variables
- **AND** absolute paths are used as-is

### Configuration Schema

```typescript
const LogDestinationConfigSchema = z.union([
  z.literal("stdout"),
  z.object({
    type: z.literal("file"),
    path: z.string(),
    rotation: z.object({
      maxSize: z.string().default("10M"),
      maxFiles: z.number().default(5),
    }).optional(),
  }),
  z.literal("both"),
]);
```

### Implementation Notes
- Use `fs.createWriteStream` for file destinations
- Use `pino-rolling` or custom rotation logic
- Handle file creation and directory setup
- Proper stream cleanup on shutdown

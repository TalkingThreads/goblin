## 1. Update Config Schema for Logging

- [ ] 1.1 Add `LoggingConfigSchema` to `src/config/schema.ts`
- [ ] 1.2 Add log destinations union type (stdout, file, both)
- [ ] 1.3 Add log formatting options (format, level, redact, sampling)
- [ ] 1.4 Add request logging configuration section
- [ ] 1.5 Add Zod validation for all logging config fields
- [ ] 1.6 Update `Config` type to include logging section
- [ ] 1.7 Test config validation with valid and invalid logging configs

## 2. Enhance Logger with Config-Driven Options

- [ ] 2.1 Modify `createLogger()` to accept config options
- [ ] 2.2 Add pretty print transport for development mode
- [ ] 2.3 Implement JSON format for production mode
- [ ] 2.4 Add sensitive data redaction configuration
- [ ] 2.5 Add log sampling support
- [ ] 2.6 Implement log level hot-reload support
- [ ] 2.7 Update base logger export with new options

## 3. Implement Log Destinations

- [ ] 3.1 Create `createStdoutDestination()` function
- [ ] 3.2 Create `createFileDestination()` function
- [ ] 3.3 Implement file path resolution (~, env vars)
- [ ] 3.4 Create `LogDestination` type and factory
- [ ] 3.5 Implement file rotation for file destinations
- [ ] 3.6 Handle multiple destinations (stdout + file)
- [ ] 3.7 Add proper cleanup on shutdown
- [ ] 3.8 Test file writing and rotation

## 4. Implement Request/Response Logging Middleware

- [ ] 4.1 Create `createRequestLoggingMiddleware()` function
- [ ] 4.2 Implement request ID generation and propagation
- [ ] 4.3 Add request incoming logging
- [ ] 4.4 Add response completion logging
- [ ] 4.5 Implement duration tracking
- [ ] 4.6 Add path exclusion matching
- [ ] 4.7 Implement body logging with redaction
- [ ] 4.8 Add status code-based log level selection
- [ ] 4.9 Integrate middleware into Hono app

## 5. Integrate Logger with TUI

- [ ] 5.1 Create `TuiLogBuffer` class for in-memory log storage
- [ ] 5.2 Implement circular buffer with max size
- [ ] 5.3 Create logger wrapper that captures logs to buffer
- [ ] 5.4 Add log buffer getter for TUI components
- [ ] 5.5 Implement log filtering by level in TUI
- [ ] 5.6 Create TUI LogViewer component
- [ ] 5.7 Add auto-scroll for new logs
- [ ] 5.8 Test TUI log integration

## 6. Add Pretty Print Dependencies

- [ ] 6.1 Add `pino-pretty` as dev dependency in `package.json`
- [ ] 6.2 Verify pretty print works in development mode
- [ ] 6.3 Verify no pretty print in production mode
- [ ] 6.4 Test color output configuration
- [ ] 6.5 Test pretty format with structured data

## 7. Add Log Rotation

- [ ] 7.1 Evaluate `pino-rolling` vs custom rotation
- [ ] 7.2 Implement log rotation logic
- [ ] 7.3 Add max size configuration
- [ ] 7.4 Add max files configuration
- [ ] 7.5 Handle file archiving with timestamps
- [ ] 7.6 Test rotation under load
- [ ] 7.7 Verify no file descriptor leaks

## 8. Update Documentation

- [ ] 8.1 Update `AGENTS.md` logging section with new features
- [ ] 8.2 Create `docs/logging.md` with examples
- [ ] 8.3 Document configuration options
- [ ] 8.4 Add examples for redaction configuration
- [ ] 8.5 Document request logging usage
- [ ] 8.6 Update README.md if needed

## 9. Testing

- [ ] 9.1 Write unit tests for config validation
- [ ] 9.2 Write unit tests for logger factory
- [ ] 9.3 Write unit tests for redaction
- [ ] 9.4 Write unit tests for request middleware
- [ ] 9.5 Write integration tests for log destinations
- [ ] 9.6 Write integration tests for TUI log display
- [ ] 9.7 Test end-to-end logging flow
- [ ] 9.8 Verify all existing tests pass

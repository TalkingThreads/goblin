## 1. Create Logging Utilities Module

- [ ] 1.1 Create `src/observability/utils.ts` for logging utilities
- [ ] 1.2 Implement `createComponentLogger()` helper
- [ ] 1.3 Implement `logError()` helper with error codes
- [ ] 1.4 Implement `createRequestLogger()` for request context
- [ ] 1.5 Define error code registry with categories
- [ ] 1.6 Add type definitions for logging utilities
- [ ] 1.7 Export utilities from `src/observability/index.ts`

## 2. Define Log Message Conventions

- [ ] 2.1 Document message convention patterns
- [ ] 2.2 Create message template examples for all scenarios
- [ ] 2.3 Add examples for success operations
- [ ] 2.4 Add examples for error operations
- [ ] 2.5 Add examples for state changes
- [ ] 2.6 Add examples for configuration changes
- [ ] 2.7 Update `AGENTS.md` with message conventions

## 3. Implement Error Code System

- [ ] 3.1 Create `src/observability/error-codes.ts`
- [ ] 3.2 Define connection error codes (CONN-*)
- [ ] 3.3 Define tool error codes (TOOL-*)
- [ ] 3.4 Define configuration error codes (CFG-*)
- [ ] 3.5 Define transport error codes (TRANSPORT-*)
- [ ] 3.6 Define internal error codes (INTERNAL-*)
- [ ] 3.7 Export error codes for use in logging

## 4. Update Existing Log Calls

- [ ] 4.1 Audit all existing log calls in codebase
- [ ] 4.2 Update `src/gateway/server.ts` log calls
- [ ] 4.3 Update `src/gateway/http.ts` log calls
- [ ] 4.4 Update `src/gateway/registry.ts` log calls
- [ ] 4.5 Update `src/gateway/router.ts` log calls
- [ ] 4.6 Update `src/config/*.ts` log calls
- [ ] 4.7 Update `src/transport/*.ts` log calls
- [ ] 4.8 Update `src/tools/**/*.ts` log calls

## 5. Implement Component Naming Standards

- [ ] 5.1 Create component naming guidelines
- [ ] 5.2 Map existing files to component names
- [ ] 5.3 Update all `createLogger()` calls with new names
- [ ] 5.4 Verify consistency with file structure
- [ ] 5.5 Add validation for component names

## 6. Implement Structured Context Patterns

- [ ] 6.1 Define context field standards for different scenarios
- [ ] 6.2 Create helper function for HTTP request context
- [ ] 6.3 Create helper function for tool invocation context
- [ ] 6.4 Create helper function for connection context
- [ ] 6.5 Create helper function for configuration context
- [ ] 6.6 Update all log calls to use structured context
- [ ] 6.7 Verify no plain string-only log messages remain

## 7. Implement Request Correlation

- [ ] 7.1 Create `src/observability/correlation.ts`
- [ ] 7.2 Implement request ID generation
- [ ] 7.3 Implement request context propagation
- [ ] 7.4 Create `withRequestContext()` helper
- [ ] 7.5 Add correlation ID to HTTP middleware
- [ ] 7.6 Add correlation ID header propagation
- [ ] 7.7 Test correlation across components

## 8. Add Log Level Discipline

- [ ] 8.1 Create log level guidelines documentation
- [ ] 8.2 Define when to use trace level
- [ ] 8.3 Define when to use debug level
- [ ] 8.4 Define when to use info level
- [ ] 8.5 Define when to use warn level
- [ ] 8.6 Define when to use error level
- [ ] 8.7 Define when to use fatal level
- [ ] 8.8 Review and update log levels across codebase

## 9. Create Logging Cheatsheet

- [ ] 9.1 Create `docs/logging-cheatsheet.md`
- [ ] 9.2 Add message pattern examples
- [ ] 9.3 Add error logging patterns
- [ ] 9.4 Add context field reference
- [ ] 9.5 Add error code reference
- [ ] 9.6 Add log level guidelines
- [ ] 9.7 Add correlation ID patterns

## 10. Update Documentation

- [ ] 10.1 Update `AGENTS.md` logging section
- [ ] 10.2 Create `docs/logging-patterns.md` with detailed examples
- [ ] 10.3 Document error code system
- [ ] 10.4 Document correlation ID propagation
- [ ] 10.5 Add logging patterns to README.md

## 11. Testing and Validation

- [ ] 11.1 Write unit tests for logging utilities
- [ ] 11.2 Write unit tests for error code system
- [ ] 11.3 Write unit tests for correlation ID
- [ ] 11.4 Write integration tests for request tracing
- [ ] 11.5 Run linting to verify log patterns
- [ ] 11.6 Verify all tests pass
- [ ] 11.7 Manual testing of log output consistency

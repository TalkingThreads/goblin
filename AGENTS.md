# Goblin - AI Agent Instructions

This file provides guidance for AI coding agents working in the Goblin codebase.

## Project Overview

Goblin is an MCP (Model Context Protocol) gateway that aggregates multiple MCP servers behind a single unified endpoint. Built with Bun, TypeScript, Hono, and the MCP SDK.

## Build Commands

```bash
# Development
bun run dev              # Run with hot reload (--watch)

# Building
bun build src/index.ts --outdir dist --target bun
bun run build            # Same via npm script

# Start production
bun run start            # Runs dist/index.js
```

## Linting & Formatting

```bash
# Check for issues
bun run lint             # biome check .

# Auto-fix issues
bun run lint:fix         # biome check --write .
bun run format           # biome format --write .

# Type checking only
bun run typecheck        # tsc --noEmit
```

## Testing

```bash
# Run all tests
bun test

# Run single test file
bun test tests/unit/example.test.ts

# Run tests matching pattern
bun test --filter "pattern"

# Watch mode
bun test --watch
```

Test files go in `tests/unit/` or `tests/integration/` with `.test.ts` extension.

## Testing Workflow Requirements

Agents **MUST** update tests after modifying source code and run tests to verify changes. This section specifies when and how to update tests.

### Test Categories and When to Update

| Test Type | Location | Trigger |
|-----------|----------|---------|
| **Unit Tests** | `tests/unit/` | Changes to individual components (config loader, gateway router, transport pool, registry, server, subscription manager, meta-tools) |
| **Integration Tests** | `tests/integration/` | Changes to transport protocols, multi-server interactions, hot-reload, handshake, virtual tools, resources, prompts |
| **Smoke Tests** | `tests/smoke/` | Changes to CLI, startup sequence, health checks, server discovery, availability, connection, listing, filtering, invocation |
| **E2E Tests** | `tests/e2e/` | Changes to agent workflows, CLI/TUI, real backend interactions, error handling, timeouts, invalid requests |
| **Performance Tests** | `tests/performance/` | Changes to performance-critical code, throughput, latency, memory usage, load handling |

### Test Update Requirements by File Change

When modifying source files, update the corresponding test categories:

| Source File Pattern | Tests to Update |
|---------------------|-----------------|
| `src/config/*.ts` | `tests/unit/config/*.test.ts`, `tests/integration/hot-reload/*.test.ts` |
| `src/gateway/router.ts` | `tests/unit/gateway/router.test.ts`, `tests/integration/e2e/*.test.ts` |
| `src/gateway/registry.ts` | `tests/unit/gateway/registry.test.ts`, `tests/integration/multi-server/*.test.ts` |
| `src/gateway/server.ts` | `tests/unit/gateway/server.test.ts`, `tests/smoke/discovery/*.test.ts` |
| `src/gateway/subscription-manager.ts` | `tests/unit/gateway/subscription-manager.test.ts`, `tests/integration/resources/subscriptions.test.ts` |
| `src/transport/*.ts` | `tests/unit/transport/*.test.ts`, `tests/integration/transport/*.test.ts` |
| `src/resources/*.ts` | `tests/unit/resources/*.test.ts`, `tests/integration/resources/*.test.ts`, `tests/integration/e2e/resources.test.ts` |
| `src/prompts/*.ts` | `tests/unit/prompts/*.test.ts`, `tests/integration/multi-server/prompts.test.ts`, `tests/integration/e2e/prompts.test.ts` |
| `src/cli/*.ts` | `tests/smoke/cli/*.test.ts`, `tests/e2e/cli-tui/*.test.ts` |
| `src/tui/*.tsx` | `tests/unit/tui/*.test.ts`, `tests/e2e/cli-tui/*.test.ts` |

### Post-Task Checklist

After completing **every** task:

1. **Identify changed files** - Use `git diff` to see what source files were modified
2. **Determine affected test categories** - Match changed files to test categories above
3. **Update existing tests** - Modify tests to cover new/changed behavior
4. **Add new tests** - Create new test files if adding new functionality
5. **Run relevant tests**:
   ```bash
   # Run unit tests (always required)
   bun test tests/unit/

   # Run integration tests (if changed transport, multi-server, or handshake)
   bun test tests/integration/

   # Run smoke tests (if changed CLI, startup, or health)
   bun test tests/smoke/

   # Run e2e tests (if changed agent workflows or meta-tools)
   bun test tests/e2e/

   # Run all tests (recommended before completing)
   bun test
   ```
6. **Verify all tests pass** - No test failures or skipped tests should remain

### Test Writing Guidelines

When adding or updating tests:

- **Unit Tests**: Use mocking (`mock.module`), test one function/component in isolation, verify input/output behavior
- **Integration Tests**: Use shared utilities (`test-client.js`, `test-server.js`, `cleanup.js`), test component interactions
- **Smoke Tests**: Keep tests simple and fast, verify basic functionality works
- **E2E Tests**: Use `agent-simulator.js` for workflow tests, simulate complete user scenarios
- **Performance Tests**: Measure actual performance metrics, use appropriate benchmarks

### Test Failure Resolution

If tests fail after your changes:

1. **Do not ignore failures** - All test failures indicate issues with the implementation
2. **Fix the implementation** - Update source code to make tests pass
3. **Update tests if needed** - If tests are incorrect, fix them (not the implementation) after confirmation
4. **Re-run tests** - Verify all tests pass before completing the task
5. **Document changes** - Note test modifications in your summary

## Code Style Guidelines

### Formatting (Biome)

- **Indentation**: 2 spaces
- **Line width**: 100 characters max
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Always
- **Trailing commas**: All (including last item)

### Imports

```typescript
// Use .js extension for local imports (ESM requirement)
import { createLogger } from "./observability/logger.js";

// Use type imports for type-only imports
import type { Logger } from "pino";

// Use node: protocol for Node.js built-ins
import { readFile } from "node:fs/promises";

// Order: external packages first, then local imports
import { Hono } from "hono";
import pino from "pino";

import { createLogger } from "./observability/logger.js";
import type { Config } from "./config/types.js";
```

### TypeScript Strictness

The project uses maximum TypeScript strictness:
- `strict: true` with all strict flags enabled
- `noUnusedLocals` and `noUnusedParameters`: error
- `noImplicitReturns`: error
- `noUncheckedIndexedAccess`: true (array/object access may be undefined)
- `noPropertyAccessFromIndexSignature`: true

```typescript
// Use bracket notation for index signatures
const value = config["key"];  // Correct
const value = config.key;     // Error if index signature

// Handle possible undefined from array access
const items = [1, 2, 3];
const first = items[0];  // Type: number | undefined
if (first !== undefined) {
  console.log(first);    // Type: number
}
```

### Naming Conventions

- **Files**: kebab-case (`logger.ts`, `config-loader.ts`)
- **Functions**: camelCase (`createLogger`, `loadConfig`)
- **Classes**: PascalCase (`McpRouter`, `ServerRegistry`)
- **Types/Interfaces**: PascalCase (`ServerConfig`, `TransportType`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants, camelCase for config
- **Type exports**: Use `export type` for type-only exports

### Error Handling

```typescript
// Main entry pattern with top-level catch
async function main(): Promise<void> {
  // Application logic
}

main().catch((error: unknown) => {
  logger.error({ error }, "Fatal error message");
  process.exit(1);
});

// Structured error logging with context
logger.error({ error, context: "additional info" }, "Error description");

// Type errors as unknown, then narrow
function handleError(error: unknown): void {
  if (error instanceof Error) {
    logger.error({ message: error.message, stack: error.stack }, "Error");
  } else {
    logger.error({ error }, "Unknown error");
  }
}
```

### Logging

Use pino with component-based child loggers and follow these conventions:

#### Message Conventions
- Use action-oriented, past tense messages
- Include context object with relevant fields
- Message format: `{action} {entity}` or `{action} {entity} {result}`

```typescript
import { createLogger } from "./observability/logger.js";

const logger = createLogger("component-name");

// ✅ Correct: Action-oriented, past tense, with context
logger.info({ serverId, toolName }, "Tool invoked");
logger.error({ error, serverId, requestId }, "Connection failed");
logger.debug({ duration, attempt, maxRetries }, "Retry attempt failed");
logger.info({ configPath }, "Configuration reloaded");

// ❌ Avoid: Plain strings, present tense, no context
logger.info("Starting server");
logger.error("Error occurred");
logger.debug("Processing request");
```

#### Context Standards
Include relevant context fields for different operation types:

```typescript
// Success operations
logger.info({ serverId, toolName }, "Tool invoked");

// Error operations - always include error object
logger.error({ error, serverId, toolName, requestId }, "Tool invocation failed");

// HTTP operations
logger.info({ requestId, method, path, status, duration }, "Request completed");

// Retry operations
logger.warn({ attempt, maxRetries, error }, "Retry attempt failed");

// Configuration operations
logger.info({ configPath }, "Configuration reloaded");
```

#### Log Level Guidelines
- **trace**: Detailed debugging, entering/exiting functions, all variable values
- **debug**: Technical debugging, request/response details, internal state
- **info**: Normal operations, successful actions, state changes
- **warn**: Recoverable issues, degraded performance, invalid inputs handled
- **error**: Failures, exceptions, timeouts, broken invariants
- **fatal**: Process-threatening errors, shutdown scenarios

#### Component Naming
Use kebab-case component names reflecting directory structure:

```typescript
const logger = createLogger("gateway-server");  // src/gateway/server.ts
const logger = createLogger("http-gateway");    // src/gateway/http.ts
const logger = createLogger("config-loader");   // src/config/loader.ts
const logger = createLogger("transport-pool");  // src/transport/pool.ts
```

#### Error Logging with Error Codes
Use the error code system for consistent error identification:

```typescript
import { logError, ERROR_CODES } from "./observability/utils.js";
import { createLogger } from "./observability/logger.js";

const logger = createLogger("router");

// ✅ Correct: Use error codes with context
logError(logger, ERROR_CODES.TOOL_NOT_FOUND, error, { toolName: "unknown" });

// Error codes follow format: {CATEGORY}-{NUMBER}
// CONN-xxx: Connection errors
// TOOL-xxx: Tool invocation errors
// CFG-xxx: Configuration errors
// TRANSPORT-xxx: Transport layer errors
// INTERNAL-xxx: Internal server errors
```

#### Request Correlation
Propagate request IDs for distributed tracing:

```typescript
import { getRequestId, createRequestLogger } from "./observability/correlation.js";

// Create child logger with request context
const requestLogger = createRequestLogger(logger);

// All logs from this request include requestId
requestLogger.info({ path: c.req.path }, "Request received");
```

### Async/Await

- Always use async/await over raw Promises
- Use `Promise<void>` return type for async functions without return value
- Handle errors at appropriate boundaries

### Documentation

```typescript
/**
 * Brief description of function purpose
 *
 * @param name - Description of parameter
 * @returns Description of return value
 */
export function example(name: string): Result {
  // Implementation
}
```

## Project Structure

```
src/
  index.ts              # Application entry point
  observability/        # Logging, metrics, tracing
    logger.ts
tests/
  unit/                 # Unit tests
  integration/          # Integration tests
docs/                   # Documentation
openspec/               # Specifications and change proposals
  project.md            # Project conventions
  specs/                # Current specifications
  changes/              # Proposed changes
```

## Key Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **hono**: Lightweight HTTP framework
- **pino**: Structured JSON logging
- **prom-client**: Prometheus metrics
- **zod**: Runtime type validation

## Environment Variables

- `LOG_LEVEL`: Logging level (default: "info")
  - Options: "trace", "debug", "info", "warn", "error", "fatal"

## Cross-Platform Compatibility

Goblin is built with Bun and designed to run on macOS, Linux, and Windows. Follow these guidelines to ensure code works across all platforms.

### File Path Handling

Always use the `node:path` module for path operations:

```typescript
// ✅ Correct: Use path module
import { join, resolve, dirname } from "node:path";
const configPath = join(configDir, "config.json");
const absolutePath = resolve(relativePath);

// ❌ Avoid: Manual string concatenation
const configPath = configDir + "/config.json";  // Unix only
const configPath = configDir + "\\config.json"; // Windows only
```

For path detection, check both Unix and Windows patterns:

```typescript
// ✅ Correct: Cross-platform path detection
const isAbsolutePath =
  absolutePath.startsWith("/") || // Unix
  /^[A-Za-z]:/.test(absolutePath); // Windows (e.g., C:\)
```

### Process Signals

Node.js signal handling varies by platform. Windows has limited signal support:

| Signal | macOS/Linux | Windows |
|--------|-------------|---------|
| SIGINT | ✅ | ✅ (Ctrl+C) |
| SIGTERM | ✅ | ❌ Not supported |
| SIGKILL | ✅ | ✅ (force kill) |
| SIGHUP | ✅ | ❌ Not supported |

```typescript
// ✅ Correct: Cross-platform signal handling
import process from "node:process";

function setupShutdownHandlers(callback: () => void): void {
  // SIGINT works on all platforms (Ctrl+C)
  process.on("SIGINT", () => {
    callback();
  });

  // SIGTERM only on Unix-like systems
  if (process.platform !== "win32") {
    process.on("SIGTERM", () => {
      callback();
    });
  }
}

// For graceful shutdown with fallback
async function gracefulShutdown(process: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      process.kill("SIGKILL"); // Force kill on all platforms
    }, 5000);

    process.on("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    // Try graceful first
    if (process.platform === "win32") {
      // Windows: SIGINT is the only graceful option
      process.kill("SIGINT");
    } else {
      // Unix: SIGTERM for graceful shutdown
      process.kill("SIGTERM");
    }
  });
}
```

### Shell Commands and Process Spawning

Avoid shell-specific features. Use array arguments instead of command strings:

```typescript
// ✅ Correct: Array arguments (cross-platform)
import { spawn } from "node:child_process";
const process = spawn("node", ["script.js", "--flag"], {
  stdio: "pipe",
  env: { ...process.env, CUSTOM_VAR: "value" },
});

// ❌ Avoid: Shell command strings (platform-specific)
const process = spawn("node script.js --flag", { shell: true }); // Unix only
const process = spawn("node script.js --flag && echo done", { shell: true }); // Unix-specific
```

### Environment Variables

Use bracket notation for environment variables to avoid issues with special characters:

```typescript
// ✅ Correct: Bracket notation
const homeDir = process.env["HOME"] || process.env["USERPROFILE"];
const path = process.env["PATH"];

// Access with fallback
const logLevel = (process.env["LOG_LEVEL"] as LogLevel) ?? "info";
```

### Home Directory Resolution

Use platform-specific environment variables for home directory:

```typescript
// ✅ Correct: Cross-platform home directory
function getHomeDir(): string {
  return process.env["HOME"] || // Unix/macOS
    process.env["USERPROFILE"] || // Windows
    process.cwd(); // Fallback
}

// For config/log paths, use env-paths library
import envPaths from "env-paths";
const paths = envPaths("goblin");
// Returns platform-appropriate paths automatically
```

### Line Endings

Handle both Unix (`\n`) and Windows (`\r\n`) line endings:

```typescript
// ✅ Correct: Handle both line endings
import { createInterface } from "node:readline";
const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity, // Handle \r\n correctly
});

// When splitting lines manually
const lines = content.split(/\r?\n/); // Matches both \n and \r\n
```

### File Permissions

File permission operations (chmod, chown) are Unix-specific. Skip on Windows:

```typescript
// ✅ Correct: Conditional permission operations
import { chmod } from "node:fs/promises";

async function setPermissions(path: string, mode: number): Promise<void> {
  if (process.platform !== "win32") {
    await chmod(path, mode);
  }
  // Windows: permissions handled differently (ACLs)
}
```

### Temporary Directories

Always use `node:os` for temporary directory paths:

```typescript
// ✅ Correct: Use os.tmpdir()
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";

const tempDir = mkdtempSync(join(tmpdir(), "goblin-"));

// ❌ Avoid: Hardcoded temp paths
const tempDir = "/tmp/goblin"; // Unix only
const tempDir = "C:\\Windows\\Temp\\goblin"; // Windows only
```

### Testing Cross-Platform Code

Write tests that work on all platforms:

```typescript
// ✅ Correct: Platform-aware tests
import { test, expect, describe } from "bun:test";
import { join } from "node:path";

describe("path operations", () => {
  test("should join paths correctly", () => {
    const result = join("foo", "bar");
    // Don't assert exact string - platform dependent
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });
});

// For platform-specific tests, use conditional tests
describe("Unix-specific features", () => {
  test.skipIf(process.platform === "win32")("should handle Unix signals", () => {
    // Unix-only test
  });
});
```

### Cross-Platform Checklist

Before submitting code, verify:

- [ ] No hardcoded path separators (`/` or `\`)
- [ ] Use `node:path` for all path operations
- [ ] Handle both `HOME` and `USERPROFILE` for home dir
- [ ] Signal handlers check `process.platform`
- [ ] No shell-specific commands or syntax
- [ ] Process spawning uses array arguments
- [ ] Line ending handling with `crlfDelay: Infinity`
- [ ] File permission ops are conditional
- [ ] Tests pass on all target platforms

## Quality Requirements for All Changes

Agents **MUST** follow these quality requirements for every change:

### Pre-Commit Checklist

Before committing any changes, run these commands:

```bash
# 1. Run linter and fix any issues
bun run lint:fix

# 2. Run type checking
bun run typecheck

# 3. Run unit tests for affected code
bun test tests/unit/

# 4. Update CHANGELOG.md for source changes
```

### Quality Gates

All changes must pass these gates:

1. **Lint**: No lint errors (warnings allowed)
2. **Typecheck**: TypeScript compilation succeeds
3. **Tests**: All relevant unit tests pass
4. **Changelog**: CHANGELOG.md updated for source changes

### Consequences

Skipping quality checks will result in:

- Pre-commit hooks blocking the commit
- CI/CD pipeline failures
- PR rejection until issues are fixed
- Reputation penalties for repeated violations

### Git Hooks

This project uses Husky for pre-commit hooks. Install them with:

```bash
bun run prepare  # Runs automatically after npm/bun install
```

Hooks run automatically on commit:
- TypeScript type checking
- Biome linting
- Unit tests
- Agent compliance checks

To skip hooks (not recommended):
```bash
git commit --no-verify  # Use only in emergencies
```

### Enforcement Details

**Pre-commit Hooks:**
- Configured in `.husky/pre-commit`
- Runs: typecheck → lint → unit tests → agent compliance
- Fails fast on first error

**CI Workflows:**
- Build & Lint: Runs on every PR
- Tests: Unit and integration tests
- Changelog Validation: Checks CHANGELOG.md updated for source changes
- All workflows use Bun dependency caching

**Smart Test Selection:**
- Script: `tools/ci/affected-tests.sh`
- Maps changed files to relevant tests
- Use `--all` flag to force full test suite

**Agent Compliance:**
- Rules defined in `.agent-rules.md`
- Checked by `tools/agents-guard/check.sh`
- Validates: CHANGELOG updates, no skipped tests, lint/typecheck pass

# Goblin - AI Agent Instructions

This file provides guidance for AI coding agents working in the Goblin codebase.

## Project Overview

Goblin is an MCP (Model Context Protocol) gateway that aggregates multiple MCP servers behind a single unified endpoint. Built with Bun, TypeScript, Hono, and the MCP SDK.

## Build Commands

```bash
# Development
bun run dev              # Run with hot reload (--watch)

# Building
bun build src/index.ts --outdir dist --target node
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

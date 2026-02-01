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

Use pino with component-based child loggers:

```typescript
import { createLogger } from "./observability/logger.js";

const logger = createLogger("component-name");

// Structured logging - context object first, message second
logger.info({ userId, action }, "User performed action");
logger.error({ error, requestId }, "Request failed");
logger.debug({ data }, "Debug information");
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

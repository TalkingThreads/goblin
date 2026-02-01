## Context

Goblin currently lacks comprehensive unit test coverage for its core components. The project has integration tests but no systematic unit tests for:
- Meta-tools (invocation, validation, catalog operations)
- Registry (registration, aliasing, caching)
- Router (namespacing, error handling, timeout enforcement)
- Config (atomic updates, rollback, hot reload)
- Observability (logger output, metrics collection)
- Transport (STDIO/HTTP adapters, connection pooling, health checks)

Current state: Only basic example tests exist in tests/unit/ without coverage of critical paths.

Constraints: Tests must use Bun test + Vitest, follow project conventions (2-space indent, double quotes, trailing commas), and achieve minimum 80% coverage on critical paths.

## Goals / Non-Goals

**Goals:**
- Achieve 80% code coverage on critical paths (registry, router, config, transport)
- Enable safe refactoring without breaking existing behavior
- Provide fast feedback (unit tests run in milliseconds)
- Document expected behavior through test cases
- Test error handling paths and edge cases

**Non-Goals:**
- Integration tests (already exist separately)
- End-to-end tests
- Performance/load testing
- UI/CLI interaction tests (handled by integration tests)

## Decisions

### Decision 1: Test Structure

**Choice:** Organize tests by component (meta-tools, registry, router, config, observability, transport) with shared utilities

**Rationale:**
- Mirrors source code structure for easy navigation
- Shared utilities reduce duplication
- Each component can be tested independently

**Implementation:**
```
tests/unit/
├── meta-tools/
│   ├── invocation.test.ts
│   ├── validation.test.ts
│   ├── catalog.test.ts
│   └── utils/
├── registry/
│   ├── registration.test.ts
│   ├── aliasing.test.ts
│   ├── caching.test.ts
│   └── utils/
├── router/
│   ├── routing.test.ts
│   ├── namespacing.test.ts
│   ├── error-handling.test.ts
│   └── utils/
├── config/
│   ├── atomic-updates.test.ts
│   ├── rollback.test.ts
│   ├── hot-reload.test.ts
│   └── utils/
├── observability/
│   ├── logger.test.ts
│   ├── metrics.test.ts
│   └── utils/
├── transport/
│   ├── stdio.test.ts
│   ├── http.test.ts
│   └── utils/
└── shared/
    ├── mocks.ts
    ├── fixtures.ts
    └── assertions.ts
```

### Decision 2: Mock Strategy

**Choice:** Use Vitest mocks for external dependencies (fs, http, timers)

**Rationale:**
- Vitest provides excellent mocking capabilities
- Tests should not depend on real file system or network
- Mocking enables deterministic test execution

**Implementation:**
```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockFs } from "./shared/mocks";

describe("ConfigLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFs.reset();
  });

  it("loads config from file", async () => {
    mockFs.writeFile("/config/goblin.json", validConfig);
    const loader = new ConfigLoader();
    const config = await loader.load("/config/goblin.json");
    expect(config).toEqual(validConfig);
  });
});
```

### Decision 3: Error Testing

**Choice:** Test all error paths with specific error types and messages

**Rationale:**
- Error handling is critical for reliability
- Tests document expected error behavior
- Enables confident refactoring of error handling

**Implementation:**
```typescript
describe("Router", () => {
  it("throws ServerNotFoundError when server does not exist", () => {
    const router = new Router();
    expect(() => router.route("unknown-server", request))
      .toThrow(ServerNotFoundError);
  });

  it("throws TimeoutError when request exceeds timeout", async () => {
    const router = new Router({ timeout: 100 });
    await expect(router.route("slow-server", slowRequest))
      .rejects.toThrow(TimeoutError);
  });
});
```

### Decision 4: Test Coverage Requirements

**Choice:** Minimum 80% coverage on critical paths, 100% on error paths

**Rationale:**
- Critical paths (registration, routing, config loading) need high coverage
- Error paths must always be tested (bugs hide in error handling)
- Coverage enforcement prevents test debt

**Implementation:**
```json
// vitest.config.ts
export default defineConfig({
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html"],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      "src/gateway/registry.ts": 90,
      "src/gateway/router.ts": 90,
      "src/config/loader.ts": 90,
    },
  },
});
```

### Decision 5: Test Data Management

**Choice:** Use fixture files for complex test data

**Rationale:**
- Complex configurations are hard to inline in tests
- Fixtures can be shared across tests
- Easier to update test data when schemas change

**Implementation:**
```
tests/fixtures/
├── configs/
│   ├── valid.json
│   ├── invalid.json
│   └── minimal.json
├── tools/
│   └── definition.json
└── resources/
    └── manifest.json
```

## Risks / Trade-offs

### [Risk] Test maintenance overhead
**→ Mitigation:** Organize tests to mirror source structure, use shared utilities, keep tests focused on behavior not implementation

### [Risk] Mocking complexity for filesystem
**→ Mitigation:** Create robust mockFs utility with common operations, document mock patterns, use integration tests for actual file operations

### [Risk] Time-sensitive tests (timeouts, debounce)
**→ Mitigation:** Use Vitest fake timers, document timer-based testing patterns, avoid real-time waits in tests

### [Risk] HTTP transport testing complexity
**→ Mitigation:** Mock HTTP server and client, test connection pooling separately, use supertest-style patterns for request/response

## Migration Plan

1. Create test directory structure and shared utilities
2. Add Vitest configuration with coverage thresholds
3. Write tests for each component in priority order:
   - Registry (core routing logic)
   - Router (request handling)
   - Config (critical for stability)
   - Transport (connection handling)
   - Meta-tools (tool invocation)
   - Observability (logging/metrics)
4. Run full test suite to verify coverage
5. Add tests to CI pipeline

Rollback: Remove test files and update package.json/vitest.config.ts

## Open Questions

1. Should we use snapshot testing for logger output? (Yes, for structured log verification)
2. Should we test private methods? (Only via friends pattern, not direct access)
3. What coverage threshold is acceptable for transport layer? (70% - harder to test without real connections)

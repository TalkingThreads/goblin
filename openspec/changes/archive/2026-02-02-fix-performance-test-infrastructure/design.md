# Technical Design: Performance Test Infrastructure Fix

## Overview

Fix performance tests to properly manage server lifecycle, increase timeouts, and handle process cleanup.

## Current Issues

1. **No server startup**: Tests spawn load generators without starting a gateway server
2. **Insufficient timeouts**: 5000ms timeout vs 30-60s load tests
3. **Process leaks**: "killed 1 dangling process" messages
4. **No test isolation**: Resources not cleaned up between tests

## Proposed Solution

### 1. Server Lifecycle Management

Add `startTestServer()` and `stopTestServer()` to performance tests:

```typescript
describe("Load Tests", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer(server);
  });

  // Tests...
});
```

### 2. Timeout Configuration

Increase test timeouts to match load test duration:

```typescript
// Load tests need 30-60 seconds minimum
test("should handle load", async () => {
  const result = await runLoadTest({
    duration: 30000, // 30 seconds
    timeout: 60000,  // 60 seconds
  });
}, 90000); // Test timeout
```

### 3. Process Lifecycle

Use proper process management in load-generator.ts:

```typescript
async function runLoadTest(options: LoadTestOptions): Promise<LoadTestResult> {
  const process = spawn("wrk", args);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      process.kill("SIGTERM");
      reject(new Error("Load test timed out"));
    }, options.timeout);

    process.on("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(parseResults());
      } else {
        reject(new Error(`Load test failed with code ${code}`));
      }
    });
  });
}
```

## Implementation Plan

1. **Update test-server.ts** - Ensure proper server lifecycle
2. **Update concurrent.test.ts** - Add server management and correct timeouts
3. **Update rampup.test.ts** - Add server management and correct timeouts
4. **Update sustained.test.ts** - Add server management and correct timeouts
5. **Update load-generator.ts** - Proper process cleanup

## Files to Modify

1. `tests/performance/shared/test-server.ts`
2. `tests/performance/load/concurrent.test.ts`
3. `tests/performance/load/rampup.test.ts`
4. `tests/performance/load/sustained.test.ts`
5. `tests/performance/shared/load-generator.ts`

## Expected Results

- All load tests complete without timeout errors
- No dangling processes after tests
- Clean test infrastructure

## Context

The Goblin gateway currently uses signal handlers in `src/cli/commands/start.tsx` to handle graceful shutdown:

```typescript
const shutdown = async () => {
  logger.info("Received shutdown signal");
  await gateway.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

This code assumes both `SIGINT` and `SIGTERM` are available, but Windows doesn't support `SIGTERM`. This can lead to:
- Unhandled exceptions on Windows when attempting to register `SIGTERM`
- Inconsistent shutdown behavior across platforms
- Failed graceful shutdown on Windows containers

Additionally, the test utilities in `tests/e2e/shared/cli-tester.ts` and `tests/smoke/shared/process-manager.ts` use hardcoded signals like `SIGTERM` and `SIGKILL` without platform consideration.

## Goals / Non-Goals

**Goals:**
- Implement cross-platform signal handling that works on macOS, Linux, and Windows
- Create reusable utilities for shutdown handling that can be used throughout the codebase
- Update test utilities to use platform-appropriate shutdown strategies
- Add comprehensive tests to verify signal handling works on all platforms
- Ensure graceful shutdown works correctly on Windows (using `SIGINT` instead of `SIGTERM`)

**Non-Goals:**
- Change the external behavior or CLI interface
- Add new dependencies (we'll use Node.js built-ins only)
- Support platforms other than macOS, Linux, and Windows
- Change the actual shutdown logic (just the signal handling)

## Decisions

### 1. Where to Place the Utility Functions

**Decision**: Add signal handling utilities to `src/observability/utils.ts`

**Rationale**: This file already contains logging and error handling utilities. Signal handling is part of the observability layer as it deals with process lifecycle and graceful degradation. Keeping it here makes it easily importable from both CLI and core code.

**Alternative considered**: Create a new `src/utils/signals.ts` file. Rejected to avoid over-fragmentation for a small utility.

### 2. Signal Handling Strategy

**Decision**: Use platform detection to conditionally register `SIGTERM` handler

```typescript
function setupShutdownHandlers(callback: () => void): void {
  // SIGINT works on all platforms (Ctrl+C)
  process.on("SIGINT", callback);
  
  // SIGTERM only on Unix-like systems
  if (process.platform !== "win32") {
    process.on("SIGTERM", callback);
  }
}
```

**Rationale**: Windows only supports `SIGINT` (Ctrl+C) and `SIGKILL` (force kill). Attempting to listen for `SIGTERM` on Windows will either throw an error or be silently ignored depending on Node.js version. This approach ensures consistent behavior.

### 3. Test Utility Updates

**Decision**: Create a `gracefulShutdown()` helper for ChildProcess

**Rationale**: When stopping test processes, we should try `SIGTERM` on Unix and `SIGINT` on Windows first, then escalate to `SIGKILL` if the process doesn't exit within a timeout.

**Implementation approach**:
```typescript
async function gracefulShutdown(
  childProcess: ChildProcess, 
  timeoutMs = 5000
): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      childProcess.kill("SIGKILL"); // Works on all platforms
    }, timeoutMs);

    childProcess.on("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    // Platform-specific graceful signal
    if (process.platform === "win32") {
      childProcess.kill("SIGINT");
    } else {
      childProcess.kill("SIGTERM");
    }
  });
}
```

### 4. Testing Strategy

**Decision**: Create unit tests in `tests/unit/observability/utils.test.ts`

**Rationale**: We need to verify that:
1. Signal handlers are registered correctly on each platform
2. The `setupShutdownHandlers()` utility works as expected
3. Platform detection logic works correctly

**Testing approach**: Use Bun's `test.skipIf()` to skip Unix-specific tests on Windows and vice versa where needed.

## Risks / Trade-offs

**[Risk] Windows graceful shutdown may take longer**
→ Windows only supports `SIGINT` for graceful shutdown. Some processes may not respond as quickly to `SIGINT` as they would to `SIGTERM`. 
→ **Mitigation**: Set appropriate timeout values and ensure `SIGKILL` fallback is always available.

**[Risk] Test flakiness due to platform-specific timing**
→ Windows process termination can have different timing characteristics than Unix.
→ **Mitigation**: Use generous timeouts in tests and rely on `process.on('exit')` events rather than fixed delays.

**[Risk] Breaking existing signal handling behavior**
→ If tests or users rely on specific signal handling timing, this change could affect them.
→ **Mitigation**: The change only affects Windows (which didn't work properly before) and preserves Unix behavior exactly.

## Migration Plan

1. **Phase 1**: Implement the utility functions and update `src/cli/commands/start.tsx`
2. **Phase 2**: Update test utilities to use new helpers
3. **Phase 3**: Add comprehensive unit tests
4. **Phase 4**: Run full test suite on Windows CI (if available) or manually verify

**Rollback**: If issues are discovered, revert the changes to `src/cli/commands/start.tsx` and test utilities. The core functionality won't be affected as this is purely an enhancement for Windows support.

## Open Questions

1. Should we also handle `SIGHUP` for daemon mode on Unix systems? (Out of scope for this change)
2. Do we need to handle `SIGBREAK` on Windows (Ctrl+Break)? (Lower priority, can be added later)
3. Should the graceful shutdown timeout be configurable via environment variable? (Consider for future enhancement)

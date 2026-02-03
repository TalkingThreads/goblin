## Why

The current signal handling implementation in `src/cli/commands/start.tsx` registers both `SIGINT` and `SIGTERM` handlers without platform checks. Windows does not support `SIGTERM`, which can cause the process to crash or behave unpredictably when shut down on Windows. This change ensures graceful shutdown works reliably across all supported platforms (macOS, Linux, and Windows).

## What Changes

- **Add platform-specific signal handling**: Check `process.platform` before registering `SIGTERM` handler on Windows
- **Implement cross-platform shutdown helper**: Create a utility function in `src/observability/utils.ts` for consistent signal handling
- **Update test utilities**: Modify `tests/e2e/shared/cli-tester.ts` and `tests/smoke/shared/process-manager.ts` to use cross-platform shutdown strategies
- **Add cross-platform tests**: Create unit tests for signal handling behavior on different platforms

## Capabilities

### New Capabilities
- `cross-platform-signals`: Cross-platform process signal handling and graceful shutdown utilities

### Modified Capabilities
- None (this is an internal implementation fix that doesn't change external behavior)

## Impact

- **Code**: 
  - `src/cli/commands/start.tsx` - Add platform checks for signal handlers
  - `src/observability/utils.ts` - Add `setupShutdownHandlers()` utility
  - `tests/e2e/shared/cli-tester.ts` - Use cross-platform shutdown in cleanup
  - `tests/smoke/shared/process-manager.ts` - Use cross-platform shutdown strategies
- **Tests**: New unit tests for signal handling utilities
- **Dependencies**: No new dependencies (uses Node.js built-ins)
- **Platforms**: Improves Windows compatibility without affecting macOS/Linux behavior

## Why

CLI configuration tests in `tests/e2e/cli-tui/` fail because the `config validate` and `config show` commands require a running gateway server to function correctly. The tests currently run without starting a server, causing exit code 1 errors.

## What Changes

- Add `beforeAll` hook to CLI config test sections to start gateway server
- Add `afterAll` hook to stop gateway server after config tests complete
- Use `startTestServer`/`stopTestServer` from performance test shared module
- Add conditional skip if server cannot be started

## Capabilities

### New Capabilities
- `cli-config-test-server`: Server lifecycle management for CLI configuration tests

### Modified Capabilities
None - this is test infrastructure only, no production code changes.

## Impact

- **Affected Files**: `tests/e2e/cli-tui/cli-commands.test.ts`, `tests/e2e/cli-tui/cli-output.test.ts`
- **Affected Tests**: ~10 CLI config validation and display tests
- **Risk**: Low - test infrastructure changes only
- **Dependencies**: Uses existing `test-server.ts` from performance tests

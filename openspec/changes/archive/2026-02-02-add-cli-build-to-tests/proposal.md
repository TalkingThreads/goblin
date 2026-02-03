# Add CLI Build to Test Scripts

## Why

The E2E CLI tests in `tests/e2e/cli-tui/` are failing because the `CliTester` class defaults to using `node dist/cli/index.js` as the CLI binary path, but the CLI has never been built. The tests spawn Bun's help instead of goblin's help, causing 20+ test failures.

## What Changes

- Add `pretest:e2e` script to `package.json` that builds the CLI before running E2E tests
- Add `pretest` script that runs all pretest scripts for test categories
- Modify `CliTester` to detect if CLI binary exists and skip gracefully if not
- Affected test files: `cli-commands.test.ts`, `cli-output.test.ts`

## Capabilities

### New Capabilities
- `cli-test-build`: Defines how CLI tests ensure the binary is available before running

### Modified Capabilities
None - this is a test infrastructure improvement without behavioral changes.

## Impact

- **Affected Files**: `package.json`, `tests/e2e/shared/cli-tester.ts`
- **Affected Tests**: ~25 E2E CLI tests
- **Risk**: Low - adding build step and graceful fallback
- **Build Time**: CLI builds in ~5 seconds

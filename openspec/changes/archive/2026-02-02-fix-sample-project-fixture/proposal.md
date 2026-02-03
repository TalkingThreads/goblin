## Why

The `createSampleProject` function in `tests/e2e/shared/fixtures.ts` fails because it attempts to write files to a nested directory structure that doesn't exist. The code uses forward slashes (`/`) which don't create parent directories on Windows, causing `ENOENT` errors when trying to write to `project-xxx/simple-node/package.json`.

## What Changes

- Fix `createSampleProject` to create parent directories using `mkdirSync` with `recursive: true`
- Fix path separators to work on Windows (use `join` from `node:path`)
- Verify all sample project creation tests pass

## Capabilities

### New Capabilities
- `sample-project-fixture`: Fixed sample project creation for cross-platform compatibility

### Modified Capabilities
None - this is test fixture infrastructure only.

## Impact

- **Affected File**: `tests/e2e/shared/fixtures.ts`
- **Affected Tests**: 2 CLI integration tests ("can read project files", "project structure is correct")
- **Risk**: Low - bug fix for existing test fixture

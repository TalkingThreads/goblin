# Fix Baseline Import Error

## Why

The performance test baseline storage tests are failing with a syntax error because `tests/performance/shared/baseline-manager.ts` imports `existsSync` from `node:fs/promises`, but `existsSync` is a synchronous function that only exists in `node:fs`, not in the promises module. This blocks all 28 baseline storage and comparison tests from running.

## What Changes

- **Fix import statement** in `tests/performance/shared/baseline-manager.ts`:
  - Change: `import { existsSync, mkdir, readFile, writeFile } from "node:fs/promises";`
  - To: Split into synchronous and asynchronous imports
  - `existsSync` → `import { existsSync } from "node:fs";`
  - `mkdir`, `readFile`, `writeFile` → `import { mkdir, readFile, writeFile } from "node:fs/promises";`

## Capabilities

### New Capabilities
None - this is a bug fix for existing baseline functionality.

### Modified Capabilities
None - no changes to requirements or behavior, only corrects an import error.

## Impact

- **Affected File**: `tests/performance/shared/baseline-manager.ts` (1 line)
- **Affected Tests**: 28 baseline storage and comparison tests
- **Risk**: Low - mechanical import correction, no logic changes
- **Dependencies**: No changes to package.json or external dependencies

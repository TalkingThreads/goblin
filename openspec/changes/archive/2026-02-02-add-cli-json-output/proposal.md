## Why

CLI JSON output tests fail because the `version`, `status`, and `logs` commands don't support the `--json` flag. Tests expect JSON output but commands return text help or error messages.

## What Changes

- Add `--json` flag support to `version` command
- Add `--json` flag support to `status` command  
- Add `--json` flag support to `logs` command
- Update test expectations to match actual CLI behavior

## Capabilities

### New Capabilities
- `cli-json-output`: JSON output format for CLI commands

### Modified Capabilities
None - this adds new CLI functionality.

## Impact

- **Affected File**: `src/cli/commands/*.ts`
- **Affected Tests**: 6 JSON output tests
- **Risk**: Medium - CLI implementation changes

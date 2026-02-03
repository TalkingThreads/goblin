# Change: Add --config Option Alias for CLI Config Commands

## Summary

Added `--config` as an alias for `--path` in config validation and show commands to match common CLI conventions and fix test failures.

## Problem

Tests were using `--config` option but CLI only accepted `--path`, causing 5 tests to fail with "No server running" errors.

## Solution

1. Updated `src/cli/commands/config.ts`:
   - Added `config?: string` to `ConfigOptions` interface
   - Created `resolveConfigPath()` helper to handle both options
   - Updated both `validateConfigCommand()` and `showConfigCommand()` to use the helper

2. Updated `src/cli/index.ts`:
   - Added `--config <path>` option to `config validate` command
   - Added `--config <path>` option to `config show` command

## Files Changed

- `src/cli/commands/config.ts` - Added config option alias support
- `src/cli/index.ts` - Added --config CLI options

## Tests

All 60 tests now pass:
- 17 agent workflow tests ✓
- 36 CLI tests ✓
- 7 baseline tests ✓

## Impact

- Backward compatible (--path still works)
- Matches common CLI convention (--config is standard)
- Tests now pass without modification

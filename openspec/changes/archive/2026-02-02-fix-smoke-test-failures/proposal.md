## Why

The smoke test suite has 6 failing tests that indicate real issues with CLI behavior and process management. These failures block reliable deployment verification and indicate missing functionality (stop command) and incorrect error handling (status command exit codes, missing -v flag, resource cleanup).

## What Changes

1. **Fix CLI status command exit code**: Change status command to exit with code 0 when no gateway is running (current behavior: exits with code 1)
2. **Add CLI stop command**: Implement a new `stop` command to gracefully shut down a running gateway
3. **Add -v short flag support**: Enable `-v` as an alias for `--version` in the CLI
4. **Fix ProcessManager cleanup**: Ensure temp directories are properly removed after process shutdown
5. **Fix graceful shutdown test**: Resolve in-flight request handling during shutdown

## Capabilities

### New Capabilities

- `cli-stop-command`: Graceful shutdown of running gateway instances via CLI

### Modified Capabilities

- `cli-status-command`: Change exit code behavior when gateway is not running (exit 0 instead of exit 1)
- `cli-version-command`: Add support for `-v` short flag in addition to `--version`

## Impact

- **CLI behavior changes**: Status command will no longer error when gateway is offline (behavioral change)
- **New CLI command**: `goblin stop` will be available
- **Test infrastructure**: ProcessManager cleanup will be more reliable
- **No breaking API changes**: All changes are additive or fix incorrect behavior

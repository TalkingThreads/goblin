## Context

The smoke tests revealed 6 specific failures:

1. **CLI Status Command** (`tests/smoke/cli/status.test.ts:61`): Expects exit code 0 when no gateway is running, currently exits with code 1
2. **CLI Stop Command** (`tests/smoke/cli/stop.test.ts:62,69`): Command doesn't exist - "unknown command 'stop'"
3. **CLI Version Flag** (`tests/smoke/cli/version.test.ts:78`): `-v` flag not supported - only `--version` works
4. **Forced Shutdown Cleanup** (`tests/smoke/startup/forced.test.ts:75`): Temp directory not cleaned up after forced shutdown
5. **Graceful Shutdown** (`tests/smoke/startup/graceful.test.ts`): In-flight request test fails with ECONNRESET

Current CLI implementation uses Commander.js with commands defined in `src/cli/index.ts`. The status command is implemented in `src/cli/commands/status.ts` and exits with code 1 on connection failure (line 79).

## Goals / Non-Goals

**Goals:**
- Fix status command to exit with code 0 when gateway is not running (informational, not error)
- Implement stop command for graceful gateway shutdown
- Add `-v` as alias for `--version`
- Fix ProcessManager temp directory cleanup in tests
- Fix graceful shutdown in-flight request handling

**Non-Goals:**
- No changes to gateway core functionality
- No changes to MCP protocol handling
- No breaking changes to existing CLI commands

## Decisions

1. **Status Command Exit Code**: Exit code 0 is appropriate for "status checked, gateway not running" - this is a valid state, not an error. The command successfully determined the gateway is offline.

2. **Stop Command Implementation**: The stop command will:
   - Accept an optional `--url` parameter (default: http://localhost:3000)
   - Send POST request to `/shutdown` endpoint
   - Exit with code 0 on success, code 1 if gateway not running
   - Wait for confirmation or timeout

3. **Version Flag**: Commander.js supports `.option('-v, --version')` pattern. We'll add the short flag alias.

4. **ProcessManager Cleanup**: The issue is in `cleanup()` method - it calls `rmSync` but doesn't handle the case where the process was killed (SIGKILL) and resources might still be held. Add retry logic with delay.

5. **Graceful Shutdown**: The ECONNRESET indicates the server is closing connections too aggressively. Ensure in-flight requests complete before closing connections.

## Risks / Trade-offs

- **[Risk] Status command behavior change**: Scripts that relied on status command failing (exit 1) when gateway is down will now see exit 0. This is intentional but could break existing automation.
  - **Mitigation**: Document the behavioral change in changelog

- **[Risk] Stop command requires running gateway**: If gateway crashes or is unresponsive, stop command will fail
  - **Mitigation**: Provide clear error message and suggest using system process manager (kill, task manager)

- **[Risk] Temp directory cleanup timing**: Windows file system locks may prevent immediate cleanup after process kill
  - **Mitigation**: Add retry logic with exponential backoff in ProcessManager.cleanup()

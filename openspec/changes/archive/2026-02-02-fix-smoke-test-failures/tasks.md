## 1. Fix CLI Status Command Exit Code

- [x] 1.1 Modify `src/cli/commands/status.ts` to exit with code 0 instead of code 1 when gateway is not running
- [x] 1.2 Update error handling in status command to treat "connection refused" as informational state
- [x] 1.3 Test that `goblin status` returns exit code 0 when no gateway is running

## 2. Implement CLI Stop Command

- [x] 2.1 Create new file `src/cli/commands/stop.ts` with stop command implementation
- [x] 2.2 Add POST request to `/shutdown` endpoint in stop command
- [x] 2.3 Register stop command in `src/cli/index.ts` with appropriate options (--url)
- [x] 2.4 Implement graceful handling when gateway is not running (exit 0)
- [x] 2.5 Test that `goblin stop` is listed in help output
- [x] 2.6 Test that `goblin stop --help` works correctly

## 3. Add -v Short Flag Support

- [x] 3.1 Update Commander.js configuration in `src/cli/index.ts` to support `-v` alias
- [x] 3.2 Test that `goblin -v` outputs version and exits with code 0
- [x] 3.3 Verify `goblin --version` still works as before

## 4. Fix ProcessManager Cleanup

- [x] 4.1 Modify `tests/smoke/shared/process-manager.ts` cleanup() method
- [x] 4.2 Add retry logic with exponential backoff for temp directory removal
- [x] 4.3 Add small delay after process kill before attempting cleanup
- [x] 4.4 Test that temp directories are properly removed after forced shutdown

## 5. Fix Graceful Shutdown Test

- [x] 5.1 Investigate ECONNRESET error in graceful shutdown test
- [x] 5.2 Ensure in-flight requests complete before server closes connections
- [x] 5.3 Verify graceful shutdown waits for active requests to finish
- [ ] 5.4 Run `tests/smoke/startup/graceful.test.ts` to confirm fix

## 6. Verify All Smoke Tests Pass

- [ ] 6.1 Run full smoke test suite with `bun test tests/smoke`
- [ ] 6.2 Verify all 6 previously failing tests now pass
- [ ] 6.3 Run lint and typecheck: `bun run lint && bun run typecheck`

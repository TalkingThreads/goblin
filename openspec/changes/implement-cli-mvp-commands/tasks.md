## 1. Set Up CLI Infrastructure

- [ ] 1.1 Create `src/cli/commands/` directory structure
- [ ] 1.2 Create `src/cli/utils/` directory
- [ ] 1.3 Create `src/cli/utils/output.ts` for JSON/table formatting
- [ ] 1.4 Create `src/cli/utils/errors.ts` for CLI error handling
- [ ] 1.5 Create `src/cli/utils/flags.ts` for global flag definitions
- [ ] 1.6 Create `src/cli/utils/api.ts` for HTTP API client utilities
- [ ] 1.7 Create `src/cli/utils/health.ts` for health endpoint utilities
- [ ] 1.8 Create `src/cli/utils/formatters.ts` for table and display formatting

## 2. Refactor CLI Entry Point

- [ ] 2.1 Update `src/cli/index.ts` to use modular commands
- [ ] 2.2 Move command definitions to separate files
- [ ] 2.3 Implement global flag parsing (`--config`, `--json`, `--url`)
- [ ] 2.4 Add `--help` and `--version` handlers
- [ ] 2.5 Implement error handling middleware
- [ ] 2.6 Add exit code constants

## 3. Implement Start Command

- [ ] 3.1 Create `src/cli/commands/start.ts`
- [ ] 3.2 Implement `startGateway()` function
- [ ] 3.3 Connect to `createGateway()` from `src/index.ts`
- [ ] 3.4 Handle `--port` option
- [ ] 3.5 Handle `--config` option
- [ ] 3.6 Handle `--tui` option
- [ ] 3.7 Implement graceful shutdown (SIGINT, SIGTERM)
- [ ] 3.8 Add startup messages and status display
- [ ] 3.9 Handle config validation errors
- [ ] 3.10 Handle connection failures with warnings

## 4. Implement Status Command

- [ ] 4.1 Create `src/cli/commands/status.ts`
- [ ] 4.2 Implement status fetching from `/health` endpoint
- [ ] 4.3 Parse health response
- [ ] 4.4 Display human-readable status (gateway, servers, tools, uptime)
- [ ] 4.5 Implement `--json` output format
- [ ] 4.6 Handle gateway not running error
- [ ] 4.7 Handle connection timeout
- [ ] 4.8 Add unit tests for status formatting

## 5. Implement Tools Command

- [ ] 5.1 Create `src/cli/commands/tools.ts`
- [ ] 5.2 Implement tools fetching from registry via HTTP API
- [ ] 5.3 Display tools in table format
- [ ] 5.4 Implement `--json` output format
- [ ] 5.5 Implement `--server` filter option
- [ ] 5.6 Implement `--search` filter option
- [ ] 5.7 Handle gateway not running error
- [ ] 5.8 Add unit tests for tools formatting

## 6. Implement Servers Command

- [ ] 6.1 Create `src/cli/commands/servers.ts`
- [ ] 6.2 Implement server list fetching
- [ ] 6.3 Display servers in table format
- [ ] 6.4 Show: name, transport, status, tool count
- [ ] 6.5 Implement status color coding (green/red/yellow)
- [ ] 6.6 Implement `--json` output format
- [ ] 6.7 Implement `--status` filter option
- [ ] 6.8 Implement `--verbose` option for details
- [ ] 6.9 Add unit tests for servers formatting

## 7. Implement Health Command

- [ ] 7.1 Create `src/cli/commands/health.ts`
- [ ] 7.2 Implement detailed health fetching
- [ ] 7.3 Display health summary and per-server status
- [ ] 7.4 Display connection metrics
- [ ] 7.5 Implement `--json` output format
- [ ] 7.6 Implement `--verbose` option for detailed metrics
- [ ] 7.7 Handle health endpoint timeout
- [ ] 7.8 Add unit tests for health formatting

## 8. Implement Config Commands

- [ ] 8.1 Create `src/cli/commands/config.ts`
- [ ] 8.2 Implement `config validate` subcommand
- [ ] 8.3 Use existing config loader validation
- [ ] 8.4 Display validation errors with line numbers
- [ ] 8.5 Implement `config show` subcommand
- [ ] 8.6 Display config in readable format
- [ ] 8.7 Implement `--json` output format
- [ ] 8.8 Implement `--include-secrets` option
- [ ] 8.9 Redact sensitive fields by default
- [ ] 8.10 Add unit tests for config formatting

## 9. Implement Logs Command

- [ ] 9.1 Create `src/cli/commands/logs.ts`
- [ ] 9.2 Implement log file reading
- [ ] 9.3 Display logs in table format
- [ ] 9.4 Implement `--follow` option for real-time streaming
- [ ] 9.5 Implement `--level` filter option
- [ ] 9.6 Implement `--lines` limit option
- [ ] 9.7 Implement `--json` output format
- [ ] 9.8 Handle Ctrl+C to exit follow mode
- [ ] 9.9 Add unit tests for log formatting

## 10. Implement Output Utilities

- [ ] 10.1 Create `src/cli/utils/output.ts`
- [ ] 10.2 Implement table formatting for human output
- [ ] 10.3 Implement JSON serialization
- [ ] 10.4 Create helper for status indicators
- [ ] 10.5 Create helper for color coding
- [ ] 10.6 Handle truncation of long text
- [ ] 10.7 Add unit tests for output utilities

## 11. Implement Error Handling

- [ ] 11.1 Create `src/cli/utils/errors.ts`
- [ ] 11.2 Define `CliError` class with exit codes
- [ ] 11.3 Implement error handler middleware
- [ ] 11.4 Handle connection refused errors
- [ ] 11.5 Handle timeout errors
- [ ] 11.6 Handle validation errors
- [ ] 11.7 Implement error message formatting
- [ ] 11.8 Add unit tests for error handling

## 12. Update CLI Entry Point

- [ ] 12.1 Refactor `src/cli/index.ts` to import commands
- [ ] 12.2 Register all command handlers
- [ ] 12.3 Apply global flags to all commands
- [ ] 12.4 Ensure error handling wraps all commands
- [ ] 12.5 Test help output for all commands
- [ ] 12.6 Test version output

## 13. Add API Utilities

- [ ] 13.1 Create `src/cli/utils/api.ts`
- [ ] 13.2 Implement HTTP client for gateway API
- [ ] 13.3 Create `fetchTools()` function
- [ ] 13.4 Create `fetchServers()` function
- [ ] 13.5 Create `fetchPrompts()` function (for future use)
- [ ] 13.6 Create `fetchResources()` function (for future use)
- [ ] 13.7 Handle connection errors
- [ ] 13.8 Add timeout handling
- [ ] 13.9 Add unit tests for API utilities

## 14. Add Health Utilities

- [ ] 14.1 Create `src/cli/utils/health.ts`
- [ ] 14.2 Implement `fetchHealth()` function
- [ ] 14.3 Parse health response
- [ ] 14.4 Extract per-server health status
- [ ] 14.5 Calculate uptime
- [ ] 14.6 Add unit tests for health utilities

## 15. Add Formatter Utilities

- [ ] 15.1 Create `src/cli/utils/formatters.ts`
- [ ] 15.2 Implement table column alignment
- [ ] 15.3 Implement status indicator formatting
- [ ] 15.4 Implement timestamp formatting
- [ ] 15.5 Implement size formatting (bytes, KB, MB)
- [ ] 15.6 Implement color codes for terminals
- [ ] 15.7 Add unit tests for formatters

## 16. Integration Testing

- [ ] 16.1 Create `tests/integration/cli/start.test.ts`
- [ ] 16.2 Create `tests/integration/cli/status.test.ts`
- [ ] 16.3 Create `tests/integration/cli/tools.test.ts`
- [ ] 16.4 Create `tests/integration/cli/servers.test.ts`
- [ ] 16.5 Create `tests/integration/cli/health.test.ts`
- [ ] 16.6 Create `tests/integration/cli/config.test.ts`
- [ ] 16.7 Create `tests/integration/cli/logs.test.ts`
- [ ] 16.8 Test all commands with `--json` flag
- [ ] 16.9 Test error handling and exit codes
- [ ] 16.10 Test global flag combinations

## 17. Unit Testing

- [ ] 17.1 Create `tests/unit/cli/utils/output.test.ts`
- [ ] 17.2 Create `tests/unit/cli/utils/errors.test.ts`
- [ ] 17.3 Create `tests/unit/cli/utils/formatters.test.ts`
- [ ] 17.4 Create `tests/unit/cli/utils/api.test.ts`
- [ ] 17.5 Create `tests/unit/cli/utils/health.test.ts`
- [ ] 17.6 Create `tests/unit/cli/commands/start.test.ts`
- [ ] 17.7 Create `tests/unit/cli/commands/status.test.ts`
- [ ] 17.8 Create `tests/unit/cli/commands/tools.test.ts`

## 18. Documentation

- [ ] 18.1 Update `README.md` with CLI commands section
- [ ] 18.2 Document all CLI commands with examples
- [ ] 18.3 Document global flags (`--config`, `--json`, `--url`)
- [ ] 18.4 Document exit codes
- [ ] 18.5 Add CLI usage examples
- [ ] 18.6 Update `AGENTS.md` with CLI development guidelines

## 19. Final Validation

- [ ] 19.1 Run full test suite
- [ ] 19.2 Run linting and formatting
- [ ] 19.3 Test all commands manually
- [ ] 19.4 Test error scenarios
- [ ] 19.5 Test JSON output for scripting
- [ ] 19.6 Verify all exit codes
- [ ] 19.7 Document any issues found
- [ ] 19.8 Archive change with `openspec-archive-change`

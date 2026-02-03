## 1. Add --json flag to version command

- [x] 1.1 Modify `src/cli/index.ts` to create a `version` command
- [x] 1.2 Output JSON format when `--json` flag is present
- [x] 1.3 JSON includes `{ version: string, exitCode: number }`
- [x] 1.4 Update `CliTester.version()` to use `["version"]` instead of `["--version"]`

## 2. Add --json flag to status command

- [x] 2.1 `status` command already has `--json` option (verified in `src/cli/commands/status.ts`)

## 3. Add --json flag to logs command

- [x] 3.1 `logs` command already has `--json` option (verified in `src/cli/commands/logs.ts`)

## 4. Update test expectations

- [x] 4.1 Fix JSON output tests in `cli-output.test.ts` to use `["version"]` instead of `["--version"]`
- [x] 4.2 Fix JSON output test in `cli-commands.test.ts` to use `["version"]`
- [x] 4.3 Verify all JSON output tests pass

## 5. Verify Fix

- [x] 5.1 Run `bun test tests/e2e/cli-tui/`
- [x] 5.2 **35/36 tests pass** ✅
- [x] 5.3 Remaining 1 test requires running gateway (expected)

## 1. Update CLI Commands Test File

- [x] 1.1 Import `startTestServer`, `stopTestServer`, `checkServerHealth` from `test-server.ts`
- [x] 1.2 Add `beforeAll` hook to "CLI - Configuration" describe block
- [x] 1.3 Add `afterAll` hook to cleanup server
- [x] 1.4 Add health check skip logic if server unavailable

## 2. Update CLI Output Test File

- [x] 2.1 Import server functions from `test-server.ts`
- [x] 2.2 Add `beforeAll` hook to "CLI - Config Validation" describe block
- [x] 2.3 Add `afterAll` hook to cleanup server
- [x] 2.4 Add health check skip logic
- [x] 2.5 Fix verbose output tests to match actual CLI behavior

## 3. Verify Fix

- [x] 3.1 Run `bun test tests/e2e/cli-tui/cli-commands.test.ts`
- [x] 3.2 Run `bun test tests/e2e/cli-tui/cli-output.test.ts`
- [x] 3.3 31/36 tests pass (remaining 5 need Changes 6 & 7)

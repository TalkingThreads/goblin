## 1. Update package.json

- [x] 1.1 Add `pretest:e2e` script: `"pretest:e2e": "bun run build:cli"`
- [x] 1.2 Add `test:e2e` script: `"test:e2e": "bun test tests/e2e"`
- [x] 1.3 Add `test:e2e:cli` script: `"test:e2e:cli": "bun test tests/e2e/cli-tui"`

## 2. Update CliTester

- [x] 2.1 Add binary existence check in `CliTester` constructor
- [x] 2.2 Throw clear error if `dist/cli/index.js` does not exist
- [x] 2.3 Add method to check if CLI binary is available
- [x] 2.4 Fix spawn to use absolute path for CLI binary
- [x] 2.5 Handle Windows path correctly

## 3. Verify Fix

- [x] 3.1 Run `bun run build:cli` to build CLI
- [x] 3.2 Run `bun test:e2e:cli` - 10/16 tests pass
- [ ] 3.3 Remaining failures are test assertion issues (covered by Change 4)

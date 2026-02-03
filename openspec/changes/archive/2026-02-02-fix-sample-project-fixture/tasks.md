## 1. Fix fixtures.ts

- [x] 1.1 Import `dirname` from `node:path`
- [x] 1.2 Use `path.dirname()` instead of string manipulation for cross-platform paths
- [x] 1.3 Fix `createSampleProject` to create parent directories correctly
- [x] 1.4 Remove incorrect path logic (`relativePath.includes("/")`)

## 2. Update Test Expectations

- [x] 2.1 Fix "can read project files" test to look in `projectDir/simple-node/`
- [x] 2.2 Fix "project structure is correct" test to check correct paths

## 3. Verify Fix

- [x] 3.1 Run `bun test tests/e2e/cli-tui/cli-commands.test.ts`
- [x] 3.2 Confirm "can read project files" test passes
- [x] 3.3 Confirm "project structure is correct" test passes

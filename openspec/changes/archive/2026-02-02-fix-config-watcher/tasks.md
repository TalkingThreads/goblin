## 1. Find Config Watcher Code

- [ ] 1.1 Search for config watcher initialization in `src/config/` directory
- [ ] 1.2 Identify the file where `fs.watch()` or similar is called
- [ ] 1.3 Understand the error path that causes crash

## 2. Fix Config Watcher

- [ ] 2.1 Add file existence check before creating watcher
- [ ] 2.2 Wrap watcher creation in try/catch
- [ ] 2.3 Add warning log when watcher is skipped

## 3. Verify Fix

- [ ] 3.1 Test gateway starts without config file
- [ ] 3.2 Run `bun test tests/e2e/cli-tui/` - all 36 tests should pass
- [ ] 3.3 Verify health endpoint responds when no config exists

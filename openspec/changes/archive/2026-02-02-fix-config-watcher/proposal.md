## Why

The gateway server fails to start with `ENOENT: no such file or directory, watch 'config.json'` when the config file doesn't exist. The config watcher is initialized before checking if the config file exists, causing the server to crash on startup instead of continuing with default configuration or creating an empty config.

## What Changes

- Fix config watcher initialization to check if config file exists before watching
- Create empty config file if it doesn't exist and user hasn't provided one
- Provide graceful fallback when config watcher fails (continue without hot reload)
- Log warning instead of crashing when config file is missing

## Capabilities

### New Capabilities
- `config-graceful-degradation`: Gateway continues running even if config file is missing or unwatchable

### Modified Capabilities
None - this is a bug fix without spec-level changes.

## Impact

- **Affected File**: `src/config/loader.ts` (likely location of config watcher initialization)
- **Affected Tests**: 1 E2E CLI test (`config show --json`) that requires running gateway
- **Risk**: Low - defensive coding to handle missing config files
- **User Experience**: Gateway starts successfully even without config file

## Why

The CLI module currently uses `console.log` statements instead of the project's structured logging system (pino). This breaks observability consistency and makes log filtering/parsing impossible for CLI operations.

## What Changes

- Replace 3 `console.log` calls with `logger.info()` calls in `src/cli/index.ts`
- Use structured context objects for any dynamic values
- Remove the TODO comment above `startGateway` since it will now be properly logged

## Capabilities

### New Capabilities
- `cli-logging`: Standardizes CLI output to use structured pino logging

### Modified Capabilities
- None - this is an internal refactor with no behavioral changes

## Impact

- `src/cli/index.ts`: Replace console.log with logger.info calls
- No impact on MCP protocol, config schema, or existing specs

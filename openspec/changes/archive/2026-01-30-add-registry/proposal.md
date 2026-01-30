# Change: Add Tool Registry

## Why

Goblin needs a central registry to track all available tools from connected backend servers. This registry enables tool discovery, routing, and aliasing across the aggregated mesh of MCP servers.

## What Changes

- Implement `Registry` class to manage tool metadata
- Support adding/removing servers and syncing their tools
- Implement tool aliasing (renaming backend tools)
- Provide query API for compact tool cards (name, description) vs full schemas
- Handle pagination when fetching tools from backends

## Impact

- **Affected specs**: New capability `registry`
- **Affected code**:
  - `src/gateway/registry.ts`
  - `src/gateway/types.ts`
  - `src/index.ts` (integration)

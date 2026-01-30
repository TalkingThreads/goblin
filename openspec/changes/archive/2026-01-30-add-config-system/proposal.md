# Change: Add Configuration System

## Why

Goblin needs a robust configuration system to:
- Define backend MCP servers and their connection details
- Configure gateway behavior (port, host, policies)
- Support hot reload for operational flexibility
- Provide type-safe config with validation
- Enable editor autocomplete via JSON Schema

## What Changes

- Zod schema for complete configuration structure
- Config loader with atomic validation
- Hot reload with file watching and rollback
- JSON Schema generation for VSCode support
- Standard OS-specific config file location

## Impact

- **Affected specs**: New capability `config`
- **Affected code**: 
  - `src/config/schema.ts` - Zod schemas
  - `src/config/loader.ts` - Config loading and validation
  - `src/config/watcher.ts` - File watching and hot reload
  - `src/config/types.ts` - TypeScript types
  - `src/config/paths.ts` - Config file location resolution
- **New dependencies**: `zod-to-json-schema`, `env-paths`

# Technical Design: CLI Help Command Fix

## Overview

Add an explicit `help` command to the CLI that displays help information without requiring arguments parsing quirks.

## Current Implementation

```typescript
// src/cli/index.ts
// No help command defined, using default Commander.js behavior
```

## Proposed Solution

Add an explicit `help` command that calls `program.help()`:

```typescript
program
  .command("help")
  .description("Show help information")
  .action(() => {
    program.help();
  });
```

This allows:
- `goblin help` - Shows help for all commands
- Exit code 0
- No server required

## Implementation

Add the help command before `program.parse()`:

```typescript
program
  .command("help")
  .description("Show help information")
  .action(() => {
    program.help();
  });

program.parse();
```

## Files to Modify

1. **src/cli/index.ts** - Add the help command definition

## Testing

Verify:
- `node dist/cli/index.js help` returns exit code 0
- Output contains all commands (start, status, tools, servers, config, logs, health, stop)
- Output does not contain "No server running"

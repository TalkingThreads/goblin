# Fix CLI Help Command to Work Standalone

## Problem Statement

The CLI `help` command fails with "too many arguments" error when invoked as `goblin help`. This command should work without a running gateway server, similar to `goblin --help` or `goblin version`.

## Root Cause Analysis

The Commander.js library parses "help" as a command argument rather than a command. When using `program.parse(["help"])`, Commander.js expects 0 arguments but receives 1.

## Solution Overview

Add an explicit `help` command to the CLI that displays help information without requiring a running gateway.

## Success Criteria

- [ ] `goblin help` command executes successfully
- [ ] Help output contains all commands (start, status, tools, servers, etc.)
- [ ] Exit code is 0
- [ ] No server running required

## Related Files

- `src/cli/index.ts` - CLI entry point with command definitions

## References

- `goblin --help` works correctly
- `goblin version` works correctly

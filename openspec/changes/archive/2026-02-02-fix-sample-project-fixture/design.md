## Context

The `createSampleProject` function creates a temporary project structure for CLI integration tests. Currently, it fails on Windows because:
1. Forward slashes in paths don't automatically create parent directories
2. `writeFileSync` requires parent directories to exist

## Goals / Non-Goals

**Goals:**
- Fix cross-platform path handling
- Ensure parent directories are created before writing files

**Non-Goals:**
- No changes to test structure or assertions
- No new features

## Decisions

**Decision 1**: Use `mkdirSync` with `recursive: true`

**Rationale**: Node.js `fs.mkdirSync` with `recursive: true` creates all parent directories automatically.

**Decision 2**: Use `path.join` for cross-platform paths

**Rationale**: `path.join` normalizes path separators for the current OS.

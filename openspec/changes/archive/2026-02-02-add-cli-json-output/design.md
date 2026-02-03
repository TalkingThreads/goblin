## Context

CLI tests expect `--json` flag support for `version`, `status`, and `logs` commands, but current implementation only supports text output.

## Goals / Non-Goals

**Goals:**
- Add `--json` flag to version, status, logs commands
- Commands output valid JSON when `--json` is passed

**Non-Goals:**
- No changes to other CLI commands
- No changes to test infrastructure

## Decisions

**Decision 1**: Use consistent JSON structure for all commands

**Rationale**: Users expect consistent output format across commands.

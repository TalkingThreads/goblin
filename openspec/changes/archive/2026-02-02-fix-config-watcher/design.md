## Context

The gateway crashes on startup with `ENOENT: no such file or directory, watch 'config.json'` when the config file doesn't exist. This happens because the config watcher is initialized unconditionally without checking if the file exists first.

## Goals / Non-Goals

**Goals:**
- Gateway starts successfully even without config file
- Config watcher only watches when config file exists
- Graceful fallback to default configuration

**Non-Goals:**
- No changes to config schema or validation
- No changes to CLI commands
- No automatic config creation (user must provide config if needed)

## Decisions

**Decision 1**: Check file existence before creating watcher

**Rationale**: The simplest fix - wrap watcher creation in file existence check.

**Decision 2**: Log warning instead of crashing

**Rationale**: If file doesn't exist or can't be watched, log a warning and continue. Hot reload is a convenience feature, not a requirement.

**Alternatives Considered**:
- Create empty config file → Rejected: May overwrite user intentions
- Fail fast with clear error → Rejected: Bad UX for zero-config usage

## Risks / Trade-offs

[Risk] User expects config changes to reload → Mitigation: Log when config watcher is inactive
[Risk] Silent failure if config path is wrong → Mitigation: Warn about missing config file

## Context

The CLI module (`src/cli/index.ts`) imports the pino logger but uses `console.log` for output. This creates inconsistent observability—CLI operations won't appear in structured logs, making debugging and log aggregation impossible.

## Goals / Non-Goals

**Goals:**
- Replace all `console.log` calls with structured `logger.info()` calls
- Use pino's structured logging context for any dynamic values
- Maintain CLI usability by preserving output visibility

**Non-Goals:**
- No changes to logging levels (stay at `info` level)
- No new CLI commands or features
- No changes to TUI mode implementation

## Decisions

### Decision: Use existing logger instance

The CLI already imports and instantiates a pino logger with component name "cli". We'll use this same instance for all logging.

**Rationale:**
- Consistent with project observability patterns
- Logger is already configured with proper level and formatting
- No additional dependency or configuration needed

**Alternatives considered:**
- Create inline `console` wrapper: Rejected—defeats the purpose of structured logging

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Logger not initialized when CLI runs early | Logger is sync, safe to use from module load |

No significant trade-offs—this is a straightforward refactor.

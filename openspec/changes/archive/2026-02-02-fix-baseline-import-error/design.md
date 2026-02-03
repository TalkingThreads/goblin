# Fix Baseline Import Error - Design

## Context

The `BaselineManager` class in `tests/performance/shared/baseline-manager.ts` provides performance test infrastructure for storing and comparing benchmark results. It currently has an incorrect import statement that causes a syntax error at runtime.

## Goals / Non-Goals

**Goals:**
- Fix the import error to enable baseline storage tests
- No changes to functionality or behavior

**Non-Goals:**
- No refactoring of baseline manager logic
- No changes to test assertions or expectations

## Decisions

**Decision**: Split the fs imports into synchronous and asynchronous modules

**Rationale**: Node.js `fs` module has two separate exports:
- `node:fs` - Synchronous functions (`existsSync`, `readFileSync`, etc.)
- `node:fs/promises` - Async/await functions (`readFile`, `writeFile`, etc.)

The `existsSync` function is synchronous and only available in `node:fs`. This is not a but a hard requirement.

**Alternatives Considered**:
 style preference1. Use `fs/promises` async `stat()` to check file existence → Rejected: Changes behavior and adds complexity
2. Remove file existence checks entirely → Rejected: Would break existing functionality

## Risks / Trade-offs

No significant risks. This is a one-line mechanical fix.

## Migration Plan

1. Apply the import fix to `baseline-manager.ts`
2. Run `bun test tests/performance/baseline` to verify tests pass
3. No rollback needed - the change is reversible by reverting the import line

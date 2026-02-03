# Add CLI Build to Test Scripts - Design

## Context

The E2E CLI tests use `CliTester` which spawns `node dist/cli/index.js` as the goblin CLI binary. However, this file doesn't exist because the CLI has never been built. The tests are getting Bun's help output instead of goblin's help.

## Goals / Non-Goals

**Goals:**
- Ensure CLI binary exists before running E2E CLI tests
- Provide clear error if binary is missing
- Minimal impact on test execution time

**Non-Goals:**
- No changes to CLI implementation
- No changes to test assertions

## Decisions

**Decision 1**: Add `pretest:e2e` script to build CLI

**Rationale**: Bun supports pre- scripts (e.g., `pretest`) that run before the main script. This is the idiomatic approach.

**Decision 2**: Modify `CliTester` to check binary existence

**Rationale**: Defense in depth - if build step is missed, tests fail fast with clear message instead of confusing output.

**Alternatives Considered**:
- Use `bun run src/cli/index.ts` directly → Rejected: Slower, doesn't test production build
- Skip tests if binary missing → Recluded: Tests should run in CI without manual setup

## Risks / Trade-offs

[Risk] Build step adds time → Mitigation: CLI builds in ~5 seconds
[Risk] Build failures block tests → Mitigation: Clear error messages

## Migration Plan

1. Add scripts to package.json
2. Update CliTester with existence check
3. Verify tests pass

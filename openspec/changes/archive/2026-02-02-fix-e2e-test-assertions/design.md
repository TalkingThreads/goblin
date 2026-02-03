# Fix E2E Test Assertions - Design

## Context

Multiple E2E tests are failing with incorrect assertions:
- Workflow duration returns 0 instead of actual time
- Error injector triggers wrong rules or doesn't trigger at all
- maxErrors limit doesn't work correctly

## Goals / Non-Goals

**Goals:**
- Fix workflow duration tracking
- Fix error injector triggering logic
- Fix maxErrors counting
- All affected tests pass

**Non-Goals:**
- No changes to production code
- No refactoring of test infrastructure beyond fixes

## Decisions

**Decision 1**: Fix workflow simulator duration

**Hypothesis**: `Date.now()` is called at start/end but values not stored correctly.

**Decision 2**: Fix error injector condition evaluation

**Hypothesis**: `condition()` functions return `false` when they should return `true`.

**Decision 3**: Fix maxErrors counter

**Hypothesis**: Counter decrements incorrectly or condition doesn't check limit.

## Risks / Trade-offs

[Risk] Fixing one test breaks others → Mitigation: Run all E2E tests after changes
[Risk] Test behavior expectations wrong → Mitigation: Review test assertions against actual behavior

## Open Questions

- Is the error injector meant to be synchronous or async?
- Should maxErrors apply per-rule or globally?
- What is the expected workflow duration calculation?

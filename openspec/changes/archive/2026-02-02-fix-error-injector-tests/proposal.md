# Fix Error Injector Tests

## Problem Statement

Multiple E2E error injector tests are failing in `tests/e2e/errors/timeout.test.ts`. The error injector's behavior does not match expected test scenarios.

## Failing Tests

1. **"maxErrors limit prevents excessive errors"** - Expected error count 2, got 1
2. **"chained operations with conditional errors"** - Validation errors not working properly

## Root Cause Analysis

Issues identified in `tests/e2e/shared/error-injector.ts`:

1. **maxErrors logic error**: The condition `this.errorCount >= this.config.maxErrors` prevents injecting errors when count equals maxErrors. It should allow injection up to and including maxErrors, then stop.

2. **Chained operation handling**: When an operation throws an error, the injector's behavior is inconsistent. The test expects:
   - First call to fail due to error rule
   - Second call to succeed after rule is consumed (once: true)
   - But current implementation may not properly handle the retry scenario

3. **Error counting**: The `getErrorCount()` returns the count of injected errors, but tests expect it to count actual thrown errors from the operation, not just injected ones.

## Solution Overview

1. **Fix maxErrors logic**: Change condition to `this.errorCount > this.config.maxErrors` to allow exactly maxErrors injections
2. **Improve chained operation support**: Ensure `once: true` rules are properly removed after first trigger
3. **Clarify error counting**: Document whether count is injected errors or caught errors
4. **Test fixes**: Update test expectations if the behavior is actually correct but tests are wrong

## Success Criteria

- [ ] "maxErrors limit prevents excessive errors" test passes with correct count
- [ ] "chained operations with conditional errors" test passes
- [ ] All timeout.test.ts tests pass
- [ ] Error injector behavior is consistent and well-documented

## Related Files

- `tests/e2e/shared/error-injector.ts` - Error injector implementation
- `tests/e2e/errors/timeout.test.ts` - Failing tests

## References

- ErrorRule interface with `once?: boolean` property
- ErrorInjector.inject() method that triggers errors

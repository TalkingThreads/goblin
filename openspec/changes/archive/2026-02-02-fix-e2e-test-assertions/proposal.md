# Fix E2E Test Assertions

## Why

Multiple E2E tests are failing due to incorrect test assertions and mock implementations:
- Agent workflow tests expect `duration > 0` but get `0`
- Error injector tests expect errors to be triggered but they aren't
- Error injector `maxErrors` limit not working correctly (count shows 1 instead of 2)

## What Changes

- Fix `tests/e2e/agent-workflows/basic.test.ts`: Ensure workflow duration is tracked correctly
- Fix `tests/e2e/shared/error-injector.ts`: Correct error triggering logic and maxErrors counting
- Fix `tests/e2e/errors/invalid-requests.test.ts`: Correct error assertion expectations
- Fix `tests/e2e/errors/timeout.test.ts`: Correct timeout and maxErrors assertions

## Capabilities

### New Capabilities
None - this is fixing existing test implementations.

### Modified Capabilities
None - no behavior changes, only test assertion corrections.

## Impact

- **Affected Files**: 4 test files + 1 shared utility
- **Affected Tests**: ~15 E2E tests
- **Risk**: Medium - changes to test utilities may affect multiple tests
- **Investigation Required**: Error injector logic needs deeper analysis

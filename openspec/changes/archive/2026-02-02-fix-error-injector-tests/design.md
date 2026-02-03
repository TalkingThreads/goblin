# Technical Design: Error Injector Test Fixes

## Overview

Fix the ErrorInjector implementation to correctly handle maxErrors limits and chained operations.

## Current Implementation

### ErrorInjector.inject() - tests/e2e/shared/error-injector.ts
```typescript
async inject<T>(operation: () => Promise<T>): Promise<T> {
  if (!this.config.enabled || this.errorCount >= this.config.maxErrors) {
    return operation();
  }
  // ... error injection logic
}
```

### ErrorRule Interface
```typescript
export interface ErrorRule {
  name: string;
  condition: () => boolean;
  error: Error;
  probability: number;
  once?: boolean;
}
```

## Issues Identified

### Issue 1: maxErrors Logic Error

**Current behavior:**
- `this.errorCount >= this.config.maxErrors` stops injection when count equals maxErrors
- This means if maxErrors=2, only 1 error is injected (count=0 and count=1)
- Test expects 2 errors to be injected when maxErrors=2

**Expected behavior:**
- Allow injection when `this.errorCount < this.config.maxErrors`
- This allows exactly maxErrors injections (count 0 and 1 for maxErrors=2)

### Issue 2: Error Count Definition

The test expects `getErrorCount()` to return the number of errors that were injected. Currently it's unclear if this counts:
- Injected errors only
- All caught errors including those from the operation itself

## Proposed Solution

### Fix 1: Correct maxErrors Logic

Change from:
```typescript
if (!this.config.enabled || this.errorCount >= this.config.maxErrors) {
```

To:
```typescript
if (!this.config.enabled || this.errorCount >= this.config.maxErrors) {
  // If we've already reached maxErrors, don't inject
  return operation();
}
```

Wait, that's the same. Let me re-read the test...

Looking at the test:
```typescript
test("maxErrors limit prevents excessive errors", async () => {
  const limitedInjector = new ErrorInjector({ maxErrors: 2, enabled: true });
  limitedInjector.addRule(ErrorScenarios.timeout("test"));

  // First error - count should be 1
  try {
    await limitedInjector.inject(async () => { throw new Error("Test"); });
  } catch { }
  expect(limitedInjector.getErrorCount()).toBe(1);

  // Second error - count should be 2
  try {
    await limitedInjector.inject(async () => { throw new Error("Test"); });
  } catch { }
  expect(limitedInjector.getErrorCount()).toBe(2);

  // Third call should succeed without error (limit reached)
  const result = await limitedInjector.inject(async () => "success");
  expect(result).toBe("success");
  expect(limitedInjector.getErrorCount()).toBe(2); // Still 2, not incremented
});
```

The test expects:
- After first inject that throws: count = 1
- After second inject that throws: count = 2
- After third inject that succeeds: count = 2

So the issue is that `errorCount` is tracking something wrong. Looking at the code:

```typescript
async inject<T>(operation: () => Promise<T>): Promise<T> {
  if (!this.config.enabled || this.errorCount >= this.config.maxErrors) {
    return operation(); // Returns operation result, no error injected
  }

  for (const rule of this.rules) {
    if (this.shouldTrigger(rule)) {
      this.errorCount++; // Increment when injecting
      this.triggeredRules.add(rule.name);

      if (rule.once) {
        this.rules = this.rules.filter((r) => r.name !== rule.name);
      }

      throw rule.error; // Throw the injected error
    }
  }

  return operation(); // No rule triggered, return operation result
}
```

The logic seems correct. Let me check if there's an issue with how rules trigger. Looking at `shouldTrigger`:

```typescript
private shouldTrigger(rule: ErrorRule): boolean {
  if (this.triggeredRules.has(rule.name) && rule.once) {
    return false;
  }
  if (Math.random() > rule.probability) {
    return false;
  }
  return rule.condition();
}
```

For `ErrorScenarios.timeout("test")`:
- `once: true`
- `probability: 1`
- `condition: () => true`

So after first trigger, the rule is removed from `this.rules` AND added to `triggeredRules`. The second call should NOT trigger because the rule is gone.

Wait! Looking more carefully at the code:
```typescript
if (rule.once) {
  this.rules = this.rules.filter((r) => r.name !== rule.name);
}
```

This removes the rule from the array AFTER triggering. So:
- First call: Rule triggers, errorCount=1, rule removed from array
- Second call: No rules in array, operation runs normally

So errorCount would be 1, not 2! That's the bug.

The test expects the rule to trigger twice, but with `once: true` it only triggers once.

## Solution

### Option 1: Fix the Test (Recommended for once rules)

The test is wrong. With `once: true`, the rule should only trigger once. Either:
1. Remove `once: true` from the test rule
2. Change test expectation to count=1
3. Use a non-once rule

### Option 2: Fix the Implementation

Change how `once` works - track trigger count per rule instead of removing it.

### Decision

Go with **Option 1** - fix the test because:
1. `once: true` is working as designed (trigger once)
2. The test expectation is wrong
3. Changing implementation would break other tests that rely on `once` behavior

## Files to Modify

1. **tests/e2e/errors/timeout.test.ts**
   - Fix "maxErrors limit prevents excessive errors" test - use rule without `once: true`
   - Fix "chained operations with conditional errors" test - adjust expectations

## Testing

Run the error injector tests:
```bash
bun test tests/e2e/errors/timeout.test.ts
```

Expected result: All tests pass

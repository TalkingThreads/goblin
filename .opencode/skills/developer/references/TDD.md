# Test-Driven Development (TDD) Reference

## The TDD Cycle

Test-Driven Development follows a strict red-green-refactor cycle:

### 1. Red: Write a Failing Test

- Write a test that defines the behavior you want
- The test should fail (proving the feature doesn't exist)
- Focus on one small behavior at a time
- Name the test descriptively (it should read like documentation)

**Example**:
```typescript
// Test first
it("should return sum of two numbers", () => {
  expect(add(2, 3)).toBe(5);
});
```

### 2. Green: Write Minimal Code to Pass

- Write the simplest code that makes the test pass
- Don't worry about perfection—just make it work
- It's okay to be "clever" or hardcode if needed (you'll refactor)
- All tests should pass after this step

**Example**:
```typescript
// Minimal implementation
function add(a: number, b: number): number {
  return a + b; // Or even: return 5; for the first test!
}
```

### 3. Refactor: Clean Up

- Improve the code without changing behavior
- All tests must still pass
- Look for:
  - Duplication to remove
  - Better names
  - Simpler expressions
  - Dead code

**Refactoring example**:
```typescript
// After adding more tests, you might refactor:
function add(...numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0);
}
```

## TDD Benefits

1. **Design pressure**: Tests force you to think about design first
2. **Confidence**: You know when you've met requirements
3. **Documentation**: Tests describe what the code should do
4. **Regression safety**: Changes are less scary with test coverage
5. **Debugging**: Tests isolate problems quickly

## TDD Anti-Patterns

### The Mockery
Over-mocking makes tests brittle and implementation-dependent.

**Bad**:
```typescript
// Testing implementation details
expect(mockDatabase.query).toHaveBeenCalledWith(
  "SELECT * FROM users WHERE id = ?",
  [userId]
);
```

**Better**:
```typescript
// Testing behavior
const user = await repository.findById(userId);
expect(user).toEqual(expectedUser);
```

### The False Positive
Tests that pass but don't verify anything meaningful.

**Bad**:
```typescript
it("should work", async () => {
  await service.doSomething(); // No assertion!
});
```

### The Giant Test
One test that tries to verify everything.

**Bad**:
```typescript
it("should handle all user operations", () => {
  // 100 lines of setup
  // 50 lines of execution
  // 30 assertions
});
```

**Better**: Split into focused tests:
```typescript
it("should create user with valid data", () => {...});
it("should reject user with invalid email", () => {...});
it("should hash password on creation", () => {...});
```

## When NOT to Use TDD

- Spikes/prototypes (throwaway code)
- UI-heavy work (use visual testing instead)
- When learning a new API (explore first, then test)
- Configuration/deployment code

## TDD Variants

### London School (Mockist)
- Heavy use of mocks
- Test interactions between objects
- Good for complex object graphs

### Chicago School (Classicist)
- Minimal mocking
- Test state and outcomes
- Good for data-heavy operations

### ATDD (Acceptance TDD)
- Write acceptance tests first
- Tests from user perspective
- Often uses BDD-style Given/When/Then

## Tips for Effective TDD

1. **Start with the simplest case** (often the "happy path")
2. **Add edge cases one at a time**
3. **Watch test failure messages**—they should be clear
4. **Keep tests fast** (under 10ms each if possible)
5. **Test behavior, not implementation**
6. **Use tests to drive design**—if testing is hard, design is wrong
7. **Refactor aggressively**—but only when tests are green

## The TDD Mindset

> "If it's hard to test, it's hard to use. Fix the design."

> "A test is a specification. Write it clearly."

> "Tests are the safety net. Don't walk the tightrope without one."

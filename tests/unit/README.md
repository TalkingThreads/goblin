# Unit Tests

Unit tests verify individual components in isolation using Bun's test framework.

## Structure

```
tests/unit/
├── cli/           # CLI command tests
├── config/        # Configuration tests
├── gateway/       # Gateway component tests
├── observability/ # Logging and metrics tests
├── prompts/      # Prompt handler tests
├── resources/     # Resource handler tests
├── slashes/       # Slash command tests
├── transport/     # Transport layer tests
├── tui/          # TUI component tests
└── utils/        # Utility function tests
```

## Running

```bash
# Run all unit tests
bun test tests/unit/

# Run specific module
bun test tests/unit/config/
bun test tests/unit/gateway/

# Single file
bun test tests/unit/config/loader.test.ts
```

## Patterns

### Test Setup

```typescript
import { beforeEach, describe, expect, mock, test } from "bun:test";

describe("ComponentName", () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  test("should do something", () => {
    expect(instance.doSomething()).toBe("expected");
  });
});
```

### Mocking

Use Bun's built-in `mock` for function mocking:

```typescript
const mockFn = mock(() => "mocked value");
expect(mockFn()).toBe("mocked value");
```

### Async Tests

```typescript
test("async operation", async () => {
  const result = await instance.asyncMethod();
  expect(result).toBeDefined();
});
```

## Coverage

Unit tests should aim for high coverage of their respective modules. Run with coverage:

```bash
bun test tests/unit/ --coverage
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` for setup, `afterEach` for teardown when needed
3. **Descriptive Names**: Test names should describe what they're testing
4. **Single Assertion Focus**: Each test should verify one behavior
5. **No External Dependencies**: Unit tests should not require network or filesystem

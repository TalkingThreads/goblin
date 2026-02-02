# Unit Tests Specification: Registry

## Overview

This specification defines the unit tests required for the Goblin Registry component. The Registry is responsible for managing tools, resources, and prompts with support for namespaces, aliases, caching, and error handling. These tests ensure the Registry operates correctly under various scenarios including registration, aliasing, caching, namespace isolation, and error conditions.

## Test Categories

The Registry unit tests are organized into five main categories:

1. **Registration Tests** - Verify tool/resource/prompt registration behavior including duplicate handling and namespace isolation
2. **Aliasing Tests** - Validate tool alias creation and resolution including alias chains
3. **Caching Tests** - Ensure cache behavior including hits, misses, TTL enforcement, and manual invalidation
4. **Namespace Tests** - Confirm namespace isolation and cross-namespace operations
5. **Error Handling Tests** - Test registry error scenarios including non-existent tools and cleanup

## Test Framework

All tests shall be written using Bun's native testing framework as configured in the project. Tests shall follow the naming convention `*.test.ts` and be placed in the appropriate test directory structure. Each test file shall focus on a specific Registry functionality area.

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Registry } from "../../src/registry/index.js";
```

## Registration Tests

### Test: Register Tool with Unique Name

**File**: `tests/unit/registry/registration/unique-tool.test.ts`

**Purpose**: Verify that a tool registered with a unique name is properly stored and retrievable.

**Preconditions**:
- Registry instance is initialized
- No tool with the specified name exists in the registry

**Test Steps**:
1. Create a tool definition with a unique name
2. Register the tool using `registry.registerTool(toolDefinition)`
3. Verify the registration does not throw
4. Lookup the tool using `registry.lookupTool(toolName)`
5. Verify the returned tool matches the registered tool
6. Perform additional lookups to confirm persistence

**Assertions**:
- Registration succeeds without throwing
- Lookup returns a result
- Returned tool properties match registered tool
- Multiple lookups return consistent results

**Expected Behavior**:
```typescript
const tool = createTestTool("unique-tool", "A unique test tool");
const result = registry.registerTool(tool);
expect(result).toBeUndefined();

const retrieved = registry.lookupTool("unique-tool");
expect(retrieved).toBeDefined();
expect(retrieved.name).toBe("unique-tool");
```

### Test: Register Tool with Duplicate Name

**File**: `tests/unit/registry/registration/duplicate-tool.test.ts`

**Purpose**: Verify that registering a tool with a duplicate name throws DuplicateRegistrationError and preserves the original.

**Preconditions**:
- Registry instance is initialized
- A tool with a known name is already registered

**Test Steps**:
1. Register an initial tool with a specific name
2. Create a second tool with the same name but different properties
3. Attempt to register the duplicate tool
4. Catch the expected DuplicateRegistrationError
5. Verify the original tool remains unchanged
6. Verify error contains appropriate context

**Assertions**:
- DuplicateRegistrationError is thrown
- Error contains the conflicting name
- Original tool is retrievable with original properties
- Duplicate tool was not added

**Expected Behavior**:
```typescript
const originalTool = createTestTool("duplicate-tool", "Original description");
registry.registerTool(originalTool);

const duplicateTool = createTestTool("duplicate-tool", "New description");

expect(() => registry.registerTool(duplicateTool)).toThrow(
  DuplicateRegistrationError
);

const retrieved = registry.lookupTool("duplicate-tool");
expect(retrieved.description).toBe("Original description");
```

### Test: Register Tools from Multiple Namespaces

**File**: `tests/unit/registry/registration/multiple-namespaces.test.ts`

**Purpose**: Verify that tools from different namespaces are isolated and accessible via namespace-prefixed lookups.

**Preconditions**:
- Registry instance is initialized with namespace support
- Multiple namespace configurations exist

**Test Steps**:
1. Register a tool in namespace A with name "tool1"
2. Register a tool in namespace B with name "tool1"
3. Register a tool in default namespace with name "tool1"
4. Perform unprefixed lookup for "tool1"
5. Perform namespace-prefixed lookup for "A:tool1"
6. Perform namespace-prefixed lookup for "B:tool1"
7. Verify each lookup returns the correct tool

**Assertions**:
- Unprefixed lookup returns default namespace tool
- Namespace-prefixed lookup returns correct namespace tool
- Tools are isolated by namespace
- Cross-namespace lookups require explicit prefix

**Expected Behavior**:
```typescript
registry.registerTool(createTool("tool1", "Default"), "default");
registry.registerTool(createTool("tool1", "Namespace A"), "namespace-a");
registry.registerTool(createTool("tool1", "Namespace B"), "namespace-b");

const defaultResult = registry.lookupTool("tool1");
expect(defaultResult.description).toBe("Default");

const namespaceAResult = registry.lookupTool("namespace-a:tool1");
expect(namespaceAResult.description).toBe("Namespace A");
```

## Aliasing Tests

### Test: Create Alias for Tool

**File**: `tests/unit/registry/aliasing/create-alias.test.ts`

**Purpose**: Verify that an alias can be created for an existing tool and both alias and original name work.

**Preconditions**:
- Registry instance is initialized
- A tool is registered with a known name

**Test Steps**:
1. Register a tool with name "original-tool"
2. Create an alias "alias-name" pointing to "original-tool"
3. Lookup the tool using the alias name
4. Lookup the tool using the original name
5. Verify both lookups return the same tool

**Assertions**:
- Alias creation succeeds
- Alias lookup returns the tool
- Original tool lookup returns the same tool
- Tool is accessible via both names

**Expected Behavior**:
```typescript
const tool = registry.registerTool(createTool("original-tool", "Description"));
const alias = registry.createAlias("alias-name", "original-tool");

const aliasLookup = registry.lookupTool("alias-name");
const originalLookup = registry.lookupTool("original-tool");

expect(aliasLookup.name).toBe("original-tool");
expect(originalLookup.name).toBe("original-tool");
```

### Test: Resolve Alias Chain

**File**: `tests/unit/registry/aliasing/alias-chain.test.ts`

**Purpose**: Verify that chained aliases (A → B → C) resolve correctly to the final target.

**Preconditions**:
- Registry instance is initialized

**Test Steps**:
1. Register a tool "final-target"
2. Create alias "intermediate" pointing to "final-target"
3. Create alias "alias-a" pointing to "intermediate"
4. Lookup "alias-a"
5. Verify the returned tool is "final-target"

**Assertions**:
- Alias chain resolves to final target
- Intermediate aliases are transparent
- No infinite loops occur
- Resolution completes in reasonable time

**Expected Behavior**:
```typescript
registry.registerTool(createTool("final-target", "Final"));
registry.createAlias("intermediate", "final-target");
registry.createAlias("alias-a", "intermediate");

const resolved = registry.lookupTool("alias-a");
expect(resolved.name).toBe("final-target");
```

### Test: Alias to Non-existent Tool

**File**: `tests/unit/registry/aliasing/alias-target-not-found.test.ts`

**Purpose**: Verify that creating an alias to a non-existent tool throws AliasTargetNotFoundError.

**Preconditions**:
- Registry instance is initialized
- No tool with the target name exists

**Test Steps**:
1. Attempt to create an alias pointing to non-existent tool
2. Catch the AliasTargetNotFoundError
3. Verify error contains the invalid target name
4. Verify alias was not created

**Assertions**:
- AliasTargetNotFoundError is thrown
- Error contains the invalid target name
- Alias does not exist in registry

**Expected Behavior**:
```typescript
expect(() => registry.createAlias("my-alias", "non-existent")).toThrow(
  AliasTargetNotFoundError
);

const lookup = registry.lookupTool("my-alias");
expect(lookup).toBeUndefined();
```

## Caching Tests

### Test: Cache Hit Returns Cached Value

**File**: `tests/unit/registry/caching/cache-hit.test.ts`

**Purpose**: Verify that cached entries are returned on cache hits without querying the source.

**Preconditions**:
- Registry instance is initialized with caching enabled
- A tool has been registered and cached

**Test Steps**:
1. Register a tool
2. Perform initial lookup to populate cache
3. Record source query count
4. Perform second lookup
5. Verify source query count did not increase
6. Verify returned tool matches cached version

**Assertions**:
- Cache hit returns cached value
- Source is not queried on cache hit
- Returned value matches cached entry

**Expected Behavior**:
```typescript
const tool = registry.registerTool(createTool("cached-tool", "Description"));
registry.lookupTool("cached-tool");

const sourceQueriesBefore = getSourceQueryCount();
registry.lookupTool("cached-tool");
const sourceQueriesAfter = getSourceQueryCount();

expect(sourceQueriesBefore).toBe(sourceQueriesAfter);
```

### Test: Cache Miss Queries Source

**File**: `tests/unit/registry/caching/cache-miss.test.ts`

**Purpose**: Verify that cache misses trigger source queries and cache the result.

**Preconditions**:
- Registry instance is initialized with caching enabled
- A tool has been registered but not cached

**Test Steps**:
1. Register a tool
2. Clear the cache
3. Record source query count
4. Perform lookup
5. Verify source was queried
6. Verify result is now cached

**Assertions**:
- Cache miss queries the source
- Result is cached for future requests
- Subsequent lookup is a cache hit

**Expected Behavior**:
```typescript
registry.registerTool(createTool("miss-tool", "Description"));
registry.clearCache();

const sourceQueriesBefore = getSourceQueryCount();
registry.lookupTool("miss-tool");
const sourceQueriesAfter = getSourceQueryCount();

expect(sourceQueriesAfter).toBeGreaterThan(sourceQueriesBefore);
```

### Test: Cache Expiration After TTL

**File**: `tests/unit/registry/caching/cache-ttl.test.ts

**Purpose**: Verify that cached entries expire after TTL and trigger source re-query.

**Preconditions**:
- Registry instance is initialized with caching enabled
- TTL is set to a known short duration (e.g., 100ms)

**Test Steps**:
1. Register a tool
2. Perform lookup to populate cache
3. Wait for TTL to expire
4. Record source query count
5. Perform lookup
6. Verify source was queried again
7. Verify fresh value is returned

**Assertions**:
- Expired cache entry triggers source query
- Stale cache is not returned
- New cache entry is created

**Expected Behavior**:
```typescript
registry.registerTool(createTool("ttl-tool", "Description"));
registry.lookupTool("ttl-tool");

await sleep(TTL + 10);

const sourceQueriesBefore = getSourceQueryCount();
registry.lookupTool("ttl-tool");
const sourceQueriesAfter = getSourceQueryCount();

expect(sourceQueriesAfter).toBeGreaterThan(sourceQueriesBefore);
```

### Test: Manual Cache Invalidation

**File**: `tests/unit/registry/caching/manual-invalidation.test.ts

**Purpose**: Verify that manual cache invalidation removes specific entries without affecting others.

**Preconditions**:
- Registry instance is initialized with caching enabled
- Multiple tools are registered and cached

**Test Steps**:
1. Register tool A and tool B
2. Perform lookups to cache both tools
3. Invalidate cache for tool A only
4. Record source query counts
5. Lookup tool A and tool B
6. Verify tool A triggered source query
7. Verify tool B returned cached value

**Assertions**:
- Invalidated entry is removed from cache
- Other entries remain cached
- Only specified entry is refreshed

**Expected Behavior**:
```typescript
registry.registerTool(createTool("tool-a", "A"));
registry.registerTool(createTool("tool-b", "B"));

registry.lookupTool("tool-a");
registry.lookupTool("tool-b");
registry.invalidateCache("tool-a");

const aSourceQueries = getSourceQueryCountFor("tool-a");
const bSourceQueries = getSourceQueryCountFor("tool-b");

registry.lookupTool("tool-a");
registry.lookupTool("tool-b");

expect(getSourceQueryCountFor("tool-a")).toBeGreaterThan(aSourceQueries);
expect(getSourceQueryCountFor("tool-b")).toBe(bSourceQueries);
```

## Namespace Tests

### Test: List Tools in Specific Namespace

**File**: `tests/unit/registry/namespace/list-by-namespace.test.ts

**Purpose**: Verify that listing tools with a namespace filter returns only tools in that namespace.

**Preconditions**:
- Registry instance is initialized
- Tools are registered in multiple namespaces

**Test Steps**:
1. Register tools in namespace A: "tool-a1", "tool-a2"
2. Register tools in namespace B: "tool-b1", "tool-b2"
3. Register tools in default namespace: "default-tool"
4. List tools with namespace filter A
5. List tools with namespace filter B
6. List tools with no filter (all namespaces)

**Assertions**:
- Namespace A list contains only A tools
- Namespace B list contains only B tools
- Unfiltered list contains all tools
- Count matches expected values

**Expected Behavior**:
```typescript
const namespaceATools = registry.listTools({ namespace: "a" });
expect(namespaceATools.map(t => t.name)).toEqual(["tool-a1", "tool-a2"]);

const allTools = registry.listTools();
expect(allTools.length).toBe(5);
```

### Test: Cross-namespace Lookup

**File**: `tests/unit/registry/namespace/cross-namespace-lookup.test.ts

**Purpose**: Verify that namespace-prefixed lookups return the correct tool from the specified namespace.

**Preconditions**:
- Registry instance is initialized
- Same-named tools exist in multiple namespaces

**Test Steps**:
1. Register "shared-name" in namespace X
2. Register "shared-name" in namespace Y
3. Register "shared-name" in default namespace
4. Lookup "X:shared-name"
5. Lookup "Y:shared-name"
6. Lookup "shared-name" (no prefix)

**Assertions**:
- X:shared-name returns X namespace tool
- Y:shared-name returns Y namespace tool
- Unprefixed lookup returns default namespace tool
- Each result has correct namespace context

**Expected Behavior**:
```typescript
const xResult = registry.lookupTool("x:shared-name");
expect(xResult.namespace).toBe("x");

const defaultResult = registry.lookupTool("shared-name");
expect(defaultResult.namespace).toBeUndefined();
```

### Test: Empty Namespace Handling

**File**: `tests/unit/registry/namespace/empty-namespace.test.ts

**Purpose**: Verify that tools registered without explicit namespace are placed in default namespace.

**Preconditions**:
- Registry instance is initialized

**Test Steps**:
1. Register a tool without specifying namespace
2. List tools in default namespace
3. List tools with no filter
4. Lookup the tool with unprefixed name
5. Attempt to lookup with empty string namespace

**Assertions**:
- Tool appears in default namespace list
- Tool is retrievable without prefix
- Empty string namespace behaves as default

**Expected Behavior**:
```typescript
registry.registerTool(createTool("default-tool", "Description"));

const defaultTools = registry.listTools({ namespace: "" });
expect(defaultTools.map(t => t.name)).toContain("default-tool");

const result = registry.lookupTool("default-tool");
expect(result).toBeDefined();
```

## Error Handling Tests

### Test: Lookup Non-existent Tool

**File**: `tests/unit/registry/error/not-found.test.ts

**Purpose**: Verify that looking up a non-existent tool throws ToolNotFoundError with suggested alternatives.

**Preconditions**:
- Registry instance is initialized
- No tool with the specified name exists

**Test Steps**:
1. Attempt to lookup a non-existent tool
2. Catch the ToolNotFoundError
3. Verify error contains the requested name
4. Verify error contains suggested alternatives
5. Verify alternatives are similar tools

**Assertions**:
- ToolNotFoundError is thrown
- Error contains the requested tool name
- Error includes suggested alternatives
- Alternatives are relevant (similar names or namespace)

**Expected Behavior**:
```typescript
expect(() => registry.lookupTool("non-existent")).toThrow(
  ToolNotFoundError
);

try {
  registry.lookupTool("non-existent");
} catch (error) {
  expect(error.name).toBe("non-existent");
  expect(error.suggestions.length).toBeGreaterThan(0);
}
```

### Test: Unregister Tool with Active Subscriptions

**File**: `tests/unit/registry/error/tool-in-use.test.ts

**Purpose**: Verify that unregistering a tool with active subscriptions throws ToolInUseError.

**Preconditions**:
- Registry instance is initialized
- A tool is registered and has active subscriptions

**Test Steps**:
1. Register a tool
2. Create subscription(s) for the tool
3. Attempt to unregister the tool
4. Catch the ToolInUseError
5. Verify tool is still registered and functional

**Assertions**:
- ToolInUseError is thrown
- Error contains the tool name
- Error contains subscription count
- Tool remains registered

**Expected Behavior**:
```typescript
const tool = registry.registerTool(createTool("subscribed-tool", "Desc"));
registry.subscribe(tool.name, callback);

expect(() => registry.unregisterTool("subscribed-tool")).toThrow(
  ToolInUseError
);

const stillExists = registry.lookupTool("subscribed-tool");
expect(stillExists).toBeDefined();
```

### Test: Registry Shutdown Cleanup

**File**: `tests/unit/registry/error/shutdown-cleanup.test.ts

**Purpose**: Verify that registry shutdown properly unregisters all tools and releases resources.

**Preconditions**:
- Registry instance is initialized
- Multiple tools are registered
- Subscriptions may exist

**Test Steps**:
1. Register multiple tools
2. Create subscriptions for some tools
3. Initiate registry shutdown
4. Verify all tools are unregistered
5. Verify subscriptions are cleaned up
6. Verify subsequent lookups fail appropriately

**Assertions**:
- All tools are removed from registry
- All subscriptions are cancelled
- Resources are released
- Registry is in consistent shutdown state

**Expected Behavior**:
```typescript
registry.registerTool(createTool("tool1", "Desc"));
registry.registerTool(createTool("tool2", "Desc"));
registry.subscribe("tool1", callback);

await registry.shutdown();

const tools = registry.listTools();
expect(tools.length).toBe(0);
```

## Test Utilities

### Helper Functions

All test files shall use consistent helper functions for creating test fixtures:

```typescript
function createTestTool(name: string, description: string): ToolDefinition {
  return {
    name,
    description,
    inputSchema: { type: "object", properties: {} },
    handler: async () => {},
  };
}

function createRegistryWithMocks(): Registry {
  return new Registry({
    cache: new MockCache(),
    logger: new MockLogger(),
    namespaceConfig: defaultNamespaceConfig,
  });
}
```

### Mock Implementations

Test utilities shall include mock implementations for:

- **Cache** - In-memory cache with controllable TTL and invalidation
- **Logger** - Capture and assertion of log calls
- **Source** - Simulated source with configurable responses
- **SubscriptionManager** - Track subscription counts and cleanup

## Test Execution

### Running Individual Tests

```bash
# Run registration tests
bun test tests/unit/registry/registration/

# Run aliasing tests
bun test tests/unit/registry/aliasing/

# Run caching tests
bun test tests/unit/registry/caching/

# Run namespace tests
bun test tests/unit/registry/namespace/

# Run error handling tests
bun test tests/unit/registry/error/
```

### Running All Registry Tests

```bash
bun test tests/unit/registry/
```

## Coverage Requirements

All Registry unit tests shall achieve:

- **Branch Coverage**: Minimum 95%
- **Function Coverage**: Minimum 100%
- **Line Coverage**: Minimum 95%

Coverage reports shall be generated and reviewed for each test category.

## Test Data Management

### Fixture Files

Complex test fixtures may be stored in:

```
tests/fixtures/
  registry/
    tools.json          # Tool definitions for testing
    namespaces.yaml     # Namespace configurations
    aliases.yaml        # Alias chains for testing
```

### Randomized Testing

Where appropriate, tests shall use property-based testing with random inputs:

```typescript
import { fc, test } from "fast-check";

test("tool registration handles arbitrary names", async () => {
  await fc.assert(
    fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (name) => {
      const tool = createTestTool(name, "Test");
      const result = registry.registerTool(tool);
      expect(result).toBeDefined();
    })
  );
});
```

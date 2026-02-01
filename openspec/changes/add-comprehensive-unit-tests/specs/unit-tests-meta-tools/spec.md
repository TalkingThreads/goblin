# Meta-tools Unit Tests Specification

## Overview

This document defines the comprehensive unit test requirements for the meta-tools functionality in the Goblin MCP gateway. Meta-tools are tools that operate on other tools, including catalog management, invocation, validation, and error handling capabilities.

## Test Categories

### 1. Meta-tools Invocation Tests

Tests for tool invocation via meta-tools including successful invocations, parameter passing, and return value handling.

#### TC-MTI-001: Successful tool invocation

**Scenario:** Successful tool invocation with valid parameters

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool is invoked with valid parameters |
| **THEN** | The meta-tool SHALL execute the tool successfully |
| **AND** | Return the expected result |
| **AND** | Log the invocation appropriately |

**Test Requirements:**
- Mock target tool with predefined behavior
- Pass valid parameters matching tool schema
- Verify execution completes without errors
- Assert return value matches expected output
- Verify invocation is logged with appropriate level and context

**Expected Results:**
- Execution status: SUCCESS
- Return value: Matches tool's defined return type
- Logs: Info level with tool name, parameters (sanitized), duration

---

#### TC-MTI-002: Tool invocation with missing required parameters

**Scenario:** Tool invocation fails gracefully when required parameters are missing

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool is invoked without required parameters |
| **THEN** | The meta-tool SHALL return a validation error |
| **AND** | The error SHALL include which parameters are missing |

**Test Requirements:**
- Attempt invocation with incomplete parameter set
- Verify validation occurs before execution
- Assert error message identifies missing required parameters
- Confirm error type is ValidationError or ParameterError

**Expected Results:**
- Execution status: FAILURE
- Error type: ValidationError
- Error message: Lists missing required parameter names
- No tool execution occurs

---

#### TC-MTI-003: Tool invocation with invalid parameter types

**Scenario:** Type validation catches parameter type mismatches

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool is invoked with parameters of wrong type |
| **THEN** | The meta-tool SHALL return a type error |
| **AND** | The error SHALL indicate expected vs actual types |

**Test Requirements:**
- Pass parameters with incorrect types (e.g., string instead of number)
- Verify type checking occurs during validation
- Assert error message includes expected type and received type
- Confirm parameter name is included in error

**Expected Results:**
- Execution status: FAILURE
- Error type: TypeError or ValidationError
- Error message: Contains expected type, actual type, parameter name
- No tool execution occurs

---

### 2. Meta-tools Validation Tests

Tests for parameter validation logic including schema validation, type checking, and custom validators.

#### TC-MTV-001: Schema validation passes for valid input

**Scenario:** Valid input passes all schema validation rules

| Aspect | Details |
|--------|---------|
| **WHEN** | Input matches the tool's schema |
| **THEN** | Validation SHALL pass without errors |

**Test Requirements:**
- Provide input that conforms to tool's JSON schema
- Execute validation phase
- Assert no validation errors are returned
- Confirm validation completes quickly (performance requirement)

**Expected Results:**
- Validation status: PASS
- Errors array: Empty
- Processing continues to execution phase

---

#### TC-MTV-002: Schema validation fails for invalid input

**Scenario:** Invalid input fails validation with detailed error information

| Aspect | Details |
|--------|---------|
| **WHEN** | Input does not match the tool's schema |
| **THEN** | Validation SHALL fail with specific error details |
| **AND** | The error SHALL indicate which validation rule failed |

**Test Requirements:**
- Provide input violating schema constraints (e.g., missing required field, wrong format)
- Verify validation errors include schema path or pointer
- Assert error identifies specific rule that failed
- Test multiple failure scenarios (type, format, constraints, dependencies)

**Expected Results:**
- Validation status: FAIL
- Errors array: Contains one or more validation error objects
- Each error includes: path, rule violated, expected, received

---

#### TC-MTV-003: Custom validators execute correctly

**Scenario:** Custom validation rules are applied and results are combined

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool has custom validation rules |
| **THEN** | Each validator SHALL be executed |
| **AND** | Combined results SHALL be returned |

**Test Requirements:**
- Register tool with multiple custom validators
- Execute validation with inputs triggering validators
- Verify all validators are called (check execution order)
- Assert results from all validators are combined
- Test with validators that pass, fail, and have side effects

**Expected Results:**
- All custom validators are invoked
- Results include outcomes from each validator
- Errors from multiple validators are aggregated
- Execution order matches registration order

---

### 3. Meta-tools Catalog Tests

Tests for catalog listing, searching, and filtering operations.

#### TC-MTC-001: List all tools in catalog

**Scenario:** Catalog returns complete list of registered tools with metadata

| Aspect | Details |
|--------|---------|
| **WHEN** | catalog.list() is called |
| **THEN** | All registered tools SHALL be returned |
| **AND** | Each tool SHALL include required metadata |

**Test Requirements:**
- Register multiple tools with varying metadata
- Call catalog.list() with no filters
- Verify all registered tools are in results
- Assert each tool includes: name, version, description, parameters schema, return schema

**Expected Results:**
- Returned array contains all registered tools
- Count matches number of registered tools
- Each tool object contains all required metadata fields
- Order is consistent (registration order or alphabetical)

---

#### TC-MTC-002: Filter tools by name

**Scenario:** Name filtering returns only matching tools

| Aspect | Details |
|--------|---------|
| **WHEN** | catalog.list({ filter: "file" }) is called |
| **THEN** | Only tools with matching names SHALL be returned |
| **AND** | Tools without matching names SHALL not be included |

**Test Requirements:**
- Register tools with various names (file-related and unrelated)
- Apply filter matching substring or pattern
- Verify only matching tools are returned
- Assert non-matching tools are excluded
- Test case-insensitivity, partial matches, and exact matches

**Expected Results:**
- Returned tools all contain filter string in name
- Count is less than or equal to total registered tools
- Non-matching tools are not present in results

---

#### TC-MTC-003: Search tools by description

**Scenario:** Full-text search returns relevant tools ordered by relevance

| Aspect | Details |
|--------|---------|
| **WHEN** | catalog.search("file operations") is called |
| **THEN** | Tools with matching descriptions SHALL be returned |
| **AND** | Relevance ordering SHALL be applied |

**Test Requirements:**
- Register tools with descriptions containing search terms
- Execute search query
- Verify results contain matching tools
- Assert results are ordered by relevance score
- Test with exact phrase, partial terms, and multiple terms

**Expected Results:**
- Results include tools with matching descriptions
- Higher relevance scores appear first
- Non-matching tools are excluded or ranked lowest
- Relevance score is included in result metadata

---

### 4. Meta-tools CRUD Operations Tests

Tests for tool registration, updates, and removal.

#### TC-MTU-001: Register new tool

**Scenario:** New tool becomes available immediately after registration

| Aspect | Details |
|--------|---------|
| **WHEN** | A new tool is registered |
| **THEN** | The tool SHALL be available in catalog |
| **AND** | Subsequent list calls SHALL include the tool |

**Test Requirements:**
- Register a new tool with complete definition
- Immediately call catalog.list()
- Verify new tool appears in results
- Verify tool is invokable
- Test registration with minimal and full metadata

**Expected Results:**
- New tool appears in catalog.list() results
- Tool is immediately available for invocation
- Tool metadata is stored correctly
- Registration timestamp is recorded

---

#### TC-MTU-002: Update existing tool

**Scenario:** Catalog reflects updated tool definition

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool's definition is updated |
| **THEN** | The catalog SHALL reflect new definition |
| **AND** | Old version SHALL no longer be available |

**Test Requirements:**
- Register initial tool version
- Update tool with new definition (changed parameters, description, etc.)
- Verify catalog returns updated definition
- Verify old definition is not accessible
- Test concurrent update scenarios if applicable

**Expected Results:**
- catalog.list() returns updated tool definition
- Invocations use new parameter schema
- Previous version is replaced (not duplicated)
- Version number is incremented

---

#### TC-MTU-003: Remove tool from catalog

**Scenario:** Removed tool is no longer accessible

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool is removed |
| **THEN** | The tool SHALL not appear in list results |
| **AND** | Invocation attempts SHALL fail with NotFoundError |

**Test Requirements:**
- Register a tool
- Remove the tool from catalog
- Verify tool is not in catalog.list()
- Attempt to invoke removed tool
- Assert NotFoundError is returned

**Expected Results:**
- Removed tool absent from catalog.list()
- Invocation returns NotFoundError with tool name
- Search results do not include removed tool
- Removal is permanent until re-registration

---

### 5. Meta-tools Error Handling Tests

Tests for error scenarios including timeouts, cancellation, and unexpected failures.

#### TC-MTE-001: Tool invocation timeout

**Scenario:** Long-running tools are terminated at timeout threshold

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool exceeds its timeout limit |
| **THEN** | A TimeoutError SHALL be thrown |
| **AND** | Partial results SHALL not be returned |

**Test Requirements:**
- Configure tool with specific timeout
- Execute tool with operation that exceeds timeout
- Verify TimeoutError is thrown
- Assert no partial results are returned
- Verify timeout is enforced at runtime (not just checked after)

**Expected Results:**
- Error type: TimeoutError
- Error includes: timeout duration, elapsed time, tool name
- No return value or partial results
- Resources are cleaned up properly

---

#### TC-MTE-002: Tool cancellation

**Scenario:** Cancelled tool invocation stops immediately

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool invocation is cancelled |
| **THEN** | Execution SHALL stop immediately |
| **AND** | A CancellationError SHALL be returned |

**Test Requirements:**
- Start long-running tool invocation
- Issue cancellation request
- Verify execution stops (no further progress)
- Assert CancellationError is returned
- Verify resources are released promptly

**Expected Results:**
- Execution stops within reasonable time after cancellation
- Error type: CancellationError
- No partial results are returned
- Cleanup handlers are executed

---

#### TC-MTE-003: Unexpected tool failure

**Scenario:** Unexpected errors are properly wrapped with preserved debugging information

| Aspect | Details |
|--------|---------|
| **WHEN** | A tool throws an unexpected error |
| **THEN** | The error SHALL be wrapped appropriately |
| **AND** | Stack trace SHALL be preserved for debugging |

**Test Requirements:**
- Configure tool that throws unexpected error
- Execute tool
- Verify error is caught and wrapped
- Assert original error details are preserved
- Verify stack trace is available for debugging

**Expected Results:**
- Error type: ToolExecutionError or similar wrapper
- Error includes: original error message, tool name, invocation context
- Stack trace points to original error source
- No sensitive information is leaked in error messages

---

## Test Implementation Guidelines

### Mocking Strategy

- **Tools:** Use mock implementations that simulate tool behavior
- **Catalog:** Use in-memory catalog instance for isolation
- **Timeouts:** Use fake timers for timeout and cancellation tests
- **Errors:** Use mock implementations that throw specific errors

### Test Data Requirements

- Valid tool definitions with complete schemas
- Invalid inputs covering all validation failure modes
- Tools with custom validators for validator testing
- Tools with various timeout configurations

### Assertion Guidelines

- Use exact error type assertions (not just error instance checks)
- Verify error messages contain expected information
- Check timing constraints for timeout tests
- Validate metadata completeness for catalog tests

## Related Specifications

- [Tool Schema Specification](../tool-schema/spec.md)
- [Catalog Management Specification](../catalog-management/spec.md)
- [Error Handling Specification](../error-handling/spec.md)

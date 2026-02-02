# Unit Tests - Observability

## Overview

This specification defines the unit test requirements for the observability components of the Goblin MCP Gateway, including structured logging, metrics collection (Prometheus), and sensitive data redaction.

## Test Scope

- **Component**: Observability (Logging, Metrics, Redaction)
- **Test Type**: Unit Tests
- **Location**: `tests/unit/observability/`

## Test Coverage Requirements

### Requirement: Logger output format tests

The system SHALL have unit tests for structured logging output format.

#### Scenario: Structured log output contains required fields

- **WHEN** a log message is emitted
- **THEN** output SHALL include timestamp, level, message
- **AND** context fields SHALL be included

**Test Cases**:
- Verify timestamp is ISO 8601 format
- Verify level field is present and capitalized
- Verify message field contains the log message
- Verify all context fields are included in output
- Verify output is valid JSON

#### Scenario: Log level filtering

- **WHEN** logger is configured with minimum level
- **THEN** logs below that level SHALL not be emitted
- **AND** logs at or above level SHALL be emitted

**Test Cases**:
- Configure logger with level "info" - debug messages not emitted
- Configure logger with level "warn" - info messages not emitted
- Configure logger with level "error" - warn and info messages not emitted
- Messages at configured level are emitted
- Messages above configured level are emitted
- Verify no runtime overhead for filtered logs

#### Scenario: Child logger inherits parent settings

- **WHEN** a child logger is created
- **THEN** it SHALL inherit parent's configuration
- **AND** child can override specific settings

**Test Cases**:
- Child logger inherits level from parent
- Child logger inherits output format from parent
- Child logger inherits redaction rules from parent
- Child can override level independently
- Child can override output destination independently
- Child logger namespace is prefixed correctly

#### Scenario: Log message with error

- **WHEN** logging an error with stack trace
- **THEN** output SHALL include error message
- **AND** stack trace SHALL be formatted correctly

**Test Cases**:
- Error message is extracted from Error object
- Stack trace is preserved and formatted
- Error object is serialized correctly
- Multiple errors are handled correctly
- Chained errors are handled correctly

### Requirement: Logger redaction tests

The system SHALL have unit tests for sensitive data redaction.

#### Scenario: Sensitive fields are redacted

- **WHEN** logging contains sensitive fields (password, token)
- **THEN** those fields SHALL be replaced with [REDACTED]
- **AND** non-sensitive fields SHALL remain visible

**Test Cases**:
- Password field is redacted
- Token field is redacted
- API key field is redacted
- Secret field is redacted
- Authorization header is redacted
- Non-sensitive fields are not modified
- Nested sensitive fields are redacted

#### Scenario: Custom redaction rules

- **WHEN** custom redaction rules are configured
- **THEN** matching patterns SHALL be redacted
- **AND** custom replacement text SHALL be used

**Test Cases**:
- Custom field name redaction works
- Custom pattern redaction works
- Custom replacement text is used
- Multiple custom rules are applied
- Rule precedence is correct
- Default rules can be disabled

#### Scenario: Nested sensitive data

- **WHEN** sensitive data is nested in objects
- **THEN** all occurrences SHALL be redacted
- **AND** structure SHALL be preserved

**Test Cases**:
- Nested object with sensitive field is redacted
- Deeply nested sensitive fields are redacted
- Arrays containing sensitive data are handled
- Structure is preserved after redaction
- Mixed sensitive and non-sensitive nested data

### Requirement: Metrics collection tests

The system SHALL have unit tests for Prometheus metrics collection.

#### Scenario: Counter increments correctly

- **WHEN** a counter is incremented
- **THEN** metric value SHALL increase by 1
- **AND** label combinations SHALL be tracked separately

**Test Cases**:
- Counter starts at 0
- Increment increases counter by 1
- Multiple increments accumulate correctly
- Different label combinations create separate metrics
- Same labels increment same metric
- Counter cannot be decremented

#### Scenario: Histogram records values

- **WHEN** a value is recorded in histogram
- **THEN** value SHALL be placed in correct bucket
- **AND** sum and count SHALL be updated

**Test Cases**:
- Value placed in correct bucket
- Lower bucket boundary includes value
- Upper bucket boundary excludes value
- Count increments by 1
- Sum accumulates correctly
- Multiple values update buckets correctly
- Empty histogram has zero count and sum

#### Scenario: Gauge sets value

- **WHEN** a gauge is set to a value
- **THEN** metric SHALL reflect new value
- **AND** previous value SHALL be replaced

**Test Cases**:
- Gauge starts at 0
- Set method replaces previous value
- Increment increases gauge by 1
- Decrement decreases gauge by 1
- Set method works with float values
- Multiple gauges with different labels

#### Scenario: Metrics are labeled correctly

- **WHEN** metrics are recorded with labels
- **THEN** label values SHALL be included in output
- **AND** label cardinality SHALL be tracked

**Test Cases**:
- Label names appear in metric output
- Label values are included in metric
- Multiple labels are ordered correctly
- Empty labels are handled correctly
- Label name validation works
- Label value validation works

### Requirement: Metrics output format tests

The system SHALL have unit tests for Prometheus metric format output.

#### Scenario: Counter format is correct

- **WHEN** counter is exposed
- **THEN** output SHALL follow Prometheus format
- **AND** type comment SHALL be present

**Test Cases**:
- TYPE comment is correct (# TYPE counter_name counter)
- HELP comment is present (# HELP counter_name description)
- Metric line format is correct (counter_name{labels} value)
- Counter value is numeric
- Empty labels format is correct
- Multiple label format is correct

#### Scenario: Histogram format includes buckets

- **WHEN** histogram is exposed
- **THEN** output SHALL include bucket metrics
- **AND** cumulative counters SHALL be correct

**Test Cases**:
- Bucket metrics are included (_bucket)
- Bucket label (le) is present
- Histogram count (_count) is present
- Histogram sum (_sum) is present
- Bucket values are cumulative
- Standard buckets are defined (0.005, 0.01, 0.025, etc.)
- Infinity bucket has correct value

#### Scenario: Metric family output

- **WHEN** all metrics are collected
- **THEN** output SHALL be valid Prometheus format
- **AND** duplicate metrics SHALL be aggregated

**Test Cases**:
- All metrics are present in output
- Format is valid Prometheus text format
- Duplicate metrics with same labels are aggregated
- Different label values create separate metrics
- No duplicate metric families
- Output is properly terminated with newline

### Requirement: Observability error handling tests

The system SHALL have unit tests for observability error scenarios.

#### Scenario: Logger handles cyclic references

- **WHEN** logging object with cyclic reference
- **THEN** logger SHALL not hang
- **AND** error SHALL be handled gracefully

**Test Cases**:
- Object referencing itself is handled
- Mutual references are handled
- Deeply nested cycles are handled
- Logger does not throw or crash
- Error is logged appropriately
- Output contains meaningful message

#### Scenario: Metrics handle high cardinality

- **WHEN** high cardinality labels are used
- **THEN** metrics SHALL still be recorded
- **AND** memory usage SHALL be bounded

**Test Cases**:
- Large number of unique labels are recorded
- Memory usage does not grow unboundedly
- Old metrics can be evicted
- Cardinality limits are respected
- High cardinality does not crash metrics system

#### Scenario: Logger fallback on failure

- **WHEN** primary logging fails
- **THEN** fallback logger SHALL be used
- **AND** error SHALL be logged to fallback

**Test Cases**:
- Primary logger failure triggers fallback
- Fallback logger receives error message
- Original error is preserved in fallback
- Recovery when primary logger becomes available
- Multiple fallback attempts are handled

#### Scenario: Metrics registration conflicts

- **WHEN** registering metric with existing name
- **THEN** MetricAlreadyExistsError SHALL be thrown
- **AND** existing metric SHALL remain unchanged

**Test Cases**:
- Registering duplicate counter throws error
- Registering duplicate gauge throws error
- Registering duplicate histogram throws error
- Existing metric is not modified
- Error message contains metric name
- Error type is MetricAlreadyExistsError

## Test Implementation Guidelines

### Mocking Strategy

- Use Jest/Bun mocks for external dependencies
- Mock filesystem for log file writes
- Mock network for remote metrics export
- Mock timers for performance tests

### Test Data

- Create sample log objects with various structures
- Generate test metrics with known values
- Create objects with cyclic references
- Generate large objects for performance tests

### Assertions

- Verify exact output format
- Check timing for performance-critical paths
- Verify error messages and types
- Validate against Prometheus format specification

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `pino`: Structured JSON logging
- `prom-client`: Prometheus metrics client
- `jest` / `bun:test`: Testing framework

## Related Specifications

- [Logging Configuration](../logging-configuration/spec.md)
- [Metrics Configuration](../metrics-configuration/spec.md)
- [Security - Data Redaction](../security-data-redaction/spec.md)

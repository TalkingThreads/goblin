# Configuration Unit Tests Specification

## Overview

This document defines the unit test specifications for the Goblin configuration management system. The tests cover atomic updates, rollback functionality, hot reload capabilities, schema validation, and error recovery mechanisms.

## Test Suite: Config Atomic Updates

### Requirement: Config atomic updates tests

The system SHALL have unit tests for atomic configuration updates ensuring no partial states.

#### Scenario: Successful atomic update

- **WHEN** configuration is updated atomically
- **THEN** all changes SHALL be applied together
- **AND** either all changes succeed or none apply

**Test Coverage:**
- Verify complete transaction isolation
- Ensure all config fields are updated simultaneously
- Validate no intermediate states are observable

#### Scenario: Partial update failure

- **WHEN** update fails mid-operation
- **THEN** all changes SHALL be rolled back
- **AND** original configuration SHALL be preserved

**Test Coverage:**
- Simulate failure during configuration update
- Verify complete rollback to previous state
- Ensure no partial modifications persist

#### Scenario: Concurrent atomic updates

- **WHEN** multiple updates are submitted simultaneously
- **THEN** exactly one SHALL succeed
- **AND** others SHALL receive conflict error

**Test Coverage:**
- Race condition handling
- Optimistic locking mechanism
- Proper conflict error propagation

## Test Suite: Config Rollback

### Requirement: Config rollback tests

The system SHALL have unit tests for configuration rollback functionality.

#### Scenario: Manual rollback to previous version

- **WHEN** configuration is rolled back to previous version
- **THEN** current configuration SHALL be replaced
- **AND** rollback history SHALL be updated

**Test Coverage:**
- Version restoration accuracy
- History tracking completeness
- Timestamp recording for rollback events

#### Scenario: Automatic rollback on validation failure

- **WHEN** updated configuration fails validation
- **THEN** automatic rollback SHALL occur
- **AND** error SHALL indicate validation failure

**Test Coverage:**
- Validation failure detection
- Automatic rollback trigger mechanism
- Clear error message propagation

#### Scenario: Multi-step rollback

- **WHEN** rolling back multiple versions
- **THEN** each step SHALL be validated
- **AND** final configuration SHALL match target version

**Test Coverage:**
- Sequential rollback integrity
- Intermediate state validation
- Target version accuracy verification

#### Scenario: Rollback history limits

- **WHEN** rollback history exceeds limit
- **THEN** oldest entries SHALL be pruned
- **AND** configured limit SHALL be respected

**Test Coverage:**
- Circular buffer implementation
- Entry pruning correctness
- Limit enforcement accuracy

## Test Suite: Config Hot Reload

### Requirement: Config hot reload tests

The system SHALL have unit tests for configuration hot reload without service interruption.

#### Scenario: Hot reload triggers on file change

- **WHEN** configuration file is modified
- **THEN** new configuration SHALL be loaded
- **AND** running operations SHALL use new config

**Test Coverage:**
- File change detection mechanism
- Configuration reload trigger
- Runtime config update propagation

#### Scenario: Hot reload with invalid configuration

- **WHEN** modified configuration is invalid
- **THEN** reload SHALL fail gracefully
- **AND** previous configuration SHALL remain active

**Test Coverage:**
- Invalid config detection
- Failure isolation
- Previous state preservation

#### Scenario: Hot reload during active operations

- **WHEN** config is reloaded while operations are running
- **THEN** in-flight operations SHALL continue with old config
- **AND** new operations SHALL use new config

**Test Coverage:**
- Operation-level config versioning
- Request isolation
- Graceful transition handling

#### Scenario: Hot reload debouncing

- **WHEN** multiple changes occur rapidly
- **THEN** reload SHALL be debounced
- **AND** only final configuration SHALL be loaded

**Test Coverage:**
- Debounce timer implementation
- Multiple event consolidation
- Final state accuracy

## Test Suite: Config Schema Validation

### Requirement: Config schema validation tests

The system SHALL have unit tests for Zod schema validation.

#### Scenario: Valid configuration passes validation

- **WHEN** valid configuration is provided
- **THEN** validation SHALL pass
- **AND** parsed configuration SHALL be returned

**Test Coverage:**
- Schema parsing success
- Type coercion correctness
- Return value integrity

#### Scenario: Invalid configuration fails validation

- **WHEN** configuration fails schema validation
- **THEN** validation SHALL fail with specific errors
- **AND** error SHALL indicate failing fields

**Test Coverage:**
- Error message specificity
- Field-level error reporting
- Validation error structure

#### Scenario: Unknown fields are rejected

- **WHEN** configuration contains unknown fields
- **THEN** UnknownFieldError SHALL be thrown
- **AND** field name SHALL be included in error

**Test Coverage:**
- Unknown field detection
- Error payload completeness
- Strict mode enforcement

#### Scenario: Default values are applied

- **WHEN** optional fields are missing
- **THEN** default values SHALL be applied
- **AND** validated configuration SHALL include defaults

**Test Coverage:**
- Default value injection
- Optional field handling
- Merged result accuracy

## Test Suite: Config Error Recovery

### Requirement: Config error recovery tests

The system SHALL have unit tests for error handling and recovery.

#### Scenario: Missing configuration file

- **WHEN** config file does not exist
- **THEN** ConfigNotFoundError SHALL be thrown
- **AND** default configuration MAY be loaded

**Test Coverage:**
- File existence checking
- Error type correctness
- Fallback mechanism activation

#### Scenario: Corrupted configuration file

- **WHEN** config file is corrupted (invalid JSON)
- **THEN** ConfigParseError SHALL be thrown
- **AND** error SHALL indicate parse issue

**Test Coverage:**
- JSON parsing error detection
- Error message content
- Line/position information (if applicable)

#### Scenario: Permission denied on config file

- **WHEN** config file cannot be read due to permissions
- **THEN** ConfigPermissionError SHALL be thrown
- **AND** error SHALL indicate permission issue

**Test Coverage:**
- Permission error detection
- Error message clarity
- System error passthrough

#### Scenario: Configuration migration

- **WHEN** config schema has changed version
- **THEN** migration SHALL be applied automatically
- **AND** migrated configuration SHALL pass validation

**Test Coverage:**
- Version detection
- Migration chain execution
- Post-migration validation

## Implementation Notes

### Mock Dependencies

The following dependencies SHOULD be mocked in unit tests:
- File system operations (`node:fs/promises`)
- Configuration schema validators (Zod)
- Event emitters for file watching
- Timer functions for debouncing

### Test Environment

- Each test suite SHOULD run in isolation
- Test order SHOULD be randomized to catch dependencies
- Temporary directories SHOULD be used for file-based tests
- Mock timers SHOULD be used for time-dependent scenarios

### Assertion Patterns

- Use exact matching for configuration comparisons
- Verify error types and properties
- Confirm side effects (file writes, emissions) after async operations
- Check timing-related behavior with tolerance windows

## Related Specifications

- [Config Loader Implementation](../config-loader/spec.md)
- [Configuration Schema](../schema/spec.md)
- [Error Types](../errors/spec.md)

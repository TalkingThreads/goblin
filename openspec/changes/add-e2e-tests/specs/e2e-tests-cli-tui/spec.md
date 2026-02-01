# E2E Tests for CLI and TUI

## Overview

This specification defines end-to-end testing requirements for the Goblin CLI and TUI interfaces. The tests validate command execution, output formatting, user interactions, and error handling across both interfaces.

## ADDED Requirements

### Requirement: CLI command execution

The system SHALL validate CLI command execution through end-to-end testing.

#### Scenario: Start gateway via CLI

- **WHEN** user runs `goblin start`
- **THEN** gateway SHALL start successfully
- **AND** process SHALL run in foreground
- **AND** output SHALL show startup messages

#### Scenario: List connected servers

- **WHEN** user runs `goblin servers list`
- **THEN** connected servers SHALL be displayed
- **AND** server details SHALL be correct
- **AND** formatting SHALL be clean

#### Scenario: Add new server

- **WHEN** user runs `goblin servers add <config>`
- **THEN** server SHALL be added to configuration
- **AND** server SHALL connect successfully
- **AND** confirmation SHALL be displayed

#### Scenario: Remove server

- **WHEN** user runs `goblin servers remove <name>`
- **THEN** server SHALL be disconnected
- **AND** server SHALL be removed from configuration
- **AND** confirmation SHALL be displayed

#### Scenario: View server status

- **WHEN** user runs `goblin servers status <name>`
- **THEN** server status SHALL be displayed
- **AND** metrics SHALL be current
- **AND** health information SHALL be accurate

### Requirement: CLI output validation

The system SHALL validate CLI output formatting and content.

#### Scenario: Help command output

- **WHEN** user runs `goblin --help`
- **THEN** help information SHALL be displayed
- **AND** all commands SHALL be documented
- **AND** examples SHALL be helpful

#### Scenario: Error messages are helpful

- **WHEN** user runs invalid command
- **THEN** error message SHALL be clear
- **AND** error SHALL include suggestion
- **AND** exit code SHALL be non-zero

#### Scenario: JSON output format

- **WHEN** user runs command with `--json` flag
- **THEN** output SHALL be valid JSON
- **AND** data SHALL be complete
- **AND** formatting SHALL be consistent

#### Scenario: Verbose output mode

- **WHEN** user runs command with `--verbose`
- **THEN** detailed information SHALL be shown
- **AND** debug logs SHALL be included
- **AND** performance metrics SHALL be displayed

### Requirement: TUI interface testing

The system SHALL test TUI interface interactions.

#### Scenario: TUI starts correctly

- **WHEN** user runs `goblin tui`
- **THEN** TUI SHALL start in terminal
- **AND** initial screen SHALL display correctly
- **AND** navigation SHALL be possible

#### Scenario: Navigate servers view

- **WHEN** user navigates to servers view
- **THEN** list of servers SHALL be displayed
- **AND** server details SHALL be visible
- **AND** selection SHALL be possible

#### Scenario: Execute command from TUI

- **WHEN** user executes command in TUI
- **THEN** command SHALL run successfully
- **AND** output SHALL be displayed
- **AND** return to previous state SHALL work

#### Scenario: TUI keyboard shortcuts

- **WHEN** user presses keyboard shortcuts
- **THEN** corresponding actions SHALL execute
- **AND** visual feedback SHALL be shown
- **AND** shortcuts SHALL be documented

#### Scenario: TUI responds to window resize

- **WHEN** terminal window is resized
- **THEN** TUI SHALL adjust display
- **AND** content SHALL remain readable
- **AND** layout SHALL adapt correctly

### Requirement: TUI output rendering

The system SHALL validate TUI output rendering.

#### Scenario: Server list rendering

- **WHEN** servers view is displayed
- **THEN** server list SHALL be formatted correctly
- **AND** columns SHALL align properly
- **AND** status indicators SHALL be visible

#### Scenario: Metrics display

- **WHEN** metrics view is displayed
- **THEN** metrics SHALL be formatted correctly
- **AND** units SHALL be clear
- **AND** trends SHALL be visible if applicable

#### Scenario: Error display in TUI

- **WHEN** error occurs in TUI
- **THEN** error SHALL be displayed prominently
- **AND** error details SHALL be accessible
- **AND** recovery options SHALL be shown

#### Scenario: Progress indication

- **WHEN** long-running operation executes
- **THEN** progress indicator SHALL be shown
- **AND** progress SHALL update correctly
- **AND** completion SHALL be indicated

### Requirement: CLI/TUI error handling

The system SHALL validate error handling in CLI and TUI.

#### Scenario: Invalid configuration handling

- **WHEN** CLI receives invalid config
- **THEN** error SHALL be clear and actionable
- **AND** invalid fields SHALL be identified
- **AND** suggestion SHALL be provided

#### Scenario: Missing required arguments

- **WHEN** CLI called without required arguments
- **THEN** error SHALL indicate missing args
- **AND** usage SHALL be displayed
- **AND** command SHALL not execute

#### Scenario: Permission denied errors

- **WHEN** CLI lacks required permissions
- **THEN** clear permission error SHALL be shown
- **AND** guidance SHALL be provided
- **AND** operation SHALL not proceed

#### Scenario: Recovery from TUI errors

- **WHEN** TUI encounters error
- **THEN** error SHALL be handled gracefully
- **AND** TUI SHALL remain functional
- **AND** error SHALL be logged

## Test Implementation Guidelines

### CLI Testing Approach

The CLI tests SHOULD use subprocess execution to validate command behavior. Tests SHOULD capture both stdout and stderr, validate exit codes, and verify output formatting. For interactive commands, tests MAY use pseudo-terminals to simulate user input.

### TUI Testing Approach

The TUI tests SHOULD utilize terminal emulation libraries to simulate user interactions. Tests SHOULD validate rendering output, keyboard input handling, and screen updates. Visual regression testing MAY be employed for layout validation.

### Error Simulation

Error scenarios SHOULD be tested by providing invalid inputs, simulating failures, and validating error messages. Tests SHOULD verify that errors are handled gracefully and that the application remains stable.

### Output Validation

All output validation tests SHOULD check for correctness, completeness, and proper formatting. Tests SHOULD validate both success and error output paths.

## Implementation Notes

### Dependencies

The E2E tests MAY require additional testing libraries such as:
- Testing frameworks for the project's language
- Terminal emulation libraries for TUI testing
- Process spawning utilities for CLI testing

### Execution Environment

E2E tests SHOULD run in environments that closely mimic production use. Tests MAY require specific terminal capabilities or environment configurations.

### Performance Considerations

Long-running tests SHOULD be identified and optimized. Test timeouts SHOULD be configured appropriately for different test categories.

## Related Specifications

- Core CLI specification
- TUI interface specification
- Error handling guidelines
- Output formatting standards

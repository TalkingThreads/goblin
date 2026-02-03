## ADDED Requirements

### Requirement: Workflow duration is tracked correctly
The workflow simulator SHALL track and return the actual duration of workflow execution.

#### Scenario: Single tool call workflow
- **WHEN** `simulateWorkflow(singleToolCall)` is called
- **THEN** the result SHALL have `duration > 0` milliseconds

#### Scenario: Multi-turn conversation workflow
- **WHEN** `simulateWorkflow(multiTurn)` is called
- **THEN** the result SHALL have `duration > 0` milliseconds
- **AND** the result SHALL have `toolsUsed` array with expected tools

### Requirement: Error injector triggers correctly
The error injector SHALL trigger errors when their conditions are met.

#### Scenario: Error triggers when condition is true
- **WHEN** `errorInjector.inject(fn)` is called
- **AND** a rule has `condition: () => true`
- **THEN** the rule's error SHALL be thrown

#### Scenario: Error does not trigger when condition is false
- **WHEN** `errorInjector.inject(fn)` is called
- **AND** a rule has `condition: () => false`
- **THEN** no error SHALL be thrown
- **AND** `fn()` SHALL execute normally

### Requirement: MaxErrors limit works correctly
The error injector SHALL enforce the maxErrors limit properly.

#### Scenario: MaxErrors prevents excessive errors
- **WHEN** `errorInjector` has `maxErrors: 2`
- **AND** 3 rules are added with `condition: () => true`
- **THEN** only 2 errors SHALL be triggered
- **AND** `getErrorCount()` SHALL return 2

#### Scenario: Error count increments correctly
- **WHEN** an error is triggered
- **THEN** `getErrorCount()` SHALL increment by 1
- **AND** `getTriggeredRules()` SHALL include the triggered rule name

### Requirement: Tool not found errors are handled
Agent workflows SHALL handle tool not found errors gracefully.

#### Scenario: Tool not found in workflow
- **WHEN** `simulateWorkflow(toolNotFoundWorkflow)` is called
- **AND** the workflow references a non-existent tool
- **THEN** `result.errors` SHALL have at least 1 error
- **AND** `result.success` SHALL be `false`

#### Scenario: Workflow with too many turns times out
- **WHEN** `simulateWorkflow(longWorkflow)` is called
- **AND** the workflow exceeds max turns
- **THEN** `result.errors` SHALL have at least 1 error
- **AND** the error SHALL indicate timeout or max turns

# Requirements: Error Injector Test Fixes

## Functional Requirements

### REQ-1: maxErrors Limit
- The ErrorInjector SHALL stop injecting errors after maxErrors count is reached
- The errorCount SHALL be incremented for each injected error
- Once maxErrors is reached, the injector SHALL pass through to the operation without injection

### REQ-2: Rule Triggering
- Rules with `once: true` SHALL trigger exactly one time
- After triggering, once-rules SHALL be removed from the active rules list
- Rules without `once` SHALL trigger on every matching call

### REQ-3: Error Counting
- `getErrorCount()` SHALL return the number of errors injected by the ErrorInjector
- Errors thrown by the operation itself SHALL NOT increment the error count
- The count SHALL persist across multiple `inject()` calls until `reset()` is called

## Test Requirements

### TEST-1: maxErrors Limit Test
- Given an ErrorInjector with maxErrors=2
- And a rule that triggers on every call without `once`
- When inject is called 3 times with operations that throw
- Then the first 2 calls SHALL throw injected errors
- And the 3rd call SHALL throw the operation's error (not injected)
- And errorCount SHALL be 2 after all calls

### TEST-2: Chained Operations Test
- Given an ErrorInjector with a once-rule
- When the first inject call triggers the rule and fails
- And the second inject call runs without the rule
- Then the second call SHALL succeed

### TEST-3: Rule Removal Test
- Given a once-rule added to the injector
- When the rule triggers once
- Then the rule SHALL be removed from the rules list
- And subsequent calls SHALL not trigger the rule

## Acceptance Criteria

- [ ] "maxErrors limit prevents excessive errors" test passes
- [ ] "chained operations with conditional errors" test passes
- [ ] All error injector tests pass
- [ ] Error injector behavior is consistent and documented

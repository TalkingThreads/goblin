# Requirements: Graceful Shutdown Timeout Fix

## Functional Requirements

### REQ-1: Proper Request Tracking
- The gateway SHALL track active HTTP requests throughout their full lifecycle
- The active request counter SHALL be incremented when a request is received
- The active request counter SHALL be decremented when a response is fully sent

### REQ-2: Graceful Shutdown Behavior  
- When `stop()` is called, the gateway SHALL wait for active requests to complete
- The gateway SHALL provide a maximum wait time of 5 seconds before forcing shutdown
- SSE connections SHALL be handled gracefully during shutdown

### REQ-3: Shutdown Logging
- The gateway SHALL log the number of active requests when shutdown starts
- The gateway SHALL log when waiting for in-flight requests
- The gateway SHALL log a warning if the shutdown timeout is reached

## Test Requirements

### TEST-1: In-Flight Request Completion
- Given a gateway with an active request
- When shutdown is triggered
- Then the request SHALL complete successfully before the gateway stops

### TEST-2: Request Timeout
- Given a gateway with a long-running request  
- When shutdown is triggered and the 5-second timeout expires
- Then the gateway SHALL force shutdown and log a warning

### TEST-3: Multiple Concurrent Requests
- Given a gateway with multiple active requests
- When shutdown is triggered
- Then all requests SHALL complete or timeout before shutdown completes

## Acceptance Criteria

- [ ] "should wait for in-flight requests" test passes consistently
- [ ] All graceful shutdown tests pass
- [ ] No regressions in other tests

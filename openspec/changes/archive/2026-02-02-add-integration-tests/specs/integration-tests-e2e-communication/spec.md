# Integration Tests: End-to-End Communication

## Overview

This specification defines the end-to-end integration tests for validating communication between clients, the MCP gateway, and backend servers. These tests ensure that the gateway correctly routes requests, handles responses, manages streaming, and propagates errors across the system.

## Test Coverage

- Request/response flow validation
- Streaming response handling
- Prompt operations end-to-end
- Resource operations end-to-end
- Error propagation

---

## Requirement: End-to-end request/response flow

The system SHALL validate complete request/response flow through gateway to backend servers.

### Scenario: Tool call routed to correct backend

**WHEN** client calls a tool provided by specific backend
**THEN** request SHALL be routed to that backend
**AND** response SHALL be returned to client
**AND** response time SHALL be reasonable (< 5s)

#### Test Steps

1. Client establishes connection to gateway
2. Client requests list of available tools
3. Client identifies tool from specific backend
4. Client calls identified tool with test parameters
5. Gateway routes request to correct backend based on tool name
6. Backend processes request and returns response
7. Gateway forwards response to client
8. Client verifies response content matches expected output
9. Client measures response time and verifies it is under 5 seconds

#### Expected Results

- Request reaches correct backend server
- Response contains tool output from backend
- Response time is acceptable for user experience

### Scenario: Request with parameters forwarded correctly

**WHEN** client calls tool with parameters
**THEN** parameters SHALL be forwarded unchanged to backend
**AND** backend response SHALL be returned to client
**AND** parameter types SHALL be preserved

#### Test Steps

1. Client prepares request with various parameter types (string, number, boolean, array, object)
2. Client sends request to gateway for specific tool
3. Gateway inspects request and identifies target backend
4. Gateway forwards request with parameters to backend
5. Backend receives parameters with types preserved
6. Backend processes parameters and generates response
7. Gateway forwards response to client
8. Client verifies parameter types were preserved throughout transmission
9. Client verifies response data matches expected computation

#### Expected Results

- All parameter types are preserved (no type coercion)
- Parameter values are unchanged (no data loss or corruption)
- Backend receives exactly what client sent
- Response reflects correct processing of parameters

### Scenario: Multiple sequential requests

**WHEN** client makes multiple sequential requests
**THEN** each request SHALL be processed in order
**AND** responses SHALL be returned in order
**AND** no request SHALL be lost

#### Test Steps

1. Client prepares sequence of 10+ requests to various backends
2. Client sends requests one at a time, waiting for each response
3. Gateway receives each request and routes to appropriate backend
4. Backends process requests and return responses
5. Gateway forwards responses in same order as requests
6. Client collects all responses
7. Client verifies all responses received match request count
8. Client verifies responses are in correct order
9. Client verifies no duplicate or missing responses

#### Expected Results

- All requests are processed
- Responses arrive in correct sequence
- No request timeouts or drops
- Consistent ordering maintained throughout pipeline

---

## Requirement: Streaming responses

The system SHALL validate streaming responses through gateway.

### Scenario: Resource streaming from backend

**WHEN** backend returns streaming resource
**THEN** gateway SHALL stream data to client
**AND** client SHALL receive complete data
**AND** streaming SHALL complete successfully

#### Test Steps

1. Client initiates request for streaming resource from backend
2. Gateway identifies backend with streaming capability
3. Gateway establishes streaming connection to backend
4. Backend begins streaming data chunks to gateway
5. Gateway forwards each chunk to client as received
6. Client accumulates received data chunks
7. Backend signals end of stream
8. Gateway closes stream to client
9. Client verifies received data matches expected total
10. Client verifies stream completed without errors

#### Expected Results

- All data chunks are received by client
- Data integrity is maintained through streaming
- Stream terminates cleanly
- No data loss or corruption during transmission

### Scenario: Partial streaming cancellation

**WHEN** client cancels streaming before completion
**THEN** gateway SHALL stop forwarding data
**AND** backend SHALL be notified of cancellation
**AND** resources SHALL be released

#### Test Steps

1. Client initiates streaming request to backend
2. Gateway establishes connection to backend
3. Backend begins sending streaming data
4. Gateway starts forwarding data to client
5. Client receives several chunks then cancels request
6. Gateway receives cancellation signal
7. Gateway stops forwarding data to client
8. Gateway sends cancellation notification to backend
9. Backend stops producing data and releases resources
10. Gateway releases all resources associated with stream
11. Client verifies cancellation was processed cleanly
12. System verifies no resource leaks (connections, memory, file handles)

#### Expected Results

- Streaming stops immediately upon cancellation
- Backend is notified and stops producing data
- All resources are properly released
- No zombie connections or memory leaks

---

## Requirement: Prompt operations end-to-end

The system SHALL validate prompt operations through gateway.

### Scenario: List prompts from all backends

**WHEN** client lists prompts
**THEN** prompts from all backends SHALL be aggregated
**AND** duplicates SHALL be handled correctly
**AND** response SHALL include all unique prompts

#### Test Steps

1. Client sends list_prompts request to gateway
2. Gateway queries each registered backend for prompts
3. Backends return their available prompts
4. Gateway aggregates results from all backends
5. Gateway identifies and handles duplicate prompt names
6. Gateway combines prompts with unique identifiers
7. Gateway returns consolidated list to client
8. Client verifies all backend prompts are represented
9. Client verifies duplicate handling is correct
10. Client verifies prompt metadata is complete

#### Expected Results

- All prompts from all backends are included
- Duplicates are resolved with unique identifiers
- No prompts are lost during aggregation
- Metadata is preserved for all prompts

### Scenario: Get prompt from specific backend

**WHEN** client gets a prompt by name
**THEN** request SHALL be routed to correct backend
**AND** prompt SHALL be returned with arguments

#### Test Steps

1. Client prepares get_prompt request with prompt name
2. Client sends request to gateway
3. Gateway determines which backend owns the requested prompt
4. Gateway routes request to identified backend
5. Backend retrieves prompt definition with arguments
6. Backend returns prompt to gateway
7. Gateway forwards prompt to client
8. Client verifies prompt was returned
9. Client verifies prompt arguments are correct
10. Client verifies routing was correct (no wrong backend responses)

#### Expected Results

- Request reaches correct backend
- Prompt is returned with all arguments
- Response is complete and accurate
- No cross-contamination between backends

---

## Requirement: Resource operations end-to-end

The system SHALL validate resource operations through gateway.

### Scenario: List resources from all backends

**WHEN** client lists resources
**THEN** resources from all backends SHALL be aggregated
**AND** resource URIs SHALL be unique
**AND** metadata SHALL be preserved

#### Test Steps

1. Client sends list_resources request to gateway
2. Gateway queries each registered backend for resources
3. Backends return their available resources
4. Gateway aggregates results from all backends
5. Gateway ensures URI uniqueness across all backends
6. Gateway preserves resource metadata (name, description, MIME type)
7. Gateway returns consolidated list to client
8. Client verifies all backend resources are represented
9. Client verifies all URIs are unique
10. Client verifies metadata is complete for each resource

#### Expected Results

- All resources from all backends are included
- No duplicate URIs in consolidated list
- Metadata is preserved for all resources
- Resources are correctly attributed to their backends

### Scenario: Read resource from backend

**WHEN** client reads a resource
**THEN** request SHALL be routed to owning backend
**AND** resource content SHALL be returned
**AND** content type SHALL be preserved

#### Test Steps

1. Client identifies resource URI to read
2. Client sends read_resource request to gateway
3. Gateway parses URI to identify owning backend
4. Gateway routes request to correct backend
5. Backend locates resource and reads content
6. Backend determines content type (MIME type)
7. Backend returns content with headers to gateway
8. Gateway forwards content to client with headers
9. Client receives content with correct MIME type
10. Client verifies content matches expected data
11. Client verifies content type header is correct

#### Expected Results

- Request reaches correct backend
- Resource content is returned intact
- Content type/MIME type is preserved
- No content corruption during transmission

### Scenario: Resource template expansion

**WHEN** client uses resource template
**THEN** template SHALL be expanded by backend
**AND** expanded resources SHALL be returned
**AND** errors SHALL be propagated correctly

#### Test Steps

1. Client identifies resource template URI with variables
2. Client sends list_resources request for template
3. Gateway routes request to appropriate backend
4. Backend expands template with actual values
5. Backend generates list of expanded resource URIs
6. Backend returns expanded resources to gateway
7. Gateway forwards results to client
8. Client receives list of expanded resource URIs
9. Client can now read specific expanded resources

#### Error Handling Path

1. Client identifies resource template with invalid parameters
2. Client sends list_resources request for template
3. Backend attempts template expansion
4. Backend detects invalid parameters
5. Backend returns error to gateway
6. Gateway propagates error to client
7. Client receives informative error message

#### Expected Results (Success)

- Template is correctly expanded by backend
- All matching expanded resources are returned
- Client receives usable resource URIs

#### Expected Results (Error)

- Error is propagated to client
- Error message is informative
- Client can understand what went wrong

---

## Requirement: Error propagation end-to-end

The system SHALL validate error propagation from backend to client.

### Scenario: Backend error returned to client

**WHEN** backend returns error response
**THEN** error SHALL be propagated to client
**AND** error code SHALL be preserved
**AND** error message SHALL be informative

#### Test Steps

1. Client sends request that will trigger backend error
2. Gateway routes request to backend
3. Backend processes request and encounters error condition
4. Backend constructs error response with code and message
5. Backend returns error to gateway
6. Gateway receives error response
7. Gateway propagates error to client
8. Client receives error with code and message
9. Client verifies error code is preserved
10. Client verifies error message is informative
11. Client can handle error appropriately

#### Expected Results

- Error code is preserved through gateway
- Error message is not modified or truncated
- Client receives complete error information
- Client can take appropriate action based on error

### Scenario: Backend timeout handled gracefully

**WHEN** backend exceeds timeout
**THEN** timeout error SHALL be returned to client
**AND** partial results SHALL not be returned
**AND** error SHALL indicate timeout condition

#### Test Steps

1. Client sends request to gateway
2. Gateway routes request to backend
3. Backend begins processing (slow operation)
4. Request exceeds configured timeout threshold
5. Backend does not complete within timeout
6. Gateway detects timeout condition
7. Gateway cancels pending backend request
8. Gateway constructs timeout error response
9. Gateway returns timeout error to client
10. Client receives timeout error
11. Client verifies no partial results were returned
12. Client verifies error indicates timeout condition

#### Expected Results

- Timeout error is returned promptly after threshold
- No partial or incomplete data is sent to client
- Error clearly indicates timeout occurred
- Client can retry or handle timeout appropriately
- Backend request is properly cancelled

---

## Test Environment Requirements

### Required Components

- Gateway server instance
- Multiple backend MCP servers (minimum 2)
- Test client with MCP protocol support
- Network isolation or controlled test environment

### Backends for Testing

1. **Primary Backend**: Standard MCP server with tools, prompts, and resources
2. **Secondary Backend**: Different MCP server for routing verification
3. **Slow Backend**: MCP server with artificial delays for timeout testing
4. **Streaming Backend**: MCP server with streaming capability

### Metrics and Validation

- Response time measurement (< 5s threshold)
- Request/response correlation validation
- Stream完整性 verification
- Error code preservation check
- Resource leak detection

---

## Implementation Notes

### Test Execution Order

Tests should be executed in the following order:

1. Basic request/response flow tests
2. Parameter forwarding tests
3. Sequential request tests
4. Streaming tests (basic and cancellation)
5. Prompt operation tests
6. Resource operation tests
7. Error propagation tests

### Isolation Requirements

Each scenario should be independent and able to run in isolation. Shared state should be minimized and cleaned up after each test.

### Error Injection Points

- Backend error responses
- Backend timeouts
- Network interruption
- Invalid parameter combinations
- Missing resources

---

## Success Criteria

All scenarios defined in this specification must pass consistently:

- 100% of requests are correctly routed
- 100% of responses are received without corruption
- 100% of streaming operations complete correctly
- 100% of errors are propagated with preserved codes
- All response times meet defined thresholds

---

## References

- MCP Protocol Specification
- Gateway Architecture Documentation
- Backend Server Implementation Guides
- Integration Test Framework Documentation

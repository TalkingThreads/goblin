# Elicitation Support Specification

## ADDED Requirements

### Requirement: Elicitation capability advertisement
The Gateway SHALL advertise the `elicitation` capability to backend servers when user input support is available.

#### Scenario: Backend server receives elicitation capability
- **WHEN** a backend server connects to the Gateway
- **THEN** the client capabilities include `elicitation: {}`

### Requirement: Gateway handles elicitation requests from backends
The Gateway SHALL accept `elicitation/requestInput` requests from backend servers and route them to the appropriate client.

#### Scenario: Successful elicitation request routing
- **WHEN** a backend server sends `elicitation/requestInput` with an elicitation request
- **THEN** the Gateway SHALL route the request to the connected client
- **AND** the Gateway SHALL include the prompt, title, and structured data
- **AND** wait for the client's response

#### Scenario: No client connected for elicitation
- **WHEN** a backend server sends `elicitation/requestInput` but no client is connected
- **THEN** the Gateway SHALL return an error with code `ConnectionClosed`
- **AND** the error message SHALL indicate no client is available

### Requirement: Elicitation response routing
The Gateway SHALL accept elicitation responses from clients and forward them to the requesting backend server.

#### Scenario: Client submits elicitation response
- **WHEN** a client submits an elicitation response (values or cancellation)
- **THEN** the Gateway SHALL forward the response to the originating backend server
- **AND** the Gateway SHALL include any request context for correlation

### Requirement: Elicitation prompt preservation
The Gateway SHALL preserve all elicitation request parameters without modification.

#### Scenario: Complete elicitation request forwarded
- **WHEN** a backend server sends `elicitation/requestInput` with a complete request
- **THEN** the Gateway SHALL forward all fields unchanged (prompt, action, kind, data)
- **AND** the Gateway SHALL forward the client's complete response

#### Scenario: Partial elicitation response
- **WHEN** a client responds with partial field values
- **THEN** the Gateway SHALL forward the response exactly as received
- **AND** SHALL NOT add, remove, or modify any fields

### Requirement: Elicitation cancellation
The Gateway SHALL support cancellation of pending elicitation requests from both ends.

#### Scenario: Backend cancels elicitation request
- **WHEN** a backend server cancels a pending elicitation request
- **THEN** the Gateway SHALL forward the cancellation to the client
- **AND** the Gateway SHALL not forward any subsequent response

#### Scenario: Client cancels elicitation
- **WHEN** a client cancels a pending elicitation request
- **THEN** the Gateway SHALL forward the cancellation to the backend
- **AND** the response SHALL indicate user cancellation

### Requirement: Elicitation timeout handling
The Gateway SHALL enforce timeouts on elicitation requests.

#### Scenario: Elicitation request timeout
- **WHEN** an elicitation request exceeds the configured timeout
- **THEN** the Gateway SHALL return a timeout error to the backend
- **AND** the Gateway SHALL attempt to cancel the request at the client

### Requirement: Elicitation with multiple pending requests
The Gateway SHALL handle multiple concurrent elicitation requests correctly.

#### Scenario: Multiple elicitation requests from same backend
- **WHEN** a backend server sends multiple elicitation requests
- **THEN** the Gateway SHALL route each request to the client
- **AND** the Gateway SHALL correlate responses with requests using request IDs
- **AND** responses SHALL be delivered to the correct backend

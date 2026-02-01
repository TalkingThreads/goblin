## ADDED Requirements

### Requirement: Sampling capability advertisement
The Gateway SHALL advertise the `sampling` capability to backend servers when client sampling is available.

#### Scenario: Backend server receives sampling capability
- **WHEN** a backend server connects to the Gateway
- **THEN** the client capabilities include `sampling: {}`

### Requirement: Gateway handles sampling requests from backends
The Gateway SHALL accept `sampling/createMessage` requests from backend servers and route them to the appropriate client.

#### Scenario: Successful sampling request routing
- **WHEN** a backend server sends `sampling/createMessage` with a sampling request
- **THEN** the Gateway SHALL route the request to the connected client
- **AND** the Gateway SHALL include the full request context (prompt, sampling preferences)
- **AND** wait for the client's response

#### Scenario: No client connected for sampling
- **WHEN** a backend server sends `sampling/createMessage` but no client is connected
- **THEN** the Gateway SHALL return an error with code `ConnectionClosed`
- **AND** the error message SHALL indicate no client is available

### Requirement: Gateway handles sampling responses from clients
The Gateway SHALL accept sampling responses from clients and forward them to the requesting backend server.

#### Scenario: Client sends sampling response
- **WHEN** a client sends a sampling response (message or refusal)
- **THEN** the Gateway SHALL forward the response to the originating backend server
- **AND** the Gateway SHALL include any sampling context for correlation

### Requirement: Sampling context preservation
The Gateway SHALL preserve all sampling request parameters and response metadata without modification.

#### Scenario: Sampling preferences preserved
- **WHEN** a backend server sends `sampling/createMessage` with preferences (temperature, maxTokens, etc.)
- **THEN** the Gateway SHALL forward all preferences unchanged to the client
- **AND** the Gateway SHALL forward the client's complete response including model information

#### Scenario: Partial information in response
- **WHEN** a client responds with a sampling completion that includes partial data
- **THEN** the Gateway SHALL forward the response exactly as received
- **AND** SHALL NOT add, remove, or modify any fields

### Requirement: Sampling cancellation support
The Gateway SHALL support cancellation of pending sampling requests.

#### Scenario: Backend cancels sampling request
- **WHEN** a backend server sends a cancellation for a pending sampling request
- **THEN** the Gateway SHALL forward the cancellation to the client
- **AND** the Gateway SHALL not forward any subsequent response for that request

### Requirement: Sampling timeout handling
The Gateway SHALL enforce timeouts on sampling requests to prevent hanging.

#### Scenario: Sampling request timeout
- **WHEN** a sampling request exceeds the configured timeout
- **THEN** the Gateway SHALL return a timeout error to the backend
- **AND** the Gateway SHALL attempt to cancel the request at the client

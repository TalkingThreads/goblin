# Server Logging

## ADDED Requirements

### Requirement: Server logging capability advertisement
The Gateway SHALL advertise logging capability to clients when clients support receiving server logs.

#### Scenario: Client receives logging configuration
- **WHEN** a client establishes a connection to the Gateway
- **THEN** the server capabilities include appropriate logging configuration

### Requirement: Gateway accepts server log notifications
The Gateway SHALL accept `notifications/message` from backend servers and route them to appropriate clients.

#### Scenario: Backend server sends log notification
- **WHEN** a backend server sends `notifications/message` with a log entry
- **THEN** the Gateway SHALL accept the log entry
- **AND** route it to connected clients based on log level filtering

### Requirement: Log level filtering
The Gateway SHALL support filtering log messages by level before forwarding to clients.

#### Scenario: Client filters debug logs
- **WHEN** a client has configured log filtering to exclude debug level
- **THEN** the Gateway SHALL NOT forward debug-level logs to that client
- **AND** the Gateway SHALL forward info, warning, and error logs

#### Scenario: Client receives all log levels
- **WHEN** a client has not configured log filtering
- **THEN** the Gateway SHALL forward all log levels from backend servers

### Requirement: Log message preservation
The Gateway SHALL preserve all log message fields without modification.

#### Scenario: Complete log message forwarding
- **WHEN** a backend server sends `notifications/message` with complete log data
- **THEN** the Gateway SHALL forward all fields unchanged (level, data, logger)
- **AND** add gateway-specific metadata (server ID, timestamp)

#### Scenario: Partial log message
- **WHEN** a backend server sends `notifications/message` with partial data
- **THEN** the Gateway SHALL forward the message exactly as received
- **AND** SHALL NOT add, remove, or modify any fields

### Requirement: Log routing to multiple clients
The Gateway SHALL route log messages to all connected clients that have not filtered them.

#### Scenario: Multiple clients with different filters
- **WHEN** a backend server sends a log notification
- **THEN** the Gateway SHALL evaluate each client's filter configuration
- **AND** forward the log to each client that has not filtered that level

### Requirement: Connection state for logging
The Gateway SHALL handle log routing when clients disconnect and reconnect.

#### Scenario: Client disconnects during logging
- **WHEN** a client disconnects while logs are being processed
- **THEN** the Gateway SHALL not attempt to forward to that client
- **AND** logs for disconnected clients SHALL be discarded

#### Scenario: Client reconnects with different log filter
- **WHEN** a client reconnects with a new log filter configuration
- **THEN** the Gateway SHALL apply the new filter immediately
- **AND** future logs SHALL use the new filter configuration

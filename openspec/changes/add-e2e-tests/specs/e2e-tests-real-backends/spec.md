# End-to-End Tests with Real MCP Backends Specification

## Overview

This specification defines requirements for testing Goblin's integration with real MCP servers to ensure authentic validation of gateway functionality.

## Filesystem Server Integration

The system SHALL test against real filesystem MCP server for authentic validation.

### Scenario: Read File Through Gateway

- **WHEN** client requests file read via gateway
- **THEN** request SHALL be routed to filesystem server
- **AND** file content SHALL be returned correctly
- **AND** file metadata SHALL be preserved

### Scenario: List Directory Through Gateway

- **WHEN** client lists directory via gateway
- **THEN** request SHALL be routed to filesystem server
- **AND** directory listing SHALL be returned
- **AND** entries SHALL be correctly formatted

### Scenario: Write File Through Gateway

- **WHEN** client writes file via gateway
- **THEN** request SHALL be routed to filesystem server
- **AND** file SHALL be created/updated
- **AND** result SHALL confirm operation success

### Scenario: File Operations with Permissions

- **WHEN** client attempts restricted file operation
- **THEN** permission error SHALL be returned
- **AND** error message SHALL indicate issue
- **AND** gateway SHALL forward error correctly

## Prompt Server Integration

The system SHALL test against real prompt MCP server.

### Scenario: List Prompts from Server

- **WHEN** client lists prompts via gateway
- **THEN** prompts SHALL be fetched from server
- **AND** all prompts SHALL be returned
- **AND** prompt metadata SHALL be preserved

### Scenario: Get and Execute Prompt

- **WHEN** client gets prompt with arguments via gateway
- **THEN** request SHALL be routed to prompt server
- **AND** prompt SHALL be rendered with arguments
- **AND** result SHALL be returned to client

### Scenario: Dynamic Prompt Generation

- **WHEN** client uses template-based prompt
- **THEN** template SHALL be expanded server-side
- **AND** expanded prompt SHALL be returned
- **AND** substitution errors SHALL be handled

## Resource Server Integration

The system SHALL test against real resource MCP server.

### Scenario: List Resources from Server

- **WHEN** client lists resources via gateway
- **THEN** resources SHALL be fetched from server
- **AND** all resources SHALL be returned
- **AND** resource URIs SHALL be unique

### Scenario: Read Resource Content

- **WHEN** client reads resource via gateway
- **THEN** request SHALL be routed to owning server
- **AND** resource content SHALL be returned
- **AND** content type SHALL be preserved

### Scenario: Subscribe to Resource Updates

- **WHEN** client subscribes to resource via gateway
- **THEN** subscription SHALL be registered
- **AND** updates SHALL be forwarded to client
- **AND** subscription SHALL expire correctly

## Multiple Real Servers

The system SHALL test with multiple real MCP servers simultaneously.

### Scenario: Multiple Servers Registered

- **WHEN** multiple real servers are connected
- **THEN** gateway SHALL aggregate capabilities
- **AND** tools/prompts/resources SHALL be combined
- **AND** routing SHALL work correctly

### Scenario: Cross-Server Tool Calls

- **WHEN** agent calls tool from different servers
- **THEN** request SHALL be routed correctly
- **AND** results SHALL be returned to agent
- **AND** context SHALL be maintained

### Scenario: Server Health During Multi-Server Operation

- **WHEN** one server becomes unhealthy
- **THEN** gateway SHALL detect issue
- **AND** other servers SHALL continue working
- **AND** affected requests SHALL be handled

### Scenario: Server Addition/Removal Dynamically

- **WHEN** real server is added or removed
- **THEN** gateway SHALL update capabilities
- **AND** clients SHALL be notified
- **AND** ongoing operations SHALL complete or fail gracefully

## Real Server Error Handling

The system SHALL handle errors from real servers correctly.

### Scenario: Server Returns Protocol Error

- **WHEN** real server returns MCP protocol error
- **THEN** error SHALL be forwarded to client
- **AND** error code SHALL be preserved
- **AND** error message SHALL be informative

### Scenario: Server Becomes Unavailable

- **WHEN** real server crashes or disconnects
- **THEN** gateway SHALL detect disconnection
- **AND** pending requests SHALL be failed
- **AND** error SHALL be returned to client

### Scenario: Server Returns Unexpected Data

- **WHEN** real server returns malformed response
- **THEN** gateway SHALL handle gracefully
- **AND** error SHALL be logged
- **AND** client SHALL receive appropriate error

## Test Infrastructure Requirements

### Real Server Instances

- Filesystem MCP server running with test directory
- Prompt MCP server with test prompts
- Resource MCP server with test resources
- All servers configured for end-to-end testing

### Test Data

- Test files with various sizes and permissions
- Test prompts with different argument patterns
- Test resources with various content types
- Controlled test environment for permission testing

### Validation Criteria

- Authentic server responses verified
- Error conditions tested with real servers
- Multi-server scenarios validated
- Performance impact measured

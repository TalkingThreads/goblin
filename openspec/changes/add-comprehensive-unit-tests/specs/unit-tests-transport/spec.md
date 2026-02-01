# Unit Tests Transport Specification

## Overview

This document specifies the unit tests required for transport layer functionality in the Goblin MCP gateway.

## STDIO Transport Tests

### STDIO Transport Initializes Correctly

**WHEN** STDIO transport is initialized  
**THEN** stdin and stdout SHALL be configured  
**AND** message handler SHALL be registered

**Implementation Requirements:**
- Verify stdin/stdout stream configuration
- Confirm message handler callback is registered
- Validate transport state transitions to "connected"

### STDIO Transport Sends Message

**WHEN** message is sent via STDIO transport  
**THEN** message SHALL be written to stdout  
**AND** format SHALL be JSON-RPC compliant

**Implementation Requirements:**
- Test message serialization to JSON-RPC format
- Verify write to stdout stream
- Confirm message structure matches protocol specification

### STDIO Transport Receives Message

**WHEN** message is received on stdin  
**THEN** message handler SHALL be called  
**AND** parsed JSON-RPC message SHALL be passed

**Implementation Requirements:**
- Mock stdin stream with incoming messages
- Verify handler invocation with parsed content
- Validate JSON parsing and message routing

### STDIO Transport Handles Close

**WHEN** stdin is closed  
**THEN** connection SHALL be marked closed  
**AND** close handler SHALL be invoked

**Implementation Requirements:**
- Simulate stdin close event
- Verify state change to "disconnected"
- Confirm close handler callback execution

## HTTP Transport Tests

### HTTP Transport Initializes Correctly

**WHEN** HTTP transport is initialized  
**THEN** server SHALL be configured  
**AND** routes SHALL be registered

**Implementation Requirements:**
- Verify Hono app configuration
- Confirm route registration for endpoints
- Validate middleware setup

### HTTP Transport Accepts Connection

**WHEN** client connects via HTTP  
**THEN** connection SHALL be tracked  
**AND** session SHALL be created

**Implementation Requirements:**
- Test connection tracking mechanism
- Verify session creation and storage
- Confirm connection metadata persistence

### HTTP Transport Sends Message

**WHEN** message is sent via HTTP transport  
**THEN** message SHALL be delivered to client  
**AND** response SHALL be acknowledged

**Implementation Requirements:**
- Test message delivery to connected clients
- Verify response acknowledgment mechanism
- Confirm delivery confirmation callback

### HTTP Transport SSE Streaming

**WHEN** client uses SSE endpoint  
**THEN** messages SHALL be streamed in real-time  
**AND** connection SHALL remain open

**Implementation Requirements:**
- Verify SSE endpoint response headers
- Test streaming message delivery
- Confirm connection lifecycle management

## Connection Pooling Tests

### Pool Creates Connections As Needed

**WHEN** connection is requested from pool  
**THEN** new connection SHALL be created if none available  
**AND** connection SHALL be assigned to requester

**Implementation Requirements:**
- Test pool empty state handling
- Verify connection creation logic
- Confirm assignment to requester

### Pool Reuses Connections

**WHEN** connection is released back to pool  
**THEN** it SHALL be available for reuse  
**AND** subsequent requests SHALL get same connection

**Implementation Requirements:**
- Test connection release mechanism
- Verify pool state after release
- Confirm reuse behavior on subsequent requests

### Pool Respects Maximum Size

**WHEN** pool is at maximum capacity  
**THEN** new connection requests SHALL wait  
**OR** be rejected with PoolExhaustedError

**Implementation Requirements:**
- Test pool saturation behavior
- Verify wait/rejection mechanism
- Confirm PoolExhaustedError throwing

### Pool Cleans Up Idle Connections

**WHEN** connection exceeds idle timeout  
**THEN** connection SHALL be closed  
**AND** removed from pool

**Implementation Requirements:**
- Simulate idle timeout scenario
- Verify connection cleanup process
- Confirm removal from pool data structure

## Health Check Tests

### Health Check Returns Healthy

**WHEN** transport is functioning normally  
**THEN** health check SHALL return healthy status  
**AND** response SHALL include transport details

**Implementation Requirements:**
- Test healthy state detection
- Verify response structure and content
- Confirm transport metadata inclusion

### Health Check Detects Failure

**WHEN** transport has failed  
**THEN** health check SHALL return unhealthy status  
**AND** error details SHALL be included

**Implementation Requirements:**
- Simulate transport failure scenarios
- Verify error detection mechanism
- Confirm error details in response

### Health Check Includes Dependencies

**WHEN** health check is performed  
**THEN** dependent services SHALL be checked  
**AND** status SHALL reflect overall health

**Implementation Requirements:**
- Test dependency checking logic
- Verify aggregate status calculation
- Confirm dependency health in response

## Transport Reconnection Tests

### Automatic Reconnection On Disconnect

**WHEN** connection is lost  
**THEN** automatic reconnection SHALL be attempted  
**AND** exponential backoff SHALL be applied

**Implementation Requirements:**
- Simulate connection loss
- Verify reconnection trigger
- Test backoff calculation and application

### Reconnection Success

**WHEN** reconnection succeeds  
**THEN** new session SHALL be established  
**AND** pending messages SHALL be replayed

**Implementation Requirements:**
- Test successful reconnection flow
- Verify session reestablishment
- Confirm message replay mechanism

### Reconnection After Max Retries

**WHEN** maximum reconnection attempts are exceeded  
**THEN** reconnection SHALL stop  
**AND** PermanentFailureError SHALL be emitted

**Implementation Requirements:**
- Test max retries boundary
- Verify stop condition logic
- Confirm PermanentFailureError emission

### Reconnection During Active Requests

**WHEN** disconnect occurs during request  
**THEN** request SHALL be marked as failed  
**AND** caller SHALL be notified

**Implementation Requirements:**
- Simulate in-flight request disconnect
- Verify request failure detection
- Confirm caller notification mechanism

## Transport Error Handling Tests

### Invalid Message Format

**WHEN** invalid JSON-RPC message is received  
**THEN** ParseError SHALL be returned  
**AND** connection SHALL remain open

**Implementation Requirements:**
- Test invalid JSON handling
- Verify ParseError response format
- Confirm connection preservation

### Unknown Method Handling

**WHEN** unknown method is called  
**THEN** MethodNotFoundError SHALL be returned  
**AND** request SHALL be logged

**Implementation Requirements:**
- Test unknown method routing
- Verify MethodNotFoundError response
- Confirm logging mechanism

### Transport Buffer Overflow

**WHEN** message exceeds buffer limit  
**THEN** MessageTooLargeError SHALL be thrown  
**AND** connection MAY be closed

**Implementation Requirements:**
- Test oversized message handling
- Verify size limit enforcement
- Confirm error and optional disconnection

### TLS/SSL Certificate Validation

**WHEN** TLS transport validates certificates  
**THEN** invalid certificates SHALL reject connection  
**AND** error SHALL indicate certificate issue

**Implementation Requirements:**
- Test certificate validation logic
- Verify rejection of invalid certificates
- Confirm error message specificity

## Test Implementation Guidelines

### Mocking Requirements

- Use mock implementations for I/O operations
- Simulate network conditions and timing
- Mock external dependencies for isolation

### Assertion Patterns

- Verify state transitions explicitly
- Check callback invocation with correct parameters
- Validate error handling paths

### Coverage Goals

- Achieve minimum 80% branch coverage for transport layer
- Cover all error paths and edge cases
- Include integration scenarios for transport interactions

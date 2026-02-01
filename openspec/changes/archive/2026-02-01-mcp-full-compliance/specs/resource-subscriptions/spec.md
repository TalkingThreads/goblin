# Resource Subscriptions

## Overview

This specification defines how the Gateway supports resource subscription and change notification capabilities for MCP clients. Resource subscriptions enable clients to monitor specific resources and receive notifications when those resources change on backend servers.

## ADDED Requirements

### Requirement: Resource subscription capability advertisement
The Gateway SHALL advertise the `resources.subscribe` capability to clients when subscription support is available from backend servers.

#### Scenario: Client receives capability advertisement
- **WHEN** a client establishes a connection to the Gateway
- **THEN** the server capabilities include `resources: { subscribe: true, listChanged: true }`

### Requirement: Client can subscribe to resource changes
The Gateway SHALL handle `resources/subscribe` requests and track subscriptions per client and resource URI.

#### Scenario: Successful subscription request
- **WHEN** a client sends `resources/subscribe` with a valid resource URI
- **THEN** the Gateway SHALL store the subscription mapping (clientId, serverId, uri)
- **AND** the Gateway SHALL proxy the subscription to the appropriate backend server
- **AND** return success response

#### Scenario: Subscription to non-existent resource
- **WHEN** a client sends `resources/subscribe` with a resource URI that no backend server provides
- **THEN** the Gateway SHALL return an error with code `InvalidParams`
- **AND** the error message SHALL indicate the resource URI is not available

### Requirement: Client can unsubscribe from resource changes
The Gateway SHALL handle `resources/unsubscribe` requests and remove subscriptions.

#### Scenario: Successful unsubscription request
- **WHEN** a client sends `resources/unsubscribe` with a valid subscription ID or resource URI
- **THEN** the Gateway SHALL remove the subscription from tracking
- **AND** the Gateway SHALL proxy the unsubscription to the backend server if applicable
- **AND** return success response

### Requirement: Gateway forwards resource update notifications
The Gateway SHALL forward `notifications/resources/updated` from backend servers to subscribed clients.

#### Scenario: Backend server sends resource update notification
- **WHEN** a backend server sends `notifications/resources/updated` with a resource URI
- **THEN** the Gateway SHALL look up all client subscriptions for that URI
- **AND** the Gateway SHALL forward the notification to each subscribed client

#### Scenario: Notification for non-subscribed resource
- **WHEN** a backend server sends `notifications/resources/updated` with a resource URI that no client has subscribed to
- **THEN** the Gateway SHALL silently discard the notification

### Requirement: Subscription cleanup on disconnect
The Gateway SHALL clean up all subscriptions when a client disconnects.

#### Scenario: Client disconnect with active subscriptions
- **WHEN** a client connection is closed
- **THEN** the Gateway SHALL remove all subscriptions associated with that client
- **AND** the Gateway SHALL send `resources/unsubscribe` to appropriate backend servers

### Requirement: Subscription limits
The Gateway SHALL enforce limits on subscriptions per client to prevent resource exhaustion.

#### Scenario: Subscription limit exceeded
- **WHEN** a client attempts to create more subscriptions than the configured limit
- **THEN** the Gateway SHALL return an error with code `LimitExceeded`
- **AND** the error message SHALL indicate the subscription limit

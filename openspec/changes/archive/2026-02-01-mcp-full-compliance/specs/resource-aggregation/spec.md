# Resource Aggregation with Subscription Proxying

This specification extends the existing resource aggregation capability to support subscription proxying.

## MODIFIED Requirements

### Requirement: Resource list operation (existing, unchanged)
The Gateway SHALL aggregate resources from all backend servers and return a unified list to clients.

#### Scenario: Client requests resource list
- **WHEN** a client sends `resources/list` request
- **THEN** the Gateway SHALL collect resources from all connected backend servers
- **AND** return a combined list of resources with unique URIs

### Requirement: Resource read operation (existing, unchanged)
The Gateway SHALL route resource read requests to the appropriate backend server.

#### Scenario: Client reads a resource
- **WHEN** a client sends `resources/read` request with a resource URI
- **THEN** the Gateway SHALL identify the backend server that owns the resource
- **AND** forward the request to that server
- **AND** return the resource contents to the client

### Requirement: Resource template listing (existing, unchanged)
The Gateway SHALL aggregate resource templates from all backend servers.

#### Scenario: Client requests resource templates
- **WHEN** a client sends `resources/templates/list` request
- **THEN** the Gateway SHALL collect templates from all backend servers
- **AND** return a combined list of templates

### Requirement: Resource subscription tracking (NEW)
The Gateway SHALL track resource subscriptions per client and server.

#### Scenario: Client subscribes to a resource
- **WHEN** a client sends `resources/subscribe` request
- **THEN** the Gateway SHALL record the subscription mapping (clientId, serverId, uri)
- **AND** forward the subscription to the backend server if supported

#### Scenario: Subscription mapping storage
- **WHEN** a subscription is created
- **THEN** the Gateway SHALL store the mapping with:
  - Client connection ID
  - Backend server ID
  - Resource URI
  - Subscription timestamp

### Requirement: Resource notification forwarding (NEW)
The Gateway SHALL forward `notifications/resources/updated` from backends to subscribed clients.

#### Scenario: Backend sends resource update
- **WHEN** a backend server sends `notifications/resources/updated`
- **THEN** the Gateway SHALL look up all subscriptions for that resource URI
- **AND** forward the notification to each subscribed client

#### Scenario: Notification without subscribers
- **WHEN** a backend sends resource update but no client is subscribed
- **THEN** the Gateway SHALL discard the notification silently

### Requirement: Subscription lifecycle management (NEW)
The Gateway SHALL properly manage subscription lifecycle including cleanup.

#### Scenario: Client unsubscribes
- **WHEN** a client sends `resources/unsubscribe` request
- **THEN** the Gateway SHALL remove the subscription from tracking
- **AND** forward unsubscription to the backend server

#### Scenario: Subscription cleanup on disconnect
- **WHEN** a client disconnects
- **THEN** the Gateway SHALL remove all subscriptions for that client
- **AND** forward unsubscriptions to appropriate backend servers

### Requirement: Subscription limits (NEW)
The Gateway SHALL enforce limits on the number of subscriptions per client.

#### Scenario: Maximum subscriptions per client
- **WHEN** a client attempts to exceed the configured subscription limit
- **THEN** the Gateway SHALL return an error with code `LimitExceeded`
- **AND** SHALL NOT create the subscription

### Requirement: Subscription proxy to backend (NEW)
The Gateway SHALL proxy subscription requests to backend servers that support them.

#### Scenario: Backend supports subscriptions
- **WHEN** a client subscribes to a resource and the backend supports subscriptions
- **THEN** the Gateway SHALL forward the subscription request to the backend

#### Scenario: Backend does not support subscriptions
- **WHEN** a client subscribes to a resource but the backend does not support subscriptions
- **THEN** the Gateway SHALL track the subscription locally
- **AND** SHALL NOT forward to the backend
- **AND** the resource update notifications from the backend WILL still be forwarded

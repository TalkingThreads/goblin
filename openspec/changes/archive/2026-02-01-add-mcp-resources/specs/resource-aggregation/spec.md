## ADDED Requirements

### Requirement: Resource Synchronization from Backend Server
The Gateway SHALL fetch available resources from each connected backend MCP server via `resources/list` and `resources/templates/list` methods.

#### Scenario: Fetch resources on server connection
- **WHEN** a backend MCP server connects to Goblin with resource capabilities
- **THEN** Goblin calls `client.listResources()` to retrieve available resources
- **AND** Goblin calls `client.listResourceTemplates()` to retrieve available templates
- **AND** each resource is stored in the registry with namespaced identifier
- **AND** each template is stored in the registry with server mapping
- **AND** the cached resource list is invalidated

#### Scenario: Fetch resources with pagination
- **WHEN** a backend server returns a cursor in `listResources` response
- **THEN** Goblin continues calling `listResources` with the cursor until no more resources
- **AND** all resources from all pages are aggregated

#### Scenario: Fetch resources with no resources
- **WHEN** a backend server has no resources to offer
- **THEN** Goblin receives an empty `resources` array
- **AND** no resources are added to the registry for that server

### Requirement: Resource Namespacing
The Gateway SHALL assign namespaced identifiers to resources to prevent URI collisions across multiple backend servers.

#### Scenario: Namespace resource URI
- **WHEN** a resource with URI `file:///logs/app.log` is received from `filesystem` server
- **THEN** the resource is stored with identifier `filesystem_file___logs_app.log`
- **AND** the namespaced identifier is used in all Gateway-to-client communications

#### Scenario: Preserve URI structure in namespacing
- **WHEN** a resource URI contains special characters
- **THEN** special characters are replaced with underscores
- **AND** multiple consecutive underscores are collapsed to single underscore
- **AND** the namespacing algorithm is reversible for template matching

#### Scenario: Multiple servers with same resource name
- **WHEN** `filesystem` server exposes `file:///config/app.json`
- **AND** `s3` server exposes `s3://bucket/config/app.json`
- **THEN** resources are stored with different namespaced identifiers
- **AND** clients can access both resources without collision

### Requirement: Resource Template Matching
The Gateway SHALL support RFC 6570 URI templates for dynamic resource access and correctly route requests to the appropriate backend server.

#### Scenario: Store resource template
- **WHEN** a backend server exposes a resource template with `uriTemplate: "mcp://database/{table}/{id}"`
- **THEN** the template is stored with server mapping
- **AND** the template is returned in `resources/templates/list` responses

#### Scenario: Match URI against template
- **WHEN** a client requests resource with namespaced URI matching a template pattern
- **THEN** the Gateway identifies the owning server from template mapping
- **AND** the request is routed to that backend server
- **AND** the original URI (with template variables) is used in the backend request

#### Scenario: Template with no match
- **WHEN** a client requests a URI that doesn't match any registered template
- **THEN** the Gateway returns a "resource not found" error
- **AND** no request is sent to any backend server

### Requirement: Resource List Request
The Gateway SHALL return aggregated resources from all connected backend servers in response to `resources/list` requests.

#### Scenario: List all aggregated resources
- **WHEN** a client sends `resources/list` request
- **THEN** Gateway returns all resources from all connected backend servers
- **AND** each resource includes: uri (namespaced), name, description, mimeType, size
- **AND** resources are sorted alphabetically by namespaced URI

#### Scenario: List resources with pagination
- **WHEN** a client sends `resources/list` request with cursor
- **THEN** Gateway returns resources starting from the cursor position
- **AND** response includes nextCursor if more resources exist

#### Scenario: List cached resource list
- **WHEN** a client sends `resources/list` request and cache is valid
- **THEN** Gateway returns cached response without backend queries

#### Scenario: Cache invalidation on list change
- **WHEN** any backend server sends `notifications/resources/list_changed`
- **THEN** Gateway re-syncs resources from that server
- **AND** the resource list cache is invalidated
- **AND** subsequent `resources/list` requests trigger fresh aggregation

### Requirement: Resource Read Request
The Gateway SHALL route resource read requests to the appropriate backend server and return the resource contents.

#### Scenario: Read namespaced resource
- **WHEN** a client sends `resources/read` request with namespaced URI `filesystem_file___logs_app.log`
- **THEN** Gateway looks up the resource in the registry
- **AND** Gateway extracts the original URI and server ID
- **AND** Gateway calls `client.readResource({ uri: originalUri })` on the appropriate backend
- **AND** Gateway returns the `contents` to the client

#### Scenario: Read non-existent resource
- **WHEN** a client requests a URI that doesn't exist in the registry
- **THEN** Gateway returns RESOURCE_NOT_FOUND error
- **AND** no backend request is made

#### Scenario: Read resource from template
- **WHEN** a client requests a URI matching a registered template
- **AND** the template resolves to a backend server
- **THEN** Gateway routes the request to that backend
- **AND** the resolved URI is used in the backend request

#### Scenario: Read resource with multi-modal content
- **WHEN** a backend returns resource contents with text and blob types
- **THEN** Gateway proxies both content types unchanged
- **AND** blob contents remain base64-encoded
- **AND** MIME types are preserved

### Requirement: Resource Template List Request
The Gateway SHALL return aggregated resource templates from all connected backend servers.

#### Scenario: List all aggregated templates
- **WHEN** a client sends `resources/templates/list` request
- **THEN** Gateway returns all resource templates from all connected backend servers
- **AND** each template includes: uriTemplate, name, description

#### Scenario: Cache template list
- **WHEN** a client sends `resources/templates/list` request
- **THEN** Gateway returns cached response if valid
- **AND** cache is invalidated when any backend sends template changes

### Requirement: Resource Subscription
The Gateway SHALL proxy resource subscriptions to backend servers and forward change notifications to subscribed clients.

#### Scenario: Subscribe to resource
- **WHEN** a client sends `resources/subscribe` request with namespaced URI
- **THEN** Gateway validates the resource exists
- **AND** Gateway calls `client.subscribeResource({ uri: originalUri })` on the owning backend
- **AND** Gateway tracks the subscription mapping (clientId → URI)

#### Scenario: Subscribe to non-existent resource
- **WHEN** a client attempts to subscribe to a non-existent resource
- **THEN** Gateway returns RESOURCE_NOT_FOUND error
- **AND** no backend subscription is made

#### Scenario: Unsubscribe from resource
- **WHEN** a client sends `resources/unsubscribe` request with namespaced URI
- **THEN** Gateway calls `client.unsubscribeResource({ uri: originalUri })` on the owning backend
- **AND** Gateway removes the subscription mapping

#### Scenario: Forward resource update notification
- **WHEN** a backend server sends `notifications/resources/updated` with a URI
- **AND** Gateway finds clients subscribed to that resource
- **THEN** Gateway sends `notifications/resources/updated` to each subscribed client
- **AND** the notification uses the namespaced URI

### Requirement: Resource Meta Tools
The Gateway SHALL provide meta tools for resource discovery, description, and search.

#### Scenario: Catalog resources with filter
- **WHEN** a client calls `catalog_resources` meta tool with optional serverId filter
- **THEN** returns compact resource cards with: uri, name, mimeType, size, serverId
- **AND** if serverId is provided, only resources from that server are returned

#### Scenario: Describe resource details
- **WHEN** a client calls `describe_resource` meta tool with namespaced URI
- **THEN** returns full resource definition including all metadata
- **AND** returns error if resource not found

#### Scenario: Search resources
- **WHEN** a client calls `search_resources` meta tool with query
- **AND** optional MIME type filter
- **THEN** returns compact resource cards matching the query
- **AND** results are sorted by relevance

#### Scenario: Catalog resource templates
- **WHEN** a client calls `catalog_resource_templates` meta tool
- **THEN** returns all resource templates with their URI patterns
- **AND** supports optional serverId filter

### Requirement: Resource Error Handling
The Gateway SHALL provide appropriate error codes and messages for resource operations.

#### Scenario: Resource not found
- **WHEN** a client requests a non-existent resource
- **THEN** Gateway returns error code `RESOURCE_NOT_FOUND`
- **AND** error message includes the requested URI

#### Scenario: Resource read error
- **WHEN** a backend server returns an error reading a resource
- **THEN** Gateway maps the error to appropriate Gateway error code
- **AND** error details are logged for debugging

#### Scenario: Subscription error
- **WHEN** a backend subscription fails
- **THEN** Gateway returns appropriate error to client
- **AND** subscription mapping is cleaned up

### Requirement: Resource Metrics
The Gateway SHALL track metrics for resource operations.

#### Scenario: Track resource read operations
- **WHEN** a client reads a resource
- **THEN** Gateway increments `mcpResourceReadsTotal` counter
- **AND** labels include: serverId, mimeType, success/failure

#### Scenario: Track subscription count
- **WHEN** a client subscribes to a resource
- **THEN** Gateway tracks active subscription count
- **AND** metrics are exposed at `/metrics` endpoint

### Requirement: Resource TUI Integration
The Gateway SHALL provide a TUI panel for resource management and visualization.

#### Scenario: Display resources panel
- **WHEN** the TUI is active
- **THEN** a Resources panel is available alongside Tools and Prompts panels
- **AND** the panel displays a list of all aggregated resources
- **AND** each resource shows: namespaced URI, name, MIME type, size

#### Scenario: Filter resources by server
- **WHEN** a user selects a server filter in the Resources panel
- **THEN** only resources from that server are displayed

#### Scenario: Search resources in TUI
- **WHEN** a user enters a search query in the Resources panel
- **THEN** resources matching the query are highlighted
- **AND** non-matching resources are filtered out

#### Scenario: View resource details
- **WHEN** a user selects a resource in the Resources panel
- **THEN** resource details are displayed in a side panel
- **AND** details include: full URI, description, metadata

#### Scenario: Display resource templates
- **WHEN** the Resources panel is active
- **AND** resource templates are available
- **THEN** templates are displayed in a separate section
- **AND** each template shows the URI pattern and description

# Integration Tests: Resource Management

This document defines the integration test specifications for resource management functionality in the Goblin MCP gateway.

## Overview

The Goblin MCP gateway provides a unified interface for accessing resources across multiple backend MCP servers. This specification covers integration tests for:

- File access through the gateway
- Resource caching
- Resource streaming
- Resource templates
- Resource subscriptions
- Cross-backend resource access

## Test Environment

### Prerequisites

- Goblin MCP gateway running in test mode
- At least two backend MCP servers registered
- Test file server with sample resources
- Network isolation for controlled testing

### Configuration

```yaml
test:
  gateway:
    host: "localhost"
    port: 3000
  backends:
    - name: "fileserver"
      type: "file-server"
      path: "/test/files"
    - name: "database"
      type: "resource-server"
      endpoint: "http://localhost:8081"
  cache:
    default_ttl: 300
    max_size: 1000
  streaming:
    chunk_size: 8192
    buffer_size: 65536
```

---

## File Access Through Gateway

### Scenario: Read File from Backend

**ID:** RES-FILE-001

**WHEN** client requests file resource from backend

**THEN** request SHALL be routed to correct backend

**AND** file content SHALL be returned to client

**AND** file metadata SHALL be preserved

#### Test Steps

1. Register backend file server with test directory
2. Create test file with known content and metadata
3. Client sends resource read request through gateway
4. Verify request routes to correct backend
5. Verify response contains correct file content
6. Verify metadata (size, modification date, type) preserved

#### Expected Results

- Resource request reaches correct backend server
- File content matches original exactly
- All metadata fields preserved in response
- Response time within acceptable threshold

#### Test Data

```typescript
const testFile = {
  path: "/test-files/document.txt",
  content: "Sample file content for testing",
  metadata: {
    size: 34,
    modificationTime: "2025-01-15T10:30:00Z",
    mimeType: "text/plain"
  }
};
```

#### Assertions

```typescript
expect(response.status).toBe(200);
expect(response.body).toEqual(testFile.content);
expect(response.headers["content-length"]).toBe(testFile.metadata.size);
expect(response.headers["content-type"]).toBe(testFile.metadata.mimeType);
```

---

### Scenario: File Access with Path Traversal Protection

**ID:** RES-FILE-002

**WHEN** client requests path with traversal attempt

**THEN** request SHALL be rejected

**AND** security event SHALL be logged

**AND** error SHALL be returned to client

#### Test Steps

1. Register backend file server
2. Client sends request with path traversal sequence
3. Verify request is rejected at gateway level
4. Verify security event is logged
5. Verify appropriate error returned to client

#### Test Cases

| Path Traversal Pattern | Expected Behavior |
|------------------------|-------------------|
| `../etc/passwd` | Blocked |
| `file/../../sensitive` | Blocked |
| `%2e%2e/etc/passwd` | Blocked |
| `file/./../../config` | Blocked |
| Valid nested path `subdir/file.txt` | Allowed |

#### Expected Results

- Path traversal attempts blocked before reaching backend
- Security audit log entry created
- HTTP 403 Forbidden returned
- Request does not reach backend

#### Assertions

```typescript
expect(response.status).toBe(403);
expect(response.body.error).toContain("path traversal");
expect(securityLogger.logs).toContainEqual(
  expect.objectContaining({
    event: "path_traversal_attempt",
    path: "../etc/passwd"
  })
);
```

---

### Scenario: File Not Found Handling

**ID:** RES-FILE-003

**WHEN** requested file does not exist

**THEN** not found error SHALL be returned

**AND** error SHALL indicate resource not found

#### Test Steps

1. Register backend file server
2. Client requests non-existent resource
3. Verify 404 response returned
4. Verify error message indicates resource not found
5. Verify backend returns appropriate error

#### Expected Results

- HTTP 404 Not Found response
- Error message identifies resource not found
- Gateway does not cache negative response (configurable)

#### Assertions

```typescript
expect(response.status).toBe(404);
expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
expect(response.body.error.resourcePath).toBe("/nonexistent/file.txt");
```

---

## Resource Caching

### Scenario: Resource Cached on First Read

**ID:** RES-CACHE-001

**WHEN** resource is read for first time

**THEN** content SHALL be cached

**AND** subsequent reads SHALL return cached content

**AND** cache SHALL respect TTL

#### Test Steps

1. Configure cache with known TTL
2. Read resource for first time
3. Verify cache miss on first request
4. Read same resource again
5. Verify cache hit on second request
6. Wait for TTL expiration
7. Verify cache miss after TTL

#### Expected Results

- First request fetches from backend
- Subsequent requests served from cache
- After TTL, requests fetch from backend again

#### Performance Metrics

| Request | Cache Status | Response Source |
|---------|-------------|-----------------|
| 1st | Miss | Backend |
| 2nd | Hit | Cache |
| 3rd | Hit | Cache |
| Post-TTL | Miss | Backend |

#### Assertions

```typescript
const firstRequest = await client.readResource("/test/file.txt");
expect(firstRequest.headers["x-cache-status"]).toBe("MISS");

const secondRequest = await client.readResource("/test/file.txt");
expect(secondRequest.headers["x-cache-status"]).toBe("HIT");
expect(secondRequest.body).toEqual(firstRequest.body);
```

---

### Scenario: Cache Invalidation on Resource Change

**ID:** RES-CACHE-002

**WHEN** backend notifies resource changed

**THEN** cache SHALL be invalidated

**AND** next read SHALL fetch fresh content

#### Test Steps

1. Read resource to populate cache
2. Backend sends cache invalidation notification
3. Verify resource marked as invalid
4. Read resource again
5. Verify fresh content fetched from backend

#### Expected Results

- Cache invalidation received from backend
- Cache entry marked stale
- Next read fetches fresh content
- Old cached content not served

#### Assertions

```typescript
await backend.notifyResourceChange("/test/file.txt");
const request = await client.readResource("/test/file.txt");
expect(request.headers["x-cache-status"]).toBe("MISS");
expect(request.body).toEqual(freshContent);
```

---

### Scenario: Cache Hit Improves Performance

**ID:** RES-CACHE-003

**WHEN** cached resource is read

**THEN** response time SHALL be faster

**AND** backend SHALL not be contacted

#### Test Steps

1. Measure baseline response time from backend
2. Populate cache with resource
3. Measure cached response time
4. Compare response times

#### Expected Results

- Cached response significantly faster (target: 10x faster)
- Backend not contacted for cached requests

#### Performance Thresholds

| Metric | Target |
|--------|--------|
| Cache hit response time | < 10ms |
| Backend response time | > 50ms |
| Improvement ratio | > 5x |

#### Assertions

```typescript
const backendTime = await measureResponseTime("/test/file.txt", uncached = true);
const cacheTime = await measureResponseTime("/test/file.txt", uncached = false);
expect(cacheTime).toBeLessThan(backendTime * 0.2);
expect(backendRequestCount).toBe(1); // Only initial request
```

---

## Resource Streaming

### Scenario: Large File Streaming

**ID:** RES-STREAM-001

**WHEN** client reads large resource

**THEN** content SHALL be streamed in chunks

**AND** memory usage SHALL remain bounded

**AND** client SHALL receive complete content

#### Test Steps

1. Create large test file (100MB+)
2. Configure streaming with chunk size
3. Client initiates resource read
4. Verify data received in chunks
5. Verify total content matches original
6. Monitor memory usage during transfer

#### Expected Results

- Data transferred in chunks (configurable size)
- Memory usage stays bounded (no full file in memory)
- Complete content received by client
- Transfer completes successfully

#### Assertions

```typescript
const stream = await client.streamResource("/test/large-file.dat");
let receivedBytes = 0;
for await (const chunk of stream) {
  receivedBytes += chunk.length;
  expect(memoryUsage()).toBeLessThan(maxMemoryThreshold);
}
expect(receivedBytes).toBe(fileSize);
```

---

### Scenario: Streaming Cancellation

**ID:** RES-STREAM-002

**WHEN** client cancels streaming mid-transfer

**THEN** streaming SHALL stop immediately

**AND** resources SHALL be released

**AND** backend SHALL be notified

#### Test Steps

1. Start streaming large resource
2. Cancel after partial transfer
3. Verify transfer stops immediately
4. Verify resources released (file handles, memory)
5. Verify backend receives cancellation notification

#### Expected Results

- Transfer stops within 100ms of cancellation
- All resources released
- Backend processing cancelled

#### Assertions

```typescript
const stream = await client.streamResource("/test/large-file.dat");
const reader = stream.getReader();

await reader.read(); // First chunk
await client.cancelStream();

expect(backend.isRequestActive("/test/large-file.dat")).toBe(false);
expect(openFileHandles).toBe(0);
```

---

### Scenario: Streaming with Progress

**ID:** RES-STREAM-003

**WHEN** streaming large resource

**THEN** progress SHALL be trackable

**AND** client MAY request progress information

#### Test Steps

1. Start streaming with progress tracking enabled
2. Receive chunks while monitoring progress
3. Verify progress updates are accurate
4. Test progress query API

#### Expected Results

- Progress information available during streaming
- Progress percentage calculated correctly
- Progress API returns current status

#### Progress API Response

```typescript
interface StreamProgress {
  resourceId: string;
  bytesReceived: number;
  totalBytes: number;
  percentage: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
}
```

#### Assertions

```typescript
const progress = await client.getStreamProgress(requestId);
expect(progress.percentage).toBeGreaterThan(0);
expect(progress.percentage).toBeLessThanOrEqual(100);
expect(progress.bytesReceived).toBeGreaterThan(0);
```

---

## Resource Templates

### Scenario: Template Expansion

**ID:** RES-TEMPLATE-001

**WHEN** client uses resource template

**THEN** template SHALL be expanded with parameters

**AND** matching resources SHALL be returned

**AND** expansion SHALL be validated

#### Test Steps

1. Register resources matching template pattern
2. Client submits template with parameters
3. Verify template expansion
4. Verify matching resources returned
5. Verify invalid parameters rejected

#### Template Pattern

```typescript
interface ResourceTemplate {
  pattern: "files/{project}/{type}/{filename}";
  parameters: {
    project: string;
    type: string;
    filename: string;
  };
}
```

#### Expected Results

- Template parameters validated
- Pattern matched against available resources
- Matching resources returned
- Expansion respects template constraints

#### Assertions

```typescript
const result = await client.expandTemplate({
  pattern: "files/{project}/{type}/{filename}",
  parameters: {
    project: "project-alpha",
    type: "documents",
    filename: "*.txt"
  }
});
expect(result.resources).toContain("files/project-alpha/documents/readme.txt");
expect(result.resources).not.toContain("files/other-project/docs/file.txt");
```

---

### Scenario: Template with Multiple Matches

**ID:** RES-TEMPLATE-002

**WHEN** template matches multiple resources

**THEN** all matching resources SHALL be returned

**AND** results SHALL be ordered consistently

#### Test Steps

1. Create multiple resources matching pattern
2. Request template expansion
3. Verify all matches returned
4. Verify consistent ordering (alphabetical by default)

#### Expected Results

- All matching resources included
- Results consistently ordered
- Pagination works for large result sets

#### Assertions

```typescript
const result = await client.expandTemplate({
  pattern: "files/{project}/*",
  parameters: { project: "project-alpha" }
});
expect(result.resources.length).toBe(5);
expect(result.resources).toEqual(result.resources.sort());
```

---

### Scenario: Invalid Template Parameters

**ID:** RES-TEMPLATE-003

**WHEN** template parameters are invalid

**THEN** validation error SHALL be returned

**AND** error SHALL indicate parameter issues

#### Test Cases

| Invalid Parameter | Error Type |
|-------------------|-----------|
| Missing required parameter | VALIDATION_ERROR |
| Invalid parameter format | VALIDATION_ERROR |
| Parameter too long | VALIDATION_ERROR |
| Invalid characters | VALIDATION_ERROR |

#### Expected Results

- Validation error returned immediately
- Error identifies specific parameter issue
- No backend request made

#### Assertions

```typescript
try {
  await client.expandTemplate({
    pattern: "files/{project}/{filename}",
    parameters: { project: null, filename: "test.txt" }
  });
  fail("Expected validation error");
} catch (error) {
  expect(error.code).toBe("VALIDATION_ERROR");
  expect(error.parameter).toBe("project");
}
```

---

## Resource Subscriptions

### Scenario: Subscribe to Resource Changes

**ID:** RES-SUB-001

**WHEN** client subscribes to resource

**THEN** subscription SHALL be registered

**AND** client SHALL receive update notifications

**AND** subscription SHALL expire after timeout

#### Test Steps

1. Client creates subscription for resource
2. Verify subscription registered
3. Wait for subscription timeout
4. Verify subscription expired

#### Subscription Lifecycle

```typescript
const subscription = await client.subscribe({
  resourcePattern: "files/{project}/*",
  notificationUrl: "http://client/notifications",
  expiresInSeconds: 300
});

expect(subscription.id).toBeDefined();
expect(subscription.expiresAt).toBeDefined();
```

#### Expected Results

- Subscription created with unique ID
- Subscription includes expiration time
- Notifications sent to configured URL
- Subscription removed after expiration

#### Assertions

```typescript
const subscription = await client.subscribe(resourceSubscription);
expect(subscription.status).toBe("ACTIVE");
expect(subscription.expiresAt.getTime()).toBeGreaterThan(Date.now());
```

---

### Scenario: Resource Update Notification

**ID:** RES-SUB-002

**WHEN** subscribed resource changes

**THEN** client SHALL receive notification

**AND** notification SHALL include update details

**AND** client MAY refresh resource

#### Test Steps

1. Client subscribes to resource
2. Backend resource changes
3. Client receives notification
4. Verify notification contains update details

#### Notification Payload

```typescript
interface ResourceUpdateNotification {
  type: "RESOURCE_UPDATE";
  subscriptionId: string;
  resourceUri: string;
  changeType: "CREATED" | "MODIFIED" | "DELETED";
  timestamp: string;
  metadata?: {
    newVersion?: string;
    etag?: string;
  };
}
```

#### Expected Results

- Notification received within latency threshold
- Notification contains resource URI
- Notification identifies change type

#### Assertions

```typescript
const notification = await client.waitForNotification(subscriptionId);
expect(notification.type).toBe("RESOURCE_UPDATE");
expect(notification.resourceUri).toBe(expectedUri);
expect(notification.changeType).toBe("MODIFIED");
```

---

### Scenario: Unsubscribe from Resource

**ID:** RES-SUB-003

**WHEN** client unsubscribes from resource

**THEN** subscription SHALL be removed

**AND** no further notifications SHALL be sent

**AND** cleanup SHALL be performed

#### Test Steps

1. Client creates subscription
2. Client unsubscribes
3. Resource changes
4. Verify no notification sent
5. Verify subscription removed

#### Expected Results

- Unsubscribe succeeds immediately
- No further notifications delivered
- Resources cleaned up

#### Assertions

```typescript
await client.unsubscribe(subscriptionId);
await backend.notifyResourceChange(resourceUri);
expect(await client.hasNotification(subscriptionId, timeout = 1000)).toBe(false);
```

---

## Cross-Backend Resource Access

### Scenario: Resource Redirect Between Backends

**ID:** RES-CROSS-001

**WHEN** client requests resource from wrong backend

**THEN** request SHALL be redirected

**AND** client SHALL receive correct resource

**AND** redirection SHALL be transparent

#### Test Steps

1. Configure multiple backends with different resources
2. Client requests resource from non-owner backend
3. Verify redirect response
4. Verify client receives resource (via redirect)

#### Expected Results

- Gateway identifies correct backend
- Redirect response with correct backend URI
- Client successfully retrieves resource

#### Assertions

```typescript
const response = await client.requestResource("/other-backend/file.txt");
expect(response.status).toBe(307);
expect(response.headers["location"]).toBe("http://correct-backend/resources/file.txt");
```

---

### Scenario: Resource Aggregation from Multiple Backends

**ID:** RES-CROSS-002

**WHEN** listing resources across backends

**THEN** all resources SHALL be aggregated

**AND** duplicates SHALL be handled

**AND** results SHALL be unified view

#### Test Steps

1. Configure multiple backends with resources
2. Request resource list
3. Verify all resources included
4. Verify duplicate handling
5. Verify unified response format

#### Expected Results

- Resources from all backends included
- Duplicates identified or deduplicated
- Results in consistent format
- Pagination works across backends

#### Aggregation Response

```typescript
interface AggregatedResourceList {
  resources: Resource[];
  backends: {
    [backendId]: {
      count: number;
      included: boolean;
    };
  };
  totalCount: number;
  duplicates: number;
}
```

#### Assertions

```typescript
const list = await client.listResources({ aggregate: true });
expect(list.resources.length).toBeGreaterThan(backends[0].resources.length);
expect(list.backends[backend1].included).toBe(true);
expect(list.backends[backend2].included).toBe(true);
```

---

## Test Data Management

### Sample Resources

#### File Resources

| Path | Size | Type | Content |
|------|------|------|---------|
| `/files/documents/readme.txt` | 256B | text/plain | Sample text |
| `/files/images/logo.png` | 4KB | image/png | Binary data |
| `/files/data/large.bin` | 100MB | application/octet-stream | Random bytes |

#### Resource Templates

| Pattern | Parameters | Expected Matches |
|---------|------------|------------------|
| `files/{project}/*` | project=alpha | 3 files |
| `files/*/{filename}` | filename=*.txt | 2 files |
| `api/{version}/users/*` | version=v1 | 10 endpoints |

### Resource Lifecycle

```typescript
interface TestResource {
  id: string;
  uri: string;
  backend: string;
  content: Buffer;
  metadata: ResourceMetadata;
  lastModified: Date;
  etag: string;
}
```

---

## Performance Requirements

### Response Time Targets

| Operation | Target P95 | Target P99 |
|-----------|-----------|-----------|
| Resource read (cached) | < 10ms | < 50ms |
| Resource read (uncached) | < 100ms | < 500ms |
| Template expansion | < 50ms | < 200ms |
| Subscription notification | < 100ms | < 500ms |

### Throughput Targets

| Metric | Target |
|--------|--------|
| Concurrent streams | 100 |
| Cache hit ratio | > 80% |
| Subscription throughput | 1000 notifications/sec |

---

## Security Requirements

### Authentication

- All resource requests require valid authentication
- Subscriptions require authentication
- Resource access logged for audit

### Authorization

- Resource access respects backend authorization
- Path traversal attempts blocked
- Invalid subscription attempts rejected

### Audit Logging

```typescript
interface AuditLogEntry {
  timestamp: string;
  action: "READ" | "WRITE" | "SUBSCRIBE" | "UNSUBSCRIBE";
  resourceUri: string;
  clientId: string;
  backendId: string;
  success: boolean;
  errorCode?: string;
}
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| RESOURCE_NOT_FOUND | 404 | Resource does not exist |
| BACKEND_ERROR | 502 | Backend server error |
| CACHE_ERROR | 500 | Cache operation failed |
| VALIDATION_ERROR | 400 | Invalid request parameters |
| SUBSCRIPTION_EXPIRED | 410 | Subscription no longer valid |
| PERMISSION_DENIED | 403 | Access denied |

### Error Response Format

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: {
    resourceUri?: string;
    backendId?: string;
    parameter?: string;
  };
  requestId: string;
  timestamp: string;
}
```

---

## Implementation Notes

### Test Framework

- Use Jest for test execution
- Use Supertest for HTTP assertions
- Use Testcontainers for backend isolation

### Test Isolation

- Each test runs in isolated environment
- Resources cleaned up after each test
- Cache cleared between test suites

### CI/CD Integration

- Run on every PR
- Performance tests run nightly
- Full integration suite runs on main branch

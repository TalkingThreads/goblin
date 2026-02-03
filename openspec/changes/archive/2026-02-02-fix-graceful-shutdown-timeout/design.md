# Technical Design: Graceful Shutdown Timeout Fix

## Overview

Fix the graceful shutdown mechanism to properly wait for in-flight requests before closing connections.

## Current Implementation Issues

### HttpGateway.stop() - src/gateway/http.ts
```typescript
async stop(): Promise<void> {
  if (this.server) {
    logger.info("Stopping HTTP server");
    await this.server.stop(); // No argument = graceful, waits for in-flight requests
    this.server = null;
  }
}
```

**Problems:**
1. The `activeRequests` counter is decremented in middleware's `finally` block before response is fully sent
2. No mechanism to wait for active requests during shutdown
3. Race condition between request starting and shutdown triggering

## Proposed Solution

### 1. Improved Request Tracking

Move request tracking to properly cover the full request lifecycle:

```typescript
// Request tracking middleware - place BEFORE response handling
this.app.use("*", async (c, next) => {
  this.activeRequests++;
  logger.debug({ activeRequests: this.activeRequests }, "Request started");
  
  try {
    await next();
  } finally {
    // Decrement AFTER response is fully prepared
    this.activeRequests--;
    logger.debug({ activeRequests: this.activeRequests }, "Request completed");
    
    // Resolve shutdown promise if waiting and no more active requests
    if (this.activeRequests === 0 && this.shutdownResolver) {
      this.shutdownResolver();
      this.shutdownResolver = null;
    }
  }
});
```

### 2. Enhanced stop() Method

```typescript
private shutdownResolver: (() => void) | null = null;

async stop(): Promise<void> {
  if (this.server) {
    logger.info({ activeRequests: this.activeRequests }, "Stopping HTTP server");
    
    // If there are active requests, wait for them to complete
    if (this.activeRequests > 0) {
      logger.info({ activeRequests: this.activeRequests }, "Waiting for in-flight requests");
      
      await new Promise<void>((resolve) => {
        this.shutdownResolver = resolve;
        // Timeout after 5 seconds to prevent indefinite wait
        setTimeout(() => {
          if (this.shutdownResolver) {
            logger.warn("Shutdown timeout reached, forcing stop");
            this.shutdownResolver();
            this.shutdownResolver = null;
          }
        }, 5000);
      });
    }
    
    await this.server.stop();
    this.server = null;
    logger.info("HTTP server stopped");
  }
}
```

### 3. Alternative: Use Bun's Built-in Graceful Shutdown

Bun.serve() has built-in support for graceful shutdown. The `stop()` method without arguments waits for in-flight requests:

```typescript
async stop(): Promise<void> {
  if (this.server) {
    logger.info("Stopping HTTP server gracefully");
    await this.server.stop(); // Waits for in-flight requests by default
    this.server = null;
  }
}
```

However, this may not work correctly if connections aren't properly tracked. We need to ensure:
1. SSE connections are handled properly (they're long-lived)
2. Active HTTP requests are tracked correctly

## Implementation Approach

**Option A: Fix Request Tracking (Recommended)**
- Fix the request tracking middleware timing
- Add shutdown promise mechanism
- Ensure proper cleanup

**Option B: Simplify with Bun's Built-in**
- Remove custom request tracking
- Rely on Bun.serve's graceful shutdown
- May need to handle SSE connections specially

## Decision

Go with **Option A** because:
1. Gives us more control over the shutdown process
2. Allows for proper logging and monitoring
3. Handles edge cases like SSE connections
4. Provides timeout protection

## Files to Modify

1. **src/gateway/http.ts**
   - Fix request tracking middleware timing
   - Add shutdown promise mechanism
   - Update stop() method

2. **tests/smoke/startup/graceful.test.ts**
   - Increase delay from 10ms to 100ms for request establishment
   - Add better assertions

## Testing

Run the graceful shutdown tests:
```bash
bun test tests/smoke/startup/graceful.test.ts
```

Expected result: All tests pass, including "should wait for in-flight requests"

## 1. Router Implementation
- [x] 1.1 Implement `Router` class in `src/gateway/router.ts`
- [x] 1.2 Inject `Registry`, `TransportPool`, and `Config` in constructor
- [x] 1.3 Implement `route(toolName, args)` method
- [x] 1.4 Add timeout logic using `AbortSignal` (if SDK supports) or `Promise.race`

## 2. Integration
- [x] 2.1 Export Router from `src/gateway/index.ts`
- [x] 2.2 Initialize Router in `src/index.ts`

## 3. Testing
- [x] 3.1 Add unit tests for successful routing
- [x] 3.2 Add unit tests for unknown tools
- [x] 3.3 Add unit tests for timeouts

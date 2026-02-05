# Infrastructure Modules

These modules provide the foundational infrastructure for all RPCs.

## Modules

### 1. Core (`core.js`)
- Structured JSON logging with traceId
- RPC middleware framework
- Error handling and codes
- Module verification

**Location in index.js:** PRs #1 sections (~lines 1-3000)

### 2. Rate Limiting (`rate-limiting.js`)
- Per-RPC rate limits
- Preset configurations (READ, WRITE, SENSITIVE, ADMIN)
- Sliding window algorithm
- Distributed support (PR #6)

**Location in index.js:** PR #2 section

### 3. Caching (`caching.js`)
- In-memory caching
- TTL presets (SHORT: 30s, MEDIUM: 2m, LONG: 5m, VERY_LONG: 10m, STATIC: 1h)
- Cache invalidation on writes
- Key pattern support

**Location in index.js:** PR #4 section

### 4. Idempotency (`idempotency.js`)
- Prevent duplicate operations
- Transaction deduplication
- Reward claim protection
- Configurable TTL

**Location in index.js:** PR #3 section

### 5. Validation (`validation.js`)
- Input validation schemas
- Type checking
- Range validation
- Pattern matching (UUID, email, etc.)

**Location in index.js:** PR #5 section

### 6. Security (`security.js`)
- Score validation with bounds
- Wallet amount validation
- Atomic operations with rollback
- Audit logging
- Anomaly detection

**Location in index.js:** PR #6 section

## Usage Pattern

All RPCs can be wrapped with infrastructure middleware:

```javascript
var wrappedRpc = myRpcHandler;

// Add validation
if (globalThis.Validation) {
    wrappedRpc = globalThis.Validation.withValidation(wrappedRpc, 'rpc_name', schema);
}

// Add rate limiting
if (globalThis.RateLimiting) {
    wrappedRpc = globalThis.RateLimiting.withPresetRateLimit(wrappedRpc, 'rpc_name', 'READ');
}

// Add caching (for read operations)
if (globalThis.Caching) {
    wrappedRpc = globalThis.Caching.withCache(wrappedRpc, 'rpc_name', TTL.MEDIUM);
}

// Add idempotency (for write operations)
if (globalThis.Idempotency) {
    wrappedRpc = globalThis.Idempotency.withIdempotency(wrappedRpc, 'rpc_name', { ttlSeconds: 86400 });
}

// Register
initializer.registerRpc('rpc_name', wrappedRpc);
```

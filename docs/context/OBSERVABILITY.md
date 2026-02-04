# Observability - Logging, Metrics, Tracing

**Last Updated:** 2026-02-04  
**Status:** Basic Logging Only

---

## Current Logging State

### Format

**Current:** String concatenation  
**Example:**
```javascript
logger.info("[PlayerMetadata:" + requestId + "] RPC called");
logger.error("[PlayerMetadata:" + requestId + "] User not authenticated");
```

**Gap:** Not structured JSON, no traceId, no metrics.

### Request ID Pattern

**Current:** `generateShortUUID()` used in some RPCs (not standardized)  
**Location:** `data/modules/index.js` line 568

**Example:**
```javascript
var requestId = generateShortUUID();
logger.info("[PlayerMetadata:" + requestId + "] RPC called");
```

**Gap:** Not propagated, not in response, not correlated across RPCs.

---

## Structured Logging Schema

### Target Log Format

```json
{
  "timestamp": "2026-02-04T12:34:56.789Z",
  "level": "info|warn|error",
  "traceId": "abc123-def456-ghi789",
  "rpcName": "wallet_update_global",
  "userId": "user-uuid",
  "gameId": "game-uuid",
  "requestId": "short-uuid",
  "latencyMs": 45,
  "result": "success|error",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "message": "Human-readable message",
  "metadata": {
    "cacheHit": false,
    "storageReads": 2,
    "storageWrites": 1
  }
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| **error** | Errors that require attention |
| **warn** | Warnings (rate limits, validation failures) |
| **info** | Normal operations (RPC calls, completions) |
| **debug** | Detailed debugging (cache hits, storage operations) |

---

## TraceId Propagation

### Current State

**Status:** ❌ No traceId propagation

### Implementation Pattern

```javascript
function withTracing(rpcFunction, rpcName) {
    return function(ctx, logger, nk, payload) {
        var traceId = ctx.traceId || generateTraceId();
        var startTime = Date.now();
        
        // Add traceId to context
        ctx.traceId = traceId;
        
        // Log start
        logStructured(logger, {
            level: "info",
            traceId: traceId,
            rpcName: rpcName,
            userId: ctx.userId,
            event: "rpc_start"
        });
        
        try {
            var result = rpcFunction(ctx, logger, nk, payload);
            var latency = Date.now() - startTime;
            var parsed = JSON.parse(result);
            
            // Log success
            logStructured(logger, {
                level: "info",
                traceId: traceId,
                rpcName: rpcName,
                userId: ctx.userId,
                latencyMs: latency,
                result: parsed.success ? "success" : "error",
                event: "rpc_complete"
            });
            
            // Add traceId to response
            parsed.traceId = traceId;
            return JSON.stringify(parsed);
            
        } catch (err) {
            var latency = Date.now() - startTime;
            
            // Log error
            logStructured(logger, {
                level: "error",
                traceId: traceId,
                rpcName: rpcName,
                userId: ctx.userId,
                latencyMs: latency,
                result: "error",
                error: err.message,
                event: "rpc_error"
            });
            
            throw err;
        }
    };
}
```

### TraceId Generation

```javascript
function generateTraceId() {
    // Format: timestamp-random
    var timestamp = Date.now().toString(36);
    var random = Math.random().toString(36).substring(2, 9);
    return timestamp + "-" + random;
}
```

---

## Metrics Collection

### Current State

**Status:** ❌ No metrics collection

### Metrics to Track

| Metric | Type | Tags | Purpose |
|--------|------|------|---------|
| `rpc_count` | Counter | `rpc_name`, `result` | RPC call count |
| `rpc_latency_ms` | Histogram | `rpc_name`, `result` | RPC latency |
| `rpc_cache_hit` | Counter | `rpc_name` | Cache hit count |
| `rpc_cache_miss` | Counter | `rpc_name` | Cache miss count |
| `storage_reads` | Counter | `collection` | Storage read count |
| `storage_writes` | Counter | `collection` | Storage write count |
| `rate_limit_hits` | Counter | `rpc_name`, `user_id` | Rate limit violations |
| `idempotency_hits` | Counter | `rpc_name` | Idempotency key matches |

### Metrics Implementation

**File:** `data/modules/core/metrics.js` (to be created)

```javascript
var metrics = {
    rpcCount: {},
    rpcLatency: {},
    cacheHits: {},
    cacheMisses: {}
};

function trackRpcMetric(rpcName, latency, cacheHit, result) {
    // Increment counters
    metrics.rpcCount[rpcName] = (metrics.rpcCount[rpcName] || 0) + 1;
    
    // Track latency
    if (!metrics.rpcLatency[rpcName]) {
        metrics.rpcLatency[rpcName] = [];
    }
    metrics.rpcLatency[rpcName].push(latency);
    
    // Track cache
    if (cacheHit) {
        metrics.cacheHits[rpcName] = (metrics.cacheHits[rpcName] || 0) + 1;
    } else {
        metrics.cacheMisses[rpcName] = (metrics.cacheMisses[rpcName] || 0) + 1;
    }
}

function getMetrics() {
    return {
        rpcCount: metrics.rpcCount,
        rpcLatency: calculatePercentiles(metrics.rpcLatency),
        cacheHitRate: calculateCacheHitRate(metrics.cacheHits, metrics.cacheMisses)
    };
}
```

### Prometheus Export

**Target:** Expose metrics at `/metrics` endpoint (Nakama supports Prometheus)

**Format:**
```
# HELP rpc_count_total Total RPC calls
# TYPE rpc_count_total counter
rpc_count_total{rpc_name="wallet_update_global",result="success"} 1234

# HELP rpc_latency_ms RPC latency in milliseconds
# TYPE rpc_latency_ms histogram
rpc_latency_ms_bucket{rpc_name="wallet_update_global",le="50"} 800
rpc_latency_ms_bucket{rpc_name="wallet_update_global",le="100"} 950
rpc_latency_ms_bucket{rpc_name="wallet_update_global",le="200"} 1000
```

---

## Structured Logging Implementation

### Helper Function

**File:** `data/modules/core/logger.js` (to be created)

```javascript
function logStructured(logger, data) {
    var logEntry = {
        timestamp: new Date().toISOString(),
        level: data.level || "info",
        traceId: data.traceId || "unknown",
        rpcName: data.rpcName || "unknown",
        userId: data.userId || null,
        gameId: data.gameId || null,
        requestId: data.requestId || null,
        latencyMs: data.latencyMs || null,
        result: data.result || null,
        errorCode: data.errorCode || null,
        message: data.message || null,
        metadata: data.metadata || {}
    };
    
    var logString = JSON.stringify(logEntry);
    
    switch (data.level) {
        case "error":
            logger.error(logString);
            break;
        case "warn":
            logger.warn(logString);
            break;
        case "debug":
            logger.debug(logString);
            break;
        default:
            logger.info(logString);
    }
}
```

### Usage in RPCs

```javascript
function rpcWalletUpdateGlobal(ctx, logger, nk, payload) {
    var traceId = ctx.traceId || generateTraceId();
    var startTime = Date.now();
    
    logStructured(logger, {
        level: "info",
        traceId: traceId,
        rpcName: "wallet_update_global",
        userId: ctx.userId,
        event: "rpc_start"
    });
    
    // ... RPC logic ...
    
    var latency = Date.now() - startTime;
    
    logStructured(logger, {
        level: "info",
        traceId: traceId,
        rpcName: "wallet_update_global",
        userId: ctx.userId,
        latencyMs: latency,
        result: "success",
        metadata: {
            cacheHit: false,
            storageReads: 1,
            storageWrites: 1
        },
        event: "rpc_complete"
    });
    
    return JSON.stringify({
        success: true,
        traceId: traceId,
        // ... response data
    });
}
```

---

## Dashboard Requirements

### Grafana Dashboard Panels

1. **RPC Performance**
   - P50/P95/P99 latency by RPC
   - RPC call count by RPC
   - Error rate by RPC

2. **Cache Performance**
   - Cache hit rate by RPC
   - Cache miss rate by RPC
   - Cache size

3. **Storage Performance**
   - Storage reads/writes per second
   - Storage operations by collection
   - Storage latency

4. **Security Metrics**
   - Rate limit violations
   - Idempotency key matches
   - Failed validations

5. **Business Metrics**
   - Daily active users (DAU)
   - Wallet operations per second
   - Reward claims per second

---

## Error Tracking

### Current State

**Status:** ❌ No error aggregation

### Error Categories

| Category | Examples | Alert Threshold |
|----------|----------|-----------------|
| **Validation Errors** | Invalid UUID, missing fields | >5% of requests |
| **Rate Limit Errors** | Rate limit exceeded | >1% of requests |
| **Storage Errors** | Storage read/write failures | >0.1% of requests |
| **Business Logic Errors** | Insufficient balance, already claimed | >1% of requests |

### Error Aggregation

**Target:** Aggregate errors by:
- Error code
- RPC name
- User ID (for abuse detection)
- Time window

---

## Observability Checklist

### Phase 1: Structured Logging (Week 1)

- [ ] Create `core/logger.js` with structured logging
- [ ] Add traceId generation
- [ ] Add traceId propagation
- [ ] Migrate 5 critical RPCs to structured logging
- [ ] Add traceId to responses

### Phase 2: Metrics (Week 2)

- [ ] Create `core/metrics.js`
- [ ] Track per-RPC metrics (count, latency)
- [ ] Track cache metrics
- [ ] Track storage metrics
- [ ] Expose Prometheus metrics

### Phase 3: Dashboards (Week 3)

- [ ] Create Grafana dashboard
- [ ] Add RPC performance panels
- [ ] Add cache performance panels
- [ ] Add security metrics panels

### Phase 4: Error Tracking (Week 4)

- [ ] Add error aggregation
- [ ] Add error alerting
- [ ] Add error categorization

---

**See Also:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [RPC_CATALOG.md](./RPC_CATALOG.md) - RPCs requiring observability

# Performance Playbook - Caching & Optimization

**Last Updated:** 2026-02-04  
**Status:** Infrastructure Exists, Not Wired

---

## Caching Infrastructure

### Current State

**File:** `data/modules/infrastructure/caching.js`  
**Status:** ⚠️ Code exists, NOT wired to any RPCs  
**Storage:** In-memory (should use Redis in production)

### Cache TTL Matrix

| Data Type | TTL (seconds) | Invalidation Trigger | Current Usage |
|-----------|---------------|---------------------|---------------|
| **Leaderboard Records** | 60 | Leaderboard write | ❌ NO |
| **Player Profile** | 300 | Profile update | ❌ NO |
| **Achievement Definitions** | 600 | Achievement create/update | ❌ NO |
| **Wallet Balance** | 30 | Wallet update | ❌ NO |
| **Tournament List** | 120 | Tournament create/join | ❌ NO |
| **Daily Rewards Status** | 300 | Daily reward claim | ❌ NO |
| **Daily Missions** | 300 | Mission progress/claim | ❌ NO |
| **Game Registry** | 3600 | Registry sync | ❌ NO |

**Current Cache Hit Rate:** 0% (no caching enabled)

**Target Cache Hit Rate:** >80% for read RPCs

---

## Caching Implementation Plan

### Phase 1: Wire Caching to Read RPCs

#### High-Priority RPCs (Week 1)

| RPC Name | Cache Key Pattern | TTL | Invalidation |
|----------|-------------------|-----|--------------|
| `get_time_period_leaderboard` | `leaderboard_{gameId}_{period}` | 60s | Score submission |
| `wallet_get_all` | `wallet_{userId}` | 30s | Wallet update |
| `daily_rewards_get_status` | `daily_rewards_{userId}_{gameId}` | 300s | Daily reward claim |
| `get_daily_missions` | `missions_{userId}_{gameId}` | 300s | Mission progress |
| `get_player_metadata` | `profile_{userId}` | 300s | Profile update |
| `get_all_leaderboards` | `all_leaderboards_{userId}_{gameId}` | 60s | Score submission |

### Phase 2: Cache Invalidation

**Pattern:** Invalidate cache on writes

```javascript
function invalidateCache(pattern) {
    cacheClearByPattern(pattern);
}

// Example: After wallet update
invalidateCache("wallet_" + userId + ".*");
```

### Phase 3: Distributed Caching (Production)

**Current:** In-memory (single server)  
**Target:** Redis (distributed)

**Migration:**
1. Replace in-memory cache with Redis client
2. Use Redis TTL for automatic expiration
3. Use Redis pub/sub for cache invalidation across servers

---

## Batch Operations

### Current Infrastructure

**File:** `data/modules/infrastructure/batch_operations.js`  
**Status:** ✅ Registered but minimal usage

**RPCs:**
- `batch_execute` - Generic batch RPC calls
- `batch_wallet_operations` - Optimized wallet batch
- `batch_achievement_progress` - Batch achievement updates

### Usage Patterns

**Current:** Minimal  
**Target:** Use for:
- Multiple wallet updates in one call
- Multiple achievement progress updates
- Multiple leaderboard submissions

---

## Query Optimization

### Storage Read Patterns

#### N+1 Query Problem

**Example:** `get_all_leaderboards` reads multiple leaderboards sequentially.

**Current:**
```javascript
for (var i = 0; i < leaderboardIds.length; i++) {
    var records = nk.leaderboardRecordsList(leaderboardIds[i]);  // N queries
}
```

**Optimized:**
```javascript
// Batch leaderboard reads (if Nakama supports)
// Or use caching to reduce reads
```

### Storage Write Patterns

**Current:** Individual writes  
**Target:** Batch writes where possible

```javascript
// Instead of:
nk.storageWrite([{ collection: "wallets", ... }]);
nk.storageWrite([{ collection: "transaction_logs", ... }]);

// Use:
nk.storageWrite([
    { collection: "wallets", ... },
    { collection: "transaction_logs", ... }
]);
```

---

## Performance Targets

| Metric | Current | Target | Strategy |
|--------|---------|--------|----------|
| **P50 Latency** | ~100ms | <50ms | Caching + optimization |
| **P99 Latency** | ~500ms | <200ms | Batch operations + caching |
| **Cache Hit Rate** | 0% | >80% | Wire caching to read RPCs |
| **DB Queries/Request** | 5-10 | 1-3 | Batching + caching |
| **Storage Reads/Request** | 3-5 | 1-2 | Caching |

---

## Caching Strategy by RPC Category

### Read-Heavy RPCs (Cache Immediately)

| RPC Category | TTL | Invalidation |
|--------------|-----|--------------|
| Leaderboards | 60s | Score submission |
| Wallets | 30s | Wallet update |
| Profiles | 300s | Profile update |
| Daily Status | 300s | Claim operations |
| Game Registry | 3600s | Registry sync |

### Write-Heavy RPCs (No Caching)

| RPC Category | Strategy |
|--------------|----------|
| Currency Updates | Rate limiting + idempotency |
| Reward Claims | Rate limiting + idempotency |
| Score Submissions | Rate limiting |

---

## Cache Key Generation

### Standard Patterns

```javascript
var CacheKeys = {
    // User-specific
    userGame: function(userId, gameId) {
        return userId + "_" + gameId;
    },
    
    // Leaderboard
    leaderboard: function(gameId, period) {
        return "leaderboard_" + gameId + "_" + period;
    },
    
    // Wallet
    wallet: function(userId) {
        return "wallet_" + userId;
    },
    
    // Profile
    profile: function(userId) {
        return "profile_" + userId;
    }
};
```

---

## Performance Monitoring

### Metrics to Track

| Metric | Collection Method |
|--------|-------------------|
| **Cache Hit Rate** | Per-RPC cache stats |
| **Cache Miss Rate** | Per-RPC cache stats |
| **Average Latency** | Per-RPC timing |
| **P99 Latency** | Per-RPC timing |
| **Storage Read Count** | Per-RPC storage operations |
| **Storage Write Count** | Per-RPC storage operations |

### Implementation

**File:** `data/modules/core/metrics.js` (to be created)

```javascript
function trackRpcMetrics(rpcName, latency, cacheHit, storageReads, storageWrites) {
    // Log to structured logger or metrics system
    logger.info(JSON.stringify({
        rpc: rpcName,
        latencyMs: latency,
        cacheHit: cacheHit,
        storageReads: storageReads,
        storageWrites: storageWrites,
        timestamp: new Date().toISOString()
    }));
}
```

---

## Optimization Checklist

### Phase 1: Enable Caching (Week 1)

- [ ] Wire caching to `get_time_period_leaderboard`
- [ ] Wire caching to `wallet_get_all`
- [ ] Wire caching to `daily_rewards_get_status`
- [ ] Wire caching to `get_daily_missions`
- [ ] Wire caching to `get_player_metadata`
- [ ] Add cache invalidation on writes

### Phase 2: Batch Operations (Week 2)

- [ ] Optimize `get_all_leaderboards` with batching
- [ ] Optimize wallet reads with batching
- [ ] Optimize storage writes with batching

### Phase 3: Query Optimization (Week 3)

- [ ] Audit N+1 query patterns
- [ ] Optimize storage read patterns
- [ ] Add database indices (if needed)

### Phase 4: Distributed Caching (Production)

- [ ] Migrate to Redis
- [ ] Implement cache invalidation via pub/sub
- [ ] Add cache monitoring dashboard

---

**See Also:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [RPC_CATALOG.md](./RPC_CATALOG.md) - RPCs requiring caching

# Execution Plan - AAA Production-Ready Transformation

**Last Updated:** 2026-02-04  
**Status:** Ready for Implementation  
**Timeline:** 14 weeks (aligned with Master Plan)

---

## Master Plan Acceptance Criteria Summary

### Must Not Miss Requirements

1. **Security:**
   - ✅ Idempotency for all currency/reward operations (13 RPCs)
   - ✅ Rate limiting on all write/sensitive RPCs
   - ✅ Input validation framework
   - ✅ Admin authorization checks

2. **Performance:**
   - ✅ Caching for all read RPCs (>80% hit rate target)
   - ✅ Batch operations where applicable
   - ✅ Reduce DB queries per request (5-10 → 1-3)

3. **Observability:**
   - ✅ Structured JSON logging with traceId
   - ✅ Per-RPC metrics (count, latency, errors)
   - ✅ Prometheus metrics export

4. **Code Quality:**
   - ✅ Modularize monolithic `index.js` (<500 lines per module)
   - ✅ Schema versioning for all storage objects
   - ✅ 80%+ test coverage

5. **Backward Compatibility:**
   - ✅ No breaking RPC name/signature changes
   - ✅ Compatibility layers for any changes
   - ✅ Migration scripts for schema changes

---

## PR-Sized Implementation Slices

### PR #1: Foundation - RPC Registry & Structured Logging (Week 1)

**Goal:** Create central RPC registry and structured logging infrastructure WITHOUT changing business logic.

**Files Created:**
- `data/modules/core/logger.js` - Structured logging helper
- `data/modules/core/rpc_registry.js` - Central RPC registry
- `data/modules/core/middleware.js` - Middleware wrapper framework

**Files Modified:**
- `data/modules/index.js` - Wire middleware to 5 test RPCs only

**RPCs Impacted:**
- `wallet_get_all` (test structured logging)
- `daily_rewards_get_status` (test structured logging)
- `get_time_period_leaderboard` (test structured logging)
- `wallet_update_global` (test middleware wrapper)
- `daily_rewards_claim` (test middleware wrapper)

**Changes:**
1. Create `core/logger.js` with `logStructured()` function
2. Create `core/rpc_registry.js` with RPC metadata registry
3. Create `core/middleware.js` with `withMiddleware()` wrapper
4. Add traceId generation and propagation
5. Wrap 5 test RPCs with middleware (logging only, no rate limiting/idempotency yet)

**Testing:**
- Verify structured logs appear in Nakama logs
- Verify traceId in responses
- Verify no breaking changes to RPC behavior

**Rollback Plan:**
- Remove middleware wrappers from 5 test RPCs
- Keep core files (no impact if unused)

**Estimated Effort:** 2-3 days

---

### PR #2: Wire Rate Limiting (Week 1-2)

**Goal:** Wire existing rate limiting infrastructure to all write RPCs.

**Files Modified:**
- `data/modules/index.js` - Wrap write RPCs with rate limiting
- `data/modules/infrastructure/rate_limiting.js` - Minor fixes if needed

**RPCs Impacted:**
- All 13 sensitive currency/reward RPCs
- All other write RPCs (~100 total)

**Changes:**
1. Import `withPresetRateLimit` from `infrastructure/rate_limiting.js`
2. Wrap all write RPCs with `withPresetRateLimit(handler, rpcName, "WRITE")`
3. Wrap read RPCs with `withPresetRateLimit(handler, rpcName, "READ")`
4. Wrap social RPCs with `withPresetRateLimit(handler, rpcName, "SOCIAL")`

**Testing:**
- Test rate limiting by calling RPC rapidly
- Verify rate limit errors returned correctly
- Verify normal usage not affected

**Rollback Plan:**
- Remove rate limiting wrappers
- RPCs return to original behavior

**Estimated Effort:** 1-2 days

---

### PR #3: Idempotency Infrastructure (Week 2)

**Goal:** Create idempotency infrastructure and apply to critical RPCs.

**Files Created:**
- `data/modules/core/idempotency.js` - Idempotency key management

**Files Modified:**
- `data/modules/index.js` - Wrap 13 critical RPCs with idempotency

**RPCs Impacted:**
- `wallet_update_global`
- `wallet_update_game_wallet`
- `daily_rewards_claim`
- `claim_mission_reward`
- `rewarded_ad_claim`
- `season_pass_claim_reward`
- `weekly_goals_claim_reward`
- `monthly_milestones_claim_reward`
- `tournament_claim_rewards`
- `onboarding_claim_welcome_bonus`
- `retention_claim_welcome_bonus`
- `winback_claim_rewards`
- `achievements_unlock`

**Changes:**
1. Create idempotency key storage collection
2. Create `withIdempotency()` middleware
3. Wrap 13 critical RPCs
4. Add idempotency key to transaction logs

**Testing:**
- Test duplicate calls return same result
- Test idempotency key expiration (24h TTL)
- Verify no duplicate currency/rewards granted

**Rollback Plan:**
- Remove idempotency wrappers
- Keep idempotency infrastructure (no impact if unused)

**Estimated Effort:** 3-4 days

---

### PR #4: Wire Caching to Read RPCs (Week 2-3)

**Goal:** Wire existing caching infrastructure to read-heavy RPCs.

**Files Modified:**
- `data/modules/index.js` - Wrap read RPCs with caching
- `data/modules/infrastructure/caching.js` - Add cache invalidation helpers

**RPCs Impacted:**
- `get_time_period_leaderboard`
- `wallet_get_all`
- `daily_rewards_get_status`
- `get_daily_missions`
- `get_player_metadata`
- `get_all_leaderboards`

**Changes:**
1. Import `withCache` from `infrastructure/caching.js`
2. Wrap read RPCs with caching
3. Add cache invalidation on writes
4. Add cache key generators

**Testing:**
- Verify cache hits on repeated calls
- Verify cache invalidation on writes
- Measure cache hit rate

**Rollback Plan:**
- Remove caching wrappers
- RPCs return to direct storage reads

**Estimated Effort:** 2-3 days

---

### PR #5: Input Validation Framework (Week 3)

**Goal:** Create centralized input validation framework.

**Files Created:**
- `data/modules/core/validation.js` - Validation schemas and functions

**Files Modified:**
- `data/modules/index.js` - Migrate RPCs to use validation framework

**RPCs Impacted:**
- All RPCs (gradual migration)

**Changes:**
1. Create validation schemas for common patterns (gameId, currency, amount)
2. Create `validateSchema()` function
3. Migrate 10 RPCs to use validation framework
4. Document validation patterns

**Testing:**
- Test validation failures return proper error codes
- Test valid inputs pass validation
- Verify no breaking changes

**Rollback Plan:**
- Revert to ad-hoc validation
- Keep validation framework (no impact if unused)

**Estimated Effort:** 2-3 days

---

### PR #6: Schema Versioning - Add Fields (Week 4)

**Goal:** Add `schemaVersion` field to all storage objects.

**Files Created:**
- `data/modules/core/migrations.js` - Migration framework
- `docs/context/SCHEMA_VERSIONS.md` - Schema version history

**Files Modified:**
- `data/modules/index.js` - Add `schemaVersion: 1` to all storage writes

**Collections Impacted:**
- All storage collections (30+)

**Changes:**
1. Create `CURRENT_SCHEMA_VERSIONS` constant
2. Add `schemaVersion: 1` to all new storage writes
3. Create migration runner framework
4. Create backfill script for existing records

**Testing:**
- Verify new records have `schemaVersion: 1`
- Test backfill script on test data
- Verify no breaking changes

**Rollback Plan:**
- Remove `schemaVersion` from writes (backward compatible)
- Keep migration framework (no impact if unused)

**Estimated Effort:** 3-4 days

---

### PR #7: Metrics Collection (Week 4-5)

**Goal:** Add per-RPC metrics collection.

**Files Created:**
- `data/modules/core/metrics.js` - Metrics tracking

**Files Modified:**
- `data/modules/index.js` - Add metrics tracking to all RPCs

**Changes:**
1. Create metrics collection functions
2. Track per-RPC: count, latency, cache hits, storage ops
3. Expose metrics via RPC: `get_metrics` (admin)
4. Integrate with Prometheus (if available)

**Testing:**
- Verify metrics collected correctly
- Test metrics RPC
- Verify no performance impact

**Rollback Plan:**
- Remove metrics tracking
- Keep metrics infrastructure (no impact if unused)

**Estimated Effort:** 2-3 days

---

### PR #8-14: Modularization (Weeks 5-8)

**Goal:** Split monolithic `index.js` into domain modules.

**Strategy:** Gradual extraction with compatibility layer

**Approach:**
1. Extract domain module (e.g., `domains/wallet/wallet.rpc.js`)
2. Keep original functions in `index.js` as wrappers
3. Verify all RPCs still work
4. Remove duplicate code from `index.js`
5. Repeat for each domain

**Domains to Extract:**
- Wallet (5 RPCs)
- Daily Rewards (2 RPCs)
- Daily Missions (3 RPCs)
- Leaderboards (10 RPCs)
- Friends (6 RPCs)
- Groups (5 RPCs)
- Push Notifications (3 RPCs)
- Achievements (4 RPCs)
- Onboarding (11 RPCs)
- Retention (20 RPCs)
- Progression (7 RPCs)
- Rewarded Ads (4 RPCs)
- Quiz Results (4 RPCs)
- Chat (7 RPCs)

**Estimated Effort:** 3-4 weeks (1 domain per PR)

---

## Priority Order

### Week 1: Foundation
1. ✅ PR #1: RPC Registry & Structured Logging
2. ✅ PR #2: Wire Rate Limiting

### Week 2: Security
3. ✅ PR #3: Idempotency Infrastructure
4. ✅ PR #4: Wire Caching

### Week 3: Quality
5. ✅ PR #5: Input Validation Framework
6. ✅ PR #6: Schema Versioning

### Week 4: Observability
7. ✅ PR #7: Metrics Collection

### Weeks 5-8: Modularization
8-14. ✅ PR #8-14: Domain Extraction

---

## First PR Details: Foundation

### PR Title
**"Add RPC Registry, Structured Logging, and Middleware Framework"**

### Goal
Create infrastructure for rate limiting, idempotency, and observability WITHOUT changing business logic.

### Files to Create

#### `data/modules/core/logger.js`
```javascript
/**
 * Structured JSON logging helper
 */

function generateTraceId() {
    var timestamp = Date.now().toString(36);
    var random = Math.random().toString(36).substring(2, 9);
    return timestamp + "-" + random;
}

function logStructured(logger, data) {
    var logEntry = {
        timestamp: new Date().toISOString(),
        level: data.level || "info",
        traceId: data.traceId || "unknown",
        rpcName: data.rpcName || "unknown",
        userId: data.userId || null,
        gameId: data.gameId || null,
        requestId: data.requestId || generateTraceId(),
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logStructured, generateTraceId };
}
```

#### `data/modules/core/rpc_registry.js`
```javascript
/**
 * Central RPC registry for metadata and configuration
 */

var RPC_REGISTRY = {
    // Example entries (will be populated)
    "wallet_update_global": {
        name: "wallet_update_global",
        handler: null,  // Set during registration
        readWrite: "WRITE",
        sensitive: true,
        rateLimitPreset: "WRITE",
        idempotencyRequired: true,
        validationSchema: ["currency", "amount", "operation"],
        storageCollections: ["wallets", "transaction_logs"],
        caching: false
    },
    "wallet_get_all": {
        name: "wallet_get_all",
        handler: null,
        readWrite: "READ",
        sensitive: false,
        rateLimitPreset: "READ",
        idempotencyRequired: false,
        validationSchema: [],
        storageCollections: ["wallets"],
        caching: true,
        cacheTTL: 30
    }
    // ... more entries
};

function registerRpc(name, handler, metadata) {
    if (!RPC_REGISTRY[name]) {
        RPC_REGISTRY[name] = {
            name: name,
            handler: handler,
            readWrite: metadata.readWrite || "READ",
            sensitive: metadata.sensitive || false,
            rateLimitPreset: metadata.rateLimitPreset || "STANDARD",
            idempotencyRequired: metadata.idempotencyRequired || false,
            validationSchema: metadata.validationSchema || [],
            storageCollections: metadata.storageCollections || [],
            caching: metadata.caching || false,
            cacheTTL: metadata.cacheTTL || 60
        };
    } else {
        RPC_REGISTRY[name].handler = handler;
    }
}

function getRpcMetadata(name) {
    return RPC_REGISTRY[name] || null;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { registerRpc, getRpcMetadata, RPC_REGISTRY };
}
```

#### `data/modules/core/middleware.js`
```javascript
/**
 * Middleware wrapper framework for RPCs
 * Enables: logging, rate limiting, idempotency, validation, caching
 */

// Import dependencies (will be available in consolidated index.js)
// var { logStructured, generateTraceId } = require('./logger');
// var { withRateLimit } = require('../infrastructure/rate_limiting');
// var { withCache } = require('../infrastructure/caching');

function withMiddleware(rpcFunction, rpcName, metadata) {
    return function(ctx, logger, nk, payload) {
        var traceId = ctx.traceId || generateTraceId();
        ctx.traceId = traceId;
        
        var startTime = Date.now();
        
        // Log start
        logStructured(logger, {
            level: "info",
            traceId: traceId,
            rpcName: rpcName,
            userId: ctx.userId,
            event: "rpc_start"
        });
        
        try {
            // Execute RPC (with rate limiting, idempotency, caching applied later)
            var result = rpcFunction(ctx, logger, nk, payload);
            var latency = Date.now() - startTime;
            var parsed = JSON.parse(result);
            
            // Log completion
            logStructured(logger, {
                level: parsed.success ? "info" : "warn",
                traceId: traceId,
                rpcName: rpcName,
                userId: ctx.userId,
                gameId: parsed.gameId || null,
                latencyMs: latency,
                result: parsed.success ? "success" : "error",
                errorCode: parsed.errorCode || null,
                event: "rpc_complete"
            });
            
            // Add traceId to response
            parsed.traceId = traceId;
            return JSON.stringify(parsed);
            
        } catch (err) {
            var latency = Date.now() - startTime;
            
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
            
            return JSON.stringify({
                success: false,
                error: err.message,
                traceId: traceId
            });
        }
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { withMiddleware };
}
```

### Files to Modify

#### `data/modules/index.js`

**Changes:**
1. Add core modules at top (inline or via require pattern)
2. Wrap 5 test RPCs with `withMiddleware()`:
   - `wallet_get_all`
   - `daily_rewards_get_status`
   - `get_time_period_leaderboard`
   - `wallet_update_global`
   - `daily_rewards_claim`

**Example Change:**
```javascript
// Before:
initializer.registerRpc('wallet_get_all', rpcWalletGetAll);

// After:
var wrappedWalletGetAll = withMiddleware(rpcWalletGetAll, 'wallet_get_all', {
    readWrite: 'READ',
    caching: true,
    cacheTTL: 30
});
initializer.registerRpc('wallet_get_all', wrappedWalletGetAll);
```

### Testing Plan

1. **Unit Tests:**
   - Test `logStructured()` outputs valid JSON
   - Test `generateTraceId()` generates unique IDs
   - Test middleware wrapper preserves RPC behavior

2. **Integration Tests:**
   - Call 5 test RPCs via Unity client
   - Verify structured logs appear in Nakama logs
   - Verify traceId in responses
   - Verify no breaking changes

3. **Smoke Tests:**
   - Verify all 175+ RPCs still register
   - Verify server starts without errors
   - Verify no performance degradation

### Rollback Plan

1. Remove middleware wrappers from 5 test RPCs
2. Keep core files (they're not used if wrappers removed)
3. Revert `index.js` changes

### Success Criteria

- ✅ Structured JSON logs appear in Nakama logs
- ✅ traceId in RPC responses
- ✅ No breaking changes to RPC behavior
- ✅ All existing RPCs still work
- ✅ No performance degradation

---

## Technical Decisions

### 1. Bundler Choice: None (V8 Runtime)

**Decision:** No bundler needed. Nakama V8 JavaScript runtime doesn't support ES Modules, so we use inline consolidation.

**Justification:**
- `index.js` is already consolidated (18,785 lines)
- No `require()` or `import` support
- All code must be inlined or loaded via Nakama's module system

**Alternative Considered:** esbuild/Rollup - Not compatible with V8 runtime.

---

### 2. Testing Framework: Jest (Recommended)

**Decision:** Use Jest for unit/integration tests.

**Justification:**
- Industry standard
- Good mocking support
- Can test JavaScript modules independently

**Setup:**
```bash
npm init -y
npm install --save-dev jest
```

**Test Structure:**
```
data/modules/
├── core/
│   ├── logger.js
│   └── logger.test.js
├── infrastructure/
│   ├── rate_limiting.js
│   └── rate_limiting.test.js
```

---

### 3. Schema Version Strategy: Integer + Migration Runner

**Decision:** Use integer schema versions (1, 2, 3...) with migration runner.

**Justification:**
- Simple and clear
- Easy to increment
- Migration runner handles upgrades automatically

**Alternative Considered:** Semantic versioning (1.0.0) - Too complex for storage schemas.

---

### 4. Idempotency Key Strategy: Client-Provided with Server Fallback

**Decision:** Accept `idempotencyKey` from client, generate if missing.

**Justification:**
- Client-provided allows retry logic
- Server fallback ensures idempotency even without client support
- Backward compatible (optional field)

**Storage:** `idempotency_keys` collection with 24h TTL

---

### 5. Rate Limiting Policy: Preset-Based

**Decision:** Use preset categories (WRITE/READ/AUTH/etc.) with configurable limits.

**Justification:**
- Matches existing infrastructure
- Easy to apply consistently
- Can adjust limits per preset

**Storage:** In-memory (migrate to Redis for production)

---

## Risk Mitigation

### High-Risk Items

| Risk | Mitigation |
|------|------------|
| **Breaking Changes** | Compatibility layers, gradual rollout, extensive testing |
| **Rate Limiting Blocks Legitimate Users** | Start with generous limits, monitor and adjust |
| **Caching Stale Data** | Short TTLs initially, proper invalidation |
| **Idempotency Breaks Clients** | Make idempotency key optional initially |
| **Modularization Breaks RPCs** | Keep wrappers, test thoroughly, gradual extraction |

---

## Next Steps

1. **Review this execution plan**
2. **Approve PR #1 (Foundation)**
3. **Begin implementation of PR #1**
4. **Test PR #1 thoroughly**
5. **Proceed to PR #2 (Rate Limiting)**

---

**See Also:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [RPC_CATALOG.md](./RPC_CATALOG.md) - Complete RPC inventory
- [NAKAMA_BACKEND_MASTER_PLAN.md](../../NAKAMA_BACKEND_MASTER_PLAN.md) - Master plan

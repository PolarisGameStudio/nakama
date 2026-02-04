# Nakama Backend Architecture

**Last Updated:** 2026-02-04  
**Version:** 1.0  
**Status:** Discovery Complete

---

## System Overview

This is a **monolithic Nakama 3.x JavaScript runtime module** with 175+ RPCs consolidated into a single `index.js` file (~18,785 lines). The system provides multi-game backend services for Unity game clients.

### Runtime Entry Point

**File:** `data/modules/index.js`  
**Function:** `InitModule(ctx, logger, nk, initializer)`  
**Location:** Lines 18118-18899

All RPCs are registered in `InitModule()` via `initializer.registerRpc(name, handler)` calls.

---

## Request Flow

```
Unity Client (C#)
    ↓ HTTP/gRPC
Nakama Server (Go)
    ↓ JavaScript Runtime (V8)
index.js InitModule()
    ↓ RPC Handler Function
Business Logic
    ↓ Storage/Leaderboard APIs
CockroachDB/PostgreSQL
```

### RPC Handler Signature

```javascript
function rpcName(ctx, logger, nk, payload) {
    // ctx.userId - Authenticated user ID
    // logger - Structured logger
    // nk - Nakama runtime context (storage, leaderboards, etc.)
    // payload - JSON string
    // Returns: JSON string response
}
```

---

## Domain Boundaries

### Existing Domain Modules (Partially Modularized)

| Domain | Location | Status | RPCs |
|--------|----------|--------|------|
| **Identity** | `data/modules/identity.js` | ✅ Separate | 3 |
| **Daily Rewards** | `data/modules/daily_rewards/daily_rewards.js` | ✅ Separate | 2 |
| **Daily Missions** | `data/modules/daily_missions/daily_missions.js` | ✅ Separate | 3 |
| **Wallet** | `data/modules/wallet/wallet.js` | ✅ Separate | 5 |
| **Analytics** | `data/modules/analytics/analytics.js` | ✅ Separate | 1 |
| **Friends** | `data/modules/friends/friends.js` | ✅ Separate | 6 |
| **Groups** | `data/modules/groups/groups.js` | ✅ Separate | 5 |
| **Push Notifications** | `data/modules/push_notifications/push_notifications.js` | ✅ Separate | 3 |
| **Achievements** | `data/modules/achievements/achievements.js` | ✅ Separate | 4 |
| **Matchmaking** | `data/modules/matchmaking/matchmaking.js` | ✅ Separate | 5 |
| **Tournaments** | `data/modules/tournaments/tournaments.js` | ✅ Separate | 6 |
| **Onboarding** | `data/modules/onboarding/onboarding.js` | ✅ Separate | 11 |
| **Retention** | `data/modules/retention/*.js` | ✅ Separate | 20+ |
| **Progression** | `data/modules/progression/*.js` | ✅ Separate | 7 |
| **Rewarded Ads** | `data/modules/rewarded_ads/rewarded_ads.js` | ✅ Separate | 4 |
| **Quiz Results** | `data/modules/quiz_results/quiz_results.js` | ✅ Separate | 4 |
| **Copilot** | `data/modules/copilot/*.js` | ✅ Separate | 9 |
| **Infrastructure** | `data/modules/infrastructure/*.js` | ⚠️ Exists but NOT wired | 6 |

### Monolithic Code in index.js

**~18,785 lines** containing:
- Duplicate implementations of domain logic
- Inline helper functions
- Consolidated utility functions
- All RPC handlers (even those with separate modules)

**Problem:** Domain modules exist but their code is **duplicated** in `index.js`. The separate files are not imported/used.

---

## Infrastructure Utilities (Not Wired)

### 1. Caching (`infrastructure/caching.js`)

**Status:** ⚠️ Code exists, NOT wired to any RPCs

**Functions:**
- `cacheSet(key, value, ttlSeconds)`
- `cacheGet(key)`
- `cacheDelete(key)`
- `withCache(rpcFunction, rpcName, ttlSeconds, cacheKeyGenerator)`

**TTL Presets:**
- LEADERBOARD: 60s
- PROFILE: 300s
- ACHIEVEMENT_DEFINITIONS: 600s
- WALLET: 30s
- TOURNAMENT_LIST: 120s
- DAILY_REWARDS: 300s

**Usage:** None. No RPCs currently use caching.

---

### 2. Rate Limiting (`infrastructure/rate_limiting.js`)

**Status:** ⚠️ Code exists, NOT wired to any RPCs

**Functions:**
- `checkRateLimit(userId, rpcName, maxCalls, windowSeconds)`
- `withRateLimit(rpcFunction, rpcName, maxCalls, windowSeconds)`
- `withPresetRateLimit(rpcFunction, rpcName, preset)`

**Presets:**
- STANDARD: 100/min
- WRITE: 30/min
- READ: 200/min
- AUTH: 10/min
- SOCIAL: 50/min
- ADMIN: 1000/min
- EXPENSIVE: 20/min

**Usage:** None. No RPCs currently use rate limiting.

---

### 3. Batch Operations (`infrastructure/batch_operations.js`)

**Status:** ✅ Registered but minimal usage

**RPCs:**
- `batch_execute` - Generic batch RPC calls
- `batch_wallet_operations` - Optimized wallet batch
- `batch_achievement_progress` - Batch achievement updates

---

## Storage Patterns

### Collections Identified

| Collection | Purpose | Key Pattern | User Scope |
|------------|---------|-------------|------------|
| `player_metadata` | Player identity/profile | `user_identity` | User |
| `wallets` | Per-game wallets | `wallet_{userId}_{gameId}` | User |
| `global_wallets` | Cross-game wallet | `global_wallet_{userId}` | User |
| `daily_streaks` | Daily reward streaks | `user_daily_streak_{userId}_{gameId}` | User |
| `mission_progress` | Daily mission progress | `mission_progress_{userId}_{gameId}` | User |
| `quiz_results_{gameId}` | Quiz attempt results | `{userId}_{timestamp}` | User |
| `friend_invites` | Friend requests | `{fromUserId}_{targetUserId}_{timestamp}` | User |
| `push_endpoints` | Push notification tokens | `push_endpoint_{userId}_{gameId}_{platform}` | User |
| `leaderboards_registry` | Leaderboard metadata | `all_created` | System |
| `rewarded_ad_claims` | Ad reward claims | `{userId}_{timestamp}` | User |
| `transaction_logs` | Wallet transaction history | `transaction_log_{userId}_{timestamp}` | User |
| `analytics_events` | Event tracking | `event_{userId}_{gameId}_{timestamp}` | User |

**Note:** No `schemaVersion` fields found in storage objects. Migration strategy needed.

---

## Authentication & Authorization

### Authentication
- **Device ID:** Primary method (`AuthenticateDeviceAsync`)
- **Email:** Supported (`AuthenticateEmailAsync`)
- **Custom ID:** Supported (`AuthenticateCustomAsync`)
- **Cognito:** Supported via wallet mapping RPCs

### Authorization
- **User Context:** `ctx.userId` available in all RPCs
- **Admin RPCs:** No explicit admin checks found (security gap)
- **Game Isolation:** Via `gameId` UUID parameter

---

## Multi-Game Architecture

### Game ID Pattern
- **Format:** UUID v4 (e.g., `126bf539-dae2-4bcf-964d-316c0fa1f92b`)
- **Validation:** `isValidUUID()` helper function
- **Storage Keys:** Include `gameId` for isolation

### Default Game IDs
- **QuizVerse:** `126bf539-dae2-4bcf-964d-316c0fa1f92b`
- **LastToLive:** Various (game-specific RPCs)

---

## Logging Patterns

### Current State
- **Format:** String concatenation (not structured JSON)
- **Request IDs:** `generateShortUUID()` used in some RPCs (not standardized)
- **Correlation:** No `traceId` propagation
- **Metrics:** No per-RPC latency/metrics tracking

### Example Current Logging
```javascript
logger.info("[PlayerMetadata:" + requestId + "] RPC called");
logger.error("[PlayerMetadata:" + requestId + "] User not authenticated");
```

**Gap:** Not structured JSON, no traceId, no metrics.

---

## Error Handling

### Current Pattern
```javascript
function handleError(ctx, err, message) {
    return JSON.stringify({
        success: false,
        error: message
    });
}
```

**Gap:** No error codes, no error categorization, no retry guidance.

---

## Critical Security Gaps

1. **No Idempotency:** Currency/reward mutations can be duplicated
2. **No Rate Limiting:** Infrastructure exists but not wired
3. **No Input Validation Framework:** Ad-hoc validation per RPC
4. **No Admin Checks:** Admin RPCs don't verify admin status
5. **No Schema Versioning:** Storage migrations not supported

---

## Performance Characteristics

### Current State
- **Caching:** 0% of RPCs use caching
- **Batch Operations:** Minimal usage
- **N+1 Queries:** Likely present (needs audit)
- **Storage Reads:** Direct `nk.storageRead()` calls (no batching)

### Target State (Master Plan)
- **Caching:** 80%+ hit rate on read RPCs
- **Rate Limiting:** All write RPCs protected
- **Idempotency:** All currency/reward operations
- **Batch Patterns:** Where applicable

---

## Deployment Assumptions

### Docker Compose
- **Database:** CockroachDB (default) or PostgreSQL
- **Nakama:** Official Docker image `registry.heroiclabs.com/heroiclabs/nakama:3.30.0`
- **Modules:** Mounted from `./data/modules` → `/nakama/data/modules`

### Environment Variables
- `GOOGLE_MAPS_API_KEY` - For geolocation resolution
- `PUSH_LAMBDA_URL` - AWS Lambda for push notifications (optional)
- `PUSH_SEND_URL` - AWS Lambda for sending pushes (optional)

### Ports
- `7349` - gRPC API
- `7350` - HTTP API (Unity connects here)
- `7351` - Console/Admin UI

---

## Next Steps (From Master Plan)

1. **Modularization:** Split `index.js` into domain modules
2. **Wire Infrastructure:** Enable caching + rate limiting
3. **Add Idempotency:** Currency/reward operations
4. **Structured Logging:** JSON logs with traceId
5. **Schema Versioning:** Add `schemaVersion` to all storage objects
6. **Validation Framework:** Centralized input validation
7. **Metrics:** Per-RPC latency/error tracking

---

**See Also:**
- [RPC_CATALOG.md](./RPC_CATALOG.md) - Complete RPC inventory
- [STORAGE_CATALOG.md](./STORAGE_CATALOG.md) - Storage schema details
- [SECURITY_MODEL.md](./SECURITY_MODEL.md) - Security policies

# Security Model

**Last Updated:** 2026-02-04  
**Status:** Critical Gaps Identified

---

## Current Security State

### ✅ Implemented

1. **Authentication:** Nakama built-in (device, email, custom, Cognito)
2. **User Context:** `ctx.userId` available in all RPCs
3. **Storage Permissions:** Server-only writes (`permissionWrite: 0`)
4. **Input Sanitization:** Some RPCs sanitize strings (ad-hoc)

### ❌ Critical Gaps

1. **No Idempotency:** Currency/reward mutations vulnerable to duplicates
2. **No Rate Limiting:** Infrastructure exists but NOT wired
3. **No Input Validation Framework:** Ad-hoc validation per RPC
4. **No Admin Checks:** Admin RPCs don't verify admin status
5. **No Request Signing:** No HMAC/request signature validation

---

## Rate Limiting Policy

### Infrastructure Status

**File:** `data/modules/infrastructure/rate_limiting.js`  
**Status:** ⚠️ Code exists, NOT wired to any RPCs

### Rate Limit Presets

| Category | Max Calls | Window | RPCs Affected |
|----------|-----------|--------|---------------|
| **WRITE** | 30/min | 60s | All currency/reward mutations |
| **READ** | 200/min | 60s | Leaderboards, profiles, status |
| **AUTH** | 10/min | 60s | Authentication RPCs |
| **SOCIAL** | 50/min | 60s | Friends, chat, invites |
| **ADMIN** | 1000/min | 60s | Admin operations |
| **EXPENSIVE** | 20/min | 60s | Matchmaking, tournaments |

### Implementation Plan

**Phase 1:** Wire rate limiting to critical RPCs:
- `wallet_update_global` → WRITE
- `wallet_update_game_wallet` → WRITE
- `daily_rewards_claim` → WRITE
- `rewarded_ad_claim` → WRITE
- All other write RPCs → WRITE

**Phase 2:** Wire to read RPCs:
- `get_time_period_leaderboard` → READ
- `wallet_get_all` → READ
- `get_player_metadata` → READ

**Phase 3:** Wire to social RPCs:
- `send_friend_invite` → SOCIAL
- `friends_challenge_user` → SOCIAL
- Chat RPCs → SOCIAL

---

## Idempotency Policy

### Critical RPCs Requiring Idempotency

| RPC Name | Current Status | Priority |
|----------|----------------|----------|
| `wallet_update_global` | ❌ NO | P0 |
| `wallet_update_game_wallet` | ❌ NO | P0 |
| `daily_rewards_claim` | ❌ NO | P0 |
| `claim_mission_reward` | ❌ NO | P0 |
| `rewarded_ad_claim` | ❌ NO | P0 |
| `season_pass_claim_reward` | ❌ NO | P0 |
| `weekly_goals_claim_reward` | ❌ NO | P0 |
| `monthly_milestones_claim_reward` | ❌ NO | P0 |
| `tournament_claim_rewards` | ❌ NO | P0 |
| `onboarding_claim_welcome_bonus` | ❌ NO | P0 |
| `retention_claim_welcome_bonus` | ❌ NO | P0 |
| `winback_claim_rewards` | ❌ NO | P0 |
| `achievements_unlock` | ❌ NO | P0 |

**Total:** 13 RPCs requiring immediate idempotency protection.

### Idempotency Key Strategy

**Option 1: Client-Provided (Recommended)**
```javascript
{
  idempotencyKey: "uuid",  // Client generates
  // ... other payload fields
}
```

**Option 2: Server-Generated Fallback**
```javascript
// If client doesn't provide, generate from:
// userId + rpcName + payloadHash + timestamp
```

**Storage:** Store idempotency keys in `idempotency_keys` collection:
```javascript
{
  key: "idempotency_{idempotencyKey}",
  userId: "uuid",
  rpcName: "string",
  result: {},  // Cached response
  createdAt: "ISO8601",
  expiresAt: "ISO8601"  // 24h TTL
}
```

### Implementation Pattern

```javascript
function withIdempotency(rpcFunction, rpcName) {
    return function(ctx, logger, nk, payload) {
        var data = JSON.parse(payload);
        var idempotencyKey = data.idempotencyKey || generateIdempotencyKey(ctx, rpcName, payload);
        
        // Check if already processed
        var existing = checkIdempotency(nk, logger, idempotencyKey);
        if (existing) {
            logger.info("[Idempotency] Returning cached result for " + idempotencyKey);
            return JSON.stringify(existing.result);
        }
        
        // Execute RPC
        var result = rpcFunction(ctx, logger, nk, payload);
        var parsed = JSON.parse(result);
        
        // Store idempotency key if successful
        if (parsed.success) {
            storeIdempotencyKey(nk, logger, idempotencyKey, ctx.userId, rpcName, parsed);
        }
        
        return result;
    };
}
```

---

## Input Validation Policy

### Current State

**Status:** ⚠️ Ad-hoc validation per RPC

**Example Pattern:**
```javascript
var validation = validatePayload(data, ['gameId', 'currency', 'amount']);
if (!validation.valid) {
    return handleError(ctx, null, "Missing required fields: " + validation.missing.join(", "));
}
```

**Gap:** No centralized validation framework, no schema definitions.

### Validation Framework Proposal

**File:** `data/modules/core/validation.js`

```javascript
var ValidationSchemas = {
    gameId: {
        required: true,
        type: "string",
        validator: isValidUUID,
        error: "Invalid gameId UUID format"
    },
    currency: {
        required: true,
        type: "string",
        enum: ["xut", "xp", "tokens", "game"],
        error: "Invalid currency"
    },
    amount: {
        required: true,
        type: "number",
        min: 0,
        error: "Amount must be non-negative number"
    }
};

function validateSchema(data, schema) {
    // Centralized validation logic
}
```

### Validation Requirements by RPC Category

| Category | Required Fields | Validation Rules |
|----------|----------------|------------------|
| **Wallet Updates** | `gameId`, `currency`, `amount`, `operation` | UUID, enum, number, enum |
| **Reward Claims** | `gameId` | UUID |
| **Score Submission** | `gameId`, `score` | UUID, number >= 0 |
| **Leaderboard Queries** | `gameId`, `period` | UUID, enum |

---

## Admin Authorization

### Current State

**Status:** ❌ No admin checks found

**Admin RPCs Identified:**
- `admin_delete_player_metadata`
- `update_game_reward_config`
- `sync_game_registry`
- `cache_clear`
- `achievements_create_definition`
- `achievements_bulk_create`
- `tournament_create`

**Gap:** No verification that caller is admin.

### Admin Check Pattern

```javascript
function requireAdmin(ctx, logger) {
    // Option 1: Check user metadata role
    var metadata = getPlayerMetadata(nk, logger, ctx.userId);
    if (metadata.role !== "admin" && metadata.role !== "moderator") {
        throw Error("Admin access required");
    }
    
    // Option 2: Check Nakama user metadata
    // Option 3: Environment variable admin list
}
```

---

## Secrets & Environment Variables

### Current Secrets

| Variable | Purpose | Location | Status |
|----------|---------|----------|--------|
| `GOOGLE_MAPS_API_KEY` | Geolocation resolution | docker-compose.yml | ✅ Set |
| `PUSH_LAMBDA_URL` | Push notification registration | Not set | ⚠️ Optional |
| `PUSH_SEND_URL` | Push notification sending | Not set | ⚠️ Optional |

### Required Secrets (Not Set)

| Variable | Purpose | Priority |
|----------|---------|----------|
| `NAKAMA_SERVER_KEY` | Server authentication key | P0 |
| `ADMIN_USER_IDS` | Comma-separated admin user IDs | P0 |
| `RATE_LIMIT_REDIS_URL` | Redis for distributed rate limiting | P1 |
| `CACHE_REDIS_URL` | Redis for distributed caching | P1 |

---

## Abuse Cases & Mitigations

### 1. Duplicate Currency Claims

**Attack:** Call `wallet_update_global` multiple times with same payload.  
**Current Mitigation:** ❌ None  
**Required Mitigation:** Idempotency keys

### 2. Reward Farming

**Attack:** Rapid-fire `daily_rewards_claim` calls.  
**Current Mitigation:** ❌ None  
**Required Mitigation:** Rate limiting + idempotency

### 3. Leaderboard Spam

**Attack:** Submit thousands of scores rapidly.  
**Current Mitigation:** ❌ None  
**Required Mitigation:** Rate limiting (WRITE: 30/min)

### 4. Storage Exhaustion

**Attack:** Create millions of storage records.  
**Current Mitigation:** ⚠️ Partial (storage permissions)  
**Required Mitigation:** Rate limiting + storage quotas

### 5. Admin Privilege Escalation

**Attack:** Call admin RPCs without admin status.  
**Current Mitigation:** ❌ None  
**Required Mitigation:** Admin checks

---

## Security Checklist

### P0 - Critical (Immediate)

- [ ] Add idempotency to all 13 currency/reward RPCs
- [ ] Wire rate limiting to all write RPCs
- [ ] Add admin checks to admin RPCs
- [ ] Add input validation framework
- [ ] Add request ID/traceId to all RPCs

### P1 - High Priority (Week 1-2)

- [ ] Add rate limiting to read RPCs
- [ ] Implement centralized validation schemas
- [ ] Add secrets management (env vars)
- [ ] Add request signing (optional)

### P2 - Medium Priority (Week 3-4)

- [ ] Add storage quotas per user
- [ ] Add IP-based rate limiting
- [ ] Add abuse detection (anomaly detection)
- [ ] Add audit logging for sensitive operations

---

## Security Metrics

### Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Idempotency Coverage** | 0% | 100% (currency/rewards) |
| **Rate Limiting Coverage** | 0% | 100% (all RPCs) |
| **Input Validation Coverage** | ~50% | 100% |
| **Admin Check Coverage** | 0% | 100% (admin RPCs) |
| **Security Incidents** | Unknown | 0 |

---

**See Also:**
- [RPC_CATALOG.md](./RPC_CATALOG.md) - RPCs requiring security measures
- [PERFORMANCE_PLAYBOOK.md](./PERFORMANCE_PLAYBOOK.md) - Rate limiting details

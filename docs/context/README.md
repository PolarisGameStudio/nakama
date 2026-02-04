# Context Pack - Complete Repository Context

**Purpose:** This directory contains comprehensive context artifacts that enable Cursor to build durable, accurate mental models of the Nakama backend repository.

**Last Updated:** 2026-02-04  
**Status:** Discovery Complete, Ready for Implementation

**Cursor:** Repo root includes `.cursorrules`, which points to this context pack and enforces RPC/storage/security and execution-plan rules.

---

## Context Artifacts

### 1. [ARCHITECTURE.md](./ARCHITECTURE.md)
**System overview, runtime entrypoint, domain boundaries, request flow**

- Runtime entry point: `data/modules/index.js` → `InitModule()`
- Monolithic structure: 18,785 lines in single file
- Domain modules exist but code duplicated in `index.js`
- Infrastructure utilities exist but NOT wired

**Key Findings:**
- 175+ RPCs registered
- Caching infrastructure exists but 0% usage
- Rate limiting infrastructure exists but 0% usage
- No idempotency implementation

---

### 2. [RPC_CATALOG.md](./RPC_CATALOG.md)
**Complete RPC inventory with classification**

- **Total RPCs:** 175+
- **Write RPCs:** ~100
- **Read RPCs:** ~75
- **Sensitive RPCs (Currency/Rewards):** 13 requiring idempotency
- **RPCs with Rate Limiting:** 0 (infrastructure exists but not wired)
- **RPCs with Caching:** 0 (infrastructure exists but not wired)

**Critical RPCs:**
- 13 currency/reward RPCs requiring idempotency
- All write RPCs requiring rate limiting
- All read RPCs requiring caching

---

### 3. [STORAGE_CATALOG.md](./STORAGE_CATALOG.md)
**Storage collections, keys, value schemas**

- **Collections Identified:** 30+
- **Key Patterns:** Documented
- **Schema Versioning:** ❌ Not implemented
- **Idempotency Keys:** ❌ Not implemented

**Critical Gaps:**
- No `schemaVersion` fields
- No idempotency key tracking
- Inconsistent key patterns

---

### 4. [SECURITY_MODEL.md](./SECURITY_MODEL.md)
**Rate limits, idempotency policy, validation policy**

- **Rate Limiting:** Infrastructure exists, NOT wired
- **Idempotency:** ❌ Not implemented (13 critical RPCs vulnerable)
- **Input Validation:** ⚠️ Ad-hoc (no framework)
- **Admin Checks:** ❌ Not implemented

**Priority:**
- P0: Add idempotency to 13 currency/reward RPCs
- P0: Wire rate limiting to all write RPCs
- P0: Add admin checks to admin RPCs

---

### 5. [PERFORMANCE_PLAYBOOK.md](./PERFORMANCE_PLAYBOOK.md)
**Cache policy, TTL matrix, invalidation rules**

- **Caching Infrastructure:** Exists but NOT wired
- **Current Cache Hit Rate:** 0%
- **Target Cache Hit Rate:** >80%
- **TTL Matrix:** Defined for all data types

**Priority:**
- Wire caching to read-heavy RPCs
- Add cache invalidation on writes
- Migrate to Redis for production

---

### 6. [OBSERVABILITY.md](./OBSERVABILITY.md)
**Structured log schema, traceId propagation, metrics**

- **Current Logging:** String concatenation
- **Structured Logging:** ❌ Not implemented
- **TraceId:** ❌ Not implemented
- **Metrics:** ❌ Not implemented

**Target:**
- JSON structured logs
- TraceId propagation
- Per-RPC metrics
- Prometheus export

---

### 7. [MIGRATIONS.md](./MIGRATIONS.md)
**Schema versioning rules, migration runner design**

- **Schema Versioning:** ❌ Not implemented
- **Migration Runner:** ❌ Not implemented
- **Current State:** No version fields in storage

**Strategy:**
- Add `schemaVersion: 1` to all storage objects
- Create migration runner
- Enable automatic migration on read

---

### 8. [EXECUTION_PLAN.md](./EXECUTION_PLAN.md)
**PR-sized implementation slices**

- **14 PRs** planned over 14 weeks
- **First PR:** Foundation (RPC registry, structured logging, middleware)
- **Priority:** Security (idempotency, rate limiting) → Performance (caching) → Quality (validation, schema versioning)

---

## Quick Reference

### Critical Numbers

| Metric | Value |
|--------|-------|
| **Total RPCs** | 175+ |
| **Monolithic File Size** | 18,785 lines |
| **Sensitive RPCs** | 13 (require idempotency) |
| **Write RPCs** | ~100 (require rate limiting) |
| **Read RPCs** | ~75 (require caching) |
| **Storage Collections** | 30+ |
| **Current Cache Hit Rate** | 0% |
| **Current Rate Limiting Coverage** | 0% |
| **Current Idempotency Coverage** | 0% |

---

### Critical Gaps Summary

1. **Security:**
   - ❌ No idempotency (13 RPCs vulnerable)
   - ❌ No rate limiting (infrastructure exists but not wired)
   - ❌ No admin checks
   - ⚠️ Ad-hoc input validation

2. **Performance:**
   - ❌ No caching (infrastructure exists but not wired)
   - ⚠️ Potential N+1 queries
   - ⚠️ No batch operations usage

3. **Observability:**
   - ❌ No structured logging
   - ❌ No traceId propagation
   - ❌ No metrics collection

4. **Code Quality:**
   - ❌ Monolithic structure (18,785 lines)
   - ❌ No schema versioning
   - ❌ No test coverage

---

### Infrastructure Status

| Infrastructure | Status | Usage |
|----------------|--------|-------|
| **Caching** | ✅ Exists | ❌ 0% (not wired) |
| **Rate Limiting** | ✅ Exists | ❌ 0% (not wired) |
| **Batch Operations** | ✅ Exists | ⚠️ Minimal |
| **Idempotency** | ❌ Missing | ❌ 0% |
| **Structured Logging** | ❌ Missing | ❌ 0% |
| **Metrics** | ❌ Missing | ❌ 0% |
| **Schema Versioning** | ❌ Missing | ❌ 0% |

---

## Must Not Miss Requirements

### P0 - Critical (Week 1-2)

1. **Idempotency for Currency/Rewards**
   - 13 RPCs requiring immediate protection
   - Prevent duplicate claims/transactions

2. **Rate Limiting Activation**
   - Wire existing infrastructure to all write RPCs
   - Prevent abuse and spam

3. **Structured Logging**
   - JSON logs with traceId
   - Enable debugging and monitoring

4. **Input Validation Framework**
   - Centralized validation
   - Fail-fast on invalid inputs

### P1 - High Priority (Week 3-4)

5. **Caching Activation**
   - Wire existing infrastructure to read RPCs
   - Target >80% cache hit rate

6. **Schema Versioning**
   - Add `schemaVersion` to all storage objects
   - Enable data migrations

7. **Metrics Collection**
   - Per-RPC metrics (count, latency, errors)
   - Prometheus export

### P2 - Medium Priority (Week 5-8)

8. **Modularization**
   - Split monolithic `index.js`
   - Target <500 lines per module

9. **Admin Authorization**
   - Add admin checks to admin RPCs
   - Prevent privilege escalation

10. **Test Coverage**
    - Unit tests for critical logic
    - Target 80%+ coverage

---

## File Locations

### Runtime Entry Point
- **File:** `data/modules/index.js`
- **Function:** `InitModule(ctx, logger, nk, initializer)` (line 18118)
- **Size:** ~18,785 lines

### Infrastructure Utilities
- **Caching:** `data/modules/infrastructure/caching.js` (exists, not wired)
- **Rate Limiting:** `data/modules/infrastructure/rate_limiting.js` (exists, not wired)
- **Batch Operations:** `data/modules/infrastructure/batch_operations.js` (exists, minimal usage)

### Domain Modules (Partially Modularized)
- `data/modules/wallet/wallet.js`
- `data/modules/daily_rewards/daily_rewards.js`
- `data/modules/daily_missions/daily_missions.js`
- `data/modules/friends/friends.js`
- `data/modules/groups/groups.js`
- `data/modules/push_notifications/push_notifications.js`
- `data/modules/analytics/analytics.js`
- `data/modules/achievements/achievements.js`
- `data/modules/matchmaking/matchmaking.js`
- `data/modules/tournaments/tournaments.js`
- `data/modules/onboarding/onboarding.js`
- `data/modules/retention/*.js`
- `data/modules/progression/*.js`
- `data/modules/rewarded_ads/rewarded_ads.js`
- `data/modules/quiz_results/quiz_results.js`

**Note:** Domain modules exist but their code is **duplicated** in `index.js`. The separate files are not imported/used.

---

## Next Steps

1. **Review Context Pack**
   - Read all context artifacts
   - Understand current state and gaps

2. **Approve First PR**
   - Review [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) → PR #1
   - Approve implementation approach

3. **Begin Implementation**
   - Start with PR #1: Foundation
   - Test thoroughly
   - Proceed to PR #2: Rate Limiting

---

## How to Use This Context Pack

### For Cursor AI

These files provide comprehensive context for:
- Understanding system architecture
- Identifying RPCs and their classifications
- Knowing storage patterns and schemas
- Understanding security requirements
- Planning refactoring and improvements

### For Developers

- **New Developers:** Start with [ARCHITECTURE.md](./ARCHITECTURE.md)
- **RPC Integration:** See [RPC_CATALOG.md](./RPC_CATALOG.md)
- **Storage Queries:** See [STORAGE_CATALOG.md](./STORAGE_CATALOG.md)
- **Security:** See [SECURITY_MODEL.md](./SECURITY_MODEL.md)
- **Performance:** See [PERFORMANCE_PLAYBOOK.md](./PERFORMANCE_PLAYBOOK.md)

---

**Maintained By:** Backend Architecture Team  
**Last Audit:** 2026-02-04  
**Next Review:** After PR #1 completion

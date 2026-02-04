# Storage Catalog - Collections & Schemas

**Last Updated:** 2026-02-04  
**Source:** `data/modules/index.js` - Storage operations analysis

---

## Storage Collections Inventory

### Player & Identity Collections

#### `player_metadata`
**Purpose:** Unified player identity and profile data  
**Key Pattern:** `user_identity`  
**User Scope:** User (`ctx.userId`)  
**Permissions:** `permissionRead: 1` (OWNER_READ), `permissionWrite: 0` (server-only)

**Schema:**
```javascript
{
  userId: "uuid",
  username: "string",
  email: "string",
  role: "user|guest|admin|moderator|premium|vip",
  login_type: "cognito|device|guest|email|google|apple|facebook|custom",
  account_status: "active|inactive|suspended|pending|banned",
  
  // Game tracking
  game_id: "uuid",
  current_game_id: "uuid",
  games: [{ game_id: "uuid", first_played: "ISO8601", last_played: "ISO8601" }],
  
  // Geolocation
  geo_location: "US",
  latitude: number,
  longitude: number,
  city: "string",
  region: "string",
  country: "string",
  country_code: "US",
  location_history: [{ timestamp: "ISO8601", ... }],
  
  // Device info
  device_id: "string",
  platform: "iOS|Android|Web|Windows",
  app_version: "string",
  device_model: "string",
  os_version: "string",
  
  // Wallet references
  wallet_address: "string",
  cognito_user_id: "uuid",
  
  // Timestamps
  created_at: "ISO8601",
  updated_at: "ISO8601",
  
  // Schema version (NOT PRESENT - needs adding)
  // schemaVersion: 1
}
```

**RPCs Using:** `rpc_update_player_metadata`, `get_player_metadata`, `admin_delete_player_metadata`

---

#### `device_user_mappings`
**Purpose:** Map device IDs to user IDs  
**Key Pattern:** `device_{deviceId}`  
**User Scope:** System user (`00000000-0000-0000-0000-000000000000`)

**Schema:**
```javascript
{
  deviceId: "string",
  userId: "uuid",
  createdAt: "ISO8601"
}
```

---

### Wallet Collections

#### `wallets`
**Purpose:** Per-game wallets  
**Key Pattern:** `wallet_{userId}_{gameId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  currencies: {
    game: number,      // Game-specific currency
    tokens: number,    // Tokens (synced with "game")
    xp: number,       // Experience points
    global: number     // Cross-game currency
  },
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
  // schemaVersion: 1 (NOT PRESENT)
}
```

**RPCs Using:** `wallet_update_game_wallet`, `wallet_get_all`, `create_or_get_wallet`

---

#### `global_wallets` (or `wallets` with key `global_wallet_{userId}`)
**Purpose:** Cross-game shared wallet  
**Key Pattern:** `global_wallet_{userId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  currencies: {
    xut: number,      // Cross-game currency
    xp: number        // Global XP
  },
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

**RPCs Using:** `wallet_update_global`, `wallet_get_all`

---

#### `wallet_registry`
**Purpose:** Cognito wallet mapping registry  
**Key Pattern:** `wallet_{cognitoSub}`  
**User Scope:** System user

**Schema:**
```javascript
{
  walletId: "uuid",
  cognitoSub: "uuid",
  userId: "uuid",
  gamesLinked: ["uuid"],
  createdAt: "ISO8601"
}
```

**RPCs Using:** `get_user_wallet`, `link_wallet_to_game`, `get_wallet_registry`

---

#### `transaction_logs`
**Purpose:** Audit trail for wallet operations  
**Key Pattern:** `transaction_log_{userId}_{timestamp}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  type: "global_wallet_update|game_wallet_update|transfer",
  gameId: "uuid",      // Optional
  currency: "string",
  amount: number,
  operation: "add|subtract",
  newBalance: number,
  timestamp: "ISO8601"
  // idempotencyKey: "string" (NOT PRESENT - critical gap)
}
```

**RPCs Using:** All wallet write RPCs

---

### Daily Engagement Collections

#### `daily_streaks`
**Purpose:** Daily reward streak tracking  
**Key Pattern:** `user_daily_streak_{userId}_{gameId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  currentStreak: number,
  totalClaims: number,
  lastClaimTimestamp: number,  // Unix timestamp
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
  // schemaVersion: 1 (NOT PRESENT)
}
```

**RPCs Using:** `daily_rewards_get_status`, `daily_rewards_claim`

---

#### `daily_missions` (or `mission_progress`)
**Purpose:** Daily mission progress  
**Key Pattern:** `mission_progress_{userId}_{gameId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  resetDate: number,  // Unix timestamp of last reset
  missions: [{
    id: "string",
    currentValue: number,
    targetValue: number,
    completed: boolean,
    claimed: boolean
  }],
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

**RPCs Using:** `get_daily_missions`, `submit_mission_progress`, `claim_mission_reward`

---

### Retention System Collections

#### `weekly_goals`
**Purpose:** Weekly goals progress  
**Key Pattern:** `weekly_goals_{userId}_{gameId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  weekStartDate: number,  // Unix timestamp
  goals: [{ id: "string", progress: number, completed: boolean, claimed: boolean }],
  bonusClaimed: boolean,
  updatedAt: "ISO8601"
}
```

---

#### `season_pass`
**Purpose:** Season pass/Battle pass progress  
**Key Pattern:** `season_pass_{userId}_{gameId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  seasonId: "string",
  currentXP: number,
  currentTier: number,
  premiumPurchased: boolean,
  claimedRewards: [number],  // Tier numbers
  updatedAt: "ISO8601"
}
```

---

#### `monthly_milestones`
**Purpose:** Monthly milestone progress  
**Key Pattern:** `monthly_milestones_{userId}_{gameId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  monthStartDate: number,  // Unix timestamp
  milestones: [{ id: "string", progress: number, completed: boolean, claimed: boolean }],
  legendaryClaimed: boolean,
  updatedAt: "ISO8601"
}
```

---

#### `user_collections`
**Purpose:** Collections/prestige system  
**Key Pattern:** `collections_{userId}_{gameId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  unlockedItems: ["string"],
  equippedItems: ["string"],
  masteryXP: { [itemId]: number },
  updatedAt: "ISO8601"
}
```

---

#### `onboarding_state`
**Purpose:** Onboarding progress  
**Key Pattern:** `onboarding_{userId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  currentStep: number,
  completedSteps: [number],
  interests: ["string"],
  welcomeBonusClaimed: boolean,
  firstQuizCompleted: boolean,
  updatedAt: "ISO8601"
}
```

---

#### `streak_shield`
**Purpose:** Streak protection items  
**Key Pattern:** `streak_shield_{userId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  shieldsAvailable: number,
  shieldsUsed: number,
  updatedAt: "ISO8601"
}
```

---

### Social Collections

#### `friend_invites`
**Purpose:** Friend request tracking  
**Key Pattern:** `{fromUserId}_{targetUserId}_{timestamp}`  
**User Scope:** User

**Schema:**
```javascript
{
  inviteId: "uuid",
  fromUserId: "uuid",
  targetUserId: "uuid",
  message: "string",
  status: "pending|accepted|declined",
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

**RPCs Using:** `send_friend_invite`, `accept_friend_invite`, `decline_friend_invite`

---

#### `user_blocks`
**Purpose:** Blocked users list  
**Key Pattern:** `blocks_{userId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  blockedUserIds: ["uuid"],
  updatedAt: "ISO8601"
}
```

**RPCs Using:** `friends_block`, `friends_unblock`

---

#### `challenges`
**Purpose:** Friend challenge records  
**Key Pattern:** `challenge_{challengeId}`  
**User Scope:** User

**Schema:**
```javascript
{
  challengeId: "uuid",
  fromUserId: "uuid",
  targetUserId: "uuid",
  gameId: "uuid",
  challengeData: {},
  status: "pending|accepted|completed",
  createdAt: "ISO8601"
}
```

---

### Push Notifications

#### `push_endpoints`
**Purpose:** Registered push notification endpoints  
**Key Pattern:** `push_endpoint_{userId}_{gameId}_{platform}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  platform: "ios|android|web|windows",
  endpointArn: "string",  // AWS SNS ARN
  token: "string",
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

**RPCs Using:** `push_register_token`, `push_get_endpoints`

---

### Analytics Collections

#### `analytics_events`
**Purpose:** Event tracking  
**Key Pattern:** `event_{userId}_{gameId}_{timestamp}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  eventName: "string",
  eventData: {},
  timestamp: "ISO8601"
}
```

---

#### `analytics_dau`
**Purpose:** Daily Active User tracking  
**Key Pattern:** `dau_{date}` (YYYY-MM-DD)  
**User Scope:** System user

**Schema:**
```javascript
{
  date: "YYYY-MM-DD",
  uniqueUsers: ["uuid"],
  count: number,
  updatedAt: "ISO8601"
}
```

---

#### `analytics_sessions`
**Purpose:** Session tracking  
**Key Pattern:** `session_{userId}_{sessionId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  sessionId: "uuid",
  gameId: "uuid",
  startTime: "ISO8601",
  endTime: "ISO8601",
  duration: number
}
```

---

### Quiz-Specific Collections

#### `quiz_results_{gameId}`
**Purpose:** Quiz attempt results  
**Key Pattern:** `{userId}_{timestamp}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  gameMode: "solo|multiplayer",
  score: number,
  correctAnswers: number,
  totalQuestions: number,
  timeTakenSeconds: number,
  timestamp: "ISO8601"
}
```

---

#### `quiz_user_stats_{gameId}`
**Purpose:** User quiz statistics  
**Key Pattern:** `stats_{userId}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  totalQuizzes: number,
  totalScore: number,
  averageScore: number,
  bestScore: number,
  totalCorrectAnswers: number,
  totalQuestions: number,
  accuracy: number,
  updatedAt: "ISO8601"
}
```

---

### Leaderboard Registry

#### `leaderboards_registry`
**Purpose:** Metadata about created leaderboards  
**Key Pattern:** `all_created`  
**User Scope:** System user

**Schema:**
```javascript
[
  {
    leaderboardId: "string",
    gameId: "uuid",
    period: "daily|weekly|monthly|alltime",
    scope: "game|global|friends",
    resetSchedule: "cron expression",
    createdAt: "ISO8601"
  }
]
```

---

### Rewarded Ads

#### `rewarded_ad_claims`
**Purpose:** Track ad reward claims (prevent duplicates)  
**Key Pattern:** `{userId}_{timestamp}`  
**User Scope:** User

**Schema:**
```javascript
{
  userId: "uuid",
  gameId: "uuid",
  token: "string",  // Ad validation token
  rewardType: "string",
  rewardAmount: number,
  claimedAt: "ISO8601"
  // idempotencyKey: "string" (NOT PRESENT - critical gap)
}
```

---

### Game Registry

#### `game_registry`
**Purpose:** Registered games metadata  
**Key Pattern:** `games` or `game_{gameId}`  
**User Scope:** System user

**Schema:**
```javascript
{
  gameId: "uuid",
  title: "string",
  description: "string",
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

---

### Compatibility Quiz

#### `compatibility_sessions`
**Purpose:** Compatibility quiz sessions  
**Key Pattern:** `session_{sessionId}`  
**User Scope:** User

**Schema:**
```javascript
{
  sessionId: "uuid",
  creatorUserId: "uuid",
  partnerUserId: "uuid",
  answers: {},
  compatibilityScore: number,
  status: "pending|completed",
  createdAt: "ISO8601"
}
```

---

### Chat Collections

#### `group_chat`
**Purpose:** Group chat messages  
**Key Pattern:** `{groupId}_{timestamp}`  
**User Scope:** Group members

**Schema:**
```javascript
{
  groupId: "uuid",
  userId: "uuid",
  message: "string",
  timestamp: "ISO8601"
}
```

---

#### `direct_chat`
**Purpose:** Direct messages  
**Key Pattern:** `{userId1}_{userId2}_{timestamp}`  
**User Scope:** Participants

**Schema:**
```javascript
{
  fromUserId: "uuid",
  toUserId: "uuid",
  message: "string",
  read: boolean,
  timestamp: "ISO8601"
}
```

---

## Storage Patterns & Conventions

### Key Naming Patterns

| Pattern | Example | Purpose |
|---------|---------|---------|
| `{prefix}_{userId}` | `global_wallet_abc123` | User-scoped global data |
| `{prefix}_{userId}_{gameId}` | `wallet_abc123_game456` | Per-game user data |
| `{prefix}_{userId}_{timestamp}` | `transaction_log_abc123_1234567890` | Time-series data |
| `{prefix}_{userId}_{gameId}_{platform}` | `push_endpoint_abc123_game456_ios` | Multi-dimensional keys |

### Permission Patterns

| Pattern | Read | Write | Purpose |
|---------|------|-------|---------|
| **User Data** | `1` (OWNER_READ) | `0` (server-only) | Player data |
| **System Data** | `1` | `0` | Registry/metadata |
| **Chat** | `1` | `1` | Real-time messaging |

---

## Critical Gaps

### 1. No Schema Versioning

**Problem:** Storage objects don't have `schemaVersion` field.  
**Impact:** Cannot migrate data when schemas change.  
**Solution:** Add `schemaVersion: 1` to all storage objects, increment on changes.

### 2. No Idempotency Keys

**Problem:** Currency/reward mutations don't track idempotency keys.  
**Impact:** Duplicate claims possible.  
**Solution:** Add `idempotencyKey` to transaction logs and reward claims.

### 3. Inconsistent Key Patterns

**Problem:** Some collections use different key formats.  
**Impact:** Hard to query/audit.  
**Solution:** Standardize key patterns per collection type.

### 4. No Index Documentation

**Problem:** No documented storage indices.  
**Impact:** Query performance unknown.  
**Solution:** Document query patterns and required indices.

---

## Storage Access Patterns

### Read Patterns

| Pattern | Frequency | Caching Needed |
|---------|-----------|----------------|
| `wallet_get_all` | High | ✅ YES (30s TTL) |
| `get_time_period_leaderboard` | High | ✅ YES (60s TTL) |
| `daily_rewards_get_status` | Medium | ✅ YES (300s TTL) |
| `get_daily_missions` | Medium | ✅ YES (300s TTL) |
| `get_player_metadata` | Medium | ✅ YES (300s TTL) |

### Write Patterns

| Pattern | Frequency | Idempotency Needed |
|---------|-----------|-------------------|
| `wallet_update_*` | High | ✅ YES |
| `daily_rewards_claim` | Medium | ✅ YES |
| `claim_mission_reward` | Medium | ✅ YES |
| `rewarded_ad_claim` | Medium | ✅ YES |
| `season_pass_claim_reward` | Low | ✅ YES |

---

## Migration Strategy

### Phase 1: Add Schema Version
1. Add `schemaVersion: 1` to all new writes
2. Backfill existing records (migration script)
3. Add migration runner

### Phase 2: Add Idempotency Keys
1. Add `idempotencyKey` field to transaction logs
2. Add idempotency check before currency mutations
3. Store idempotency keys in separate collection for fast lookup

### Phase 3: Standardize Keys
1. Audit all key patterns
2. Create migration script to rename keys
3. Update RPCs to use new patterns

---

**See Also:**
- [MIGRATIONS.md](./MIGRATIONS.md) - Migration runner design
- [RPC_CATALOG.md](./RPC_CATALOG.md) - RPCs using each collection

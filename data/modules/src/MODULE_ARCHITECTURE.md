# Nakama Backend Modular Architecture

**Version:** 2.0.0  
**Date:** 2026-02-05  
**Author:** IntelliVerse-X Backend Team

---

## Overview

This document describes the modular architecture of the Nakama backend. The codebase is organized into two main modules:

1. **PLAYER CORE** - Cross-game player data (shared across all games)
2. **GAME SYSTEMS** - Game-specific features (isolated by `game_id`)

---

## Important: Nakama V8 Runtime Constraints

Nakama's JavaScript V8 runtime requires:
- **Single concatenated file** (`index.js`) - No ES6 modules/imports
- **No `require()` statements** - Everything must be in one file
- **`var` keyword** - `let`/`const` may cause issues in some contexts
- **globalThis exports** - Use `globalThis.ModuleName = {}` for module exposure

### Build Process

The source files in `src/` are organized for development clarity but must be concatenated into `index.js` for deployment:

```
src/
├── player-core/          → Concatenated
├── game-systems/         → into
├── infrastructure/       → index.js
└── build.js              → Build script
```

---

## Module 1: PLAYER CORE (Cross-Game Player Data)

Location: `src/player-core/`

These features are **shared across all games** - data is tied to the player, not a specific game.

### 1.1 Identity (`identity.js`)

Player authentication and profile management.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `create_or_sync_user` | Create or sync player identity | No (device auth) |
| `rpc_update_player_metadata` | Update player profile data | Yes |
| `get_player_metadata` | Get player profile | Yes |
| `check_geo_and_update_profile` | Update geo location | Yes |
| `get_player_portfolio` | Get complete player portfolio | Yes |
| `admin_delete_player_metadata` | Admin: delete player data | Admin |

**Storage Pattern:**
```
Collection: "quizverse"
Key: "identity:{device_id}:{game_id}"
```

### 1.2 Global Wallet (`global-wallet.js`)

Platform-wide currency (XUT tokens, platform XP).

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `wallet_update_global` | Add/subtract global currency | Yes |
| `wallet_get_all` | Get all wallet data | Yes |
| `wallet_get_balances` | Get currency balances | Yes |
| `get_user_wallet` | Get wallet by user ID | Yes |
| `get_wallet_registry` | Get wallet registry | Admin |

**Storage Pattern:**
```
Collection: "wallets"
Key: "global_wallet:{user_id}"
```

### 1.3 Friends (`friends.js`)

Social connections that persist across all games.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `friends_list` | Get friend list | Yes |
| `send_friend_invite` | Send friend request | Yes |
| `accept_friend_invite` | Accept friend request | Yes |
| `decline_friend_invite` | Decline friend request | Yes |
| `friends_block` | Block a user | Yes |
| `friends_unblock` | Unblock a user | Yes |
| `friends_remove` | Remove friend | Yes |
| `friends_challenge_user` | Challenge friend to game | Yes |
| `friends_spectate` | Spectate friend's game | Yes |

### 1.4 Profile & Achievements (`profile.js`)

Cross-game achievements and player stats.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `achievements_get_all` | Get all achievements | Yes |
| `achievements_update_progress` | Update achievement progress | Yes |
| `achievements_create_definition` | Admin: create achievement | Admin |
| `achievements_bulk_create` | Admin: bulk create | Admin |

### 1.5 Notifications (`notifications.js`)

Push notifications across all games.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `get_notifications` | Get player notifications | Yes |
| `push_register_token` | Register push token | Yes |
| `push_send_event` | Send push notification | Yes |
| `push_get_endpoints` | Get push endpoints | Yes |

---

## Module 2: GAME SYSTEMS (Game-Specific, Isolated by game_id)

Location: `src/game-systems/`

These features are **isolated per game** - each game has its own data.

### 2.1 Onboarding (`onboarding.js`) ⭐ GAME-SPECIFIC

First-time user experience **per game** (moved from player-core).

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `onboarding_get_state` | Get onboarding state for game | Yes |
| `onboarding_update_state` | Update onboarding progress | Yes |
| `onboarding_complete_step` | Mark step complete | Yes |
| `onboarding_set_interests` | Set game preferences | Yes |
| `onboarding_get_interests` | Get game preferences | Yes |
| `onboarding_claim_welcome_bonus` | Claim game welcome bonus | Yes |
| `onboarding_first_quiz_complete` | Mark first quiz done | Yes |
| `onboarding_get_tomorrow_preview` | Preview tomorrow's content | Yes |
| `onboarding_track_session` | Track user session | Yes |
| `onboarding_get_retention_data` | Get retention metrics | Yes |
| `onboarding_create_link_quiz` | Create shareable quiz link | Yes |

**Storage Pattern:**
```
Collection: "onboarding"
Key: "state:{game_id}:{user_id}"
```

**Why Game-Specific:**
- Each game has different welcome bonuses (coins vs power-ups)
- Interests/preferences vary by game type (quiz categories vs game modes)
- Tutorial steps are game-specific
- First-time rewards differ per game

### 2.2 Game Wallet (`game-wallet.js`)

Per-game currency (game coins, gems).

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `create_or_get_wallet` | Create/get game wallet | Yes |
| `wallet_update_game_wallet` | Update game wallet | Yes |
| `wallet_transfer_between_game_wallets` | Transfer between games | Yes |
| `create_player_wallet` | Create new wallet | Yes |
| `update_wallet_balance` | Update balance | Yes |
| `get_wallet_balance` | Get balance | Yes |
| `link_wallet_to_game` | Link wallet to game | Yes |

**Storage Pattern:**
```
Collection: "quizverse"
Key: "wallet:{device_id}:{game_id}"
```

### 2.3 Leaderboards (`leaderboards.js`)

Per-game rankings and scores.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `create_all_leaderboards_persistent` | Create persistent leaderboards | Admin |
| `create_time_period_leaderboards` | Create time-based leaderboards | Admin |
| `submit_score_to_time_periods` | Submit score to all periods | Yes |
| `get_time_period_leaderboard` | Get leaderboard by period | Yes |
| `submit_leaderboard_score` | Submit single score | Yes |
| `get_leaderboard` | Get leaderboard | Yes |
| `get_all_leaderboards` | Get all game leaderboards | Yes |
| `create_all_leaderboards_with_friends` | Create friend leaderboards | Yes |
| `submit_score_with_friends_sync` | Submit with friend sync | Yes |
| `get_friend_leaderboard` | Get friend rankings | Yes |

**Leaderboard ID Pattern:**
```
{game_id}_{period}_{type}
Example: 126bf539-dae2-4bcf-964d-316c0fa1f92b_daily_score
```

### 2.4 Daily Systems (`daily-systems.js`)

Daily engagement mechanics per game.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `daily_rewards_get_status` | Get daily reward status | Yes |
| `daily_rewards_claim` | Claim daily reward | Yes |
| `get_daily_missions` | Get today's missions | Yes |
| `submit_mission_progress` | Update mission progress | Yes |
| `claim_mission_reward` | Claim mission reward | Yes |

**Storage Pattern:**
```
Collection: "daily_rewards"
Key: "status:{game_id}:{user_id}"
```

### 2.5 Progression (`progression.js`)

Per-game progression systems.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `season_pass_get_status` | Get season pass status | Yes |
| `season_pass_add_xp` | Add season XP | Yes |
| `season_pass_complete_quest` | Complete season quest | Yes |
| `season_pass_claim_reward` | Claim season reward | Yes |
| `season_pass_purchase_premium` | Buy premium pass | Yes |
| `weekly_goals_get_status` | Get weekly goals | Yes |
| `weekly_goals_update_progress` | Update goal progress | Yes |
| `weekly_goals_claim_reward` | Claim goal reward | Yes |
| `weekly_goals_claim_bonus` | Claim bonus reward | Yes |
| `monthly_milestones_get_status` | Get monthly milestones | Yes |
| `monthly_milestones_update_progress` | Update milestone progress | Yes |
| `monthly_milestones_claim_reward` | Claim milestone reward | Yes |
| `monthly_milestones_claim_legendary` | Claim legendary reward | Yes |
| `collections_get_status` | Get collection status | Yes |
| `collections_unlock_item` | Unlock collection item | Yes |
| `collections_equip_item` | Equip cosmetic item | Yes |
| `collections_add_mastery_xp` | Add mastery XP | Yes |
| `progressive_get_state` | Get unlock state | Yes |
| `progressive_claim_unlock` | Claim feature unlock | Yes |
| `progressive_check_feature` | Check if feature unlocked | Yes |
| `progressive_update_progress` | Update unlock progress | Yes |
| `progression_add_mastery_xp` | Add mastery XP | Yes |
| `progression_get_state` | Get progression state | Yes |
| `progression_claim_prestige` | Claim prestige reward | Yes |

### 2.6 Tournaments (`tournaments.js`)

Per-game competitive events.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `tournament_create` | Create tournament | Admin |
| `tournament_join` | Join tournament | Yes |
| `tournament_list_active` | List active tournaments | Yes |
| `tournament_submit_score` | Submit tournament score | Yes |
| `tournament_get_leaderboard` | Get tournament rankings | Yes |
| `tournament_claim_rewards` | Claim tournament rewards | Yes |

### 2.7 Matchmaking (`matchmaking.js`)

Per-game player matching.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `matchmaking_find_match` | Find match | Yes |
| `matchmaking_cancel` | Cancel matchmaking | Yes |
| `matchmaking_get_status` | Get matchmaking status | Yes |
| `matchmaking_create_party` | Create party | Yes |
| `matchmaking_join_party` | Join party | Yes |

### 2.8 Retention (`retention.js`)

Per-game player retention mechanics.

| RPC Name | Description | Auth Required |
|----------|-------------|---------------|
| `retention_grant_streak_shield` | Grant streak protection | Yes |
| `retention_get_streak_shield` | Get shield status | Yes |
| `retention_use_streak_shield` | Use streak shield | Yes |
| `retention_schedule_notification` | Schedule reminder | Yes |
| `retention_get_recommendations` | Get personalized content | Yes |
| `retention_track_first_session` | Track first session | Yes |
| `retention_claim_welcome_bonus` | Claim welcome bonus | Yes |
| `winback_check_status` | Check lapsed player status | Yes |
| `winback_claim_rewards` | Claim return rewards | Yes |
| `winback_record_session` | Record return session | Yes |
| `winback_schedule_reengagement` | Schedule re-engagement | Yes |

---

## Module 3: INFRASTRUCTURE

Location: `src/infrastructure/`

Core infrastructure shared by all modules.

### 3.1 Core (`core.js`)

- Structured logging
- RPC middleware
- Error handling
- Trace ID generation

### 3.2 Rate Limiting (`rate-limiting.js`)

- Per-RPC rate limits
- Preset configurations (READ, WRITE, SENSITIVE)
- Distributed rate limiting support

### 3.3 Caching (`caching.js`)

- In-memory caching
- TTL presets (SHORT, MEDIUM, LONG)
- Cache invalidation on writes

### 3.4 Idempotency (`idempotency.js`)

- Prevent duplicate operations
- Transaction deduplication
- Reward claim protection

### 3.5 Validation (`validation.js`)

- Input validation schemas
- Type checking
- Range validation

### 3.6 Security (`security.js`)

- Score validation
- Wallet amount validation
- Atomic operations
- Audit logging

---

## Storage Key Patterns

### Global (Cross-Game) Data
```
Collection: "global"
Key: "{feature}:global:{user_id}"
```

### Game-Specific Data
```
Collection: "{game_collection}"
Key: "{feature}:{game_id}:{user_id}"
```

### Examples
```javascript
// Player identity (per game registration)
"quizverse" / "identity:device123:126bf539..."

// Global wallet
"wallets" / "global_wallet:user123"

// Game wallet
"quizverse" / "wallet:device123:126bf539..."

// Daily rewards (per game)
"daily_rewards" / "status:126bf539...:user123"

// Onboarding (per game)
"onboarding" / "state:126bf539...:user123"

// Achievements (global or per-game based on type)
"achievements" / "global:user123" // Cross-game
"achievements" / "game:126bf539...:user123" // Game-specific
```

---

## API Response Standards

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "traceId": "trace-abc123"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable message",
  "errorCode": "ERROR_CODE",
  "traceId": "trace-abc123",
  "retryAfter": 60  // Optional: for rate limiting
}
```

---

## RPC Registration Pattern

All RPCs follow this registration pattern in `InitModule`:

```javascript
// 1. Define the handler function
function rpcFeatureName(ctx, logger, nk, payload) {
    // Implementation
}

// 2. Wrap with middleware (optional but recommended)
var wrappedRpc = rpcFeatureName;
if (globalThis.Validation) {
    wrappedRpc = globalThis.Validation.withValidation(wrappedRpc, 'feature_name', schema);
}
if (globalThis.RateLimiting) {
    wrappedRpc = globalThis.RateLimiting.withPresetRateLimit(wrappedRpc, 'feature_name', 'READ');
}
if (globalThis.Caching) {
    wrappedRpc = globalThis.Caching.withCache(wrappedRpc, 'feature_name', TTL.MEDIUM);
}

// 3. Register
initializer.registerRpc('feature_name', wrappedRpc);
```

---

## Future Modules (Planned)

### Module 3: RETENTION BOOSTERS
- Lucky Spin / Daily Wheel
- Referral System
- Gift System
- VIP/Loyalty Tiers
- Limited-Time Events
- Energy System

### Module 4: SOCIAL FEATURES
- Clans/Teams
- Activity Feed
- Challenges
- Spectating

---

## Deployment Notes

1. **Development**: Edit files in `src/` for clarity
2. **Build**: Run build script to concatenate into `index.js`
3. **Deploy**: Upload `index.js` to Nakama server
4. **Verify**: Check Nakama logs for successful module initialization

```bash
# Build command (from modules directory)
node build.js

# Or manual concatenation
cat src/infrastructure/*.js src/player-core/*.js src/game-systems/*.js > index.js
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-02-05 | Modular architecture, moved onboarding to game-systems |
| 1.0.0 | 2026-02-04 | Initial PR #1-6 infrastructure |

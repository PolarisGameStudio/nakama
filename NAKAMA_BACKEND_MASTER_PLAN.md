# Nakama Backend Master Plan

**Date:** February 4, 2026  
**Version:** 2.0  
**Scope:** Complete backend transformation to world-class, production-ready AAA game studio level

---

## Executive Summary

This master document consolidates the complete roadmap for transforming the Nakama backend into an industry-leading, production-ready game backend service. It includes:

1. **Current State Assessment** - What exists today
2. **Feature Inventory** - Complete list of implemented, partial, and missing features
3. **Execution Plan** - 14-week phased implementation
4. **Service Analysis** - Deep dive into each service with recommendations
5. **Retention & ARPU Strategy** - Features for player retention and monetization
6. **Folder Structure** - World-class architecture proposal

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Complete Feature Inventory](#2-complete-feature-inventory)
3. [Feature Classification: Player vs Game Based](#3-feature-classification-player-vs-game-based)
4. [Service-by-Service Analysis](#4-service-by-service-analysis)
5. [Execution Plan (14 Weeks)](#5-execution-plan-14-weeks)
6. [Retention Strategy & Benchmarks](#6-retention-strategy--benchmarks)
7. [ARPU Optimization](#7-arpu-optimization)
8. [Folder Structure Proposal](#8-folder-structure-proposal)
9. [Success Metrics](#9-success-metrics)

---

## 1. Current State Assessment

### Overall Quality Rating: **B+** → Target: **A+**

| Metric | Current | Target |
|--------|---------|--------|
| **Main Module Size** | 18,785 lines (monolithic) | <500 lines per domain module |
| **RPCs Registered** | 175+ | Same, but modularized |
| **Unit Test Coverage** | 0% | 80%+ |
| **Rate Limiting Applied** | 0 RPCs | All write RPCs |
| **Caching Applied** | 0 RPCs | All read RPCs |
| **Idempotency** | Not implemented | All currency operations |
| **Observability** | Basic logging | Structured logs + metrics + tracing |
| **Schema Versioning** | Not implemented | All storage objects |

### Key Strengths
- ✅ Solid foundation with 45+ features implemented
- ✅ Multi-game architecture with gameId isolation
- ✅ Comprehensive retention systems (daily rewards, season pass, weekly goals)
- ✅ Push notification infrastructure (AWS SNS + Lambda)
- ✅ Leaderboard system with time periods

### Critical Gaps
- ❌ No unified player level/XP system
- ❌ Analytics lacks depth (retention metrics, cohorts, revenue)
- ❌ No A/B testing framework
- ❌ No live events/LiveOps system
- ❌ Security gaps (idempotency, rate limiting not wired)
- ❌ Monolithic codebase needs modularization

---

## 2. Complete Feature Inventory

### ✅ Fully Implemented Features (45 Features)

#### Identity & Authentication
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Device Authentication | ✅ Complete | Built-in Nakama | D1 +5% |
| Email Authentication | ✅ Complete | Built-in Nakama | D1 +3% |
| Custom ID Authentication | ✅ Complete | Built-in Nakama | D1 +2% |
| User Profile Management | ✅ Complete | `update_player_metadata` | D1 +2% |
| Geolocation Validation | ✅ Complete | `check_geo_and_update_profile` | Compliance |

#### Economy & Wallets
| Feature | Status | RPCs | ARPU Impact |
|---------|--------|------|-------------|
| Global Wallet (XUT, XP) | ✅ Complete | `wallet_get_all`, `wallet_update_global` | +10% |
| Per-Game Wallet | ✅ Complete | `wallet_update_game_wallet` | +5% |
| Transaction Logging | ✅ Complete | Automatic | Audit |
| Wallet Transfer | ✅ Complete | `wallet_transfer_between_game_wallets` | Engagement |

#### Leaderboards
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Daily Leaderboards | ✅ Complete | `get_time_period_leaderboard` | D1 +8% |
| Weekly Leaderboards | ✅ Complete | `get_time_period_leaderboard` | D7 +10% |
| Monthly Leaderboards | ✅ Complete | `get_time_period_leaderboard` | D30 +5% |
| All-Time Leaderboards | ✅ Complete | `get_time_period_leaderboard` | Engagement |
| Friends Leaderboards | ✅ Complete | `get_friend_leaderboard` | D7 +7% |
| Score Submission | ✅ Complete | `submit_score_to_time_periods` | Core |

#### Daily Engagement
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Daily Rewards | ✅ Complete | `daily_rewards_claim`, `daily_rewards_get_status` | D7 +15% |
| Streak Tracking | ✅ Complete | Built into daily rewards | D30 +10% |
| Daily Missions | ✅ Complete | `get_daily_missions`, `submit_mission_progress` | D1 +12% |
| Mission Rewards | ✅ Complete | `claim_mission_reward` | ARPU +3% |

#### Social Features
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Friends System | ✅ Complete | `friends_list`, `friends_block`, `friends_unblock` | D7 +8% |
| Friend Invites | ✅ Complete | `send_friend_invite`, `accept_friend_invite` | Viral +5% |
| Friend Challenges | ✅ Complete | `friends_challenge_user` | D1 +5% |
| Groups/Clans | ✅ Complete | `create_game_group`, `get_user_groups` | D30 +12% |
| Group XP | ✅ Complete | `update_group_xp` | D30 +5% |
| Group Wallet | ✅ Complete | `get_group_wallet`, `update_group_wallet` | ARPU +2% |

#### Notifications
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Push Registration | ✅ Complete | `push_register_token` | D7 +15% |
| Push Notifications | ✅ Complete | `push_send_event` | D7 +15% |
| In-App Notifications | ✅ Complete | Built-in Nakama | D1 +5% |

#### Achievements
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Achievement Definitions | ✅ Complete | Admin storage | Engagement |
| Achievement Progress | ✅ Complete | `achievements_update_progress` | D30 +8% |
| Achievement Unlock | ✅ Complete | `achievements_unlock` | Engagement |
| Achievement List | ✅ Complete | `achievements_get_all` | Engagement |

#### Retention Systems
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Season Pass / Battle Pass | ✅ Complete | `season_pass_*` | D30 +20%, ARPU +15% |
| Weekly Goals | ✅ Complete | `weekly_goals_*` | D7 +10% |
| Monthly Milestones | ✅ Complete | `monthly_milestones_*` | D30 +8% |
| Win-back System | ✅ Complete | `winback_*` | Churn -10% |
| Mastery/Prestige System | ✅ Complete | `mastery_*` | D30 +10% |
| Progressive Unlocks | ✅ Complete | `progressive_unlocks_*` | D7 +5% |

#### Monetization
| Feature | Status | RPCs | ARPU Impact |
|---------|--------|------|-------------|
| Rewarded Ads (Validated) | ✅ Complete | `rewarded_ad_request_token`, `rewarded_ad_claim` | +8% |
| IAP Verification | ✅ Complete | Built-in Nakama | Security |

#### Matchmaking & Multiplayer
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Matchmaking | ✅ Complete | Built-in Nakama | D1 +10% |
| Real-time Matches | ✅ Complete | Built-in Nakama | Engagement |
| Tournaments | ✅ Complete | Built-in Nakama | D7 +8% |

#### Analytics
| Feature | Status | RPCs | Value |
|---------|--------|------|-------|
| Event Tracking | ✅ Complete | `analytics_log_event` | Insights |
| DAU Tracking | ✅ Complete | Built into analytics | Metrics |
| Session Tracking | ✅ Complete | `analytics_session_start/end` | Metrics |

#### Onboarding
| Feature | Status | RPCs | Retention Impact |
|---------|--------|------|------------------|
| Step-by-Step Onboarding | ✅ Complete | `onboarding_*` | D1 +10% |
| Welcome Bonus | ✅ Complete | `onboarding_claim_welcome_bonus` | D1 +5% |
| First Quiz Bonus | ✅ Complete | `onboarding_first_quiz_complete` | D1 +5% |
| Streak Shield (New Users) | ✅ Complete | `onboarding_grant_streak_shield` | D7 +3% |
| Interest Selection | ✅ Complete | `onboarding_set_interests` | D1 +3% |

---

### ⚠️ Partially Implemented Features (6 Features)

| Feature | Status | Gap | Impact if Fixed |
|---------|--------|-----|-----------------|
| Friend Spectating | ⚠️ Code incomplete | RPC function cut off | D1 +3% |
| Chat System | ⚠️ Basic only | No custom moderation | D7 +5% |
| Caching | ⚠️ Code exists | Not wired to RPCs | Performance +50% |
| Rate Limiting | ⚠️ Code exists | Not wired to RPCs | Security |
| Idempotency | ⚠️ Not implemented | Currency exploits possible | Security Critical |
| Player Profile Service | ⚠️ Minimal | Only game-specific implementations | D1 +5% |

---

### ❌ Missing Features - Priority Implementation List

Based on logical analysis and industry standards, here are the **essential** features to implement:

#### 🎯 P0 - Critical (Must Have)

| Feature | Category | Effort | Impact | Description |
|---------|----------|--------|--------|-------------|
| **Player Level/XP System** | Progression | Medium | Very High | Global player level with XP from all activities |
| **A/B Testing Framework** | Infrastructure | High | Very High | Feature flags and experiment system |
| **Player Segmentation** | Analytics | Medium | Very High | Segment users (whale, dolphin, minnow, churning) |
| **Idempotency for Currency** | Security | Medium | Critical | Prevent duplicate transactions |
| **Rate Limiting Activation** | Security | Low | Critical | Wire existing code to all RPCs |
| **Generic Player Profile** | Player | Medium | High | One service that works for all games |

#### 🎯 P1 - High Priority (Should Have)

| Feature | Category | Effort | Impact | Description |
|---------|----------|--------|--------|-------------|
| **LiveOps Events System** | Engagement | High | Very High | Time-limited events with special rewards |
| **Inventory System** | Economy | Medium | High | Power-ups, cosmetics, collectibles |
| **VIP/Loyalty Program** | Monetization | Medium | High | Tiered benefits for engaged players |
| **Notification Scheduling** | Notifications | Medium | High | Schedule future notifications |
| **Notification Preferences** | Notifications | Low | High | User opt-in/out per category |
| **Analytics Enhancement** | Analytics | High | Very High | Retention metrics, cohorts, funnels |
| **Referral System** | Social | Medium | High | Track and reward friend referrals |
| **Lucky Wheel/Daily Spin** | Engagement | Medium | High | Daily free spin + premium spins |
| **Skill Rating (ELO/MMR)** | Competitive | Medium | High | For fair matchmaking |
| **League/Tier System** | Competitive | Medium | High | Bronze/Silver/Gold/Diamond progression |

#### 🎯 P2 - Medium Priority (Nice to Have)

| Feature | Category | Effort | Impact | Description |
|---------|----------|--------|--------|-------------|
| **Gift System** | Social | Medium | Medium | Send gifts to friends |
| **Limited-Time Offers** | Monetization | Medium | Medium | Flash sales, personalized offers |
| **Subscription System** | Monetization | High | Medium-High | Monthly subscription tiers |
| **Energy/Lives System** | Economy | Low | Medium | Standard mobile game mechanic |
| **Streak Recovery Purchase** | Monetization | Low | Medium | Monetize streak protection |
| **Friend Activity Feed** | Social | Medium | Medium | See friends' achievements |
| **Regional Leaderboards** | Competitive | Low | Medium | Country/region-based competition |
| **Category Leaderboards** | Competitive | Low | Medium | Per-category rankings |
| **Mystery Boxes/Gacha** | Monetization | Medium | Medium | Random reward mechanics |
| **Moderation Service** | Safety | Medium | High | Reports, bans, chat filters |

#### 🎯 P3 - Lower Priority (Future Consideration)

| Feature | Category | Effort | Impact | Description |
|---------|----------|--------|--------|-------------|
| **User-Generated Content** | Social | Very High | Medium | Player-created quizzes |
| **Spectator Mode** | Social | High | Low | Watch live games |
| **Replays** | Social | High | Low | Share epic moments |
| **Voice Answers** | Feature | Very High | Low | Answer with voice |
| **AR Features** | Feature | Very High | Low | Augmented reality |
| **Blockchain Integration** | Economy | Very High | Unknown | NFTs, crypto |

---

## 3. Feature Classification: Player vs Game Based

### Player-Based Features (Persist Across ALL Games)

These features are tied to the player identity and persist across all games:

| Feature | RPC Prefix | Storage Collection | Description |
|---------|------------|-------------------|-------------|
| **Identity** | `identity_*` | `player_data` | User creation, metadata, device linking |
| **Global Profile** | `profile_*` | `player_profiles` | Display name, avatar, bio, frames, titles |
| **Global Wallet** | `global_wallet_*` | `global_wallets` | XUT, gems, premium currency |
| **Player Level** | `player_level_*` | `player_progression` | Global XP and level |
| **Friends** | `friends_*` | Nakama built-in | Friend list, requests, blocking |
| **Groups/Clans** | `groups_*` | Nakama built-in | Group membership, roles |
| **Push Tokens** | `push_*` | `push_endpoints` | Device registration |
| **Notification Preferences** | `notification_prefs_*` | `notification_preferences` | Opt-in/out settings |
| **Player Settings** | `settings_*` | `player_settings` | Preferences, language |
| **VIP Status** | `vip_*` | `vip_status` | Loyalty tier and benefits |
| **Referrals** | `referral_*` | `referrals` | Referral tracking |

### Game-Based Features (Per-Game Isolation with gameId)

These features are isolated per game:

| Feature | RPC Prefix | Storage Collection | Description |
|---------|------------|-------------------|-------------|
| **Game Wallet** | `game_wallet_*` | `wallets` | Per-game currency |
| **Leaderboards** | `leaderboard_*` | Nakama built-in | All leaderboard types |
| **Daily Rewards** | `daily_rewards_*` | `<gameId>_daily_rewards` | Streak tracking |
| **Daily Missions** | `missions_*` | `<gameId>_missions` | Mission progress |
| **Achievements** | `achievements_*` | `<gameId>_achievements` | Game-specific achievements |
| **Season Pass** | `season_*` | `<gameId>_season_pass` | Battle pass progress |
| **Inventory** | `inventory_*` | `<gameId>_inventory` | Items, power-ups |
| **Skill Rating** | `rating_*` | `<gameId>_ratings` | ELO/MMR per game |
| **League Tier** | `league_*` | `<gameId>_leagues` | Competitive tier |
| **Events** | `events_*` | `<gameId>_events` | Live events |
| **Matchmaking** | `matchmaking_*` | N/A (real-time) | Player matching |
| **Tournaments** | `tournament_*` | Nakama built-in | Competitive events |

### App-Specific Features (QuizVerse Only)

| Feature | RPC Name | Storage Collection | Description |
|---------|----------|-------------------|-------------|
| **Quiz Results** | `quiz_submit_result` | `quiz_results_<gameId>` | Store quiz attempt |
| **Quiz History** | `quiz_get_history` | `quiz_results_<gameId>` | User's quiz history |
| **Daily Completion** | `quiz_check_daily_completion` | `quiz_results_<gameId>` | Daily quiz check |
| **Compatibility Quiz** | `compatibility_*` | `compatibility_sessions` | Partner matching |
| **Quiz Categories** | `quiz_categories_*` | `<gameId>_categories` | Category management |
| **Quiz Power-ups** | `quiz_powerups_*` | `<gameId>_powerups` | Hints, skips, extra time |
| **Link & Play** | `linkplay_*` | `linkplay_sessions` | Share quiz via link |

---

## 4. Service-by-Service Analysis

### 4.1 Push Notification Service

**Status:** ✅ EXISTS | **Location:** `data/modules/push_notifications/push_notifications.js`

**Currently Has:**
- Token registration (iOS, Android, Web, Windows)
- AWS SNS + Pinpoint + Lambda integration
- Per-game endpoint storage
- Send push to user endpoints
- Notification logging

**Needs to Add:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Scheduled Notifications | HIGH | Schedule pushes for future delivery |
| Notification Templates | HIGH | Predefined templates for common events |
| User Preferences | HIGH | Opt-in/out per notification category |
| Rate Limiting | HIGH | Max X notifications per day per user |
| Localization | HIGH | Multi-language support |
| Personalization | HIGH | Use player name, favorite category |
| Timezone Awareness | HIGH | Send at optimal local time |
| Analytics Integration | MEDIUM | Track open rates, conversion |

**Recommended RPCs to Add:**
```javascript
"notification_get_preferences"      // Get user's notification settings
"notification_update_preferences"   // Update notification opt-ins/outs
"notification_schedule"             // Schedule a future notification
"notification_cancel_scheduled"     // Cancel a scheduled notification
"notification_send_template"        // Send using predefined template
```

---

### 4.2 Analytics Service

**Status:** ⚠️ BASIC | **Location:** `data/modules/analytics/analytics.js`

**Currently Has:**
- Basic event logging
- DAU tracking
- Session start/end tracking

**Needs to Add:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Event Batching | HIGH | Batch multiple events for efficiency |
| Retention Metrics | HIGH | D1, D7, D14, D30, D60, D90 tracking |
| Revenue Tracking | HIGH | ARPU, ARPPU, LTV calculations |
| Funnel Tracking | HIGH | Onboarding, purchase funnels |
| Cohort Analysis | HIGH | Track users by signup date |
| User Segments | HIGH | Auto-segment (whale, churning, etc.) |
| Session Analytics | MEDIUM | Session length, frequency |
| Error Tracking | MEDIUM | Client error logging |

**Recommended RPCs to Add:**
```javascript
"analytics_log_events_batch"        // Log multiple events at once
"analytics_log_purchase"            // Specialized purchase event
"analytics_get_user_segment"        // Get user's current segment
"analytics_heartbeat"               // Session keepalive
"analytics_get_retention"           // Get retention metrics (admin)
"analytics_get_revenue_metrics"     // Get revenue metrics (admin)
```

---

### 4.3 Player Progression Service

**Status:** ⚠️ PARTIAL | **Location:** `data/modules/progression/`

**Currently Has:**
- Category Mastery System (XP per category)
- Prestige System (global progression tiers)
- Progressive Content Unlocks (7-day feature unlock)
- Badge rewards

**Needs to Add:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Player Level System | HIGH | Global player level with XP |
| Experience Points System | HIGH | Unified XP from all activities |
| Level Rewards | HIGH | Rewards for reaching each level |
| Statistics Tracking | HIGH | Comprehensive player stats |
| Skill Rating (ELO/MMR) | HIGH | For competitive matchmaking |
| Milestone Rewards | MEDIUM | Rewards for stat milestones |
| Titles/Ranks | MEDIUM | Cosmetic titles based on achievements |

**Recommended RPCs to Add:**
```javascript
"player_get_level"                  // Get current level and XP
"player_add_xp"                     // Add XP from any source
"player_claim_level_reward"         // Claim pending level rewards
"player_get_stats"                  // Get all player statistics
"player_get_rating"                 // Get skill rating/ELO
"player_get_rank_info"              // Get rank tier information
```

**Recommended Data Schema:**
```javascript
// Player Progression
{
  collection: "player_progression",
  key: "progression_{userId}_{gameId}",
  value: {
    level: 42,
    currentXP: 8500,
    xpToNextLevel: 10000,
    totalXPEarned: 425000,
    unclaimedLevelRewards: [40, 41, 42],
    skillRating: 1650,
    ratingTier: "gold",
    peakRating: 1720,
    lastUpdated: timestamp
  }
}

// Player Statistics
{
  collection: "player_statistics",
  key: "stats_{userId}_{gameId}",
  value: {
    gamesPlayed: 1500,
    gamesWon: 890,
    winRate: 0.593,
    totalPlayTime: 180000,
    highScore: 15000,
    currentWinStreak: 5,
    bestWinStreak: 23,
    currentLoginStreak: 12,
    bestLoginStreak: 45,
    achievementsUnlocked: 45,
    lastUpdated: timestamp
  }
}
```

---

### 4.4 Inventory Service

**Status:** ❌ MISSING

**Needs to Implement:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Item Storage | HIGH | Store user's items |
| Item Consumption | HIGH | Use/consume items |
| Item Granting | HIGH | Grant items from rewards |
| Item Catalog | HIGH | Define available items |
| Capacity Limits | MEDIUM | Inventory size limits |

**Item Categories:**
- **Power-ups:** 50/50 hints, time freeze, skip question, double points
- **Cosmetics:** Avatars, frames, badges, themes
- **Boosters:** 2x XP, coin multiplier (time-limited)
- **Collectibles:** Achievement badges, event trophies

**Recommended RPCs:**
```javascript
"inventory_get"                     // Get user's inventory
"inventory_add_item"                // Add item to inventory
"inventory_use_item"                // Use/consume item
"inventory_get_catalog"             // Get available items
```

---

### 4.5 Live Events Service

**Status:** ❌ MISSING

**Needs to Implement:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Event Definitions | HIGH | Define event structure |
| Event Scheduling | HIGH | Start/end times |
| Event Progress | HIGH | Track user progress |
| Event Rewards | HIGH | Claim event rewards |
| Event Leaderboards | MEDIUM | Event-specific rankings |

**Event Types:**
- **Weekend Challenges:** 48-hour special modes
- **Holiday Events:** Seasonal themed content
- **Tournament Events:** Bracketed competitions
- **Community Events:** Global goals

**Recommended RPCs:**
```javascript
"events_get_active"                 // Get currently active events
"events_get_upcoming"               // Get upcoming events
"events_get_progress"               // Get user's event progress
"events_claim_reward"               // Claim event reward
"events_get_leaderboard"            // Get event leaderboard
```

---

### 4.6 VIP/Loyalty Service

**Status:** ❌ MISSING

**Needs to Implement:**

| Tier | Points Required | Benefits |
|------|-----------------|----------|
| Bronze | 0 | Base experience |
| Silver | 1,000 | +10% XP, exclusive avatar |
| Gold | 5,000 | +20% XP, +10% coins, priority support |
| Platinum | 25,000 | +30% XP, +20% coins, exclusive content |
| Diamond | 100,000 | +50% XP, +30% coins, VIP chat, early access |

**Recommended RPCs:**
```javascript
"vip_get_status"                    // Get VIP status and benefits
"vip_get_tiers"                     // Get available VIP tiers
"vip_check_benefit"                 // Check if user has specific benefit
"vip_add_points"                    // Add VIP points (internal)
```

---

### 4.7 Referral Service

**Status:** ❌ MISSING

**Needs to Implement:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Referral Codes | HIGH | Generate unique codes per user |
| Referral Tracking | HIGH | Track who referred whom |
| Referral Rewards | HIGH | Rewards for referrer and referee |
| Referral Stats | MEDIUM | Count of successful referrals |

**Recommended RPCs:**
```javascript
"referral_get_code"                 // Get user's referral code
"referral_apply_code"               // Apply referral code (new user)
"referral_get_stats"                // Get referral statistics
"referral_claim_reward"             // Claim referral reward
```

---

### 4.8 Lucky Wheel/Daily Spin Service

**Status:** ❌ MISSING

**Needs to Implement:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Daily Free Spin | HIGH | One free spin per day |
| Premium Spins | HIGH | Purchase additional spins |
| Weighted Outcomes | HIGH | Configurable probabilities |
| Pity System | MEDIUM | Guaranteed rare after X spins |
| Spin History | LOW | Track spin results |

**Recommended RPCs:**
```javascript
"spin_get_status"                   // Get spin availability
"spin_execute"                      // Execute a spin
"spin_get_wheel_config"             // Get wheel configuration
"spin_purchase_spins"               // Purchase additional spins
```

---

### 4.9 Energy/Lives Service

**Status:** ❌ MISSING

**Needs to Implement:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Energy Pool | HIGH | Current/max energy |
| Energy Consumption | HIGH | Use energy to play |
| Auto-Refill | HIGH | Regenerate over time |
| Energy Purchase | HIGH | Buy with currency |
| Ad Refill | MEDIUM | Watch ad for energy |

**Recommended RPCs:**
```javascript
"energy_get"                        // Get current energy
"energy_consume"                    // Use energy
"energy_refill"                     // Refill energy
"energy_get_refill_time"            // Get time until next free refill
```

---

### 4.10 Moderation Service

**Status:** ❌ MISSING

**Needs to Implement:**

| Feature | Priority | Description |
|---------|----------|-------------|
| Report Player | HIGH | Submit player report |
| Block Player | HIGH | Block from interactions |
| Chat Filter | HIGH | Filter inappropriate content |
| Username Filter | HIGH | Prevent inappropriate names |
| Ban System | HIGH | Temporary/permanent bans |

**Recommended RPCs:**
```javascript
"moderation_report_player"          // Report a player
"moderation_block_player"           // Block a player
"moderation_get_blocked"            // Get blocked players
"moderation_unblock_player"         // Unblock a player
```

---

## 5. Execution Plan (14 Weeks)

### Phase 1: Foundation & Architecture (Weeks 1-3)

**Goal:** Establish clean architecture and modular codebase

#### Week 1: Module Separation
- [ ] Create bundler configuration (esbuild/Rollup)
- [ ] Split `index.js` into domain modules:
  - `core/` - Utilities, validation, error handling
  - `domains/identity/` - User creation, authentication
  - `domains/economy/` - Wallet, transactions
  - `domains/leaderboards/` - Score submission, rankings
  - `domains/social/` - Friends, groups, chat
  - `domains/progression/` - XP, levels, achievements
  - `domains/engagement/` - Daily rewards, missions, streaks
  - `domains/matchmaking/` - Match finding, tournaments
  - `domains/analytics/` - Event tracking, metrics
  - `domains/notifications/` - Push, in-app notifications
- [ ] Create single `index.js` entry point via bundler
- [ ] Validate all 175+ RPCs still work

#### Week 2: Core Utilities Standardization
- [ ] Create `core/validation.js` - Input validation
- [ ] Create `core/errors.js` - Error factory with standard codes
- [ ] Create `core/storage.js` - Storage helpers
- [ ] Create `core/logger.js` - Structured logging
- [ ] Migrate all RPCs to use new utilities

#### Week 3: Schema Versioning
- [ ] Define schema version constants for each domain
- [ ] Implement migration runner
- [ ] Add `schemaVersion` to all storage objects
- [ ] Create migration scripts for existing data

---

### Phase 2: Security & Reliability (Weeks 4-5)

**Goal:** Prevent exploits and ensure data integrity

#### Week 4: Idempotency & Rate Limiting
- [ ] Create `core/idempotency.js`
- [ ] Apply idempotency to critical RPCs:
  - `wallet_update_global`
  - `wallet_update_game_wallet`
  - `daily_rewards_claim`
  - `claim_mission_reward`
  - `achievement_unlock`
  - `rewarded_ad_claim`
  - `season_pass_claim_reward`
- [ ] Wire `infrastructure/rate_limiting.js` to all RPCs
- [ ] Apply rate limits by category:

| Category | Max Calls | Window |
|----------|-----------|--------|
| Write | 30/min | 60s |
| Read | 100/min | 60s |
| Auth | 10/min | 60s |
| Sensitive | 5/min | 60s |

#### Week 5: Input Validation & Secrets
- [ ] Audit all 175+ RPCs for validation gaps
- [ ] Create validation schemas per RPC
- [ ] Implement fail-fast validation
- [ ] Move all secrets to environment variables
- [ ] Add startup validation for required env vars

---

### Phase 3: Performance Optimization (Weeks 6-7)

**Goal:** Reduce latency and database load

#### Week 6: Caching & Batch Operations
- [ ] Wire `infrastructure/caching.js` to read RPCs
- [ ] Apply caching by data type:

| Data Type | TTL |
|-----------|-----|
| Leaderboard records | 60s |
| Player profile | 300s |
| Achievement definitions | 600s |
| Game registry | 3600s |

- [ ] Implement cache invalidation on writes
- [ ] Implement batch read/write patterns
- [ ] Create `infrastructure/batch_operations.js` wrapper

#### Week 7: Query & Payload Optimization
- [ ] Audit storage access patterns
- [ ] Optimize key structures
- [ ] Add pagination to list endpoints
- [ ] Implement field selection/projection
- [ ] Reduce average payload size

---

### Phase 4: Observability & Monitoring (Week 8)

**Goal:** Production-grade monitoring and debugging

- [ ] Implement JSON structured logging
- [ ] Add correlation IDs (traceId) to all RPCs
- [ ] Create `core/metrics.js`
- [ ] Track per-RPC metrics (count, latency, errors)
- [ ] Expose Prometheus metrics endpoint
- [ ] Create Grafana dashboard templates
- [ ] Implement error aggregation and alerting

---

### Phase 5: Testing & Quality Assurance (Weeks 9-10)

**Goal:** Ensure reliability through comprehensive testing

#### Week 9: Unit & Integration Testing
- [ ] Set up Jest/Mocha testing framework
- [ ] Create mock `nk` object for testing
- [ ] Write unit tests for critical domains (80%+ coverage)
- [ ] Create integration test suite
- [ ] Set up CI/CD pipeline

#### Week 10: Load & Security Testing
- [ ] Set up load testing framework (k6)
- [ ] Test 1000 concurrent users
- [ ] Identify and fix bottlenecks
- [ ] Penetration testing
- [ ] Test rate limiting and idempotency

---

### Phase 6: Feature Implementation (Weeks 11-12)

**Goal:** Implement missing critical features

#### Week 11: Player Progression & Profile
- [ ] Implement Player Level/XP System
- [ ] Implement Generic Player Profile Service
- [ ] Implement Player Statistics Tracking
- [ ] Implement Skill Rating (ELO/MMR)

#### Week 12: Engagement Features
- [ ] Implement Inventory System
- [ ] Implement Lucky Wheel/Daily Spin
- [ ] Implement Notification Preferences
- [ ] Implement Notification Scheduling

---

### Phase 7: Production Hardening (Weeks 13-14)

**Goal:** Production-ready deployment

#### Week 13: High Availability & DR
- [ ] Configure database replication
- [ ] Set up Nakama server clustering
- [ ] Implement health checks
- [ ] Configure auto-scaling
- [ ] Implement automated backups
- [ ] Create restore procedures

#### Week 14: Documentation & Audit
- [ ] Update API documentation
- [ ] Create operations runbook
- [ ] Document all RPCs with examples
- [ ] Code review all changes
- [ ] Security audit
- [ ] Performance validation
- [ ] Sign-off for production

---

## 6. Retention Strategy & Benchmarks

### Industry Benchmarks

| Metric | Industry Average | Top 10% | Our Target |
|--------|------------------|---------|------------|
| D1 Retention | 25-35% | 40%+ | **40%** |
| D7 Retention | 10-15% | 20%+ | **20%** |
| D30 Retention | 3-5% | 10%+ | **10%** |
| D90 Retention | 1-2% | 5%+ | **5%** |

### D1 Retention Strategy (Target: 40%)

| Feature | Status | Impact |
|---------|--------|--------|
| Onboarding Tutorial | ✅ | +10% |
| Welcome Bonus | ✅ | +5% |
| Push Notification (24h) | ✅ | +3% |
| First Win Bonus | ✅ | +5% |
| Easy Early Wins | ⚠️ Needs work | +5% |
| Social Prompt | ❌ Missing | +3% |

**Actions:**
1. Implement beginner matchmaking (first 3 games against easier opponents)
2. Add "Connect with Friends" prompt after first win
3. Optimize 24-hour push notification timing

### D7 Retention Strategy (Target: 20%)

| Feature | Status | Impact |
|---------|--------|--------|
| Daily Rewards Streak | ✅ | +15% |
| Weekly Goals | ✅ | +10% |
| Friends Leaderboard | ✅ | +7% |
| Push Re-engagement | ✅ | +3% |
| Weekly Events | ❌ Missing | +8% |
| Streak Protection | ❌ Missing | +5% |

**Actions:**
1. Implement LiveOps weekly events
2. Add streak shield purchase option
3. Add "Friend beat your score" notifications

### D30 Retention Strategy (Target: 10%)

| Feature | Status | Impact |
|---------|--------|--------|
| Monthly Milestones | ✅ | +8% |
| Season Pass | ✅ | +20% |
| Mastery System | ✅ | +10% |
| Groups/Clans | ✅ | +12% |
| VIP Program | ❌ Missing | +15% |
| Guild Wars | ❌ Missing | +5% |

**Actions:**
1. Implement VIP/Loyalty program
2. Add guild weekly competitions
3. Add achievement chains (multi-step achievements)

---

## 7. ARPU Optimization

### Current ARPU Breakdown

| Feature | Status | Est. ARPU Impact |
|---------|--------|------------------|
| Rewarded Ads | ✅ | +$0.05/DAU |
| IAP (Gems) | ✅ | +$0.10/DAU |
| Season Pass | ✅ | +$0.08/DAU |
| **Current Total** | | **~$0.23/DAU** |

### Target ARPU Breakdown

| Feature | Priority | Est. ARPU Impact |
|---------|----------|------------------|
| VIP Subscription | P1 | +$0.15/DAU |
| Lucky Wheel | P1 | +$0.08/DAU |
| Limited-Time Offers | P2 | +$0.10/DAU |
| Personalized Offers | P1 | +$0.12/DAU |
| Premium Cosmetics | P2 | +$0.05/DAU |
| Streak Recovery | P2 | +$0.03/DAU |
| **Target Total** | | **~$0.76/DAU** |

### Monetization Implementation Roadmap

#### Phase 1: Quick Wins (Weeks 1-4)
1. **Personalized Starter Packs** - Segment new users, offer tailored packs (+$0.05/DAU)
2. **Enhanced Rewarded Ads** - More placements, better rewards (+$0.03/DAU)

#### Phase 2: Core Systems (Weeks 5-8)
1. **Lucky Wheel** - Daily free spin, premium bundles (+$0.08/DAU)
2. **Limited-Time Offers** - Flash sales, bundle deals (+$0.10/DAU)

#### Phase 3: Recurring Revenue (Weeks 9-12)
1. **VIP Subscription** - Monthly tiers with benefits (+$0.15/DAU)
2. **Battle Pass Plus** - Enhanced season pass (+$0.05/DAU)

#### Phase 4: Advanced (Weeks 13-16)
1. **Personalization Engine** - ML-based offer optimization (+$0.12/DAU)
2. **Streak Recovery Purchase** - Monetize streak protection (+$0.03/DAU)

---

## 8. Folder Structure Proposal

```
data/modules/
├── build/                          # Build configuration
│   ├── esbuild.config.js
│   └── build.sh
│
├── src/                            # Source files (modular)
│   ├── core/                       # Shared utilities
│   │   ├── validation.js           # Input validation
│   │   ├── errors.js               # Error factory
│   │   ├── storage.js              # Storage helpers
│   │   ├── logger.js               # Structured logging
│   │   ├── config.js               # Environment config
│   │   ├── idempotency.js          # Idempotency middleware
│   │   ├── metrics.js              # Metrics collection
│   │   └── migrations.js           # Schema migrations
│   │
│   ├── infrastructure/             # Cross-cutting concerns
│   │   ├── caching.js              # Caching layer
│   │   ├── rate_limiting.js        # Rate limiting
│   │   └── batch_operations.js     # Batch processing
│   │
│   ├── generic/                    # Reusable across ALL games
│   │   ├── player/                 # Player-based features
│   │   │   ├── identity.rpc.js
│   │   │   ├── profile.rpc.js
│   │   │   ├── progression.rpc.js  # Level, XP, stats
│   │   │   ├── global_wallet.rpc.js
│   │   │   ├── friends.rpc.js
│   │   │   ├── groups.rpc.js
│   │   │   ├── achievements.rpc.js
│   │   │   ├── notifications.rpc.js
│   │   │   ├── notification_prefs.rpc.js
│   │   │   ├── vip.rpc.js
│   │   │   ├── referrals.rpc.js
│   │   │   ├── settings.rpc.js
│   │   │   └── analytics.rpc.js
│   │   │
│   │   └── game/                   # Game-based features
│   │       ├── leaderboards.rpc.js
│   │       ├── game_wallet.rpc.js
│   │       ├── daily_rewards.rpc.js
│   │       ├── daily_missions.rpc.js
│   │       ├── weekly_goals.rpc.js
│   │       ├── monthly_milestones.rpc.js
│   │       ├── season_pass.rpc.js
│   │       ├── inventory.rpc.js
│   │       ├── lucky_wheel.rpc.js
│   │       ├── energy.rpc.js
│   │       ├── events.rpc.js
│   │       ├── matchmaking.rpc.js
│   │       ├── tournaments.rpc.js
│   │       ├── skill_rating.rpc.js
│   │       └── moderation.rpc.js
│   │
│   ├── games/                      # Game-specific implementations
│   │   ├── quizverse/              # QuizVerse-specific
│   │   │   ├── quiz_results.rpc.js
│   │   │   ├── compatibility_quiz.rpc.js
│   │   │   ├── quiz_categories.rpc.js
│   │   │   ├── quiz_powerups.rpc.js
│   │   │   └── quiz_achievements.js
│   │   │
│   │   └── lasttolive/             # LastToLive-specific
│   │       ├── weapon_stats.rpc.js
│   │       ├── survival_modes.rpc.js
│   │       └── ltl_achievements.js
│   │
│   ├── schemas/                    # Data schemas
│   │   ├── player.schema.js
│   │   ├── wallet.schema.js
│   │   ├── inventory.schema.js
│   │   ├── progression.schema.js
│   │   └── achievement.schema.js
│   │
│   └── registry.js                 # RPC registration
│
├── dist/                           # Built output
│   └── index.js                    # Bundled module
│
├── tests/                          # Test files
│   ├── unit/
│   ├── integration/
│   └── mocks/
│
└── index.js                        # Entry point
```

---

## 9. Success Metrics

### Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| P50 Latency | ~100ms | <50ms |
| P99 Latency | ~500ms | <200ms |
| Error Rate | ~2% | <0.1% |
| Cache Hit Rate | 0% | >80% |
| DB Queries/Request | 5-10 | 1-3 |

### Reliability Targets

| Metric | Current | Target |
|--------|---------|--------|
| Uptime | 99% | 99.9% |
| Mean Time to Recovery | Hours | <15 minutes |
| Data Loss | Possible | Zero |

### Code Quality Targets

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage | 0% | 80%+ |
| Code Duplication | High | <5% |
| Documentation | Partial | 100% |

### Business Metrics Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| D7 Retention | ~15% | 20% | +33% |
| D30 Retention | ~5% | 10% | +100% |
| ARPU | $0.23/DAU | $0.50/DAU | +117% |
| Payer Conversion | ~3% | 8% | +167% |

---

## 10. Risk Mitigation

### High-Risk Items

| Risk | Mitigation |
|------|------------|
| **Monolithic Split** - Breaking existing functionality | Comprehensive testing, gradual rollout |
| **Rate Limiting** - Blocking legitimate users | Start with generous limits, monitor and adjust |
| **Caching** - Stale data issues | Proper invalidation, short TTLs initially |
| **Idempotency** - Breaking existing clients | Make idempotency key optional initially |
| **New Features** - Scope creep | Strict prioritization, MVP approach |

---

## 11. Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Weeks 1-3 | Foundation & Architecture |
| Phase 2 | Weeks 4-5 | Security & Reliability |
| Phase 3 | Weeks 6-7 | Performance Optimization |
| Phase 4 | Week 8 | Observability & Monitoring |
| Phase 5 | Weeks 9-10 | Testing & QA |
| Phase 6 | Weeks 11-12 | Feature Implementation |
| Phase 7 | Weeks 13-14 | Production Hardening |

**Total Duration: 14 weeks**

---

## 12. Next Steps

1. ✅ Review and approve this master plan
2. ⬜ Assign team members to phases
3. ⬜ Set up project tracking (Jira/Linear)
4. ⬜ Begin Phase 1: Foundation & Architecture
5. ⬜ Schedule weekly progress reviews

---

## Appendix A: Complete RPC List by Category

### Player-Based RPCs (Generic)
```
identity_create_or_sync_user
identity_get_user
profile_get
profile_get_public
profile_update
profile_set_avatar
player_get_level
player_add_xp
player_claim_level_reward
player_get_stats
global_wallet_get
global_wallet_update
friends_list
friends_add
friends_remove
friends_block
friends_unblock
groups_create
groups_join
groups_leave
groups_list
push_register_token
push_get_endpoints
notification_get_preferences
notification_update_preferences
notification_schedule
vip_get_status
vip_get_tiers
referral_get_code
referral_apply_code
referral_get_stats
settings_get
settings_update
analytics_log_event
analytics_log_events_batch
```

### Game-Based RPCs (Per gameId)
```
game_wallet_get
game_wallet_update
leaderboard_submit_score
leaderboard_get
leaderboard_get_friends
leaderboard_get_around_user
daily_rewards_get_status
daily_rewards_claim
missions_get_daily
missions_submit_progress
missions_claim_reward
weekly_goals_get_status
weekly_goals_update_progress
weekly_goals_claim_reward
monthly_milestones_get_status
monthly_milestones_update_progress
monthly_milestones_claim_reward
season_pass_get_status
season_pass_claim_reward
season_pass_purchase_premium
achievements_get_all
achievements_update_progress
achievements_unlock
achievements_claim_reward
inventory_get
inventory_add_item
inventory_use_item
inventory_get_catalog
spin_get_status
spin_execute
spin_purchase_spins
energy_get
energy_consume
energy_refill
events_get_active
events_get_progress
events_claim_reward
matchmaking_find
matchmaking_cancel
tournament_join
tournament_leave
rating_get
rating_get_rank
moderation_report_player
moderation_block_player
```

### QuizVerse-Specific RPCs
```
quizverse_submit_quiz_result
quizverse_get_quiz_history
quizverse_check_daily_completion
quizverse_get_categories
quizverse_get_powerups
quizverse_use_powerup
compatibility_start_session
compatibility_submit_answers
compatibility_get_results
linkplay_create_session
linkplay_join_session
linkplay_get_results
```

---

*This master plan should be reviewed and updated as implementation progresses.*

**Document Version History:**
- v2.0 (Feb 4, 2026) - Combined master plan
- v1.0 (Feb 4, 2026) - Initial separate documents

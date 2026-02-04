# RPC Catalog - Complete Inventory

**Last Updated:** 2026-02-04  
**Total RPCs:** 175+  
**Source:** `data/modules/index.js` → `InitModule()` function

---

## RPC Classification Schema

| Field | Values | Description |
|-------|--------|-------------|
| **Handler** | Function name | Handler function in index.js |
| **Read/Write** | READ / WRITE | Storage mutation classification |
| **Sensitive** | YES / NO | Currency/reward mutations requiring idempotency |
| **Rate Limit** | Preset name | Rate limit category (WRITE/READ/AUTH/etc.) |
| **Idempotency** | REQUIRED / OPTIONAL / NO | Whether idempotency key needed |
| **Validation** | Schema reference | Input validation requirements |
| **Storage** | Collections touched | Storage collections accessed |
| **Caching** | YES / NO | Currently cached (all NO) |
| **Game Scope** | GLOBAL / PER_GAME | gameId isolation |

---

## Critical Currency/Reward RPCs (Idempotency Required)

| RPC Name | Handler | Write? | Sensitive? | Current Idempotency | Storage |
|----------|---------|--------|------------|---------------------|---------|
| `wallet_update_global` | `rpcWalletUpdateGlobal` | ✅ YES | ✅ YES | ❌ NO | `wallets`, `transaction_logs` |
| `wallet_update_game_wallet` | `rpcWalletUpdateGameWallet` | ✅ YES | ✅ YES | ❌ NO | `wallets`, `transaction_logs` |
| `daily_rewards_claim` | `rpcDailyRewardsClaim` | ✅ YES | ✅ YES | ❌ NO | `daily_streaks`, `wallets` |
| `claim_mission_reward` | `rpcClaimMissionReward` | ✅ YES | ✅ YES | ❌ NO | `mission_progress`, `wallets` |
| `rewarded_ad_claim` | `rpcRewardedAdClaim` | ✅ YES | ✅ YES | ❌ NO | `rewarded_ad_claims`, `wallets` |
| `season_pass_claim_reward` | `rpcSeasonPassClaimReward` | ✅ YES | ✅ YES | ❌ NO | `season_pass`, `wallets` |
| `weekly_goals_claim_reward` | `rpcWeeklyGoalsClaimReward` | ✅ YES | ✅ YES | ❌ NO | `weekly_goals`, `wallets` |
| `monthly_milestones_claim_reward` | `rpcMonthlyMilestonesClaimReward` | ✅ YES | ✅ YES | ❌ NO | `monthly_milestones`, `wallets` |
| `onboarding_claim_welcome_bonus` | `rpcOnboardingClaimWelcomeBonus` | ✅ YES | ✅ YES | ❌ NO | `onboarding`, `wallets` |
| `retention_claim_welcome_bonus` | `rpcRetentionClaimWelcomeBonus` | ✅ YES | ✅ YES | ❌ NO | `retention`, `wallets` |
| `winback_claim_rewards` | `rpcWinbackClaimRewards` | ✅ YES | ✅ YES | ❌ NO | `winback`, `wallets` |
| `tournament_claim_rewards` | `rpcTournamentClaimRewards` | ✅ YES | ✅ YES | ❌ NO | `tournaments`, `wallets` |
| `achievements_unlock` | `rpcAchievementsUnlock` | ✅ YES | ✅ YES | ❌ NO | `achievements`, `wallets` |

**Total Critical RPCs:** 13 requiring immediate idempotency protection.

---

## Complete RPC Inventory by Domain

### 1. Identity & Player Management (10 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Validation | Storage | Game Scope |
|----------|---------|------------|------------|------------|---------|------------|
| `create_or_sync_user` | `createOrSyncUser` | WRITE | WRITE | `{username, device_id, game_id}` | `player_metadata`, `wallets` | PER_GAME |
| `rpc_update_player_metadata` | `rpcUpdatePlayerMetadataUnified` | WRITE | WRITE | Complex (see handler) | `player_metadata` | GLOBAL |
| `get_player_metadata` | `rpcGetPlayerMetadata` | READ | READ | `{userId?}` | `player_metadata` | GLOBAL |
| `admin_delete_player_metadata` | `rpcAdminDeletePlayerMetadata` | WRITE | ADMIN | `{userId}` | `player_metadata` | GLOBAL |
| `get_player_portfolio` | `rpcGetPlayerPortfolio` | READ | READ | `{userId?}` | Multiple | GLOBAL |
| `check_geo_and_update_profile` | `rpcCheckGeoAndUpdateProfile` | WRITE | WRITE | `{latitude, longitude}` | `player_metadata` | GLOBAL |
| `create_player_wallet` | `rpcCreatePlayerWallet` | WRITE | WRITE | `{gameId}` | `wallets` | PER_GAME |
| `update_wallet_balance` | `rpcUpdateWalletBalance` | WRITE | WRITE | `{gameId, currency, amount}` | `wallets` | PER_GAME |
| `get_wallet_balance` | `rpcGetWalletBalance` | READ | READ | `{gameId}` | `wallets` | PER_GAME |
| `cleanup_guest_user_metadata` | `rpcCleanupGuestUserMetadata` | WRITE | ADMIN | `{limit?}` | `player_metadata` | GLOBAL |

---

### 2. Wallet System (8 RPCs)

| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency | Storage |
|----------|---------|------------|------------|------------|-------------|---------|
| `wallet_get_all` | `rpcWalletGetAll` | READ | NO | READ | NO | `wallets`, `global_wallets` |
| `wallet_update_global` | `rpcWalletUpdateGlobal` | WRITE | ✅ YES | WRITE | ❌ REQUIRED | `wallets`, `transaction_logs` |
| `wallet_update_game_wallet` | `rpcWalletUpdateGameWallet` | WRITE | ✅ YES | WRITE | ❌ REQUIRED | `wallets`, `transaction_logs` |
| `wallet_transfer_between_game_wallets` | `rpcWalletTransferBetweenGameWallets` | WRITE | ✅ YES | WRITE | ❌ REQUIRED | `wallets`, `transaction_logs` |
| `wallet_get_balances` | `rpcWalletGetBalances` | READ | NO | READ | NO | `wallets` |
| `create_or_get_wallet` | `createOrGetWallet` | READ | NO | READ | NO | `wallets` |
| `get_user_wallet` | `getUserWallet` | READ | NO | READ | NO | `wallets` |
| `link_wallet_to_game` | `linkWalletToGame` | WRITE | NO | WRITE | NO | `wallets` |

---

### 3. Leaderboards (10 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Caching | Storage | Game Scope |
|----------|---------|------------|------------|---------|---------|------------|
| `create_time_period_leaderboards` | `rpcCreateTimePeriodLeaderboards` | WRITE | ADMIN | NO | `leaderboards_registry` | PER_GAME |
| `submit_score_to_time_periods` | `rpcSubmitScoreToTimePeriods` | WRITE | WRITE | NO | Nakama leaderboards | PER_GAME |
| `get_time_period_leaderboard` | `rpcGetTimePeriodLeaderboard` | READ | READ | ❌ YES (60s) | Nakama leaderboards | PER_GAME |
| `create_all_leaderboards_persistent` | `createAllLeaderboardsPersistent` | WRITE | ADMIN | NO | `leaderboards_registry` | GLOBAL |
| `submit_score_and_sync` | `submitScoreAndSync` | WRITE | WRITE | NO | Nakama leaderboards | PER_GAME |
| `submit_score_sync` | `rpcSubmitScoreSync` | WRITE | WRITE | NO | Nakama leaderboards | PER_GAME |
| `submit_score_with_aggregate` | `rpcSubmitScoreWithAggregate` | WRITE | WRITE | NO | Nakama leaderboards | GLOBAL |
| `submit_score_with_friends_sync` | `rpcSubmitScoreWithFriendsSync` | WRITE | WRITE | NO | Nakama leaderboards | PER_GAME |
| `get_friend_leaderboard` | `rpcGetFriendLeaderboard` | READ | READ | ❌ YES (60s) | Nakama leaderboards | PER_GAME |
| `get_all_leaderboards` | `getAllLeaderboards` | READ | READ | ❌ YES (60s) | Nakama leaderboards | PER_GAME |
| `create_all_leaderboards_with_friends` | `rpcCreateAllLeaderboardsWithFriends` | WRITE | ADMIN | NO | `leaderboards_registry` | PER_GAME |
| `submit_leaderboard_score` | `rpcSubmitLeaderboardScore` | WRITE | WRITE | NO | Nakama leaderboards | PER_GAME |
| `get_leaderboard` | `rpcGetLeaderboard` | READ | READ | ❌ YES (60s) | Nakama leaderboards | PER_GAME |

**Note:** All leaderboard READ RPCs should use caching (currently none do).

---

### 4. Daily Rewards (2 RPCs)

| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency | Storage |
|----------|---------|------------|------------|------------|-------------|---------|
| `daily_rewards_get_status` | `rpcDailyRewardsGetStatus` | READ | NO | READ | NO | `daily_streaks` |
| `daily_rewards_claim` | `rpcDailyRewardsClaim` | WRITE | ✅ YES | WRITE | ❌ REQUIRED | `daily_streaks`, `wallets` |

---

### 5. Daily Missions (3 RPCs)

| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency | Storage |
|----------|---------|------------|------------|------------|-------------|---------|
| `get_daily_missions` | `rpcGetDailyMissions` | READ | NO | READ | NO | `mission_progress` |
| `submit_mission_progress` | `rpcSubmitMissionProgress` | WRITE | NO | WRITE | NO | `mission_progress` |
| `claim_mission_reward` | `rpcClaimMissionReward` | WRITE | ✅ YES | WRITE | ❌ REQUIRED | `mission_progress`, `wallets` |

---

### 6. Retention Systems (20 RPCs)

#### Weekly Goals (4 RPCs)
| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `weekly_goals_get_status` | `rpcWeeklyGoalsGetStatus` | READ | NO | READ | NO |
| `weekly_goals_update_progress` | `rpcWeeklyGoalsUpdateProgress` | WRITE | NO | WRITE | NO |
| `weekly_goals_claim_reward` | `rpcWeeklyGoalsClaimReward` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |
| `weekly_goals_claim_bonus` | `rpcWeeklyGoalsClaimBonus` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |

#### Season Pass (5 RPCs)
| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `season_pass_get_status` | `rpcSeasonPassGetStatus` | READ | NO | READ | NO |
| `season_pass_add_xp` | `rpcSeasonPassAddXP` | WRITE | NO | WRITE | NO |
| `season_pass_complete_quest` | `rpcSeasonPassCompleteQuest` | WRITE | NO | WRITE | NO |
| `season_pass_claim_reward` | `rpcSeasonPassClaimReward` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |
| `season_pass_purchase_premium` | `rpcSeasonPassPurchasePremium` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |

#### Monthly Milestones (4 RPCs)
| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|-------------|-------------|
| `monthly_milestones_get_status` | `rpcMonthlyMilestonesGetStatus` | READ | NO | READ | NO |
| `monthly_milestones_update_progress` | `rpcMonthlyMilestonesUpdateProgress` | WRITE | NO | WRITE | NO |
| `monthly_milestones_claim_reward` | `rpcMonthlyMilestonesClaimReward` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |
| `monthly_milestones_claim_legendary` | `rpcMonthlyMilestonesClaimLegendary` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |

#### Collections (4 RPCs)
| RPC Name | Handler | Read/Write | Rate Limit | Idempotency |
|----------|---------|------------|------------|-------------|
| `collections_get_status` | `rpcCollectionsGetStatus` | READ | READ | NO |
| `collections_unlock_item` | `rpcCollectionsUnlockItem` | WRITE | WRITE | NO |
| `collections_equip_item` | `rpcCollectionsEquipItem` | WRITE | WRITE | NO |
| `collections_add_mastery_xp` | `rpcCollectionsAddMasteryXP` | WRITE | WRITE | NO |

#### Winback (4 RPCs)
| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `winback_check_status` | `rpcWinbackCheckStatus` | READ | NO | READ | NO |
| `winback_claim_rewards` | `rpcWinbackClaimRewards` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |
| `winback_record_session` | `rpcWinbackRecordSession` | WRITE | NO | WRITE | NO |
| `winback_schedule_reengagement` | `rpcWinbackScheduleReengagement` | WRITE | NO | WRITE | NO |

#### Retention Core (7 RPCs)
| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `retention_grant_streak_shield` | `rpcRetentionGrantStreakShield` | WRITE | NO | WRITE | NO |
| `retention_get_streak_shield` | `rpcRetentionGetStreakShield` | READ | NO | READ | NO |
| `retention_use_streak_shield` | `rpcRetentionUseStreakShield` | WRITE | NO | WRITE | NO |
| `retention_schedule_notification` | `rpcRetentionScheduleNotification` | WRITE | NO | WRITE | NO |
| `retention_get_recommendations` | `rpcRetentionGetRecommendations` | READ | NO | READ | NO |
| `retention_track_first_session` | `rpcRetentionTrackFirstSession` | WRITE | NO | WRITE | NO |
| `retention_claim_welcome_bonus` | `rpcRetentionClaimWelcomeBonus` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |

---

### 7. Onboarding (11 RPCs)

| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `onboarding_get_state` | `rpcOnboardingGetState` | READ | NO | READ | NO |
| `onboarding_update_state` | `rpcOnboardingUpdateState` | WRITE | NO | WRITE | NO |
| `onboarding_complete_step` | `rpcOnboardingCompleteStep` | WRITE | NO | WRITE | NO |
| `onboarding_set_interests` | `rpcOnboardingSetInterests` | WRITE | NO | WRITE | NO |
| `onboarding_get_interests` | `rpcOnboardingGetInterests` | READ | NO | READ | NO |
| `onboarding_claim_welcome_bonus` | `rpcOnboardingClaimWelcomeBonus` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |
| `onboarding_first_quiz_complete` | `rpcOnboardingFirstQuizComplete` | WRITE | NO | WRITE | NO |
| `onboarding_get_tomorrow_preview` | `rpcOnboardingGetTomorrowPreview` | READ | NO | READ | NO |
| `onboarding_track_session` | `rpcOnboardingTrackSession` | WRITE | NO | WRITE | NO |
| `onboarding_get_retention_data` | `rpcOnboardingGetRetentionData` | READ | NO | READ | NO |
| `onboarding_create_link_quiz` | `rpcOnboardingCreateLinkQuiz` | WRITE | NO | WRITE | NO |

---

### 8. Friends & Social (15 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `friends_block` | `rpcFriendsBlock` | WRITE | SOCIAL | Nakama friends |
| `friends_unblock` | `rpcFriendsUnblock` | WRITE | SOCIAL | Nakama friends |
| `friends_remove` | `rpcFriendsRemove` | WRITE | SOCIAL | Nakama friends |
| `friends_list` | `rpcFriendsList` | READ | READ | Nakama friends |
| `friends_challenge_user` | `rpcFriendsChallengeUser` | WRITE | SOCIAL | `notifications` |
| `friends_spectate` | `rpcFriendsSpectate` | READ | READ | N/A |
| `send_friend_invite` | `rpcSendFriendInvite` | WRITE | SOCIAL | `friend_invites`, `notifications` |
| `accept_friend_invite` | `rpcAcceptFriendInvite` | WRITE | SOCIAL | `friend_invites`, Nakama friends |
| `decline_friend_invite` | `rpcDeclineFriendInvite` | WRITE | SOCIAL | `friend_invites` |
| `get_notifications` | `rpcGetNotifications` | READ | READ | Nakama notifications |

---

### 9. Groups/Clans (5 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `create_game_group` | `rpcCreateGameGroup` | WRITE | SOCIAL | Nakama groups |
| `update_group_xp` | `rpcUpdateGroupXP` | WRITE | WRITE | Nakama groups |
| `get_group_wallet` | `rpcGetGroupWallet` | READ | READ | `group_wallets` |
| `update_group_wallet` | `rpcUpdateGroupWallet` | WRITE | WRITE | `group_wallets` |
| `get_user_groups` | `rpcGetUserGroups` | READ | READ | Nakama groups |

---

### 10. Push Notifications (3 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `push_register_token` | `rpcPushRegisterToken` | WRITE | WRITE | `push_endpoints` |
| `push_send_event` | `rpcPushSendEvent` | WRITE | WRITE | `push_endpoints` |
| `push_get_endpoints` | `rpcPushGetEndpoints` | READ | READ | `push_endpoints` |

---

### 11. Achievements (4 RPCs)

| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `achievements_get_all` | `rpcAchievementsGetAll` | READ | NO | READ | NO |
| `achievements_update_progress` | `rpcAchievementsUpdateProgress` | WRITE | NO | WRITE | NO |
| `achievements_create_definition` | `rpcAchievementsCreateDefinition` | WRITE | NO | ADMIN | NO |
| `achievements_bulk_create` | `rpcAchievementsBulkCreate` | WRITE | NO | ADMIN | NO |
| `achievements_unlock` | `rpcAchievementsUnlock` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |

---

### 12. Matchmaking (5 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `matchmaking_find_match` | `rpcMatchmakingFindMatch` | WRITE | EXPENSIVE | Nakama matchmaker |
| `matchmaking_cancel` | `rpcMatchmakingCancel` | WRITE | EXPENSIVE | Nakama matchmaker |
| `matchmaking_get_status` | `rpcMatchmakingGetStatus` | READ | READ | Nakama matchmaker |
| `matchmaking_create_party` | `rpcMatchmakingCreateParty` | WRITE | SOCIAL | Nakama parties |
| `matchmaking_join_party` | `rpcMatchmakingJoinParty` | WRITE | SOCIAL | Nakama parties |

---

### 13. Tournaments (6 RPCs)

| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `tournament_create` | `rpcTournamentCreate` | WRITE | NO | ADMIN | NO |
| `tournament_join` | `rpcTournamentJoin` | WRITE | NO | WRITE | NO |
| `tournament_list_active` | `rpcTournamentListActive` | READ | NO | READ | NO |
| `tournament_submit_score` | `rpcTournamentSubmitScore` | WRITE | NO | WRITE | NO |
| `tournament_get_leaderboard` | `rpcTournamentGetLeaderboard` | READ | NO | READ | NO |
| `tournament_claim_rewards` | `rpcTournamentClaimRewards` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |

---

### 14. Rewarded Ads (4 RPCs)

| RPC Name | Handler | Read/Write | Sensitive? | Rate Limit | Idempotency |
|----------|---------|------------|------------|------------|-------------|
| `rewarded_ad_request_token` | `rpcRewardedAdRequestToken` | WRITE | NO | WRITE | NO |
| `rewarded_ad_claim` | `rpcRewardedAdClaim` | WRITE | ✅ YES | WRITE | ❌ REQUIRED |
| `rewarded_ad_validate_score_multiplier` | `rpcValidateScoreMultiplier` | WRITE | NO | WRITE | NO |
| `rewarded_ad_get_status` | `rpcGetRewardedAdStatus` | READ | NO | READ | NO |

---

### 15. Progression Systems (7 RPCs)

#### Progressive Unlocks (4 RPCs)
| RPC Name | Handler | Read/Write | Rate Limit |
|----------|---------|------------|------------|
| `progressive_get_state` | `rpcGetUnlockState` | READ | READ |
| `progressive_claim_unlock` | `rpcClaimUnlock` | WRITE | WRITE |
| `progressive_check_feature` | `rpcCheckFeatureUnlocked` | READ | READ |
| `progressive_update_progress` | `rpcUpdateProgressProgressive` | WRITE | WRITE |

#### Mastery/Prestige (3 RPCs)
| RPC Name | Handler | Read/Write | Rate Limit |
|----------|---------|------------|------------|
| `progression_add_mastery_xp` | `rpcProgressionAddMasteryXp` | WRITE | WRITE |
| `progression_get_state` | `rpcProgressionGetState` | READ | READ |
| `progression_claim_prestige` | `rpcProgressionClaimPrestige` | WRITE | WRITE |

---

### 16. Quiz Results (4 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `quiz_submit_result` | `rpcQuizSubmitResult` | WRITE | WRITE | `quiz_results_{gameId}` |
| `quiz_get_history` | `rpcQuizGetHistory` | READ | READ | `quiz_results_{gameId}` |
| `quiz_get_stats` | `rpcQuizGetStats` | READ | READ | `quiz_user_stats_{gameId}` |
| `quiz_check_daily_completion` | `rpcQuizCheckDailyCompletion` | READ | READ | `quiz_results_{gameId}` |

---

### 17. Game Registry (3 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `get_game_registry` | `rpcGetGameRegistry` | READ | READ | `game_registry` |
| `get_game_by_id` | `rpcGetGameById` | READ | READ | `game_registry` |
| `sync_game_registry` | `rpcSyncGameRegistry` | WRITE | ADMIN | `game_registry` |

---

### 18. Game Entry Cost (3 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `game_entry_validate` | `rpcGameEntryValidate` | READ | READ | `game_entry_sessions` |
| `game_entry_complete` | `rpcGameEntryComplete` | WRITE | WRITE | `game_entry_sessions` |
| `game_entry_get_status` | `rpcGameEntryGetStatus` | READ | READ | `game_entry_sessions` |

---

### 19. Compatibility Quiz (6 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `compatibility_create_session` | `rpcCompatibilityCreateSession` | WRITE | WRITE | `compatibility_sessions` |
| `compatibility_join_session` | `rpcCompatibilityJoinSession` | WRITE | WRITE | `compatibility_sessions` |
| `compatibility_get_session` | `rpcCompatibilityGetSession` | READ | READ | `compatibility_sessions` |
| `compatibility_submit_answers` | `rpcCompatibilitySubmitAnswers` | WRITE | WRITE | `compatibility_sessions` |
| `compatibility_calculate` | `rpcCompatibilityCalculate` | WRITE | WRITE | `compatibility_sessions` |
| `compatibility_list_sessions` | `rpcCompatibilityListSessions` | READ | READ | `compatibility_sessions` |

---

### 20. Chat (7 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `send_group_chat_message` | `rpcSendGroupChatMessage` | WRITE | SOCIAL | Nakama channels |
| `send_direct_message` | `rpcSendDirectMessage` | WRITE | SOCIAL | Nakama channels |
| `send_chat_room_message` | `rpcSendChatRoomMessage` | WRITE | SOCIAL | Nakama channels |
| `get_group_chat_history` | `rpcGetGroupChatHistory` | READ | READ | Nakama channels |
| `get_direct_message_history` | `rpcGetDirectMessageHistory` | READ | READ | Nakama channels |
| `get_chat_room_history` | `rpcGetChatRoomHistory` | READ | READ | Nakama channels |
| `mark_direct_messages_read` | `rpcMarkDirectMessagesRead` | WRITE | SOCIAL | Nakama channels |

---

### 21. Analytics (1 RPC)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `analytics_log_event` | `rpcAnalyticsLogEvent` | WRITE | WRITE | `analytics_events` |

---

### 22. Infrastructure (6 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Purpose |
|----------|---------|------------|------------|---------|
| `batch_execute` | `rpcBatchExecute` | WRITE | WRITE | Batch RPC calls |
| `batch_wallet_operations` | `rpcBatchWalletOperations` | WRITE | WRITE | Batch wallet ops |
| `batch_achievement_progress` | `rpcBatchAchievementProgress` | WRITE | WRITE | Batch achievement updates |
| `rate_limit_status` | `rpcRateLimitStatus` | READ | READ | Check rate limit status |
| `cache_stats` | `rpcCacheStats` | READ | READ | Get cache statistics |
| `cache_clear` | `rpcCacheClear` | WRITE | ADMIN | Clear cache entries |

---

### 23. Multi-Game RPCs (QuizVerse/LastToLive) (71 RPCs)

**QuizVerse (35 RPCs):**
- `quizverse_update_user_profile`
- `quizverse_grant_currency`
- `quizverse_spend_currency`
- `quizverse_validate_purchase`
- `quizverse_list_inventory`
- `quizverse_grant_item`
- `quizverse_consume_item`
- `quizverse_submit_score`
- `quizverse_get_leaderboard`
- `quizverse_join_or_create_match`
- `quizverse_claim_daily_reward`
- `quizverse_find_friends`
- `quizverse_save_player_data`
- `quizverse_load_player_data`
- `quizverse_get_item_catalog`
- `quizverse_search_items`
- `quizverse_get_quiz_categories`
- `quizverse_refresh_server_cache`
- `quizverse_guild_create`
- `quizverse_guild_join`
- `quizverse_guild_leave`
- `quizverse_guild_list`
- `quizverse_send_channel_message`
- `quizverse_log_event`
- `quizverse_track_session_start`
- `quizverse_track_session_end`
- `quizverse_get_server_config`
- `quizverse_admin_grant_item`
- `quizverse_submit_score` (duplicate?)
- `quizverse_get_leaderboard` (duplicate?)
- `quizverse_submit_multiplayer_match`

**LastToLive (36 RPCs):**
- Similar pattern to QuizVerse with `lasttolive_` prefix

**Note:** These are game-specific RPCs. Many duplicate functionality of generic RPCs.

---

### 24. Adaptive Rewards (2 RPCs)

| RPC Name | Handler | Read/Write | Rate Limit | Storage |
|----------|---------|------------|------------|---------|
| `calculate_score_reward` | `rpcCalculateScoreReward` | READ | READ | `game_reward_configs` |
| `update_game_reward_config` | `rpcUpdateGameRewardConfig` | WRITE | ADMIN | `game_reward_configs` |

---

## Summary Statistics

| Category | Count |
|---------|-------|
| **Total RPCs** | 175+ |
| **Write RPCs** | ~100 |
| **Read RPCs** | ~75 |
| **Sensitive RPCs (Currency/Rewards)** | 13 |
| **RPCs with Rate Limiting** | 0 (infrastructure exists but not wired) |
| **RPCs with Caching** | 0 (infrastructure exists but not wired) |
| **RPCs with Idempotency** | 0 (critical gap) |
| **RPCs with Structured Logging** | 0 (ad-hoc logging) |
| **RPCs with Metrics** | 0 (no metrics tracking) |

---

## Critical Gaps

1. **No Idempotency:** 13 critical currency/reward RPCs vulnerable to duplicate claims
2. **No Rate Limiting:** Infrastructure exists but not applied to any RPCs
3. **No Caching:** Read-heavy RPCs (leaderboards, profiles) not cached
4. **No Input Validation Framework:** Ad-hoc validation per RPC
5. **No Structured Logging:** String concatenation, no traceId propagation
6. **No Metrics:** No per-RPC latency/error tracking

---

**See Also:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SECURITY_MODEL.md](./SECURITY_MODEL.md) - Security policies
- [PERFORMANCE_PLAYBOOK.md](./PERFORMANCE_PLAYBOOK.md) - Caching strategy

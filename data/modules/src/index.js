// ============================================================================
// NAKAMA BACKEND - MODULE INDEX
// ============================================================================
// Version: 2.0.0 | Date: 2026-02-05
// ============================================================================
//
// This file provides a complete map of all modules in the Nakama backend.
// The actual implementation is in the main index.js file (concatenated).
//
// ARCHITECTURE:
// ├── PLAYER CORE (Cross-Game)
// │   ├── identity.js      - Player identity & auth
// │   ├── global-wallet.js - Platform-wide currency
// │   ├── friends.js       - Social connections
// │   ├── profile.js       - Achievements & badges
// │   └── notifications.js - Push notifications
// │
// ├── GAME SYSTEMS (Per-Game, isolated by game_id)
// │   ├── onboarding.js    - First-time experience ⭐ GAME-SPECIFIC
// │   ├── game-wallet.js   - Per-game currency
// │   ├── leaderboards.js  - Rankings & scores
// │   ├── daily-systems.js - Daily rewards & missions
// │   ├── progression.js   - Season pass, goals, collections
// │   ├── tournaments.js   - Competitive events
// │   ├── matchmaking.js   - Player matching
// │   └── retention.js     - Streak shields, win-back
// │
// └── INFRASTRUCTURE
//     ├── core.js          - Logging, middleware, errors
//     ├── rate-limiting.js - Request throttling
//     ├── caching.js       - Response caching
//     ├── idempotency.js   - Duplicate prevention
//     ├── validation.js    - Input validation
//     └── security.js      - Score/wallet protection
//
// ============================================================================

// Complete RPC Registry
var MODULE_REGISTRY = {
    // ========================================================================
    // PLAYER CORE - Cross-Game Player Data
    // ========================================================================
    'player-core': {
        description: 'Cross-game player data shared across all games',
        modules: {
            'identity': {
                rpcs: [
                    'create_or_sync_user',
                    'rpc_update_player_metadata',
                    'get_player_metadata',
                    'check_geo_and_update_profile',
                    'get_player_portfolio',
                    'admin_delete_player_metadata',
                    'cleanup_guest_user_metadata'
                ]
            },
            'global-wallet': {
                rpcs: [
                    'wallet_update_global',
                    'wallet_get_all',
                    'wallet_get_balances',
                    'get_user_wallet',
                    'get_wallet_registry',
                    'link_wallet_to_game'
                ]
            },
            'friends': {
                rpcs: [
                    'friends_list',
                    'send_friend_invite',
                    'accept_friend_invite',
                    'decline_friend_invite',
                    'friends_block',
                    'friends_unblock',
                    'friends_remove',
                    'friends_challenge_user',
                    'friends_spectate'
                ]
            },
            'profile': {
                rpcs: [
                    'achievements_get_all',
                    'achievements_update_progress',
                    'achievements_create_definition',
                    'achievements_bulk_create'
                ]
            },
            'notifications': {
                rpcs: [
                    'get_notifications',
                    'push_register_token',
                    'push_send_event',
                    'push_get_endpoints'
                ]
            }
        }
    },

    // ========================================================================
    // GAME SYSTEMS - Per-Game Features (isolated by game_id)
    // ========================================================================
    'game-systems': {
        description: 'Game-specific features isolated by game_id',
        isolationKey: 'game_id',
        modules: {
            'onboarding': {
                rpcs: [
                    'onboarding_get_state',
                    'onboarding_update_state',
                    'onboarding_complete_step',
                    'onboarding_set_interests',
                    'onboarding_get_interests',
                    'onboarding_claim_welcome_bonus',
                    'onboarding_first_quiz_complete',
                    'onboarding_get_tomorrow_preview',
                    'onboarding_track_session',
                    'onboarding_get_retention_data',
                    'onboarding_create_link_quiz'
                ],
                note: 'GAME-SPECIFIC: Each game has different welcome bonuses and tutorials'
            },
            'game-wallet': {
                rpcs: [
                    'create_or_get_wallet',
                    'wallet_update_game_wallet',
                    'wallet_transfer_between_game_wallets',
                    'create_player_wallet',
                    'update_wallet_balance',
                    'get_wallet_balance'
                ]
            },
            'leaderboards': {
                rpcs: [
                    'create_all_leaderboards_persistent',
                    'create_time_period_leaderboards',
                    'submit_score_to_time_periods',
                    'get_time_period_leaderboard',
                    'submit_leaderboard_score',
                    'get_leaderboard',
                    'get_all_leaderboards',
                    'create_all_leaderboards_with_friends',
                    'submit_score_with_friends_sync',
                    'get_friend_leaderboard',
                    'submit_score_sync',
                    'submit_score_with_aggregate'
                ]
            },
            'daily-systems': {
                rpcs: [
                    'daily_rewards_get_status',
                    'daily_rewards_claim',
                    'get_daily_missions',
                    'submit_mission_progress',
                    'claim_mission_reward'
                ]
            },
            'progression': {
                rpcs: [
                    'season_pass_get_status',
                    'season_pass_add_xp',
                    'season_pass_complete_quest',
                    'season_pass_claim_reward',
                    'season_pass_purchase_premium',
                    'weekly_goals_get_status',
                    'weekly_goals_update_progress',
                    'weekly_goals_claim_reward',
                    'weekly_goals_claim_bonus',
                    'monthly_milestones_get_status',
                    'monthly_milestones_update_progress',
                    'monthly_milestones_claim_reward',
                    'monthly_milestones_claim_legendary',
                    'collections_get_status',
                    'collections_unlock_item',
                    'collections_equip_item',
                    'collections_add_mastery_xp',
                    'progressive_get_state',
                    'progressive_claim_unlock',
                    'progressive_check_feature',
                    'progressive_update_progress',
                    'progression_add_mastery_xp',
                    'progression_get_state',
                    'progression_claim_prestige'
                ]
            },
            'tournaments': {
                rpcs: [
                    'tournament_create',
                    'tournament_join',
                    'tournament_list_active',
                    'tournament_submit_score',
                    'tournament_get_leaderboard',
                    'tournament_claim_rewards'
                ]
            },
            'matchmaking': {
                rpcs: [
                    'matchmaking_find_match',
                    'matchmaking_cancel',
                    'matchmaking_get_status',
                    'matchmaking_create_party',
                    'matchmaking_join_party'
                ]
            },
            'retention': {
                rpcs: [
                    'retention_grant_streak_shield',
                    'retention_get_streak_shield',
                    'retention_use_streak_shield',
                    'winback_check_status',
                    'winback_claim_rewards',
                    'winback_record_session',
                    'winback_schedule_reengagement',
                    'retention_schedule_notification',
                    'retention_get_recommendations',
                    'retention_track_first_session',
                    'retention_claim_welcome_bonus'
                ]
            }
        }
    },

    // ========================================================================
    // ADDITIONAL GAME-SPECIFIC MODULES
    // ========================================================================
    'game-specific': {
        description: 'Game-specific features not in core game-systems',
        modules: {
            'quiz': {
                rpcs: [
                    'quiz_submit_result',
                    'quiz_get_history',
                    'quiz_get_stats',
                    'quiz_check_daily_completion',
                    'quizverse_submit_score',
                    'quizverse_get_leaderboard',
                    'quizverse_submit_multiplayer_match'
                ],
                game: 'QuizVerse'
            },
            'compatibility': {
                rpcs: [
                    'compatibility_create_session',
                    'compatibility_join_session',
                    'compatibility_get_session',
                    'compatibility_submit_answers',
                    'compatibility_calculate',
                    'compatibility_list_sessions'
                ],
                game: 'Compatibility Quiz'
            },
            'chat': {
                rpcs: [
                    'send_group_chat_message',
                    'send_direct_message',
                    'send_chat_room_message',
                    'get_group_chat_history',
                    'get_direct_message_history',
                    'get_chat_room_history',
                    'mark_direct_messages_read'
                ]
            },
            'groups': {
                rpcs: [
                    'create_game_group',
                    'update_group_xp',
                    'get_group_wallet',
                    'update_group_wallet',
                    'get_user_groups'
                ]
            },
            'game-entry': {
                rpcs: [
                    'game_entry_validate',
                    'game_entry_complete',
                    'game_entry_get_status'
                ]
            },
            'rewarded-ads': {
                rpcs: [
                    'rewarded_ad_request_token',
                    'rewarded_ad_claim',
                    'rewarded_ad_validate_score_multiplier',
                    'rewarded_ad_get_status'
                ]
            }
        }
    },

    // ========================================================================
    // INFRASTRUCTURE - Batch & Admin Operations
    // ========================================================================
    'infrastructure': {
        description: 'Batch operations and admin tools',
        modules: {
            'batch': {
                rpcs: [
                    'batch_execute',
                    'batch_wallet_operations',
                    'batch_achievement_progress'
                ]
            },
            'admin': {
                rpcs: [
                    'rate_limit_status',
                    'cache_stats',
                    'cache_clear',
                    'get_game_registry',
                    'get_game_by_id',
                    'sync_game_registry',
                    'calculate_score_reward',
                    'update_game_reward_config'
                ]
            },
            'analytics': {
                rpcs: [
                    'analytics_log_event'
                ]
            }
        }
    }
};

// Count total RPCs
function countRpcs() {
    var total = 0;
    for (var category in MODULE_REGISTRY) {
        for (var moduleName in MODULE_REGISTRY[category].modules) {
            total += MODULE_REGISTRY[category].modules[moduleName].rpcs.length;
        }
    }
    return total;
}

// Export for verification
if (typeof globalThis !== 'undefined') {
    globalThis.ModuleRegistry = MODULE_REGISTRY;
    globalThis.ModuleRegistryStats = {
        totalRpcs: countRpcs(),
        categories: Object.keys(MODULE_REGISTRY).length,
        version: '2.0.0',
        lastUpdated: '2026-02-05'
    };
}

// Log module summary (call in InitModule)
function logModuleSummary(logger) {
    logger.info('========================================');
    logger.info('[Modules] Nakama Backend v2.0.0');
    logger.info('========================================');
    logger.info('[Modules] Total RPCs: ' + countRpcs());
    logger.info('[Modules] Categories:');
    for (var category in MODULE_REGISTRY) {
        var moduleCount = Object.keys(MODULE_REGISTRY[category].modules).length;
        var rpcCount = 0;
        for (var m in MODULE_REGISTRY[category].modules) {
            rpcCount += MODULE_REGISTRY[category].modules[m].rpcs.length;
        }
        logger.info('[Modules]   - ' + category + ': ' + moduleCount + ' modules, ' + rpcCount + ' RPCs');
    }
    logger.info('========================================');
}

if (typeof globalThis !== 'undefined') {
    globalThis.logModuleSummary = logModuleSummary;
}

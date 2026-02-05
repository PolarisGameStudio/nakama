// ============================================================================
// GAME SYSTEMS: RETENTION MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles per-game player retention mechanics.
// Part of GAME SYSTEMS - isolated by game_id.
//
// Sub-Systems:
// 1. Streak Shields - Protect daily streaks from being lost
// 2. Win-back - Re-engage lapsed players with special rewards
// 3. Welcome Bonus - First-time player rewards (also in onboarding)
// 4. Recommendations - Personalized content suggestions
// 5. Session Tracking - Monitor player engagement
//
// RPCs in this module:
// Streak Shields:
// - retention_grant_streak_shield: Grant streak protection (earned/purchased)
// - retention_get_streak_shield: Get current shield status
// - retention_use_streak_shield: Use shield to protect streak
//
// Win-back:
// - winback_check_status: Check if player qualifies for win-back rewards
// - winback_claim_rewards: Claim win-back rewards
// - winback_record_session: Record return session
// - winback_schedule_reengagement: Schedule re-engagement notification
//
// Other Retention:
// - retention_schedule_notification: Schedule reminder notification
// - retention_get_recommendations: Get personalized content
// - retention_track_first_session: Track first session metrics
// - retention_claim_welcome_bonus: Claim welcome bonus
//
// Win-back Tiers:
// - LAPSED_3_DAYS: Small reward (50 coins)
// - LAPSED_7_DAYS: Medium reward (200 coins + power-up)
// - LAPSED_14_DAYS: Large reward (500 coins + exclusive item)
// - LAPSED_30_DAYS: Premium reward (1000 coins + rare cosmetic)
//
// Storage Patterns:
// - Collection: "streak_shields" / Key: "shield:{game_id}:{user_id}"
// - Collection: "winback" / Key: "status:{game_id}:{user_id}"
// - Collection: "session_tracking" / Key: "sessions:{game_id}:{user_id}"
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * RETENTION MODULE - Function Index
 * 
 * Streak Shields (registered ~line 22522-22526):
 * - rpcRetentionGrantStreakShield
 * - rpcRetentionGetStreakShield
 * - rpcRetentionUseStreakShield
 * 
 * Win-back (registered ~line 22703-22722):
 * - rpcWinbackCheckStatus
 * - wrappedWinbackClaimRewards (idempotent)
 * - rpcWinbackRecordSession
 * - rpcWinbackScheduleReengagement
 * 
 * Other Retention (registered ~line 22528-22546):
 * - rpcRetentionScheduleNotification
 * - rpcRetentionGetRecommendations
 * - rpcRetentionTrackFirstSession
 * - wrappedRetentionClaimBonus (idempotent)
 */

var GAME_SYSTEMS_RETENTION_MODULE = {
    name: 'game-systems/retention',
    version: '1.0.0',
    rpcs: [
        // Streak Shields
        'retention_grant_streak_shield',
        'retention_get_streak_shield',
        'retention_use_streak_shield',
        // Win-back
        'winback_check_status',
        'winback_claim_rewards',
        'winback_record_session',
        'winback_schedule_reengagement',
        // Other Retention
        'retention_schedule_notification',
        'retention_get_recommendations',
        'retention_track_first_session',
        'retention_claim_welcome_bonus'
    ],
    scope: 'GAME_SPECIFIC',
    isolationKey: 'game_id',
    middleware: {
        'retention_grant_streak_shield': ['rate_limit:WRITE'],
        'retention_use_streak_shield': ['rate_limit:SENSITIVE', 'idempotency:1h'],
        'winback_claim_rewards': ['rate_limit:SENSITIVE', 'idempotency:24h'],
        'retention_claim_welcome_bonus': ['rate_limit:SENSITIVE', 'idempotency:forever']
    },
    description: 'Per-game player retention mechanics'
};

// Win-back tier configurations (can be customized per game)
var WINBACK_TIERS = {
    LAPSED_3_DAYS: {
        daysAbsent: 3,
        rewards: { coins: 50 }
    },
    LAPSED_7_DAYS: {
        daysAbsent: 7,
        rewards: { coins: 200, powerUps: 1 }
    },
    LAPSED_14_DAYS: {
        daysAbsent: 14,
        rewards: { coins: 500, exclusiveItem: true }
    },
    LAPSED_30_DAYS: {
        daysAbsent: 30,
        rewards: { coins: 1000, rareCosmetic: true }
    }
};

if (typeof globalThis !== 'undefined') {
    globalThis.GameSystemsModules = globalThis.GameSystemsModules || {};
    globalThis.GameSystemsModules.Retention = GAME_SYSTEMS_RETENTION_MODULE;
    globalThis.GameSystemsModules.WinbackTiers = WINBACK_TIERS;
}

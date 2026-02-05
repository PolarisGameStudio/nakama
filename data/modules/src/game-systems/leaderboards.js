// ============================================================================
// GAME SYSTEMS: LEADERBOARDS MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles per-game rankings and scores.
// Part of GAME SYSTEMS - isolated by game_id.
//
// RPCs in this module:
// - create_all_leaderboards_persistent: Create persistent leaderboards
// - create_time_period_leaderboards: Create time-based leaderboards
// - submit_score_to_time_periods: Submit score to all periods (daily/weekly/monthly/alltime)
// - get_time_period_leaderboard: Get leaderboard by period
// - submit_leaderboard_score: Submit single score
// - get_leaderboard: Get leaderboard
// - get_all_leaderboards: Get all game leaderboards
// - create_all_leaderboards_with_friends: Create friend leaderboards
// - submit_score_with_friends_sync: Submit with friend sync
// - get_friend_leaderboard: Get friend rankings
// - submit_score_sync: Sync score submission
// - submit_score_with_aggregate: Submit with aggregation
//
// Leaderboard ID Pattern:
// {game_id}_{period}_{type}
// Example: 126bf539-dae2-4bcf-964d-316c0fa1f92b_daily_score
//
// Time Periods:
// - daily: Resets at 00:00 UTC
// - weekly: Resets Monday 00:00 UTC
// - monthly: Resets 1st of month 00:00 UTC
// - alltime: Never resets
//
// Security Features (PR #6):
// - Server-side score validation
// - Max score limits per game mode
// - Rate limiting on submissions
// - Anomaly detection
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * LEADERBOARDS MODULE - Function Index
 * 
 * RPC Handlers (registered in InitModule):
 * - createAllLeaderboardsPersistent: ~line 21609
 * - rpcCreateTimePeriodLeaderboards: ~line 21616
 * - rpcSubmitScoreToTimePeriods: ~line 21628 (with validation PR#5, security PR#6)
 * - rpcGetTimePeriodLeaderboard: ~line 21646 (with caching PR#4, validation PR#5)
 * - rpcSubmitLeaderboardScore: ~line 22112
 * - rpcGetLeaderboard: ~line 22126
 * - wrappedGetAllLeaderboards: ~line 22084
 * 
 * From copilot modules:
 * - rpcCreateAllLeaderboardsWithFriends: ~line 13450
 * - rpcSubmitScoreWithFriendsSync: ~line 13457
 * - rpcGetFriendLeaderboard: ~line 13464
 * - rpcSubmitScoreSync: ~line 13434
 * - rpcSubmitScoreWithAggregate: ~line 13442
 */

var GAME_SYSTEMS_LEADERBOARDS_MODULE = {
    name: 'game-systems/leaderboards',
    version: '1.0.0',
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
    ],
    scope: 'GAME_SPECIFIC',
    isolationKey: 'game_id',
    description: 'Per-game rankings and scores'
};

if (typeof globalThis !== 'undefined') {
    globalThis.GameSystemsModules = globalThis.GameSystemsModules || {};
    globalThis.GameSystemsModules.Leaderboards = GAME_SYSTEMS_LEADERBOARDS_MODULE;
}

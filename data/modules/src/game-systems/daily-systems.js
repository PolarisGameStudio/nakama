// ============================================================================
// GAME SYSTEMS: DAILY SYSTEMS MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles daily engagement mechanics per game.
// Part of GAME SYSTEMS - isolated by game_id.
//
// RPCs in this module:
// - daily_rewards_get_status: Get daily reward status
// - daily_rewards_claim: Claim daily reward
// - get_daily_missions: Get today's missions
// - submit_mission_progress: Update mission progress
// - claim_mission_reward: Claim mission reward
//
// Daily Rewards Structure:
// {
//   currentStreak: 5,
//   totalClaims: 30,
//   canClaimToday: true,
//   lastClaimDate: "2026-02-04",
//   nextReward: { day: 6, coins: 100, xp: 50 }
// }
//
// Daily Missions Structure:
// {
//   missions: [
//     { id: "play_3", title: "Play 3 games", target: 3, progress: 1, reward: 50 },
//     { id: "score_500", title: "Score 500 points", target: 500, progress: 250, reward: 100 }
//   ],
//   resetTime: "2026-02-06T00:00:00Z"
// }
//
// Storage Patterns:
// - Collection: "daily_rewards"
// - Key: "status:{game_id}:{user_id}"
// - Collection: "daily_missions"
// - Key: "missions:{game_id}:{user_id}:{date}"
//
// Middleware Applied (from PRs):
// - PR #2: Rate limiting (READ/SENSITIVE presets)
// - PR #3: Idempotency (24h TTL for claims)
// - PR #4: Caching (5min TTL for status)
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * DAILY SYSTEMS MODULE - Function Index
 * 
 * Daily Rewards (registered ~line 21714-21741):
 * - rpcDailyRewardsGetStatus (wrapped with middleware, rate limit, cache)
 * - rpcDailyRewardsClaim (wrapped with middleware, rate limit, idempotency)
 * 
 * Daily Missions (registered ~line 21802-21842):
 * - rpcGetDailyMissions (wrapped with validation, rate limit, cache)
 * - rpcSubmitMissionProgress (wrapped with validation, rate limit)
 * - rpcClaimMissionReward (wrapped with validation, rate limit, idempotency)
 */

var GAME_SYSTEMS_DAILY_MODULE = {
    name: 'game-systems/daily-systems',
    version: '1.0.0',
    rpcs: [
        'daily_rewards_get_status',
        'daily_rewards_claim',
        'get_daily_missions',
        'submit_mission_progress',
        'claim_mission_reward'
    ],
    scope: 'GAME_SPECIFIC',
    isolationKey: 'game_id',
    middleware: {
        'daily_rewards_get_status': ['rate_limit:READ', 'cache:LONG'],
        'daily_rewards_claim': ['rate_limit:SENSITIVE', 'idempotency:24h'],
        'get_daily_missions': ['validation', 'rate_limit:READ', 'cache:MEDIUM'],
        'submit_mission_progress': ['validation', 'rate_limit:WRITE'],
        'claim_mission_reward': ['validation', 'rate_limit:SENSITIVE', 'idempotency:24h']
    },
    description: 'Daily engagement mechanics (per-game)'
};

if (typeof globalThis !== 'undefined') {
    globalThis.GameSystemsModules = globalThis.GameSystemsModules || {};
    globalThis.GameSystemsModules.DailySystems = GAME_SYSTEMS_DAILY_MODULE;
}

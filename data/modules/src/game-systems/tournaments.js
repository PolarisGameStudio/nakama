// ============================================================================
// GAME SYSTEMS: TOURNAMENTS MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles per-game competitive events.
// Part of GAME SYSTEMS - isolated by game_id.
//
// RPCs in this module:
// - tournament_create: Create a new tournament (admin)
// - tournament_join: Join a tournament
// - tournament_list_active: List active tournaments
// - tournament_submit_score: Submit tournament score
// - tournament_get_leaderboard: Get tournament rankings
// - tournament_claim_rewards: Claim tournament rewards
//
// Tournament Structure:
// {
//   id: "tournament_uuid",
//   game_id: "game_uuid",
//   name: "Weekly Championship",
//   startTime: "2026-02-05T00:00:00Z",
//   endTime: "2026-02-12T00:00:00Z",
//   entryFee: 100,
//   prizePool: [1000, 500, 250],
//   maxParticipants: 100,
//   currentParticipants: 45
// }
//
// Storage Patterns:
// - Uses Nakama's built-in tournament API
// - Tournament IDs include game_id for isolation
// - Collection: "tournament_entries" / Key: "entry:{tournament_id}:{user_id}"
//
// Security Features (PR #6):
// - Server-side score validation
// - Entry fee validation
// - Reward claim idempotency
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * TOURNAMENTS MODULE - Function Index
 * 
 * RPC Handlers (registered ~line 22373-22419):
 * - wrappedTournamentCreate (rate limited)
 * - wrappedTournamentJoin (rate limited)
 * - wrappedTournamentList (rate limited, cached)
 * - wrappedTournamentSubmitScore (rate limited, validated)
 * - wrappedTournamentLeaderboard (rate limited, cached)
 * - wrappedTournamentClaimRewards (rate limited, idempotent)
 */

var GAME_SYSTEMS_TOURNAMENTS_MODULE = {
    name: 'game-systems/tournaments',
    version: '1.0.0',
    rpcs: [
        'tournament_create',
        'tournament_join',
        'tournament_list_active',
        'tournament_submit_score',
        'tournament_get_leaderboard',
        'tournament_claim_rewards'
    ],
    scope: 'GAME_SPECIFIC',
    isolationKey: 'game_id',
    middleware: {
        'tournament_create': ['rate_limit:ADMIN'],
        'tournament_join': ['rate_limit:WRITE'],
        'tournament_list_active': ['rate_limit:READ', 'cache:SHORT'],
        'tournament_submit_score': ['rate_limit:WRITE', 'validation'],
        'tournament_get_leaderboard': ['rate_limit:READ', 'cache:SHORT'],
        'tournament_claim_rewards': ['rate_limit:SENSITIVE', 'idempotency:24h']
    },
    description: 'Per-game competitive events'
};

if (typeof globalThis !== 'undefined') {
    globalThis.GameSystemsModules = globalThis.GameSystemsModules || {};
    globalThis.GameSystemsModules.Tournaments = GAME_SYSTEMS_TOURNAMENTS_MODULE;
}

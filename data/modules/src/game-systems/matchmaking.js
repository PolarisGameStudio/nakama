// ============================================================================
// GAME SYSTEMS: MATCHMAKING MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles per-game player matching.
// Part of GAME SYSTEMS - isolated by game_id.
//
// RPCs in this module:
// - matchmaking_find_match: Find a match based on criteria
// - matchmaking_cancel: Cancel matchmaking request
// - matchmaking_get_status: Get current matchmaking status
// - matchmaking_create_party: Create a party for group matchmaking
// - matchmaking_join_party: Join an existing party
//
// Matchmaking Criteria:
// {
//   game_id: "game_uuid",
//   mode: "ranked",
//   skill_level: 1500,
//   region: "us-east",
//   party_id: "party_uuid" (optional)
// }
//
// Match Types:
// - SOLO: 1v1 matching
// - PARTY: Group vs Group
// - QUICK_MATCH: Fast matching with relaxed criteria
// - RANKED: Skill-based matching
//
// Storage Patterns:
// - Uses Nakama's built-in matchmaker API
// - Collection: "matchmaking_tickets" / Key: "ticket:{user_id}"
// - Collection: "parties" / Key: "party:{party_id}"
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * MATCHMAKING MODULE - Function Index
 * 
 * RPC Handlers (registered ~line 22335-22355):
 * - wrappedFindMatch (rate limited)
 * - rpcMatchmakingCancel
 * - rpcMatchmakingGetStatus
 * - wrappedCreateParty (rate limited)
 * - wrappedJoinParty (rate limited)
 */

var GAME_SYSTEMS_MATCHMAKING_MODULE = {
    name: 'game-systems/matchmaking',
    version: '1.0.0',
    rpcs: [
        'matchmaking_find_match',
        'matchmaking_cancel',
        'matchmaking_get_status',
        'matchmaking_create_party',
        'matchmaking_join_party'
    ],
    scope: 'GAME_SPECIFIC',
    isolationKey: 'game_id',
    middleware: {
        'matchmaking_find_match': ['rate_limit:WRITE'],
        'matchmaking_cancel': ['rate_limit:WRITE'],
        'matchmaking_get_status': ['rate_limit:READ'],
        'matchmaking_create_party': ['rate_limit:WRITE'],
        'matchmaking_join_party': ['rate_limit:WRITE']
    },
    description: 'Per-game player matching'
};

if (typeof globalThis !== 'undefined') {
    globalThis.GameSystemsModules = globalThis.GameSystemsModules || {};
    globalThis.GameSystemsModules.Matchmaking = GAME_SYSTEMS_MATCHMAKING_MODULE;
}

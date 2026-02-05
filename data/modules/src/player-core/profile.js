// ============================================================================
// PLAYER CORE: PROFILE & ACHIEVEMENTS MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles cross-game achievements and player stats.
// Part of PLAYER CORE - cross-game player data.
//
// RPCs in this module:
// - achievements_get_all: Get all achievements (global + game-specific)
// - achievements_update_progress: Update achievement progress
// - achievements_create_definition: Admin: create new achievement
// - achievements_bulk_create: Admin: bulk create achievements
//
// Achievement Types:
// - GLOBAL: Awarded across all games (e.g., "Play 100 games on platform")
// - GAME: Specific to one game (e.g., "Score 1000 in QuizVerse")
//
// Storage Patterns:
// - Collection: "achievements"
// - Key (definitions): "def:{achievement_id}"
// - Key (progress): "progress:{user_id}:{achievement_id}"
// - Key (global progress): "global:{user_id}"
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * PROFILE MODULE - Function Index
 * 
 * RPC Handlers (registered in InitModule ~line 22311-22317):
 * - rpcAchievementsGetAll
 * - rpcAchievementsUpdateProgress
 * - rpcAchievementsCreateDefinition
 * - rpcAchievementsBulkCreate
 * 
 * Also:
 * - rpcGetPlayerPortfolio: ~line 22133
 */

var PLAYER_CORE_PROFILE_MODULE = {
    name: 'player-core/profile',
    version: '1.0.0',
    rpcs: [
        'achievements_get_all',
        'achievements_update_progress',
        'achievements_create_definition',
        'achievements_bulk_create',
        'get_player_portfolio'
    ],
    description: 'Cross-game achievements and player stats'
};

if (typeof globalThis !== 'undefined') {
    globalThis.PlayerCoreModules = globalThis.PlayerCoreModules || {};
    globalThis.PlayerCoreModules.Profile = PLAYER_CORE_PROFILE_MODULE;
}

// ============================================================================
// PLAYER CORE: IDENTITY MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles player identity and authentication.
// Part of PLAYER CORE - cross-game player data.
//
// RPCs in this module:
// - create_or_sync_user: Create or sync player identity
// - rpc_update_player_metadata: Update player profile data
// - get_player_metadata: Get player profile
// - check_geo_and_update_profile: Update geo location
// - get_player_portfolio: Get complete player portfolio
// - admin_delete_player_metadata: Admin: delete player data
// - cleanup_guest_user_metadata: Cleanup guest metadata
//
// Helper Functions:
// - sanitizeUsername: Sanitize username input
// - generateDeterministicUUID: Generate deterministic UUID from device ID
// - deterministicHash: Hash function for UUID generation
// - getOrCreateUserIdForDevice: Get or create user ID
// - getOrCreateIdentity: Get or create player identity
// - updatePlayerMetadata: Update player metadata
// - updateNakamaUsername: Update Nakama account username
// - isValidUUID: Validate UUID format
// - generateUUID: Generate random UUID
//
// Storage Patterns:
// - Collection: "quizverse"
// - Key: "identity:{device_id}:{game_id}"
// - UserId: System UUID (00000000-0000-0000-0000-000000000000) for global access
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// See MODULE_ARCHITECTURE.md for the full modular structure.
// ============================================================================

/**
 * IDENTITY MODULE - Function Index
 * 
 * These functions are located in index.js at the following approximate lines:
 * 
 * RPC Handlers:
 * - createOrSyncUser: ~line 11936
 * - rpcUpdatePlayerMetadataUnified: ~line 2932, 4141
 * - rpcGetPlayerMetadata: ~line 4398
 * - rpcCheckGeoAndUpdateProfile: ~line 14205
 * - rpcGetPlayerPortfolio: ~line (search for "rpcGetPlayerPortfolio")
 * - rpcAdminDeletePlayerMetadata: ~line (search for "rpcAdminDeletePlayerMetadata")
 * - rpcCleanupGuestUserMetadata: ~line (search for "rpcCleanupGuestUserMetadata")
 * 
 * Helper Functions:
 * - sanitizeUsername: ~line 12120
 * - generateDeterministicUUID: ~line 12153
 * - deterministicHash: ~line 12184
 * - getOrCreateUserIdForDevice: (search for function name)
 * - getOrCreateIdentity: (search for function name)
 * - updatePlayerMetadata: (search for function name)
 * - isValidUUID: (search for function name)
 * - generateUUID: (search for function name)
 */

// Module marker for index.js concatenation
var PLAYER_CORE_IDENTITY_MODULE = {
    name: 'player-core/identity',
    version: '1.0.0',
    rpcs: [
        'create_or_sync_user',
        'rpc_update_player_metadata',
        'get_player_metadata',
        'check_geo_and_update_profile',
        'get_player_portfolio',
        'admin_delete_player_metadata',
        'cleanup_guest_user_metadata'
    ],
    description: 'Player identity and authentication (cross-game)'
};

// Export for module verification
if (typeof globalThis !== 'undefined') {
    globalThis.PlayerCoreModules = globalThis.PlayerCoreModules || {};
    globalThis.PlayerCoreModules.Identity = PLAYER_CORE_IDENTITY_MODULE;
}

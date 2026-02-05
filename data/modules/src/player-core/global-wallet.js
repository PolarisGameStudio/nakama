// ============================================================================
// PLAYER CORE: GLOBAL WALLET MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles platform-wide currency (XUT tokens, platform XP).
// Part of PLAYER CORE - cross-game player data.
//
// RPCs in this module:
// - wallet_update_global: Add/subtract global currency
// - wallet_get_all: Get all wallet data (global + game wallets)
// - wallet_get_balances: Get currency balances summary
// - get_user_wallet: Get wallet by user ID
// - get_wallet_registry: Get wallet registry (admin)
// - link_wallet_to_game: Link wallet to a game
//
// Helper Functions:
// - getOrCreateGlobalWallet: Create or retrieve global wallet
// - logTransaction: Log wallet transactions for audit
// - sanitizeForLogging: Sanitize sensitive data in logs
//
// Storage Patterns:
// - Collection: "wallets" or "quizverse"
// - Key: "global_wallet:{user_id}" or "wallet:global:{device_id}"
//
// Security Features (PR #6):
// - Amount validation (reject negative)
// - Atomic operations with versioning
// - Transaction audit logging
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * GLOBAL WALLET MODULE - Function Index
 * 
 * RPC Handlers (approximate lines in index.js):
 * - rpcWalletUpdateGlobal: ~line 8152
 * - rpcWalletGetAll: ~line 8110
 * - rpcWalletGetBalances: ~line 5615
 * - getUserWallet: ~line 21592
 * - getWalletRegistry: ~line 21600
 * - linkWalletToGame: ~line 21596
 * 
 * Helper Functions:
 * - getOrCreateGlobalWallet: (search for function name)
 * - logTransaction: (search for function name)
 * - validateWalletAmount (from Security module)
 * - secureWalletUpdate (from Security module)
 */

var PLAYER_CORE_GLOBAL_WALLET_MODULE = {
    name: 'player-core/global-wallet',
    version: '1.0.0',
    rpcs: [
        'wallet_update_global',
        'wallet_get_all',
        'wallet_get_balances',
        'get_user_wallet',
        'get_wallet_registry',
        'link_wallet_to_game'
    ],
    description: 'Platform-wide currency management (cross-game)'
};

if (typeof globalThis !== 'undefined') {
    globalThis.PlayerCoreModules = globalThis.PlayerCoreModules || {};
    globalThis.PlayerCoreModules.GlobalWallet = PLAYER_CORE_GLOBAL_WALLET_MODULE;
}

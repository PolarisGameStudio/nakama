// ============================================================================
// GAME SYSTEMS: GAME WALLET MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles per-game currency (game coins, gems).
// Part of GAME SYSTEMS - isolated by game_id.
//
// RPCs in this module:
// - create_or_get_wallet: Create or get game-specific wallet
// - wallet_update_game_wallet: Update game wallet balance
// - wallet_transfer_between_game_wallets: Transfer between game wallets
// - create_player_wallet: Create new player wallet
// - update_wallet_balance: Update wallet balance
// - get_wallet_balance: Get wallet balance
//
// Wallet Structure:
// {
//   wallet_id: "uuid",
//   device_id: "device123",
//   game_id: "126bf539-...",
//   balance: 1000,
//   currency: "coins",
//   created_at: "2026-02-05T...",
//   updated_at: "2026-02-05T..."
// }
//
// Storage Patterns:
// - Collection: "quizverse"
// - Key: "wallet:{device_id}:{game_id}"
//
// Security Features (PR #6):
// - Amount validation (reject negative for credits)
// - Atomic transfers with rollback
// - Transaction logging
// - Version-based optimistic locking
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * GAME WALLET MODULE - Function Index
 * 
 * RPC Handlers:
 * - createOrGetWallet: ~line 12419 (also registered ~line 22065)
 * - rpcWalletUpdateGameWallet: ~line 8210 (registered ~line 21937)
 * - rpcWalletTransferBetweenGameWallets: ~line 8274 (registered ~line 21951)
 * - rpcCreatePlayerWallet: ~line 13807 (registered ~line 22096)
 * - rpcUpdateWalletBalance: ~line (registered ~line 22098)
 * - rpcGetWalletBalance: ~line 13854 (registered ~line 22100)
 * 
 * Helper Functions:
 * - getOrCreateGameWallet: ~line (search for function name)
 * - updateGameWalletBalance: ~line 11524
 * - atomicWalletTransfer (from Security module)
 * - secureWalletUpdate (from Security module)
 */

var GAME_SYSTEMS_GAME_WALLET_MODULE = {
    name: 'game-systems/game-wallet',
    version: '1.0.0',
    rpcs: [
        'create_or_get_wallet',
        'wallet_update_game_wallet',
        'wallet_transfer_between_game_wallets',
        'create_player_wallet',
        'update_wallet_balance',
        'get_wallet_balance'
    ],
    scope: 'GAME_SPECIFIC',
    isolationKey: 'game_id',
    description: 'Per-game currency management'
};

if (typeof globalThis !== 'undefined') {
    globalThis.GameSystemsModules = globalThis.GameSystemsModules || {};
    globalThis.GameSystemsModules.GameWallet = GAME_SYSTEMS_GAME_WALLET_MODULE;
}

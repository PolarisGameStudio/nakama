// ============================================================================
// PLAYER CORE: NOTIFICATIONS MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles push notifications across all games.
// Part of PLAYER CORE - cross-game player data.
//
// RPCs in this module:
// - get_notifications: Get player notifications
// - push_register_token: Register push notification token
// - push_send_event: Send push notification
// - push_get_endpoints: Get push endpoints
//
// Notification Types:
// - FRIEND_REQUEST: Friend invite received
// - FRIEND_ACCEPTED: Friend request accepted
// - DAILY_REWARD: Daily reward available
// - TOURNAMENT_START: Tournament starting
// - WINBACK: Return to game reminder
// - CUSTOM: Game-specific notifications
//
// Storage Patterns:
// - Collection: "push_tokens"
// - Key: "token:{user_id}:{device_type}"
// - Also uses Nakama's built-in notification API
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * NOTIFICATIONS MODULE - Function Index
 * 
 * RPC Handlers (registered in InitModule ~line 22041-22045):
 * - rpcPushRegisterToken
 * - rpcPushSendEvent
 * - rpcPushGetEndpoints
 * 
 * Also from copilot/social_features.js:
 * - rpcGetNotifications: ~line 13493
 */

var PLAYER_CORE_NOTIFICATIONS_MODULE = {
    name: 'player-core/notifications',
    version: '1.0.0',
    rpcs: [
        'get_notifications',
        'push_register_token',
        'push_send_event',
        'push_get_endpoints'
    ],
    description: 'Push notifications (cross-game)'
};

if (typeof globalThis !== 'undefined') {
    globalThis.PlayerCoreModules = globalThis.PlayerCoreModules || {};
    globalThis.PlayerCoreModules.Notifications = PLAYER_CORE_NOTIFICATIONS_MODULE;
}
